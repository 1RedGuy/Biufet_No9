from rest_framework import serializers
from .models import Vote, CompanyVoteCount
from companies.serializers import CompanySerializer
from indexes.models import Index
from django.db import transaction
from decimal import Decimal
from companies.models import Company


class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ['id', 'user', 'index', 'company', 'investment', 'weight', 'created_at']
        read_only_fields = ['id', 'user', 'weight', 'created_at']


class CompanyVoteCountSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    
    class Meta:
        model = CompanyVoteCount
        fields = ['company', 'total_weight', 'vote_count']
        read_only_fields = ['total_weight', 'vote_count']


class CreateVoteSerializer(serializers.Serializer):
    index_id = serializers.IntegerField()
    company_ids = serializers.ListField(child=serializers.IntegerField(), min_length=1)
    investment_id = serializers.IntegerField()

    def validate(self, data):
        # Check if the index exists
        try:
            index = Index.objects.get(pk=data['index_id'])
        except Index.DoesNotExist:
            raise serializers.ValidationError({"index_id": "Index does not exist"})
        
        # Check if the index is in voting status
        if index.status != 'voting':
            raise serializers.ValidationError({
                "index_id": f"Voting is not allowed for this index. Current status: {index.status}"
            })
        
        # Check if the number of company votes is within the allowed range
        company_count = len(data['company_ids'])
        if company_count < index.min_votes_per_user:
            raise serializers.ValidationError({
                "company_ids": f"You must vote for at least {index.min_votes_per_user} companies"
            })
        if company_count > index.max_votes_per_user:
            raise serializers.ValidationError({
                "company_ids": f"You can vote for at most {index.max_votes_per_user} companies"
            })
        
        # Check if all companies are part of the index
        index_company_ids = set(index.companies.values_list('id', flat=True))
        for company_id in data['company_ids']:
            if company_id not in index_company_ids:
                raise serializers.ValidationError({
                    "company_ids": f"Company with ID {company_id} is not part of this index"
                })
        
        # Check if the investment exists and belongs to the user
        user = self.context['request'].user
        try:
            investment = user.investments.get(pk=data['investment_id'])
        except Exception:
            raise serializers.ValidationError({
                "investment_id": "Investment does not exist or doesn't belong to you"
            })
        
        # Check if the investment is for the correct index
        if investment.index.id != index.id:
            raise serializers.ValidationError({
                "investment_id": "Investment is not for this index"
            })
        
        # Check if the investment is active
        if investment.status != 'ACTIVE':
            raise serializers.ValidationError({
                "investment_id": f"Investment is not active. Current status: {investment.status}"
            })
        
        # Check if the investment has already been used for voting
        if investment.has_voted:
            raise serializers.ValidationError({
                "investment_id": "This investment has already been used for voting"
            })
        
        # Store the index and investment for create method
        self.index = index
        self.investment = investment
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        user = self.context['request'].user
        index = self.index
        investment = self.investment
        company_ids = validated_data['company_ids']
        
        # Calculate vote weight per company
        weight_per_company = investment.amount / Decimal(len(company_ids))
        
        # Delete any existing votes for this user and investment
        Vote.objects.filter(user=user, investment=investment).delete()
        
        # Create new votes
        votes = []
        for company_id in company_ids:
            vote = Vote(
                user=user,
                index=index,
                company_id=company_id,
                investment=investment,
                weight=weight_per_company
            )
            votes.append(vote)
        
        # Bulk create votes
        created_votes = Vote.objects.bulk_create(votes)
        
        # Update vote counts for all companies
        for company_id in company_ids:
            company = Company.objects.get(pk=company_id)
            CompanyVoteCount.update_vote_count(index, company)
        
        # Mark investment as voted using the new has_voted flag
        # Keep status as ACTIVE so it still counts in portfolio calculations
        investment.has_voted = True
        investment.status = 'VOTED'    
        investment.save()
        
        return created_votes 