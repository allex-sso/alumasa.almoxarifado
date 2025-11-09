import React, { useState, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import StockList from './components/StockList';
import NewEntry from './components/NewEntry';
import NewExit from './components/NewExit';
import Reports from './components/Reports';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import ChangePasswordModal from './components/ChangePasswordModal';
import Inventory from './components/Inventory';
import BackupRestore from './components/BackupRestore';
import AuditLog from './components/AuditLog';
import { Page, Item, User, EntryExitRecord, AuditLog as AuditLogType } from './types';
import { mockUsers, mockItems, mockEntryExitHistory, mockAuditLogs } from './data/mock';

const App: React.FC = () => {
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [itemForEntry, setItemForEntry] = useState<Item | null>(null);
  const [itemForExit, setItemForExit] = useState<Item | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [items, setItems] = useState<Item[]>(mockItems);
  const [entryExitHistory, setEntryExitHistory] = useState<EntryExitRecord[]>(mockEntryExitHistory);
  const [auditLogs, setAuditLogs] = useState<AuditLogType[]>(mockAuditLogs);
  const [changePasswordUser, setChangePasswordUser] = useState<User | null>(null);
  const [initialStockSearch, setInitialStockSearch] = useState<string>('');
  
  const addAuditLog = (action: string, userOverride?: User) => {
    const user = userOverride || authenticatedUser;
    if (!user) return;
    const newLog: AuditLogType = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      action,
    };
    setAuditLogs(prevLogs => [newLog, ...prevLogs]);
  };


  const handleLogout = () => {
    addAuditLog('Fez logout do sistema.');
    setAuthenticatedUser(null);
    setCurrentPage('dashboard');
  };
  
  const handleUpdateProfilePicture = (newImageUrl: string) => {
    if (authenticatedUser) {
      const updatedUser = { ...authenticatedUser, profilePictureUrl: newImageUrl };
      setAuthenticatedUser(updatedUser);
      setUsers(prevUsers => prevUsers.map(u => u.id === authenticatedUser.id ? updatedUser : u));
    }
  };

  const handleUpdatePassword = (userId: string, newPassword: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    
    const wasForcedChange = userToUpdate.password === 'changeme';

    setUsers(prevUsers =>
      prevUsers.map(u => (u.id === userId ? { ...u, password: newPassword } : u))
    );
    
    if (authenticatedUser?.id === userId) {
      addAuditLog(`Alterou a própria senha.`);
      setAuthenticatedUser(prev => prev ? { ...prev, password: newPassword } : null);
    } else {
      addAuditLog(`Alterou a senha do usuário ${userToUpdate.name}.`);
    }
    
    if (wasForcedChange) {
      setAuthenticatedUser({ ...userToUpdate, password: newPassword });
    }

    setChangePasswordUser(null);
  };
  
  const handleLogin = (user: User) => {
    if (user.password === 'changeme') {
      setChangePasswordUser(user);
    } else {
      setAuthenticatedUser(user);
      addAuditLog('Fez login no sistema.', user);
    }
  };

  const onRequestChangePasswordForUser = (user: User) => {
    setChangePasswordUser(user);
  };
  
  const handleGlobalSearch = (term: string) => {
    setInitialStockSearch(term);
    setCurrentPage('stock');
  };


  const renderPage = useCallback(() => {
    if (!authenticatedUser) return null;

    // Enforce admin-only pages
    const adminPages: Page[] = ['users', 'inventory', 'audit', 'backup'];
    if (adminPages.includes(currentPage) && authenticatedUser.role !== 'Admin') {
        // Redirect non-admins trying to access admin pages to the dashboard
        return <Dashboard items={items} history={entryExitHistory} setCurrentPage={setCurrentPage} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard items={items} history={entryExitHistory} setCurrentPage={setCurrentPage} />;
      case 'stock':
        return <StockList 
                    items={items} 
                    setItems={setItems} 
                    setActivePage={setCurrentPage} 
                    setItemForEntry={setItemForEntry} 
                    setItemForExit={setItemForExit} 
                    history={entryExitHistory} 
                    initialSearchTerm={initialStockSearch}
                    clearInitialSearch={() => setInitialStockSearch('')}
                    addAuditLog={addAuditLog}
                />;
      case 'new-entry':
        return <NewEntry items={items} setItems={setItems} itemForEntry={itemForEntry} clearItemForEntry={() => setItemForEntry(null)} addAuditLog={addAuditLog} />;
      case 'new-exit':
        return <NewExit items={items} setItems={setItems} itemForExit={itemForExit} clearItemForExit={() => setItemForExit(null)} addAuditLog={addAuditLog} />;
      case 'reports':
        return <Reports items={items} history={entryExitHistory} />;
      case 'users':
        return <UserManagement 
                    users={users} 
                    setUsers={setUsers} 
                    onChangePassword={onRequestChangePasswordForUser}
                    addAuditLog={addAuditLog}
                />;
      case 'inventory':
          return <Inventory items={items} setItems={setItems} addAuditLog={addAuditLog} />;
      case 'audit':
          return <AuditLog logs={auditLogs} users={users} />;
      case 'backup':
          return <BackupRestore 
                    items={items}
                    users={users}
                    history={entryExitHistory}
                    setItems={setItems}
                    setUsers={setUsers}
                    setHistory={setEntryExitHistory}
                    addAuditLog={addAuditLog}
                  />;
      default:
        return <Dashboard items={items} history={entryExitHistory} setCurrentPage={setCurrentPage} />;
    }
  }, [currentPage, itemForEntry, itemForExit, authenticatedUser, users, items, entryExitHistory, auditLogs, initialStockSearch]);

  if (!authenticatedUser && !changePasswordUser) {
    return <Login onLogin={handleLogin} users={users} />;
  }

  const getModalTitle = () => {
    if (!changePasswordUser) return '';
    if (changePasswordUser.password === 'changeme') {
      return 'Crie uma Nova Senha';
    }
    if (authenticatedUser && authenticatedUser.id !== changePasswordUser.id) {
      return `Alterar Senha de ${changePasswordUser.name}`;
    }
    return 'Alterar Senha';
  };

  return (
    <>
      <Layout 
        user={authenticatedUser || changePasswordUser!} // Provide a user object to layout even during forced change
        onLogout={handleLogout}
        activePage={currentPage} 
        setActivePage={setCurrentPage}
        onUpdateProfilePicture={handleUpdateProfilePicture}
        isPasswordChangeForced={!!changePasswordUser && changePasswordUser.password === 'changeme'}
        items={items}
        onGlobalSearch={handleGlobalSearch}
      >
        {renderPage()}
      </Layout>
      
      {changePasswordUser && (
        <ChangePasswordModal
          isOpen={!!changePasswordUser}
          onClose={() => {
            // Only allow closing if it's not a forced change
            if (changePasswordUser.password !== 'changeme') {
              setChangePasswordUser(null);
            }
          }}
          onSave={(newPassword) => handleUpdatePassword(changePasswordUser.id, newPassword)}
          title={getModalTitle()}
          isForced={changePasswordUser.password === 'changeme'}
          allowDefaultPassword={
            authenticatedUser?.role === 'Admin' && 
            authenticatedUser.id !== changePasswordUser.id
          }
        />
      )}
    </>
  );
};

export default App;