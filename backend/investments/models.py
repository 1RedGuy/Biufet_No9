from django.db import models
from django.conf import settings
from decimal import Decimal
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from indexes.models import Index
from companies.models import Company
from django.db import transaction
from rest_framework import serializers
import uuid

class Investment(models.Model):
    STATUS_CHOICES = [
        ('PENDING', _('Pending')),
        ('ACTIVE', _('Active')),
        ('VOTED', _('Voted')),
        ('LOCKED', _('Locked')),
        ('COMPLETED', _('Completed')),
        ('WITHDRAWN', _('Withdrawn')),
        ('FAILED', _('Failed'))
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='investments',
        verbose_name=_('User')
    )
    index = models.ForeignKey(
        Index, 
        on_delete=models.CASCADE, 
        related_name='investments',
        verbose_name=_('Index')
    )
    amount = models.DecimalField(
        max_digits=20, 
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
        help_text=_("Initial investment amount"),
        verbose_name=_('Investment Amount')
    )
    current_value = models.DecimalField(
        max_digits=20, 
        decimal_places=2,
        help_text=_("Current value of the investment"),
        verbose_name=_('Current Value'),
        null=True,
        blank=True
    )
    profit_loss = models.DecimalField(
        max_digits=20, 
        decimal_places=2,
        help_text=_("Profit or loss from this investment"),
        verbose_name=_('Profit/Loss'),
        default=Decimal('0.00')
    )
    profit_loss_percentage = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        help_text=_("Profit/Loss as a percentage"),
        verbose_name=_('Profit/Loss Percentage')
    )
    investment_date = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Investment Date')
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='ACTIVE',
        help_text=_("Current status of the investment"),
        verbose_name=_('Status')
    )
    has_voted = models.BooleanField(
        default=False,
        help_text=_("Indicates if this investment has been used for voting"),
        verbose_name=_('Has Voted')
    )
    transaction_id = models.CharField(
        max_length=255, 
        unique=True,
        help_text=_("Unique identifier for the investment"),
        verbose_name=_('Transaction ID'),
        default=uuid.uuid4
    )
    withdrawal_eligible = models.BooleanField(
        default=False,
        help_text=_("Whether the investment can be withdrawn"),
        verbose_name=_('Withdrawal Eligible')
    )
    lock_period_end = models.DateTimeField(
        help_text=_("Date when the investment can be withdrawn"),
        verbose_name=_('Lock Period End'),
        null=True,
        blank=True
    )
    last_updated = models.DateTimeField(
        auto_now=True,
        verbose_name=_('Last Updated')
    )

    class Meta:
        ordering = ['-investment_date']
        verbose_name = _('Investment')
        verbose_name_plural = _('Investments')
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'lock_period_end']),
        ]

    def __str__(self):
        return f"{self.user.username}'s Investment in {self.index.name} - {self.amount}"

    @transaction.atomic
    def process_investment_credits(self):
        """Process credits for a new investment"""
        if not self.user.deduct_credits(self.amount):
            raise serializers.ValidationError(_("Insufficient credits for investment"))
        self.status = 'ACTIVE'
        self.current_value = self.amount  # Initially set current value to invested amount
        self.save()
        return True

    @transaction.atomic
    def process_withdrawal_credits(self):
        """Process credits when withdrawing an investment"""
        if not self.is_withdrawal_eligible():
            raise serializers.ValidationError(_("Investment is not eligible for withdrawal"))
        
        self.user.add_credits(self.current_value)
        self.status = 'WITHDRAWN'
        self.save()
        return True

    def calculate_profit_loss(self):
        """Calculate current profit/loss and percentage"""
        if self.current_value and self.amount:
            self.profit_loss = self.current_value - self.amount
            if self.amount > 0:
                self.profit_loss_percentage = (self.profit_loss / self.amount) * 100
            return self.profit_loss
        return Decimal('0.00')

    def update_current_value(self):
        """Update current value based on index performance"""
        positions = self.positions.all()
        if not positions.exists():
            return self.amount
            
        total_value = sum(
            position.calculate_current_value() 
            for position in positions
        )
        
        # If total_value is 0, use the original amount
        self.current_value = total_value if total_value > 0 else self.amount
        self.calculate_profit_loss()
        self.save()
        return self.current_value

    def is_withdrawal_eligible(self):
        """Check if investment can be withdrawn"""
        return (
            self.status == 'ACTIVE' and 
            self.lock_period_end and
            timezone.now() >= self.lock_period_end
        )

    def create_default_positions(self):
        """Create default positions for the investment based on the index companies"""
        if self.positions.exists():
            return False  # Already has positions
            
        companies = self.index.companies.all()
        if not companies:
            return False  # No companies in index
            
        # Calculate equal weight for each company
        weight = Decimal(100) / Decimal(companies.count())
        weight = weight.quantize(Decimal('0.01'))
        
        # Adjust the last one to make sure we get exactly 100%
        total_weight = weight * (companies.count() - 1)
        last_weight = Decimal(100) - total_weight
        
        for i, company in enumerate(companies):
            # For the last company, use adjusted weight
            current_weight = last_weight if i == companies.count() - 1 else weight
            
            # Calculate amount allocated to this company
            amount = (self.amount * current_weight) / Decimal(100)
            
            # Calculate quantity based on current price
            quantity = Decimal(0)
            if company.current_price and company.current_price > 0:
                quantity = amount / company.current_price
            
            # Create the position
            InvestmentPosition.objects.create(
                investment=self,
                company=company,
                amount=amount,
                quantity=quantity,
                purchase_price=company.current_price or Decimal(0),
                current_price=company.current_price or Decimal(0),
                weight=current_weight
            )
        
        # Update investment values
        self.update_current_value()
        return True

class InvestmentPosition(models.Model):
    investment = models.ForeignKey(
        Investment, 
        on_delete=models.CASCADE,
        related_name='positions',
        verbose_name=_('Investment')
    )
    company = models.ForeignKey(
        Company, 
        on_delete=models.CASCADE,
        related_name='investment_positions',
        verbose_name=_('Company')
    )
    amount = models.DecimalField(
        max_digits=20, 
        decimal_places=2,
        help_text=_("Amount allocated to this company"),
        verbose_name=_('Amount')
    )
    quantity = models.DecimalField(
        max_digits=20, 
        decimal_places=8,
        help_text=_("Number of shares/units"),
        verbose_name=_('Quantity')
    )
    purchase_price = models.DecimalField(
        max_digits=20, 
        decimal_places=2,
        help_text=_("Price at time of purchase"),
        verbose_name=_('Purchase Price')
    )
    current_price = models.DecimalField(
        max_digits=20, 
        decimal_places=2,
        help_text=_("Current market price"),
        verbose_name=_('Current Price')
    )
    weight = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        help_text=_("Percentage of total investment"),
        verbose_name=_('Weight')
    )
    last_updated = models.DateTimeField(
        auto_now=True,
        verbose_name=_('Last Updated')
    )

    class Meta:
        unique_together = ('investment', 'company')
        ordering = ['-weight']
        verbose_name = _('Investment Position')
        verbose_name_plural = _('Investment Positions')
        indexes = [
            models.Index(fields=['investment', 'company']),
        ]

    def __str__(self):
        return f"{self.investment} - {self.company.symbol} ({self.weight}%)"

    def calculate_current_value(self):
        """Calculate current value of this position"""
        return self.quantity * self.current_price

    def calculate_profit_loss(self):
        """Calculate profit/loss for this position"""
        current_value = self.calculate_current_value()
        initial_value = self.quantity * self.purchase_price
        return current_value - initial_value

    def calculate_profit_loss_percentage(self):
        """Calculate profit/loss percentage for this position"""
        if self.purchase_price > 0:
            return ((self.current_price - self.purchase_price) / self.purchase_price) * 100
        return Decimal('0.00')
