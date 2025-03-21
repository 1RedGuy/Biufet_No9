from django.contrib import admin
from .models import Vote, CompanyVoteCount

@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ('user', 'index', 'company', 'investment', 'weight', 'created_at')
    list_filter = ('index', 'created_at')
    search_fields = ('user__username', 'company__name', 'index__name')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(CompanyVoteCount)
class CompanyVoteCountAdmin(admin.ModelAdmin):
    list_display = ('company', 'index', 'total_weight', 'vote_count', 'last_updated')
    list_filter = ('index', 'last_updated')
    search_fields = ('company__name', 'index__name')
    readonly_fields = ('last_updated',) 