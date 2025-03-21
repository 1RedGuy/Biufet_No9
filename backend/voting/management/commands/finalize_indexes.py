from django.core.management.base import BaseCommand
from voting.models import VotingSession
from voting.services import finalize_index_based_on_votes


class Command(BaseCommand):
    help = 'Finalize indexes based on completed voting sessions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--session-id',
            type=int,
            help='Specific voting session ID to finalize (optional)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting index finalization...'))
        
        session_id = options.get('session_id')
        finalized_count = 0
        
        if session_id:
            try:
                session = VotingSession.objects.get(id=session_id, status='completed')
                if finalize_index_based_on_votes(session.index_id):
                    finalized_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'Finalized index {session.index_id}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Failed to finalize index {session.index_id}')
                    )
            except VotingSession.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Voting session {session_id} not found or not completed')
                )
        else:
            # Get all completed sessions
            completed_sessions = VotingSession.objects.filter(status='completed')
            
            for session in completed_sessions:
                if finalize_index_based_on_votes(session.index_id):
                    finalized_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'Finalized index {session.index_id}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Failed to finalize index {session.index_id}')
                    )
        
        self.stdout.write(
            self.style.SUCCESS(f'Index finalization complete. Finalized {finalized_count} indexes')
        ) 