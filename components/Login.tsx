import React, { useState, useEffect } from 'react';
import { User } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { EyeIcon, EyeOffIcon } from './icons/Icons';
import Modal from './ui/Modal';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: boolean; password?: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        setEmail(rememberedEmail);
        setRememberMe(true);
    }
  }, []);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, field: 'email' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (error) setError('');
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: false }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setFieldErrors({});

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    setIsLoading(false);
    if (user) {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      onLogin(user);
    } else {
      setError('E-mail ou senha inválidos.');
      setFieldErrors({ email: true, password: true });
    }
  };

  const handleForgotPassword = () => {
    setIsForgotPasswordModalOpen(true);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#002347]">
      <div className="w-full max-w-md px-4">
        <div className="flex flex-col items-center mb-6">
           <h1 className="text-4xl font-bold text-white">Alumasa</h1>
          <h2 className="text-xl font-semibold text-white mt-4">Controle do Almoxarifado</h2>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <h2 className="text-2xl font-semibold text-center text-gray-700">Login</h2>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={handleInputChange(setEmail, 'email')}
                placeholder="seuemail@exemplo.com"
                required
                className={fieldErrors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handleInputChange(setPassword, 'password')}
                  placeholder="********"
                  required
                  className={`pr-10 ${fieldErrors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
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

            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                        Lembrar-me
                    </label>
                </div>
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
                  >
                    Esqueci minha senha?
                  </button>
                </div>
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            
            <div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
       <Modal isOpen={isForgotPasswordModalOpen} onClose={() => setIsForgotPasswordModalOpen(false)} title="Recuperação de Senha">
          <div className="space-y-6 text-center">
            <p className="text-gray-700">
              Para redefinir sua senha, por favor, entre em contato com o administrador do sistema.
            </p>
            <Button onClick={() => setIsForgotPasswordModalOpen(false)} className="mx-auto">
              Entendido
            </Button>
          </div>
      </Modal>
    </div>
  );
};

export default Login;