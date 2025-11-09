import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Textarea from './ui/Textarea';
import { Item } from '../types';
import Toast from './ui/Toast';

interface NewEntryProps {
    items: Item[];
    setItems: React.Dispatch<React.SetStateAction<Item[]>>;
    itemForEntry: Item | null;
    clearItemForEntry: () => void;
}

const NewEntry: React.FC<NewEntryProps> = ({ items, setItems, itemForEntry, clearItemForEntry }) => {
    const [isPreFilled] = useState(!!itemForEntry);
    const [code, setCode] = useState(itemForEntry?.code || '');
    const [description, setDescription] = useState(itemForEntry?.description || '');
    const [quantity, setQuantity] = useState('');
    const [supplier, setSupplier] = useState('');
    const [invoice, setInvoice] = useState('');
    const [observations, setObservations] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{type: 'success' | 'error', text: string} | null>(null);
    const [codeError, setCodeError] = useState<string | null>(null);
    const [isItemLocked, setIsItemLocked] = useState(!!itemForEntry);


    useEffect(() => {
        // This effect runs once when the component mounts with a pre-filled item.
        // It's designed to clear the global state in App.tsx to prevent re-filling on navigation.
        if (itemForEntry) {
            clearItemForEntry();
        }
    }, [itemForEntry, clearItemForEntry]);

    const entryDate = new Date().toLocaleDateString('pt-BR');

    const handleCodeBlur = () => {
        // Don't validate if it was pre-filled or if the code is empty
        if (isPreFilled || !code.trim()) {
            setCodeError(null);
            if (!isPreFilled && !code.trim()) {
                setDescription('');
                setIsItemLocked(false);
            }
            return;
        }

        const foundItem = items.find(i => i.code.toLowerCase() === code.toLowerCase().trim());

        if (foundItem) {
            setDescription(foundItem.description);
            setCodeError(null);
            setIsItemLocked(true);
        } else {
            setDescription(''); // Clear description if code is invalid
            setCodeError('Código do item não encontrado.');
            setIsItemLocked(false);
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCode(e.target.value);
        // If user changes the code, unlock the description and clear it
        if (isItemLocked) {
            setIsItemLocked(false);
            setDescription('');
        }
        // Clear error as user types
        if (codeError) {
            setCodeError(null);
        }
    };


    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        
        if (codeError) {
             setStatus({type: 'error', text: 'Por favor, corrija os erros antes de continuar.'});
             return;
        }
        
        if (!code || !description || !quantity || !supplier || !invoice) {
            setStatus({type: 'error', text: 'Todos os campos, exceto observações, são obrigatórios.'});
            return;
        }

        if (parseFloat(quantity) <= 0) {
            setStatus({type: 'error', text: 'A quantidade deve ser maior que zero.'});
            return;
        }

        setIsLoading(true);
        setStatus(null);

        // Re-validate the item just before submitting
        const itemToUpdate = items.find(i => i.code.toLowerCase() === code.toLowerCase());
        if (!itemToUpdate) {
            setStatus({ type: 'error', text: 'Código do item não encontrado. A entrada não pode ser registrada.' });
            setIsLoading(false);
            return;
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setItems(prevItems => prevItems.map(item => {
            if (item.id === itemToUpdate.id) {
                const newQuantity = item.stockQuantity + parseFloat(quantity);
                return {
                    ...item,
                    stockQuantity: newQuantity,
                    totalValue: newQuantity * item.avgUnitValue,
                };
            }
            return item;
        }));

        setIsLoading(false);
        setStatus({type: 'success', text: 'Entrada registrada com sucesso!'});
        
        // Reset form for the next entry
        setQuantity('');
        setSupplier('');
        setInvoice('');
        setObservations('');
        setCode('');
        setDescription('');
        setIsItemLocked(false);
        setCodeError(null);
    };

    const isSubmitDisabled = isLoading || !!codeError || !description;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
             {status?.type === 'success' && (
                <Toast 
                    message={status.text}
                    type="success"
                    onClose={() => setStatus(null)}
                />
            )}
            <h1 className="text-3xl font-bold text-gray-800">{isPreFilled ? 'Registrar Entrada para Item Existente' : 'Registrar Nova Entrada'}</h1>
            <Card>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="p-4 mb-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-700">Data de Entrada: <span className="font-bold">{entryDate}</span></p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                            <Input 
                                id="code" 
                                type="text" 
                                value={code} 
                                onChange={handleCodeChange}
                                onBlur={handleCodeBlur}
                                placeholder="e.g., PAR-001" 
                                required 
                                readOnly={isPreFilled} 
                                className={`${isPreFilled ? 'bg-gray-100 cursor-not-allowed' : ''} ${codeError ? 'border-red-500' : ''}`}
                             />
                             {codeError && <p className="text-sm text-red-600 mt-1">{codeError}</p>}
                        </div>
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                            <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g., 100" min="0.01" step="any" required />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                            <Input 
                                id="description" 
                                type="text" 
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                placeholder="e.g., Parafuso Sextavado M8" 
                                required 
                                readOnly={isItemLocked} 
                                className={isItemLocked ? 'bg-gray-100 cursor-not-allowed' : ''} 
                            />
                        </div>
                        <div>
                            <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                            <Input id="supplier" type="text" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="e.g., Parafusos & Cia" required />
                        </div>
                        <div>
                            <label htmlFor="invoice" className="block text-sm font-medium text-gray-700 mb-1">Nota Fiscal</label>
                            <Input id="invoice" type="text" value={invoice} onChange={e => setInvoice(e.target.value)} placeholder="e.g., 987654" required />
                        </div>
                        <div className="md:col-span-2">
                             <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                            <Textarea id="observations" value={observations} onChange={e => setObservations(e.target.value)} placeholder="Detalhes adicionais sobre a entrada..." />
                        </div>
                    </div>
                    {status?.type === 'error' && (
                        <div className={`p-4 rounded-md text-sm bg-red-100 text-red-800`}>
                            {status.text}
                        </div>
                    )}
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSubmitDisabled}>
                            {isLoading ? 'Registrando...' : 'Registrar Entrada'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default NewEntry;