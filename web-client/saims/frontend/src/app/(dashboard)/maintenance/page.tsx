'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MaintenanceRecord, User } from '@/types';
import { maintenanceService } from '@/services/maintenance.service';
import { Plus, User as UserIcon, Calendar, DollarSign, CircleCheck, Play, Wrench, Edit3, Loader2, Check, Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import MaintenanceFormModal from '@/components/maintenance/MaintenanceFormModal';
import CompleteMaintenanceModal from '@/components/maintenance/CompleteMaintenanceModal';
import PageHeaderCard from '@/components/ui/PageHeaderCard';
import TextModal from '@/components/ui/TextModal';
import { motion } from 'framer-motion';

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '-';
  if (dateString.length <= 10) return dateString + ' 00:00';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getScheduleStatusBadge = (scheduledDate?: string, completedDate?: string) => {
  if (!scheduledDate || !completedDate) return null;
  const sched = scheduledDate.substring(0, 10);
  const comp = completedDate.substring(0, 10);

  if (comp < sched) {
    return <span className="text-[9px] bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-bold border border-purple-200 dark:border-purple-800">Lebih Awal</span>;
  } else if (comp > sched) {
    return <span className="text-[9px] bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-200 dark:border-amber-800">Terlambat</span>;
  } else {
    return <span className="text-[9px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold border border-emerald-200 dark:border-emerald-800">Tepat Waktu</span>;
  }
};

export default function MaintenancePage() {
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<MaintenanceRecord | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [completeModalRecord, setCompleteModalRecord] = useState<MaintenanceRecord | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedNoteRecord, setSelectedNoteRecord] = useState<MaintenanceRecord | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('Semua');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('Semua');
  const [statusSubFilter, setStatusSubFilter] = useState('Semua');
  const [sortBy, setSortBy] = useState('default');

  const fetchMaintenances = useCallback(async () => {
    try {
      setIsLoading(true);
      let statusFilter = activeTab === 'active' ? 'active' : 'history';
      if (activeTab === 'active' && statusSubFilter !== 'Semua') {
        statusFilter = statusSubFilter;
      }

      let sortByParam: string | undefined;
      let sortOrderParam: string | undefined;
      if (sortBy === 'completed_date_desc') {
        sortByParam = 'completed_date';
        sortOrderParam = 'DESC';
      } else if (sortBy === 'completed_date_asc') {
        sortByParam = 'completed_date';
        sortOrderParam = 'ASC';
      } else if (sortBy === 'created_at_desc') {
        sortByParam = 'created_at';
        sortOrderParam = 'DESC';
      } else if (sortBy === 'created_at_asc') {
        sortByParam = 'created_at';
        sortOrderParam = 'ASC';
      }

      const response = await maintenanceService.getMaintenances({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        status: statusFilter,
        search: searchQuery || undefined,
        type: typeFilter !== 'Semua' ? typeFilter : undefined,
        payment_status: activeTab === 'history' && paymentStatusFilter !== 'Semua' ? paymentStatusFilter : undefined,
        sort_by: sortByParam,
        sort_order: sortOrderParam,
      });
      setMaintenances(response.data || []);
      setTotalPages(response.total_pages || 1);
      setTotalRecords(response.total || 0);
    } catch (error) {
      console.error("Failed to fetch maintenance records", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, currentPage, searchQuery, typeFilter, paymentStatusFilter, statusSubFilter, sortBy]);

  useEffect(() => {
    fetchMaintenances();
  }, [fetchMaintenances]);

  useEffect(() => {
    const savedUser = localStorage.getItem('saims_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to parse user data", error);
      }
    }
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setActionLoading(id);
      await maintenanceService.updateStatus(id, { status: newStatus });
      fetchMaintenances();
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Gagal mengupdate status maintenance');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteMaintenance = async (cost: number, notes: string, assetCondition: string) => {
    if (!completeModalRecord) return;

    try {
      setActionLoading(completeModalRecord.id);
      await maintenanceService.updateStatus(completeModalRecord.id, {
        status: 'Selesai',
        asset_condition: assetCondition,
        actual_cost: cost,
        notes
      });
      setIsCompleteModalOpen(false);
      setCompleteModalRecord(null);
      fetchMaintenances();
    } catch (err) {
      console.error('Failed to complete maintenance', err);
      alert('Gagal menyelesaikan maintenance');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkConfirmPayment = async () => {
    if (selectedRecords.length === 0) return;

    // Validasi awal di frontend sesuai rule SAIMS: Teknisi harus sama
    const selectedMaintenances = maintenances.filter(m => selectedRecords.includes(m.id));
    if (selectedMaintenances.length > 0) {
      const firstTechId = selectedMaintenances[0].technician_id;
      const hasDifferentTech = selectedMaintenances.some(m => m.technician_id !== firstTechId);
      
      if (hasDifferentTech) {
        alert("Gagal: Seluruh data yang dipilih harus berasal dari teknisi yang sama");
        return;
      }
    }

    try {
      setIsConfirmingPayment(true);
      await maintenanceService.confirmPayment(selectedRecords);
      alert('Pembayaran berhasil dikonfirmasi dan invoice telah di-generate.');
      setSelectedRecords([]);
      fetchMaintenances();
    } catch (err: any) {
      console.error('Failed to confirm payment', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Gagal mengkonfirmasi pembayaran.';
      alert('Gagal: ' + errorMsg);
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sedang Berjalan':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
      case 'Dijadwalkan':
        return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800/50 animate-pulse';
      case 'Selesai':
        return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
      default:
        return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <>
      <div className="space-y-5" id="maintenance-workspace">
        <PageHeaderCard
          moduleBadge="Modul Operasional"
          badgeColorClass="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
          title="Pengelolaan Maintenance Aset"
          description="Kelola tiket perbaikan, pemeliharaan rutin, dan kalibrasi alat dengan mudah."
          icon={Wrench}
          iconColorClass="text-indigo-600"
          rightContent={
            <>
              <div className="hidden sm:block text-center bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-100 dark:border-gray-700 min-w-[100px]">
                <span className="text-[10px] text-gray-400 block font-semibold uppercase">Tiket {activeTab === 'active' ? 'Berjalan' : 'Riwayat'}</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{totalRecords} Tiket</span>
              </div>
              {(currentUser?.role === 'Administrator' || currentUser?.role === 'Teknisi') && (
                <button
                  onClick={() => {
                    setEditRecord(null);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-3 sm:py-2 text-xs font-bold bg-gray-900 dark:bg-white border border-gray-950 dark:border-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-lg transition-all shadow-xs cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" />
                  Jadwalkan Maintenance Baru
                </button>
              )}
              {activeTab === 'history' && currentUser?.role === 'Administrator' && selectedRecords.length > 0 && (
                <button
                  onClick={handleBulkConfirmPayment}
                  disabled={isConfirmingPayment}
                  className="flex items-center gap-1.5 px-4 py-3 sm:py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-xs w-full sm:w-auto justify-center"
                >
                  {isConfirmingPayment ? 'Memproses...' : <><CircleCheck className="w-4 h-4" /> Konfirmasi Pembayaran ({selectedRecords.length})</>}
                </button>
              )}
            </>
          }
        />

        {/* ── Filter Bar Maintenance ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/50 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
              <span>Filter Maintenance</span>
            </div>
            {(searchQuery || typeFilter !== 'Semua' || paymentStatusFilter !== 'Semua' || statusSubFilter !== 'Semua' || sortBy !== 'default') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('Semua');
                  setPaymentStatusFilter('Semua');
                  setStatusSubFilter('Semua');
                  setSortBy('default');
                  setCurrentPage(1);
                }}
                className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 flex items-center gap-1 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5" />
              <input
                placeholder="Cari ID, Aset, Teknisi..."
                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-xs rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Kategori Maintenance */}
            <div>
              <select
                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-xs rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-indigo-500 [&>option]:bg-white dark:[&>option]:bg-gray-800 font-bold text-indigo-600 dark:text-indigo-400"
                value={activeTab}
                onChange={(e) => {
                  setActiveTab(e.target.value as 'active' | 'history');
                  setCurrentPage(1);
                  setSelectedRecords([]);
                }}
              >
                <option value="active">Pekerjaan Aktif</option>
                <option value="history">Riwayat Maintenance</option>
              </select>
            </div>

            {/* Filter Tipe Maintenance */}
            <div>
              <select
                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-xs rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-indigo-500 [&>option]:bg-white dark:[&>option]:bg-gray-800 font-medium"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="Semua">Semua Tipe</option>
                <option value="Perbaikan">Perbaikan</option>
                <option value="Rutin">Rutin</option>
                <option value="Kalibrasi">Kalibrasi</option>
              </select>
            </div>

            {/* Filter Status Khusus Tab */}
            {activeTab === 'history' ? (
              <div>
                <select
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-xs rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-indigo-500 [&>option]:bg-white dark:[&>option]:bg-gray-800 font-medium"
                  value={paymentStatusFilter}
                  onChange={(e) => {
                    setPaymentStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="Semua">Semua Pembayaran</option>
                  <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
                  <option value="Lunas">Lunas</option>
                </select>
              </div>
            ) : (
              <div>
                <select
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-xs rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-indigo-500 [&>option]:bg-white dark:[&>option]:bg-gray-800 font-medium"
                  value={statusSubFilter}
                  onChange={(e) => {
                    setStatusSubFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Dijadwalkan">Dijadwalkan</option>
                  <option value="Sedang Berjalan">Sedang Berjalan</option>
                </select>
              </div>
            )}

            {/* Sorting Filter */}
            <div>
              <select
                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-xs rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-indigo-500 [&>option]:bg-white dark:[&>option]:bg-gray-800 font-medium"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="default">Urutan: Default</option>
                <option value="completed_date_desc">Selesai: Terbaru</option>
                <option value="completed_date_asc">Selesai: Terlama</option>
                <option value="created_at_desc">Dibuat: Terbaru</option>
                <option value="created_at_asc">Dibuat: Terlama</option>
              </select>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : maintenances.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400">Belum ada data maintenance.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {maintenances.map((record) => (
              <div key={record.id} className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 rounded-xl p-5 shadow-xs flex flex-col justify-between transition">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      {/* Checkbox dipindahkan menjadi tombol di bagian bawah card */}
                      <span className="font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight flex gap-2 items-center">
                        ID Servis: {record.id}
                        {record.is_edited && (
                          <span className="text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-sm border border-gray-200 dark:border-gray-700">Telah Diedit</span>
                        )}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${getStatusBadge(record.status)}`}>
                      {record.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{record.asset_name}</h3>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">ID Barang: {record.asset_id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs border-y border-gray-50 dark:border-gray-800/50 py-2.5">
                    <div>
                      <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase font-bold leading-normal">Teknisi Pengampu</p>
                      <p className="text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-1">
                        <UserIcon className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        {record.technician_name}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase font-bold leading-normal">
                          {activeTab === 'history' ? 'Waktu Pengerjaan' : 'Tanggal Perawatan'}
                        </p>
                        {activeTab === 'history' && getScheduleStatusBadge(record.scheduled_date, record.completed_date)}
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 font-semibold font-mono flex items-start gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
                        {activeTab === 'history' ? (
                          <div className="text-[10px] leading-snug">
                            <span className="text-gray-500 dark:text-gray-400">Jadwal:</span> {record.scheduled_date || '-'}<br />
                            <span className="text-gray-500 dark:text-gray-400">Mulai:</span> {formatDateTime(record.actual_start_date || record.scheduled_date)}<br />
                            <span className="text-gray-500 dark:text-gray-400">Selesai:</span> {formatDateTime(record.completed_date)}
                          </div>
                        ) : (
                          <span>{record.scheduled_date}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="bg-gray-100 dark:bg-gray-800/80 text-gray-650 dark:text-gray-300 px-2 py-0.5 rounded text-[10.5px] font-bold">
                      Tipe: {record.type}
                    </span>
                    <div className="flex flex-col items-end gap-0.5 font-mono text-[10.5px]">
                      {record.status === 'Selesai' ? (
                        <>
                          <span className="text-gray-500 dark:text-gray-400">
                            Estimasi: Rp {record.estimated_cost?.toLocaleString('id-ID') || 0}
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            Aktual: Rp {record.actual_cost?.toLocaleString('id-ID') || 0}
                          </span>
                          <div className="flex flex-col items-end mt-1">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${record.payment_status === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {record.payment_status || 'Menunggu Pembayaran'}
                            </span>
                            {record.invoice_url && (
                              <a href={record.invoice_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 hover:underline mt-0.5">
                                Lihat Invoice
                              </a>
                            )}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-800 dark:text-gray-200 font-bold">
                          Est: Rp {record.estimated_cost?.toLocaleString('id-ID') || 0}
                        </span>
                      )}
                    </div>
                  </div>
                  <div 
                    className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-2.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800 leading-relaxed break-words cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => {
                      if (record.notes) {
                        setSelectedNoteRecord(record);
                        setIsNoteModalOpen(true);
                      }
                    }}
                  >
                    <span className="font-bold text-gray-650 dark:text-gray-300 block text-[10px] uppercase mb-0.5">Catatan Perbaikan:</span>
                    <div className="line-clamp-2">
                      {record.notes || '-'}
                    </div>
                  </div>
                </div>

                {((currentUser?.role === 'Teknisi' && currentUser?.id === record.technician_id) ||
                  (currentUser?.role === 'Administrator' && record.status === 'Dijadwalkan') ||
                  (currentUser?.role === 'Administrator' && activeTab === 'history' && record.payment_status === 'Menunggu Pembayaran')) && (
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-3.5 mt-4 flex gap-2">
                      {currentUser?.role === 'Administrator' && record.status === 'Dijadwalkan' && (
                        <button
                          onClick={() => {
                            setEditRecord(record);
                            setIsModalOpen(true);
                          }}
                          className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition flex-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit Jadwal
                        </button>
                      )}

                      {currentUser?.role === 'Administrator' && activeTab === 'history' && record.payment_status === 'Menunggu Pembayaran' && (
                        <button
                          onClick={() => {
                            if (selectedRecords.includes(record.id)) {
                              setSelectedRecords(prev => prev.filter(id => id !== record.id));
                            } else {
                              setSelectedRecords(prev => [...prev, record.id]);
                            }
                          }}
                          className={`flex-1 py-1.5 px-3 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all duration-200 ${selectedRecords.includes(record.id)
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/50 shadow-sm'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                            }`}
                        >
                          {selectedRecords.includes(record.id) ? (
                            <><Check className="w-3.5 h-3.5" /> Terpilih (Menunggu Eksekusi)</>
                          ) : (
                            <>Konfirmasi Pembayaran</>
                          )}
                        </button>
                      )}

                      {currentUser?.role === 'Teknisi' && currentUser?.id === record.technician_id && (
                        <>
                          {record.status === 'Dijadwalkan' && (
                            <button
                              onClick={() => handleUpdateStatus(record.id, 'Sedang Berjalan')}
                              disabled={actionLoading === record.id}
                              className="flex-1 py-1.5 bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition disabled:opacity-50"
                            >
                              {actionLoading === record.id ? 'Memproses...' : <><Play className="w-3.5 h-3.5 inline" /> Mulai Kerjakan</>}
                            </button>
                          )}
                          {record.status === 'Sedang Berjalan' && (
                            <button
                              onClick={() => {
                                setCompleteModalRecord(record);
                                setIsCompleteModalOpen(true);
                              }}
                              disabled={actionLoading === record.id}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition disabled:opacity-50"
                            >
                              {actionLoading === record.id ? 'Memproses...' : <><CircleCheck className="w-3.5 h-3.5 inline" /> Selesaikan Service</>}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Pagination Controls ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <span className="text-[11px] text-gray-400">
              Halaman {currentPage} dari {totalPages} ({totalRecords} data)
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
      </div>

      <MaintenanceFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditRecord(null);
        }}
        onSave={() => {
          setIsModalOpen(false);
          setEditRecord(null);
          fetchMaintenances();
        }}
        currentUser={currentUser}
        editData={editRecord}
      />

      <CompleteMaintenanceModal
        isOpen={isCompleteModalOpen}
        record={completeModalRecord}
        onClose={() => {
          setIsCompleteModalOpen(false);
          setCompleteModalRecord(null);
        }}
        onSave={handleCompleteMaintenance}
        isLoading={!!actionLoading}
      />

      <TextModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Catatan Perbaikan Lengkap"
        content={selectedNoteRecord?.notes || ''}
      />
    </>
  );
}
