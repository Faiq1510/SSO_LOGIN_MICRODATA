"use client";

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ShieldCheck, ShieldAlert, Check, X, Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Borrowing, Asset } from '@/types';
import ConfirmModal, { ConfirmModalType } from '@/components/ui/ConfirmModal';
import axiosInstance from '@/lib/axios';
import PageHeaderCard from '@/components/ui/PageHeaderCard';
import TextModal from '@/components/ui/TextModal';

import { useApprovalData } from './hooks/useApprovalData';

interface GroupedBorrowing {
  key: string;
  borrower_name: string;
  purpose: string;
  start_date: string;
  end_date: string;
  items: Borrowing[];
}

export default function ApprovalPage() {
  const {
    pendingBorrowings,
    returnBorrowings,
    damagedAssets,
    isLoading: isDataLoading,
    fetchError,
    fetchData
  } = useApprovalData();

  const [isMutationLoading, setIsMutationLoading] = useState(false);
  const isLoading = isDataLoading || isMutationLoading;

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [batchRejectItems, setBatchRejectItems] = useState<Borrowing[] | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Verify State
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedVerifyId, setSelectedVerifyId] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<'Baik' | 'Rusak Ringan' | 'Rusak Berat'>('Baik');

  // Text Modal State
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [selectedTextTitle, setSelectedTextTitle] = useState('');
  const [selectedTextContent, setSelectedTextContent] = useState('');

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ConfirmModalType;
    onConfirm: () => void;
    hideCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => { }
  });

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const handleUpdateBorrowing = async (id: string, newStatus: string) => {
    if (newStatus === 'Rejected') {
      setRejectId(id);
      setRejectionReason('');
      return;
    }
    if (newStatus === 'Selesai') {
      setSelectedVerifyId(id);
      setSelectedCondition('Baik');
      setVerifyModalOpen(true);
      return;
    }
    await processUpdate(id, newStatus);
  };

  const processUpdate = async (id: string, newStatus: string, reason?: string, condition?: string) => {
    try {
      let body: any = { status: newStatus };
      if (reason) body.rejection_reason = reason;
      if (condition) body.asset_condition = condition;

      await axiosInstance.put(`/borrowings/${id}/status`, body);

      let title = 'Berhasil';
      let message = 'Status berhasil diperbarui.';

      if (newStatus === 'Approved') {
        title = 'Persetujuan Berhasil';
        message = 'Pengajuan peminjaman telah berhasil disetujui.';
      } else if (newStatus === 'Rejected') {
        title = 'Penolakan Berhasil';
        message = 'Pengajuan peminjaman telah berhasil ditolak.';
      } else if (newStatus === 'Selesai') {
        title = 'Verifikasi Berhasil';
        message = 'Pengembalian aset telah berhasil diverifikasi dan diselesaikan.';
      }

      setModalConfig({
        isOpen: true,
        title: title,
        message: message,
        type: 'success',
        hideCancel: true,
        onConfirm: () => {
          closeModal();
          fetchData();
        }
      });
    } catch (error: any) {
      alert(error?.response?.data?.error || error.message || 'Gagal memperbarui status');
    }
  };

  const groupBorrowings = (list: Borrowing[]): GroupedBorrowing[] => {
    const groupsMap: Record<string, GroupedBorrowing> = {};
    list.forEach(item => {
      const key = `${item.borrower_name}|${item.purpose}|${item.start_date}|${item.end_date}`;
      if (!groupsMap[key]) {
        groupsMap[key] = {
          key,
          borrower_name: item.borrower_name,
          purpose: item.purpose,
          start_date: item.start_date,
          end_date: item.end_date,
          items: []
        };
      }
      groupsMap[key].items.push(item);
    });
    return Object.values(groupsMap);
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleBatchUpdate = async (items: Borrowing[], newStatus: string) => {
    if (newStatus === 'Rejected') {
      setBatchRejectItems(items);
      setRejectionReason('');
      return;
    }

    setIsMutationLoading(true);
    try {
      for (const item of items) {
        await axiosInstance.put(`/borrowings/${item.id}/status`, { status: 'Approved' });
      }
      setModalConfig({
        isOpen: true,
        title: 'Persetujuan Massal Berhasil',
        message: `Berhasil menyetujui ${items.length} pengajuan peminjaman.`,
        type: 'success',
        hideCancel: true,
        onConfirm: () => {
          closeModal();
          fetchData();
        }
      });
    } catch (error: any) {
      alert(error?.response?.data?.error || error.message || 'Gagal memperbarui status');
    } finally {
      setIsMutationLoading(false);
    }
  };

  const submitVerify = async () => {
    if (!selectedVerifyId) return;
    await processUpdate(selectedVerifyId, 'Selesai', undefined, selectedCondition);
    setVerifyModalOpen(false);
    setSelectedVerifyId(null);
  };

  const submitRejection = async () => {
    if (batchRejectItems) {
      setIsMutationLoading(true);
      try {
        for (const item of batchRejectItems) {
          await axiosInstance.put(`/borrowings/${item.id}/status`, { status: 'Rejected', rejection_reason: rejectionReason });
        }
        setModalConfig({
          isOpen: true,
          title: 'Penolakan Massal Berhasil',
          message: `Berhasil menolak ${batchRejectItems.length} pengajuan peminjaman.`,
          type: 'success',
          hideCancel: true,
          onConfirm: () => {
            closeModal();
            fetchData();
          }
        });
      } catch (error: any) {
        alert(error?.response?.data?.error || error.message || 'Gagal menolak pengajuan');
      } finally {
        setIsMutationLoading(false);
        setBatchRejectItems(null);
      }
    } else if (rejectId) {
      processUpdate(rejectId, 'Rejected', rejectionReason);
      setRejectId(null);
    }
  };

  const handleDisposal = async (id: string) => {
    try {
      // Update asset status to Arsip (Disposal in business logic)
      await axiosInstance.put(`/assets/${id}`, { status: 'Arsip', condition: 'Rusak Berat' });

      setModalConfig({
        isOpen: true,
        title: 'Berhasil',
        message: 'Aset berhasil di-disposal (dihapus dari peredaran).',
        type: 'info',
        hideCancel: true,
        onConfirm: () => {
          closeModal();
          fetchData();
        }
      });
    } catch (error: any) {
      alert(error?.response?.data?.error || error.message || 'Gagal melakukan disposal');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['Administrator', 'Supervisor']}>
      <div className="space-y-6" id="approval-workspace">
        <PageHeaderCard
          moduleBadge="Modul Persetujuan"
          badgeColorClass="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
          title="Pusat Persetujuan & Tinjauan"
          description="Review pengajuan pinjaman dan tindak lanjuti aset rusak berat."
          icon={ShieldCheck}
          iconColorClass="text-amber-500"
          rightContent={
            <>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 px-4 py-2 rounded-lg text-center flex-1 md:flex-none min-w-[100px]">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block mb-0.5">Pending Pinjam</span>
                <span className="text-xl font-bold text-amber-700 dark:text-amber-500">{pendingBorrowings.length}</span>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 px-4 py-2 rounded-lg text-center flex-1 md:flex-none min-w-[100px]">
                <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 block mb-0.5">Aset Rusak</span>
                <span className="text-xl font-bold text-red-700 dark:text-red-500">{damagedAssets.length}</span>
              </div>
            </>
          }
        />

        {fetchError && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs p-3 rounded-lg flex items-center gap-2 border border-red-200 dark:border-red-800/50">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            {fetchError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri: Peminjaman & Pengembalian */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-8 min-w-0 space-y-6"
          >
            <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-800 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-150 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2 font-display">
                  <span>Antrean Pengajuan Peminjaman</span>
                  <span className="text-[10px] bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 font-bold px-2 py-0.5 rounded-full">
                    {pendingBorrowings.length} Berkas Menunggu
                  </span>
                </h3>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">Verifikasi Multi-level (Supervisor)</span>
              </div>

              <div className="space-y-3.5">
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : pendingBorrowings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400 space-y-2">
                    <ShieldCheck className="w-10 h-10 opacity-20" />
                    <p className="text-sm font-medium">Tidak ada pengajuan baru.</p>
                  </div>
                ) : (
                  groupBorrowings(pendingBorrowings).map((group) => {
                    const isExpanded = !!expandedGroups[group.key];
                    return (
                      <div key={group.key} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-xl overflow-hidden hover:border-gray-200 dark:hover:border-gray-600 transition shadow-sm">
                        {/* Kartu Utama (Grup) */}
                        <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2.5">
                              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 font-bold px-2.5 py-0.5 rounded-full">
                                {group.items.length} Aset
                              </span>
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                Pengajuan oleh {group.borrower_name}
                              </h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                              <p>
                                <span className="text-gray-400 font-medium">Keperluan:</span>{' '}
                                <span 
                                  className="font-semibold text-gray-700 dark:text-gray-300 line-clamp-1 inline-block align-bottom max-w-[200px] cursor-pointer hover:text-indigo-600 transition-colors"
                                  onClick={() => {
                                    if (group.purpose) {
                                      setSelectedTextTitle('Keperluan Peminjaman');
                                      setSelectedTextContent(group.purpose);
                                      setIsTextModalOpen(true);
                                    }
                                  }}
                                >
                                  "{group.purpose}"
                                </span>
                              </p>
                              <p><span className="text-gray-400 font-medium">Waktu:</span> <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{group.start_date} s/d {group.end_date}</span></p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleBatchUpdate(group.items, 'Approved')}
                              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm active:scale-[0.98]"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Setujui Semua
                            </button>
                            <button
                              onClick={() => handleBatchUpdate(group.items, 'Rejected')}
                              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 border border-red-200 dark:border-red-800/50 hover:bg-red-550 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold px-4 py-2 rounded-xl transition active:scale-[0.98]"
                            >
                              <X className="w-3.5 h-3.5" />
                              Tolak Semua
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleGroup(group.key)}
                              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Accordion Daftar Aset */}
                        {isExpanded && (
                          <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-5 py-4 divide-y divide-gray-100 dark:divide-gray-800">
                            {group.items.map((item) => (
                              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[9px] font-bold text-gray-500 dark:text-gray-400 bg-gray-200/50 dark:bg-gray-700/50 px-1.5 py-0.5 rounded">
                                      {item.id}
                                    </span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200">{item.asset_name}</span>
                                  </div>
                                  <p className="text-[10px] text-gray-400 font-mono">Asset ID: {item.asset_id || item.asset_name}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleUpdateBorrowing(item.id, 'Approved')}
                                    className="flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 font-bold px-2.5 py-1.5 rounded-lg transition"
                                  >
                                    <Check className="w-3 h-3" />
                                    Setujui
                                  </button>
                                  <button
                                    onClick={() => handleUpdateBorrowing(item.id, 'Rejected')}
                                    className="flex items-center gap-1 text-[10px] text-red-650 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold px-2.5 py-1.5 rounded-lg transition"
                                  >
                                    <X className="w-3 h-3" />
                                    Tolak
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Antrean Pengembalian */}
            <div className="bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-800 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-150 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5 font-display">
                  <Check className="w-4 h-4 text-purple-500" />
                  <span>Antrean Pengembalian</span>
                  <span className="text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-800/50 font-bold px-2 py-0.5 rounded-full ml-1">
                    {returnBorrowings.length} Berkas Menunggu
                  </span>
                </h3>
              </div>

              <p className="text-xs text-gray-550 dark:text-gray-400 leading-relaxed">
                Peminjaman yang <b>telah dikembalikan</b> oleh staf dan menunggu verifikasi supervisor untuk diselesaikan:
              </p>

              <div className="space-y-3">
                {isLoading ? (
                  <div className="flex justify-center items-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : returnBorrowings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400 space-y-2">
                    <Check className="w-10 h-10 opacity-20" />
                    <p className="text-sm font-medium">Tidak ada pengajuan baru.</p>
                  </div>
                ) : (
                  returnBorrowings.map((borrow) => (
                    <div key={borrow.id} className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 p-4 rounded-lg shadow-sm flex flex-col gap-3">
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white text-sm">{borrow.asset_name}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Peminjam: {borrow.borrower_name}</p>
                      </div>
                      <button
                        onClick={() => handleUpdateBorrowing(borrow.id, 'Selesai')}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-md text-xs font-bold transition whitespace-nowrap w-full flex justify-center items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Verifikasi
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* Kolom Kanan: Disposal Aset */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-4 min-w-0 bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-800 rounded-xl p-5 shadow-xs space-y-4 h-fit"
          >
            <div className="pb-2 border-b border-gray-150 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5 font-display">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Rekomendasi Penghapusan Aset (Disposal)
              </h3>
            </div>

            <p className="text-xs text-gray-550 dark:text-gray-400 leading-relaxed">
              Menampilkan inventaris berkondisi <b>Rusak Berat</b> sebagai rekomendasi untuk dikeluarkan dari daftar aset utama:
            </p>

            <div className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : damagedAssets.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-lg p-5 text-center text-xs text-gray-400">
                  Tidak ada rekomendasi aset berkondisi Rusak Berat.
                </div>
              ) : (
                damagedAssets.map((asset) => (
                  <div key={asset.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm flex flex-col gap-3">
                    <div>
                      <p className="font-bold text-gray-800 dark:text-white text-sm">{asset.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{asset.id}</p>
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">Kondisi: {asset.condition}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        <ConfirmModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          onConfirm={modalConfig.onConfirm}
          onClose={closeModal}
          hideCancel={modalConfig.hideCancel}
        />

        {(rejectId || batchRejectItems) && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-xl shadow-xl shadow-gray-900/10 dark:shadow-black/50 border border-gray-100 dark:border-gray-800/60 p-8 flex flex-col gap-4 animate-in fade-in zoom-in duration-200 overflow-hidden">
              <h3 className="font-bold text-gray-900 dark:text-white text-xl flex items-center gap-2">
                <X className="w-6 h-6 text-red-500" />
                Alasan Penolakan {batchRejectItems ? 'Massal' : ''}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Silakan masukkan alasan mengapa pengajuan ini ditolak. Alasan akan dilihat oleh peminjam.</p>
              <textarea
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl p-4 outline-none focus:ring-2 focus:ring-red-500 transition-all min-h-[250px] resize-y"
                placeholder="Masukkan alasan dengan detail..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setRejectId(null);
                    setBatchRejectItems(null);
                  }}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition shadow-sm"
                >
                  Batal
                </button>
                <button
                  onClick={submitRejection}
                  disabled={!rejectionReason.trim()}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  Tolak Pengajuan
                </button>
              </div>
            </div>
          </div>
        )}

        {verifyModalOpen && selectedVerifyId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl shadow-gray-900/10 dark:shadow-black/50 border border-gray-100 dark:border-gray-800/60 p-8 flex flex-col gap-4 animate-in fade-in zoom-in duration-200 overflow-hidden">
              <h3 className="font-bold text-gray-900 dark:text-white text-xl flex items-center gap-2">
                <Check className="w-6 h-6 text-purple-500" />
                Verifikasi Pengembalian
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Silakan periksa dan konfirmasi kondisi akhir aset yang dikembalikan sebelum menyelesaikan peminjaman.</p>

              <div className="space-y-2 mt-2">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Kondisi Aset Saat Ini</label>
                <div className="grid grid-cols-1 gap-2">
                  {(['Baik', 'Rusak Ringan', 'Rusak Berat'] as const).map((cond) => (
                    <label key={cond} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedCondition === cond
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 ring-1 ring-purple-500'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}>
                      <input
                        type="radio"
                        name="asset_condition"
                        value={cond}
                        checked={selectedCondition === cond}
                        onChange={() => setSelectedCondition(cond)}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className={`text-sm font-semibold ${selectedCondition === cond ? 'text-purple-700 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {cond}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setVerifyModalOpen(false);
                    setSelectedVerifyId(null);
                  }}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition shadow-sm"
                >
                  Batal
                </button>
                <button
                  onClick={submitVerify}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition shadow-sm flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Konfirmasi & Selesai
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <TextModal
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        title={selectedTextTitle}
        content={selectedTextContent}
      />
    </ProtectedRoute>
  );
}
