import time
import yfinance as yf
from django.core.management.base import BaseCommand
from companies.models import Company

class Command(BaseCommand):
    help = 'Update company data from Yahoo Finance'

    def clean_symbol(self, symbol):
        """Clean the symbol for Yahoo Finance API"""
        # Remove .US suffix
        symbol = symbol.replace('.US', '')
        
        # Handle preferred stock symbols
        symbol = symbol.replace('$', '-P-')
        
        # Remove special suffixes like .A, .B, etc.
        if '.' in symbol:
            symbol = symbol.split('.')[0]
            
        return symbol

    def handle(self, *args, **options):
        companies = Company.objects.all()
        total_companies = companies.count()
        updated_count = 0
        error_count = 0

        self.stdout.write(self.style.SUCCESS(f'Starting to process {total_companies} companies...'))

        # Process in batches of 50 to avoid rate limits
        batch_size = 50
        
        for batch_start in range(0, total_companies, batch_size):
            batch_end = min(batch_start + batch_size, total_companies)
            company_batch = companies[batch_start:batch_end]
            
            for company in company_batch:
                try:
                    # Clean the symbol
                    clean_symbol = self.clean_symbol(company.symbol)
                    
                    # Get stock info
                    ticker = yf.Ticker(clean_symbol)
                    
                    # Try to get current price first from fast_info
                    try:
                        if hasattr(ticker.fast_info, 'last_price'):
                            company.current_price = ticker.fast_info.last_price
                        if hasattr(ticker.fast_info, 'market_cap'):
                            company.market_cap = ticker.fast_info.market_cap
                    except Exception:
                        # If fast_info fails, try regular info
                        try:
                            info = ticker.info
                            if info.get('regularMarketPrice'):
                                company.current_price = info['regularMarketPrice']
                            if info.get('marketCap'):
                                company.market_cap = info['marketCap']
                        except Exception:
                            # If both methods fail, try to get just the price from history
                            try:
                                hist = ticker.history(period='1d')
                                if not hist.empty:
                                    company.current_price = hist['Close'].iloc[-1]
                            except Exception as e:
                                raise Exception(f"Failed to get price data: {str(e)}")
                    
                    company.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Updated {company.symbol} ({clean_symbol}): '
                            f'Price = {company.current_price}, '
                            f'Market Cap = {company.market_cap}'
                        )
                    )

                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'Error updating {company.symbol}: {str(e)}')
                    )

            # Print progress after each batch
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nProgress Report:\n'
                    f'Processed: {batch_end}/{total_companies}\n'
                    f'Successfully updated: {updated_count}\n'
                    f'Errors encountered: {error_count}\n'
                    f'Completion: {(batch_end/total_companies)*100:.2f}%\n'
                )
            )
            
            # Add delay between batches to avoid rate limits
            time.sleep(2)

        self.stdout.write(
            self.style.SUCCESS(
                f'\nFinal Summary:\n'
                f'Total companies processed: {total_companies}\n'
                f'Successfully updated: {updated_count}\n'
                f'Errors encountered: {error_count}'
            )
        ) 