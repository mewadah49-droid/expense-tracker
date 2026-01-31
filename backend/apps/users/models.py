"""
Custom User model with additional profile fields for expense tracking.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Extended User model with financial profile settings."""
    
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    
    # Financial preferences
    monthly_budget = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Monthly spending budget"
    )
    currency = models.CharField(max_length=3, default='INR')
    
    # Fix reverse accessor clashes
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_groups',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )
    
    # Profile
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.email or self.username


class UserPreferences(models.Model):
    """User preferences for notifications and AI features."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    
    # AI Features
    ai_categorization_enabled = models.BooleanField(default=True)
    auto_budget_alerts = models.BooleanField(default=True)
    
    # Notifications
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=False)
    weekly_report = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'user_preferences'
    
    def __str__(self):
        return f"Preferences for {self.user.email}"
