"""
URL configuration for analytics app.
"""

from django.urls import path
from .views import (
    DashboardStatsView,
    MonthlyTrendsView,
    CategoryBreakdownView,
    TopExpensesView,
    SpendingComparisonView,
    WeeklyAnalyticsView,
    DailyAnalyticsView
)

urlpatterns = [
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('trends/', MonthlyTrendsView.as_view(), name='monthly-trends'),
    path('categories/', CategoryBreakdownView.as_view(), name='category-breakdown'),
    path('top-expenses/', TopExpensesView.as_view(), name='top-expenses'),
    path('comparison/', SpendingComparisonView.as_view(), name='spending-comparison'),
    path('weekly/', WeeklyAnalyticsView.as_view(), name='weekly-analytics'),
    path('daily/', DailyAnalyticsView.as_view(), name='daily-analytics'),
]
