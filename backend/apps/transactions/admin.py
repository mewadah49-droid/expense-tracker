from django.contrib import admin
from .models import Category, Transaction, Budget


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'is_income', 'created_at']
    list_filter = ['is_income']
    search_fields = ['name']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['amount', 'description', 'category', 'transaction_type', 'date', 'source']
    list_filter = ['transaction_type', 'source', 'date']
    search_fields = ['description', 'merchant']
    date_hierarchy = 'date'
    ordering = ['-date']


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['category', 'amount', 'period', 'is_active']
    list_filter = ['period', 'is_active']
