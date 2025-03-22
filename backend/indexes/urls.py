from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IndexViewSet

router = DefaultRouter()
router.register(r'', IndexViewSet, basename='index')

urlpatterns = [
    path('', include(router.urls)),
] 