from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from decimal import Decimal

from accounts.models import CustomUser
from companies.models import Company
from indexes.models import Index
from investments.models import Investment


class Vote(models.Model):
    """
    Model to store a user's vote for a company.
    The weight is calculated based on the user's investment amount.
    """
    user = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='votes',
        verbose_name=_('User')
    )
    company = models.ForeignKey(
        Company, 
        on_delete=models.CASCADE, 
        related_name='votes',
        verbose_name=_('Company')
    )
    investment = models.ForeignKey(
        Investment, 
        on_delete=models.CASCADE, 
        related_name='votes',
        verbose_name=_('Investment')
    )
    # Existing field from the old Vote model
    session_id = models.IntegerField(null=True, blank=True)
    
    # New fields that extend the original Vote model
    index = models.ForeignKey(
        Index, 
        on_delete=models.CASCADE, 
        related_name='votes',
        verbose_name=_('Index'),
        null=True,  # Make nullable for backwards compatibility
    )
    weight = models.DecimalField(
        max_digits=20, 
        decimal_places=2,
        default=Decimal('0.00'),
        help_text=_("Vote weight based on investment amount"),
        verbose_name=_('Weight'),
        null=True,  # Make nullable for backwards compatibility
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)  # Make nullable for backwards compatibility

    class Meta:
        db_table = 'voting_vote'  # Use the correct table name
        verbose_name = _('Vote')
        verbose_name_plural = _('Votes')
        ordering = ['-created_at']
        unique_together = ['user', 'investment', 'company']  # Keep original unique constraint

    def __str__(self):
        index_name = self.index.name if self.index else "unknown index"
        return f"{self.user.username} voted for {self.company.name} in {index_name}"


class CompanyVoteCount(models.Model):
    """
    Model to store the total vote weight for each company in an index.
    This is a denormalized model for performance optimization.
    """
    index = models.ForeignKey(
        Index, 
        on_delete=models.CASCADE, 
        related_name='company_vote_counts',
        verbose_name=_('Index')
    )
    company = models.ForeignKey(
        Company, 
        on_delete=models.CASCADE, 
        related_name='vote_counts',
        verbose_name=_('Company')
    )
    total_weight = models.DecimalField(
        max_digits=20, 
        decimal_places=2,
        default=Decimal('0.00'),
        help_text=_("Total vote weight for this company"),
        verbose_name=_('Total Weight')
    )
    vote_count = models.PositiveIntegerField(
        default=0,
        help_text=_("Number of votes for this company"),
        verbose_name=_('Vote Count')
    )
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'company_vote_counts'
        verbose_name = _('Company Vote Count')
        verbose_name_plural = _('Company Vote Counts')
        ordering = ['-total_weight']
        unique_together = ['index', 'company']

    def __str__(self):
        return f"{self.company.name} in {self.index.name}: {self.total_weight} weight"

    @classmethod
    def update_vote_count(cls, index, company):
        """Update the vote count for a company in an index"""
        from django.db.models import Sum, Count
        
        # Get the total weight and count of votes for this company in this index
        votes = Vote.objects.filter(index=index, company=company)
        total_weight = votes.aggregate(total=Sum('weight'))['total'] or Decimal('0.00')
        vote_count = votes.count()
        
        # Update or create the CompanyVoteCount
        vote_count_obj, created = cls.objects.update_or_create(
            index=index,
            company=company,
            defaults={
                'total_weight': total_weight,
                'vote_count': vote_count
            }
        )
        return vote_count_obj 