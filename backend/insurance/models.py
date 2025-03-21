from django.db import models
from django.conf import settings
from decimal import Decimal
from django.core.validators import MinValueValidator, MaxValueValidator
from indexes.models import Index

# Create your models here.

class InsurancePolicy(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='insurance_policies')
    index = models.ForeignKey(Index, on_delete=models.CASCADE, related_name='insurance_policies')
    initial_investment_amount = models.DecimalField(
        max_digits=20, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('5000.00'))]
    )
    coverage_amount = models.DecimalField(
        max_digits=20, 
        decimal_places=2,
        default=Decimal('5000.00'),
        help_text="Maximum coverage amount is 5000 credits"
    )
    monthly_premium = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('500.00')
    )
    risk_factor = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=Decimal('1.00'),
        validators=[MinValueValidator(Decimal('0.1')), MaxValueValidator(Decimal('10.0'))]
    )
    trigger_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('50.00'),
        help_text="Percentage of initial investment below which insurance pays out",
        validators=[MinValueValidator(Decimal('1')), MaxValueValidator(Decimal('99'))]
    )
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    has_claim = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Insurance Policy"
        verbose_name_plural = "Insurance Policies"

    def __str__(self):
        return f"Insurance Policy for {self.user.username} - Index: {self.index.name}"

    def calculate_premium(self):
        return self.monthly_premium * self.risk_factor

    def calculate_payout_amount(self, current_value):
        """
        Calculate insurance payout based on current value and initial investment.
        Returns the lesser of:
        1. The maximum coverage amount (5000 credits)
        2. The difference between trigger value and current value
        """
        trigger_value = self.initial_investment_amount * (self.trigger_percentage / Decimal('100'))
        if current_value >= trigger_value:
            return Decimal('0')
        
        loss_amount = trigger_value - current_value
        return min(loss_amount, self.coverage_amount)

class CoveragePayment(models.Model):
    policy = models.ForeignKey(InsurancePolicy, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    payment_status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ], default='pending')
    transaction_id = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f"Payment for {self.policy} - {self.amount}"

class Claim(models.Model):
    policy = models.ForeignKey(InsurancePolicy, on_delete=models.CASCADE, related_name='claims')
    current_investment_value = models.DecimalField(max_digits=20, decimal_places=2)
    claim_amount = models.DecimalField(max_digits=20, decimal_places=2)
    submission_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('paid', 'Paid')
    ], default='pending')
    processed_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-submission_date']

    def __str__(self):
        return f"Claim for {self.policy} - {self.claim_amount}"

    def is_eligible(self):
        trigger_value = self.policy.initial_investment_amount * (self.policy.trigger_percentage / Decimal('100'))
        return self.current_investment_value < trigger_value
