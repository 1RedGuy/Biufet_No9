from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal


@receiver(post_save, sender='investments.Investment')
def create_insurance_opportunity(sender, instance, created, **kwargs):
    """
    When a new investment is created, we automatically provide 
    an opportunity for insurance for qualifying investments
    """
    # Import locally to avoid circular imports
    from .models import InsurancePolicy
    
    # Only process new, active investments that don't already have insurance
    if not created or instance.status != 'ACTIVE':
        return
        
    # Check if insurance already exists
    try:
        insurance = instance.insurance_policy
        # If it exists, we don't need to do anything
        return
    except InsurancePolicy.DoesNotExist:
        pass
    
    # Automatically create insurance for investments
    # We'll make it available but not automatically purchase it
    # The actual purchase will happen through the API 