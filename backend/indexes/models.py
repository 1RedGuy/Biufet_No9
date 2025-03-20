from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from companies.models import Company

class Index(models.Model):
    STATUS_CHOICES = [
        ('draft', _('Draft')),
        ('active', _('Active')),
        ('archived', _('Archived')),
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
        if self.companies.count() < self.min_companies:
            raise ValidationError(_('Number of companies cannot be less than minimum companies'))
        if self.companies.count() > self.max_companies:
            raise ValidationError(_('Number of companies cannot be more than maximum companies'))
