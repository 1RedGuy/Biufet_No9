from django.db import models
from django.conf import settings
from decimal import Decimal
from django.utils import timezone
from indexes.models import Index
from companies.models import Company
from django.db import transaction
from rest_framework import serializers

class Investment(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('WITHDRAWN', 'Withdrawn'),
        ('FAILED', 'Failed')
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='investments'
    )
    index = models.ForeignKey(
        Index, 
        on_delete=models.CASCADE, 
        related_name='investments'
    )
    amount = models.DecimalField(
        max_digits=20, 
        decimal_places=2,
        help_text="Initial investment amount"
    )
    current_value = models.DecimalField(
        max_digits=20, 
        decimal_places=2,
        help_text="Current value of the investment"
    )
    profit_loss = models.DecimalField(
        max_digits=20, 
        decimal_places=2, 
        default=Decimal('0.00'),
        help_text="Current profit or loss"
    )
    profit_loss_percentage = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        help_text="Profit/Loss as a percentage"
    )
    investment_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    transaction_id = models.CharField(
        max_length=255, 
        unique=True,
        help_text="Unique identifier for the investment"
    )
    withdrawal_eligible = models.BooleanField(
        default=False,
        help_text="Whether the investment can be withdrawn"
    )
    lock_period_end = models.DateTimeField(
        help_text="Date when the investment can be withdrawn"
    )
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-investment_date']
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
            raise serializers.ValidationError("Insufficient credits for investment")
        self.status = 'ACTIVE'
        self.save()
        return True

    @transaction.atomic
    def process_withdrawal_credits(self):
        """Process credits when withdrawing an investment"""
        if not self.is_withdrawal_eligible():
            raise serializers.ValidationError("Investment is not eligible for withdrawal")
        
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
        total_value = sum(
            position.calculate_current_value() 
            for position in self.positions.all()
        )
        self.current_value = total_value
        self.calculate_profit_loss()
        self.save()

    def is_withdrawal_eligible(self):
        """Check if investment can be withdrawn"""
        return (
            self.status == 'ACTIVE' and 
            timezone.now() >= self.lock_period_end
        )

class InvestmentPosition(models.Model):
    investment = models.ForeignKey(
        Investment, 
        on_delete=models.CASCADE,
        related_name='positions'
    )
    company = models.ForeignKey(
        Company, 
        on_delete=models.CASCADE,
        related_name='investment_positions'
    )
    amount = models.DecimalField(
        max_digits=20, 
        decimal_places=2,
        help_text="Amount allocated to this company"
    )
    quantity = models.DecimalField(
        max_digits=20, 
        decimal_places=8,
        help_text="Number of shares/units"
    )
    purchase_price = models.DecimalField(
        max_digits=20, 
        decimal_places=2,
        help_text="Price at time of purchase"
    )
    current_price = models.DecimalField(
        max_digits=20, 
        decimal_places=2,
        help_text="Current market price"
    )
    weight = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        help_text="Percentage of total investment"
    )
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('investment', 'company')
        ordering = ['-weight']
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
