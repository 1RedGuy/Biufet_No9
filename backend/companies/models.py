from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from accounts.models import CustomUser

class Company(models.Model):
    SECTOR_CHOICES = [
        ('TECH', _('Technology')),
        ('FIN', _('Financial')),
        ('HEALTH', _('Healthcare')),
        ('CONS', _('Consumer')),
        ('IND', _('Industrial')),
        ('ENERGY', _('Energy')),
        ('MAT', _('Materials')),
        ('UTIL', _('Utilities')),
        ('REAL', _('Real Estate')),
        ('OTHER', _('Other'))
    ]

    name = models.CharField(max_length=255, verbose_name=_('Company Name'))
    symbol = models.CharField(max_length=50, unique=True, verbose_name=_('Trading Symbol'))
    sector = models.CharField(
        max_length=20,
        choices=SECTOR_CHOICES,
        default='OTHER',
        verbose_name=_('Sector')
    )
    current_price = models.DecimalField(max_digits=20, decimal_places=2, verbose_name=_('Current Price'), null=True, blank=True)
    market_cap = models.DecimalField(max_digits=20, decimal_places=2, verbose_name=_('Market Cap'), null=True, blank=True)
    is_active = models.BooleanField(default=True, verbose_name=_('Is Active'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'companies'
        verbose_name = _('Company')
        verbose_name_plural = _('Companies')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.symbol})"

class InvestmentIndex(models.Model):
    STATUS_CHOICES = [
        ('draft', _('Draft')),
        ('active', _('Active')),
        ('voting', _('Voting Period')),
        ('closed', _('Closed')),
        ('executed', _('Executed')),
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
    investment_start_date = models.DateTimeField(verbose_name=_('Investment Start Date'))
    investment_end_date = models.DateTimeField(verbose_name=_('Investment End Date'))
    voting_start_date = models.DateTimeField(verbose_name=_('Voting Start Date'))
    voting_end_date = models.DateTimeField(verbose_name=_('Voting End Date'))
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
        db_table = 'investment_indexes'
        verbose_name = _('Investment Index')
        verbose_name_plural = _('Investment Indexes')
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.min_companies > self.max_companies:
            raise ValidationError(_('Minimum companies cannot be greater than maximum companies'))
        if self.min_votes_per_user > self.max_votes_per_user:
            raise ValidationError(_('Minimum votes per user cannot be greater than maximum votes per user'))
        if self.investment_end_date <= self.investment_start_date:
            raise ValidationError(_('Investment end date must be after start date'))
        if self.voting_start_date <= self.investment_end_date:
            raise ValidationError(_('Voting start date must be after investment end date'))
        if self.voting_end_date <= self.voting_start_date:
            raise ValidationError(_('Voting end date must be after voting start date'))

class Investment(models.Model):
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('active', _('Active')),
        ('voted', _('Voted')),
        ('locked', _('Locked')),
        ('completed', _('Completed')),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, verbose_name=_('User'))
    index = models.ForeignKey(InvestmentIndex, on_delete=models.CASCADE, verbose_name=_('Investment Index'))
    amount = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
        verbose_name=_('Investment Amount')
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name=_('Status')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'investments'
        verbose_name = _('Investment')
        verbose_name_plural = _('Investments')
        ordering = ['-created_at']
        unique_together = ['user', 'index']

    def __str__(self):
        return f"{self.user.username} - {self.index.name}"

class Vote(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, verbose_name=_('User'))
    investment = models.ForeignKey(Investment, on_delete=models.CASCADE, verbose_name=_('Investment'))
    company = models.ForeignKey(Company, on_delete=models.CASCADE, verbose_name=_('Company'))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'votes'
        verbose_name = _('Vote')
        verbose_name_plural = _('Votes')
        ordering = ['-created_at']
        unique_together = ['user', 'investment', 'company']

    def __str__(self):
        return f"{self.user.username} voted for {self.company.name}"

class BinanceIntegration(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, verbose_name=_('User'))
    api_key = models.CharField(max_length=255, verbose_name=_('API Key'))
    api_secret = models.CharField(max_length=255, verbose_name=_('API Secret'))
    is_active = models.BooleanField(default=True, verbose_name=_('Is Active'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'binance_integrations'
        verbose_name = _('Binance Integration')
        verbose_name_plural = _('Binance Integrations')
        ordering = ['-created_at']

    def __str__(self):
        return f"Binance Integration for {self.user.username}"
