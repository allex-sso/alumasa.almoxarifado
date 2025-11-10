export type Page = 'dashboard' | 'stock' | 'new-entry' | 'new-exit' | 'reports' | 'users' | 'inventory' | 'backup' | 'audit' | 'suppliers';

export type Role = 'Admin' | 'Operator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  profilePictureUrl?: string;
  password?: string; // Should not be stored in frontend state in a real app
}

export interface Item {
  id: string;
  code: string;
  description: string;
  category: string;
  location: string;
  unit: string;
  stockQuantity: number;
  minQuantity: number;
  leadTimeDays: number;
  avgUnitValue: number;
  totalValue: number;
  preferredSupplierId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
}

export interface Category {
    id: string;
    name: string;
}

export interface Location {
    id: string;
    name: string;
}

export interface UnitOfMeasurement {
  id: string;
  name: string;
  abbreviation: string;
}

export interface EntryExitRecord {
  id: string;
  itemId: string;
  type: 'entry' | 'exit';
  quantity: number;
  date: string; // ISO string format 'YYYY-MM-DD'
  supplierId?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO string
  userId: string;
  userName: string;
  action: string;
}