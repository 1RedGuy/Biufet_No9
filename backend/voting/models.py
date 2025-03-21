from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import transaction
from django.utils import timezone
from accounts.models import CustomUser
from companies.models import Company
from indexes.models import Index
from investments.models import Investment

class VotingSession(models.Model):
    """
    Model to track the voting sessions for indexes
    """
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('active', _('Active')),
        ('completed', _('Completed')),
        ('cancelled', _('Cancelled')),
    ]

    index = models.OneToOneField(
        Index, 
        on_delete=models.CASCADE,
        related_name='voting_session',
        verbose_name=_('Index')
    )
    start_date = models.DateTimeField(verbose_name=_('Start Date'))
    end_date = models.DateTimeField(verbose_name=_('End Date'))
    min_votes_required = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name=_('Minimum Votes Required')
    )
    max_votes_allowed = models.PositiveIntegerField(
        default=10,
        validators=[MinValueValidator(1)],
        verbose_name=_('Maximum Votes Allowed')
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name=_('Status')
    )
    min_investors = models.PositiveIntegerField(
        default=3,
        validators=[MinValueValidator(1)],
        verbose_name=_('Minimum Investors Required')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Voting Session')
        verbose_name_plural = _('Voting Sessions')
        ordering = ['-created_at']

    def __str__(self):
        return f"Voting for {self.index.name} - {self.get_status_display()}"

    @property
    def is_active(self):
        """Check if voting session is currently active"""
        now = timezone.now()
        return (
            self.status == 'active' and 
            self.start_date <= now and 
            now <= self.end_date
        )
    
    @property
    def can_be_activated(self):
        """Check if voting session can be activated"""
        return (
            self.status == 'pending' and
            self.index.status == 'active' and
            self.index.investments.filter(status='ACTIVE').count() >= self.min_investors
        )
    
    def activate(self):
        """Activate the voting session"""
        if self.can_be_activated:
            self.status = 'active'
            self.save()
            return True
        return False
    
    @property
    def total_votes(self):
        """Get total votes cast in this session"""
        return Vote.objects.filter(session=self).count()
    
    @property
    def unique_voters(self):
        """Get number of unique voters in this session"""
        return Vote.objects.filter(session=self).values('user').distinct().count()
    
    def complete(self):
        """Complete the voting session and calculate results"""
        if self.status != 'active':
            return False
        
        with transaction.atomic():
            self.status = 'completed'
            self.save()
            
            # Calculate results
            VotingResult.calculate_for_session(self)
            
            # Update the index status
            self.index.status = 'executed'
            self.index.save()
            
            # Process investments based on voting results
            self._process_investments()
            
            return True
    
    def _process_investments(self):
        """Process investments based on voting results"""
        # Get active investments for this index
        investments = Investment.objects.filter(
            index=self.index,
            status='ACTIVE'
        )
        
        if not investments.exists():
            return False
        
        # Get top voted companies based on max_votes_allowed
        top_companies = VotingResult.objects.filter(
            session=self
        ).order_by('rank')[:self.max_votes_allowed].values_list('company_id', flat=True)
        
        if not top_companies:
            return False
        
        # Calculate equal weight for each company
        company_count = len(top_companies)
        if company_count == 0:
            return False
        
        company_weight = 100 / company_count
        
        # For each investment, create positions for the top voted companies
        for investment in investments:
            # Update investment status
            investment.status = 'VOTED'
            investment.save()
            
            # Get the selected companies
            companies = Company.objects.filter(id__in=top_companies)
            
            # Create positions for each company with equal weight
            for company in companies:
                # We'll handle the actual position creation and allocation in the separate method
                position_amount = (investment.amount * company_weight) / 100
                
                # Create or update the position
                from investments.models import InvestmentPosition
                position, created = InvestmentPosition.objects.update_or_create(
                    investment=investment,
                    company=company,
                    defaults={
                        'amount': position_amount,
                        'weight': company_weight,
                        'quantity': 1,  # Placeholder for number of shares
                        'purchase_price': company.current_price or 1,  # Default to 1 if price is not available
                        'current_price': company.current_price or 1
                    }
                )
            
            # Update the investment's current value
            investment.update_current_value()
        
        return True


class Vote(models.Model):
    """
    Model to track individual votes
    """
    session = models.ForeignKey(
        VotingSession,
        on_delete=models.CASCADE,
        related_name='votes',
        verbose_name=_('Voting Session')
    )
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
        verbose_name=_('Investment'),
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Vote')
        verbose_name_plural = _('Votes')
        ordering = ['-created_at']
        unique_together = ['session', 'user', 'company']
        # Add indexes for better query performance
        indexes = [
            models.Index(fields=['session', 'user']),
            models.Index(fields=['session', 'company']),
        ]

    def __str__(self):
        return f"{self.user.username} voted for {self.company.name} in {self.session}"


class VotingResult(models.Model):
    """
    Model to store voting results
    """
    session = models.ForeignKey(
        VotingSession,
        on_delete=models.CASCADE,
        related_name='results',
        verbose_name=_('Voting Session')
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='voting_results',
        verbose_name=_('Company')
    )
    vote_count = models.PositiveIntegerField(default=0, verbose_name=_('Vote Count'))
    percentage = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0,
        verbose_name=_('Percentage of Total Votes')
    )
    rank = models.PositiveIntegerField(default=0, verbose_name=_('Rank'))
    calculated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Voting Result')
        verbose_name_plural = _('Voting Results')
        ordering = ['rank']
        unique_together = ['session', 'company']

    def __str__(self):
        return f"{self.company.name} - {self.vote_count} votes (Rank {self.rank})"

    @classmethod
    def calculate_for_session(cls, session):
        """
        Calculate and store voting results for a session
        """
        if session.status != 'completed':
            return False

        # Clear existing results
        cls.objects.filter(session=session).delete()

        # Get vote counts per company
        from django.db.models import Count
        vote_counts = Vote.objects.filter(session=session) \
            .values('company') \
            .annotate(vote_count=Count('id')) \
            .order_by('-vote_count')

        total_votes = sum(vc['vote_count'] for vc in vote_counts)
        
        if total_votes == 0:
            return False

        # Create results with rankings
        results = []
        for rank, vc in enumerate(vote_counts, 1):
            company_id = vc['company']
            count = vc['vote_count']
            percentage = (count / total_votes) * 100

            result = cls(
                session=session,
                company_id=company_id,
                vote_count=count,
                percentage=percentage,
                rank=rank
            )
            results.append(result)

        # Bulk create all results
        cls.objects.bulk_create(results)
        
        return True
