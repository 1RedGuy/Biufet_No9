from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from .models import Index
from .serializers import IndexSerializer
from rest_framework.pagination import PageNumberPagination

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

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get statistics about indexes"""
        total_indexes = Index.objects.count()
        active_indexes = Index.objects.filter(status='active').count()
        avg_companies = Index.objects.annotate(
            company_count=Count('companies')
        ).aggregate(avg=Avg('company_count'))['avg'] or 0

        return Response({
            'total_indexes': total_indexes,
            'active_indexes': active_indexes,
            'average_companies_per_index': round(avg_companies, 2)
        })
