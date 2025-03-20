from django.contrib import admin
from .models import Index

@admin.register(Index)
class IndexAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'description']
    filter_horizontal = ['companies']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'companies', 'status')
        }),
        ('Company Limits', {
            'fields': ('min_companies', 'max_companies')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
