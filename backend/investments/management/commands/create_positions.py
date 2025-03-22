from django.core.management.base import BaseCommand
from investments.models import Investment
from django.db import transaction
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Create default positions for investments that do not have any positions'

    def handle(self, *args, **options):
        # Get all active investments without positions
        active_investments = Investment.objects.filter(status='ACTIVE')
        empty_investments = []
        
        for investment in active_investments:
            if not investment.positions.exists():
                empty_investments.append(investment)
        
        self.stdout.write(f"Found {len(empty_investments)} investments without positions")
        
        # Create positions for each empty investment
        created_count = 0
        for investment in empty_investments:
            with transaction.atomic():
                try:
                    if investment.create_default_positions():
                        created_count += 1
                        self.stdout.write(f"Created positions for investment {investment.id}")
                    else:
                        self.stdout.write(f"Could not create positions for investment {investment.id}")
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error creating positions for investment {investment.id}: {str(e)}"))
        
        self.stdout.write(self.style.SUCCESS(f"Successfully created positions for {created_count} investments")) 