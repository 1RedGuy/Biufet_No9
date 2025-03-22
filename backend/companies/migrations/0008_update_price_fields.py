from django.db import migrations
from decimal import Decimal

def update_price_fields(apps, schema_editor):
    """
    Update price_change for all companies based on current_price and initial_price
    """
    Company = apps.get_model('companies', 'Company')
    
    for company in Company.objects.all():
        # Set initial price if not set
        if company.current_price and not company.initial_price:
            company.initial_price = company.current_price
            company.price_change = Decimal('0')
            company.save()
        # Calculate price change if both prices exist
        elif company.current_price and company.initial_price and company.initial_price > 0:
            company.price_change = ((company.current_price - company.initial_price) / company.initial_price) * 100
            company.save()

class Migration(migrations.Migration):

    dependencies = [
        ('companies', '0005_company_initial_price_company_price_change'),
    ]

    operations = [
        migrations.RunPython(update_price_fields, migrations.RunPython.noop),
    ] 