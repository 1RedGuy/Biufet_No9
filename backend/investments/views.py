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
from decimal import Decimal

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
        investments = self.get_queryset().filter(status__in=['ACTIVE', 'LOCKED', 'EXECUTED'])
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

    @action(detail=True, methods=['post'])
    def generate_positions(self, request, pk=None):
        """
        Generate investment positions based on voting results for an individual investment.
        This will:
        1. Determine the optimal number of companies to include based on voting patterns
        2. Select the top N voted companies
        3. Create equal-weighted positions for those companies
        4. Update the investment status to 'LOCKED'
        """
        # Get the investment, ensuring it belongs to the current user (handled by get_object())
        investment = self.get_object()
        
        # Check if investment is in VOTED status
        if investment.status != 'VOTED':
            return Response({
                'error': 'Can only generate positions for investments in VOTED status'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find vote counts for this index
        try:
            from voting.models import CompanyVoteCount, Vote
            
            # Check if index is in voting or has completed voting
            if investment.index.status not in ['VOTING', 'EXECUTED']:
                return Response({
                    'error': f'Index is in {investment.index.status} status, not in voting or executed status'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            # Get all companies that received votes, ordered by vote weight
            company_votes = CompanyVoteCount.objects.filter(
                index=investment.index
            ).order_by('-total_weight')
            
            if not company_votes.exists():
                return Response({
                    'error': 'No votes have been cast for this index'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 1. Determine the optimal number of companies to include
            
            # Get min and max bounds for the number of companies
            min_companies = investment.index.min_votes_per_user  # Minimum is the min votes per user
            max_companies = investment.index.max_votes_per_user  # Maximum is the max votes per user
            
            # Check if we even have enough companies with votes
            total_companies_with_votes = company_votes.count()
            if total_companies_with_votes < min_companies:
                return Response({
                    'error': f'Not enough companies received votes. Need at least {min_companies} companies.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Analyze voting patterns to find the most common number of votes per user
            vote_counts_per_user = {}
            
            # First, get all users who voted
            users_who_voted = Vote.objects.filter(
                index=investment.index
            ).values_list('user', flat=True).distinct()
            
            # Count how many companies each user voted for
            for user_id in users_who_voted:
                companies_voted_by_user = Vote.objects.filter(
                    index=investment.index, 
                    user_id=user_id
                ).values_list('company', flat=True).distinct().count()
                
                if companies_voted_by_user in vote_counts_per_user:
                    vote_counts_per_user[companies_voted_by_user] += 1
                else:
                    vote_counts_per_user[companies_voted_by_user] = 1
            
            # Find the most common pattern (mode of votes per user)
            mode_votes = min_companies  # Default to min if no clear pattern
            if vote_counts_per_user:
                mode_votes = max(vote_counts_per_user.items(), key=lambda x: x[1])[0]
            
            # Choose the number of companies based on our rules
            # 1. At least min_companies
            # 2. At most max_companies
            # 3. Prefer the most common voting pattern if within bounds
            num_companies = max(min(mode_votes, max_companies), min_companies)
            
            # Limit to available companies
            num_companies = min(num_companies, total_companies_with_votes)
            
            # 2. Get the top N companies by vote weight
            top_companies = list(company_votes[:num_companies])
            
            if not top_companies:
                return Response({
                    'error': 'Failed to determine top companies'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 3. Create positions for each top voted company
            # Calculate equal weight for each company
            company_count = len(top_companies)
            company_weight = Decimal('100.0') / Decimal(company_count)
            
            # Clear any existing positions first
            investment.positions.all().delete()
            
            # Create positions for each top voted company
            created_positions = []
            for vote_count in top_companies:
                company = vote_count.company
                position_amount = (investment.amount * company_weight) / Decimal('100.0')
                
                position, created = InvestmentPosition.objects.update_or_create(
                    investment=investment,
                    company=company,
                    defaults={
                        'amount': position_amount,
                        'weight': company_weight,
                        'quantity': position_amount / (company.current_price or Decimal('1.0')),
                        'purchase_price': company.current_price or Decimal('1.0'),
                        'current_price': company.current_price or Decimal('1.0')
                    }
                )
                created_positions.append(position)
            
            # Update investment's current value
            investment.update_current_value()
            
            # Update investment status
            investment.status = 'LOCKED'
            investment.save()
            
            # Return created positions with additional information
            serializer = InvestmentPositionSerializer(created_positions, many=True)
            return Response({
                'positions': serializer.data,
                'number_of_companies_selected': company_count,
                'voting_pattern_analysis': {
                    'min_votes_per_user': min_companies,
                    'max_votes_per_user': max_companies,
                    'most_common_votes_per_user': mode_votes,
                    'final_selected_count': num_companies,
                    'total_companies_with_votes': total_companies_with_votes,
                    'vote_distribution': vote_counts_per_user
                }
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to generate positions: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def claim_insurance(self, request, pk=None):
        """
        Process an insurance claim for an investment that has lost significant value.
        This will:
        1. Check if the investment has lost more than 40% of its value
        2. Check if insurance has not already been claimed
        3. Add 30% of the original investment amount as credits to the user
        4. Mark the investment as having claimed insurance
        """
        investment = self.get_object()
        
        # Check if investment is eligible for insurance
        if investment.status not in ['ACTIVE', 'LOCKED', 'EXECUTED']:
            return Response({
                'error': f'Investment with status {investment.status} is not eligible for insurance claims'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate loss percentage
        if not investment.amount or not investment.current_value:
            return Response({
                'error': 'Invalid investment data for insurance claim'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        loss_percentage = ((investment.amount - investment.current_value) / investment.amount) * 100
        
        # Check eligibility
        if loss_percentage < 40:
            return Response({
                'error': 'Investment must have lost at least 40% of its value to claim insurance',
                'current_loss': f'{loss_percentage:.2f}%',
                'current_value': float(investment.current_value),
                'original_amount': float(investment.amount)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if insurance was already claimed
        if hasattr(investment, 'insurance_claimed') and investment.insurance_claimed:
            return Response({
                'error': 'Insurance has already been claimed for this investment'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate insurance payout (30% of original investment)
        payout_amount = investment.amount * Decimal('0.3')
        
        with transaction.atomic():
            try:
                # Add credits to user account
                investment.user.add_credits(payout_amount)
                
                # Mark insurance as claimed
                investment.insurance_claimed = True
                investment.save(update_fields=['insurance_claimed'])
                
                # Return success response
                return Response({
                    'status': 'success',
                    'message': 'Insurance claim processed successfully',
                    'amount': float(payout_amount),
                    'investment_id': investment.id
                })
            except Exception as e:
                return Response({
                    'error': f'Failed to process insurance claim: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def executed(self, request):
        """Get only investments with EXECUTED status"""
        investments = self.get_queryset().filter(status='EXECUTED')
        serializer = self.get_serializer(investments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def emergency_withdraw(self, request, pk=None):
        """
        Emergency withdraw an investment that has lost significant value.
        This will:
        1. Check if the investment has lost more than 10% of its value
        2. Add the current value of the investment as credits to the user
        3. Mark the investment as WITHDRAWN
        """
        investment = self.get_object()
        
        # Check if investment is eligible for emergency withdrawal
        if investment.status not in ['ACTIVE', 'LOCKED', 'EXECUTED']:
            return Response({
                'error': f'Investment with status {investment.status} is not eligible for emergency withdrawal'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate loss percentage
        if not investment.amount or not investment.current_value:
            return Response({
                'error': 'Invalid investment data for emergency withdrawal'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        loss_percentage = ((investment.amount - investment.current_value) / investment.amount) * 100
        
        # Check eligibility (loss should be more than 10%)
        if loss_percentage < 10:
            return Response({
                'error': 'Investment must have lost at least 10% of its value to be eligible for emergency withdrawal',
                'current_loss': f'{loss_percentage:.2f}%',
                'current_value': float(investment.current_value),
                'original_amount': float(investment.amount)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Process withdrawal
        with transaction.atomic():
            try:
                # Add current value as credits to user account
                investment.user.add_credits(investment.current_value)
                
                # Mark investment as withdrawn
                investment.status = 'WITHDRAWN'
                investment.save(update_fields=['status'])
                
                # Return success response
                return Response({
                    'status': 'success',
                    'message': 'Emergency withdrawal processed successfully',
                    'withdrawn_amount': float(investment.current_value),
                    'investment_id': investment.id
                })
            except Exception as e:
                return Response({
                    'error': f'Failed to process emergency withdrawal: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def take_insurance(self, request, pk=None):
        """
        Take insurance for any investment, regardless of performance.
        This will:
        1. Add the original investment amount as credits to the user
        2. Mark the investment as WITHDRAWN
        """
        investment = self.get_object()
        
        # Check if investment is eligible (must be in an active state)
        if investment.status not in ['ACTIVE', 'LOCKED', 'EXECUTED']:
            return Response({
                'error': f'Investment with status {investment.status} is not eligible for insurance'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if insurance was already claimed
        if hasattr(investment, 'insurance_claimed') and investment.insurance_claimed:
            return Response({
                'error': 'Insurance has already been claimed for this investment'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Process insurance
        with transaction.atomic():
            try:
                # Add original investment amount as credits to user account
                investment.user.add_credits(investment.amount)
                
                # Mark insurance as claimed and update status
                investment.insurance_claimed = True
                investment.status = 'WITHDRAWN'
                investment.save(update_fields=['insurance_claimed', 'status'])
                
                # Return success response
                return Response({
                    'status': 'success',
                    'message': 'Insurance taken successfully',
                    'amount': float(investment.amount),
                    'investment_id': investment.id
                })
            except Exception as e:
                return Response({
                    'error': f'Failed to process insurance: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
