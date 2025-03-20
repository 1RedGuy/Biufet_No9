from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg
from .models import Index
from .serializers import IndexSerializer

# Create your views here.

class IndexViewSet(viewsets.ModelViewSet):
    queryset = Index.objects.all()
    serializer_class = IndexSerializer
    permission_classes = [permissions.IsAuthenticated]

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
