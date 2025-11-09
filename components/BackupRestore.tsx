import React, { useState, useRef } from 'react';
import { Item, User, EntryExitRecord } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Toast from './ui/Toast';
import { UploadIcon, ExportIcon } from './icons/Icons';

interface BackupRestoreProps {
    items: Item[];
    users: User[];
    history: EntryExitRecord[];
    setItems: React.Dispatch<React.SetStateAction<Item[]>>;
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    setHistory: React.Dispatch<React.SetStateAction<EntryExitRecord[]>>;
}

const BackupRestore: React.FC<BackupRestoreProps> = ({ items, users, history, setItems, setUsers, setHistory }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCreateBackup = () => {
        try {
            const backupData = {
                items,
                users,
                history,
                backupDate: new Date().toISOString(),
            };
            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            a.href = url;
            a.download = `alumasa_backup_${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setToast({ message: 'Arquivo de backup gerado com sucesso!', type: 'success' });
        } catch (error) {
            setToast({ message: 'Ocorreu um erro ao gerar o backup.', type: 'error' });
            console.error("Backup failed:", error);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'application/json') {
            setSelectedFile(file);
            setToast(null);
        } else {
            setSelectedFile(null);
            setToast({ message: 'Por favor, selecione um arquivo .json válido.', type: 'error' });
        }
    };
    
    const triggerFileSelect = () => fileInputRef.current?.click();

    const handleRestoreBackup = () => {
        if (!selectedFile) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error('Falha ao ler o arquivo.');
                
                const data = JSON.parse(text);

                // Basic validation
                if (!data.items || !data.users || !data.history || !Array.isArray(data.items) || !Array.isArray(data.users) || !Array.isArray(data.history)) {
                    throw new Error('Arquivo de backup inválido ou corrompido. A estrutura esperada não foi encontrada.');
                }
                
                // Restore state
                setItems(data.items);
                setUsers(data.users);
                setHistory(data.history);

                setToast({ message: 'Sistema restaurado com sucesso a partir do backup!', type: 'success' });
            } catch (error: any) {
                console.error("Restore failed:", error);
                setToast({ message: `Erro ao restaurar backup: ${error.message}`, type: 'error' });
            } finally {
                setIsConfirmModalOpen(false);
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.onerror = () => {
             setToast({ message: `Erro de leitura do arquivo.`, type: 'error' });
             setIsConfirmModalOpen(false);
        }
        reader.readAsText(selectedFile);
    };

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <h1 className="text-3xl font-bold text-gray-800">Backup e Restauração</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Criar Backup do Sistema</h3>
                        <p className="text-gray-600 mb-4">
                            Crie um arquivo de backup com todos os dados atuais do sistema, incluindo itens, usuários e histórico de movimentações. Guarde este arquivo em um local seguro.
                        </p>
                        <Button onClick={handleCreateBackup}>
                            <ExportIcon />
                            Criar e Baixar Backup
                        </Button>
                    </div>
                </Card>

                <Card>
                     <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Restaurar a partir de um Backup</h3>
                         <div className="p-4 mb-4 bg-red-50 border-l-4 border-red-400">
                             <p className="font-bold text-red-800">Atenção!</p>
                            <p className="text-sm text-red-700">
                                Restaurar um backup substituirá <strong>TODOS</strong> os dados atuais do sistema pelos dados do arquivo. Esta ação não pode ser desfeita.
                            </p>
                        </div>
                        <div className="mt-4">
                             <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".json"
                                className="hidden"
                            />
                            <Button onClick={triggerFileSelect} className="bg-gray-600 hover:bg-gray-700">
                                <UploadIcon/>
                                Selecionar Arquivo de Backup
                            </Button>
                            {selectedFile && (
                                <p className="mt-2 text-sm text-gray-600">Arquivo selecionado: <span className="font-medium">{selectedFile.name}</span></p>
                            )}
                        </div>
                        <div className="mt-4">
                            <Button onClick={() => setIsConfirmModalOpen(true)} disabled={!selectedFile}>
                                Restaurar Backup
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
            
             <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirmar Restauração">
                 <div className="space-y-4">
                    <p className="text-lg">
                        Você está prestes a restaurar o sistema usando o arquivo <strong className="font-mono">{selectedFile?.name}</strong>.
                    </p>
                    <p className="text-red-600 font-semibold">
                       Todos os dados atuais serão perdidos e substituídos pelos dados do backup.
                    </p>
                    <p>
                        Tem certeza absoluta que deseja continuar?
                    </p>
                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <Button onClick={() => setIsConfirmModalOpen(false)} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                            Cancelar
                        </Button>
                        <Button onClick={handleRestoreBackup} className="bg-red-600 hover:bg-red-700">
                            Sim, Restaurar Sistema
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default BackupRestore;
