/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, UserCog, Trash2, ShieldAlert, Check, X, UserPlus, HelpCircle
} from 'lucide-react';
import { User, UserRole } from '@/types';

interface UserManagementProps {
  users: User[];
  currentRole: UserRole;
  onUpdateUserRole: (id: string, newRole: UserRole) => void;
  onDeleteUser: (id: string) => void;
}

export default function UserManagement({
  users,
  currentRole,
  onUpdateUserRole,
  onDeleteUser
}: UserManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempRole, setTempRole] = useState<UserRole>('Staff');

  if (currentRole !== 'Administrator') {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-8 max-w-lg mx-auto text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/30 rounded-full flex items-center justify-center text-red-500 mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Akses Terbatas: Administrator Only</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
            Maaf, halaman ini berisi konfigurasi sistem yang sangat sensitif. Hanya pengguna dengan role Administrator yang diizinkan untuk mengelola data akun pengguna.
          </p>
        </div>
      </div>
    );
  }

  const handleEditClick = (user: User) => {
    setEditingId(user.id || '');
    setTempRole(user.role);
  };

  const handleSaveRole = (userId: string) => {
    onUpdateUserRole(userId, tempRole);
    setEditingId(null);
  };

  return (
    <div className="space-y-6" id="user-management-workspace">
      {/* Visual Header Grid banner for user management stats */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-[#E5E7EB] dark:border-gray-800 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
            Modul Keamanan & Otorisasi
          </span>
          <h2 className="text-xl font-bold font-display text-gray-900 dark:text-white mt-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Kelola Pengguna Sistem
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
            Sebagai Administrator, Anda memegang kendali penuh atas akun dan wewenang (*role*) setiap anggota di dalam organisasi. Ubah peran atau nonaktifkan akun staf yang sudah tidak bekerja lagi.
          </p>
        </div>

        <div className="flex gap-4 border-l border-gray-100 dark:border-gray-800 pl-0 md:pl-6 w-full md:w-auto shrink-0">
          <div className="text-center bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg border border-[#E5E7EB] dark:border-gray-700 min-w-[100px]">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-semibold uppercase">Total Akun</span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{users.length} User</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-150 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-150 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2 font-display">
            <span>Daftar Direktori Pengguna</span>
          </h3>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-xs flex flex-col items-center justify-center gap-2">
            <HelpCircle className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto" />
            <p className="font-semibold text-gray-700 dark:text-gray-300">Tidak ada pengguna yang terdaftar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
                  <th className="px-6 py-4">Pengguna</th>
                  <th className="px-6 py-4">Kontak & Dept</th>
                  <th className="px-6 py-4">Peran (Role)</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">ID: {user.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.phone} • {user.department}</p>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === user.id ? (
                        <select
                          value={tempRole}
                          onChange={(e) => setTempRole(e.target.value as UserRole)}
                          className="w-full max-w-[150px] bg-white dark:bg-gray-800 border border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-300 text-xs rounded-lg p-1.5 focus:ring-2 focus:ring-indigo-500 font-semibold"
                        >
                          <option value="Administrator">Administrator</option>
                          <option value="Staff">Staff</option>
                          <option value="Supervisor">Supervisor</option>
                          <option value="Teknisi">Teknisi</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center font-bold px-2.5 py-1 rounded-full border text-[10px] uppercase tracking-wider
                          ${user.role === 'Administrator' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800' :
                            user.role === 'Supervisor' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' :
                            user.role === 'Teknisi' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' :
                            'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                          }
                        `}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === user.id ? (
                          <>
                            <button aria-label={`Simpan role untuk ${user.name}`} onClick={() => handleSaveRole(user.id!)} className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md transition border border-emerald-200 dark:border-emerald-800">
                              <Check className="w-4 h-4" />
                            </button>
                            <button aria-label="Batal ubah role" onClick={() => setEditingId(null)} className="p-1.5 bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded-md transition border border-gray-200 dark:border-gray-700">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEditClick(user)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold rounded border border-indigo-200 dark:border-indigo-800 transition">
                              <UserCog className="w-3.5 h-3.5" />
                              Ubah
                            </button>
                            <button aria-label={`Hapus pengguna ${user.name}`} onClick={() => { if (window.confirm(`Hapus '${user.name}'?`)) onDeleteUser(user.id!); }} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded border border-red-200 dark:border-red-900 transition">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
