"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  HandHelping,
  UserPlus,
  Calendar,
  FileText,
  Send,
  Search,
  Clock,
  Loader2,
  AlertCircle,
  Check,
  X,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';
import axiosInstance from '@/lib/axios';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PageHeaderCard from '@/components/ui/PageHeaderCard';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import TextModal from '@/components/ui/TextModal';

import { useBorrowingsData } from './hooks/useBorrowingsData';

interface Asset {
  id: string;
  name: string;
  category: string;
  status: string;
  location: string;
  has_pending_deletion?: boolean;
}

interface Borrowing {
  id: string;
  user_id: string;
  borrower_name: string;
  asset_id: string;
  asset_name: string;
  start_date: string;
  end_date: string;
  purpose: string;
  status: string;
  rejection_reason: string;
  created_at: string;
}

function parseJwt(token: string | null) {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

export default function BorrowingsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [adminTab, setAdminTab] = useState<'pending' | 'active' | 'archived'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [selectedTextTitle, setSelectedTextTitle] = useState('');
  const [selectedTextContent, setSelectedTextContent] = useState('');

  const {
    borrowings,
    totalPages,
    totalBorrowings,
    isLoadingBorrowings,
    fetchError,
    fetchBorrowings
  } = useBorrowingsData({
    currentPage,
    debouncedSearch,
    adminTab,
    userRole,
    ITEMS_PER_PAGE
  });

  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [assetSearchText, setAssetSearchText] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const [formData, setFormData] = useState<{
    asset_ids: string[];
    start_date: string;
    end_date: string;
    purpose: string;
  }>({
    asset_ids: [],
    start_date: '',
    end_date: '',
    purpose: ''
  });

  // ── Debounce search ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Fetch available assets for the form dropdown ──
  const fetchAssets = useCallback(async () => {
    setIsLoadingAssets(true);
    try {
      const res = await axiosInstance.get('/assets?limit=1000');
      const all: Asset[] = res.data?.data || [];
      setAssets(all.filter(a => a.status === 'Tersedia'));
    } catch (err: any) {
      console.error('[fetchAssets]', err);
    } finally {
      setIsLoadingAssets(false);
    }
  }, []);

  useEffect(() => {
    // Read role from cookie-stored user (set by Login component)
    try {
      const Cookies = require('js-cookie');
      const rawUser = Cookies.get('saims_user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed?.role) setUserRole(parsed.role);
        if (parsed?.name) setUserName(parsed.name);
      }
    } catch {
      // fallback: parse from token in localStorage
      const token = localStorage.getItem('saims_token');
      const decoded = parseJwt(token);
      if (decoded?.role) setUserRole(decoded.role);
      if (decoded?.name) setUserName(decoded.name);
    }
    fetchAssets();
  }, [fetchAssets]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (formData.asset_ids.length === 0 || !formData.start_date || !formData.end_date || !formData.purpose) {
      setFormError('Semua field wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post('/borrowings', formData);
      setSuccessMsg('Pengajuan berhasil dikirim! Menunggu persetujuan Supervisor.');
      setFormData({ asset_ids: [], start_date: '', end_date: '', purpose: '' });
      setAssetSearchText('');
      setIsFormModalOpen(false);
      await Promise.all([fetchBorrowings(), fetchAssets()]);
    } catch (err: any) {
      setFormError(err?.response?.data?.error || err.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    let body: any = { status: newStatus };
    if (newStatus === 'Rejected' || newStatus === 'Return_Rejected') {
      const reason = prompt('Masukkan alasan penolakan:');
      if (reason === null) return;
      body.rejection_reason = reason;
    }

    try {
      await axiosInstance.put(`/borrowings/${id}/status`, body);
      await Promise.all([fetchBorrowings(), fetchAssets()]);
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'Gagal mengubah status');
    }
  };



  // ── Stats are now derived from totalBorrowings (server count for current filter) ──
  // For tab counts, we use totalBorrowings which reflects the backend count for the active tab/filter.

  return (
    <ProtectedRoute allowedRoles={['Administrator', 'Supervisor', 'Staff']}>
      <div className="space-y-6" id="borrow-workspace">

        {/* ── Header Stats ── */}
        <PageHeaderCard
          moduleBadge="Modul Logistik"
          title="Peminjaman & Penggunaan Aset"
          description="Staff dapat mengajukan peminjaman aset kantor. Supervisor & Administrator melakukan peninjauan (approval)."
          icon={HandHelping}
          iconColorClass="text-emerald-600"
          rightContent={
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="text-center bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-lg border border-[#E5E7EB] dark:border-gray-700 min-w-[100px] w-full sm:w-auto">
                <span className="text-[10px] text-gray-400 block font-semibold uppercase">Data Saat Ini</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{totalBorrowings} Record</span>
              </div>
              <Button onClick={() => setIsFormModalOpen(true)} className="w-full sm:w-auto py-3.5 shadow-xs" leftIcon={<HandHelping className="w-4 h-4" />}>
                Ajukan Peminjaman
              </Button>
            </div>
          }
        />

          {/* ── Right: Table ── */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-150 dark:border-gray-800 shadow-xs space-y-4"
          >
            {userRole === 'Administrator' ? (
              <div className="flex flex-col 2xl:flex-row items-start 2xl:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3 w-full">
                <Tabs
                  activeTab={adminTab}
                  onChange={(id) => { setAdminTab(id as any); setCurrentPage(1); }}
                  tabs={[
                    { id: 'pending', label: 'Menunggu Review', count: adminTab === 'pending' ? totalBorrowings : undefined },
                    { id: 'active', label: 'Dipakai', count: adminTab === 'active' ? totalBorrowings : undefined },
                    { id: 'archived', label: 'Arsip & Riwayat', count: adminTab === 'archived' ? totalBorrowings : undefined },
                  ]}
                  className="w-full sm:w-auto"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      placeholder="Cari disini..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs pl-8 pr-2 py-1.5 outline-hidden dark:text-white"
                      type="text"
                    />
                  </div>
                  <button
                    onClick={() => fetchBorrowings()}
                    disabled={isLoadingBorrowings}
                    title="Refresh data"
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBorrowings ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col 2xl:flex-row items-start 2xl:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3 w-full">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Riwayat Peminjaman
                  <span className="ml-2 text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                    {totalBorrowings} record
                  </span>
                </h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      placeholder="Cari peminjam / aset..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs pl-8 pr-2 py-1.5 outline-hidden dark:text-white"
                      type="text"
                    />
                  </div>
                  <button
                    onClick={() => fetchBorrowings()}
                    disabled={isLoadingBorrowings}
                    title="Refresh data"
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBorrowings ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Error banner */}
            {fetchError && (
              <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400">Gagal memuat data</p>
                  <p className="text-[11px] text-red-500 mt-0.5">{fetchError}</p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-550 dark:text-gray-400 min-w-full">
                <thead className="text-[10px] uppercase font-bold text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="p-3">ID Form</th>
                    <th className="p-3">Nama Peminjam</th>
                    <th className="p-3">Nama Aset</th>
                    <th className="p-3">Durasi</th>
                    <th className="p-3">Status</th>
                    {adminTab !== 'archived' && <th className="p-3">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {isLoadingBorrowings && (
                    <tr>
                      <td colSpan={adminTab === 'archived' ? 5 : 6} className="p-6 text-center">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                      </td>
                    </tr>
                  )}
                  {!isLoadingBorrowings && !fetchError && borrowings.length === 0 && (
                    <tr>
                      <td colSpan={adminTab === 'archived' ? 5 : 6} className="p-6 text-center text-gray-400 text-xs">
                        {searchQuery ? 'Tidak ada data yang cocok.' : 'Belum ada data peminjaman.'}
                      </td>
                    </tr>
                  )}
                  {!isLoadingBorrowings && borrowings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                      <td className="p-3 font-mono font-bold text-gray-700 dark:text-gray-300 break-all max-w-[180px]">
                        {b.id}
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{b.borrower_name}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{b.asset_name}</p>
                        <p className="text-[9.5px] text-gray-400 font-mono">ID: {b.asset_id}</p>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-gray-700 dark:text-gray-300 flex flex-wrap gap-1">
                          <span>{b.start_date}</span>
                          <span>&rarr;</span>
                          <span>{b.end_date}</span>
                        </span>
                        <span 
                          className="text-[9px] text-gray-400 block italic truncate max-w-[140px] cursor-pointer hover:text-indigo-500 transition-colors"
                          onClick={() => {
                            if (b.purpose) {
                              setSelectedTextTitle('Keperluan Peminjaman');
                              setSelectedTextContent(b.purpose);
                              setIsTextModalOpen(true);
                            }
                          }}
                        >
                          {b.purpose}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded border ${
                          b.status === 'Approved'
                            ? 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800'
                            : b.status === 'Rejected' || b.status === 'Return_Rejected'
                            ? 'text-red-600 bg-red-50 border-red-100 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800'
                            : b.status === 'Menunggu_Kembali'
                            ? 'text-purple-600 bg-purple-50 border-purple-100 dark:text-purple-400 dark:bg-purple-900/20 dark:border-purple-800'
                            : b.status === 'Selesai'
                            ? 'text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800'
                            : 'text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {b.status === 'Pending_Supervisor' ? 'Pending' : b.status === 'Return_Rejected' ? 'Pengembalian Ditolak' : b.status.replace('_', ' ')}
                        </span>
                        {b.rejection_reason && (
                          <div 
                            className="text-[10px] text-red-500 mt-1 dark:text-red-400 font-medium max-w-[150px] line-clamp-2 cursor-pointer hover:text-red-700 dark:hover:text-red-300 transition-colors"
                            onClick={() => {
                              setSelectedTextTitle('Keterangan Penolakan');
                              setSelectedTextContent(b.rejection_reason);
                              setIsTextModalOpen(true);
                            }}
                          >
                            Keterangan: "{b.rejection_reason}"
                          </div>
                        )}
                      </td>
                      {adminTab !== 'archived' && (
                        <td className="p-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {(userRole === 'Supervisor' || userRole === 'Administrator') && b.status === 'Pending_Supervisor' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleUpdateStatus(b.id, 'Approved')}
                                  className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200"
                                  title="Setujui"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleUpdateStatus(b.id, 'Rejected')}
                                  className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200"
                                  title="Tolak"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {(userRole === 'Supervisor' || userRole === 'Administrator') && b.status === 'Menunggu_Kembali' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleUpdateStatus(b.id, 'Selesai')}
                                  className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200"
                                  title="Terima Pengembalian"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleUpdateStatus(b.id, 'Return_Rejected')}
                                  className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200"
                                  title="Tolak Pengembalian"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {(b.status === 'Approved' || b.status === 'Return_Rejected') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdateStatus(b.id, 'Menunggu_Kembali')}
                                className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 font-semibold h-7 px-2.5 text-[10px]"
                                title="Kembalikan Aset"
                              >
                                Kembalikan Aset
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Pagination Controls ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                <span className="text-[11px] text-gray-400">
                  Halaman {currentPage} dari {totalPages} ({totalBorrowings} data)
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </motion.div>

      </div>
      
      <TextModal
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        title={selectedTextTitle}
        content={selectedTextContent}
      />

      {/* ── Form Pengajuan Modal ── */}
      {isFormModalOpen && (
        <div className="fixed inset-0 h-dvh w-dvw z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-xl shadow-gray-900/10 dark:shadow-black/50 border border-gray-100 dark:border-gray-800/60 flex flex-col max-h-[90dvh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <HandHelping className="w-4 h-4" />
                </div>
                Form Pengajuan Peminjaman
              </h2>
              <button onClick={() => setIsFormModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-5">

              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs p-2 rounded flex items-center gap-2 mb-4">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {formError}
                </div>
              )}
              {successMsg && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs p-2 rounded flex items-center gap-2 mb-4">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase">Nama Peminjam *</label>
                  <div className="relative">
                    <UserPlus className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                    <input
                      readOnly
                      className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg pl-8 p-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      type="text"
                      value={userName || "Menggunakan akun saat ini"}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase">Cari & Pilih Aset Kantor *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={assetSearchText}
                      onChange={(e) => {
                        setAssetSearchText(e.target.value);
                        setIsAssetDropdownOpen(true);
                      }}
                      onFocus={() => setIsAssetDropdownOpen(true)}
                      onBlur={() => setIsAssetDropdownOpen(false)}
                      placeholder="Ketik nama, ID, atau lokasi aset..."
                      className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-lg p-2.5 pr-8 outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                    {assetSearchText && !isLoadingAssets && (
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setAssetSearchText('');
                          setIsAssetDropdownOpen(true);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isAssetDropdownOpen && (
                      <ul 
                        onMouseDown={(e) => e.preventDefault()}
                        className="absolute z-20 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl"
                      >
                        {assets.filter(a => `(${a.id}) ${a.name} ${a.location}`.toLowerCase().includes(assetSearchText.toLowerCase()) && !formData.asset_ids.includes(a.id)).length === 0 ? (
                          <li className="p-3 text-xs text-gray-500 dark:text-gray-400 text-center">Aset tidak ditemukan / sudah dipilih</li>
                        ) : (
                          assets
                            .filter(a => `(${a.id}) ${a.name} ${a.location}`.toLowerCase().includes(assetSearchText.toLowerCase()) && !formData.asset_ids.includes(a.id))
                            .map(asset => (
                              <li
                                key={asset.id}
                                onClick={() => {
                                  if (asset.has_pending_deletion) {
                                    setFormError(`Aset "${asset.name}" sedang dalam pengajuan penghapusan dan tidak dapat dipinjam.`);
                                    return;
                                  }
                                  setFormData(prev => ({ ...prev, asset_ids: [...prev.asset_ids, asset.id] }));
                                  setAssetSearchText('');
                                  setIsAssetDropdownOpen(false);
                                }}
                                className={`p-2.5 text-xs border-b border-gray-50 dark:border-gray-700/50 last:border-0 transition-colors ${
                                  asset.has_pending_deletion 
                                    ? 'bg-amber-50/50 dark:bg-amber-950/20 text-gray-400 dark:text-gray-500 cursor-not-allowed hover:bg-amber-100/50 dark:hover:bg-amber-900/30' 
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <span className={`font-bold flex items-center gap-1.5 ${asset.has_pending_deletion ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                                    {asset.name}
                                    {asset.has_pending_deletion && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 no-underline">
                                        Dalam Pengajuan Hapus
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-mono">{asset.id}</span>
                                </div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                  <span>{asset.location}</span>
                                  <span>•</span>
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{asset.category}</span>
                                </div>
                              </li>
                            ))
                        )}
                      </ul>
                    )}
                    {isLoadingAssets && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                  {/* Selected Assets Pill/Tags */}
                  {formData.asset_ids.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.asset_ids.map(id => {
                        const ast = assets.find(a => a.id === id);
                        return (
                          <div key={id} className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] px-2 py-1.5 rounded-md font-semibold border border-emerald-200 dark:border-emerald-800/50">
                            <span>{ast?.name || id}</span>
                            <button 
                              type="button" 
                              onClick={() => setFormData(prev => ({ ...prev, asset_ids: prev.asset_ids.filter(aId => aId !== id) }))}
                              className="hover:text-emerald-900 dark:hover:text-emerald-200 ml-1 bg-emerald-200/50 dark:bg-emerald-800/50 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {assets.length === 0 && !isLoadingAssets && (
                    <p className="text-[10px] text-amber-500 dark:text-amber-400 mt-1">Tidak ada aset tersedia saat ini.</p>
                  )}
                  {formData.asset_ids.length === 0 && assetSearchText !== '' && !isAssetDropdownOpen && (
                    <p className="text-[10px] text-red-500 mt-1">Silakan pilih aset dari daftar yang muncul.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Mulai Pinjam
                    </label>
                    <input
                      required
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs text-gray-800 dark:text-gray-200"
                      type="date"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Selesai Pinjam
                    </label>
                    <input
                      required
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      min={formData.start_date || new Date().toISOString().split('T')[0]}
                      className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs text-gray-800 dark:text-gray-200"
                      type="date"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Alasan / Keperluan
                  </label>
                  <textarea
                    required
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Contoh: Digunakan untuk presentasi klien..."
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs text-gray-800 dark:text-gray-200"
                  ></textarea>
                </div>

                <Button
                  type="submit"
                  disabled={assets.length === 0}
                  isLoading={isSubmitting}
                  className="w-full shadow-xs"
                  leftIcon={!isSubmitting && <Send className="w-4 h-4" />}
                >
                  {isSubmitting ? "Memproses..." : "Sampaikan Pengajuan"}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </ProtectedRoute>
  );
}
