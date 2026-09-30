"use client";

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { userService } from '@/services/user.service';
import { User } from '@/types';
import { Users as UsersIcon, Search, UserCog, Trash2, X, Check } from 'lucide-react';
import ConfirmModal, { ConfirmModalType } from '@/components/ui/ConfirmModal';
import PageHeaderCard from '@/components/ui/PageHeaderCard';
import { motion } from 'framer-motion';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRole, setEditingRole] = useState<string | null>(null);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ConfirmModalType;
    onConfirm?: () => void;
    hideCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await userService.updateUserRole(userId, newRole);
      setEditingRole(null);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error("Failed to update role", error);
      setModalConfig({
        isOpen: true,
        title: 'Gagal Memperbarui',
        message: 'Gagal memperbarui role pengguna.',
        type: 'danger',
        hideCancel: true,
        onConfirm: closeModal
      });
    }
  };

  const handleDelete = async (userId: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Hapus Pengguna',
      message: 'Apakah Anda yakin ingin menghapus akun ini? Tindakan ini tidak dapat dibatalkan.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await userService.deleteUser(userId);
          fetchUsers();
        } catch (error) {
          console.error("Failed to delete user", error);
          setTimeout(() => {
            setModalConfig({
              isOpen: true,
              title: 'Gagal Menghapus',
              message: 'Gagal menghapus pengguna.',
              type: 'danger',
              hideCancel: true,
              onConfirm: closeModal
            });
          }, 300);
        }
      }
    });
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleStyle = (role: string) => {
    switch(role) {
      case 'Administrator': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Supervisor': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Teknisi': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200'; // Staff
    }
  };

  return (
    <ProtectedRoute allowedRoles={['Administrator']}>
      <div className="space-y-6 dark:text-gray-100">
        
        <PageHeaderCard
          moduleBadge="Modul Sistem"
          badgeColorClass="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
          title="Manajemen Pengguna"
          description="Kelola data pengguna, akses sistem, dan hak akses (Role)."
          icon={UsersIcon}
          iconColorClass="text-blue-600"
          rightContent={
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs transition-all duration-200 shadow-sm"
                placeholder="Cari nama atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          }
        />

        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800/50">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2 font-display">
              <span>Daftar Direktori Pengguna</span>
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-600 dark:text-gray-400 min-w-[600px]">
              <thead className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="p-3">Info Akun</th>
                  <th className="p-3">Kontak & Departemen</th>
                  <th className="p-3">Role Saat Ini</th>
                  <th className="p-3 text-right">Opsi Administrator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center">
                      <div className="flex justify-center items-center">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-500">
                      Tidak ada pengguna yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition">
                      <td className="p-3">
                        <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{user.name}</p>
                        <p className="font-mono text-[9px] text-gray-400 dark:text-gray-500">ID: {user.id.substring(0, 8).toUpperCase()}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-gray-700 dark:text-gray-300">{user.email}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {user.phone || '-'} <span className="mx-1">•</span> {user.department || '-'}
                        </p>
                      </td>
                      <td className="p-3">
                        {editingRole === user.id ? (
                          <div className="flex items-center gap-1.5">
                            <select 
                              className="text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded p-1 [&>option]:bg-white dark:[&>option]:bg-gray-800"
                              defaultValue={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              autoFocus
                            >
                              <option value="Administrator">Administrator</option>
                              <option value="Staff">Staff</option>
                              <option value="Supervisor">Supervisor</option>
                              <option value="Teknisi">Teknisi</option>
                            </select>
                            <button onClick={() => setEditingRole(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center font-bold px-2.5 py-1 rounded-full border text-[10px] uppercase tracking-wider ${getRoleStyle(user.role)}`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingRole(user.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold rounded border border-indigo-200 dark:border-indigo-800/50 transition"
                          >
                            <UserCog className="w-3.5 h-3.5" />
                            Ubah Role
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id)}
                            className="p-1.5 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded border border-red-200 dark:border-red-800/50 transition" 
                            title="Hapus Akun"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
      
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        hideCancel={modalConfig.hideCancel}
        confirmText={modalConfig.type === 'danger' && !modalConfig.hideCancel ? 'Hapus' : 'Oke'}
      />
    </ProtectedRoute>
  );
}
