from django.contrib import admin
from .models import InsurancePolicy, CoveragePayment, Claim

@admin.register(InsurancePolicy)
class InsurancePolicyAdmin(admin.ModelAdmin):
    list_display = ('user', 'index', 'initial_investment_amount', 'coverage_amount', 
                   'monthly_premium', 'risk_factor', 'is_active', 'has_claim')
    list_filter = ('is_active', 'has_claim', 'risk_factor')
    search_fields = ('user__username', 'index__name')
    date_hierarchy = 'start_date'

@admin.register(CoveragePayment)
class CoveragePaymentAdmin(admin.ModelAdmin):
    list_display = ('policy', 'amount', 'payment_date', 'payment_status', 'transaction_id')
    list_filter = ('payment_status', 'payment_date')
    search_fields = ('policy__user__username', 'transaction_id')
    date_hierarchy = 'payment_date'

@admin.register(Claim)
class ClaimAdmin(admin.ModelAdmin):
    list_display = ('policy', 'current_investment_value', 'claim_amount', 
                   'submission_date', 'status', 'processed_date')
    list_filter = ('status', 'submission_date')
    search_fields = ('policy__user__username', 'notes')
    date_hierarchy = 'submission_date'
