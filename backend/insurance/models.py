from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from investments.models import Investment
from accounts.models import CustomUser
from decimal import Decimal


class InsurancePolicy(models.Model):
    """
    Insurance policy for an investment
    Coverage up to $5,000 if investment drops below 60% of original value
    """
    STATUS_CHOICES = [
        ('active', _('Active')),
        ('expired', _('Expired')),
        ('claimed', _('Claimed')),
    ]
    
    investment = models.OneToOneField(
        'investments.Investment',
        on_delete=models.CASCADE,
        related_name='insurance_policy'
    )
    user = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.CASCADE,
        related_name='insurance_policies'
    )
    premium_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text=_('Amount paid for the insurance premium')
    )
    coverage_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text=_('Maximum coverage amount (up to $5,000)')
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        help_text=_('When the insurance policy expires')
    )
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Insurance for {self.investment.id} - {self.get_status_display()}"
    
    def calculate_coverage_amount(self):
        """Calculate the coverage amount (up to $5,000)"""
        investment_amount = self.investment.amount
        return min(investment_amount, Decimal('5000.00'))
    
    def is_eligible_for_claim(self):
        """
        Check if the policy is eligible for a claim
        - Status must be active
        - Policy must not be expired
        - Investment must have lost more than 40% of its value
        """
        if self.status != 'active':
            return False
            
        if timezone.now() > self.expires_at:
            return False
            
        # Check if investment has lost more than 40% of its value
        investment_amount = self.investment.amount
        current_value = self.investment.current_value
        
        if current_value <= (investment_amount * Decimal('0.6')):
            return True
            
        return False
    
    def calculate_payout_amount(self):
        """Calculate the payout amount for a claim"""
        if not self.is_eligible_for_claim():
            return Decimal('0.00')
            
        investment_amount = self.investment.amount
        current_value = self.investment.current_value
        loss_amount = investment_amount - current_value
        
        # Payout is the lesser of the loss amount or the coverage amount
        return min(loss_amount, self.coverage_amount)


class InsuranceClaim(models.Model):
    """
    Insurance claim for a policy
    """
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('approved', _('Approved')),
        ('rejected', _('Rejected')),
        ('paid', _('Paid')),
    ]
    
    policy = models.ForeignKey(
        InsurancePolicy,
        on_delete=models.CASCADE,
        related_name='claims'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    amount_claimed = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text=_('Amount claimed')
    )
    amount_paid = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Amount actually paid')
    )
    rejection_reason = models.TextField(
        null=True,
        blank=True,
        help_text=_('Reason for rejection if applicable')
    )
    
    def __str__(self):
        return f"Claim for {self.policy.investment.id} - {self.get_status_display()}"
    
    def process_claim(self):
        """Process the claim and update status"""
        if self.status != 'pending':
            return False
            
        policy = self.policy
        
        # Check if policy is eligible for claim
        if not policy.is_eligible_for_claim():
            self.status = 'rejected'
            self.rejection_reason = 'Policy is not eligible for claim'
            self.processed_at = timezone.now()
            self.save()
            return False
            
        # Calculate payout amount
        payout_amount = policy.calculate_payout_amount()
        
        if payout_amount <= 0:
            self.status = 'rejected'
            self.rejection_reason = 'No payout amount calculated'
            self.processed_at = timezone.now()
            self.save()
            return False
            
        # Update claim
        self.status = 'approved'
        self.amount_paid = payout_amount
        self.processed_at = timezone.now()
        self.save()
        
        # Update policy
        policy.status = 'claimed'
        policy.save()
        
        return True
    
    def pay_claim(self):
        """
        Pay the approved claim to the user's account
        """
        if self.status != 'approved':
            return False
            
        # Add credits to user's account
        user = self.policy.user
        user.add_credits(self.amount_paid)
        
        # Update claim status
        self.status = 'paid'
        self.save()
        
        return True 