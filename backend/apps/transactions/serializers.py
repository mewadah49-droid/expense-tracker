"""
Serializers for Transaction management.
"""

from rest_framework import serializers
from .models import Category, Transaction, Budget


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for categories."""
    
    transaction_count = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'icon', 'color', 'is_income',
            'keywords', 'transaction_count', 'total_spent', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_transaction_count(self, obj):
        return obj.transactions.count()
    
    def get_total_spent(self, obj):
        from django.db.models import Sum
        total = obj.transactions.aggregate(total=Sum('amount'))['total']
        return float(total) if total else 0


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for transactions."""
    
    category_name = serializers.SerializerMethodField()
    category_icon = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'amount', 'description', 'merchant',
            'transaction_type', 'category', 'category_name', 'category_icon',
            'ai_categorized', 'ai_confidence', 'ai_suggested_category',
            'source', 'date', 'notes', 'tags',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'ai_categorized', 'ai_confidence', 'ai_suggested_category',
            'source', 'created_at', 'updated_at'
        ]
    
    def get_category_name(self, obj):
        return obj.category.name if obj.category else ''
    
    def get_category_icon(self, obj):
        return obj.category.icon if obj.category else ''
    
    def create(self, validated_data):
        validated_data['source'] = 'manual'
        return super().create(validated_data)


class TransactionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating transactions with AI categorization."""
    
    auto_categorize = serializers.BooleanField(default=True, write_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'amount', 'description', 'merchant', 'transaction_type',
            'category', 'date', 'notes', 'tags', 'auto_categorize'
        ]
    
    def create(self, validated_data):
        auto_categorize = validated_data.pop('auto_categorize', True)
        validated_data['source'] = 'manual'
        
        # Explicitly set user to None for no-auth mode
        validated_data['user'] = None
        
        # If no category and auto_categorize is enabled, use AI
        if not validated_data.get('category') and auto_categorize:
            try:
                from apps.transactions.services.ai_categorizer import AICategorizer
                
                categorizer = AICategorizer()
                result = categorizer.categorize(
                    description=validated_data['description'],
                    merchant=validated_data.get('merchant', ''),
                    amount=float(validated_data['amount'])
                )
                
                if result:
                    validated_data['category'] = result['category']
                    validated_data['ai_categorized'] = True
                    validated_data['ai_confidence'] = result['confidence']
                    validated_data['ai_suggested_category'] = result['suggested_name']
            except Exception as e:
                # Log the error but don't fail the transaction creation
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"AI categorization failed: {e}")
                # Continue without AI categorization
        
        return super().create(validated_data)


class BudgetSerializer(serializers.ModelSerializer):
    """Serializer for budgets."""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    spent = serializers.SerializerMethodField()
    percentage_used = serializers.SerializerMethodField()
    
    class Meta:
        model = Budget
        fields = [
            'id', 'category', 'category_name', 'amount', 'period',
            'alert_at_percentage', 'is_active', 'spent', 'percentage_used',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_spent(self, obj):
        from django.db.models import Sum
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        
        if obj.period == 'weekly':
            start_date = now - timedelta(days=now.weekday())
        elif obj.period == 'monthly':
            start_date = now.replace(day=1)
        else:  # yearly
            start_date = now.replace(month=1, day=1)
        
        total = Transaction.objects.filter(
            user=obj.user,
            category=obj.category,
            transaction_type='expense',
            date__gte=start_date.date()
        ).aggregate(total=Sum('amount'))['total']
        
        return float(total) if total else 0
    
    def get_percentage_used(self, obj):
        spent = self.get_spent(obj)
        if obj.amount > 0:
            return round((spent / float(obj.amount)) * 100, 1)
        return 0
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
