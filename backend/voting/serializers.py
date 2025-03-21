from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from django.db.models import Count
from .models import VotingSession, Vote, VotingResult
from companies.models import Company
from indexes.models import Index
from investments.models import Investment

class VotingSessionSerializer(serializers.ModelSerializer):
    """Serializer for voting sessions"""
    total_votes = serializers.IntegerField(read_only=True)
    unique_voters = serializers.IntegerField(read_only=True)
    remaining_time = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = VotingSession
        fields = [
            'id', 'index', 'status', 'status_display', 'start_date', 'end_date',
            'min_votes_required', 'max_votes_allowed', 'min_investors',
            'total_votes', 'unique_voters', 'remaining_time',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_remaining_time(self, obj):
        """Calculate remaining time in seconds if session is active"""
        if obj.status != 'active':
            return None
        
        now = timezone.now()
        if now > obj.end_date:
            return 0
        
        remaining = obj.end_date - now
        return int(remaining.total_seconds())
    
    def validate(self, data):
        """Validate voting session data"""
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] >= data['end_date']:
                raise serializers.ValidationError("End date must be after start date")
        
        if data.get('min_votes_required') and data.get('max_votes_allowed'):
            if data['min_votes_required'] > data['max_votes_allowed']:
                raise serializers.ValidationError("Minimum votes cannot be greater than maximum votes")
        
        return data


class VoteSerializer(serializers.ModelSerializer):
    """Serializer for individual votes"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_symbol = serializers.CharField(source='company.symbol', read_only=True)
    
    class Meta:
        model = Vote
        fields = [
            'id', 'session', 'user', 'user_username', 
            'company', 'company_name', 'company_symbol',
            'investment', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'user_username', 'company_name', 'company_symbol']
    
    def validate(self, data):
        """Validate vote data"""
        user = self.context['request'].user
        session = data['session']
        company = data['company']
        
        # Make sure user has an active investment in the index
        investment = Investment.objects.filter(
            user=user,
            index=session.index,
            status='ACTIVE'
        ).first()
        
        if not investment:
            raise serializers.ValidationError("You must have an active investment in this index to vote.")
        
        # Add the investment to the data
        data['investment'] = investment
        data['user'] = user
        
        # Check if session is active
        if not session.is_active:
            raise serializers.ValidationError("Voting session is not active.")
        
        # Check if company is in the index's companies
        if not session.index.companies.filter(id=company.id).exists():
            raise serializers.ValidationError("This company is not part of the index.")
        
        # Check if user has reached maximum votes
        user_votes_count = Vote.objects.filter(
            session=session,
            user=user
        ).count()
        
        if user_votes_count >= session.max_votes_allowed:
            raise serializers.ValidationError(
                f"You have reached the maximum allowed votes ({session.max_votes_allowed})."
            )
        
        # Check if user has already voted for this company
        if Vote.objects.filter(session=session, user=user, company=company).exists():
            raise serializers.ValidationError("You have already voted for this company.")
        
        return data


class VotingResultSerializer(serializers.ModelSerializer):
    """Serializer for voting results"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_symbol = serializers.CharField(source='company.symbol', read_only=True)
    company_sector = serializers.CharField(source='company.sector', read_only=True)
    company_price = serializers.DecimalField(
        source='company.current_price', 
        max_digits=10, 
        decimal_places=2,
        read_only=True
    )
    
    class Meta:
        model = VotingResult
        fields = [
            'id', 'session', 'company', 'company_name', 'company_symbol',
            'company_sector', 'company_price', 'vote_count', 'percentage',
            'rank', 'calculated_at'
        ]
        read_only_fields = ['id', 'calculated_at']


class VoteCountSerializer(serializers.Serializer):
    """Serializer for vote counts by company"""
    company_id = serializers.IntegerField()
    company_name = serializers.CharField()
    company_symbol = serializers.CharField()
    vote_count = serializers.IntegerField()
    
    def to_representation(self, instance):
        """Custom representation to handle the aggregated data"""
        company = Company.objects.get(id=instance['company'])
        return {
            'company_id': company.id,
            'company_name': company.name,
            'company_symbol': company.symbol,
            'vote_count': instance['vote_count']
        }


class UserVoteSummarySerializer(serializers.Serializer):
    """Serializer for user vote summary"""
    session_id = serializers.IntegerField()
    votes_cast = serializers.IntegerField()
    votes_remaining = serializers.IntegerField()
    companies_voted = serializers.ListField(child=serializers.IntegerField()) 