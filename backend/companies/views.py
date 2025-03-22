from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum
from .models import Company
from .serializers import CompanySerializer
import logging
from rest_framework_simplejwt.authentication import JWTAuthentication

logger = logging.getLogger(__name__)

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'symbol']
    ordering_fields = ['name', 'symbol', 'current_price', 'market_cap']
    ordering = ['name']

    def initial(self, request, *args, **kwargs):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        logger.debug(f"Auth header: {auth_header}")
        
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            logger.debug(f"Token (first 20 chars): {token[:20]}")
            
            try:
                jwt_auth = JWTAuthentication()
                validated_token = jwt_auth.get_validated_token(token)
                user = jwt_auth.get_user(validated_token)
                logger.debug(f"Successfully authenticated user: {user.username}")
            except Exception as e:
                logger.error(f"Token validation error: {str(e)}")
        else:
            logger.error("No Bearer token found in Authorization header")
            
        return super().initial(request, *args, **kwargs)

    def get_queryset(self):
        logger.debug(f"User in request: {self.request.user}")
        queryset = Company.objects.all()
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        # Filter by price range
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        if min_price is not None:
            queryset = queryset.filter(current_price__gte=min_price)
        if max_price is not None:
            queryset = queryset.filter(current_price__lte=max_price)

        # Filter by market cap range
        min_market_cap = self.request.query_params.get('min_market_cap', None)
        max_market_cap = self.request.query_params.get('max_market_cap', None)
        if min_market_cap is not None:
            queryset = queryset.filter(market_cap__gte=min_market_cap)
        if max_market_cap is not None:
            queryset = queryset.filter(market_cap__lte=max_market_cap)

        return queryset

    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response([])

        companies = Company.objects.filter(
            Q(name__icontains=query) | 
            Q(symbol__icontains=query)
        )[:10]
        
        serializer = self.get_serializer(companies, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        total_companies = Company.objects.count()
        active_companies = Company.objects.filter(is_active=True).count()
        total_market_cap = Company.objects.filter(
            market_cap__isnull=False
        ).aggregate(
            total=Sum('market_cap')
        )['total'] or 0

        return Response({
            'total_companies': total_companies,
            'active_companies': active_companies,
            'total_market_cap': total_market_cap,
            'average_market_cap': total_market_cap / total_companies if total_companies > 0 else 0
        })
