# Generated by Django 5.1.7 on 2025-03-21 23:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('investments', '0002_alter_investment_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='investment',
            name='has_voted',
            field=models.BooleanField(default=False, help_text='Whether this investment has been used for voting', verbose_name='Has Voted'),
        ),
    ]
