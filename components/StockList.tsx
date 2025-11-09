import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Item, Page, EntryExitRecord } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Select from './ui/Select';
import { TrashIcon, EntryIcon, HistoryIcon, ExportIcon, EditIcon, ExitIcon, PlusIcon, QrCodeIcon, PrintIcon } from './icons/Icons';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Toast from './ui/Toast';

interface StockListProps {
    items: Item[];
    setItems: React.Dispatch<React.SetStateAction<Item[]>>;
    setActivePage: (page: Page) => void;
    setItemForEntry: (item: Item) => void;
    setItemForExit: (item: Item) => void;
    history: EntryExitRecord[];
    initialSearchTerm?: string;
    clearInitialSearch?: () => void;
    addAuditLog: (action: string) => void;
}

const StockList: React.FC<StockListProps> = ({ items, setItems, setActivePage, setItemForEntry, setItemForExit, history, initialSearchTerm, clearInitialSearch, addAuditLog }) => {
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
    const [selectedItemForHistory, setSelectedItemForHistory] = useState<Item | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<Partial<Item> | null>(null);
    const [previewItem, setPreviewItem] = useState<Item | null>(null);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState(false);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    // Generic toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

    useEffect(() => {
        if (initialSearchTerm && clearInitialSearch) {
            setSearchTerm(initialSearchTerm);
            clearInitialSearch();
        }
    }, [initialSearchTerm, clearInitialSearch]);

    const generateZplForItem = (item: Item): string => {
        const sanitize = (text: string, maxLength: number) => {
            if (!text) return '';
            // First, remove accents
            const withoutAccents = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            // Then, remove characters that could break ZPL syntax or URLs
            return withoutAccents.replace(/[\^~&"'\n\r]/g, ' ').substring(0, maxLength);
        };

        const sanitizedCode = sanitize(item.code, 20);
        const sanitizedDescription = sanitize(item.description, 40);

        const zplCommands = [
            '^XA',
            '^CI28', // UTF-8 Character set
            `^FO40,50^BQN,2,6^FDQA,${sanitizedCode}^FS`,
            // Adjusted font size and position for better fit
            `^FO250,60^A0N,60,60^FD${sanitizedCode}^FS`,
            `^FO250,150^A0N,25,25^FB500,2,0,L,0^FD${sanitizedDescription}&^FS`,
            '^XZ'
        ];
        
        return zplCommands.join('');
    };

    // Effect to generate label preview URL when an item is selected
    useEffect(() => {
        if (previewItem) {
            setIsPreviewLoading(true);
            setPreviewError(false);
            setPreviewUrl(null);
            
            try {
                const zpl = generateZplForItem(previewItem);
                const encodedZpl = encodeURIComponent(zpl);
                const url = `https://api.labelary.com/v1/printers/8dpmm/labels/4x2.5/0/?zpl=${encodedZpl}`;
                setPreviewUrl(url);
            } catch (error) {
                console.error("Failed to generate label URL:", error);
                setToast({ message: 'Erro ao criar o link da etiqueta.', type: 'warning' });
                setIsPreviewLoading(false);
                setPreviewError(true);
            }
        } else {
            setPreviewUrl(null);
            setIsPreviewLoading(false);
            setPreviewError(false);
        }
    }, [previewItem]);


    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesCategory = filterCategory ? item.category === filterCategory : true;
            const matchesLocation = filterLocation ? item.location === filterLocation : true;
            const matchesStatus = filterStatus ? (filterStatus === 'low' ? item.stockQuantity <= item.minQuantity : item.stockQuantity > item.minQuantity) : true;
            const matchesSearch = searchTerm ? item.description.toLowerCase().includes(searchTerm.toLowerCase()) || item.code.toLowerCase().includes(searchTerm.toLowerCase()) : true;
            return matchesCategory && matchesLocation && matchesStatus && matchesSearch;
        });
    }, [filterCategory, filterStatus, filterLocation, searchTerm, items]);
    
    // Clear selection when filters change
    useEffect(() => {
        setSelectedItems([]);
    }, [filterCategory, filterStatus, filterLocation, searchTerm]);

    const totalStockValue = useMemo(() => {
        return filteredItems.reduce((total, item) => total + (item.totalValue || 0), 0);
    }, [filteredItems]);
    
    // Reset page to 1 on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterCategory, filterStatus, filterLocation, searchTerm]);

    const lowStockItems = useMemo(() => items.filter(item => item.stockQuantity <= item.minQuantity), [items]);
    
     // Show toast on initial load if there are low stock items
    useEffect(() => {
        if (lowStockItems.length > 0) {
            setToast({ message: `Atenção: ${lowStockItems.length} ${lowStockItems.length > 1 ? 'itens estão' : 'item está'} com estoque baixo.`, type: 'warning' });
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    const itemHistory = useMemo(() => {
        if (!selectedItemForHistory) return [];
        return history
            .filter(record => record.itemId === selectedItemForHistory.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedItemForHistory, history]);
    
    // Pagination calculations
    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredItems.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredItems, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const categories = [...new Set(items.map(item => item.category))];
    const locations = [...new Set(items.map(item => item.location))];

    const openDeleteConfirmation = (item: Item) => {
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteConfirmation = () => {
        setItemToDelete(null);
        setIsDeleteModalOpen(false);
    };

    const confirmDeleteItem = () => {
        if (itemToDelete) {
            setItems(prev => prev.filter(item => item.id !== itemToDelete.id));
            addAuditLog(`Excluiu o item ${itemToDelete.code} - ${itemToDelete.description}.`);
            setToast({ message: 'Item excluído com sucesso!', type: 'success' });
        }
        closeDeleteConfirmation();
    };
    
    const handleNewEntryForItem = (item: Item) => {
        setItemForEntry(item);
        setActivePage('new-entry');
    };

    const handleNewExitForItem = (item: Item) => {
        setItemForExit(item);
        setActivePage('new-exit');
    };

    const openHistoryModal = (item: Item) => {
        setSelectedItemForHistory(item);
        setIsHistoryModalOpen(true);
    };

    const closeHistoryModal = () => {
        setSelectedItemForHistory(null);
        setIsHistoryModalOpen(false);
    };

    const openEditModal = (item: Item) => {
        setItemToEdit({ ...item });
        setIsEditModalOpen(true);
    };
    
    const openCreateModal = () => {
        setItemToEdit({
            code: '',
            description: '',
            category: '',
            location: '',
            unit: '',
            stockQuantity: 0,
            minQuantity: 0,
            leadTimeDays: 0,
            avgUnitValue: 0,
            totalValue: 0,
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setItemToEdit(null);
        setIsEditModalOpen(false);
    };
    
    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (itemToEdit) {
            const { name, value } = e.target;
            const isNumberField = ['minQuantity', 'stockQuantity', 'avgUnitValue', 'leadTimeDays'].includes(name);
            setItemToEdit({ ...itemToEdit, [name]: isNumberField ? Number(value) : value });
        }
    };

    const handleSaveItem = () => {
        if (!itemToEdit) return;

        // --- VALIDATION FOR NEW ITEM ---
        if (!itemToEdit.id) {
            const { code, description, category, location, unit, stockQuantity } = itemToEdit;

            const requiredFields: { key: keyof Item, name: string }[] = [
                { key: 'code', name: 'Código' },
                { key: 'description', name: 'Descrição' },
                { key: 'category', name: 'Categoria' },
                { key: 'location', name: 'Localização' },
                { key: 'unit', name: 'Unidade de Medida' }
            ];

            for (const field of requiredFields) {
                if (!itemToEdit[field.key] || String(itemToEdit[field.key]).trim() === '') {
                    setToast({ message: `O campo "${field.name}" é obrigatório.`, type: 'warning' });
                    return;
                }
            }

            if (stockQuantity === null || stockQuantity === undefined) {
                setToast({ message: 'O campo "Quantidade Inicial" é obrigatório.', type: 'warning' });
                return;
            }

            const codeExists = items.some(
                item => item.code.trim().toLowerCase() === code?.trim().toLowerCase()
            );

            if (codeExists) {
                setToast({ message: `Erro: O código "${code}" já está cadastrado.`, type: 'warning' });
                return;
            }
        }
        // --- END VALIDATION ---

        if (itemToEdit.id) { // Editing
            const updatedItem = {
                ...itemToEdit,
                totalValue: (itemToEdit.stockQuantity || 0) * (itemToEdit.avgUnitValue || 0)
            } as Item;
            setItems(prevItems => prevItems.map(item => item.id === updatedItem.id ? updatedItem : item));
            addAuditLog(`Editou o item ${updatedItem.code} - ${updatedItem.description}.`);
            setToast({ message: 'Item salvo com sucesso!', type: 'success' });
        } else { // Creating
             const newItem: Item = {
                ...itemToEdit,
                id: `item-${Date.now()}`,
                code: itemToEdit.code!.trim(),
                description: itemToEdit.description!.trim(),
                category: itemToEdit.category!.trim(),
                location: itemToEdit.location!.trim(),
                unit: itemToEdit.unit!.trim(),
                totalValue: (itemToEdit.stockQuantity || 0) * (itemToEdit.avgUnitValue || 0)
            } as Item;
            setItems(prevItems => [...prevItems, newItem]);
            addAuditLog(`Criou o item ${newItem.code} - ${newItem.description}.`);
            setToast({ message: 'Item criado com sucesso!', type: 'success' });
        }
        
        closeEditModal();
    };

    const handleExportHistory = () => {
        if (!selectedItemForHistory || itemHistory.length === 0) return;

        const headers = ['Data', 'Tipo', 'Quantidade'];
        const rows = itemHistory.map(record => [
            `"${new Date(record.date).toLocaleDateString('pt-BR')}"`,
            `"${record.type === 'entry' ? 'Entrada' : 'Saída'}"`,
            `"${record.quantity.toLocaleString('pt-BR')}"`
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `historico_${selectedItemForHistory.code}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const downloadZpl = (zpl: string, filename: string) => {
        const blob = new Blob([zpl], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const printZpl = (zpl: string, title: string) => {
        const printWindow = window.open('', '_blank', 'height=400,width=600');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head><title>${title}</title></head>
                    <body>
                        <pre style="font-family: monospace; white-space: pre;">${zpl.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
                        <script>
                            window.onload = function() {
                                window.print();
                                window.onafterprint = function() { window.close(); }
                            }
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const handleSelectItem = (itemId: string) => {
        setSelectedItems(prev => 
            prev.includes(itemId) 
                ? prev.filter(id => id !== itemId) 
                : [...prev, itemId]
        );
    };

    const handleSelectAllItems = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedItems(filteredItems.map(item => item.id));
        } else {
            setSelectedItems([]);
        }
    };

    const handleDownloadBatchZpl = () => {
        const itemsToProcess = items.filter(item => selectedItems.includes(item.id));
        if (itemsToProcess.length === 0) return;

        const allZpl = itemsToProcess.map(item => generateZplForItem(item)).join('\n\n');
        const date = new Date().toISOString().split('T')[0];
        downloadZpl(allZpl, `qrcodes_lote_${date}.zpl`);
    };

    const handlePrintBatchZpl = () => {
        const itemsToProcess = items.filter(item => selectedItems.includes(item.id));
        if (itemsToProcess.length === 0) return;
        
        const allZpl = itemsToProcess.map(item => generateZplForItem(item)).join('\n\n');
        printZpl(allZpl, 'Impressão de QR Codes em Lote');
    };


    const PaginationButton: React.FC<{onClick: () => void; disabled: boolean; children: React.ReactNode}> = ({ onClick, disabled, children }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className="px-3 py-1 border rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            {children}
        </button>
    );
    
    const isCreating = itemToEdit && !itemToEdit.id;

    return (
        <div className="space-y-6">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Estoque Atual</h1>
                <div className="flex items-center gap-4">
                    {selectedItems.length > 0 && (
                        <>
                            <Button onClick={handleDownloadBatchZpl} className="bg-gray-600 hover:bg-gray-700">
                                <ExportIcon />
                                Baixar ZPL ({selectedItems.length})
                            </Button>
                            <Button onClick={handlePrintBatchZpl} className="bg-green-600 hover:bg-green-700">
                                <PrintIcon />
                                Imprimir ZPL ({selectedItems.length})
                            </Button>
                        </>
                    )}
                    <Button onClick={openCreateModal}>
                        <PlusIcon />
                        Novo Item
                    </Button>
                </div>
            </div>
            
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border-b">
                    <Input
                        placeholder="Buscar por código ou descrição..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                        <option value="">Todas Categorias</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </Select>
                    <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">Todos Status</option>
                        <option value="low">Abaixo do mínimo</option>
                        <option value="ok">Estoque OK</option>
                    </Select>
                    <Select value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
                        <option value="">Todas Localizações</option>
                        {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </Select>
                </div>
            </Card>

            <Card>
                 <div className="p-4 border-b bg-gray-50">
                    <p className="text-sm font-medium text-gray-600">Valor Total Consolidado (com base nos filtros)</p>
                    <p className="text-2xl font-bold text-blue-600">
                        {totalStockValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">
                                    <input 
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        onChange={handleSelectAllItems}
                                        checked={filteredItems.length > 0 && selectedItems.length === filteredItems.length}
                                        ref={el => {
                                            if (el) {
                                                el.indeterminate = selectedItems.length > 0 && selectedItems.length < filteredItems.length;
                                            }
                                        }}
                                        aria-label="Selecionar todos os itens"
                                    />
                                </th>
                                {['Código', 'Descrição', 'Categoria', 'Local', 'Medida', 'Qtd.', 'Qtd. Mín.', 'Valor Médio', 'Valor Total', 'Ações'].map(header => (
                                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedItems.length > 0 ? (
                                paginatedItems.map((item, index) => {
                                    const isLowStock = item.stockQuantity <= item.minQuantity;
                                    const isSelected = selectedItems.includes(item.id);
                                    
                                    let rowClass = '';
                                    if (isSelected) {
                                        rowClass = 'bg-blue-100'; // Selected items have a distinct blue background
                                    } else if (isLowStock) {
                                        rowClass = 'bg-red-50';
                                    } else {
                                        rowClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                                    }

                                    return (
                                        <tr key={item.id} className={`${rowClass} transition-colors duration-200 ease-in-out`}>
                                             <td className="px-6 py-4 whitespace-nowrap">
                                                <input 
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    checked={selectedItems.includes(item.id)}
                                                    onChange={() => handleSelectItem(item.id)}
                                                    aria-label={`Selecionar ${item.description}`}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    {isLowStock && (
                                                        <span className="h-2 w-2 bg-red-500 rounded-full flex-shrink-0" title="Estoque baixo"></span>
                                                    )}
                                                    <span>{item.code}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>{item.stockQuantity.toLocaleString('pt-BR')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.minQuantity.toLocaleString('pt-BR')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {item.avgUnitValue.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {item.totalValue.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center space-x-3">
                                                <button onClick={() => openEditModal(item)} className="text-blue-600 hover:text-blue-900 transition-colors" title="Editar Item">
                                                    <EditIcon />
                                                </button>
                                                <button onClick={() => openHistoryModal(item)} className="text-gray-600 hover:text-gray-900 transition-colors" title="Ver Histórico">
                                                    <HistoryIcon />
                                                </button>
                                                <button onClick={() => setPreviewItem(item)} className="text-gray-600 hover:text-gray-900 transition-colors" title="Gerar Etiqueta com QR Code">
                                                    <QrCodeIcon />
                                                </button>
                                                <button onClick={() => handleNewEntryForItem(item)} className="text-green-600 hover:text-green-900 transition-colors" title="Registrar Entrada">
                                                    <EntryIcon />
                                                </button>
                                                <button onClick={() => handleNewExitForItem(item)} className="text-yellow-500 hover:text-yellow-700 transition-colors" title="Registrar Saída">
                                                    <ExitIcon />
                                                </button>
                                                <button onClick={() => openDeleteConfirmation(item)} className="text-red-600 hover:text-red-900 transition-colors" title="Excluir Item">
                                                    <TrashIcon />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={11} className="text-center py-8 text-gray-500">
                                        Nenhum item encontrado com os filtros selecionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 0 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <span className="text-sm text-gray-600">
                            Mostrando {filteredItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
                            {Math.min(currentPage * itemsPerPage, filteredItems.length)} de {filteredItems.length} itens
                        </span>
                        <div className="flex items-center space-x-2">
                             <PaginationButton onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                                Primeira
                            </PaginationButton>
                            <PaginationButton onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                                Anterior
                            </PaginationButton>
                            <span className="text-sm font-medium text-gray-700 px-2">Página {currentPage} de {totalPages}</span>
                            <PaginationButton onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                                Próxima
                            </PaginationButton>
                            <PaginationButton onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                                Última
                            </PaginationButton>
                        </div>
                    </div>
                )}
            </Card>
            
            <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteConfirmation} title="Confirmar Exclusão">
                {itemToDelete && (
                    <div className="space-y-4">
                        <p>
                            Tem certeza que deseja excluir o item{' '}
                            <strong>{itemToDelete.code} - {itemToDelete.description}</strong>?
                        </p>
                        <p className="text-sm font-medium text-red-600">
                            Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex justify-end gap-4 pt-4">
                            <Button onClick={closeDeleteConfirmation} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                                Cancelar
                            </Button>
                            <Button onClick={confirmDeleteItem} className="bg-red-600 hover:bg-red-700">
                                Excluir
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isHistoryModalOpen} onClose={closeHistoryModal} title={`Histórico de Movimentação - ${selectedItemForHistory?.description}`}>
                {selectedItemForHistory && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <Button onClick={handleExportHistory} disabled={itemHistory.length === 0}>
                                <ExportIcon />
                                Exportar Histórico
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {itemHistory.length > 0 ? (
                                        itemHistory.map(record => (
                                            <tr key={record.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(record.date).toLocaleDateString('pt-BR')}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.type === 'entry' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {record.type === 'entry' ? 'Entrada' : 'Saída'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{record.quantity.toLocaleString('pt-BR')}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="text-center py-8 text-gray-500">
                                                Nenhuma movimentação encontrada para este item.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title={isCreating ? 'Novo Item' : 'Editar Item'}>
                {itemToEdit && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="code" className="block text-sm font-medium text-gray-700">Código</label>
                                <Input id="code" name="code" type="text" value={itemToEdit.code || ''} onChange={handleEditInputChange} readOnly={!isCreating} className={!isCreating ? 'bg-gray-100' : ''} />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
                                <Input id="description" name="description" type="text" value={itemToEdit.description || ''} onChange={handleEditInputChange} />
                            </div>
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoria</label>
                                <Input id="category" name="category" type="text" value={itemToEdit.category || ''} onChange={handleEditInputChange} />
                            </div>
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Localização</label>
                                <Input id="location" name="location" type="text" value={itemToEdit.location || ''} onChange={handleEditInputChange} />
                            </div>
                            <div>
                                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unidade de Medida</label>
                                <Input id="unit" name="unit" type="text" value={itemToEdit.unit || ''} onChange={handleEditInputChange} />
                            </div>
                            <div>
                                <label htmlFor="minQuantity" className="block text-sm font-medium text-gray-700">Quantidade Mínima</label>
                                <Input id="minQuantity" name="minQuantity" type="number" value={itemToEdit.minQuantity || 0} onChange={handleEditInputChange} />
                            </div>
                             {isCreating && (
                                <>
                                <div>
                                    <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700">Quantidade Inicial</label>
                                    <Input id="stockQuantity" name="stockQuantity" type="number" value={itemToEdit.stockQuantity || 0} onChange={handleEditInputChange} />
                                </div>
                                <div>
                                    <label htmlFor="avgUnitValue" className="block text-sm font-medium text-gray-700">Valor Médio Unitário</label>
                                    <Input id="avgUnitValue" name="avgUnitValue" type="number" value={itemToEdit.avgUnitValue || 0} onChange={handleEditInputChange} />
                                </div>
                                </>
                            )}
                        </div>
                        {!isCreating && (
                             <div className="pt-2">
                                <p className="text-xs text-gray-500">A quantidade em estoque e o valor são atualizados automaticamente através das entradas, saídas e inventário.</p>
                            </div>
                        )}
                        <div className="flex justify-end gap-4 pt-4">
                            <Button onClick={closeEditModal} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                                Cancelar
                            </Button>
                            <Button onClick={handleSaveItem}>
                                {isCreating ? 'Criar Item' : 'Salvar Alterações'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
            
            <Modal isOpen={!!previewItem} onClose={() => setPreviewItem(null)} title={`Etiqueta - ${previewItem?.code}`}>
                {previewItem && (
                    <>
                        <div className="flex flex-col items-center justify-center space-y-4 min-h-[300px]">
                            {isPreviewLoading && (
                                <div className="flex flex-col items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <p className="mt-2 text-gray-600">Gerando pré-visualização...</p>
                                </div>
                            )}
                            {previewError && (
                                <div className="text-center text-red-600">
                                    <p>Falha ao gerar a pré-visualização.</p>
                                    <p className="text-sm">Verifique sua conexão com a internet e tente novamente.</p>
                                </div>
                            )}
                            {previewUrl && !previewError && (
                                <img 
                                    src={previewUrl} 
                                    className="max-w-full h-auto border rounded-md" 
                                    alt="Pré-visualização da Etiqueta"
                                    onLoad={() => setIsPreviewLoading(false)}
                                    onError={() => {
                                        setPreviewError(true);
                                        setIsPreviewLoading(false);
                                    }}
                                    style={{ display: isPreviewLoading ? 'none' : 'block' }}
                                />
                            )}
                        </div>
                        <div className="flex justify-end gap-4 pt-6 mt-4 border-t">
                             <Button onClick={() => {
                                if (previewItem) {
                                    const zpl = generateZplForItem(previewItem);
                                    downloadZpl(zpl, `qrcode_${previewItem.code}.zpl`);
                                }
                            }} className="bg-gray-600 hover:bg-gray-700" disabled={isPreviewLoading || previewError}>
                                <ExportIcon />
                                Baixar ZPL
                            </Button>
                            <Button onClick={() => {
                                if (previewItem) {
                                    const zpl = generateZplForItem(previewItem);
                                    printZpl(zpl, `Imprimir QR Code - ${previewItem.code}`);
                                }
                            }} disabled={isPreviewLoading || previewError}>
                                <PrintIcon />
                                Imprimir ZPL
                            </Button>
                        </div>
                    </>
                )}
            </Modal>

        </div>
    );
};

export default StockList;