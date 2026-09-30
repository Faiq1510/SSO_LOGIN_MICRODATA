'use client';

import React, { useState, useEffect } from 'react';
import { CircleCheck, Loader2, Check, X } from 'lucide-react';
import { MaintenanceRecord } from '@/types';

interface CompleteMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cost: number, notes: string, assetCondition: string) => void;
  record: MaintenanceRecord | null;
  isLoading: boolean;
}

export default function CompleteMaintenanceModal({ isOpen, onClose, onSave, record, isLoading }: CompleteMaintenanceModalProps) {
  const [selectedCondition, setSelectedCondition] = useState('Baik');
  const [cost, setCost] = useState<number>(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && record) {
      setSelectedCondition('Baik');
      setCost(record.actual_cost || record.estimated_cost || 0);
      setNotes(record.notes || '');
    }
  }, [isOpen, record]);

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-xl shadow-gray-900/10 dark:shadow-black/50 border border-gray-100 dark:border-gray-800/60 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CircleCheck className="w-3.5 h-3.5" />
            </div>
            Selesaikan Maintenance
          </h2>
          <button onClick={onClose} aria-label="Tutup modal penyelesaian maintenance" className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 md:p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Silakan isi laporan akhir setelah maintenance selesai dilakukan:</p>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Biaya Aktual (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-[10px] text-xs font-bold text-gray-400">Rp</span>
                <input
                  type="number"
                  min="0"
                  value={cost || ''}
                  onChange={(e) => setCost(Number(e.target.value) || 0)}
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Catatan Akhir / Perbaikan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-h-[80px]"
                placeholder="Deskripsikan pekerjaan yang telah dilakukan..."
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Kondisi Aset Saat Ini
              </label>
              <div className="space-y-2 mt-1">
                {['Baik', 'Rusak Ringan', 'Rusak Berat'].map((cond) => (
                  <label key={cond} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${selectedCondition === cond ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}>
                    <input
                      type="radio"
                      name="asset_condition"
                      value={cond}
                      checked={selectedCondition === cond}
                      onChange={(e) => setSelectedCondition(e.target.value)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 dark:focus:ring-emerald-500 dark:ring-offset-gray-900"
                    />
                    <span className="text-xs font-semibold">{cond}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-end gap-2 mt-auto">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors shadow-sm"
          >
            Batal
          </button>
          <button 
            onClick={() => onSave(cost, notes, selectedCondition)}
            disabled={isLoading || !notes.trim()}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Selesaikan
          </button>
        </div>
      </div>
    </div>
  );
}
