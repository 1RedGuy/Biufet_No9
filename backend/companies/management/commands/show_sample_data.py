from django.core.management.base import BaseCommand
from companies.models import Company
from django.utils.timezone import localtime

class Command(BaseCommand):
    help = 'Display sample data from the companies table'

    def handle(self, *args, **options):
        # Get 20 random companies
        companies = Company.objects.order_by('?')[:20]
        
        self.stdout.write(self.style.SUCCESS(f'Displaying 20 random companies from the database:\n'))
        
        for idx, company in enumerate(companies, 1):
            self.stdout.write(self.style.SUCCESS('=' * 80))
            self.stdout.write(f'{idx}. Company Details:')
            self.stdout.write(f'   Name: {company.name}')
            self.stdout.write(f'   Symbol: {company.symbol}')
            self.stdout.write(f'   Current Price: {company.current_price if company.current_price is not None else "Not available"}')
            self.stdout.write(f'   Market Cap: {company.market_cap if company.market_cap is not None else "Not available"}')
            self.stdout.write(f'   Is Active: {company.is_active}')
            self.stdout.write(f'   Created: {localtime(company.created_at).strftime("%Y-%m-%d %H:%M:%S")}')
            self.stdout.write(f'   Last Updated: {localtime(company.updated_at).strftime("%Y-%m-%d %H:%M:%S")}')
        
        # Also show some statistics
        total_companies = Company.objects.count()
        companies_with_price = Company.objects.exclude(current_price__isnull=True).count()
        companies_with_market_cap = Company.objects.exclude(market_cap__isnull=True).count()
        
        self.stdout.write(self.style.SUCCESS('\nDatabase Statistics:'))
        self.stdout.write(f'Total companies: {total_companies}')
        self.stdout.write(f'Companies with price data: {companies_with_price}')
        self.stdout.write(f'Companies with market cap: {companies_with_market_cap}') 