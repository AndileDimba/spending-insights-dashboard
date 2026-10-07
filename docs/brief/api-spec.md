# Customer Spending Insights Dashboard API Endpoints

## 1. Customer Profile
```
GET /api/customers/{customerId}/profile
```

**Response:**
```json
{
  "customerId": "12345",
  "name": "John Doe",
  "email": "john.doe@email.com",
  "joinDate": "2023-01-15",
  "accountType": "premium",
  "totalSpent": 15420.50,
  "currency": "ZAR"
}
```

## 2. Spending Summary
```
GET /api/customers/{customerId}/spending/summary?period={period}
```

**Query Parameters:**
- `period`: `7d`, `30d`, `90d`, `1y` (default: `30d`)

**Response:**
```json
{
  "period": "30d",
  "totalSpent": 4250.75,
  "transactionCount": 47,
  "averageTransaction": 90.44,
  "topCategory": "Groceries",
  "comparedToPrevious": {
    "spentChange": 12.5,
    "transactionChange": -3.2
  }
}
```

## 3. Spending by Category (with Filtering)
```
GET /api/customers/{customerId}/spending/categories?period={period}&startDate={startDate}&endDate={endDate}
```

**Query Parameters:**
- `period`: `7d`, `30d`, `90d`, `1y` (default: `30d`) - Quick period selection
- `startDate`: `YYYY-MM-DD` format - Custom date range start (optional)
- `endDate`: `YYYY-MM-DD` format - Custom date range end (optional)

**Response:**
```json
{
  "dateRange": {
    "startDate": "2024-08-16",
    "endDate": "2024-09-16"
  },
  "totalAmount": 4250.75,
  "categories": [
    {
      "name": "Groceries",
      "amount": 1250.30,
      "percentage": 29.4,
      "transactionCount": 15,
      "color": "#FF6B6B",
      "icon": "shopping-cart"
    },
    {
      "name": "Entertainment",
      "amount": 890.20,
      "percentage": 20.9,
      "transactionCount": 8,
      "color": "#4ECDC4",
      "icon": "film"
    },
    {
      "name": "Transportation",
      "amount": 680.45,
      "percentage": 16.0,
      "transactionCount": 12,
      "color": "#45B7D1",
      "icon": "car"
    },
    {
      "name": "Dining",
      "amount": 520.30,
      "percentage": 12.2,
      "transactionCount": 9,
      "color": "#F7DC6F",
      "icon": "utensils"
    },
    {
      "name": "Shopping",
      "amount": 450.80,
      "percentage": 10.6,
      "transactionCount": 6,
      "color": "#BB8FCE",
      "icon": "shopping-bag"
    },
    {
      "name": "Utilities",
      "amount": 458.70,
      "percentage": 10.8,
      "transactionCount": 3,
      "color": "#85C1E9",
      "icon": "zap"
    }
  ]
}
```

## 4. Monthly Spending Trends
```
GET /api/customers/{customerId}/spending/trends?months={months}
```

**Query Parameters:**
- `months`: number of months to retrieve (default: 12, max: 24)

**Response:**
```json
{
  "trends": [
    {
      "month": "2024-01",
      "totalSpent": 3890.25,
      "transactionCount": 42,
      "averageTransaction": 92.62
    },
    {
      "month": "2024-02", 
      "totalSpent": 4150.80,
      "transactionCount": 38,
      "averageTransaction": 109.23
    },
    {
      "month": "2024-03",
      "totalSpent": 3750.60,
      "transactionCount": 45,
      "averageTransaction": 83.35
    },
    {
      "month": "2024-04",
      "totalSpent": 4200.45,
      "transactionCount": 39,
      "averageTransaction": 107.70
    },
    {
      "month": "2024-05",
      "totalSpent": 3980.30,
      "transactionCount": 44,
      "averageTransaction": 90.46
    },
    {
      "month": "2024-06",
      "totalSpent": 4250.75,
      "transactionCount": 47,
      "averageTransaction": 90.44
    }
  ]
}
```

## 5. Transactions with Filtering
```
GET /api/customers/{customerId}/transactions?limit={limit}&offset={offset}&category={category}&startDate={startDate}&endDate={endDate}&sortBy={sortBy}
```

**Query Parameters:**
- `limit`: number of transactions (default: 20, max: 100)
- `offset`: pagination offset (default: 0)
- `category`: filter by specific category (optional)
- `startDate`: `YYYY-MM-DD` format - filter from date (optional)
- `endDate`: `YYYY-MM-DD` format - filter to date (optional)
- `sortBy`: `date_desc`, `date_asc`, `amount_desc`, `amount_asc` (default: `date_desc`)

**Response:**
```json
{
  "transactions": [
    {
      "id": "txn_123456",
      "date": "2024-09-16T14:30:00Z",
      "merchant": "Pick n Pay",
      "category": "Groceries",
      "amount": 245.80,
      "description": "Weekly groceries",
      "paymentMethod": "Credit Card",
      "icon": "shopping-cart",
      "categoryColor": "#FF6B6B"
    },
    {
      "id": "txn_123457",
      "date": "2024-09-15T10:15:00Z",
      "merchant": "Netflix",
      "category": "Entertainment",
      "amount": 199.00,
      "description": "Monthly subscription",
      "paymentMethod": "Debit Order",
      "icon": "film",
      "categoryColor": "#4ECDC4"
    }
  ],
  "pagination": {
    "total": 1250,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

## 6. Spending Goals
```
GET /api/customers/{customerId}/goals
```

**Response:**
```json
{
  "goals": [
    {
      "id": "goal_001",
      "category": "Entertainment",
      "monthlyBudget": 1000.00,
      "currentSpent": 650.30,
      "percentageUsed": 65.03,
      "daysRemaining": 12,
      "status": "on_track"
    },
    {
      "id": "goal_002",
      "category": "Groceries",
      "monthlyBudget": 1500.00,
      "currentSpent": 1450.80,
      "percentageUsed": 96.72,
      "daysRemaining": 12,
      "status": "warning"
    }
  ]
}
```

## 7. Available Categories and Filters
```
GET /api/customers/{customerId}/filters
```

**Response:**
```json
{
  "categories": [
    {
      "name": "Groceries",
      "color": "#FF6B6B",
      "icon": "shopping-cart"
    },
    {
      "name": "Entertainment",
      "color": "#4ECDC4", 
      "icon": "film"
    },
    {
      "name": "Transportation",
      "color": "#45B7D1",
      "icon": "car"
    },
    {
      "name": "Dining",
      "color": "#F7DC6F",
      "icon": "utensils"
    },
    {
      "name": "Shopping",
      "color": "#BB8FCE",
      "icon": "shopping-bag"
    },
    {
      "name": "Utilities",
      "color": "#85C1E9",
      "icon": "zap"
    }
  ],
  "dateRangePresets": [
    {
      "label": "Last 7 days",
      "value": "7d"
    },
    {
      "label": "Last 30 days", 
      "value": "30d"
    },
    {
      "label": "Last 90 days",
      "value": "90d"
    },
    {
      "label": "Last year",
      "value": "1y"
    }
  ]
}