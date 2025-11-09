export type Page = 'dashboard' | 'stock' | 'new-entry' | 'new-exit' | 'reports' | 'users' | 'inventory' | 'backup';

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
}

export interface Supplier {
  id: string;
  name: string;
}

export interface Category {
    id: string;
    name: string;
}

export interface Location {
    id: string;
    name: string;
}

export interface EntryExitRecord {
  id: string;
  itemId: string;
  type: 'entry' | 'exit';
  quantity: number;
  date: string; // ISO string format 'YYYY-MM-DD'
}