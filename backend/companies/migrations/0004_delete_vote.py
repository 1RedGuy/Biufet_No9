# Generated by Django 5.1.7 on 2025-03-21 22:11

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('companies', '0003_alter_investment_unique_together_and_more'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Vote',
        ),
    ]
