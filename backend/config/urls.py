"""
URL configuration for expense_tracker project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.serializers_jwt import EmailTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

from django.http import JsonResponse

def health_check(request):
    return JsonResponse({'status': 'ok'})


def api_ping(request):
    """Simple API ping endpoint to verify routing and CORS."""
    return JsonResponse({'ok': True})

urlpatterns = [
    path('', health_check, name='health_check'),
    path('api/ping/', api_ping, name='api_ping'),
    path('admin/', admin.site.urls),
    
    # JWT Authentication with email
    path('api/auth/token/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API endpoints
    path('api/users/', include('apps.users.urls')),
    path('api/transactions/', include('apps.transactions.urls')),
    path('api/receipts/', include('apps.receipts.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
