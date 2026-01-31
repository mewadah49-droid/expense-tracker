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

urlpatterns = [
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
