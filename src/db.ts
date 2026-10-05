import Dexie, { type Table } from 'dexie';
import type { User, Product, Category, Customer, Sale, SaleItem, Expense, InventoryMovement, ActivityLog, BusinessSettings } from './types';

export class HissobDatabase extends Dexie {
  users!: Table<User, string>;
  products!: Table<Product, string>;
  categories!: Table<Category, string>;
  customers!: Table<Customer, string>;
  sales!: Table<Sale, string>;
  saleItems!: Table<SaleItem, string>;
  expenses!: Table<Expense, string>;
  inventoryMovements!: Table<InventoryMovement, string>;
  activityLogs!: Table<ActivityLog, string>;
  settings!: Table<BusinessSettings, string>;

  constructor() {
    super('HissobDB');
    this.version(1).stores({
      users: 'id, email, phone',
      products: 'id, name, barcode, categoryId, isActive, stock, createdAt',
      categories: 'id, name',
      customers: 'id, name, phone, createdAt',
      sales: 'id, receiptNumber, customerId, status, createdAt',
      saleItems: 'id, saleId, productId',
      expenses: 'id, category, date, createdAt',
      inventoryMovements: 'id, productId, type, saleId, createdAt',
      activityLogs: 'id, action, createdAt',
      settings: 'id'
    });
  }
}

export const db = new HissobDatabase();
