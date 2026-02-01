"""
Script to create default categories for the expense tracker.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.transactions.models import Category

# Default expense categories
expense_categories = [
    {'name': 'Food & Dining', 'icon': '🍔', 'color': '#f59e0b', 'is_income': False},
    {'name': 'Transportation', 'icon': '🚗', 'color': '#3b82f6', 'is_income': False},
    {'name': 'Shopping', 'icon': '🛍️', 'color': '#ec4899', 'is_income': False},
    {'name': 'Entertainment', 'icon': '🎬', 'color': '#8b5cf6', 'is_income': False},
    {'name': 'Healthcare', 'icon': '🏥', 'color': '#ef4444', 'is_income': False},
    {'name': 'Utilities', 'icon': '💡', 'color': '#10b981', 'is_income': False},
    {'name': 'Groceries', 'icon': '🛒', 'color': '#059669', 'is_income': False},
    {'name': 'Education', 'icon': '📚', 'color': '#6366f1', 'is_income': False},
    {'name': 'Travel', 'icon': '✈️', 'color': '#0ea5e9', 'is_income': False},
    {'name': 'Housing', 'icon': '🏠', 'color': '#84cc16', 'is_income': False},
    {'name': 'Personal Care', 'icon': '💆', 'color': '#a855f7', 'is_income': False},
    {'name': 'Bills', 'icon': '📄', 'color': '#64748b', 'is_income': False},
    {'name': 'Other Expenses', 'icon': '📦', 'color': '#6b7280', 'is_income': False},
]

# Default income categories
income_categories = [
    {'name': 'Salary', 'icon': '💰', 'color': '#10b981', 'is_income': True},
    {'name': 'Freelance', 'icon': '💼', 'color': '#14b8a6', 'is_income': True},
    {'name': 'Investment', 'icon': '📈', 'color': '#22c55e', 'is_income': True},
    {'name': 'Business', 'icon': '🏢', 'color': '#059669', 'is_income': True},
    {'name': 'Other Income', 'icon': '💵', 'color': '#16a34a', 'is_income': True},
]

all_categories = expense_categories + income_categories

# Create categories
created_count = 0
for cat_data in all_categories:
    category, created = Category.objects.get_or_create(
        name=cat_data['name'],
        defaults={
            'icon': cat_data['icon'],
            'color': cat_data['color'],
            'is_income': cat_data['is_income'],
        }
    )
    if created:
        created_count += 1
        print(f"✅ Created: {category}")
    else:
        print(f"⏭️  Already exists: {category}")

print(f"\n🎉 Done! Created {created_count} new categories.")
print(f"📊 Total categories in database: {Category.objects.count()}")
