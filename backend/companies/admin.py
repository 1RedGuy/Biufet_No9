from django.contrib import admin
from .models import Company

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'symbol', 'current_price', 'market_cap', 'is_active']
    search_fields = ['name', 'symbol']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']
