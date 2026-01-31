"""
Serializers for Receipt management.
"""

from rest_framework import serializers
from .models import Receipt, ReceiptItem


class ReceiptItemSerializer(serializers.ModelSerializer):
    """Serializer for receipt line items."""
    
    class Meta:
        model = ReceiptItem
        fields = ['id', 'name', 'quantity', 'unit_price', 'total_price', 'category']


class ReceiptSerializer(serializers.ModelSerializer):
    """Serializer for receipts."""
    
    line_items = ReceiptItemSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Receipt
        fields = [
            'id', 'image', 'image_url', 'thumbnail', 'status', 'error_message',
            'raw_text', 'merchant_name', 'total_amount', 'subtotal', 'tax_amount',
            'receipt_date', 'items', 'line_items', 'ai_confidence', 'suggested_category',
            'created_at', 'processed_at'
        ]
        read_only_fields = [
            'id', 'thumbnail', 'status', 'error_message', 'raw_text',
            'merchant_name', 'total_amount', 'subtotal', 'tax_amount',
            'receipt_date', 'items', 'ai_confidence', 'suggested_category',
            'created_at', 'processed_at'
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None


class ReceiptUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading receipts."""
    
    class Meta:
        model = Receipt
        fields = ['image']
    
    def create(self, validated_data):
        return super().create(validated_data)


class ReceiptToTransactionSerializer(serializers.Serializer):
    """Serializer for converting receipt to transaction."""
    
    category_id = serializers.IntegerField(required=False)
    description = serializers.CharField(required=False, max_length=500)
    date = serializers.DateField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
