"""
Views for Analytics and ML-powered insights.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .services.forecasting import BudgetForecastingService


class DashboardStatsView(APIView):
    """Get dashboard statistics."""
    
    permission_classes = []  # No authentication required
    
    def get(self, request):
        # Import here to avoid circular imports
        from apps.transactions.models import Transaction
        from django.db.models import Sum
        from django.utils import timezone
        
        # Get current month stats (no user filtering)
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        monthly_transactions = Transaction.objects.filter(
            date__gte=month_start
        )
        
        total_spent = monthly_transactions.filter(
            transaction_type='expense'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_income = monthly_transactions.filter(
            transaction_type='income'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'monthly_budget': 0,  # No user-specific budget
            'total_spent': float(total_spent),
            'total_income': float(total_income),
            'remaining_budget': float(total_income) - float(total_spent),  # Simplified
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
        service = BudgetForecastingService(request.user)
        anomalies = service.detect_anomalies()
        
        return Response({
            'anomalies': anomalies,
            'count': len(anomalies)
        })


class SpendingInsightsView(APIView):
    """Get comprehensive spending insights."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        service = BudgetForecastingService(request.user)
        insights = service.get_spending_insights()
        
        return Response(insights)
