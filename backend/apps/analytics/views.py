"""
Views for Analytics using real transaction data.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from apps.transactions.models import Transaction, Category
from apps.users.models import UserPreferences

User = get_user_model()

def get_default_user():
    """Get or create a default user for Single User Mode."""
    user = User.objects.first()
    if not user:
        user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='password'
        )
        UserPreferences.objects.create(user=user)
    return user


class DashboardStatsView(APIView):
    """Get dashboard statistics."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        user = get_default_user()
        
        # Get current month stats
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        monthly_transactions = Transaction.objects.filter(
            date__gte=month_start
        )
        
        total_spent = monthly_transactions.filter(
            transaction_type='expense'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_income = monthly_transactions.filter(
            transaction_type='income'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'monthly_budget': float(user.monthly_budget),
            'total_spent': float(total_spent),
            'total_income': float(total_income),
            'remaining_budget': float(user.monthly_budget) - float(total_spent),
            'transaction_count': monthly_transactions.count(),
        })


class MonthlyTrendsView(APIView):
    """Get monthly spending trends for the last 6 months."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        months = int(request.query_params.get('months', 6))
        months = min(max(months, 1), 12)
        
        now = timezone.now()
        trends = []
        
        for i in range(months - 1, -1, -1):
            # Calculate month boundaries
            month_date = now - timedelta(days=30 * i)
            month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # Get next month start
            if month_start.month == 12:
                next_month = month_start.replace(year=month_start.year + 1, month=1)
            else:
                next_month = month_start.replace(month=month_start.month + 1)
            
            # Get transactions for this month
            month_transactions = Transaction.objects.filter(
                date__gte=month_start.date(),
                date__lt=next_month.date(),
                transaction_type='expense'
            )
            
            total = month_transactions.aggregate(total=Sum('amount'))['total'] or Decimal('0')
            
            trends.append({
                'month': month_start.strftime('%b %Y'),
                'spending': float(total),
                'transaction_count': month_transactions.count()
            })
        
        # Calculate trend direction
        if len(trends) >= 2:
            recent_avg = sum(t['spending'] for t in trends[-2:]) / 2
            older_avg = sum(t['spending'] for t in trends[:2]) / 2 if len(trends) >= 2 else recent_avg
            
            if recent_avg > older_avg * 1.1:
                trend = 'increasing'
            elif recent_avg < older_avg * 0.9:
                trend = 'decreasing'
            else:
                trend = 'stable'
        else:
            trend = 'stable'
        
        avg_spending = sum(t['spending'] for t in trends) / len(trends) if trends else 0
        
        return Response({
            'trends': trends,
            'trend_direction': trend,
            'average_monthly_spending': round(avg_spending, 2),
            'total_months': len(trends)
        })


class CategoryBreakdownView(APIView):
    """Get spending breakdown by category."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        days = min(max(days, 1), 365)
        
        cutoff_date = timezone.now().date() - timedelta(days=days)
        
        # Get category spending
        category_data = Transaction.objects.filter(
            date__gte=cutoff_date,
            transaction_type='expense'
        ).values(
            'category__name',
            'category__icon',
            'category__color'
        ).annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        total_spending = sum(item['total'] for item in category_data if item['total'])
        
        breakdown = []
        for item in category_data:
            if item['total']:
                breakdown.append({
                    'category': item['category__name'] or 'Uncategorized',
                    'icon': item['category__icon'] or '📦',
                    'color': item['category__color'] or '#6366f1',
                    'amount': float(item['total']),
                    'count': item['count'],
                    'percentage': round((float(item['total']) / float(total_spending) * 100), 1) if total_spending else 0
                })
        
        # Get top category
        top_category = breakdown[0] if breakdown else None
        
        return Response({
            'breakdown': breakdown,
            'total_spending': float(total_spending) if total_spending else 0,
            'top_category': top_category,
            'period_days': days
        })


class TopExpensesView(APIView):
    """Get top expenses in a given period."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        limit = int(request.query_params.get('limit', 10))
        
        days = min(max(days, 1), 365)
        limit = min(max(limit, 1), 50)
        
        cutoff_date = timezone.now().date() - timedelta(days=days)
        
        top_transactions = Transaction.objects.filter(
            date__gte=cutoff_date,
            transaction_type='expense'
        ).select_related('category').order_by('-amount')[:limit]
        
        expenses = []
        for txn in top_transactions:
            expenses.append({
                'id': txn.id,
                'amount': float(txn.amount),
                'description': txn.description,
                'merchant': txn.merchant or 'N/A',
                'category': txn.category.name if txn.category else 'Uncategorized',
                'category_icon': txn.category.icon if txn.category else '📦',
                'date': txn.date.strftime('%Y-%m-%d'),
                'date_display': txn.date.strftime('%b %d, %Y')
            })
        
        # Calculate average of top expenses
        avg_amount = sum(e['amount'] for e in expenses) / len(expenses) if expenses else 0
        
        return Response({
            'expenses': expenses,
            'count': len(expenses),
            'average_amount': round(avg_amount, 2),
            'period_days': days
        })


class SpendingComparisonView(APIView):
    """Compare current month with previous month."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        now = timezone.now()
        
        # Current month
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Previous month
        if current_month_start.month == 1:
            prev_month_start = current_month_start.replace(year=current_month_start.year - 1, month=12)
        else:
            prev_month_start = current_month_start.replace(month=current_month_start.month - 1)
        
        # Current month spending
        current_spending = Transaction.objects.filter(
            date__gte=current_month_start.date(),
            transaction_type='expense'
        ).aggregate(
            total=Sum('amount'),
            count=Count('id'),
            avg=Avg('amount')
        )
        
        # Previous month spending
        prev_spending = Transaction.objects.filter(
            date__gte=prev_month_start.date(),
            date__lt=current_month_start.date(),
            transaction_type='expense'
        ).aggregate(
            total=Sum('amount'),
            count=Count('id'),
            avg=Avg('amount')
        )
        
        current_total = float(current_spending['total'] or 0)
        prev_total = float(prev_spending['total'] or 0)
        
        # Calculate change
        if prev_total > 0:
            change_amount = current_total - prev_total
            change_percentage = (change_amount / prev_total) * 100
        else:
            change_amount = current_total
            change_percentage = 100 if current_total > 0 else 0
        
        return Response({
            'current_month': {
                'total': current_total,
                'count': current_spending['count'] or 0,
                'average': float(current_spending['avg'] or 0),
                'month': current_month_start.strftime('%B %Y')
            },
            'previous_month': {
                'total': prev_total,
                'count': prev_spending['count'] or 0,
                'average': float(prev_spending['avg'] or 0),
                'month': prev_month_start.strftime('%B %Y')
            },
            'change': {
                'amount': round(change_amount, 2),
                'percentage': round(change_percentage, 1),
                'direction': 'increase' if change_amount > 0 else 'decrease' if change_amount < 0 else 'stable'
            }
        })


class WeeklyAnalyticsView(APIView):
    """Get weekly spending analytics."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        now = timezone.now()
        
        # Current week (last 7 days)
        week_start = now - timedelta(days=7)
        
        # Previous week
        prev_week_start = now - timedelta(days=14)
        prev_week_end = week_start
        
        # Current week spending
        current_week = Transaction.objects.filter(
            date__gte=week_start.date(),
            transaction_type='expense'
        ).aggregate(
            total=Sum('amount'),
            count=Count('id'),
            avg=Avg('amount')
        )
        
        # Previous week spending
        prev_week = Transaction.objects.filter(
            date__gte=prev_week_start.date(),
            date__lt=prev_week_end.date(),
            transaction_type='expense'
        ).aggregate(
            total=Sum('amount'),
            count=Count('id'),
            avg=Avg('amount')
        )
        
        current_total = float(current_week['total'] or 0)
        prev_total = float(prev_week['total'] or 0)
        
        # Calculate change
        if prev_total > 0:
            change_amount = current_total - prev_total
            change_percentage = (change_amount / prev_total) * 100
        else:
            change_amount = current_total
            change_percentage = 100 if current_total > 0 else 0
        
        # Daily breakdown for current week
        daily_breakdown = []
        for i in range(7):
            day = now - timedelta(days=6-i)
            day_spending = Transaction.objects.filter(
                date=day.date(),
                transaction_type='expense'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            
            daily_breakdown.append({
                'date': day.strftime('%Y-%m-%d'),
                'day': day.strftime('%a'),
                'spending': float(day_spending)
            })
        
        return Response({
            'current_week': {
                'total': current_total,
                'count': current_week['count'] or 0,
                'average': float(current_week['avg'] or 0),
                'daily_average': current_total / 7 if current_total > 0 else 0
            },
            'previous_week': {
                'total': prev_total,
                'count': prev_week['count'] or 0,
                'average': float(prev_week['avg'] or 0)
            },
            'change': {
                'amount': round(change_amount, 2),
                'percentage': round(change_percentage, 1),
                'direction': 'increase' if change_amount > 0 else 'decrease' if change_amount < 0 else 'stable'
            },
            'daily_breakdown': daily_breakdown
        })


class DailyAnalyticsView(APIView):
    """Get daily spending analytics."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        now = timezone.now()
        today = now.date()
        yesterday = today - timedelta(days=1)
        
        # Today's spending
        today_spending = Transaction.objects.filter(
            date=today,
            transaction_type='expense'
        ).aggregate(
            total=Sum('amount'),
            count=Count('id')
        )
        
        # Yesterday's spending
        yesterday_spending = Transaction.objects.filter(
            date=yesterday,
            transaction_type='expense'
        ).aggregate(
            total=Sum('amount'),
            count=Count('id')
        )
        
        # This month's daily average
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        days_in_month = (now - month_start).days + 1
        
        month_total = Transaction.objects.filter(
            date__gte=month_start.date(),
            transaction_type='expense'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        daily_average = float(month_total) / days_in_month if days_in_month > 0 else 0
        
        today_total = float(today_spending['total'] or 0)
        yesterday_total = float(yesterday_spending['total'] or 0)
        
        # Calculate change from yesterday
        if yesterday_total > 0:
            change_amount = today_total - yesterday_total
            change_percentage = (change_amount / yesterday_total) * 100
        else:
            change_amount = today_total
            change_percentage = 100 if today_total > 0 else 0
        
        # Hourly breakdown for today (if there are transactions)
        hourly_breakdown = []
        if today_total > 0:
            for hour in range(24):
                hour_start = now.replace(hour=hour, minute=0, second=0, microsecond=0)
                hour_end = hour_start + timedelta(hours=1)
                
                hour_spending = Transaction.objects.filter(
                    created_at__gte=hour_start,
                    created_at__lt=hour_end,
                    date=today,
                    transaction_type='expense'
                ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
                
                if hour_spending > 0:
                    hourly_breakdown.append({
                        'hour': hour,
                        'time': hour_start.strftime('%I %p'),
                        'spending': float(hour_spending)
                    })
        
        return Response({
            'today': {
                'total': today_total,
                'count': today_spending['count'] or 0,
                'date': today.strftime('%Y-%m-%d'),
                'date_display': today.strftime('%B %d, %Y')
            },
            'yesterday': {
                'total': yesterday_total,
                'count': yesterday_spending['count'] or 0,
                'date': yesterday.strftime('%Y-%m-%d'),
                'date_display': yesterday.strftime('%B %d, %Y')
            },
            'change': {
                'amount': round(change_amount, 2),
                'percentage': round(change_percentage, 1),
                'direction': 'increase' if change_amount > 0 else 'decrease' if change_amount < 0 else 'stable'
            },
            'monthly_daily_average': round(daily_average, 2),
            'hourly_breakdown': hourly_breakdown
        })

