from rest_framework import serializers
from .models import Index
from companies.models import Company
from companies.serializers import CompanySerializer
from investments.models import Investment
from django.db.models import Sum, Count

class IndexSerializer(serializers.ModelSerializer):
    companies = CompanySerializer(many=True, read_only=True)
    company_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        source='companies',
        queryset=Company.objects.all()
    )
    company_count = serializers.SerializerMethodField()
    total_investment = serializers.SerializerMethodField()

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
            'min_votes_per_user',
            'max_votes_per_user',
            'investment_start_date',
            'investment_end_date',
            'voting_start_date',
            'voting_end_date',
            'lock_period_months',
            'status',
            'created_at',
            'updated_at',
            'company_count',
            'total_investment'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_company_count(self, obj):
        return obj.companies.count()

    def get_total_investment(self, obj):
        total = Investment.objects.filter(
            index=obj,
            status='ACTIVE'
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0
        return total