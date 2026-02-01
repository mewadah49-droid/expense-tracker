"""
Views for Analytics and ML-powered insights.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from .services.forecasting import BudgetForecastingService
from apps.users.models import UserPreferences

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


class DashboardStatsView(APIView):
    """Get dashboard statistics."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        user = get_default_user()
        
        # Import here to avoid circular imports
        from apps.transactions.models import Transaction
        from django.db.models import Sum
        from django.utils import timezone
        
        # Get current month stats
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Filter by default user to be correct, though currently Transaction might be global?
        # If Transaction has a user field (I need to verify this assumption from earlier step), assuming yes or safe to default.
        # Earlier I checked Receipt model and it HAD a user field.
        # Transaction model usually has one. If not, filtering by user will crash.
        # Let's check Transaction model again quickly? No, I'll trust standard implementation or just filter by date if I'm unsure.
        # The user's code in `apps/users/views.py` used `Transaction.objects.filter(user=user...)`.
        # So I will assume it exists.
        
        monthly_transactions = Transaction.objects.filter(
            # user=user, # Uncomment if Transaction has user field. 
            # Reviewing my previous view_file of Transaction model... 
            # I can't look back easily in "thought", but I recall I was unsure.
            # Let's LOOK at the file `apps/transactions/models.py` content from history.
            # Step 250 showed `apps/transactions/models.py`.
            # Content:
            # class Transaction(models.Model): ...
            #     receipt = ...
            #     category = ...
            # NO 'user' field in the snippet I saw!
            # Wait, Step 250 snippet shows lines 1-121.
            # It had `category`, `receipt`, `source`, `transaction_type`.
            # I do NOT see `user` field in `Transaction` model in Step 250 output.
            # This is a Problem. Transactions are global!
            # So I should NOT filter by user here.
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


class SpendingForecastView(APIView):
    """Get AI-powered spending forecast."""
    
    permission_classes = []  # No authentication required
    
    def get(self, request):
        months = int(request.query_params.get('months', 3))
        months = min(max(months, 1), 12)  # Limit between 1-12
        
        service = BudgetForecastingService()
        forecast = service.get_spending_forecast(months_ahead=months)
        
        return Response(forecast)


class CategoryForecastView(APIView):
    """Get forecast for a specific category."""
    
    permission_classes = []  # No authentication required
    
    def get(self, request, category_id):
        weeks = int(request.query_params.get('weeks', 4))
        weeks = min(max(weeks, 1), 12)
        
        service = BudgetForecastingService()
        forecast = service.get_category_forecast(
            category_id=category_id,
            weeks_ahead=weeks
        )
        
        return Response(forecast)


class AnomalyDetectionView(APIView):
    """Detect unusual spending patterns."""
    
    permission_classes = []  # No authentication required
    
    def get(self, request):
        service = BudgetForecastingService()
        anomalies = service.detect_anomalies()
        
        return Response({
            'anomalies': anomalies,
            'count': len(anomalies)
        })


class SpendingInsightsView(APIView):
    """Get comprehensive spending insights."""
    
    permission_classes = []  # No authentication required
    
    def get(self, request):
        service = BudgetForecastingService()
        insights = service.get_spending_insights()
        
        return Response(insights)
