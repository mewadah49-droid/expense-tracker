from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserPreferences


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'monthly_budget', 'currency', 'is_active']
    list_filter = ['is_active', 'currency', 'created_at']
    search_fields = ['email', 'username']
    ordering = ['-created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Financial Profile', {'fields': ('monthly_budget', 'currency', 'phone')}),
    )


@admin.register(UserPreferences)
class UserPreferencesAdmin(admin.ModelAdmin):
    list_display = ['user', 'ai_categorization_enabled', 'email_notifications']
