"""
ML-Powered Budget Forecasting Service using scikit-learn.

This service provides:
1. Spending trend analysis
2. Budget predictions for upcoming months
3. Anomaly detection for unusual spending
4. Category-wise spending forecasts
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from decimal import Decimal

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from django.db.models import Sum, Count, Avg
from django.db.models.functions import TruncMonth, TruncWeek, TruncDate
from django.utils import timezone

logger = logging.getLogger(__name__)


class BudgetForecastingService:
    """
    ML service for budget prediction and spending analysis.
    
    Uses:
    - Linear Regression for trend prediction
    - Isolation Forest for anomaly detection
    - Time series analysis for seasonal patterns
    """
    
    def __init__(self, user=None):
        self.user = user
        self.scaler = StandardScaler()
    
    def get_spending_forecast(self, months_ahead: int = 3) -> Dict[str, Any]:
        """
        Predict spending for upcoming months.
        
        Returns:
            Dict with monthly predictions and confidence intervals
        """
        from apps.transactions.models import Transaction
        
        # Get historical monthly spending
        monthly_data = Transaction.objects.filter(
            transaction_type='expense'
        ).annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('month')
        
        if len(monthly_data) < 3:
            return {
                'success': False,
                'error': 'Not enough historical data (need at least 3 months)',
                'predictions': []
            }
        
        # Prepare data for ML
        df = pd.DataFrame(list(monthly_data))
        df['month_num'] = range(len(df))
        df['total'] = df['total'].astype(float)
        
        X = df[['month_num']].values
        y = df['total'].values
        
        # Train model
        model = Ridge(alpha=1.0)
        model.fit(X, y)
        
        # Calculate confidence based on R² score
        train_score = model.score(X, y)
        
        # Predict future months
        predictions = []
        last_month = df['month'].max()
        
        for i in range(1, months_ahead + 1):
            future_month_num = len(df) + i - 1
            prediction = model.predict([[future_month_num]])[0]
            
            # Calculate prediction interval (simple approach)
            residuals = y - model.predict(X)
            std_error = np.std(residuals)
            
            future_date = last_month + timedelta(days=32 * i)
            future_date = future_date.replace(day=1)
            
            predictions.append({
                'month': future_date.strftime('%Y-%m'),
                'predicted_spending': round(max(0, prediction), 2),
                'lower_bound': round(max(0, prediction - 2 * std_error), 2),
                'upper_bound': round(prediction + 2 * std_error, 2),
                'confidence': round(train_score * 100, 1)
            })
        
        # Calculate trend
        slope = model.coef_[0]
        trend = 'increasing' if slope > 50 else 'decreasing' if slope < -50 else 'stable'
        
        return {
            'success': True,
            'historical_months': len(df),
            'trend': trend,
            'monthly_change': round(slope, 2),
            'model_accuracy': round(train_score * 100, 1),
            'predictions': predictions,
            'historical_data': [
                {
                    'month': row['month'].strftime('%Y-%m'),
                    'spending': float(row['total'])
                }
                for _, row in df.iterrows()
            ]
        }
    
    def get_category_forecast(self, category_id: int, weeks_ahead: int = 4) -> Dict[str, Any]:
        """
        Predict spending for a specific category.
        """
        from apps.transactions.models import Transaction
        
        weekly_data = Transaction.objects.filter(
            transaction_type='expense',
            category_id=category_id
        ).annotate(
            week=TruncWeek('date')
        ).values('week').annotate(
            total=Sum('amount')
        ).order_by('week')
        
        if len(weekly_data) < 4:
            return {
                'success': False,
                'error': 'Not enough data for this category'
            }
        
        df = pd.DataFrame(list(weekly_data))
        df['week_num'] = range(len(df))
        df['total'] = df['total'].astype(float)
        
        X = df[['week_num']].values
        y = df['total'].values
        
        model = LinearRegression()
        model.fit(X, y)
        
        predictions = []
        last_week = df['week'].max()
        
        for i in range(1, weeks_ahead + 1):
            future_week_num = len(df) + i - 1
            prediction = model.predict([[future_week_num]])[0]
            
            future_date = last_week + timedelta(weeks=i)
            
            predictions.append({
                'week': future_date.strftime('%Y-%m-%d'),
                'predicted_spending': round(max(0, prediction), 2)
            })
        
        return {
            'success': True,
            'predictions': predictions
        }
    
    def detect_anomalies(self) -> List[Dict[str, Any]]:
        """
        Detect unusual spending patterns using Isolation Forest.
        """
        from apps.transactions.models import Transaction
        
        # Get recent transactions
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        
        transactions = Transaction.objects.filter(
            transaction_type='expense',
            date__gte=thirty_days_ago
        ).values('id', 'amount', 'description', 'merchant', 'category__name', 'date')
        
        if len(transactions) < 10:
            return []
        
        df = pd.DataFrame(list(transactions))
        df['amount'] = df['amount'].astype(float)
        
        # Feature engineering
        X = df[['amount']].values
        
        # Fit Isolation Forest
        clf = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100
        )
        
        predictions = clf.fit_predict(X)
        
        # Get anomalies
        anomalies = []
        for idx, pred in enumerate(predictions):
            if pred == -1:  # Anomaly
                row = df.iloc[idx]
                anomalies.append({
                    'transaction_id': row['id'],
                    'amount': row['amount'],
                    'description': row['description'],
                    'merchant': row['merchant'],
                    'category': row['category__name'],
                    'date': row['date'].strftime('%Y-%m-%d'),
                    'reason': 'Unusually high amount compared to your spending patterns'
                })
        
        return anomalies
    
    def get_spending_insights(self) -> Dict[str, Any]:
        """
        Generate comprehensive spending insights.
        """
        from apps.transactions.models import Transaction
        
        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        
        # Current month spending
        current_month = Transaction.objects.filter(
            user=self.user,
            transaction_type='expense',
            date__gte=current_month_start.date()
        ).aggregate(
            total=Sum('amount'),
            count=Count('id'),
            avg=Avg('amount')
        )
        
        # Last month spending
        last_month = Transaction.objects.filter(
            user=self.user,
            transaction_type='expense',
            date__gte=last_month_start.date(),
            date__lt=current_month_start.date()
        ).aggregate(total=Sum('amount'))
        
        # Top spending categories
        top_categories = Transaction.objects.filter(
            user=self.user,
            transaction_type='expense',
            date__gte=current_month_start.date()
        ).values(
            'category__name', 'category__icon'
        ).annotate(
            total=Sum('amount')
        ).order_by('-total')[:5]
        
        # Daily average
        days_in_month = (now - current_month_start).days or 1
        daily_avg = float(current_month['total'] or 0) / days_in_month
        
        # Month-over-month change
        current_total = float(current_month['total'] or 0)
        last_total = float(last_month['total'] or 0)
        
        if last_total > 0:
            mom_change = ((current_total - last_total) / last_total) * 100
        else:
            mom_change = 0
        
        return {
            'current_month': {
                'total': current_total,
                'transaction_count': current_month['count'] or 0,
                'average_transaction': float(current_month['avg'] or 0),
                'daily_average': round(daily_avg, 2)
            },
            'comparison': {
                'last_month_total': last_total,
                'change_percentage': round(mom_change, 1),
                'trend': 'up' if mom_change > 5 else 'down' if mom_change < -5 else 'stable'
            },
            'top_categories': [
                {
                    'name': cat['category__name'],
                    'icon': cat['category__icon'],
                    'amount': float(cat['total'])
                }
                for cat in top_categories
            ],
            'recommendations': self._generate_recommendations(
                current_total, last_total, list(top_categories)
            )
        }
    
    def _generate_recommendations(
        self,
        current_spending: float,
        last_spending: float,
        top_categories: list
    ) -> List[str]:
        """Generate personalized spending recommendations."""
        recommendations = []
        
        if current_spending > last_spending * 1.2:
            recommendations.append(
                "📈 Your spending is 20%+ higher than last month. Consider reviewing your expenses."
            )
        
        if top_categories:
            top_cat = top_categories[0]
            recommendations.append(
                f"💡 {top_cat['category__name']} is your highest expense category this month."
            )
        
        if float(self.user.monthly_budget) > 0:
            budget_usage = (current_spending / float(self.user.monthly_budget)) * 100
            if budget_usage > 80:
                recommendations.append(
                    f"⚠️ You've used {budget_usage:.0f}% of your monthly budget."
                )
            elif budget_usage < 50:
                recommendations.append(
                    f"✅ Great job! You've only used {budget_usage:.0f}% of your budget."
                )
        
        return recommendations
