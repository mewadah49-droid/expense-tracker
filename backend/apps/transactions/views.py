"""
Views for Transaction management.
"""

import csv
import io
from decimal import Decimal
from datetime import datetime

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q
from django.utils import timezone

from .models import Category, Transaction, Budget
from .serializers import (
    CategorySerializer, TransactionSerializer,
    TransactionCreateSerializer, BudgetSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing categories."""
    
    serializer_class = CategorySerializer
    permission_classes = []  # No authentication required
    
    def get_queryset(self):
        # Return all categories (no user filtering)
        return Category.objects.all()
    
    def perform_create(self, serializer):
        # Don't assign user
        serializer.save()
    
    @action(detail=False, methods=['get'])
    def defaults(self, request):
        """Get only default categories."""
        categories = Category.objects.filter(user=None)
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)


class TransactionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing transactions."""
    
    permission_classes = []  # No authentication required
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['transaction_type', 'category', 'source', 'ai_categorized']
    search_fields = ['description', 'merchant', 'notes']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TransactionCreateSerializer
        return TransactionSerializer
    
    def get_queryset(self):
        queryset = Transaction.objects.all()  # No user filtering
        
        # Date range filtering
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        return queryset.select_related('category')
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get spending summary grouped by category."""
        queryset = self.get_queryset().filter(transaction_type='expense')
        
        summary = queryset.values(
            'category__name', 'category__icon', 'category__color'
        ).annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        return Response(summary)
    
    @action(detail=True, methods=['post'])
    def recategorize(self, request, pk=None):
        """Re-run AI categorization on a transaction."""
        transaction = self.get_object()
        
        from apps.transactions.services.ai_categorizer import AICategorizer
        
        categorizer = AICategorizer()
        result = categorizer.categorize(
            description=transaction.description,
            merchant=transaction.merchant,
            amount=float(transaction.amount),
            user=request.user
        )
        
        if result:
            transaction.ai_categorized = True
            transaction.ai_confidence = result['confidence']
            transaction.ai_suggested_category = result['suggested_name']
            
            if result['category']:
                transaction.category = result['category']
            
            transaction.save()
            
            return Response({
                'success': True,
                'category': result['suggested_name'],
                'confidence': result['confidence']
            })
        
        return Response({
            'success': False,
            'message': 'Could not categorize transaction'
        }, status=400)

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser])
    def import_csv(self, request):
        """
        Import transactions from a CSV file.
        Expected columns: date, description, amount, type (optional)
        Supports most bank export formats.
        """
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=400)
        
        csv_file = request.FILES['file']
        
        if not csv_file.name.endswith('.csv'):
            return Response({'error': 'File must be a CSV'}, status=400)
        
        try:
            # Read and decode CSV
            decoded_file = csv_file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            imported = 0
            errors = []
            
            # Get AI categorizer
            from apps.transactions.services.ai_categorizer import AICategorizer
            categorizer = AICategorizer()
            
            for row_num, row in enumerate(reader, start=2):
                try:
                    # Normalize column names (lowercase, strip)
                    row = {k.lower().strip(): v.strip() for k, v in row.items() if k}
                    
                    # Parse date (try common formats)
                    date_str = row.get('date', row.get('transaction date', row.get('posted date', '')))
                    date = None
                    for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%m-%d-%Y', '%Y/%m/%d']:
                        try:
                            date = datetime.strptime(date_str, fmt).date()
                            break
                        except ValueError:
                            continue
                    
                    if not date:
                        errors.append(f"Row {row_num}: Invalid date format")
                        continue
                    
                    # Parse description
                    description = row.get('description', row.get('memo', row.get('name', '')))
                    if not description:
                        errors.append(f"Row {row_num}: No description found")
                        continue
                    
                    # Parse amount
                    amount_str = row.get('amount', row.get('debit', row.get('credit', '0')))
                    amount_str = amount_str.replace('$', '').replace(',', '').strip()
                    
                    try:
                        amount = Decimal(amount_str)
                    except:
                        errors.append(f"Row {row_num}: Invalid amount")
                        continue
                    
                    # Determine transaction type
                    trans_type = 'expense'
                    if amount > 0:
                        # Check if there's a separate credit column
                        if 'credit' in row and row['credit'].strip():
                            trans_type = 'income'
                        elif row.get('type', '').lower() in ['credit', 'income', 'deposit']:
                            trans_type = 'income'
                    
                    amount = abs(amount)
                    
                    # AI categorize
                    cat_result = categorizer.categorize(
                        description=description,
                        merchant=description.split()[0] if description else '',
                        amount=float(amount),
                        user=request.user
                    )
                    
                    category = cat_result['category'] if cat_result else None
                    
                    # Create transaction
                    Transaction.objects.create(
                        user=request.user,
                        date=date,
                        description=description,
                        merchant=description.split()[0] if description else '',
                        amount=amount,
                        transaction_type=trans_type,
                        category=category,
                        source='csv_import',
                        ai_categorized=True if category else False,
                        ai_confidence=cat_result['confidence'] if cat_result else None,
                        ai_suggested_category=cat_result['suggested_name'] if cat_result else None,
                    )
                    imported += 1
                    
                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
            
            return Response({
                'success': True,
                'imported': imported,
                'errors': errors[:10],  # Limit error messages
                'total_errors': len(errors)
            })
            
        except Exception as e:
            return Response({'error': f'Failed to parse CSV: {str(e)}'}, status=400)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export all transactions as CSV."""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="transactions.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Date', 'Description', 'Merchant', 'Category', 'Amount', 'Type', 'Notes'])
        
        transactions = self.get_queryset()
        for t in transactions:
            writer.writerow([
                t.date.isoformat(),
                t.description,
                t.merchant or '',
                t.category.name if t.category else '',
                str(t.amount),
                t.transaction_type,
                t.notes or ''
            ])
        
        return response


class BudgetViewSet(viewsets.ModelViewSet):
    """ViewSet for managing budgets."""
    
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user).select_related('category')
    
    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """Get budgets that are near or over limit."""
        budgets = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(budgets, many=True)
        
        alerts = []
        for budget_data in serializer.data:
            if budget_data['percentage_used'] >= budget_data['alert_at_percentage']:
                budget_data['alert_level'] = 'danger' if budget_data['percentage_used'] >= 100 else 'warning'
                alerts.append(budget_data)
        
        return Response(alerts)
