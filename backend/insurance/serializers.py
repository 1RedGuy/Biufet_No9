from rest_framework import serializers
from .models import InsurancePolicy, InsuranceClaim
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta


class InsurancePolicySerializer(serializers.ModelSerializer):
    investment_details = serializers.SerializerMethodField()
    is_eligible_for_claim = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = InsurancePolicy
        fields = [
            'id',
            'investment',
            'investment_details',
            'premium_amount',
            'coverage_amount',
            'status',
            'created_at',
            'expires_at',
            'updated_at',
            'is_eligible_for_claim',
        ]
        read_only_fields = [
            'id',
            'user',
            'premium_amount',
            'coverage_amount',
            'status',
            'created_at',
            'expires_at',
            'updated_at',
        ]
    
    def get_investment_details(self, obj):
        from investments.serializers import InvestmentSerializer
        return InvestmentSerializer(obj.investment).data
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['is_eligible_for_claim'] = instance.is_eligible_for_claim()
        return data
    
    def create(self, validated_data):
        # Set user to the current user
        validated_data['user'] = self.context['request'].user
        
        # Calculate premium amount (5% of investment amount)
        investment = validated_data['investment']
        investment_amount = investment.amount
        premium_amount = investment_amount * Decimal('0.05')
        validated_data['premium_amount'] = premium_amount
        
        # Calculate coverage amount (up to $5,000)
        coverage_amount = min(investment_amount, Decimal('5000.00'))
        validated_data['coverage_amount'] = coverage_amount
        
        # Set expiration date (1 year from now)
        validated_data['expires_at'] = timezone.now() + timedelta(days=365)
        
        # Create the policy
        return super().create(validated_data)


class InsuranceClaimSerializer(serializers.ModelSerializer):
    policy_details = serializers.SerializerMethodField()
    
    class Meta:
        model = InsuranceClaim
        fields = [
            'id',
            'policy',
            'policy_details',
            'status',
            'created_at',
            'processed_at',
            'amount_claimed',
            'amount_paid',
            'rejection_reason',
        ]
        read_only_fields = [
            'id',
            'status',
            'created_at',
            'processed_at',
            'amount_paid',
            'rejection_reason',
        ]
    
    def get_policy_details(self, obj):
        return InsurancePolicySerializer(obj.policy).data
    
    def create(self, validated_data):
        # Set amount claimed to the policy's calculated payout amount
        policy = validated_data['policy']
        amount_claimed = policy.calculate_payout_amount()
        validated_data['amount_claimed'] = amount_claimed
        
        # Create the claim
        return super().create(validated_data) 