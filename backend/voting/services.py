"""
Services for voting functionality
"""
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Count
from indexes.models import Index
from .models import VotingSession, Vote, VotingResult


def check_and_activate_voting_sessions():
    """
    Check for pending voting sessions that need to be activated
    Returns the number of sessions activated
    """
    now = timezone.now()
    activated_count = 0
    
    # Get pending sessions that should be activated
    pending_sessions = VotingSession.objects.filter(
        status='pending',
        start_date__lte=now
    )
    
    for session in pending_sessions:
        if session.can_be_activated and session.activate():
            activated_count += 1
    
    return activated_count


def check_and_complete_voting_sessions():
    """
    Check for active voting sessions that have ended
    Returns the number of sessions completed
    """
    now = timezone.now()
    completed_count = 0
    
    # Get active sessions that have ended
    active_sessions = VotingSession.objects.filter(
        status='active',
        end_date__lte=now
    )
    
    for session in active_sessions:
        if session.complete():
            completed_count += 1
    
    return completed_count


def finalize_index_based_on_votes(index_id):
    """
    Finalize an index based on voting results
    This will select the top N companies from voting results
    Returns True if successful, False otherwise
    """
    try:
        index = Index.objects.get(id=index_id)
        session = VotingSession.objects.get(index=index, status='completed')
    except (Index.DoesNotExist, VotingSession.DoesNotExist):
        return False
    
    # Get top voted companies up to the min_companies limit
    top_companies = VotingResult.objects.filter(
        session=session
    ).order_by('rank')[:index.min_companies]
    
    if not top_companies:
        return False
    
    # Get the company ids
    company_ids = [result.company_id for result in top_companies]
    
    # Update the index
    with transaction.atomic():
        # Clear current companies
        index.companies.clear()
        
        # Add top voted companies
        for company_id in company_ids:
            index.companies.add(company_id)
        
        # Update index status
        index.status = 'active'
        index.save()
    
    return True


def create_voting_session_for_index(index_id, start_date, end_date, 
                                  min_votes=5, max_votes=10, min_investors=3):
    """
    Create a new voting session for an index
    Returns the created session or None if failed
    """
    try:
        index = Index.objects.get(id=index_id)
    except Index.DoesNotExist:
        return None
    
    # Check if there's already a voting session for this index
    if VotingSession.objects.filter(index=index).exists():
        return None
    
    # Create the voting session
    session = VotingSession.objects.create(
        index=index,
        start_date=start_date,
        end_date=end_date,
        min_votes_required=min_votes,
        max_votes_allowed=max_votes,
        min_investors=min_investors,
        status='pending'
    )
    
    return session


def get_user_vote_eligibility(user_id, index_id):
    """
    Check if a user is eligible to vote on an index
    Returns a dict with eligibility information
    """
    try:
        index = Index.objects.get(id=index_id)
        session = VotingSession.objects.get(index=index, status='active')
        
        # Check if user has an active investment in this index
        from investments.models import Investment
        has_investment = Investment.objects.filter(
            user_id=user_id,
            index=index,
            status='ACTIVE'
        ).exists()
        
        # Get user's current votes
        user_votes = Vote.objects.filter(
            session=session,
            user_id=user_id
        )
        
        votes_cast = user_votes.count()
        votes_remaining = max(0, session.max_votes_allowed - votes_cast)
        companies_voted = list(user_votes.values_list('company_id', flat=True))
        
        return {
            'is_eligible': has_investment and session.is_active,
            'votes_cast': votes_cast,
            'votes_remaining': votes_remaining,
            'max_votes': session.max_votes_allowed,
            'min_votes': session.min_votes_required,
            'companies_voted': companies_voted,
            'session_id': session.id,
            'session_end_date': session.end_date
        }
        
    except (Index.DoesNotExist, VotingSession.DoesNotExist):
        return {
            'is_eligible': False,
            'error': 'No active voting session found for this index'
        } 