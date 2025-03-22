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
    current_risk_factor = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = InsurancePolicy
        fields = ['id', 'user', 'index', 'index_name', 'initial_investment_amount', 
                 'coverage_amount', 'monthly_premium', 'risk_factor', 'current_risk_factor',
                 'trigger_percentage', 'start_date', 'end_date', 'is_active', 
                 'has_claim', 'payments', 'claims', 'calculated_premium']
        read_only_fields = ['start_date', 'has_claim', 'coverage_amount', 'user', 
                           'risk_factor', 'current_risk_factor']

    def calculate_coverage_amount(self, investment_amount):
        """
        Calculate coverage amount based on investment amount:
        - For investments >= 5000: fixed 5000 credits coverage
        - For investments < 5000: proportional coverage based on investment size
          Formula: (investment_amount / 5000) * 5000
          This gives a proportional coverage up to the maximum
        """
        if investment_amount >= Decimal('5000.00'):
            return Decimal('5000.00')
        
        # Calculate proportional coverage
        coverage = (investment_amount / Decimal('5000.00')) * Decimal('5000.00')
        # Round to 2 decimal places
        return coverage.quantize(Decimal('0.01'))

    def validate(self, data):
        investment_amount = data.get('initial_investment_amount', 0)
        
        # Calculate appropriate coverage amount
        coverage_amount = self.calculate_coverage_amount(Decimal(str(investment_amount)))
        data['coverage_amount'] = coverage_amount

        # Validate end_date is in the future
        if 'end_date' in data and data['end_date'] <= timezone.now():
            raise serializers.ValidationError(
                "End date must be in the future."
            )

        return data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['current_risk_factor'] = str(instance.calculate_risk_factor())
        data['calculated_premium'] = str(instance.calculate_premium())
        return data

    def create(self, validated_data):
        # Get the user from the context
        user = self.context['request'].user
        validated_data['user'] = user
        
        # Calculate coverage amount based on investment amount
        investment_amount = validated_data.get('initial_investment_amount')
        validated_data['coverage_amount'] = self.calculate_coverage_amount(investment_amount)
            
        # Create the policy
        policy = super().create(validated_data)
        
        # Calculate and set initial risk factor
        policy.risk_factor = policy.calculate_risk_factor()
        policy.save(update_fields=['risk_factor'])
        
        return policy 