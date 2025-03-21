from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg, Q, Sum, F, ExpressionWrapper, FloatField
from .models import Index
from .serializers import IndexSerializer
from rest_framework.pagination import PageNumberPagination
from companies.models import Company

class IndexPagination(PageNumberPagination):
    page_size = 9  # Show 9 indexes per page (3x3 grid)
    page_size_query_param = 'page_size'
    max_page_size = 100

class IndexViewSet(viewsets.ModelViewSet):
    serializer_class = IndexSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = IndexPagination

    def get_queryset(self):
        queryset = Index.objects.all()
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status != None:
            queryset = queryset.filter(status=status)
        
        # Filter by search term
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Filter by min/max companies
        min_companies = self.request.query_params.get('min_companies', None)
        if min_companies:
            queryset = queryset.annotate(
                num_companies=Count('companies')
            ).filter(num_companies__gte=min_companies)
        
        max_companies = self.request.query_params.get('max_companies', None)
        if max_companies:
            queryset = queryset.annotate(
                num_companies=Count('companies')
            ).filter(num_companies__lte=max_companies)
        
        # Order by
        order_by = self.request.query_params.get('order_by', '-created_at')
        valid_order_fields = ['created_at', '-created_at', 'name', '-name']
        if order_by in valid_order_fields:
            queryset = queryset.order_by(order_by)
        
        return queryset

    @action(detail=True, methods=['post'])
    def add_companies(self, request, pk=None):
        """Add companies to an index"""
        index = self.get_object()
        company_ids = request.data.get('company_ids', [])
        
        if not company_ids:
            return Response(
                {'error': 'No company_ids provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        companies = Company.objects.filter(id__in=company_ids)
        if not companies:
            return Response(
                {'error': 'No valid companies found with provided IDs'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add companies to the index
        index.companies.add(*companies)
        
        # Update the serialized response
        serializer = self.get_serializer(index)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate an index"""
        index = self.get_object()
        if index.status == 'archived':
            return Response(
                {'error': 'Archived indexes cannot be activated'},
                status=status.HTTP_400_BAD_REQUEST
            )
        index.status = 'active'
        index.save()
        return Response(self.get_serializer(index).data)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive an index"""
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
        """Get statistics about the companies in an index"""
        index = self.get_object()
        companies = index.companies.all()
        
        stats = {
            'total_companies': companies.count(),
            'total_market_cap': companies.aggregate(Sum('market_cap'))['market_cap__sum'],
            'highest_price': companies.order_by('-current_price').first(),
            'lowest_price': companies.order_by('current_price').first(),
        }
        
        # Format the response
        response_data = {
            'total_companies': stats['total_companies'],
            'total_market_cap': stats['total_market_cap'],
        }
        
        if stats['highest_price']:
            response_data['highest_price'] = {
                'name': stats['highest_price'].name,
                'symbol': stats['highest_price'].symbol,
                'price': stats['highest_price'].current_price
            }
            
        if stats['lowest_price']:
            response_data['lowest_price'] = {
                'name': stats['lowest_price'].name,
                'symbol': stats['lowest_price'].symbol,
                'price': stats['lowest_price'].current_price
            }
            
        return Response(response_data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get overall statistics for all indexes"""
        indexes = self.get_queryset()
        
        stats = {
            'total_indexes': indexes.count(),
            'active_indexes': indexes.filter(status='active').count(),
            'draft_indexes': indexes.filter(status='draft').count(),
            'archived_indexes': indexes.filter(status='archived').count(),
        }
        
        return Response(stats)

    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Execute an index"""
        index = self.get_object()
        if index.status == 'archived':
            return Response(
                {'error': 'Archived indexes cannot be executed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        index.status = 'executed'
        index.save()
        return Response(self.get_serializer(index).data)

    @action(detail=True, methods=['post'])
    def set_draft(self, request, pk=None):
        """Set an index back to draft status"""
        index = self.get_object()
        if index.status == 'archived':
            return Response(
                {'error': 'Archived indexes cannot be set to draft'},
                status=status.HTTP_400_BAD_REQUEST
            )
        index.status = 'draft'
        index.save()
        return Response(self.get_serializer(index).data)

    @action(detail=True, methods=['get'])
    def company_vote_weights(self, request, pk=None):
        """
        Get the vote weights for all companies in this index.
        Only accessible when the index status is 'voting' or after.
        """
        index = self.get_object()
        
        # Only provide vote weights if the index is in voting or later stage
        if index.status not in ['voting', 'executed', 'archived']:
            return Response(
                {"detail": f"Vote weights not available. Index status: {index.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all companies in this index with their vote weights
        from voting.models import CompanyVoteCount
        vote_counts = CompanyVoteCount.objects.filter(index=index).select_related('company')
        
        # Prepare the response data
        data = [{
            'company_id': vc.company.id,
            'company_name': vc.company.name,
            'company_symbol': vc.company.symbol,
            'sector': vc.company.sector,
            'total_weight': vc.total_weight,
            'vote_count': vc.vote_count
        } for vc in vote_counts]
        
        # Sort by total weight descending
        data.sort(key=lambda x: x['total_weight'], reverse=True)
        
        return Response(data)
