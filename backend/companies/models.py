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
