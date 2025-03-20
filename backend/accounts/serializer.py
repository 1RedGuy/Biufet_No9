from .models import CustomUser, Portfolio, PortfolioHistory
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.hashers import make_password
import logging

logger = logging.getLogger(__name__)

class UserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        required=True,
        help_text="Required username, max length 150 characters"
    )
    email = serializers.EmailField(
        required=True,
        help_text="Required valid email address"
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password', 'placeholder': 'Password'},
        help_text="Required. Your password must be at least 8 characters long"
    )
    first_name = serializers.CharField(
        required=True,
        help_text="Required. Your first name"
    )
    last_name = serializers.CharField(
        required=True,
        help_text="Required. Your last name"
    )

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 'credits')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data.get('password'))
        return super().create(validated_data)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        logger.debug(f"Generated token for user {user.username}")
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        logger.debug(f"Login attempt for user: {attrs.get('username')}")
        logger.debug(f"Generated tokens: access (first 20 chars): {data.get('access', '')[:20]}")
        return data

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField(
        required=True,
        help_text='Email associated with your account'
    )
    password = serializers.CharField(
        min_length=8,
        max_length=128,
        write_only=True,
        required=True,
        style={'input_type': 'password', 'placeholder': 'Password'},
        help_text='New password'
    )
    confirm_password = serializers.CharField(
        min_length=8,
        max_length=128,
        write_only=True,
        required=True,
        style={'input_type': 'password', 'placeholder': 'Confirm Password'},
        help_text='Confirm new password'
    )

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        try:
            user = CustomUser.objects.get(email=attrs['email'])
            attrs['user'] = user
            return attrs
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({"email": "No user found with this email address"})

class PortfolioSerializer(serializers.ModelSerializer):
    user_credits = serializers.DecimalField(source='user.credits', read_only=True, max_digits=20, decimal_places=2)
    
    class Meta:
        model = Portfolio
        fields = ['total_value', 'total_profit_loss', 'last_updated', 'user_credits']
        read_only_fields = fields

class PortfolioHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioHistory
        fields = ['value', 'profit_loss', 'timestamp']
        read_only_fields = fields

    
