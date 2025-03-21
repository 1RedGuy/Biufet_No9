from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializer import (
    UserSerializer, 
    CustomTokenObtainPairSerializer,
    PasswordResetSerializer,
    UserProfileSerializer
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import CustomUser, Portfolio
from .serializer import (
    PortfolioSerializer,
    PortfolioHistorySerializer
)
from decimal import Decimal
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncMonth
from investments.models import Investment, InvestmentPosition
from companies.models import Company
from django.utils import timezone
from datetime import timedelta

class SignUpView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            if user:
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

class PasswordResetView(APIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            password = serializer.validated_data['password']
            
            user.set_password(password)
            user.save()
            
            return Response(
                {"message": "Password has been reset successfully."},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CustomUser.objects.filter(id=self.request.user.id)
    
    @action(detail=False, methods=['post'])
    def add_credits(self, request):
        try:
            amount = Decimal(str(request.data.get('amount', 0)))
            if amount <= 0:
                return Response(
                    {'error': 'Amount must be greater than 0'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user = request.user
            user.add_credits(amount)
            
            return Response({
                'message': f'Successfully added {amount} credits',
                'current_credits': user.credits
            })
        except (TypeError, ValueError):
            return Response(
                {'error': 'Invalid amount'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def credits(self, request):
        return Response({
            'credits': request.user.credits
        })

class PortfolioViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PortfolioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Portfolio.objects.filter(user=self.request.user)

    @action(detail=True)
    def history(self, request, pk=None):
        portfolio = self.get_object()
        history = portfolio.history.all()[:30]  # Last 30 entries
        serializer = PortfolioHistorySerializer(history, many=True)
        return Response(serializer.data)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get(self, request):
        user = request.user
        
        # Get all active investments
        investments = Investment.objects.filter(
            user=user,
            status='ACTIVE'
        ).select_related('index')

        # Calculate totals from individual investments
        total_invested = Decimal('0.00')
        current_total = Decimal('0.00')
        active_investments = []

        for investment in investments:
            total_invested += investment.amount
            current_total += investment.current_value
            active_investments.append({
                'index_name': investment.index.name,
                'amount': float(investment.amount),
                'current_value': float(investment.current_value),
                'performance': float(investment.profit_loss_percentage),
                'status': investment.status,
                'date': investment.investment_date.strftime('%Y-%m-%d')
            })

        # Calculate portfolio growth
        portfolio_growth = Decimal('0.00')
        if total_invested > 0:
            portfolio_growth = ((current_total - total_invested) / total_invested) * 100

        # Get unique companies invested in
        companies_invested = InvestmentPosition.objects.filter(
            investment__user=user,
            investment__status='ACTIVE'
        ).values('company').distinct().count()

        # Get investment sectors allocation
        positions = InvestmentPosition.objects.filter(
            investment__user=user,
            investment__status='ACTIVE'
        ).select_related('company')

        # Calculate sector totals
        sector_totals = {}
        for position in positions:
            sector_code = position.company.sector
            sector_name = dict(Company.SECTOR_CHOICES).get(sector_code, 'Other')
            current_value = position.quantity * position.current_price
            sector_totals[sector_name] = sector_totals.get(sector_name, Decimal('0.00')) + current_value

        # Format sector data
        investment_sectors = {
            sector: float(amount)
            for sector, amount in sector_totals.items()
        }

        # Get monthly performance data (last 12 months)
        twelve_months_ago = timezone.now() - timedelta(days=365)
        monthly_performance = Portfolio.objects.filter(
            user=user,
            history__timestamp__gte=twelve_months_ago
        ).annotate(
            month=TruncMonth('history__timestamp')
        ).values('month').annotate(
            value=Sum('history__value')
        ).order_by('month')

        # Format monthly performance data
        monthly_data = [
            {
                'month': item['month'].strftime('%Y-%m'),
                'value': float(item['value'])
            }
            for item in monthly_performance
        ]

        # Calculate investment details by index
        index_totals = {}
        for investment in investments:
            index_name = investment.index.name
            if index_name not in index_totals:
                index_totals[index_name] = {
                    'amount': Decimal('0.00'),
                    'current_value': Decimal('0.00')
                }
            index_totals[index_name]['amount'] += investment.amount
            index_totals[index_name]['current_value'] += investment.current_value

        # Format index investment data
        investment_by_index = {}
        for index_name, totals in index_totals.items():
            amount = totals['amount']
            current_value = totals['current_value']
            performance = Decimal('0.00')
            if amount > 0:
                performance = ((current_value - amount) / amount) * 100
            
            investment_by_index[index_name] = {
                'amount': float(amount),
                'current_value': float(current_value),
                'performance': float(performance)
            }

        # Create a dictionary with all the user data
        user_data = {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'date_joined': user.date_joined,
            'total_investments': float(current_total),
            'portfolio_growth_percentage': float(portfolio_growth),
            'companies_invested_count': companies_invested,
            'investment_sectors': investment_sectors,
            'monthly_performance': monthly_data,
            'investment_by_index': investment_by_index,
            'active_investments': active_investments,
            'credits': float(user.credits)
        }

        return Response(user_data)


    