from .models import CustomUser
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.hashers import make_password

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
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']
        extra_kwargs = {
            'password': {'write_only': True},
            'first_name': {'required': True},
            'last_name': {'required': True}
        }

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data.get('password'))
        return CustomUser.objects.create(**validated_data)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        return token

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

    
