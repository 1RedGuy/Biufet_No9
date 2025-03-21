from django.core.management.base import BaseCommand
from django.utils import timezone
from voting.services import check_and_activate_voting_sessions, check_and_complete_voting_sessions


class Command(BaseCommand):
    help = 'Check and update voting sessions (activate or complete)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting voting session checks...'))
        
        # Check for sessions to activate
        activated = check_and_activate_voting_sessions()
        self.stdout.write(self.style.SUCCESS(f'Activated {activated} voting sessions'))
        
        # Check for sessions to complete
        completed = check_and_complete_voting_sessions()
        self.stdout.write(self.style.SUCCESS(f'Completed {completed} voting sessions'))
        
        self.stdout.write(self.style.SUCCESS('Voting session checks finished.')) 