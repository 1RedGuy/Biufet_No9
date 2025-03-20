from django.db import models
from django.conf import settings
from decimal import Decimal
from indexes.models import Index
from companies.models import Company

class Investment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='investments')
    index = models.ForeignKey(Index, on_delete=models.CASCADE, related_name='investments')
    amount = models.DecimalField(max_digits=20, decimal_places=2)
    current_value = models.DecimalField(max_digits=20, decimal_places=2)
    profit_loss = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0.00'))
    investment_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('COMPLETED', 'Completed'),
            ('FAILED', 'Failed'),
            ('WITHDRAWN', 'Withdrawn')
        ],
        default='PENDING'
    )
    transaction_id = models.CharField(max_length=255, unique=True)
    withdrawal_eligible = models.BooleanField(default=False)
    lock_period_end = models.DateTimeField()

    def __str__(self):
        return f"{self.user.username}'s Investment in {self.index.name} - {self.amount}"

    def calculate_profit_loss(self):
        """Calculate current profit/loss"""
        if self.current_value and self.amount:
            self.profit_loss = self.current_value - self.amount
            return self.profit_loss
        return Decimal('0.00')

    def update_current_value(self):
        """Update current value based on index performance"""
        # This would be updated based on index performance calculation
        # For now, we'll just keep it same as investment amount
        self.current_value = self.amount
        self.calculate_profit_loss()
        self.save()

class InvestmentCompany(models.Model):
    investment = models.ForeignKey(Investment, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    quantity = models.DecimalField(max_digits=20, decimal_places=8)
    binance_order_id = models.CharField(max_length=255, blank=True)
    purchase_price = models.DecimalField(max_digits=20, decimal_places=8)
    current_price = models.DecimalField(max_digits=20, decimal_places=8)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('investment', 'company')

    def __str__(self):
        return f"{self.investment} - {self.company.symbol}"

    def calculate_current_value(self):
        """Calculate current value of this position"""
        return self.quantity * self.current_price
