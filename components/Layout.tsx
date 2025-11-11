
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Page, User, Item } from '../types';
// FIX: Import missing EntryIcon and ExitIcon components.
import { DashboardIcon, StockIcon, ReportsIcon, LogoutIcon, MenuIcon, CloseIcon, UserIcon, CameraIcon, InventoryIcon, BackupIcon, SearchIcon, AuditIcon, MovementIcon, ControlIcon, ChevronRightIcon, SupplierIcon, BellIcon, EntryIcon, ExitIcon, ChatIcon } from './icons/Icons';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Chat from './Chat';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  activePage: Page;
  setActivePage: (page: Page) => void;
  onUpdateProfilePicture: (newImageUrl: string) => void;
  isPasswordChangeForced: boolean;
  items: Item[];
  onGlobalSearch: (searchTerm: string) => void;
  onNavigateWithFilters: (filters: { category?: string, status?: string }) => void;
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

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, activePage, setActivePage, onUpdateProfilePicture, isPasswordChangeForced, items, onGlobalSearch, onNavigateWithFilters }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const lowStockCount = useMemo(() => items.filter(item => item.stockQuantity <= item.minQuantity).length, [items]);

  const navStructure = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />,
      page: 'dashboard' as Page,
      role: ['Admin', 'Operator'],
    },
    {
      id: 'estoque',
      label: 'Estoque',
      icon: <StockIcon />,
      role: ['Admin', 'Operator'],
      children: [
        { id: 'stock', label: 'Estoque Atual', page: 'stock' as Page, role: ['Admin', 'Operator'] },
        { id: 'inventory', label: 'Inventário', page: 'inventory' as Page, role: ['Admin'] },
      ],
    },
    {
      id: 'movimentacoes',
      label: 'Movimentações',
      icon: <MovementIcon />,
      role: ['Admin', 'Operator'],
      children: [
        { id: 'new-entry', label: 'Nova Entrada', page: 'new-entry' as Page, role: ['Admin', 'Operator'] },
        { id: 'new-exit', label: 'Nova Saída', page: 'new-exit' as Page, role: ['Admin', 'Operator'] },
      ],
    },
    {
      id: 'controle',
      label: 'Controle',
      icon: <ControlIcon />,
      role: ['Admin'],
      children: [
        { id: 'users', label: 'Usuários', page: 'users' as Page, role: ['Admin'] },
        { id: 'suppliers', label: 'Fornecedores', page: 'suppliers' as Page, role: ['Admin'] },
        { id: 'backup', label: 'Backup & Restauração', page: 'backup' as Page, role: ['Admin'] },
      ],
    },
    {
        id: 'auditoria',
        label: 'Auditoria',
        icon: <AuditIcon />,
        role: ['Admin'],
        children: [
            { id: 'audit', label: 'Monitoramento', page: 'audit' as Page, role: ['Admin'] },
        ]
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: <ReportsIcon />,
      page: 'reports' as Page,
      role: ['Admin', 'Operator'],
    },
  ];

  useEffect(() => {
    const activeParent = navStructure.find(item => 
        item.children?.some(child => child.page === activePage)
    );
    if (activeParent) {
        setOpenMenu(activeParent.id);
    }
  }, [activePage]);

  const handleNavigation = (page: Page) => {
      setActivePage(page);
      setSidebarOpen(false);
  };
  
  const handleMenuToggle = (menuId: string) => {
    setOpenMenu(prevOpenMenu => (prevOpenMenu === menuId ? null : menuId));
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
    suppliers: 'Gerenciamento de Fornecedores',
    inventory: 'Inventário',
    backup: 'Backup e Restauração',
    audit: 'Log de Auditoria',
  };

  useEffect(() => {
    const title = pageTitles[activePage] || 'Dashboard';
    document.title = `${title} | Alumasa Controle do Almoxarifado`;
  }, [activePage]);
  
  // Global search logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setGlobalSearchTerm(term);
    if (term.trim() === '') {
      setSearchResults([]);
      return;
    }
    const filtered = items.filter(item =>
      item.code.toLowerCase().includes(term.toLowerCase()) ||
      item.description.toLowerCase().includes(term.toLowerCase())
    ).slice(0, 7); // Show top 7 results
    setSearchResults(filtered);
  };

  const handleResultClick = (item: Item) => {
    onGlobalSearch(item.code);
    setGlobalSearchTerm('');
    setSearchResults([]);
  };

  const handleBellClick = () => {
    onNavigateWithFilters({ status: 'low' });
  };

  const sidebarContent = (
    <>
      <div className="flex flex-col items-center justify-center p-4 border-b border-blue-900 text-center">
         <h1 className="text-2xl font-semibold text-white">Alumasa</h1>
         <span className="text-sm text-gray-300 mt-2">Controle do Almoxarifado</span>
      </div>
      <nav className="flex-1 p-2">
        <ul>
            {navStructure.map((group) => {
                const userHasAccessToGroup = group.children
                    ? group.children.some(child => (!child.role || child.role.includes(user.role)))
                    : (group.role && group.role.includes(user.role));

                if (!userHasAccessToGroup) {
                    return null;
                }

                if (!group.children) {
                    return (
                        <NavLink
                            key={group.id}
                            icon={group.icon}
                            label={group.label}
                            isActive={activePage === group.page}
                            onClick={() => handleNavigation(group.page!)}
                            disabled={isPasswordChangeForced}
                        />
                    );
                }

                const isGroupActive = group.children.some(child => child.page === activePage);
                const isMenuOpen = openMenu === group.id;

                return (
                    <li key={group.id} className="my-1 text-gray-300">
                        <div
                            className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                                isPasswordChangeForced
                                    ? 'text-gray-500 cursor-not-allowed'
                                    : isGroupActive
                                    ? 'bg-blue-800 text-white'
                                    : 'hover:bg-blue-800 hover:text-white'
                            }`}
                            onClick={!isPasswordChangeForced ? () => handleMenuToggle(group.id) : undefined}
                            role="button"
                        >
                            <div className="flex items-center">
                                {group.icon}
                                <span className="ml-4 font-medium">{group.label}</span>
                            </div>
                            <ChevronRightIcon className={`w-5 h-5 transition-transform ${isMenuOpen ? 'rotate-90' : ''}`} />
                        </div>
                        {isMenuOpen && (
                            <ul className="pl-6 pt-1 transition-all duration-300">
                                {group.children.map(child => {
                                    if (child.role && !child.role.includes(user.role)) {
                                        return null;
                                    }
                                    const isChildActive = activePage === child.page;
                                    return (
                                        <li
                                            key={child.id}
                                            className={`flex items-center p-2 my-1 rounded-md text-sm transition-colors ${
                                                isPasswordChangeForced
                                                    ? 'text-gray-500 cursor-not-allowed'
                                                    : isChildActive
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-400 hover:text-white cursor-pointer'
                                            }`}
                                            onClick={!isPasswordChangeForced ? () => handleNavigation(child.page) : undefined}
                                        >
                                            {child.label}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </li>
                );
            })}
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
        <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm gap-4">
          <div className="flex items-center">
            <button className="text-gray-600 md:hidden mr-4" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
            <h2 className="text-xl font-semibold text-gray-700 hidden sm:block">{pageTitles[activePage] || 'Dashboard'}</h2>
          </div>

          <div className="flex-1 flex justify-center px-2" ref={searchRef}>
            <div className="relative w-full max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="text-gray-400" />
              </div>
              <Input
                type="search"
                placeholder="Buscar item por código ou descrição..."
                className="pl-10"
                value={globalSearchTerm}
                onChange={handleSearchChange}
                disabled={isPasswordChangeForced}
              />
              {searchResults.length > 0 && (
                <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
                  {searchResults.map(item => (
                    <li
                      key={item.id}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleResultClick(item)}
                    >
                      <p className="font-semibold text-gray-800">{item.code}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                onClick={handleBellClick}
                className="text-gray-600 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full p-1"
                aria-label="Notificações de estoque baixo"
                disabled={isPasswordChangeForced}
              >
                  <BellIcon />
              </button>
              {lowStockCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white pointer-events-none">
                      {lowStockCount}
                  </span>
              )}
            </div>

            <span className="text-gray-600 hidden lg:inline">Bem-vindo, {user.name}</span>
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
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

        {/* Chat Widget */}
        {!isPasswordChangeForced && (
            <>
                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="fixed bottom-5 right-5 z-40 bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label={isChatOpen ? "Fechar assistente" : "Abrir assistente"}
                >
                    {isChatOpen ? <CloseIcon /> : <ChatIcon />}
                </button>
                <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
            </>
        )}

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