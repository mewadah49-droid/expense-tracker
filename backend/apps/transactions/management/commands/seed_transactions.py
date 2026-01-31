"""
Management command to seed sample transactions for testing.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random
from apps.transactions.models import Transaction, Category
from apps.users.models import User


class Command(BaseCommand):
    help = 'Seeds sample transactions for testing and demo purposes'

    SAMPLE_TRANSACTIONS = [
        # Food & Dining
        ("Starbucks Coffee", "Starbucks", "Food & Dining", 150, 250),
        ("Lunch at McDonald's", "McDonald's", "Food & Dining", 200, 400),
        ("Zomato Order", "Zomato", "Food & Dining", 300, 600),
        ("Swiggy Food Delivery", "Swiggy", "Food & Dining", 250, 500),
        
        # Groceries
        ("BigBasket Order", "BigBasket", "Groceries", 800, 1500),
        ("DMart Shopping", "DMart", "Groceries", 1000, 2000),
        ("Local Vegetable Market", "Vegetable Vendor", "Groceries", 200, 400),
        
        # Transportation
        ("Uber Ride", "Uber", "Transportation", 80, 200),
        ("Ola Cab", "Ola", "Transportation", 100, 250),
        ("Petrol Fill", "HP Petrol Pump", "Transportation", 1000, 2000),
        ("Metro Card Recharge", "DMRC", "Transportation", 500, 800),
        
        # Shopping
        ("Amazon Order", "Amazon", "Shopping", 500, 3000),
        ("Flipkart Purchase", "Flipkart", "Shopping", 800, 2500),
        ("Myntra Clothing", "Myntra", "Shopping", 1000, 3000),
        
        # Entertainment
        ("Netflix Subscription", "Netflix", "Subscriptions", 649, 649),
        ("Spotify Premium", "Spotify", "Subscriptions", 119, 119),
        ("Movie Tickets", "PVR Cinemas", "Entertainment", 400, 800),
        
        # Utilities
        ("Electricity Bill", "BSES", "Utilities", 800, 1500),
        ("Internet Bill", "Airtel", "Utilities", 999, 999),
        ("Mobile Recharge", "Jio", "Utilities", 299, 599),
        
        # Healthcare
        ("Medicine Purchase", "Apollo Pharmacy", "Healthcare", 200, 800),
        ("Doctor Consultation", "Max Hospital", "Healthcare", 500, 1500),
        
        # Personal Care
        ("Haircut", "Salon", "Personal Care", 200, 500),
        ("Spa Treatment", "Spa", "Personal Care", 1000, 2500),
    ]

    def handle(self, *args, **kwargs):
        # Get or create a user
        user = User.objects.first()
        if not user:
            self.stdout.write(self.style.ERROR('No users found. Please create a user first.'))
            return

        self.stdout.write(self.style.SUCCESS(f'Creating transactions for user: {user.email}'))

        # Generate transactions for the last 6 months
        created_count = 0
        today = timezone.now().date()
        
        for month_offset in range(6):
            # Generate 10-20 transactions per month
            num_transactions = random.randint(10, 20)
            
            for _ in range(num_transactions):
                # Random transaction from our sample list
                desc, merchant, cat_name, min_amt, max_amt = random.choice(self.SAMPLE_TRANSACTIONS)
                
                # Random day in the month
                days_back = (month_offset * 30) + random.randint(0, 29)
                transaction_date = today - timedelta(days=days_back)
                
                # Random amount in the range
                amount = Decimal(random.randint(min_amt, max_amt))
                
                # Get category
                category = Category.objects.filter(name=cat_name, user=None).first()
                if not category:
                    continue
                
                # Create transaction
                Transaction.objects.create(
                    user=user,
                    description=desc,
                    merchant=merchant,
                    amount=amount,
                    transaction_type='expense',
                    category=category,
                    date=transaction_date,
                    source='seed',
                    ai_categorized=False,
                )
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Successfully created {created_count} sample transactions over 6 months'
            )
        )
