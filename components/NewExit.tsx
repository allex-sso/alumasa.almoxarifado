import React, { useState, useMemo, useEffect, useRef } from 'react';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { Item } from '../types';
import Toast from './ui/Toast';

interface NewExitProps {
    items: Item[];
    setItems: React.Dispatch<React.SetStateAction<Item[]>>;
    itemForExit: Item | null;
    clearItemForExit: () => void;
}

const NewExit: React.FC<NewExitProps> = ({ items, setItems, itemForExit, clearItemForExit }) => {
    const [isPreFilled] = useState(!!itemForExit);
    const [itemId, setItemId] = useState(itemForExit?.id || '');
    const [quantity, setQuantity] = useState('');
    const [requester, setRequester] = useState('');
    const [responsible, setResponsible] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{type: 'success' | 'error', text: string} | null>(null);
    const [searchTerm, setSearchTerm] = useState(itemForExit ? `${itemForExit.code} - ${itemForExit.description}` : '');
    const [itemError, setItemError] = useState<string | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const resultsContainerRef = useRef<HTMLUListElement>(null);

    const selectedItem = useMemo(() => items.find(item => item.id === itemId), [itemId, items]);
    
    const searchResults = useMemo(() => {
        if (!searchTerm.trim() || !!itemId) {
            return [];
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return items.filter(item =>
            item.code.toLowerCase().includes(lowerCaseSearchTerm) ||
            item.description.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [searchTerm, itemId, items]);

    useEffect(() => {
        if (itemForExit) {
            clearItemForExit();
        }
    }, [itemForExit, clearItemForExit]);

    useEffect(() => {
        if (activeIndex >= 0 && resultsContainerRef.current) {
            const activeItem = resultsContainerRef.current.children[activeIndex] as HTMLLIElement;
            if (activeItem) {
                activeItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [activeIndex]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setItemId(''); // Clear selection when user edits search
        setItemError(null); // Clear error when user types
        setShowResults(true);
        setActiveIndex(-1);
    };

    const handleItemSelect = (item: Item) => {
        setItemId(item.id);
        setSearchTerm(`${item.code} - ${item.description}`);
        setShowResults(false);
        setActiveIndex(-1);
        setItemError(null); // Clear error on successful selection
    };

    const handleSearchBlur = () => {
      setTimeout(() => {
        setShowResults(false);
        // Only run validation if no item is selected yet and the search term isn't empty
        if (!itemId && searchTerm.trim()) {
          const exactMatch = items.find(i => i.code.toLowerCase() === searchTerm.trim().toLowerCase());
          if (exactMatch) {
            handleItemSelect(exactMatch);
          } else {
            setItemError('Item inválido. Por favor, selecione um item da lista de busca.');
          }
        }
      }, 200); // 200ms delay to allow click on search results
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (showResults && searchResults.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % searchResults.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeIndex >= 0) {
                    handleItemSelect(searchResults[activeIndex]);
                } else { // try an exact match on enter if nothing is highlighted
                    const exactMatch = items.find(item => item.code.toLowerCase() === searchTerm.toLowerCase().trim());
                    if (exactMatch) handleItemSelect(exactMatch);
                }
            } else if (e.key === 'Escape') {
                setShowResults(false);
                setActiveIndex(-1);
            }
        } else if (e.key === 'Enter') { // Handle enter when list is not shown
            const exactMatch = items.find(item => item.code.toLowerCase() === searchTerm.toLowerCase().trim());
            if (exactMatch) {
                e.preventDefault();
                handleItemSelect(exactMatch);
            } else if (searchResults.length === 1) { // Auto-select if there's only one result
                e.preventDefault();
                handleItemSelect(searchResults[0]);
            }
        }
    };

    const exitDate = new Date().toLocaleDateString('pt-BR');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        
        if (!itemId || !quantity || !requester || !responsible) {
            setStatus({type: 'error', text: 'Todos os campos são obrigatórios. Por favor, selecione um item da lista.'});
            return;
        }

        const qty = parseFloat(quantity);
        if (qty <= 0) {
            setStatus({type: 'error', text: 'A quantidade deve ser maior que zero.'});
            return;
        }

        if (selectedItem && qty > selectedItem.stockQuantity) {
            setStatus({type: 'error', text: `Quantidade de saída (${qty}) excede o estoque atual (${selectedItem.stockQuantity}).`});
            return;
        }

        setIsLoading(true);
        setStatus(null);
        setItemError(null);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setItems(prevItems => prevItems.map(item => {
            if (item.id === itemId) {
                const newQuantity = item.stockQuantity - qty;
                return {
                    ...item,
                    stockQuantity: newQuantity,
                    totalValue: newQuantity * item.avgUnitValue
                };
            }
            return item;
        }));

        setIsLoading(false);
        setStatus({type: 'success', text: 'Saída registrada com sucesso!'});
        
        // Reset form for the next exit
        setQuantity('');
        setRequester('');
        setResponsible('');
        setItemId('');
        setSearchTerm('');
    };

    const isSubmitDisabled = isLoading || !itemId || !!itemError;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
             {status?.type === 'success' && (
                <Toast 
                    message={status.text}
                    type="success"
                    onClose={() => setStatus(null)}
                />
            )}
            <h1 className="text-3xl font-bold text-gray-800">{isPreFilled ? 'Registrar Saída para Item Específico' : 'Registrar Nova Saída'}</h1>
            <Card>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="p-4 mb-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-700">Data de Saída: <span className="font-bold">{exitDate}</span></p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 relative" role="combobox" aria-haspopup="listbox" aria-expanded={showResults && searchResults.length > 0}>
                            <label htmlFor="item" className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                            <Input
                                id="item"
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setShowResults(true)}
                                onBlur={handleSearchBlur}
                                placeholder="Digite o código ou descrição para buscar..."
                                autoComplete="off"
                                required={!itemId}
                                aria-autocomplete="list"
                                aria-controls="search-results-list"
                                aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
                                readOnly={isPreFilled}
                                className={`${isPreFilled ? 'bg-gray-100 cursor-not-allowed' : ''} ${itemError ? 'border-red-500' : ''}`}
                            />
                            {showResults && !isPreFilled && searchResults.length > 0 && (
                                <ul
                                    id="search-results-list"
                                    role="listbox"
                                    ref={resultsContainerRef}
                                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                                >
                                    {searchResults.map((item, index) => (
                                        <li
                                            id={`search-result-${index}`}
                                            key={item.id}
                                            onClick={() => handleItemSelect(item)}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            role="option"
                                            aria-selected={activeIndex === index}
                                            className={`px-4 py-2 cursor-pointer transition-colors ${activeIndex === index ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                                        >
                                            {item.code} - {item.description} (Estoque: {item.stockQuantity})
                                        </li>
                                    ))}
                                </ul>
                            )}
                             {itemError && <p className="text-sm text-red-600 mt-1">{itemError}</p>}
                            {selectedItem && (
                                <div className="mt-2 text-sm text-gray-600">
                                    Estoque atual: <span className={`font-bold ${selectedItem.stockQuantity <= selectedItem.minQuantity ? 'text-red-600' : 'text-green-600'}`}>{selectedItem.stockQuantity.toLocaleString('pt-BR')}</span>
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                            <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g., 10" min="0.01" step="0.01" required disabled={!itemId} className={!itemId ? 'bg-gray-100 cursor-not-allowed' : ''} />
                        </div>

                        <div>
                            <label htmlFor="requester" className="block text-sm font-medium text-gray-700 mb-1">Solicitante / Setor</label>
                            <Input id="requester" type="text" value={requester} onChange={e => setRequester(e.target.value)} placeholder="e.g., Manutenção" required disabled={!itemId} className={!itemId ? 'bg-gray-100 cursor-not-allowed' : ''} />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="responsible" className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                            <Input id="responsible" type="text" value={responsible} onChange={e => setResponsible(e.target.value)} placeholder="e.g., João da Silva" required disabled={!itemId} className={!itemId ? 'bg-gray-100 cursor-not-allowed' : ''} />
                        </div>
                    </div>

                    {status?.type === 'error' && (
                        <div className={`p-4 rounded-md text-sm bg-red-100 text-red-800`}>
                            {status.text}
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSubmitDisabled}>
                            {isLoading ? 'Registrando...' : 'Registrar Saída'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default NewExit;