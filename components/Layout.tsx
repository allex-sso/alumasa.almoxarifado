import React, { useState, useRef, useEffect } from 'react';
import { Page, User } from '../types';
import { DashboardIcon, StockIcon, EntryIcon, ExitIcon, ReportsIcon, LogoutIcon, MenuIcon, CloseIcon, UserIcon, CameraIcon, InventoryIcon, BackupIcon } from './icons/Icons';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  activePage: Page;
  setActivePage: (page: Page) => void;
  onUpdateProfilePicture: (newImageUrl: string) => void;
  isPasswordChangeForced: boolean;
}

const NavLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}> = ({ icon, label, isActive, onClick, disabled }) => (
  <li
    className={`flex items-center p-3 my-1 rounded-lg transition-colors ${
      disabled 
      ? 'text-gray-500 cursor-not-allowed'
      : isActive
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-300 hover:bg-blue-800 hover:text-white cursor-pointer'
    }`}
    onClick={!disabled ? onClick : undefined}
  >
    {icon}
    <span className="ml-4 font-medium">{label}</span>
  </li>
);

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, activePage, setActivePage, onUpdateProfilePicture, isPasswordChangeForced }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, role: ['Admin', 'Operator'] },
    { id: 'stock', label: 'Estoque Atual', icon: <StockIcon />, role: ['Admin', 'Operator'] },
    { id: 'new-entry', label: 'Nova Entrada', icon: <EntryIcon />, role: ['Admin', 'Operator'] },
    { id: 'new-exit', label: 'Nova Saída', icon: <ExitIcon />, role: ['Admin', 'Operator'] },
    { id: 'reports', label: 'Relatórios', icon: <ReportsIcon />, role: ['Admin', 'Operator'] },
    { id: 'inventory', label: 'Inventário', icon: <InventoryIcon />, role: ['Admin'] },
    { id: 'users', label: 'Usuários', icon: <UserIcon />, role: ['Admin'] },
    { id: 'backup', label: 'Backup & Restauração', icon: <BackupIcon />, role: ['Admin'] },
  ];

  const handleNavigation = (page: Page) => {
      setActivePage(page);
      setSidebarOpen(false);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfilePicture = () => {
    if (previewImage) {
      onUpdateProfilePicture(previewImage);
    }
    setIsProfileModalOpen(false);
    setPreviewImage(null);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
    setPreviewImage(null);
  };

  const pageTitles: Record<Page, string> = {
    dashboard: 'Dashboard',
    stock: 'Estoque Atual',
    'new-entry': 'Nova Entrada',
    'new-exit': 'Nova Saída',
    reports: 'Relatórios',
    users: 'Gerenciamento de Usuários',
    inventory: 'Inventário',
    backup: 'Backup e Restauração'
  };

  useEffect(() => {
    const title = pageTitles[activePage] || 'Dashboard';
    document.title = `${title} | Alumasa Controle do Almoxarifado`;
  }, [activePage]);

  const sidebarContent = (
    <>
      <div className="flex flex-col items-center justify-center p-4 border-b border-blue-900 text-center">
         <h1 className="text-2xl font-bold text-white">Alumasa</h1>
         <span className="text-sm text-gray-300">Controle do Almoxarifado</span>
      </div>
      <nav className="flex-1 p-4">
        <ul>
          {navItems.map((item) => (
            item.role.includes(user.role) && (
                 <NavLink
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    isActive={activePage === item.id}
                    onClick={() => handleNavigation(item.id as Page)}
                    disabled={isPasswordChangeForced}
                />
            )
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-blue-900">
         <NavLink
            icon={<LogoutIcon />}
            label="Sair"
            isActive={false}
            onClick={onLogout}
            disabled={isPasswordChangeForced}
        />
      </div>
    </>
  );

  return (
    <div className={`flex h-screen bg-gray-100 ${isPasswordChangeForced ? 'filter blur-sm' : ''}`}>
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity md:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`fixed md:relative inset-y-0 left-0 bg-[#002347] w-64 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col transition-transform duration-300 ease-in-out z-40 shadow-lg`}>
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
          <button className="text-gray-600 md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
          <div className="flex-1">
             <h2 className="text-xl font-semibold text-gray-700">{pageTitles[activePage] || 'Dashboard'}</h2>
          </div>
          <div className="flex items-center">
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Editar foto do perfil"
              disabled={isPasswordChangeForced}
            >
              <img
                className="w-10 h-10 rounded-full object-cover"
                src={user.profilePictureUrl || `https://picsum.photos/seed/${user.id}/100`}
                alt="User avatar"
              />
            </button>
            <span className="text-gray-600 ml-3">Bem-vindo, {user.name}</span>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
       <Modal isOpen={isProfileModalOpen} onClose={handleCloseProfileModal} title="Editar Foto do Perfil">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <img
                className="w-32 h-32 rounded-full object-cover"
                src={previewImage || user.profilePictureUrl || `https://picsum.photos/seed/${user.id}/100`}
                alt="Pré-visualização do Perfil"
              />
              <div 
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full flex items-center justify-center cursor-pointer transition-opacity"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                aria-label="Alterar imagem"
              >
                <CameraIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <Button onClick={() => fileInputRef.current?.click()}>
              Selecionar Imagem
            </Button>
            <p className="text-xs text-gray-500">Clique na imagem ou no botão para alterar.</p>
          </div>
          <div className="flex justify-end gap-4 pt-6 mt-4 border-t">
            <Button onClick={handleCloseProfileModal} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
              Cancelar
            </Button>
            <Button onClick={handleSaveProfilePicture} disabled={!previewImage}>
              Salvar
            </Button>
          </div>
      </Modal>
    </div>
  );
};

export default Layout;