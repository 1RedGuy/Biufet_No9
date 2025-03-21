from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from companies.models import Company

class Index(models.Model):
    STATUS_CHOICES = [
        ('draft', _('Draft')),           # Initial state
        ('active', _('Active')),         # Ready for investments and voting
        ('executed', _('Executed')),     # Voting completed and investments processed
        ('archived', _('Archived')),     # No longer active
    ]

    name = models.CharField(max_length=255, verbose_name=_('Index Name'))
    description = models.TextField(verbose_name=_('Description'))
    companies = models.ManyToManyField(Company, verbose_name=_('Companies'))
    min_companies = models.IntegerField(
        default=100,
        validators=[MinValueValidator(10)],
        verbose_name=_('Minimum Companies')
    )
    max_companies = models.IntegerField(
        default=200,
        validators=[MinValueValidator(10)],
        verbose_name=_('Maximum Companies')
    )
    min_votes_per_user = models.IntegerField(
        default=10,
        validators=[MinValueValidator(1)],
        verbose_name=_('Minimum Votes per User')
    )
    max_votes_per_user = models.IntegerField(
        default=20,
        validators=[MinValueValidator(1)],
        verbose_name=_('Maximum Votes per User')
    )
    investment_start_date = models.DateTimeField(verbose_name=_('Investment Start Date'), null=True, blank=True)
    investment_end_date = models.DateTimeField(verbose_name=_('Investment End Date'), null=True, blank=True)
    voting_start_date = models.DateTimeField(verbose_name=_('Voting Start Date'), null=True, blank=True)
    voting_end_date = models.DateTimeField(verbose_name=_('Voting End Date'), null=True, blank=True)
    lock_period_months = models.IntegerField(
        default=12,
        validators=[MinValueValidator(1)],
        verbose_name=_('Lock Period (months)')
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        verbose_name=_('Status')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'indexes'
        verbose_name = _('Index')
        verbose_name_plural = _('Indexes')
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.min_companies > self.max_companies:
            raise ValidationError(_('Minimum companies cannot be greater than maximum companies'))
        if self.min_votes_per_user > self.max_votes_per_user:
            raise ValidationError(_('Minimum votes per user cannot be greater than maximum votes per user'))
        if self.investment_end_date and self.investment_start_date and self.investment_end_date <= self.investment_start_date:
            raise ValidationError(_('Investment end date must be after start date'))
        if self.voting_start_date and self.investment_end_date and self.voting_start_date <= self.investment_end_date:
            raise ValidationError(_('Voting start date must be after investment end date'))
        if self.voting_end_date and self.voting_start_date and self.voting_end_date <= self.voting_start_date:
            raise ValidationError(_('Voting end date must be after voting start date'))
        if self.companies.count() < self.min_companies:
            raise ValidationError(_('Number of companies cannot be less than minimum companies'))
        if self.companies.count() > self.max_companies:
            raise ValidationError(_('Number of companies cannot be more than maximum companies'))
