import React from 'react';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

export type ConfirmModalType = 'warning' | 'info' | 'success' | 'danger';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: ConfirmModalType;
  confirmText?: string;
  cancelText?: string;
  hideCancel?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  hideCancel = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />;
      case 'warning': return <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
      case 'success': return <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
      case 'info':
      default:
        return <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'danger': return 'bg-red-100 dark:bg-red-900/30';
      case 'warning': return 'bg-amber-100 dark:bg-amber-900/30';
      case 'success': return 'bg-emerald-100 dark:bg-emerald-900/30';
      case 'info':
      default:
        return 'bg-blue-100 dark:bg-blue-900/30';
    }
  };

  const getConfirmButtonStyles = () => {
    switch (type) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning': return 'bg-amber-600 hover:bg-amber-700 text-white';
      case 'success': return 'bg-emerald-600 hover:bg-emerald-700 text-white';
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div role="dialog" aria-modal="true" className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-xl shadow-gray-900/10 dark:shadow-black/50 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800/60">
        <div className="flex justify-end">
          <button onClick={onClose} aria-label="Tutup dialog konfirmasi" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className={`w-12 h-12 rounded-full ${getIconBg()} flex items-center justify-center mb-4 mx-auto`}>
          {getIcon()}
        </div>
        <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
          {message}
        </p>
        <div className="flex items-center gap-3">
          {!hideCancel && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-colors shadow-sm ${getConfirmButtonStyles()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
