from django.contrib import admin
from .models import InsurancePolicy, InsuranceClaim


@admin.register(InsurancePolicy)
class InsurancePolicyAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'investment', 'premium_amount', 'coverage_amount', 'status', 'created_at', 'expires_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'investment__id')
    date_hierarchy = 'created_at'


@admin.register(InsuranceClaim)
class InsuranceClaimAdmin(admin.ModelAdmin):
    list_display = ('id', 'policy', 'status', 'amount_claimed', 'amount_paid', 'created_at', 'processed_at')
    list_filter = ('status', 'created_at')
    search_fields = ('policy__user__username', 'policy__investment__id')
    date_hierarchy = 'created_at'
    readonly_fields = ('amount_claimed', 'created_at') 