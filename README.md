# 🤖 AI-Powered Expense Tracker

A full-stack fintech application built with **Django REST Framework** and **React**, featuring intelligent expense categorization, receipt OCR scanning, CSV bank import, and ML-powered budget forecasting.

> **Built by Harsh Mewada** | Backend Developer Intern @ Wealthy

![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![Django](https://img.shields.io/badge/Django-4.2-green?logo=django)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)

---

## ✨ Features

### 🧠 AI-Powered Categorization
- **OpenAI GPT Integration**: Automatically categorizes transactions based on description, merchant, and amount
- **Smart Keyword Matching**: Fast rule-based categorization with AI fallback
- **Confidence Scoring**: Shows how confident the AI is in its categorization

### 📸 Receipt OCR Scanning
- **Tesseract OCR**: Extract text from receipt images
- **Intelligent Parsing**: Automatically identifies merchant, items, total, tax, and date
- **One-Click Transaction Creation**: Convert scanned receipts to transactions instantly

### 📊 ML Budget Forecasting
- **scikit-learn Models**: Predict future spending patterns
- **Trend Analysis**: Identify if spending is increasing, decreasing, or stable
- **Anomaly Detection**: Flag unusual transactions using Isolation Forest algorithm
- **Personalized Recommendations**: AI-generated financial advice

### 📤 CSV Bank Import
- **Universal Format Support**: Import transactions from any bank's CSV export
- **Smart Parsing**: Auto-detects date formats and transaction types
- **Bulk AI Categorization**: All imported transactions categorized automatically
- **Export Capability**: Download your transactions as CSV anytime

### 📱 Modern React Frontend
- **Dark Theme UI**: Beautiful, modern interface with glass morphism effects
- **Responsive Design**: Works on desktop and mobile
- **Interactive Charts**: Visualize spending with Recharts
- **Real-time Updates**: React Query for efficient data fetching

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Python 3.11+ | Core language |
| Django 4.2 | Web framework |
| Django REST Framework | API development |
| PostgreSQL | Production database |
| Celery + Redis | Background task processing |
| OpenAI API | AI transaction categorization |
| Tesseract + Pillow | Receipt OCR |
| scikit-learn | ML forecasting |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| TailwindCSS | Styling |
| React Query | Data fetching |
| Zustand | State management |
| Recharts | Data visualization |
| react-dropzone | File uploads |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (optional, SQLite for development)
- Tesseract OCR (`brew install tesseract` on macOS)
- Redis (for Celery, optional)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run migrations
python manage.py migrate

# Create default categories
python manage.py create_default_categories

# Create superuser (optional)
python manage.py createsuperuser

# Run server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Django
SECRET_KEY=your-secret-key
DEBUG=True

# OpenAI (for AI categorization)
OPENAI_API_KEY=sk-your-openai-key

# Plaid (for bank sync)
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENV=sandbox

# Optional: Redis for Celery
REDIS_URL=redis://localhost:6379/0
```

---

## 📁 Project Structure

```
expense-tracker/
├── backend/
│   ├── config/                 # Django settings & configuration
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── celery.py
│   ├── apps/
│   │   ├── users/              # User management & auth
│   │   ├── transactions/       # Core expense tracking
│   │   │   ├── models.py       # Transaction, Category, Budget
│   │   │   ├── views.py        # CRUD operations
│   │   │   └── services/
│   │   │       └── ai_categorizer.py  # 🧠 AI categorization
│   │   ├── receipts/           # Receipt scanning
│   │   │   ├── models.py
│   │   │   └── services/
│   │   │       └── ocr_service.py     # 📸 OCR processing
│   │   ├── banking/            # Plaid integration
│   │   │   └── services/
│   │   │       └── plaid_service.py   # 🏦 Bank sync
│   │   └── analytics/          # ML forecasting
│   │       └── services/
│   │           └── forecasting.py     # 📊 Budget prediction
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/         # Reusable UI components
    │   ├── pages/              # Page components
    │   │   ├── Dashboard.tsx   # Main dashboard
    │   │   ├── Transactions.tsx
    │   │   ├── Receipts.tsx    # Receipt scanner
    │   │   └── Analytics.tsx   # ML insights
    │   ├── store/              # Zustand state
    │   └── lib/                # Utilities & API client
    └── package.json
```

---

## 🔌 API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/token/` | POST | Get JWT tokens |
| `/api/auth/token/refresh/` | POST | Refresh access token |
| `/api/users/register/` | POST | Register new user |
| `/api/users/profile/` | GET/PATCH | User profile |

### Transactions
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transactions/transactions/` | GET/POST | List/Create transactions |
| `/api/transactions/transactions/{id}/` | GET/PUT/DELETE | Transaction details |
| `/api/transactions/transactions/{id}/recategorize/` | POST | Re-run AI categorization |
| `/api/transactions/categories/` | GET/POST | Expense categories |
| `/api/transactions/budgets/` | GET/POST | Budget limits |

### Receipts
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/receipts/` | GET/POST | List/Upload receipts |
| `/api/receipts/{id}/reprocess/` | POST | Re-run OCR |
| `/api/receipts/{id}/create_transaction/` | POST | Convert to transaction |

### Analytics
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/forecast/` | GET | Spending predictions |
| `/api/analytics/anomalies/` | GET | Unusual transactions |
| `/api/analytics/insights/` | GET | AI recommendations |

### Banking (Plaid)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/banking/plaid/link-token/` | GET | Get Plaid Link token |
| `/api/banking/plaid/exchange/` | POST | Exchange public token |
| `/api/banking/connections/` | GET | Linked bank accounts |
| `/api/banking/connections/{id}/sync/` | POST | Sync transactions |

---

## 🧪 Demo Flow

### Receipt Scanning Demo
1. Upload a receipt image (photo of any restaurant/store receipt)
2. Watch AI extract merchant name, items, and total
3. Review the extracted data with confidence scores
4. One-click to create a transaction

### AI Categorization Demo
1. Add a new transaction: "Starbucks coffee"
2. Leave category as "Auto-categorize with AI"
3. See AI automatically categorize as "Food & Dining"
4. View confidence score (e.g., 95%)

### Budget Forecasting Demo
1. Add several transactions over different dates
2. Navigate to Analytics page
3. View predicted spending for next 3-6 months
4. See trend analysis (increasing/decreasing/stable)

---

## 🎯 Key Implementation Highlights

### 1. AI Categorization Service
```python
# apps/transactions/services/ai_categorizer.py
class AICategorizer:
    def categorize(self, description, merchant, amount, user):
        # 1. Try fast rule-based matching first
        # 2. Fall back to OpenAI GPT for complex cases
        # 3. Return category with confidence score
```

### 2. OCR Receipt Processing
```python
# apps/receipts/services/ocr_service.py
class ReceiptOCRService:
    def process_receipt(self, image_file):
        # 1. Preprocess image (grayscale, contrast, threshold)
        # 2. Extract text with Tesseract
        # 3. Parse structured data (merchant, items, total)
        # 4. Calculate confidence score
```

### 3. ML Budget Forecasting
```python
# apps/analytics/services/forecasting.py
class BudgetForecastingService:
    def get_spending_forecast(self, months_ahead):
        # 1. Aggregate historical spending by month
        # 2. Train Ridge regression model
        # 3. Predict future spending with confidence intervals
        # 4. Detect anomalies with Isolation Forest
```

---

## 📈 Future Improvements

- [ ] Add recurring transaction detection
- [ ] Implement budget alerts via email/push
- [ ] Add multi-currency support
- [ ] Create mobile app with React Native
- [ ] Add invoice generation for freelancers
- [ ] Implement tax calculation features

---

## 🤝 Contributing

This is a portfolio project, but feel free to:
- ⭐ Star this repo
- 🐛 Report bugs
- 💡 Suggest features

---

## 📄 License

MIT License - feel free to use for learning or building your own projects!

---

## 👨‍💻 Author

**Harsh Mewada**
- 🏢 Backend Developer Intern @ Wealthy
- 🐍 Python & Django Specialist
- 📧 Contact: [Your Email]
- 💼 LinkedIn: [Your LinkedIn]
- 🐙 GitHub: [Your GitHub]
