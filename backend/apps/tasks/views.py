from rest_framework import viewsets, permissions
from .models import Task
from .serializers import TaskSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.AllowAny]  # Allow access without auth for now (Single User Mode)

    def get_queryset(self):
        # Return all tasks for now (Single User Mode)
        return Task.objects.all()

    def perform_create(self, serializer):
        # Assign to the first user (default user) since we don't have auth token
        user = User.objects.first()
        if not user:
            # Fallback if no user exists (should verify this doesn't happen in prod)
            user, _ = User.objects.get_or_create(username='default_user', email='default@example.com')
        serializer.save(user=user)
