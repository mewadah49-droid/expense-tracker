"""
Serializers for User management.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserPreferences

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details."""
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'monthly_budget', 'currency', 'avatar',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(
        write_only=True, required=True, min_length=6
    )
    password_confirm = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'monthly_budget', 'currency'
        ]
        extra_kwargs = {
            'username': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False},
            'monthly_budget': {'required': False},
            'currency': {'required': False},
        }
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password': "Password fields didn't match."
            })
        
        # Auto-generate username from email if not provided
        if not attrs.get('username'):
            attrs['username'] = attrs['email'].split('@')[0]
            # Ensure unique username
            base_username = attrs['username']
            counter = 1
            while User.objects.filter(username=attrs['username']).exists():
                attrs['username'] = f"{base_username}{counter}"
                counter += 1
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Set defaults
        if 'monthly_budget' not in validated_data:
            validated_data['monthly_budget'] = 0
        if 'currency' not in validated_data:
            validated_data['currency'] = 'INR'
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        # Create default preferences
        UserPreferences.objects.create(user=user)
        return user


class UserPreferencesSerializer(serializers.ModelSerializer):
    """Serializer for user preferences."""
    
    class Meta:
        model = UserPreferences
        fields = [
            'ai_categorization_enabled', 'auto_budget_alerts',
            'email_notifications', 'push_notifications', 'weekly_report'
        ]
