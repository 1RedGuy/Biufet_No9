from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count
from .models import InvestmentIndex, Investment, Vote, BinanceIntegration, Index
from .serializers import (
    InvestmentIndexSerializer,
    InvestmentSerializer,
    VoteSerializer,
    BinanceIntegrationSerializer,
    IndexSerializer
)

# Create your views here.

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class InvestmentIndexViewSet(viewsets.ModelViewSet):
    queryset = InvestmentIndex.objects.all()
    serializer_class = InvestmentIndexSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = InvestmentIndex.objects.all()
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        index = self.get_object()
        if index.status != 'draft':
            return Response(
                {'error': 'Only draft indexes can be activated'},
                status=status.HTTP_400_BAD_REQUEST
            )
        index.status = 'active'
        index.save()
        return Response(self.get_serializer(index).data)

    @action(detail=True, methods=['post'])
    def start_voting(self, request, pk=None):
        index = self.get_object()
        if index.status != 'active':
            return Response(
                {'error': 'Only active indexes can start voting'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if timezone.now() < index.investment_end_date:
            return Response(
                {'error': 'Investment period has not ended yet'},
                status=status.HTTP_400_BAD_REQUEST
            )
        index.status = 'voting'
        index.save()
        return Response(self.get_serializer(index).data)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        index = self.get_object()
        if index.status not in ['active', 'voting']:
            return Response(
                {'error': 'Only active or voting indexes can be closed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        index.status = 'closed'
        index.save()
        return Response(self.get_serializer(index).data)

    @action(detail=True, methods=['get'])
    def voting_results(self, request, pk=None):
        index = self.get_object()
        if index.status not in ['closed', 'executed']:
            return Response(
                {'error': 'Voting results are only available for closed or executed indexes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get vote counts for each company
        results = Vote.objects.filter(
            investment__index=index
        ).values(
            'company__name',
            'company__symbol'
        ).annotate(
            vote_count=Count('id')
        ).order_by('-vote_count')
        
        return Response(results)

class InvestmentViewSet(viewsets.ModelViewSet):
    serializer_class = InvestmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Investment.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        index = serializer.validated_data['index']
        if index.status != 'active':
            raise serializers.ValidationError('This index is not currently accepting investments')
        if timezone.now() > index.investment_end_date:
            raise serializers.ValidationError('Investment period has ended')
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        investment = self.get_object()
        if investment.status != 'active':
            return Response(
                {'error': 'Investment is not active'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        index = investment.index
        if index.status != 'voting':
            return Response(
                {'error': 'Voting period has not started'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        company_ids = request.data.get('company_ids', [])
        if not company_ids:
            return Response(
                {'error': 'No companies selected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(company_ids) < index.min_votes_per_user:
            return Response(
                {'error': f'Minimum {index.min_votes_per_user} votes required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(company_ids) > index.max_votes_per_user:
            return Response(
                {'error': f'Maximum {index.max_votes_per_user} votes allowed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create votes
        for company_id in company_ids:
            Vote.objects.create(
                user=request.user,
                investment=investment,
                company_id=company_id
            )
        
        investment.status = 'voted'
        investment.save()
        
        return Response(self.get_serializer(investment).data)

class VoteViewSet(viewsets.ModelViewSet):
    serializer_class = VoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Vote.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        investment = serializer.validated_data['investment']
        if investment.user != self.request.user:
            raise serializers.ValidationError('You can only vote on your own investments')
        serializer.save(user=self.request.user)

class BinanceIntegrationViewSet(viewsets.ModelViewSet):
    serializer_class = BinanceIntegrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BinanceIntegration.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        integration = self.get_object()
        # Here you would implement the actual Binance API connection test
        # For now, we'll just return a success response
        return Response({'status': 'success'})

class IndexViewSet(viewsets.ModelViewSet):
    queryset = Index.objects.all()
    serializer_class = IndexSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = Index.objects.all()
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        index = self.get_object()
        if index.status != 'draft':
            return Response(
                {'error': 'Only draft indexes can be activated'},
                status=status.HTTP_400_BAD_REQUEST
            )
        index.status = 'active'
        index.save()
        return Response(self.get_serializer(index).data)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        index = self.get_object()
        if index.status == 'archived':
            return Response(
                {'error': 'Index is already archived'},
                status=status.HTTP_400_BAD_REQUEST
            )
        index.status = 'archived'
        index.save()
        return Response(self.get_serializer(index).data)

    @action(detail=True, methods=['get'])
    def companies_stats(self, request, pk=None):
        index = self.get_object()
        stats = {
            'total_companies': index.companies.count(),
            'total_market_cap': sum(c.market_cap or 0 for c in index.companies.all()),
            'average_price': sum(c.current_price or 0 for c in index.companies.all()) / index.companies.count() if index.companies.exists() else 0,
            'companies_by_market_cap': list(index.companies.order_by('-market_cap').values('name', 'symbol', 'market_cap')[:10])
        }
        return Response(stats)
