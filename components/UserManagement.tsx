
import React, { useState } from 'react';
import { User, Role } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Select from './ui/Select';
import { PlusIcon, EditIcon, TrashIcon, KeyIcon } from './icons/Icons';
import Toast from './ui/Toast';

interface UserManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onChangePassword: (user: User) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers, onChangePassword }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const openModal = (user: Partial<User> | null = null) => {
    setCurrentUser(user ? { ...user } : { id: '', name: '', email: '', role: 'Operator' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
  };

  const handleSaveUser = () => {
    if (!currentUser || !currentUser.name || !currentUser.email) {
      alert('Nome e E-mail são obrigatórios.');
      return;
    }

    if (currentUser.id) { // Editing existing user
      setUsers(users.map(u => u.id === currentUser.id ? currentUser as User : u));
      setToastMessage('Usuário atualizado com sucesso!');
    } else { // Creating new user
      const newUser: User = {
        ...currentUser,
        id: (users.length + 1).toString(), // simple id generation
        profilePictureUrl: `https://picsum.photos/seed/${Date.now()}/100`,
        password: 'changeme' // default password
      } as User;
      setUsers([...users, newUser]);
      setToastMessage('Usuário criado com sucesso!');
    }
    closeModal();
  };
  
  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
        setUsers(users.filter(u => u.id !== userId));
        setToastMessage('Usuário excluído com sucesso!');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (currentUser) {
        setCurrentUser({ ...currentUser, [e.target.name]: e.target.value });
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
          <Toast
              message={toastMessage}
              type="success"
              onClose={() => setToastMessage(null)}
          />
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Usuários</h1>
        <Button onClick={() => openModal()}>
          <PlusIcon />
          Novo Usuário
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Foto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perfil</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img 
                      className="h-10 w-10 rounded-full object-cover"
                      src={user.profilePictureUrl || `https://picsum.photos/seed/${user.id}/100`}
                      alt={user.name}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'Admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-4">
                    <button onClick={() => openModal(user)} className="text-blue-600 hover:text-blue-900" title="Editar">
                      <EditIcon />
                    </button>
                    <button onClick={() => onChangePassword(user)} className="text-gray-600 hover:text-gray-900" title="Alterar Senha">
                        <KeyIcon />
                    </button>
                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900" title="Excluir">
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      <Modal isOpen={isModalOpen} onClose={closeModal} title={currentUser?.id ? 'Editar Usuário' : 'Novo Usuário'}>
        {currentUser && (
            <div className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
                    <Input id="name" name="name" type="text" value={currentUser.name} onChange={handleInputChange} required />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
                    <Input id="email" name="email" type="email" value={currentUser.email} onChange={handleInputChange} required />
                </div>
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">Perfil</label>
                    <Select id="role" name="role" value={currentUser.role} onChange={handleInputChange} required>
                        <option value="Admin">Admin</option>
                        <option value="Operator">Operator</option>
                    </Select>
                </div>
                {!currentUser.id && (
                    <div className="p-3 mt-2 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                            A senha inicial será <strong>'changeme'</strong>. O usuário deverá alterá-la após o primeiro login.
                        </p>
                    </div>
                )}
                <div className="flex justify-end gap-4 pt-4">
                    <Button onClick={closeModal} className="bg-gray-200 text-gray-800 hover:bg-gray-300">Cancelar</Button>
                    <Button onClick={handleSaveUser}>Salvar</Button>
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
