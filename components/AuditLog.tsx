import React, { useState, useMemo, useEffect } from 'react';
import { AuditLog, User } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';

interface AuditLogProps {
    logs: AuditLog[];
    users: User[];
}

const AuditLog: React.FC<AuditLogProps> = ({ logs, users }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    
    const logUsers = useMemo(() => {
        const userIdsInLogs = new Set(logs.map(log => log.userId));
        return users.filter(user => userIdsInLogs.has(user.id));
    }, [logs, users]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const logDate = new Date(log.timestamp);
            const matchesStartDate = startDate ? logDate >= new Date(startDate) : true;
            const matchesEndDate = endDate ? logDate <= new Date(new Date(endDate).setHours(23, 59, 59, 999)) : true;
            const matchesUser = selectedUserId ? log.userId === selectedUserId : true;
            const matchesSearch = searchTerm ? log.action.toLowerCase().includes(searchTerm.toLowerCase()) || log.userName.toLowerCase().includes(searchTerm.toLowerCase()) : true;
            return matchesStartDate && matchesEndDate && matchesUser && matchesSearch;
        });
    }, [logs, startDate, endDate, selectedUserId, searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [startDate, endDate, selectedUserId, searchTerm]);

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredLogs, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    const PaginationButton: React.FC<{onClick: () => void; disabled: boolean; children: React.ReactNode}> = ({ onClick, disabled, children }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className="px-3 py-1 border rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            {children}
        </button>
    );

    const handleClearFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedUserId('');
        setSearchTerm('');
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Log de Auditoria</h1>

            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 border-b">
                    <Input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        aria-label="Data de início"
                    />
                    <Input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        aria-label="Data de fim"
                    />
                    <Select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                        <option value="">Todos Usuários</option>
                        {logUsers.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </Select>
                    <Input
                        placeholder="Buscar na ação..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Button onClick={handleClearFilters} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                        Limpar Filtros
                    </Button>
                </div>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                                    Data / Hora
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                                    Usuário
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                                    Ação
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedLogs.length > 0 ? (
                                paginatedLogs.map(log => (
                                    <tr key={log.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {log.userName}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {log.action}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="text-center py-8 text-gray-500">
                                        Nenhum registro de auditoria encontrado com os filtros selecionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 0 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <span className="text-sm text-gray-600">
                            Mostrando {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
                            {Math.min(currentPage * itemsPerPage, filteredLogs.length)} de {filteredLogs.length} registros
                        </span>
                        <div className="flex items-center space-x-2">
                            <PaginationButton onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                                Primeira
                            </PaginationButton>
                            <PaginationButton onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                                Anterior
                            </PaginationButton>
                            <span className="text-sm font-medium text-gray-700 px-2">Página {currentPage} de {totalPages}</span>
                            <PaginationButton onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                                Próxima
                            </PaginationButton>
                            <PaginationButton onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                                Última
                            </PaginationButton>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default AuditLog;