from django.shortcuts import render, get_object_or_404
from django.db.models import Count
from django.utils import timezone
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import VotingSession, Vote, VotingResult
from .serializers import (
    VotingSessionSerializer, 
    VoteSerializer, 
    VotingResultSerializer,
    VoteCountSerializer,
    UserVoteSummarySerializer
)
from companies.models import Company
from indexes.models import Index
from investments.models import Investment


class VotingSessionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for voting sessions
    """
    queryset = VotingSession.objects.all()
    serializer_class = VotingSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter sessions based on query parameters"""
        queryset = VotingSession.objects.all()
        
        # Filter by index
        index_id = self.request.query_params.get('index')
        if index_id:
            queryset = queryset.filter(index_id=index_id)
        
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by active
        is_active = self.request.query_params.get('is_active')
        if is_active:
            now = timezone.now()
            if is_active.lower() == 'true':
                queryset = queryset.filter(
                    status='active',
                    start_date__lte=now,
                    end_date__gte=now
                )
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a voting session"""
        session = self.get_object()
        
        if session.activate():
            serializer = self.get_serializer(session)
            return Response(serializer.data)
        
        return Response(
            {"error": "Cannot activate this session."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete a voting session and calculate results"""
        session = self.get_object()
        
        if session.complete():
            # Return results
            results = VotingResult.objects.filter(session=session).order_by('rank')
            result_serializer = VotingResultSerializer(results, many=True)
            
            return Response({
                "message": "Voting session completed successfully.",
                "results": result_serializer.data
            })
        
        return Response(
            {"error": "Cannot complete this session."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """Get results for a completed voting session"""
        session = self.get_object()
        
        if session.status != 'completed':
            # For active or pending sessions, provide current vote counts
            if session.status == 'active':
                vote_counts = Vote.objects.filter(session=session) \
                    .values('company') \
                    .annotate(vote_count=Count('id')) \
                    .order_by('-vote_count')
                
                serializer = VoteCountSerializer(vote_counts, many=True)
                return Response({
                    "status": "active",
                    "interim_results": serializer.data
                })
            
            return Response(
                {"error": "Results are only available for completed sessions."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = VotingResult.objects.filter(session=session).order_by('rank')
        serializer = VotingResultSerializer(results, many=True)
        
        return Response({
            "status": "completed",
            "results": serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def user_votes(self, request, pk=None):
        """Get current user's votes for this session"""
        session = self.get_object()
        user = request.user
        
        votes = Vote.objects.filter(session=session, user=user)
        votes_cast = votes.count()
        companies_voted = list(votes.values_list('company_id', flat=True))
        
        votes_remaining = max(0, session.max_votes_allowed - votes_cast)
        
        data = {
            'session_id': session.id,
            'votes_cast': votes_cast,
            'votes_remaining': votes_remaining,
            'companies_voted': companies_voted
        }
        
        serializer = UserVoteSummarySerializer(data)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def companies(self, request, pk=None):
        """Get companies available for voting in this session"""
        session = self.get_object()
        
        # Get companies that are part of the index
        companies = session.index.companies.all()
        
        # For each company, check if user has already voted for it
        user = request.user
        user_votes = Vote.objects.filter(
            session=session,
            user=user
        ).values_list('company_id', flat=True)
        
        companies_data = [{
            'id': company.id,
            'name': company.name,
            'symbol': company.symbol,
            'sector': company.sector,
            'current_price': company.current_price,
            'market_cap': company.market_cap,
            'already_voted': company.id in user_votes
        } for company in companies]
        
        return Response(companies_data)


class VoteViewSet(mixins.CreateModelMixin,
                  mixins.DestroyModelMixin,
                  mixins.ListModelMixin,
                  mixins.RetrieveModelMixin,
                  viewsets.GenericViewSet):
    """
    API endpoint for votes
    """
    queryset = Vote.objects.all()
    serializer_class = VoteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter votes based on query parameters"""
        queryset = Vote.objects.all()
        
        # Regular users can only see their own votes
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        
        # Filter by session
        session_id = self.request.query_params.get('session')
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        # Filter by user
        user_id = self.request.query_params.get('user')
        if user_id and self.request.user.is_staff:  # Only staff can filter by user
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by company
        company_id = self.request.query_params.get('company')
        if company_id:
            queryset = queryset.filter(company_id=company_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Override create to ensure user is set correctly"""
        serializer.save(user=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to check if vote can be removed"""
        vote = self.get_object()
        
        # Only allow deletion if session is still active and user owns the vote
        if vote.user != request.user:
            return Response(
                {"error": "You cannot delete votes from other users."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not vote.session.is_active:
            return Response(
                {"error": "Votes cannot be removed after the voting session has ended."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().destroy(request, *args, **kwargs)


class VotingResultViewSet(mixins.ListModelMixin,
                       mixins.RetrieveModelMixin,
                       viewsets.GenericViewSet):
    """
    API endpoint for voting results
    """
    queryset = VotingResult.objects.all()
    serializer_class = VotingResultSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter results based on query parameters"""
        queryset = VotingResult.objects.all()
        
        # Filter by session
        session_id = self.request.query_params.get('session')
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        # Filter by company
        company_id = self.request.query_params.get('company')
        if company_id:
            queryset = queryset.filter(company_id=company_id)
        
        # Filter by rank (top N)
        top_n = self.request.query_params.get('top')
        if top_n and top_n.isdigit():
            queryset = queryset.filter(rank__lte=int(top_n))
        
        return queryset.order_by('session', 'rank')
