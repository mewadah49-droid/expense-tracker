"""
Transaction and Category models for expense tracking.
"""

from django.db import models


class Category(models.Model):
    """Expense/Income categories - both default and user-created."""
    
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, default='📦')  # Emoji or icon name
    color = models.CharField(max_length=7, default='#6366f1')  # Hex color
    
    is_income = models.BooleanField(default=False)
    
    # AI-related fields
    keywords = models.JSONField(
        default=list,
        help_text="Keywords that help AI categorize transactions"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.icon} {self.name}"


class Transaction(models.Model):
    """Financial transaction record."""
    
    TRANSACTION_TYPES = [
        ('expense', 'Expense'),
        ('income', 'Income'),
    ]
    
    SOURCE_TYPES = [
        ('manual', 'Manual Entry'),
        ('plaid', 'Bank Sync (Plaid)'),
        ('receipt', 'Receipt Scan'),
    ]
    
    # Transaction details
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=500)
    merchant = models.CharField(max_length=255, blank=True)
    
    # Classification
    transaction_type = models.CharField(
        max_length=10,
        choices=TRANSACTION_TYPES,
        default='expense'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='transactions'
    )
    
    # AI Categorization
    ai_categorized = models.BooleanField(default=False)
    ai_confidence = models.FloatField(default=0.0, help_text="AI confidence score 0-1")
    ai_suggested_category = models.CharField(max_length=100, blank=True)
    
    # Source tracking
    source = models.CharField(max_length=20, choices=SOURCE_TYPES, default='manual')
    plaid_transaction_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    receipt = models.ForeignKey(
        'receipts.Receipt',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='transactions'
    )
    
    # Metadata
    date = models.DateField()
    notes = models.TextField(blank=True)
    tags = models.JSONField(default=list)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'transactions'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['category']),
            models.Index(fields=['transaction_type']),
        ]
    
    def __str__(self):
        return f"{self.transaction_type}: {self.amount} - {self.description[:30]}"


class Budget(models.Model):
    """Budget limits per category."""
    
    PERIOD_CHOICES = [
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]
    
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='budgets'
    )
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    period = models.CharField(max_length=10, choices=PERIOD_CHOICES, default='monthly')
    
    # Alert thresholds
    alert_at_percentage = models.IntegerField(default=80)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'budgets'
        unique_together = ['category', 'period']
    
    def __str__(self):
        return f"{self.category.name}: {self.amount}/{self.period}"
