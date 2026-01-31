"""
Custom JWT serializers for email-based authentication.
"""

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that allows login with email instead of username.
    Accepts both 'email' and 'username' fields.
    """
    
    def validate(self, attrs):
        # Accept either 'email' or 'username' field
        email = attrs.get('email') or attrs.get('username')
        password = attrs.get('password')
        
        if email:
            try:
                user = User.objects.get(email=email)
                # Set username for parent validation
                attrs['username'] = user.username
            except User.DoesNotExist:
                # Try as username if not email
                pass
        
        return super().validate(attrs)
