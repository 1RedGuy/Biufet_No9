from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializer import (
    UserSerializer, 
    CustomTokenObtainPairSerializer,
    PasswordResetSerializer
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import CustomUser, Portfolio
from .serializer import (
    PortfolioSerializer,
    PortfolioHistorySerializer
)

class SignUpView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            if user:
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

class PasswordResetView(APIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            password = serializer.validated_data['password']
            
            user.set_password(password)
            user.save()
            
            return Response(
                {"message": "Password has been reset successfully."},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PortfolioViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PortfolioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Portfolio.objects.filter(user=self.request.user)

    @action(detail=True)
    def history(self, request, pk=None):
        portfolio = self.get_object()
        history = portfolio.history.all()[:30]  # Last 30 entries
        serializer = PortfolioHistorySerializer(history, many=True)
        return Response(serializer.data)


    