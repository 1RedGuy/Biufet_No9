from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg, Q, Sum, F, ExpressionWrapper, FloatField
from .models import Index
from .serializers import IndexSerializer
from rest_framework.pagination import PageNumberPagination
from companies.models import Company
from decimal import Decimal
from accounts.models import CustomUser
from investments.models import Investment

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
        if index.status == 'ARCHIVED':
            return Response(
                {'error': 'Archived indexes cannot be activated'},
                status=status.HTTP_400_BAD_REQUEST
            )
        index.status = 'ACTIVE'
        index.save()
        return Response(self.get_serializer(index).data)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive an index"""
        index = self.get_object()
        if index.status == 'ARCHIVED':
            return Response(
                {'error': 'Index is already archived'},
                status=status.HTTP_400_BAD_REQUEST
            )
        index.status = 'ARCHIVED'
        index.save()
        return Response(self.get_serializer(index).data)

    @action(detail=True, methods=['get'])
    def companies_stats(self, request, pk=None):
        """Get statistics about the companies in an index"""
        index = self.get_object()
        companies = index.companies.all()
        
        # Calculate averages
        avg_price = companies.aggregate(Avg('current_price'))['current_price__avg'] or 0
        
        stats = {
            'total_companies': companies.count(),
            'total_market_cap': companies.aggregate(Sum('market_cap'))['market_cap__sum'] or 0,
            'average_price': avg_price,
            'highest_price': companies.order_by('-current_price').first(),
            'lowest_price': companies.order_by('current_price').first(),
        }
        
        # Format the response
        response_data = {
            'total_companies': stats['total_companies'],
            'total_market_cap': stats['total_market_cap'] or 0,
            'average_price': stats['average_price'],
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
        # Query all indexes and get counts
        indexes = Index.objects.all()
        
        # Get statistics
        stats = {
            'total_indexes': indexes.count(),
            'active_indexes': indexes.filter(status='ACTIVE').count(),
            'draft_indexes': indexes.filter(status='DRAFT').count(),
            'archived_indexes': indexes.filter(status='ARCHIVED').count(),
            'total_investments': Investment.objects.count(),
            'total_users': CustomUser.objects.count()
        }
        
        return Response(stats)

    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """
        Execute an index after voting is complete.
        This will:
        1. Determine the optimal number of companies to include based on voting patterns
        2. Select the top N voted companies
        3. Update the index to include only those companies
        4. Reallocate all investments to these companies
        5. Change the index status to 'EXECUTED'
        """
        index = self.get_object()
        
        # Validate index status
        if index.status != 'VOTING':
            return Response(
                {'error': f'Index must be in voting status to execute. Current status: {index.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get vote counts for companies in this index
        from voting.models import CompanyVoteCount, Vote
        
        # Get all companies that received votes, ordered by vote weight
        company_votes = CompanyVoteCount.objects.filter(
            index=index
        ).order_by('-total_weight')
        
        if not company_votes.exists():
            return Response(
                {'error': 'No votes have been cast for this index'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 1. Determine the optimal number of companies to include
        
        # Get min and max bounds for the number of companies
        min_companies = index.min_votes_per_user  # Minimum is the min votes per user
        max_companies = index.max_votes_per_user  # Maximum is the max votes per user
        
        # Check if we even have enough companies with votes
        total_companies_with_votes = company_votes.count()
        if total_companies_with_votes < min_companies:
            return Response(
                {'error': f'Not enough companies received votes. Need at least {min_companies} companies.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Analyze voting patterns to find the most common number of votes per user
        # This helps us determine the most natural number of companies to include
        vote_counts_per_user = {}
        
        # First, get all users who voted
        users_who_voted = Vote.objects.filter(
            index=index
        ).values_list('user', flat=True).distinct()
        
        # Count how many companies each user voted for
        for user_id in users_who_voted:
            companies_voted_by_user = Vote.objects.filter(
                index=index, 
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
        top_companies = list(company_votes[:num_companies].values_list('company', flat=True))
        
        if not top_companies:
            return Response(
                {'error': 'Failed to determine top companies'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Fetch the actual Company objects
        from companies.models import Company
        top_companies = Company.objects.filter(id__in=top_companies)
        
        # 3. Update the index to include only these companies
        from django.db import transaction
        try:
            with transaction.atomic():
                # Update the index's companies to only include the top voted ones
                index.companies.clear()
                index.companies.add(*top_companies)
                
                # 4. Reallocate all investments
                from investments.models import Investment, InvestmentPosition
                from decimal import Decimal
                
                # Get all investments in VOTED status
                investments = Investment.objects.filter(
                    index=index, 
                    status='VOTED'
                )
                
                # Calculate equal weight for each company
                weight_per_company = Decimal('100.0') / Decimal(len(top_companies))
                
                # Reallocate each investment
                for investment in investments:
                    # Clear existing positions
                    investment.positions.all().delete()
                    
                    # Create new positions for each top company
                    for company in top_companies:
                        # Calculate allocation for this company
                        amount = (investment.amount * weight_per_company) / Decimal('100.0')
                        
                        # Calculate quantity based on current price
                        quantity = Decimal('0')
                        if company.current_price and company.current_price > 0:
                            quantity = amount / company.current_price
                        
                        # Create the position
                        InvestmentPosition.objects.create(
                            investment=investment,
                            company=company,
                            amount=amount,
                            quantity=quantity,
                            purchase_price=company.current_price or Decimal('1.0'),
                            current_price=company.current_price or Decimal('1.0'),
                            weight=weight_per_company
                        )
                    
                    # Update investment status and current value
                    investment.status = 'ACTIVE'  # Change back to active from VOTED
                    investment.update_current_value()
                
                # 5. Update index status to executed
                index.status = 'EXECUTED'
                index.save()
                
                return Response({
                    'status': 'success',
                    'message': f'Index execution completed successfully with {len(top_companies)} companies',
                    'number_of_companies_selected': len(top_companies),
                    'voting_pattern_analysis': {
                        'min_votes_per_user': min_companies,
                        'max_votes_per_user': max_companies,
                        'most_common_votes_per_user': mode_votes,
                        'final_selected_count': num_companies,
                        'vote_distribution': vote_counts_per_user
                    },
                    'top_companies': [{'id': c.id, 'name': c.name, 'symbol': c.symbol} for c in top_companies],
                    'index': self.get_serializer(index).data
                })
                
        except Exception as e:
            return Response(
                {'error': f'Error executing index: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def set_draft(self, request, pk=None):
        """Set an index back to draft status"""
        index = self.get_object()
        if index.status == 'ARCHIVED':
            return Response(
                {'error': 'Archived indexes cannot be set to draft'},
                status=status.HTTP_400_BAD_REQUEST
            )
        index.status = 'DRAFT'
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
        if index.status not in ['VOTING', 'EXECUTED', 'ARCHIVED']:
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

    @action(detail=True, methods=['post'])
    def start_voting(self, request, pk=None):
        """
        Start the voting phase for an index.
        This will:
        1. Change the index status to 'voting'
        2. Mark all active investments as 'VOTED'
        """
        index = self.get_object()
        
        # Validate index status
        if index.status != 'ACTIVE':
            return Response(
                {'error': f'Index must be in active status to start voting. Current status: {index.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Execute the start of voting inside a transaction
        from django.db import transaction
        try:
            with transaction.atomic():
                # 1. Update all active investments to VOTED status
                from investments.models import Investment
                investments = Investment.objects.filter(
                    index=index, 
                    status='ACTIVE'
                )
                
                investment_count = investments.count()
                investments.update(status='VOTED')
                
                # 2. Change index status to voting
                index.status = 'VOTING'
                index.save()
                
                return Response({
                    'status': 'success',
                    'message': f'Voting phase started successfully for index {index.name}',
                    'investments_updated': investment_count,
                    'index': self.get_serializer(index).data
                })
                
        except Exception as e:
            return Response(
                {'error': f'Error starting voting phase: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
