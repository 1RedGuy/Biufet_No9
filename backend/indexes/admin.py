from django.contrib import admin
from .models import Index
from django.db import models

@admin.register(Index)
class IndexAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'description']
    filter_horizontal = ['companies']
    readonly_fields = ['created_at', 'updated_at']
    
    # First save without companies, then allow editing companies
    def get_fieldsets(self, request, obj=None):
        if obj:  # If the object already exists (editing)
            return (
                ('Basic Information', {
                    'fields': ('name', 'description', 'companies', 'status')
                }),
                ('Company Limits', {
                    'fields': ('min_companies', 'max_companies')
                }),
                ('Voting Settings', {
                    'fields': ('min_votes_per_user', 'max_votes_per_user')
                }),
                ('Timestamps', {
                    'fields': ('created_at', 'updated_at'),
                    'classes': ('collapse',)
                }),
            )
        else:  # If creating a new object
            return (
                ('Basic Information', {
                    'fields': ('name', 'description', 'status')
                }),
                ('Company Limits', {
                    'fields': ('min_companies', 'max_companies')
                }),
                ('Voting Settings', {
                    'fields': ('min_votes_per_user', 'max_votes_per_user')
                }),
            )
    
    def save_model(self, request, obj, form, change):
        """
        Custom save method that bypasses validation
        """
        if not change:  # This is a new object
            # Create index directly using the model manager to bypass validation
            new_obj = Index.objects.create(
                name=obj.name,
                description=obj.description,
                status=obj.status,
                min_companies=obj.min_companies,
                max_companies=obj.max_companies,
                min_votes_per_user=obj.min_votes_per_user,
                max_votes_per_user=obj.max_votes_per_user
            )
            # Update the admin form's object with the new object's ID
            obj.pk = new_obj.pk
        else:
            # For editing, update the object directly to bypass validation
            Index.objects.filter(pk=obj.pk).update(
                name=obj.name,
                description=obj.description,
                status=obj.status,
                min_companies=obj.min_companies,
                max_companies=obj.max_companies,
                min_votes_per_user=obj.min_votes_per_user,
                max_votes_per_user=obj.max_votes_per_user
            )
            # Refresh the object from the database
            obj.refresh_from_db()
            
    def save_related(self, request, form, formsets, change):
        """Handle related fields after the model has been saved"""
        super().save_related(request, form, formsets, change)
