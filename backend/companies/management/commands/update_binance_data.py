import time
import re
from django.core.management.base import BaseCommand
from binance.client import Client
from binance.exceptions import BinanceAPIException
from companies.models import Company

class Command(BaseCommand):
    help = 'Update company data from Binance'

    # Known cryptocurrency symbols
    CRYPTO_SYMBOLS = {
        'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'DOGE', 'SOL', 'TRX', 'DOT', 'MATIC',
        'LTC', 'AVAX', 'LINK', 'XLM', 'UNI', 'ATOM', 'ETC', 'FIL', 'VET', 'NEAR',
        'ALGO', 'APE', 'AXS', 'FTM', 'SAND', 'MANA', 'AAVE', 'EGLD', 'EOS', 'THETA',
        'XMR', 'CRO', 'WAVES', 'ZEC', 'MKR', 'ENJ', 'DASH', 'CHZ', 'BAT', 'HOT',
        'NEO', 'IOTA', 'ZIL', 'COMP', 'QTUM', 'ICX', 'ONT', 'ZRX', 'IOST', 'OMG'
    }

    def is_likely_crypto(self, symbol):
        """Check if a symbol is likely to be a cryptocurrency."""
        # Remove any special characters and convert to uppercase
        clean_symbol = re.sub(r'[^\w\s-]', '', symbol).upper()
        
        # Check if it's in our known crypto list
        if clean_symbol in self.CRYPTO_SYMBOLS:
            return True
            
        # Skip symbols that look like stock tickers (common patterns)
        if re.match(r'^[A-Z]{1,4}\.[A-Z]$', symbol):  # e.g., BRK.A
            return False
        if re.match(r'^[A-Z]{1,4}\$[A-Z]$', symbol):  # e.g., BAC$A
            return False
        if re.match(r'^[A-Z]{2,4}$', symbol) and symbol not in self.CRYPTO_SYMBOLS:  # Common stock pattern
            return False
            
        return False

    def get_symbol_variants(self, base_symbol):
        """Generate different variants of the symbol for crypto pairs."""
        variants = []
        
        # Clean the base symbol
        clean_symbol = re.sub(r'[^\w\s-]', '', base_symbol).upper()
        
        # Common trading pairs
        pairs = ['USDT', 'BUSD', 'BTC', 'ETH']
        
        # Add pairs
        for pair in pairs:
            variants.append(f"{clean_symbol}{pair}")
        
        return list(filter(None, set(variants)))

    def handle(self, *args, **options):
        client = Client()
        companies = Company.objects.all()
        total_companies = companies.count()
        updated_count = 0
        skipped_count = 0
        error_count = 0

        # Get all trading pairs from Binance
        try:
            exchange_info = client.get_exchange_info()
            valid_symbols = {symbol['symbol'] for symbol in exchange_info['symbols']}
            self.stdout.write(self.style.SUCCESS(f'Fetched {len(valid_symbols)} trading pairs from Binance'))
            self.stdout.write(self.style.SUCCESS(f'Starting to process {total_companies} companies...'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to fetch trading pairs: {str(e)}'))
            return

        for idx, company in enumerate(companies, 1):
            try:
                # Print progress every 100 companies
                if idx % 100 == 0:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'\nProgress Report (Company {idx}/{total_companies}):\n'
                            f'Successfully updated: {updated_count}\n'
                            f'Skipped (not crypto): {skipped_count}\n'
                            f'Errors encountered: {error_count}\n'
                            f'Completion: {(idx/total_companies)*100:.2f}%\n'
                        )
                    )

                # Check if this is likely a cryptocurrency
                if not self.is_likely_crypto(company.symbol):
                    skipped_count += 1
                    continue

                # Add delay to respect rate limits
                time.sleep(0.1)  # 100ms delay between requests
                
                # Get possible trading pairs
                symbol_variants = self.get_symbol_variants(company.symbol)
                
                found = False
                for symbol in symbol_variants:
                    if symbol in valid_symbols:
                        try:
                            # Get ticker info
                            ticker = client.get_ticker(symbol=symbol)
                            
                            # Update company data
                            price = float(ticker['lastPrice'])
                            
                            # If the price is in BTC, convert it to USD (approximate)
                            if symbol.endswith('BTC'):
                                btc_price = float(client.get_ticker(symbol='BTCUSDT')['lastPrice'])
                                price = price * btc_price
                            
                            company.current_price = price
                            company.market_cap = None  # Market cap not directly available from Binance
                            company.save()
                            
                            updated_count += 1
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f'Updated {company.symbol} using {symbol}: '
                                    f'Price = {company.current_price}'
                                )
                            )
                            found = True
                            break
                        
                        except BinanceAPIException as e:
                            self.stdout.write(
                                self.style.WARNING(f'Binance API error for {symbol}: {str(e)}')
                            )
                            continue
                
                if not found:
                    self.stdout.write(
                        self.style.WARNING(
                            f'No valid trading pair found for crypto {company.symbol}'
                        )
                    )

            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(f'Error updating {company.symbol}: {str(e)}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nFinal Summary:\n'
                f'Total companies processed: {total_companies}\n'
                f'Successfully updated: {updated_count}\n'
                f'Skipped (not crypto): {skipped_count}\n'
                f'Errors encountered: {error_count}'
            )
        ) 