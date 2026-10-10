// Reference data for the mock API. Category names, colours and icons are the
// ones in docs/brief/api-spec.md; merchants are familiar South African names
// so the demo reads like a real statement. Amounts are in rand.

export const CATEGORIES = [
  { name: 'Groceries', color: '#FF6B6B', icon: 'shopping-cart' },
  { name: 'Entertainment', color: '#4ECDC4', icon: 'film' },
  { name: 'Transportation', color: '#45B7D1', icon: 'car' },
  { name: 'Dining', color: '#F7DC6F', icon: 'utensils' },
  { name: 'Shopping', color: '#BB8FCE', icon: 'shopping-bag' },
  { name: 'Utilities', color: '#85C1E9', icon: 'zap' },
] as const

export type CategoryName = (typeof CATEGORIES)[number]['name']

export const PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'Debit Order'] as const

export interface Merchant {
  name: string
  category: CategoryName
  minAmount: number
  maxAmount: number
  descriptions: readonly string[]
  /** How often the merchant is chosen for a day-to-day purchase. */
  weight: number
}

/** Day-to-day card purchases. */
export const MERCHANTS: readonly Merchant[] = [
  {
    name: 'Pick n Pay',
    category: 'Groceries',
    minAmount: 85,
    maxAmount: 950,
    descriptions: ['Weekly groceries', 'Top-up shop'],
    weight: 6,
  },
  {
    name: 'Woolworths Food',
    category: 'Groceries',
    minAmount: 60,
    maxAmount: 780,
    descriptions: ['Groceries', 'Dinner ingredients'],
    weight: 4,
  },
  {
    name: 'Checkers',
    category: 'Groceries',
    minAmount: 70,
    maxAmount: 880,
    descriptions: ['Groceries', 'Weekly groceries'],
    weight: 4,
  },
  {
    name: 'Spar',
    category: 'Groceries',
    minAmount: 30,
    maxAmount: 320,
    descriptions: ['Bread and milk', 'Top-up shop'],
    weight: 3,
  },
  {
    name: 'Ster-Kinekor',
    category: 'Entertainment',
    minAmount: 95,
    maxAmount: 340,
    descriptions: ['Movie tickets'],
    weight: 1,
  },
  {
    name: 'Computicket',
    category: 'Entertainment',
    minAmount: 150,
    maxAmount: 750,
    descriptions: ['Event tickets'],
    weight: 1,
  },
  {
    name: 'Engen',
    category: 'Transportation',
    minAmount: 350,
    maxAmount: 1100,
    descriptions: ['Fuel'],
    weight: 2,
  },
  {
    name: 'Shell',
    category: 'Transportation',
    minAmount: 300,
    maxAmount: 1050,
    descriptions: ['Fuel'],
    weight: 2,
  },
  {
    name: 'Uber',
    category: 'Transportation',
    minAmount: 45,
    maxAmount: 240,
    descriptions: ['Trip'],
    weight: 3,
  },
  {
    name: 'Gautrain',
    category: 'Transportation',
    minAmount: 40,
    maxAmount: 130,
    descriptions: ['Train fare'],
    weight: 2,
  },
  {
    name: "Nando's",
    category: 'Dining',
    minAmount: 90,
    maxAmount: 420,
    descriptions: ['Lunch', 'Dinner'],
    weight: 2,
  },
  {
    name: 'Vida e Caffè',
    category: 'Dining',
    minAmount: 35,
    maxAmount: 120,
    descriptions: ['Coffee'],
    weight: 3,
  },
  {
    name: 'Ocean Basket',
    category: 'Dining',
    minAmount: 180,
    maxAmount: 650,
    descriptions: ['Dinner'],
    weight: 1,
  },
  {
    name: 'Steers',
    category: 'Dining',
    minAmount: 60,
    maxAmount: 210,
    descriptions: ['Lunch'],
    weight: 2,
  },
  {
    name: 'Takealot',
    category: 'Shopping',
    minAmount: 120,
    maxAmount: 2400,
    descriptions: ['Online order'],
    weight: 2,
  },
  {
    name: 'Mr Price',
    category: 'Shopping',
    minAmount: 90,
    maxAmount: 900,
    descriptions: ['Clothing'],
    weight: 1,
  },
  {
    name: 'Clicks',
    category: 'Shopping',
    minAmount: 45,
    maxAmount: 480,
    descriptions: ['Toiletries', 'Pharmacy'],
    weight: 2,
  },
]

export interface DebitOrder {
  name: string
  category: CategoryName
  /** Day of the month the debit order runs. */
  day: number
  /** A fixed amount, or a range for bills that vary month to month. */
  amount: number | { min: number; max: number }
  description: string
}

/** Monthly debit orders, so each month has the recurring costs a real account has. */
export const DEBIT_ORDERS: readonly DebitOrder[] = [
  {
    name: 'City of Johannesburg',
    category: 'Utilities',
    day: 1,
    amount: { min: 650, max: 1350 },
    description: 'Electricity and water',
  },
  {
    name: 'Vumatel Fibre',
    category: 'Utilities',
    day: 1,
    amount: 699,
    description: 'Fibre internet',
  },
  { name: 'Vodacom', category: 'Utilities', day: 5, amount: 399, description: 'Contract' },
  {
    name: 'Spotify',
    category: 'Entertainment',
    day: 3,
    amount: 59.99,
    description: 'Monthly subscription',
  },
  {
    name: 'Netflix',
    category: 'Entertainment',
    day: 15,
    amount: 199,
    description: 'Monthly subscription',
  },
]

/** Merchants where some purchases are later refunded (A7). */
export const REFUNDABLE_CATEGORIES: readonly CategoryName[] = ['Shopping', 'Groceries']

/** The single signed-in customer (A6). */
export const CUSTOMER = {
  customerId: '12345',
  name: 'John Doe',
  email: 'john.doe@email.com',
  accountType: 'premium',
  currency: 'ZAR',
} as const
