from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SignUpView, 
    CustomTokenObtainPairView,
    PasswordResetView,
    UserViewSet,
    PortfolioViewSet,
    UserProfileView
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'portfolio', PortfolioViewSet, basename='portfolio')

urlpatterns = [
    path('', include(router.urls)),
    path('signup/', SignUpView.as_view(), name='signup'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('reset-password/', PasswordResetView.as_view(), name='reset-password'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]