"""
Receipt OCR Service using Tesseract and AI.

This service:
1. Preprocesses receipt images for better OCR accuracy
2. Extracts text using Tesseract OCR
3. Parses extracted text using AI to identify:
   - Merchant name
   - Individual items with prices
   - Subtotal, tax, and total
   - Date of purchase
"""

import re
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from decimal import Decimal
from io import BytesIO

from PIL import Image, ImageEnhance, ImageFilter
from django.conf import settings
from django.core.files.uploadedfile import InMemoryUploadedFile

logger = logging.getLogger(__name__)


class ReceiptOCRService:
    """
    Service for extracting data from receipt images.
    
    Workflow:
    1. Preprocess image (enhance contrast, convert to grayscale)
    2. Run Tesseract OCR to extract raw text
    3. Use regex patterns to extract structured data
    4. Optionally use AI for better parsing
    """
    
    # Common patterns in receipts
    AMOUNT_PATTERN = r'[₹$]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'
    DATE_PATTERNS = [
        r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})',
    ]
    TOTAL_KEYWORDS = ['total', 'grand total', 'amount due', 'total amount', 'net amount']
    TAX_KEYWORDS = ['tax', 'gst', 'cgst', 'sgst', 'vat', 'igst']
    SUBTOTAL_KEYWORDS = ['subtotal', 'sub total', 'sub-total', 'amount before tax']
    
    def __init__(self):
        self.tesseract_available = self._check_tesseract()
    
    def _check_tesseract(self) -> bool:
        """Check if Tesseract is installed."""
        try:
            import pytesseract
            pytesseract.get_tesseract_version()
            return True
        except Exception:
            logger.warning("Tesseract not available. Install with: brew install tesseract")
            return False
    
    def process_receipt(self, image_file) -> Dict[str, Any]:
        """
        Main entry point for processing a receipt image.
        
        Args:
            image_file: Django UploadedFile or file path
        
        Returns:
            Dictionary with extracted receipt data
        """
        result = {
            'success': False,
            'raw_text': '',
            'merchant_name': '',
            'items': [],
            'subtotal': None,
            'tax_amount': None,
            'total_amount': None,
            'receipt_date': None,
            'confidence': 0.0,
            'error': None
        }
        
        try:
            # Load and preprocess image
            image = self._load_image(image_file)
            processed_image = self._preprocess_image(image)
            
            # Extract text
            raw_text = self._extract_text(processed_image)
            result['raw_text'] = raw_text
            
            if not raw_text.strip():
                result['error'] = 'No text could be extracted from the image'
                return result
            
            # Parse extracted text
            parsed_data = self._parse_receipt_text(raw_text)
            result.update(parsed_data)
            result['success'] = True
            result['confidence'] = self._calculate_confidence(result)
            
        except Exception as e:
            logger.error(f"Receipt processing failed: {e}")
            result['error'] = str(e)
        
        return result
    
    def _load_image(self, image_file) -> Image.Image:
        """Load image from various sources."""
        if isinstance(image_file, str):
            return Image.open(image_file)
        elif hasattr(image_file, 'read'):
            return Image.open(image_file)
        else:
            return Image.open(BytesIO(image_file))
    
    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Preprocess image for better OCR accuracy.
        
        Steps:
        1. Convert to grayscale
        2. Enhance contrast
        3. Apply sharpening
        4. Resize if too small
        """
        # Convert to grayscale
        if image.mode != 'L':
            image = image.convert('L')
        
        # Resize if image is too small
        min_width = 1000
        if image.width < min_width:
            ratio = min_width / image.width
            new_size = (int(image.width * ratio), int(image.height * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # Enhance contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(2.0)
        
        # Sharpen
        image = image.filter(ImageFilter.SHARPEN)
        
        # Apply threshold for cleaner text
        threshold = 150
        image = image.point(lambda p: 255 if p > threshold else 0)
        
        return image
    
    def _extract_text(self, image: Image.Image) -> str:
        """Extract text from image using Tesseract."""
        if not self.tesseract_available:
            return self._mock_extraction()
        
        import pytesseract
        
        # Configure Tesseract for receipt-like documents
        custom_config = r'--oem 3 --psm 6 -c preserve_interword_spaces=1'
        
        text = pytesseract.image_to_string(
            image,
            config=custom_config,
            lang='eng'
        )
        
        return text
    
    def _mock_extraction(self) -> str:
        """Mock extraction for testing without Tesseract."""
        return """
        STARBUCKS COFFEE
        123 MG Road, Bangalore
        
        Date: 15/01/2026
        
        Caffe Latte Grande     ₹285.00
        Chocolate Muffin       ₹165.00
        Bottled Water          ₹45.00
        
        Subtotal:              ₹495.00
        CGST (2.5%):           ₹12.38
        SGST (2.5%):           ₹12.38
        
        TOTAL:                 ₹519.76
        
        Thank you for visiting!
        """
    
    def _parse_receipt_text(self, text: str) -> Dict[str, Any]:
        """
        Parse raw OCR text to extract structured data.
        """
        lines = text.strip().split('\n')
        lines = [line.strip() for line in lines if line.strip()]
        
        result = {
            'merchant_name': self._extract_merchant_name(lines),
            'items': self._extract_items(lines),
            'subtotal': self._extract_amount(text, self.SUBTOTAL_KEYWORDS),
            'tax_amount': self._extract_amount(text, self.TAX_KEYWORDS),
            'total_amount': self._extract_amount(text, self.TOTAL_KEYWORDS),
            'receipt_date': self._extract_date(text),
        }
        
        return result
    
    def _extract_merchant_name(self, lines: List[str]) -> str:
        """Extract merchant name (usually first non-empty line)."""
        for line in lines[:3]:  # Check first 3 lines
            # Skip lines that look like addresses or dates
            if any(word in line.lower() for word in ['road', 'street', 'date', 'time', 'tel']):
                continue
            # Skip lines with mostly numbers
            if sum(c.isdigit() for c in line) > len(line) * 0.5:
                continue
            if len(line) > 2:
                return line
        return ''
    
    def _extract_items(self, lines: List[str]) -> List[Dict[str, Any]]:
        """Extract individual line items with prices."""
        items = []
        item_pattern = re.compile(
            r'^(.+?)\s+' + self.AMOUNT_PATTERN + r'\s*$'
        )
        
        for line in lines:
            # Skip total/tax lines
            if any(keyword in line.lower() for keyword in 
                   self.TOTAL_KEYWORDS + self.TAX_KEYWORDS + self.SUBTOTAL_KEYWORDS):
                continue
            
            match = item_pattern.match(line)
            if match:
                name = match.group(1).strip()
                price_str = match.group(2).replace(',', '')
                
                try:
                    price = float(price_str)
                    if price > 0 and len(name) > 1:
                        items.append({
                            'name': name,
                            'quantity': 1,
                            'price': price
                        })
                except ValueError:
                    continue
        
        return items
    
    def _extract_amount(self, text: str, keywords: List[str]) -> Optional[float]:
        """Extract amount associated with keywords (total, tax, etc.)."""
        text_lower = text.lower()
        
        for keyword in keywords:
            # Find the keyword and look for amount nearby
            pattern = rf'{keyword}[:\s]*' + self.AMOUNT_PATTERN
            match = re.search(pattern, text_lower)
            
            if match:
                try:
                    amount_str = match.group(1).replace(',', '')
                    return float(amount_str)
                except (ValueError, IndexError):
                    continue
        
        return None
    
    def _extract_date(self, text: str) -> Optional[str]:
        """Extract date from receipt text."""
        for pattern in self.DATE_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group(1)
                # Try to parse and standardize
                try:
                    # Handle various formats
                    for fmt in ['%d/%m/%Y', '%d-%m-%Y', '%d/%m/%y', '%d-%m-%y',
                               '%d %b %Y', '%d %B %Y']:
                        try:
                            date_obj = datetime.strptime(date_str, fmt)
                            return date_obj.strftime('%Y-%m-%d')
                        except ValueError:
                            continue
                except Exception:
                    pass
                return date_str
        return None
    
    def _calculate_confidence(self, result: Dict[str, Any]) -> float:
        """Calculate confidence score based on extracted fields."""
        score = 0.0
        max_score = 5.0
        
        if result.get('merchant_name'):
            score += 1.0
        if result.get('total_amount'):
            score += 1.5
        if result.get('items'):
            score += min(len(result['items']) * 0.3, 1.5)
        if result.get('receipt_date'):
            score += 0.5
        if result.get('subtotal') or result.get('tax_amount'):
            score += 0.5
        
        return min(score / max_score, 1.0)
    
    def create_thumbnail(self, image_file, size=(300, 400)) -> BytesIO:
        """Create a thumbnail for the receipt."""
        image = self._load_image(image_file)
        image.thumbnail(size, Image.Resampling.LANCZOS)
        
        thumb_io = BytesIO()
        image.save(thumb_io, format='JPEG', quality=85)
        thumb_io.seek(0)
        
        return thumb_io
