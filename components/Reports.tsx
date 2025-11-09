import React, { useState, useMemo, useRef } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { Item, EntryExitRecord } from '../types';
import { PrintIcon, ExportIcon, WarningIcon, StockIcon, HistoryIcon } from './icons/Icons';
import Input from './ui/Input';
import Select from './ui/Select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const getStartOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

const getToday = () => {
    return new Date().toISOString().split('T')[0];
};

interface ReportsProps {
  items: Item[];
  history: EntryExitRecord[];
}

type ReportTab = 'lowStock' | 'movement' | 'locationValue';

const TABS: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
    { id: 'lowStock', label: 'Itens Abaixo do Mínimo', icon: <WarningIcon /> },
    { id: 'movement', label: 'Movimentação por Período', icon: <HistoryIcon /> },
    { id: 'locationValue', label: 'Valor por Local', icon: <StockIcon /> },
];


const Reports: React.FC<ReportsProps> = ({ items, history }) => {
  const [startDate, setStartDate] = useState(getStartOfMonth());
  const [endDate, setEndDate] = useState(getToday());
  const [filterCategory, setFilterCategory] = useState('');
  const [activeTab, setActiveTab] = useState<ReportTab>('lowStock');
  const reportPrintRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => [...new Set(items.map(item => item.category))], [items]);

  const filteredReportData = useMemo(() => {
    const filteredItems = items.filter(item => 
        filterCategory ? item.category === filterCategory : true
    );

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filteredHistory = history.filter(record => {
        const recordDate = new Date(record.date);
        const item = items.find(i => i.id === record.itemId);
        const matchesCategory = filterCategory ? item?.category === filterCategory : true;
        return recordDate >= start && recordDate <= end && matchesCategory;
    });
    
    const lowStockItems = filteredItems.filter(item => item.stockQuantity <= item.minQuantity);
    const movementHistory = filteredHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const valueByLocation = filteredItems.reduce((acc, item) => {
        // FIX: Explicitly cast item.totalValue to a number to prevent string concatenation issues.
        acc[item.location] = (acc[item.location] || 0) + Number(item.totalValue);
        return acc;
    }, {} as Record<string, number>);

    return { lowStockItems, movementHistory, valueByLocation };
  }, [items, history, filterCategory, startDate, endDate]);

  const handlePrintReport = () => {
    const printArea = reportPrintRef.current;
    if (!printArea) return;

    const printWindow = window.open('about:blank', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>${TABS.find(t => t.id === activeTab)?.label || 'Relatório'}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        body { font-family: sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .no-print { display: none; }
                        @media print { 
                            body { margin: 1cm; }
                             .chart-container {
                                page-break-inside: avoid;
                            }
                         }
                    </style>
                </head>
                <body>${printArea.innerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
            printWindow.onafterprint = () => printWindow.close();
        };
    }
  };
  
  const escapeCsvCell = (cell: string | number) => {
    const cellStr = String(cell);
    if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
    }
    return cellStr;
  };

  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: (string|number)[][] = [];
    let filename = `relatorio_${activeTab}_${getToday()}.csv`;

    switch(activeTab) {
        case 'lowStock':
            headers = ['Código', 'Descrição', 'Qtd. Atual', 'Qtd. Mínima', 'Categoria', 'Localização'];
            rows = filteredReportData.lowStockItems.map(item => [
                item.code, item.description, item.stockQuantity, item.minQuantity, item.category, item.location
            ]);
            break;
        case 'movement':
            headers = ['Data', 'Cód. Item', 'Descrição', 'Tipo', 'Quantidade'];
            rows = filteredReportData.movementHistory.map(record => {
                const item = items.find(i => i.id === record.itemId);
                return [
                    new Date(record.date).toLocaleDateString('pt-BR'),
                    item?.code || 'N/A',
                    item?.description || 'N/A',
                    record.type === 'entry' ? 'Entrada' : 'Saída',
                    record.quantity
                ];
            });
            break;
        case 'locationValue':
            headers = ['Localização', 'Valor Total'];
            rows = Object.entries(filteredReportData.valueByLocation).map(([location, value]) => [
                location,
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
            ]);
            break;
    }
    
    if (headers.length === 0) return;

    const csvContent = [
        headers.map(escapeCsvCell).join(','),
        ...rows.map(row => row.map(escapeCsvCell).join(','))
    ].join('\n');
    
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const renderReportContent = () => {
    const reportTitle = TABS.find(t => t.id === activeTab)?.label || 'Relatório';
    const reportHeader = (
        <div className="mb-4">
            <h2 className="text-2xl font-bold">{reportTitle}</h2>
            <p className="text-sm text-gray-600">Data de Geração: {new Date().toLocaleString('pt-BR')}</p>
            <div className="text-xs text-gray-500 mt-2">
                <p><strong>Filtros Aplicados:</strong> Período de {new Date(startDate).toLocaleDateString('pt-BR')} a {new Date(endDate).toLocaleDateString('pt-BR')}
                {filterCategory && `, Categoria: ${filterCategory}`}</p>
            </div>
        </div>
    );

    switch(activeTab) {
        case 'lowStock': {
            const { lowStockItems } = filteredReportData;
            return (
              <div ref={reportPrintRef}>
                {reportHeader}
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qtd. Atual</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qtd. Mínima</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lowStockItems.length > 0 ? lowStockItems.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{item.code}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{item.description}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 font-bold text-right">{item.stockQuantity}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{item.minQuantity}</td>
                      </tr>
                    )) : <tr><td colSpan={4} className="text-center py-4 text-gray-500">Nenhum item com estoque baixo para os filtros selecionados.</td></tr>}
                  </tbody>
                </table>
              </div>
            );
        }
        case 'movement': {
            const { movementHistory } = filteredReportData;
            return (
              <div ref={reportPrintRef}>
                {reportHeader}
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cód. Item</th>
                      {/* FIX: Add missing Description column to match exports */}
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {movementHistory.map(record => {
                      const item = items.find(i => i.id === record.itemId);
                      return (
                        <tr key={record.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{new Date(record.date).toLocaleDateString('pt-BR')}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item?.code || 'N/A'}</td>
                          {/* FIX: Add missing Description data cell to match exports */}
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item?.description || 'N/A'}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.type === 'entry' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {record.type === 'entry' ? 'Entrada' : 'Saída'}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{record.quantity}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            );
        }
        case 'locationValue': {
            const { valueByLocation } = filteredReportData;
            const chartData = Object.entries(valueByLocation)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);

            return (
              <div ref={reportPrintRef}>
                {reportHeader}
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Localização</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(valueByLocation).map(([location, value]) => (
                      <tr key={location}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{location}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">R$ {
                          new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(Number(value))
                        }</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-8 chart-container">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Gráfico de Valor por Localização</h3>
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(value) => `R$ ${new Intl.NumberFormat('pt-BR').format(value)}`} />
                                <YAxis type="category" dataKey="name" width={80} />
                                <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                                <Legend />
                                <Bar dataKey="value" name="Valor em Estoque" fill="#002347" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

              </div>
            );
        }
        default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Relatórios</h1>

      <Card>
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-700">Filtros Gerais</h3>
        </div>
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
      
      <Card>
        <div className="flex border-b border-gray-200">
            {TABS.map(tab => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none ${
                        activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>
        <div className="p-4 md:p-6">
            <div className="flex justify-end flex-wrap gap-4 mb-4">
                <Button onClick={handleExportCsv} className="bg-green-600 hover:bg-green-700">
                    <ExportIcon />
                    Exportar para CSV
                </Button>
                <Button onClick={handlePrintReport}>
                    <PrintIcon />
                    Imprimir Relatório
                </Button>
            </div>
            {renderReportContent()}
        </div>
      </Card>
    </div>
  );
};

export default Reports;