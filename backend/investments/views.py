from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
import uuid
from datetime import timedelta
from rest_framework import serializers
from .models import Investment, InvestmentPosition
from accounts.models import Portfolio, PortfolioHistory
from .serializers import InvestmentSerializer, InvestmentPositionSerializer
from django.db.models import Sum

class InvestmentViewSet(viewsets.ModelViewSet):
    serializer_class = InvestmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Investment.objects.filter(
            user=self.request.user
        ).prefetch_related('positions')

    def perform_create(self, serializer):
        # Generate a unique transaction ID
        transaction_id = str(uuid.uuid4())
        
        # Set lock period to 1 year from now by default
        lock_period_end = timezone.now() + timedelta(days=365)
        
        with transaction.atomic():
            # Create the investment
            investment = serializer.save(
                user=self.request.user,
                transaction_id=transaction_id,
                lock_period_end=lock_period_end,
                current_value=serializer.validated_data['amount']  # Initially same as investment
            )
            
            # Process the investment credits
            investment.process_investment_credits()
            
            # Ensure user has a portfolio
            portfolio, created = Portfolio.objects.get_or_create(user=self.request.user)
            
            # Update portfolio
            portfolio.update_totals()
            
            # Create portfolio history entry
            PortfolioHistory.objects.create(
                portfolio=portfolio,
                value=portfolio.total_value,
                profit_loss=portfolio.total_profit_loss
            )

    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        investment = self.get_object()
        
        try:
            investment.process_withdrawal_credits()
            return Response(self.get_serializer(investment).data)
        except serializers.ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        investments = self.get_queryset()
        
        total_invested = investments.aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        total_current_value = investments.aggregate(
            total=Sum('current_value')
        )['total'] or 0
        
        total_profit_loss = total_current_value - total_invested
        
        profit_loss_percentage = (
            (total_profit_loss / total_invested) * 100 
            if total_invested > 0 else 0
        )
        
        active_investments = investments.filter(
            status='ACTIVE'
        ).count()
        
        completed_investments = investments.filter(
            status='COMPLETED'
        ).count()
        
        return Response({
            'total_invested': total_invested,
            'total_current_value': total_current_value,
            'total_profit_loss': total_profit_loss,
            'profit_loss_percentage': profit_loss_percentage,
            'active_investments': active_investments,
            'completed_investments': completed_investments,
            'total_investments': investments.count()
        })

    @action(detail=True, methods=['get'])
    def positions(self, request, pk=None):
        investment = self.get_object()
        positions = investment.positions.all()
        serializer = InvestmentPositionSerializer(positions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_positions(self, request, pk=None):
        investment = self.get_object()
        
        if investment.status != 'ACTIVE':
            return Response({
                'error': 'Can only update positions for active investments'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        positions_data = request.data.get('positions', [])
        total_weight = sum(float(pos.get('weight', 0)) for pos in positions_data)
        
        if not (99.5 <= total_weight <= 100.5):  # Allow small rounding differences
            return Response({
                'error': 'Total weight must be 100%'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update or create positions
        for position_data in positions_data:
            position, created = InvestmentPosition.objects.update_or_create(
                investment=investment,
                company_id=position_data['company_id'],
                defaults={
                    'weight': position_data['weight'],
                    'amount': (investment.amount * position_data['weight']) / 100,
                    'quantity': position_data.get('quantity', 0),
                    'purchase_price': position_data.get('purchase_price', 0),
                    'current_price': position_data.get('current_price', 0)
                }
            )
        
        # Remove positions not in the update
        company_ids = [pos['company_id'] for pos in positions_data]
        investment.positions.exclude(
            company_id__in=company_ids
        ).delete()
        
        investment.update_current_value()
        return Response(self.get_serializer(investment).data)

    @action(detail=False, methods=['get'])
    def active(self, request):
        investments = self.get_queryset().filter(status='ACTIVE')
        serializer = self.get_serializer(investments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def completed(self, request):
        investments = self.get_queryset().filter(status='COMPLETED')
        serializer = self.get_serializer(investments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def withdrawable(self, request):
        now = timezone.now()
        investments = self.get_queryset().filter(
            status='ACTIVE',
            lock_period_end__lte=now
        )
        serializer = self.get_serializer(investments, many=True)
        return Response(serializer.data)
