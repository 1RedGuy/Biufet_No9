from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
import uuid
from datetime import timedelta
from rest_framework import serializers
from .models import Investment
from accounts.models import Portfolio, PortfolioHistory
from .serializers import InvestmentSerializer

class InvestmentViewSet(viewsets.ModelViewSet):
    serializer_class = InvestmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Investment.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Generate a unique transaction ID
        transaction_id = str(uuid.uuid4())
        
        # Set lock period to 1 year from now by default
        lock_period_end = timezone.now() + timedelta(days=365)
        
        with transaction.atomic():
            # Deduct credits from user
            amount = serializer.validated_data['amount']
            user = self.request.user
            if not user.deduct_credits(amount):
                raise serializers.ValidationError("Failed to deduct credits")
            
            # Create the investment
            investment = serializer.save(
                user=user,
                transaction_id=transaction_id,
                lock_period_end=lock_period_end,
                current_value=amount  # Initially same as investment
            )
            
            # Ensure user has a portfolio
            portfolio, created = Portfolio.objects.get_or_create(user=user)
            
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
        
        if not investment.withdrawal_eligible:
            return Response(
                {"detail": "Investment is not eligible for withdrawal"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if investment.status != 'COMPLETED':
            return Response(
                {"detail": "Only completed investments can be withdrawn"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if timezone.now() < investment.lock_period_end:
            return Response(
                {"detail": "Investment is still within lock period"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Add current value back as credits
            user = investment.user
            user.add_credits(investment.current_value)
            
            # Mark investment as withdrawn
            investment.status = 'WITHDRAWN'
            investment.save()
            
            # Update portfolio
            portfolio = user.portfolio
            portfolio.update_totals()
        
        return Response({
            "status": "withdrawal completed",
            "credits_returned": str(investment.current_value),
            "new_credit_balance": str(user.credits)
        })
