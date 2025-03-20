from rest_framework import serializers
from .models import Investment
from indexes.models import Index

class InvestmentSerializer(serializers.ModelSerializer):
    index_name = serializers.CharField(source='index.name', read_only=True)
    user_credits = serializers.DecimalField(source='user.credits', read_only=True, max_digits=20, decimal_places=2)

    class Meta:
        model = Investment
        fields = [
            'id', 'index', 'index_name', 'amount', 'current_value', 'profit_loss',
            'investment_date', 'status', 'transaction_id',
            'withdrawal_eligible', 'lock_period_end', 'user_credits'
        ]
        read_only_fields = [
            'current_value', 'profit_loss', 'transaction_id',
            'withdrawal_eligible', 'status', 'user_credits'
        ]

    def validate(self, data):
        user = self.context['request'].user
        amount = data.get('amount')
        index = data.get('index')

        # Check if user has enough credits
        if user.credits < amount:
            raise serializers.ValidationError(
                f"Insufficient credits. You have {user.credits} credits, but the investment requires {amount} credits."
            )

        # Check if index exists and is active
        if not index.is_active:
            raise serializers.ValidationError(
                f"Index {index.name} is not currently active for investments."
            )

        # Check if amount is within index limits
        if amount < index.min_investment:
            raise serializers.ValidationError(
                f"Minimum investment for this index is {index.min_investment} credits."
            )
        if amount > index.max_investment:
            raise serializers.ValidationError(
                f"Maximum investment for this index is {index.max_investment} credits."
            )

        return data 