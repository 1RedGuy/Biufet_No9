import csv
from django.core.management.base import BaseCommand
from companies.models import Company

class Command(BaseCommand):
    help = 'Import companies from CSV file'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the CSV file')

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        companies_created = 0
        companies_updated = 0

        try:
            with open(csv_file, 'r') as file:
                csv_reader = csv.DictReader(file)
                for row in csv_reader:
                    try:
                        company, created = Company.objects.update_or_create(
                            symbol=row['ACT Symbol'],
                            defaults={
                                'name': row['Company Name'],
                                'current_price': None,  # Will be updated later with Binance data
                                'market_cap': None,  # Will be updated later with Binance data
                            }
                        )

                        if created:
                            companies_created += 1
                        else:
                            companies_updated += 1

                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'Error processing row: {row["ACT Symbol"]} - {str(e)}')
                        )

            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully imported companies. Created: {companies_created}, Updated: {companies_updated}'
                )
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error reading CSV file: {str(e)}')
            ) 