

import React, { useState, useMemo } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { Item, EntryExitRecord } from '../types';
import { PrintIcon } from './icons/Icons';
import Input from './ui/Input';
import Select from './ui/Select';

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

const Reports: React.FC<ReportsProps> = ({ items, history }) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState<{ title: string; content: React.ReactNode, filters: React.ReactNode } | null>(null);
  const [startDate, setStartDate] = useState(getStartOfMonth());
  const [endDate, setEndDate] = useState(getToday());
  const [filterCategory, setFilterCategory] = useState('');

  const categories = useMemo(() => [...new Set(items.map(item => item.category))], [items]);

  const handleGenerateReport = (reportType: string) => {
    let title = '';
    let content: React.ReactNode = null;

    // Apply filters
    const filteredItems = items.filter(item => 
        filterCategory ? item.category === filterCategory : true
    );

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the whole end day

    const filteredHistory = history.filter(record => {
        const recordDate = new Date(record.date);
        const item = items.find(i => i.id === record.itemId);
        const matchesCategory = filterCategory ? item?.category === filterCategory : true;
        return recordDate >= start && recordDate <= end && matchesCategory;
    });

    const filtersContent = (
      <div className="text-xs text-gray-500 mb-4">
        <p><strong>Filtros Aplicados:</strong></p>
        <p>Período: {new Date(startDate).toLocaleDateString('pt-BR')} a {new Date(endDate).toLocaleDateString('pt-BR')}</p>
        {filterCategory && <p>Categoria: {filterCategory}</p>}
      </div>
    );


    switch (reportType) {
      case 'Itens Abaixo do Mínimo': {
        title = 'Relatório: Itens Abaixo do Mínimo';
        const lowStockItems = filteredItems.filter(item => item.stockQuantity <= item.minQuantity);
        content = (
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
        );
        break;
      }
      case 'Movimentação por Período': {
        title = 'Relatório: Movimentação por Período';
        content = (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cód. Item</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantidade</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => {
                const item = items.find(i => i.id === record.itemId);
                return (
                  <tr key={record.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{new Date(record.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{item?.code || 'N/A'}</td>
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
        );
        break;
      }
      case 'Valor em Estoque por Local': {
        title = 'Relatório: Valor em Estoque por Local';
        const valueByLocation = filteredItems.reduce((acc, item) => {
          acc[item.location] = (acc[item.location] || 0) + item.totalValue;
          return acc;
        }, {} as Record<string, number>);

        content = (
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
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right">R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
        break;
      }
      default:
        return;
    }

    setReportData({ title, content, filters: filtersContent });
    setIsReportModalOpen(true);
  };

  const handlePrintReport = () => {
    const printArea = document.getElementById('report-print-area');
    if (!printArea) {
        console.error('Print area not found');
        return;
    }

    // FIX: Changed to a 0-argument call to window.open to satisfy a strict type-checker, then write content to the new window.
    const printWindow = window.open();
    if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>${reportData?.title || 'Relatório'}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        body { 
                            font-family: sans-serif;
                            margin: 20px; 
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: left;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                        @media print {
                            body { margin: 1cm; }
                        }
                    </style>
                </head>
                <body>
                    ${printArea.innerHTML}
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            }
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Relatórios</h1>

      <Card>
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-700">Filtros</h3>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Itens Abaixo do Mínimo</h3>
            <p className="text-gray-600 mb-4">Gera uma lista de todos os itens cujo estoque atual está abaixo do nível mínimo definido.</p>
            <Button onClick={() => handleGenerateReport('Itens Abaixo do Mínimo')}>Gerar Relatório</Button>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Movimentação por Período</h3>
            <p className="text-gray-600 mb-4">Analisa todas as entradas e saídas de itens dentro de um intervalo de datas selecionado.</p>
             <Button onClick={() => handleGenerateReport('Movimentação por Período')}>Gerar Relatório</Button>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Valor em Estoque por Local</h3>
            <p className="text-gray-600 mb-4">Calcula o valor total do inventário, agrupado por localização física no almoxarifado.</p>
             <Button onClick={() => handleGenerateReport('Valor em Estoque por Local')}>Gerar Relatório</Button>
          </div>
        </Card>
      </div>

      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title={reportData?.title || 'Relatório'}>
          {reportData && (
              <>
                  <div id="report-print-area">
                      <h2 className="text-2xl font-bold mb-4">{reportData.title}</h2>
                      <p className="mb-2 text-sm text-gray-600">Data de Geração: {new Date().toLocaleString('pt-BR')}</p>
                      {reportData.filters}
                      {reportData.content}
                  </div>
                  <div className="no-print flex justify-end pt-6 mt-6 border-t">
                      <Button onClick={handlePrintReport}>
                          <PrintIcon />
                          Imprimir / Salvar como PDF
                      </Button>
                  </div>
              </>
          )}
      </Modal>
    </div>
  );
};

export default Reports;