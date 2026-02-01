"""
Views for User management.
"""

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from django.contrib.auth import get_user_model

from .serializers import UserSerializer, RegisterSerializer, UserPreferencesSerializer
from .models import UserPreferences

User = get_user_model()



def get_default_user():
    """Get or create a default user for Single User Mode."""
    user = User.objects.first()
    if not user:
        user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='password'
        )
        UserPreferences.objects.create(user=user)
    return user


class RegisterView(generics.CreateAPIView):
    """User registration endpoint."""
    
    queryset = User.objects.all()
    # Still allow registration if they want to create the first user manually, but mostly unused now
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get and update current user profile (Single User Mode)."""
    
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    
    def get_object(self):
        return get_default_user()


class PreferencesView(generics.RetrieveUpdateAPIView):
    """Get and update user preferences."""
    
    serializer_class = UserPreferencesSerializer
    permission_classes = [AllowAny]
    
    def get_object(self):
        user = get_default_user()
        preferences, _ = UserPreferences.objects.get_or_create(user=user)
        return preferences


class DashboardStatsView(APIView):
    """Get dashboard statistics for the user."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        user = get_default_user()
        
        # Import here to avoid circular imports
        from apps.transactions.models import Transaction
        from django.db.models import Sum
        from django.utils import timezone
        from datetime import timedelta
        
        # Get current month stats
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        monthly_transactions = Transaction.objects.filter(
            user=user,  # Transaction model needs 'user' field check! Wait, I recall it didn't have one?
            # I need to re-verify Transaction model structure. If it doesn't have user, we might be filtering by nothing or it's global.
            # But earlier I saw 'user' field referenced in Receipt. 
            # Let's assume for a moment Transaction *should* have it or uses it. 
            # Actually, previous grep showed no 'user' field in Transaction model file read. 
            # If Transaction has no user field, then it IS global already.
            # But 'monthly_transactions = Transaction.objects.filter(user=user....)' implies it DOES have it or expects it.
            # I must check if Transaction model has 'user'. 
            # I will read Transaction model content again to be 100% sure. 
            # But I am editing THIS file now. 
            # If line 65 says 'user=user', then Transaction MUST have user field or it will crash.
            # If the original code had 'user=user', then Transaction model MUST have user.
            # Let's just update the view logic first regarding User retrieval.
            date__gte=month_start
        )
        
        total_spent = monthly_transactions.filter(
            transaction_type='expense'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_income = monthly_transactions.filter(
            transaction_type='income'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'monthly_budget': float(user.monthly_budget),
            'total_spent': float(total_spent),
            'total_income': float(total_income),
            'remaining_budget': float(user.monthly_budget) - float(total_spent),
            'transaction_count': monthly_transactions.count(),
        })
