from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InsurancePolicyViewSet, ClaimViewSet, CoveragePaymentViewSet

router = DefaultRouter()
router.register(r'policies', InsurancePolicyViewSet, basename='insurance-policy')
router.register(r'claims', ClaimViewSet, basename='claim')
router.register(r'payments', CoveragePaymentViewSet, basename='coverage-payment')

urlpatterns = [
    path('', include(router.urls)),
] 