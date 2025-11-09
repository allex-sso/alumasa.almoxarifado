import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import Card from './ui/Card';
import { StockIcon, EntryIcon, ReportsIcon, ExitIcon } from './icons/Icons';
import { Item, EntryExitRecord, Page } from '../types';
import Select from './ui/Select';
import Input from './ui/Input';

const consumptionData = [
  { name: 'Parafusos', value: 4000 },
  { name: 'Chapas Aço', value: 3000 },
  { name: 'Tubos Inox', value: 2000 },
  { name: 'Solda', value: 2780 },
  { name: 'Luvas EPI', value: 1890 },
  { name: 'Óleos', value: 2390 },
  { name: 'Filtros', value: 3490 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

const getStartOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

const getToday = () => {
    return new Date().toISOString().split('T')[0];
};

interface DashboardProps {
    items: Item[];
    history: EntryExitRecord[];
    setCurrentPage: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ items, history, setCurrentPage }) => {
    const [startDate, setStartDate] = useState(getStartOfMonth());
    const [endDate, setEndDate] = useState(getToday());
    const [filterCategory, setFilterCategory] = useState('');

    const categories = useMemo(() => [...new Set(items.map(item => item.category))], [items]);

    const filteredDashboardData = useMemo(() => {
        const filteredItems = items.filter(item => filterCategory ? item.category === filterCategory : true);

        const totalValue = filteredItems.reduce((sum, item) => sum + item.totalValue, 0);
        const lowStockCount = filteredItems.filter(item => item.stockQuantity <= item.minQuantity).length;
        const totalItems = filteredItems.reduce((sum, item) => sum + item.stockQuantity, 0);
        const itemsByCategory = filteredItems.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const categoryChartData = Object.entries(itemsByCategory).map(([name, value]) => ({ name, value }));
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the whole end day

        const filteredHistory = history.filter(record => {
            const recordDate = new Date(record.date);
            const item = items.find(i => i.id === record.itemId);
            const matchesCategory = filterCategory ? item?.category === filterCategory : true;
            return recordDate >= start && recordDate <= end && matchesCategory;
        });

        const entries = filteredHistory.filter(r => r.type === 'entry').reduce((sum, r) => sum + r.quantity, 0);
        const exits = filteredHistory.filter(r => r.type === 'exit').reduce((sum, r) => sum + r.quantity, 0);

        return { totalValue, lowStockCount, totalItems, entries, exits, categoryChartData };
    }, [filterCategory, startDate, endDate, items, history]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

            {/* Filters */}
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                     <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                        <Input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                        <Input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                        <Select id="category" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                            <option value="">Todas Categorias</option>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </Select>
                    </div>
                </div>
            </Card>
            
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                 <div className="cursor-pointer transition-transform transform hover:scale-105" onClick={() => setCurrentPage('stock')}>
                    <Card className="bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-lg h-full">
                        <div className="flex items-center p-4">
                            <div className="p-3 bg-black bg-opacity-20 rounded-full"><StockIcon /></div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-200">Valor Total em Estoque</p>
                                <p className="text-2xl font-bold">R$ {filteredDashboardData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </Card>
                </div>
                 <div className="cursor-pointer transition-transform transform hover:scale-105" onClick={() => setCurrentPage('stock')}>
                    <Card className="bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-lg h-full">
                        <div className="flex items-center p-4">
                            <div className="p-3 bg-black bg-opacity-20 rounded-full"><StockIcon /></div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-200">Quantidade Total</p>
                                <p className="text-2xl font-bold">{filteredDashboardData.totalItems.toLocaleString('pt-BR')}</p>
                            </div>
                        </div>
                    </Card>
                </div>
                 <div className="cursor-pointer transition-transform transform hover:scale-105" onClick={() => setCurrentPage('stock')}>
                    <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg h-full">
                        <div className="flex items-center p-4">
                            <div className="p-3 bg-black bg-opacity-20 rounded-full"><ReportsIcon /></div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-200">Itens Abaixo do Mínimo</p>
                                <p className="text-2xl font-bold">{filteredDashboardData.lowStockCount}</p>
                            </div>
                        </div>
                    </Card>
                </div>
                 <div className="cursor-pointer transition-transform transform hover:scale-105" onClick={() => setCurrentPage('reports')}>
                    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg h-full">
                        <div className="flex items-center p-4">
                            <div className="p-3 bg-black bg-opacity-20 rounded-full"><EntryIcon /></div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-200">Entradas no Período</p>
                                <p className="text-2xl font-bold">{filteredDashboardData.entries.toLocaleString('pt-BR')}</p>
                            </div>
                        </div>
                    </Card>
                </div>
                 <div className="cursor-pointer transition-transform transform hover:scale-105" onClick={() => setCurrentPage('reports')}>
                    <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg h-full">
                        <div className="flex items-center p-4">
                            <div className="p-3 bg-black bg-opacity-20 rounded-full"><ExitIcon /></div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-200">Saídas no Período</p>
                                <p className="text-2xl font-bold">{filteredDashboardData.exits.toLocaleString('pt-BR')}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3">
                    <h3 className="text-xl font-semibold text-gray-700 p-4">Top 7 Itens Consumidos (Valor)</h3>
                    <div style={{ width: '100%', height: 400 }}>
                         <ResponsiveContainer>
                            <BarChart data={consumptionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={100} />
                                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}/>
                                <Legend />
                                <Bar dataKey="value" name="Valor Consumido" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                 <Card className="lg:col-span-2">
                    <h3 className="text-xl font-semibold text-gray-700 p-4">Itens por Categoria</h3>
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                                <Pie
                                    data={filteredDashboardData.categoryChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {filteredDashboardData.categoryChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value} itens`, name]}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;