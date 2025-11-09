

import React, { useState, useMemo } from 'react';
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

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesCategory = filterCategory ? item.category === filterCategory : true;
            const matchesLocation = filterLocation ? item.location === filterLocation : true;
            const matchesSearch = searchTerm ? item.description.toLowerCase().includes(searchTerm.toLowerCase()) || item.code.toLowerCase().includes(searchTerm.toLowerCase()) : true;
            return matchesCategory && matchesLocation && matchesSearch;
        }).sort((a,b) => a.code.localeCompare(b.code));
    }, [filterCategory, filterLocation, searchTerm, items]);

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
                if (countedValue === '' || countedValue === null) return null;
                const item = items.find(i => i.id === itemId);
                // FIX: Explicitly cast countedValue to a string before parsing. This handles cases where its type might be inferred as 'unknown', causing an error.
                const countedQty = parseFloat(String(countedValue));
                if (!item || isNaN(countedQty) || item.stockQuantity === countedQty) return null;
                return { ...item, newQuantity: countedQty, difference: countedQty - item.stockQuantity };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);
    }, [countedQuantities, items]);


    const handleSaveInventory = () => {
        const updatedItems = items.map(item => {
            const countedStr = countedQuantities[item.id];
            if (countedStr !== undefined && countedStr !== '') {
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

    const DifferenceDisplay: React.FC<{ value: number }> = ({ value }) => {
        if (value === 0) return <span className="text-gray-500 font-medium">0</span>;
        if (value > 0) return <span className="text-green-600 font-bold">+{value.toLocaleString('pt-BR')}</span>;
        return <span className="text-red-600 font-bold">{value.toLocaleString('pt-BR')}</span>;
    };

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <h1 className="text-3xl font-bold text-gray-800">Inventário</h1>

            <Card>
                <div className="p-4 bg-yellow-50 border-b border-yellow-200">
                    <h3 className="text-lg font-semibold text-yellow-800">Instruções</h3>
                    <p className="mt-1 text-sm text-yellow-700">
                        Preencha a coluna 'Quantidade Contada' com o valor físico de cada item. Itens não preenchidos não serão alterados. Após a contagem, clique em 'Salvar Inventário' para ajustar o estoque do sistema.
                    </p>
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
                                {['Código', 'Descrição', 'Estoque (Sistema)', 'Quantidade Contada', 'Diferença'].map(header => (
                                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredItems.map((item) => {
                                const countedValue = countedQuantities[item.id] ?? '';
                                const systemQty = item.stockQuantity;
                                const countedQty = countedValue !== '' ? parseFloat(countedValue) : systemQty;
                                const difference = isNaN(countedQty) ? 0 : countedQty - systemQty;

                                return (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{systemQty.toLocaleString('pt-BR')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Input
                                                type="number"
                                                className="w-28 text-center"
                                                min="0"
                                                value={countedValue}
                                                onChange={(e) => handleCountChange(item.id, e.target.value)}
                                                placeholder={systemQty.toString()}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <DifferenceDisplay value={difference} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
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
                            {itemsToUpdate.map(item => (
                               <li key={item.id} className="py-2 px-1 text-sm flex justify-between">
                                    <span>{item.code} - {item.description}</span>
                                    <span className="font-mono">
                                        {item.stockQuantity} &rarr; <span className="font-bold">{item.newQuantity}</span> (<DifferenceDisplay value={item.difference} />)
                                    </span>
                                </li> 
                            ))}
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