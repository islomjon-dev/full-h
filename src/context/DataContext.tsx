import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { db } from '../db';
import type { Product, Category, Customer, Sale, SaleItem, Expense, InventoryMovement, ActivityLog, BusinessSettings, CartItem } from '../types';
import { generateId, generateReceiptNumber, getToday } from '../utils/helpers';
import { useLiveQuery } from 'dexie-react-hooks';

interface DataContextType {
  // Products
  products: Product[];
  categories: Category[];
  addProduct: (p: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addStock: (productId: string, quantity: number, costPrice: number, note: string) => Promise<void>;
  
  // Customers
  customers: Customer[];
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt'>) => Promise<void>;
  updateCustomer: (id: string, c: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  
  // Sales
  sales: Sale[];
  saleItems: SaleItem[];
  createSale: (cart: CartItem[], discount: number, paymentMethod: 'cash' | 'card', customerId: string | null) => Promise<Sale | null>;
  cancelSale: (saleId: string) => Promise<void>;
  
  // Expenses
  expenses: Expense[];
  addExpense: (e: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: string, e: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Inventory
  inventoryMovements: InventoryMovement[];
  
  // Activity
  activityLogs: ActivityLog[];
  logActivity: (action: string, description: string) => Promise<void>;
  
  // Settings
  settings: BusinessSettings | null;
  updateSettings: (s: Partial<BusinessSettings>) => Promise<void>;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

export function DataProvider({ children }: { children: ReactNode }) {
  const products = useLiveQuery(() => db.products.orderBy('createdAt').reverse().toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.toArray(), []) || [];
  const customers = useLiveQuery(() => db.customers.orderBy('createdAt').reverse().toArray(), []) || [];
  const sales = useLiveQuery(() => db.sales.orderBy('createdAt').reverse().toArray(), []) || [];
  const saleItems = useLiveQuery(() => db.saleItems.toArray(), []) || [];
  const expenses = useLiveQuery(() => db.expenses.orderBy('createdAt').reverse().toArray(), []) || [];
  const inventoryMovements = useLiveQuery(() => db.inventoryMovements.orderBy('createdAt').reverse().toArray(), []) || [];
  const activityLogs = useLiveQuery(() => db.activityLogs.orderBy('createdAt').reverse().limit(100).toArray(), []) || [];
  const settings = useLiveQuery(() => db.settings.get('default'), []) || null;

  const logActivity = useCallback(async (action: string, description: string) => {
    await db.activityLogs.add({
      id: generateId(),
      action,
      description,
      createdAt: getToday()
    });
  }, []);

  const addProduct = useCallback(async (p: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = getToday();
    const product: Product = { ...p, id: generateId(), createdAt: now, updatedAt: now };
    await db.products.add(product);
    if (p.stock > 0) {
      await db.inventoryMovements.add({
        id: generateId(), productId: product.id, type: 'in',
        quantity: p.stock, costPrice: p.costPrice, note: 'Boshlang\'ich qoldiq', saleId: null, createdAt: now
      });
    }
    await logActivity('product_created', `"${p.name}" mahsuloti qo'shildi`);
  }, [logActivity]);

  const updateProduct = useCallback(async (id: string, p: Partial<Product>) => {
    await db.products.update(id, { ...p, updatedAt: getToday() });
    await logActivity('product_updated', `Mahsulot yangilandi`);
  }, [logActivity]);

  const deleteProduct = useCallback(async (id: string) => {
    const product = await db.products.get(id);
    if (product) {
      await db.products.update(id, { isActive: false, updatedAt: getToday() });
      await logActivity('product_archived', `"${product.name}" mahsuloti arxivlandi`);
    }
  }, [logActivity]);

  const addCategory = useCallback(async (name: string) => {
    await db.categories.add({ id: generateId(), name, createdAt: getToday() });
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    await db.categories.delete(id);
  }, []);

  const addStock = useCallback(async (productId: string, quantity: number, costPrice: number, note: string) => {
    const product = await db.products.get(productId);
    if (!product) return;
    await db.products.update(productId, { stock: product.stock + quantity, costPrice: costPrice || product.costPrice, updatedAt: getToday() });
    await db.inventoryMovements.add({
      id: generateId(), productId, type: 'in', quantity, costPrice: costPrice || product.costPrice, note, saleId: null, createdAt: getToday()
    });
    await logActivity('stock_added', `"${product.name}" - ${quantity} ${product.unit} qo'shildi`);
  }, [logActivity]);

  const addCustomer = useCallback(async (c: Omit<Customer, 'id' | 'createdAt'>) => {
    await db.customers.add({ ...c, id: generateId(), createdAt: getToday() });
    await logActivity('customer_created', `"${c.name}" xaridori qo'shildi`);
  }, [logActivity]);

  const updateCustomer = useCallback(async (id: string, c: Partial<Customer>) => {
    await db.customers.update(id, c);
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    await db.customers.delete(id);
  }, []);

  const createSale = useCallback(async (cart: CartItem[], discount: number, paymentMethod: 'cash' | 'card', customerId: string | null): Promise<Sale | null> => {
    const now = getToday();
    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const total = subtotal - discount;

    // Validate stock
    for (const item of cart) {
      const product = await db.products.get(item.productId);
      if (!product || product.stock < item.quantity) {
        return null;
      }
    }

    const sale: Sale = {
      id: generateId(),
      receiptNumber: generateReceiptNumber(),
      customerId,
      subtotal,
      discount,
      total,
      paymentMethod,
      status: 'completed',
      createdAt: now
    };

    await db.transaction('rw', db.sales, db.saleItems, db.products, db.inventoryMovements, async () => {
      await db.sales.add(sale);
      
      for (const item of cart) {
        await db.saleItems.add({
          id: generateId(),
          saleId: sale.id,
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          total: item.unitPrice * item.quantity
        });

        const product = await db.products.get(item.productId);
        if (product) {
          await db.products.update(item.productId, { stock: product.stock - item.quantity, updatedAt: now });
        }

        await db.inventoryMovements.add({
          id: generateId(),
          productId: item.productId,
          type: 'sale',
          quantity: item.quantity,
          costPrice: item.costPrice,
          note: `Savdo: ${sale.receiptNumber}`,
          saleId: sale.id,
          createdAt: now
        });
      }
    });

    await logActivity('sale_created', `Savdo #${sale.receiptNumber} - ${total} so'm`);
    return sale;
  }, [logActivity]);

  const cancelSale = useCallback(async (saleId: string) => {
    const sale = await db.sales.get(saleId);
    if (!sale) return;

    await db.transaction('rw', db.sales, db.products, db.inventoryMovements, async () => {
      await db.sales.update(saleId, { status: 'cancelled' });
      
      const items = await db.saleItems.where('saleId').equals(saleId).toArray();
      for (const item of items) {
        const product = await db.products.get(item.productId);
        if (product) {
          await db.products.update(item.productId, { stock: product.stock + item.quantity, updatedAt: getToday() });
        }
        await db.inventoryMovements.add({
          id: generateId(),
          productId: item.productId,
          type: 'return',
          quantity: item.quantity,
          costPrice: item.costPrice,
          note: `Bekor qilindi: ${sale.receiptNumber}`,
          saleId: sale.id,
          createdAt: getToday()
        });
      }
    });

    await logActivity('sale_cancelled', `Savdo #${sale.receiptNumber} bekor qilindi`);
  }, [logActivity]);

  const addExpense = useCallback(async (e: Omit<Expense, 'id' | 'createdAt'>) => {
    await db.expenses.add({ ...e, id: generateId(), createdAt: getToday() });
    await logActivity('expense_created', `${e.category}: ${e.amount} so'm`);
  }, [logActivity]);

  const updateExpense = useCallback(async (id: string, e: Partial<Expense>) => {
    await db.expenses.update(id, e);
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    await db.expenses.delete(id);
  }, []);

  const updateSettings = useCallback(async (s: Partial<BusinessSettings>) => {
    const existing = await db.settings.get('default');
    if (existing) {
      await db.settings.update('default', s);
    } else {
      await db.settings.add({ id: 'default', brandName: 'IBROHIM OKA CHORSU', receiptFooter: 'Rahmat!', telegramBotToken: '', telegramChatId: '', ...s });
    }
  }, []);

  return (
    <DataContext.Provider value={{
      products, categories, customers, sales, saleItems, expenses, inventoryMovements, activityLogs, settings,
      addProduct, updateProduct, deleteProduct, addCategory, deleteCategory, addStock,
      addCustomer, updateCustomer, deleteCustomer,
      createSale, cancelSale,
      addExpense, updateExpense, deleteExpense,
      logActivity, updateSettings
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
