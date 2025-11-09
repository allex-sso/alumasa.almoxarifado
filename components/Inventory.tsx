import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Item } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Toast from './ui/Toast';

interface InventoryProps {
    items: Item[];
    setItems: React.Dispatch<React.SetStateAction<Item[]>>;
}

const Inventory: React.FC<InventoryProps> = ({ items, setItems }) => {
    const [filterCategory, setFilterCategory] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [countedQuantities, setCountedQuantities] = useState<Record<string, string>>({});
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesCategory = filterCategory ? item.category === filterCategory : true;
            const matchesLocation = filterLocation ? item.location === filterLocation : true;
            const matchesSearch = searchTerm ? item.description.toLowerCase().includes(searchTerm.toLowerCase()) || item.code.toLowerCase().includes(searchTerm.toLowerCase()) : true;
            return matchesCategory && matchesLocation && matchesSearch;
        }).sort((a, b) => a.location.localeCompare(b.location) || a.code.localeCompare(b.code));
    }, [filterCategory, filterLocation, searchTerm, items]);

    // Reset page to 1 on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterCategory, filterLocation, searchTerm]);

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredItems.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredItems, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const categories = useMemo(() => [...new Set(items.map(item => item.category))], [items]);
    const locations = useMemo(() => [...new Set(items.map(item => item.location))], [items]);

    const handleCountChange = (itemId: string, value: string) => {
        setCountedQuantities(prev => ({
            ...prev,
            [itemId]: value,
        }));
    };
    
    const itemsToUpdate = useMemo(() => {
        return Object.entries(countedQuantities)
            .map(([itemId, countedValue]) => {
                if (countedValue === undefined || countedValue === '' || countedValue === null) return null;
                const item = items.find(i => i.id === itemId);
                const countedQty = parseFloat(String(countedValue));
                if (!item || isNaN(countedQty) || item.stockQuantity === countedQty) return null;
                return { ...item, newQuantity: countedQty, difference: countedQty - item.stockQuantity };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);
    }, [countedQuantities, items]);

    const summary = useMemo(() => {
        const countedItemsSet = new Set(Object.keys(countedQuantities).filter(key => countedQuantities[key].trim() !== ''));
        const countedItemsCount = countedItemsSet.size;
        const progress = filteredItems.length > 0 ? (countedItemsCount / filteredItems.length) * 100 : 0;
        const divergenceCount = itemsToUpdate.length;
        const totalAdjustmentValue = itemsToUpdate.reduce((sum, item) => {
            const valueDifference = item.difference * item.avgUnitValue;
            return sum + valueDifference;
        }, 0);
        return { countedItemsCount, progress, divergenceCount, totalAdjustmentValue };
    }, [countedQuantities, filteredItems.length, itemsToUpdate]);

    const handleSaveInventory = () => {
        const updatedItems = items.map(item => {
            const countedStr = countedQuantities[item.id];
            if (countedStr !== undefined && countedStr.trim() !== '') {
                const countedQty = parseFloat(countedStr);
                if (!isNaN(countedQty)) {
                    return {
                        ...item,
                        stockQuantity: countedQty,
                        totalValue: countedQty * item.avgUnitValue,
                    };
                }
            }
            return item;
        });
        setItems(updatedItems);
        setCountedQuantities({});
        setIsConfirmModalOpen(false);
        setToast({ message: 'Inventário atualizado com sucesso!', type: 'success' });
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const nextInput = inputRefs.current[currentIndex + 1];
            if (nextInput) {
                nextInput.focus();
                nextInput.select();
            }
        }
    };

    const DifferenceDisplay: React.FC<{ value: number }> = ({ value }) => {
        if (value === 0) return <span className="text-gray-500 font-medium">0</span>;
        if (value > 0) return <span className="text-green-600 font-bold">+{value.toLocaleString('pt-BR')}</span>;
        return <span className="text-red-600 font-bold">{value.toLocaleString('pt-BR')}</span>;
    };

    const ValueDisplay: React.FC<{ value: number }> = ({ value }) => {
        const color = value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600';
        return <span className={`font-mono font-bold text-right ${color}`}>{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
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

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <h1 className="text-3xl font-bold text-gray-800">Inventário</h1>

            <Card>
                 <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b">
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Progresso da Contagem</label>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${summary.progress}%` }}></div>
                        </div>
                        <p className="text-sm text-gray-600">{summary.countedItemsCount} de {filteredItems.length} itens contados</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-sm font-medium text-gray-500">Itens com Divergência</p>
                        <p className="text-2xl font-bold text-gray-800">{summary.divergenceCount}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-sm font-medium text-gray-500">Valor Total do Ajuste</p>
                        <ValueDisplay value={summary.totalAdjustmentValue} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    <Input
                        placeholder="Buscar por código ou descrição..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                        <option value="">Todas Categorias</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </Select>
                    <Select value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
                        <option value="">Todas Localizações</option>
                        {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </Select>
                </div>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Código', 'Descrição', 'Estoque (Sistema)', 'Qtd. Contada', 'Diferença'].map(header => (
                                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedItems.map((item, index) => {
                                const countedValue = countedQuantities[item.id] ?? '';
                                const hasBeenCounted = countedValue.trim() !== '';
                                const systemQty = item.stockQuantity;
                                const countedQty = hasBeenCounted ? parseFloat(countedValue) : systemQty;
                                const difference = isNaN(countedQty) ? 0 : countedQty - systemQty;
                                const rowClass = hasBeenCounted ? 'bg-blue-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50';

                                return (
                                    <tr key={item.id} className={rowClass}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{systemQty.toLocaleString('pt-BR')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Input
                                                ref={el => inputRefs.current[index] = el}
                                                type="number"
                                                className="w-28 text-center"
                                                min="0"
                                                value={countedValue}
                                                onChange={(e) => handleCountChange(item.id, e.target.value)}
                                                onKeyDown={(e) => handleInputKeyDown(e, index)}
                                                placeholder={systemQty.toString()}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {hasBeenCounted && <DifferenceDisplay value={difference} />}
                                        </td>
                                    </tr>
                                );
                            })}
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

            <div className="flex justify-end">
                <Button onClick={() => setIsConfirmModalOpen(true)} disabled={itemsToUpdate.length === 0}>
                    Salvar Inventário ({itemsToUpdate.length} {itemsToUpdate.length === 1 ? 'item' : 'itens'} para ajustar)
                </Button>
            </div>
            
            <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirmar Ajuste de Inventário">
                 <div className="space-y-4">
                    <p>
                        Você está prestes a ajustar o estoque de <strong>{itemsToUpdate.length}</strong> {itemsToUpdate.length === 1 ? 'item' : 'itens'}.
                    </p>
                    <div className="max-h-60 overflow-y-auto border rounded-md p-2 bg-gray-50">
                        <ul className="divide-y">
                            <li className="py-1 px-1 grid grid-cols-6 gap-2 font-bold text-xs text-gray-500">
                                <span className="col-span-3">Item</span>
                                <span className="text-center">Ajuste Qtd.</span>
                                <span className="text-center col-span-2">Impacto Financeiro</span>
                            </li>
                            {itemsToUpdate.map(item => {
                                const valueDifference = item.difference * item.avgUnitValue;
                                return (
                                <li key={item.id} className="py-2 px-1 text-sm grid grid-cols-6 gap-2 items-center">
                                    <span className="col-span-3">{item.code} - {item.description}</span>
                                    <span className="font-mono text-center">
                                        {item.stockQuantity} &rarr; <span className="font-bold">{item.newQuantity}</span> (<DifferenceDisplay value={item.difference} />)
                                    </span>
                                    <span className="col-span-2">
                                        <ValueDisplay value={valueDifference} />
                                    </span>
                                </li> 
                            )})}
                        </ul>
                    </div>
                     <p className="text-sm font-medium text-red-600">
                        Esta ação é irreversível e irá sobrescrever as quantidades atuais em estoque. Deseja continuar?
                    </p>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button onClick={() => setIsConfirmModalOpen(false)} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveInventory} className="bg-green-600 hover:bg-green-700">
                            Confirmar e Salvar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Inventory;