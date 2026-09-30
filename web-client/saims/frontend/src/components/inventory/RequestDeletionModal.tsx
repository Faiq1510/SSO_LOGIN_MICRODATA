import React, { useState, useEffect } from 'react';
import { Asset } from '@/types';
import { assetService } from '@/services/asset.service';
import { X, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RequestDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  asset?: Asset;
}

export default function RequestDeletionModal({ isOpen, onClose, onSave, asset }: RequestDeletionModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Alasan penghapusan wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await assetService.deleteAsset(asset.id, reason);
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal mengajukan penghapusan aset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Pengajuan Penghapusan</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Ajukan hapus aset ke Supervisor</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Tutup modal pengajuan penghapusan"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div role="alert" aria-live="assertive" className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/50">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Aset yang akan dihapus:</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">{asset.name}</p>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">{asset.id}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Alasan Penghapusan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Jelaskan secara detail mengapa aset ini perlu dihapus..."
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-3 min-h-[120px] resize-y focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-xl transition-all shadow-sm shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? 'Mengajukan...' : 'Ajukan Penghapusan'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
