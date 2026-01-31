"""
Receipt model for OCR-based expense extraction.
"""

from django.db import models
from django.contrib.auth.models import User


class Receipt(models.Model):
    """Scanned receipt with OCR-extracted data."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending Processing'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='receipts',
        null=True, blank=True  # Make optional for no-auth mode
    )
    
    # Image
    image = models.ImageField(upload_to='receipts/%Y/%m/')
    thumbnail = models.ImageField(upload_to='receipts/thumbnails/', blank=True, null=True)
    
    # Processing status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    
    # OCR extracted data
    raw_text = models.TextField(blank=True, help_text="Raw OCR text output")
    
    # Parsed data (structured)
    merchant_name = models.CharField(max_length=255, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    receipt_date = models.DateField(null=True, blank=True)
    
    # Line items extracted from receipt
    items = models.JSONField(
        default=list,
        help_text="List of items: [{name, quantity, price}]"
    )
    
    # AI-enhanced fields
    ai_confidence = models.FloatField(default=0, help_text="OCR confidence score")
    suggested_category = models.CharField(max_length=100, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'receipts'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Receipt: {self.merchant_name or 'Unknown'} - ₹{self.total_amount or 0}"


class ReceiptItem(models.Model):
    """Individual line item from a receipt."""
    
    receipt = models.ForeignKey(
        Receipt,
        on_delete=models.CASCADE,
        related_name='line_items'
    )
    
    name = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Category for item-level tracking
    category = models.ForeignKey(
        'transactions.Category',
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    
    class Meta:
        db_table = 'receipt_items'
    
    def __str__(self):
        return f"{self.name}: ₹{self.total_price}"
