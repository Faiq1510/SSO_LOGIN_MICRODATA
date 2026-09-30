"use client";

import React, { useEffect, useState } from 'react';
import { assetDeletionService, AssetDeletionRequest } from '@/services/asset-deletion.service';
import { Check, X, ClipboardList, Trash2 } from 'lucide-react';
import PageHeaderCard from '@/components/ui/PageHeaderCard';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal, { ConfirmModalType } from '@/components/ui/ConfirmModal';

export default function AssetDeletionsApprovalPage() {
  const [requests, setRequests] = useState<AssetDeletionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const closeModalState = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const data = await assetDeletionService.getRequests('Pending');
      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch requests", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Setujui Penghapusan',
      message: 'Apakah Anda yakin menyetujui penghapusan aset ini? Aset akan dihapus dari sistem.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await assetDeletionService.approveRequest(id);
          fetchRequests();
          setTimeout(() => {
            setModalConfig({
              isOpen: true,
              title: 'Berhasil Disetujui',
              message: 'Penghapusan aset telah disetujui dan dieksekusi.',
              type: 'info',
              hideCancel: true,
              onConfirm: closeModalState
            });
          }, 300);
        } catch (error: any) {
          const errorMsg = error?.response?.data?.error || error?.response?.data?.message || 'Gagal menyetujui penghapusan aset.';
          setTimeout(() => {
            setModalConfig({
              isOpen: true,
              title: 'Gagal Menyetujui',
              message: errorMsg,
              type: 'warning',
              hideCancel: true,
              onConfirm: closeModalState
            });
          }, 300);
          fetchRequests();
        }
      }
    });
  };

  const handleReject = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Tolak Penghapusan',
      message: 'Apakah Anda yakin ingin menolak pengajuan penghapusan ini?',
      type: 'warning',
      onConfirm: async () => {
        try {
          await assetDeletionService.rejectRequest(id);
          fetchRequests();
        } catch (error) {
          console.error("Failed to reject", error);
        }
      }
    });
  };

  return (
    <div className="space-y-5">
      <PageHeaderCard
        moduleBadge="Modul Persetujuan"
        badgeColorClass="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
        title="Persetujuan Penghapusan Aset"
        description="Kelola permohonan penghapusan aset dari Administrator."
        icon={Trash2}
        iconColorClass="text-red-600"
      />

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-[#1A1F2E] rounded-xl shadow-xs border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-500 dark:text-zinc-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Tidak ada pengajuan penghapusan yang menunggu persetujuan.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xs border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <th className="py-4 px-5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tanggal</th>
                  <th className="py-4 px-5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aset</th>
                  <th className="py-4 px-5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pemohon</th>
                  <th className="py-4 px-5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Alasan</th>
                  <th className="py-4 px-5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {requests.map((req) => (
                    <motion.tr 
                      key={req.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-4 px-5 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(req.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-4 px-5">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{req.asset?.name || req.asset_id}</p>
                      </td>
                      <td className="py-4 px-5">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{req.requester?.name || req.requested_by}</p>
                      </td>
                      <td className="py-4 px-5">
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 max-w-md">{req.reason}</p>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                            title="Setujui"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Tolak"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeModalState}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        hideCancel={modalConfig.hideCancel}
        confirmText={modalConfig.type === 'danger' && !modalConfig.hideCancel ? 'Lanjutkan' : 'Oke'}
      />
    </div>
  );
}
