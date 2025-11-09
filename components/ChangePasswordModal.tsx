
import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';
import { EyeIcon, EyeOffIcon } from './icons/Icons';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPassword: string) => void;
  title: string;
  isForced?: boolean;
  allowDefaultPassword?: boolean;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, onSave, title, isForced = false, allowDefaultPassword = false }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!newPassword || !confirmPassword) {
      setError('Ambos os campos de senha são obrigatórios.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword === 'changeme' && !allowDefaultPassword) {
        setError('A nova senha não pode ser a senha padrão.');
        return;
    }
    setError('');
    onSave(newPassword);
  };
  
  const canSave = newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        {isForced && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Para sua segurança, você precisa criar uma nova senha para continuar.
            </p>
          </div>
        )}
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
            Nova Senha
          </label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha"
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar Nova Senha
          </label>
          <Input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirme a nova senha"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <div className="flex justify-end gap-4 pt-6 mt-4 border-t">
        {!isForced && (
          <Button onClick={onClose} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
            Cancelar
          </Button>
        )}
        <Button onClick={handleSave} disabled={!canSave}>
          Salvar Nova Senha
        </Button>
      </div>
    </Modal>
  );
};

export default ChangePasswordModal;
