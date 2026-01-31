"""
URL configuration for analytics app.
"""

from django.urls import path
from .views import (
    SpendingForecastView, CategoryForecastView,
    AnomalyDetectionView, SpendingInsightsView, DashboardStatsView
)

urlpatterns = [
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('forecast/', SpendingForecastView.as_view(), name='spending-forecast'),
    path('forecast/category/<int:category_id>/', CategoryForecastView.as_view(), name='category-forecast'),
    path('anomalies/', AnomalyDetectionView.as_view(), name='anomaly-detection'),
    path('insights/', SpendingInsightsView.as_view(), name='spending-insights'),
]
