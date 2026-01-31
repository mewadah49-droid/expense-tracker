"""
Views for Analytics and ML-powered insights.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .services.forecasting import BudgetForecastingService


class SpendingForecastView(APIView):
    """Get AI-powered spending forecast."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        months = int(request.query_params.get('months', 3))
        months = min(max(months, 1), 12)  # Limit between 1-12
        
        service = BudgetForecastingService(request.user)
        forecast = service.get_spending_forecast(months_ahead=months)
        
        return Response(forecast)


class CategoryForecastView(APIView):
    """Get forecast for a specific category."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, category_id):
        weeks = int(request.query_params.get('weeks', 4))
        weeks = min(max(weeks, 1), 12)
        
        service = BudgetForecastingService(request.user)
        forecast = service.get_category_forecast(
            category_id=category_id,
            weeks_ahead=weeks
        )
        
        return Response(forecast)


class AnomalyDetectionView(APIView):
    """Detect unusual spending patterns."""
    
    permission_classes = [IsAuthenticated]
    
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
