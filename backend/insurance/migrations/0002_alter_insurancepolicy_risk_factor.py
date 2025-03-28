# Generated by Django 5.1.7 on 2025-03-21 08:25

import django.core.validators
from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('insurance', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='insurancepolicy',
            name='risk_factor',
            field=models.DecimalField(decimal_places=2, default=Decimal('1.00'), help_text='Risk factor between 0.1 and 10.0, calculated based on various risk metrics', max_digits=5, validators=[django.core.validators.MinValueValidator(Decimal('0.1')), django.core.validators.MaxValueValidator(Decimal('10.0'))]),
        ),
    ]
