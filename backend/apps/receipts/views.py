"""
Views for Receipt management with OCR processing.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone

from .models import Receipt, ReceiptItem
from .serializers import (
    ReceiptSerializer, ReceiptUploadSerializer, ReceiptToTransactionSerializer
)
from .services.ocr_service import ReceiptOCRService


class ReceiptViewSet(viewsets.ModelViewSet):
    """ViewSet for managing receipts with OCR."""
    
    serializer_class = ReceiptSerializer
    permission_classes = []  # No authentication required
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        return Receipt.objects.all()  # No user filtering
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReceiptUploadSerializer
        return ReceiptSerializer
    
    def perform_create(self, serializer):
        """Upload and process receipt."""
        receipt = serializer.save()
        
        # Process receipt with OCR
        self._process_receipt(receipt)
    
    def _process_receipt(self, receipt: Receipt):
        """Process receipt with OCR service."""
        receipt.status = 'processing'
        receipt.save()
        
        try:
            ocr_service = ReceiptOCRService()
            result = ocr_service.process_receipt(receipt.image)
            
            if result['success']:
                receipt.status = 'completed'
                receipt.raw_text = result['raw_text']
                receipt.merchant_name = result['merchant_name']
                receipt.total_amount = result['total_amount']
                receipt.subtotal = result['subtotal']
                receipt.tax_amount = result['tax_amount']
                receipt.items = result['items']
                receipt.ai_confidence = result['confidence']
                
                # Parse date
                if result['receipt_date']:
                    from datetime import datetime
                    try:
                        receipt.receipt_date = datetime.strptime(
                            result['receipt_date'], '%Y-%m-%d'
                        ).date()
                    except ValueError:
                        pass
                
                # Create line items
                for item_data in result['items']:
                    ReceiptItem.objects.create(
                        receipt=receipt,
                        name=item_data['name'],
                        quantity=item_data.get('quantity', 1),
                        unit_price=item_data['price'],
                        total_price=item_data['price'] * item_data.get('quantity', 1)
                    )
                
                # Suggest category using AI
                from apps.transactions.services.ai_categorizer import AICategorizer
                categorizer = AICategorizer()
                cat_result = categorizer.categorize(
                    description=receipt.merchant_name,
                    merchant=receipt.merchant_name,
                    amount=float(receipt.total_amount or 0)
                )
                if cat_result:
                    receipt.suggested_category = cat_result['suggested_name']
                
            else:
                receipt.status = 'failed'
                receipt.error_message = result.get('error', 'OCR processing failed')
            
            receipt.processed_at = timezone.now()
            receipt.save()
            
        except Exception as e:
            receipt.status = 'failed'
            receipt.error_message = str(e)
            receipt.save()
    
    @action(detail=True, methods=['post'])
    def reprocess(self, request, pk=None):
        """Re-run OCR processing on a receipt."""
        receipt = self.get_object()
        self._process_receipt(receipt)
        
        serializer = self.get_serializer(receipt)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def create_transaction(self, request, pk=None):
        """Create a transaction from this receipt."""
        receipt = self.get_object()
        
        if receipt.status != 'completed':
            return Response(
                {'error': 'Receipt must be processed before creating transaction'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ReceiptToTransactionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        from apps.transactions.models import Transaction, Category
        
        # Get category
        category = None
        if serializer.validated_data.get('category_id'):
            category = Category.objects.filter(
                id=serializer.validated_data['category_id']
            ).first()
        elif receipt.suggested_category:
            category = Category.objects.filter(
                name__iexact=receipt.suggested_category
            ).first()
        
        # Create transaction
        transaction = Transaction.objects.create(
            user=request.user,
            amount=receipt.total_amount,
            description=serializer.validated_data.get(
                'description',
                f"Purchase at {receipt.merchant_name}"
            ),
            merchant=receipt.merchant_name,
            transaction_type='expense',
            category=category,
            source='receipt',
            receipt=receipt,
            date=serializer.validated_data.get('date') or receipt.receipt_date or timezone.now().date(),
            notes=serializer.validated_data.get('notes', ''),
            ai_categorized=bool(receipt.suggested_category),
            ai_confidence=receipt.ai_confidence
        )
        
        from apps.transactions.serializers import TransactionSerializer
        return Response(
            TransactionSerializer(transaction).data,
            status=status.HTTP_201_CREATED
        )
