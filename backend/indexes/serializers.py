from rest_framework import serializers
from .models import Index
from companies.models import Company
from companies.serializers import CompanySerializer

class IndexSerializer(serializers.ModelSerializer):
    companies = CompanySerializer(many=True, read_only=True)
    company_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        source='companies',
        queryset=Company.objects.all()
    )

    class Meta:
        model = Index
        fields = [
            'id',
            'name',
            'description',
            'companies',
            'company_ids',
            'min_companies',
            'max_companies',
            'status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at'] 