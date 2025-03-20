from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SignUpView, 
    CustomTokenObtainPairView,
    PasswordResetView,
    UserViewSet,
    PortfolioViewSet
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'portfolio', PortfolioViewSet, basename='portfolio')

urlpatterns = [
    path('signup/', SignUpView.as_view(), name='signup'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('password-reset/', PasswordResetView.as_view(), name='password-reset'),
    path('', include(router.urls)),
]