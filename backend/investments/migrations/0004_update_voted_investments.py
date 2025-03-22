from django.db import migrations


def update_voted_investments(apps, schema_editor):
    """
    Update investments with VOTED status to use the new has_voted flag
    and revert their status back to ACTIVE
    """
    Investment = apps.get_model('investments', 'Investment')
    voted_investments = Investment.objects.filter(status='VOTED')
    
    for investment in voted_investments:
        investment.has_voted = True
        investment.status = 'ACTIVE'
        investment.save()


def reverse_migration(apps, schema_editor):
    """
    Revert back: set status to VOTED for investments that have has_voted=True
    """
    Investment = apps.get_model('investments', 'Investment')
    voted_investments = Investment.objects.filter(has_voted=True)
    
    for investment in voted_investments:
        investment.status = 'VOTED'
        investment.save()


class Migration(migrations.Migration):

    dependencies = [
        ('investments', '0003_investment_has_voted'),
    ]

    operations = [
        migrations.RunPython(update_voted_investments, reverse_migration),
    ] 