"""
URL configuration for users app.
"""

from django.urls import path
from .views import RegisterView, ProfileView, PreferencesView, DashboardStatsView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('preferences/', PreferencesView.as_view(), name='preferences'),
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard'),
]
