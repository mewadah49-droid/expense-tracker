from django.contrib import admin
from .models import Receipt, ReceiptItem


class ReceiptItemInline(admin.TabularInline):
    model = ReceiptItem
    extra = 0


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ['user', 'merchant_name', 'total_amount', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['merchant_name', 'raw_text']
    inlines = [ReceiptItemInline]
    readonly_fields = ['raw_text', 'items', 'ai_confidence', 'processed_at']
