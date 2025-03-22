from rest_framework import serializers
from .models import Company

class CompanySerializer(serializers.ModelSerializer):
    # Add price field for compatibility with frontend
    price = serializers.DecimalField(
        source='current_price', 
        max_digits=20, 
        decimal_places=2
    )
    
    # Add ticker field for compatibility with frontend
    ticker = serializers.CharField(source='symbol', read_only=True)
    
    class Meta:
        model = Company
        fields = [
            'id',
            'name',
            'symbol',
            'ticker',
            'sector',
            'current_price',
            'price',
            'price_change',
            'market_cap',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at'] 