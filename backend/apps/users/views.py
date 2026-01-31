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


class RegisterView(generics.CreateAPIView):
    """User registration endpoint."""
    
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get and update current user profile."""
    
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class PreferencesView(generics.RetrieveUpdateAPIView):
    """Get and update user preferences."""
    
    serializer_class = UserPreferencesSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        preferences, _ = UserPreferences.objects.get_or_create(user=self.request.user)
        return preferences


class DashboardStatsView(APIView):
    """Get dashboard statistics for the user."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Import here to avoid circular imports
        from apps.transactions.models import Transaction
        from django.db.models import Sum
        from django.utils import timezone
        from datetime import timedelta
        
        # Get current month stats
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        monthly_transactions = Transaction.objects.filter(
            user=user,
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
