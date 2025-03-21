from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import VotingSession, Vote, VotingResult

@admin.register(VotingSession)
class VotingSessionAdmin(admin.ModelAdmin):
    list_display = ('index', 'status', 'start_date', 'end_date', 'total_votes', 'unique_voters')
    list_filter = ('status',)
    search_fields = ('index__name',)
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('index', 'status')
        }),
        (_('Schedule'), {
            'fields': ('start_date', 'end_date')
        }),
        (_('Settings'), {
            'fields': ('min_votes_required', 'max_votes_allowed', 'min_investors')
        }),
        (_('Metadata'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ('user', 'company', 'session', 'created_at')
    list_filter = ('session__status',)
    search_fields = ('user__username', 'company__name', 'session__index__name')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at',)


@admin.register(VotingResult)
class VotingResultAdmin(admin.ModelAdmin):
    list_display = ('company', 'session', 'vote_count', 'percentage', 'rank')
    list_filter = ('session__status',)
    search_fields = ('company__name', 'session__index__name')
    readonly_fields = ('calculated_at',)
    ordering = ('session', 'rank')
