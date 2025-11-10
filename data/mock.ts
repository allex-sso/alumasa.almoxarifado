
import { Item, Supplier, Category, Location, User, EntryExitRecord, AuditLog, UnitOfMeasurement } from '../types';

export const mockUsers: User[] = [
  { id: '1', name: 'Admin', email: 'admin@alumasa.com', role: 'Admin', password: 'admin', profilePictureUrl: 'https://picsum.photos/seed/admin/100' },
  { id: '2', name: 'Operador', email: 'op@alumasa.com', role: 'Operator', password: 'op', profilePictureUrl: 'https://picsum.photos/seed/operator/100' },
];

export const mockItems: Item[] = [
  { id: '1', code: 'PAR-001', description: 'Parafuso Sextavado M8', category: 'Fixadores', location: 'A1-01', unit: 'UN', stockQuantity: 1500, minQuantity: 500, leadTimeDays: 5, avgUnitValue: 0.75, totalValue: 1125, preferredSupplierId: '2' },
  { id: '2', code: 'CHP-010', description: 'Chapa de Aço 1/4"', category: 'Matéria-prima', location: 'B2-05', unit: 'KG', stockQuantity: 450, minQuantity: 1000, leadTimeDays: 15, avgUnitValue: 8.50, totalValue: 3825, preferredSupplierId: '1' },
  { id: '3', code: 'TUB-304', description: 'Tubo Inox 2"', category: 'Matéria-prima', location: 'B2-06', unit: 'M', stockQuantity: 120, minQuantity: 50, leadTimeDays: 10, avgUnitValue: 45.20, totalValue: 5424, preferredSupplierId: '1' },
  { id: '4', code: 'EPI-002', description: 'Luva de Proteção', category: 'EPI', location: 'C3-12', unit: 'PAR', stockQuantity: 80, minQuantity: 100, leadTimeDays: 7, avgUnitValue: 12.00, totalValue: 960, preferredSupplierId: '3' },
  { id: '5', code: 'SOL-005', description: 'Eletrodo para Solda', category: 'Consumíveis', location: 'A1-02', unit: 'KG', stockQuantity: 25, minQuantity: 20, leadTimeDays: 3, avgUnitValue: 35.00, totalValue: 875, preferredSupplierId: '3' },
];

export const mockSuppliers: Supplier[] = [
    { id: '1', name: 'Fornecedor Aço Forte', contactPerson: 'Carlos Silva', email: 'contato@acoforte.com', phone: '(11) 98765-4321' },
    { id: '2', name: 'Parafusos & Cia', contactPerson: 'Ana Pereira', email: 'vendas@parafusoscia.com.br', phone: '(47) 3333-2222' },
    { id: '3', name: 'Global Suprimentos Industriais', contactPerson: 'Mariana Costa', email: 'global@suprimentos.com', phone: '(21) 1234-5678' },
];

export const mockCategories: Category[] = [
    { id: '1', name: 'Fixadores'},
    { id: '2', name: 'Matéria-prima'},
    { id: '3', name: 'EPI'},
    { id: '4', name: 'Consumíveis'},
    { id: '5', name: 'Ferramentas'},
    { id: '6', name: 'Componentes Elétricos' },
    { id: '7', name: 'Hidráulica' },
    { id: '8', name: 'Lubrificantes' },
    { id: '9', name: 'Limpeza' },
    { id: '10', name: 'Embalagens' },
];

export const mockUnits: UnitOfMeasurement[] = [
    { id: '1', name: 'Unidade', abbreviation: 'UN' },
    { id: '2', name: 'Peça', abbreviation: 'PÇ' },
    { id: '3', name: 'Quilograma', abbreviation: 'KG' },
    { id: '4', name: 'Metro', abbreviation: 'M' },
    { id: '5', name: 'Litro', abbreviation: 'L' },
    { id: '6', name: 'Caixa', abbreviation: 'CX' },
    { id: '7', name: 'Par', abbreviation: 'PAR' },
    { id: '8', name: 'Rolo', abbreviation: 'ROLO' },
];

export const mockLocations: Location[] = [
    { id: '1', name: 'A1-01' },
    { id: '2', name: 'B2-05' },
    { id: '3', name: 'B2-06' },
    { id: '4', name: 'C3-12' },
    { id: '5', name: 'A1-02' },
];

const today = new Date();
const lastMonth = new Date();
lastMonth.setMonth(today.getMonth() - 1);
const twoMonthsAgo = new Date();
twoMonthsAgo.setMonth(today.getMonth() - 2);

export const mockEntryExitHistory: EntryExitRecord[] = [
    // Two months ago
    { id: 'h1', itemId: '1', type: 'entry', quantity: 1000, date: new Date(twoMonthsAgo.setDate(5)).toISOString().split('T')[0], supplierId: '2' },
    { id: 'h2', itemId: '2', type: 'entry', quantity: 500, date: new Date(twoMonthsAgo.setDate(10)).toISOString().split('T')[0], supplierId: '1' },
    { id: 'h3', itemId: '1', type: 'exit', quantity: 200, date: new Date(twoMonthsAgo.setDate(15)).toISOString().split('T')[0] },
    { id: 'h4', itemId: '4', type: 'exit', quantity: 50, date: new Date(twoMonthsAgo.setDate(20)).toISOString().split('T')[0] },

    // Last month
    { id: 'h5', itemId: '3', type: 'entry', quantity: 80, date: new Date(lastMonth.setDate(3)).toISOString().split('T')[0], supplierId: '1' },
    { id: 'h6', itemId: '5', type: 'entry', quantity: 30, date: new Date(lastMonth.setDate(8)).toISOString().split('T')[0], supplierId: '3' },
    { id: 'h7', itemId: '2', type: 'exit', quantity: 150, date: new Date(lastMonth.setDate(18)).toISOString().split('T')[0] },
    { id: 'h8', itemId: '1', type: 'exit', quantity: 300, date: new Date(lastMonth.setDate(25)).toISOString().split('T')[0] },

    // Current month
    { id: 'h9', itemId: '4', type: 'entry', quantity: 120, date: new Date(today.getFullYear(), today.getMonth(), 2).toISOString().split('T')[0], supplierId: '3' },
    { id: 'h10', itemId: '1', type: 'entry', quantity: 500, date: new Date(today.getFullYear(), today.getMonth(), 5).toISOString().split('T')[0], supplierId: '2' },
    { id: 'h11', itemId: '3', type: 'exit', quantity: 40, date: new Date(today.getFullYear(), today.getMonth(), 8).toISOString().split('T')[0] },
    { id: 'h12', itemId: '5', type: 'exit', quantity: 10, date: new Date(today.getFullYear(), today.getMonth(), 10).toISOString().split('T')[0] },
];

export const mockAuditLogs: AuditLog[] = [
    {
        id: 'log-1',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        userId: '1',
        userName: 'Admin',
        action: 'Fez login no sistema.'
    },
    {
        id: 'log-2',
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        userId: '1',
        userName: 'Admin',
        action: 'Criou o item SOL-005 - Eletrodo para Solda.'
    },
    {
        id: 'log-3',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        userId: '2',
        userName: 'Operador',
        action: 'Registrou saída de 10 unidade(s) do item SOL-005 para Manutenção.'
    },
];