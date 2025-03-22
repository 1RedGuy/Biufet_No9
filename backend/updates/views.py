from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from rest_framework import status
from .tasks import update_stock_prices
from .models import UpdateLog
from django.utils import timezone
import threading
from investments.models import Investment, InvestmentPosition
from investments.serializers import InvestmentSerializer
from rest_framework.permissions import IsAdminUser

# Create your views here.

class TestUpdateView(APIView):
    """View to trigger a test update of stock prices"""
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        try:
            update_log = run_test_update()
            return Response({
                'status': 'success',
                'last_updated': update_log.timestamp.isoformat() if update_log else None,
                'details': str(update_log) if update_log else 'No update performed'
            })
        except Exception as e:
            return Response({
                'status': 'error',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UpdateInvestmentsView(APIView):
    """View to update investment positions based on current company prices"""
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        try:
            # Get all investments
            investments = Investment.objects.filter(status='ACTIVE')
            
            # Update each investment's positions
            updated_count = 0
            for investment in investments:
                if hasattr(investment, 'update_positions'):
                    investment.update_positions()
                    updated_count += 1
            
            return Response({
                'status': 'success',
                'investments_updated': updated_count
            })
        except Exception as e:
            return Response({
                'status': 'error',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
