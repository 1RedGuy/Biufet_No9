from rest_framework import viewsets, permissions, status, generics, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Sum, Count
from django.shortcuts import get_object_or_404

from .models import Vote, CompanyVoteCount
from .serializers import VoteSerializer, CompanyVoteCountSerializer, CreateVoteSerializer
from indexes.models import Index


class VoteViewSet(viewsets.ModelViewSet):
    serializer_class = VoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Only return votes created by the current user"""
        return Vote.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Ensure vote is associated with current user"""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def submit_votes(self, request):
        """
        Submit votes for companies in an index.
        Requires index_id, company_ids, and investment_id.
        The investment must belong to the current user.
        """
        serializer = CreateVoteSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        votes = serializer.save()
        
        return Response({
            'status': 'success',
            'message': f'Successfully voted for {len(votes)} companies',
            'votes_count': len(votes)
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def my_votes(self, request):
        """Get all votes by the current user for a specific index"""
        index_id = request.query_params.get('index_id')
        if not index_id:
            return Response({
                'error': 'index_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        votes = Vote.objects.filter(user=request.user, index_id=index_id)
        serializer = VoteSerializer(votes, many=True)
        return Response(serializer.data)


class CompanyVoteCountViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Readonly viewset for company vote counts.
    """
    serializer_class = CompanyVoteCountSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['total_weight', 'vote_count']
    ordering = ['-total_weight']

    def get_queryset(self):
        index_id = self.request.query_params.get('index_id')
        if not index_id:
            return CompanyVoteCount.objects.none()
        
        return CompanyVoteCount.objects.filter(index_id=index_id)


class IndexVotingStatusView(generics.RetrieveAPIView):
    """
    Get the voting status for an index.
    """
    permission_classes = [permissions.IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        index_id = request.query_params.get('index_id')
        if not index_id:
            return Response({
                'error': 'index_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        index = get_object_or_404(Index, pk=index_id)
        
        # Check if user has invested in this index
        user_investments = request.user.investments.filter(index=index)
        has_investment = user_investments.exists()
        
        # Check if user has already voted in this index
        has_voted = Vote.objects.filter(
            user=request.user, 
            index=index
        ).exists()
        
        # Get the user's active investments in this index that haven't been used for voting
        active_investments = user_investments.filter(status='ACTIVE', has_voted=False)
        
        return Response({
            'index_id': index.id,
            'status': index.status,
            'is_voting_active': index.status == 'VOTING',
            'has_investment': has_investment,
            'has_voted': has_voted,
            'active_investments': [
                {
                    'id': inv.id,
                    'amount': inv.amount,
                    'date': inv.investment_date
                } for inv in active_investments
            ],
            'min_votes_per_user': index.min_votes_per_user,
            'max_votes_per_user': index.max_votes_per_user,
            'voting_start_date': index.voting_start_date,
            'voting_end_date': index.voting_end_date
        }) 