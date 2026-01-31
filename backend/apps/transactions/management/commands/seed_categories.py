"""
Management command to seed default categories.
"""

from django.core.management.base import BaseCommand
from apps.transactions.models import Category


class Command(BaseCommand):
    help = 'Seeds default transaction categories'

    CATEGORIES = [
        {"name": "Food & Dining", "icon": "🍔", "color": "#f59e0b", "keywords": ["restaurant", "cafe", "starbucks", "zomato", "swiggy", "uber eats"]},
        {"name": "Groceries", "icon": "🛒", "color": "#10b981", "keywords": ["grocery", "supermarket", "dmart", "bigbasket", "vegetables", "fruits"]},
        {"name": "Transportation", "icon": "🚗", "color": "#3b82f6", "keywords": ["uber", "ola", "metro", "petrol", "fuel", "parking", "toll"]},
        {"name": "Shopping", "icon": "🛍️", "color": "#ec4899", "keywords": ["amazon", "flipkart", "myntra", "mall", "store"]},
        {"name": "Entertainment", "icon": "🎬", "color": "#8b5cf6", "keywords": ["netflix", "spotify", "movie", "theatre", "game", "disney"]},
        {"name": "Utilities", "icon": "💡", "color": "#06b6d4", "keywords": ["electricity", "water", "gas", "internet", "phone", "mobile"]},
        {"name": "Healthcare", "icon": "⚕️", "color": "#ef4444", "keywords": ["hospital", "pharmacy", "doctor", "medicine", "clinic", "health"]},
        {"name": "Education", "icon": "📚", "color": "#6366f1", "keywords": ["course", "udemy", "book", "school", "college", "training"]},
        {"name": "Travel", "icon": "✈️", "color": "#14b8a6", "keywords": ["hotel", "flight", "airbnb", "makemytrip", "booking", "train"]},
        {"name": "Subscriptions", "icon": "📱", "color": "#a855f7", "keywords": ["subscription", "membership", "premium", "monthly"]},
        {"name": "Personal Care", "icon": "💅", "color": "#f472b6", "keywords": ["salon", "spa", "grooming", "haircut", "beauty"]},
        {"name": "Rent & Housing", "icon": "🏠", "color": "#fb923c", "keywords": ["rent", "maintenance", "society", "housing"]},
        {"name": "Income", "icon": "💰", "color": "#22c55e", "keywords": ["salary", "freelance", "payment received", "refund", "dividend"], "is_income": True},
        {"name": "Transfer", "icon": "💸", "color": "#64748b", "keywords": ["transfer", "upi", "neft", "imps"]},
        {"name": "Other", "icon": "📦", "color": "#94a3b8", "keywords": []},
    ]

    def handle(self, *args, **kwargs):
        created_count = 0
        updated_count = 0

        for cat_data in self.CATEGORIES:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                user=None,  # Default categories have no user
                defaults={
                    'icon': cat_data['icon'],
                    'color': cat_data['color'],
                    'keywords': cat_data.get('keywords', []),
                    'is_income': cat_data.get('is_income', False),
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created category: {category.name} {category.icon}')
                )
            else:
                # Update existing category
                category.icon = cat_data['icon']
                category.color = cat_data['color']
                category.keywords = cat_data.get('keywords', [])
                category.is_income = cat_data.get('is_income', False)
                category.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'↻ Updated category: {category.name} {category.icon}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Done! Created: {created_count}, Updated: {updated_count}, Total: {created_count + updated_count}'
            )
        )
