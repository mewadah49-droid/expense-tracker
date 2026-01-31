"""
Management command to create default categories.
"""

from django.core.management.base import BaseCommand
from apps.transactions.models import Category


class Command(BaseCommand):
    help = 'Create default expense categories'
    
    DEFAULT_CATEGORIES = [
        # Expenses
        {'name': 'Food & Dining', 'icon': '🍕', 'color': '#f97316', 'is_income': False, 
         'keywords': ['restaurant', 'cafe', 'starbucks', 'zomato', 'swiggy', 'uber eats', 'food', 'lunch', 'dinner']},
        {'name': 'Groceries', 'icon': '🛒', 'color': '#22c55e', 'is_income': False,
         'keywords': ['grocery', 'supermarket', 'dmart', 'bigbasket', 'vegetables', 'fruits', 'market']},
        {'name': 'Transportation', 'icon': '🚗', 'color': '#3b82f6', 'is_income': False,
         'keywords': ['uber', 'ola', 'metro', 'petrol', 'fuel', 'parking', 'toll', 'rapido', 'auto']},
        {'name': 'Shopping', 'icon': '🛍️', 'color': '#ec4899', 'is_income': False,
         'keywords': ['amazon', 'flipkart', 'myntra', 'mall', 'store', 'clothes', 'shoes']},
        {'name': 'Entertainment', 'icon': '🎬', 'color': '#8b5cf6', 'is_income': False,
         'keywords': ['netflix', 'spotify', 'movie', 'theatre', 'game', 'disney', 'hotstar', 'prime']},
        {'name': 'Utilities', 'icon': '💡', 'color': '#eab308', 'is_income': False,
         'keywords': ['electricity', 'water', 'gas', 'internet', 'phone', 'mobile', 'wifi', 'bill']},
        {'name': 'Healthcare', 'icon': '🏥', 'color': '#ef4444', 'is_income': False,
         'keywords': ['hospital', 'pharmacy', 'doctor', 'medicine', 'clinic', 'health', 'medical']},
        {'name': 'Education', 'icon': '📚', 'color': '#06b6d4', 'is_income': False,
         'keywords': ['course', 'udemy', 'book', 'school', 'college', 'training', 'coursera', 'education']},
        {'name': 'Travel', 'icon': '✈️', 'color': '#14b8a6', 'is_income': False,
         'keywords': ['hotel', 'flight', 'airbnb', 'makemytrip', 'booking', 'train', 'travel', 'trip']},
        {'name': 'Subscriptions', 'icon': '📱', 'color': '#6366f1', 'is_income': False,
         'keywords': ['subscription', 'membership', 'premium', 'monthly', 'annual']},
        {'name': 'Personal Care', 'icon': '💅', 'color': '#f472b6', 'is_income': False,
         'keywords': ['salon', 'spa', 'grooming', 'haircut', 'beauty', 'parlour']},
        {'name': 'Rent & Housing', 'icon': '🏠', 'color': '#78716c', 'is_income': False,
         'keywords': ['rent', 'maintenance', 'society', 'housing', 'apartment']},
        {'name': 'Insurance', 'icon': '🛡️', 'color': '#0ea5e9', 'is_income': False,
         'keywords': ['insurance', 'lic', 'policy', 'premium']},
        {'name': 'Gifts & Donations', 'icon': '🎁', 'color': '#d946ef', 'is_income': False,
         'keywords': ['gift', 'donation', 'charity', 'birthday', 'wedding']},
        {'name': 'Other Expenses', 'icon': '📦', 'color': '#64748b', 'is_income': False,
         'keywords': []},
        
        # Income
        {'name': 'Salary', 'icon': '💰', 'color': '#22c55e', 'is_income': True,
         'keywords': ['salary', 'payroll', 'wages', 'income']},
        {'name': 'Freelance', 'icon': '💻', 'color': '#3b82f6', 'is_income': True,
         'keywords': ['freelance', 'consulting', 'contract', 'project']},
        {'name': 'Investment Returns', 'icon': '📈', 'color': '#10b981', 'is_income': True,
         'keywords': ['dividend', 'interest', 'returns', 'profit', 'investment']},
        {'name': 'Refund', 'icon': '↩️', 'color': '#f59e0b', 'is_income': True,
         'keywords': ['refund', 'cashback', 'return']},
        {'name': 'Other Income', 'icon': '💵', 'color': '#84cc16', 'is_income': True,
         'keywords': ['bonus', 'gift received']},
    ]
    
    def handle(self, *args, **options):
        created_count = 0
        
        for cat_data in self.DEFAULT_CATEGORIES:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                user=None,  # Default categories have no user
                defaults={
                    'icon': cat_data['icon'],
                    'color': cat_data['color'],
                    'is_income': cat_data['is_income'],
                    'keywords': cat_data['keywords']
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(f"  Created: {category.icon} {category.name}")
            else:
                self.stdout.write(f"  Exists: {category.icon} {category.name}")
        
        self.stdout.write(
            self.style.SUCCESS(f'\nCreated {created_count} new categories')
        )
