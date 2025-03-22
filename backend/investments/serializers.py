from rest_framework import serializers
from .models import Investment, InvestmentPosition
from indexes.models import Index
from indexes.serializers import IndexSerializer
from companies.models import Company
from companies.serializers import CompanySerializer
from decimal import Decimal
from django.utils import timezone

class InvestmentPositionSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    company_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        source='company',
        queryset=Company.objects.all()
    )
    profit_loss = serializers.DecimalField(
        max_digits=20,
        decimal_places=2,
        read_only=True
    )
    profit_loss_percentage = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = InvestmentPosition
        fields = [
            'id',
            'company',
            'company_id',
            'amount',
            'quantity',
            'purchase_price',
            'current_price',
            'weight',
            'profit_loss',
            'profit_loss_percentage',
            'last_updated'
        ]
        read_only_fields = ['id', 'last_updated']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['profit_loss'] = instance.calculate_profit_loss()
        data['profit_loss_percentage'] = instance.calculate_profit_loss_percentage()
        return data

class InvestmentSerializer(serializers.ModelSerializer):
    index = IndexSerializer(read_only=True)
    index_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        source='index',
        queryset=Index.objects.all()
    )
    positions = InvestmentPositionSerializer(many=True, read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Investment
        fields = [
            'id',
            'username',
            'index',
            'index_id',
            'amount',
            'current_value',
            'profit_loss',
            'profit_loss_percentage',
            'investment_date',
            'status',
            'transaction_id',
            'withdrawal_eligible',
            'lock_period_end',
            'last_updated',
            'positions',
            'insurance_claimed'
        ]
        read_only_fields = [
            'id',
            'username',
            'current_value',
            'profit_loss',
            'profit_loss_percentage',
            'investment_date',
            'withdrawal_eligible',
            'last_updated',
            'transaction_id',
            'lock_period_end'
        ]

    def validate_amount(self, value):
        """Validate investment amount"""
        min_investment = Decimal('100.00')  # Minimum investment amount
        if value < min_investment:
            raise serializers.ValidationError(
                f'Minimum investment amount is {min_investment}'
            )
        return value

    def validate_lock_period_end(self, value):
        """Validate lock period end date"""
        if value <= timezone.now():
            raise serializers.ValidationError(
                'Lock period end date must be in the future'
            )
        return value

    def validate_index_id(self, index):
        """Validate that the index is in an investable state"""
        if index.status != 'ACTIVE':
            raise serializers.ValidationError(
                f'Cannot invest in index with status: {index.get_status_display()}. Only active indexes are available for investment.'
            )
        return index

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        validated_data['current_value'] = validated_data['amount']
        return super().create(validated_data) 