export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  barcode: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  image: string;
  note: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  note: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  customerId: string | null;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card';
  status: 'completed' | 'cancelled';
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  total: number;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'sale' | 'return';
  quantity: number;
  costPrice: number;
  note: string;
  saleId: string | null;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  createdAt: string;
}

export interface BusinessSettings {
  id: string;
  brandName: string;
  receiptFooter: string;
  telegramBotToken: string;
  telegramChatId: string;
}

export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  unit: string;
  maxStock: number;
}

export const EXPENSE_CATEGORIES = [
  'Ijara',
  'Elektr',
  'Transport',
  'Reklama',
  'Ish haqi',
  'Xarid',
  'Boshqa'
] as const;

export const UNITS = ['dona', 'kg', 'litr', 'quti', 'pachka', 'metr'] as const;
