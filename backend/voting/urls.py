from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VoteViewSet, CompanyVoteCountViewSet, IndexVotingStatusView

router = DefaultRouter()
router.register(r'votes', VoteViewSet, basename='vote')
router.register(r'company-vote-counts', CompanyVoteCountViewSet, basename='company-vote-count')

urlpatterns = [
    path('', include(router.urls)),
    path('index-voting-status/', IndexVotingStatusView.as_view(), name='index-voting-status'),
] 