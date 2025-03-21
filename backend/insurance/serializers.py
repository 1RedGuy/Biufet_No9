from rest_framework import serializers
from .models import InsurancePolicy, CoveragePayment, Claim
from django.utils import timezone
from decimal import Decimal

class CoveragePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoveragePayment
        fields = ['id', 'amount', 'payment_date', 'payment_status', 'transaction_id']
        read_only_fields = ['payment_date']

class ClaimSerializer(serializers.ModelSerializer):
    is_eligible = serializers.BooleanField(read_only=True)
    calculated_payout = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)

    class Meta:
        model = Claim
        fields = ['id', 'current_investment_value', 'claim_amount', 'submission_date', 
                 'status', 'processed_date', 'notes', 'is_eligible', 'calculated_payout']
        read_only_fields = ['submission_date', 'status', 'processed_date', 'claim_amount']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['is_eligible'] = instance.is_eligible()
        if instance.is_eligible():
            data['calculated_payout'] = str(instance.policy.calculate_payout_amount(instance.current_investment_value))
        else:
            data['calculated_payout'] = "0.00"
        return data

class InsurancePolicySerializer(serializers.ModelSerializer):
    payments = CoveragePaymentSerializer(many=True, read_only=True)
    claims = ClaimSerializer(many=True, read_only=True)
    calculated_premium = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    index_name = serializers.CharField(source='index.name', read_only=True)

    class Meta:
        model = InsurancePolicy
        fields = ['id', 'user', 'index', 'index_name', 'initial_investment_amount', 
                 'coverage_amount', 'monthly_premium', 'risk_factor', 'trigger_percentage',
                 'start_date', 'end_date', 'is_active', 'has_claim', 'payments', 
                 'claims', 'calculated_premium']
        read_only_fields = ['start_date', 'has_claim', 'coverage_amount', 'user']

    def validate(self, data):
        # Validate minimum investment amount
        if data.get('initial_investment_amount', 0) < 5000:
            raise serializers.ValidationError(
                "Investment amount must be at least $5,000 to be eligible for insurance."
            )

        # Validate end_date is in the future
        if 'end_date' in data and data['end_date'] <= timezone.now():
            raise serializers.ValidationError(
                "End date must be in the future."
            )

        # Validate coverage amount doesn't exceed maximum
        if data.get('coverage_amount', 0) > 5000:
            raise serializers.ValidationError(
                "Maximum coverage amount is 5,000 credits."
            )

        return data

    def create(self, validated_data):
        # Get the user from the context
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)

    def get_calculated_premium(self, obj):
        return obj.calculate_premium() 