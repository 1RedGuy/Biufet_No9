from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VotingSessionViewSet, VoteViewSet, VotingResultViewSet

router = DefaultRouter()
router.register(r'sessions', VotingSessionViewSet)
router.register(r'votes', VoteViewSet)
router.register(r'results', VotingResultViewSet)

app_name = 'voting'

urlpatterns = [
    path('', include(router.urls)),
] 