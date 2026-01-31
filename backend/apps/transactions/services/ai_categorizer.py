"""
AI-Powered Transaction Categorizer using Google Gemini.

This service automatically categorizes transactions based on:
- Transaction description
- Merchant name
- Amount patterns
- User's historical categorization preferences
"""

import json
import logging
from typing import Optional, Dict, Any
from django.conf import settings
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


class AICategorizer:
    """
    AI service for intelligent transaction categorization.
    
    Uses Google Gemini to analyze transaction details and suggest
    the most appropriate category with confidence scoring.
    """
    
    DEFAULT_CATEGORIES = [
        {"name": "Food & Dining", "keywords": ["restaurant", "cafe", "starbucks", "zomato", "swiggy", "uber eats"]},
        {"name": "Groceries", "keywords": ["grocery", "supermarket", "dmart", "bigbasket", "vegetables", "fruits"]},
        {"name": "Transportation", "keywords": ["uber", "ola", "metro", "petrol", "fuel", "parking", "toll"]},
        {"name": "Shopping", "keywords": ["amazon", "flipkart", "myntra", "mall", "store"]},
        {"name": "Entertainment", "keywords": ["netflix", "spotify", "movie", "theatre", "game", "disney"]},
        {"name": "Utilities", "keywords": ["electricity", "water", "gas", "internet", "phone", "mobile"]},
        {"name": "Healthcare", "keywords": ["hospital", "pharmacy", "doctor", "medicine", "clinic", "health"]},
        {"name": "Education", "keywords": ["course", "udemy", "book", "school", "college", "training"]},
        {"name": "Travel", "keywords": ["hotel", "flight", "airbnb", "makemytrip", "booking", "train"]},
        {"name": "Subscriptions", "keywords": ["subscription", "membership", "premium", "monthly"]},
        {"name": "Personal Care", "keywords": ["salon", "spa", "grooming", "haircut", "beauty"]},
        {"name": "Rent & Housing", "keywords": ["rent", "maintenance", "society", "housing"]},
        {"name": "Income", "keywords": ["salary", "freelance", "payment received", "refund", "dividend"]},
        {"name": "Transfer", "keywords": ["transfer", "upi", "neft", "imps"]},
        {"name": "Other", "keywords": []},
    ]
    
    def __init__(self):
        self.client = None
        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if api_key:
            logger.info("Initializing Gemini AI with API key")
            try:
                self.client = genai.Client(api_key=api_key)
                logger.info("Gemini AI initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini AI: {e}")
        else:
            logger.warning("GEMINI_API_KEY not found in settings - AI categorization will be disabled")
    
    def categorize(
        self,
        description: str,
        merchant: str = "",
        amount: float = 0,
        user=None
    ) -> Optional[Dict[str, Any]]:
        """
        Categorize a transaction using AI.
        
        Args:
            description: Transaction description
            merchant: Merchant/vendor name
            amount: Transaction amount
            user: User object for personalized categorization
        
        Returns:
            Dict with category, confidence, and suggested_name
        """
        # First, try rule-based categorization for speed
        rule_result = self._rule_based_categorize(description, merchant)
        if rule_result and rule_result['confidence'] > 0.8:
            logger.info(f"Rule-based categorization: {rule_result['suggested_name']} (confidence: {rule_result['confidence']:.2f})")
            return self._resolve_category(rule_result, user)
        
        # Fall back to AI categorization
        if self.client:
            logger.info(f"Using Gemini AI to categorize: {description}")
            ai_result = self._ai_categorize(description, merchant, amount)
            if ai_result:
                logger.info(f"AI categorization: {ai_result['suggested_name']} (confidence: {ai_result['confidence']:.2f})")
                return self._resolve_category(ai_result, user)
        else:
            logger.warning("Gemini client not available, skipping AI categorization")
        
        # If AI is not available, use rule-based result
        if rule_result:
            return self._resolve_category(rule_result, user)
        
        return None
    
    def _rule_based_categorize(
        self,
        description: str,
        merchant: str
    ) -> Optional[Dict[str, Any]]:
        """
        Fast keyword-based categorization.
        """
        text = f"{description} {merchant}".lower()
        
        best_match = None
        best_score = 0
        
        for cat in self.DEFAULT_CATEGORIES:
            for keyword in cat['keywords']:
                if keyword in text:
                    # Score based on keyword length (longer = more specific)
                    score = len(keyword) / 20  # Normalize to 0-1
                    if score > best_score:
                        best_score = score
                        best_match = cat['name']
        
        if best_match:
            # Confidence is based on match score
            confidence = min(0.5 + best_score, 0.95)
            return {
                'suggested_name': best_match,
                'confidence': confidence
            }
        
        return None
    
    def _ai_categorize(
        self,
        description: str,
        merchant: str,
        amount: float
    ) -> Optional[Dict[str, Any]]:
        """
        Use Google Gemini for intelligent categorization.
        """
        try:
            category_names = [cat['name'] for cat in self.DEFAULT_CATEGORIES]
            
            prompt = f"""Categorize this financial transaction into one of the given categories.

Transaction Details:
- Description: {description}
- Merchant: {merchant or 'Unknown'}
- Amount: ₹{amount:,.2f}

Available Categories: {', '.join(category_names)}

Respond with JSON only (no markdown, no code blocks):
{{"category": "Category Name", "confidence": 0.95, "reasoning": "Brief explanation"}}
"""
            
            response = self.client.models.generate_content(
                model='gemini-2.0-flash-exp',
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    max_output_tokens=150,
                )
            )
            
            result_text = response.text.strip()
            
            # Clean up response - remove markdown code blocks if present
            if result_text.startswith('```'):
                result_text = result_text.split('```')[1]
                if result_text.startswith('json'):
                    result_text = result_text[4:]
                result_text = result_text.strip()
            
            # Parse JSON response
            result = json.loads(result_text)
            
            logger.info(f"Gemini response: {result}")
            
            return {
                'suggested_name': result.get('category', 'Other'),
                'confidence': float(result.get('confidence', 0.7)),
                'reasoning': result.get('reasoning', '')
            }
            
        except Exception as e:
            logger.error(f"AI categorization failed: {e}", exc_info=True)
            return None
    
    def _resolve_category(
        self,
        result: Dict[str, Any],
        user
    ) -> Dict[str, Any]:
        """
        Resolve category name to actual Category model instance.
        """
        from apps.transactions.models import Category
        
        suggested_name = result['suggested_name']
        
        # Try to find matching category
        category = None
        
        if user:
            # First, check user's custom categories
            category = Category.objects.filter(
                user=user,
                name__iexact=suggested_name
            ).first()
        
        if not category:
            # Check default categories
            category = Category.objects.filter(
                user=None,
                name__iexact=suggested_name
            ).first()
        
        if not category:
            # Fuzzy match - find category containing the keyword
            category = Category.objects.filter(
                name__icontains=suggested_name.split()[0]
            ).first()
        
        return {
            'category': category,
            'suggested_name': suggested_name,
            'confidence': result['confidence']
        }
    
    def batch_categorize(self, transactions: list) -> list:
        """
        Categorize multiple transactions efficiently.
        """
        results = []
        for txn in transactions:
            result = self.categorize(
                description=txn.get('description', ''),
                merchant=txn.get('merchant', ''),
                amount=txn.get('amount', 0)
            )
            results.append({
                'transaction': txn,
                'categorization': result
            })
        return results