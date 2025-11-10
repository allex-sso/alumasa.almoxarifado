import React, { useState } from 'react';
import { Supplier } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Input from './ui/Input';
import { PlusIcon, EditIcon, TrashIcon } from './icons/Icons';
import Toast from './ui/Toast';

interface SupplierManagementProps {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  addAuditLog: (action: string) => void;
}

const SupplierManagement: React.FC<SupplierManagementProps> = ({ suppliers, setSuppliers, addAuditLog }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Partial<Supplier> | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  const openModal = (supplier: Partial<Supplier> | null = null) => {
    setCurrentSupplier(supplier ? { ...supplier } : { id: '', name: '', contactPerson: '', email: '', phone: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSupplier(null);
  };

  const handleSaveSupplier = () => {
     const requiredFields: { key: keyof Supplier; name: string }[] = [
      { key: 'name', name: 'Nome do Fornecedor' },
      { key: 'contactPerson', name: 'Pessoa de Contato' },
      { key: 'email', name: 'E-mail' },
      { key: 'phone', name: 'Telefone' },
    ];

    const missingFields = requiredFields.filter(
      (field) => !currentSupplier?.[field.key]?.trim()
    );

    if (missingFields.length > 0) {
      const missingFieldNames = missingFields.map((f) => f.name).join(', ');
      setToast({
        message: `Os campos a seguir são obrigatórios: ${missingFieldNames}.`,
        type: 'warning',
      });
      return;
    }

    if (currentSupplier?.id) { // Editing existing supplier
      setSuppliers(suppliers.map(s => s.id === currentSupplier.id ? currentSupplier as Supplier : s));
      addAuditLog(`Editou os dados do fornecedor ${currentSupplier.name}.`);
      setToast({ message: 'Fornecedor atualizado com sucesso!', type: 'success' });
    } else { // Creating new supplier
      const newSupplier: Supplier = {
        ...currentSupplier,
        id: `supplier-${Date.now()}`,
      } as Supplier;
      setSuppliers([...suppliers, newSupplier]);
      addAuditLog(`Criou o fornecedor ${newSupplier.name}.`);
      setToast({ message: 'Fornecedor criado com sucesso!', type: 'success' });
    }
    closeModal();
  };
  
  const handleDeleteSupplier = (supplierId: string) => {
    const supplierToDelete = suppliers.find(s => s.id === supplierId);
    if (!supplierToDelete) return;

    if (window.confirm(`Tem certeza que deseja excluir o fornecedor ${supplierToDelete.name}?`)) {
        setSuppliers(suppliers.filter(s => s.id !== supplierId));
        addAuditLog(`Excluiu o fornecedor ${supplierToDelete.name}.`);
        setToast({ message: 'Fornecedor excluído com sucesso!', type: 'success' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentSupplier) {
        setCurrentSupplier({ ...currentSupplier, [e.target.name]: e.target.value });
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
          <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
          />
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Fornecedores</h1>
        <Button onClick={() => openModal()}>
          <PlusIcon />
          Novo Fornecedor
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map(supplier => (
                <tr key={supplier.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{supplier.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.contactPerson}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-4">
                    <button onClick={() => openModal(supplier)} className="text-blue-600 hover:text-blue-900" title="Editar">
                      <EditIcon />
                    </button>
                    <button onClick={() => handleDeleteSupplier(supplier.id)} className="text-red-600 hover:text-red-900" title="Excluir">
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      <Modal isOpen={isModalOpen} onClose={closeModal} title={currentSupplier?.id ? 'Editar Fornecedor' : 'Novo Fornecedor'}>
        {currentSupplier && (
            <div className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Fornecedor</label>
                    <Input id="name" name="name" type="text" value={currentSupplier.name || ''} onChange={handleInputChange} required />
                </div>
                <div>
                    <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">Pessoa de Contato</label>
                    <Input id="contactPerson" name="contactPerson" type="text" value={currentSupplier.contactPerson || ''} onChange={handleInputChange} required />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
                    <Input id="email" name="email" type="email" value={currentSupplier.email || ''} onChange={handleInputChange} required />
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
                    <Input id="phone" name="phone" type="text" value={currentSupplier.phone || ''} onChange={handleInputChange} required />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button onClick={closeModal} className="bg-gray-200 text-gray-800 hover:bg-gray-300">Cancelar</Button>
                    <Button onClick={handleSaveSupplier}>Salvar</Button>
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
};

export default SupplierManagement;