import React, { useState, useEffect } from 'react';
import { Asset, User, MaintenanceRecord } from '@/types';
import { assetService } from '@/services/asset.service';
import { maintenanceService } from '@/services/maintenance.service';
import { userService } from '@/services/user.service';
import { X, Calendar, Wrench, FileText, User as UserIcon, ChevronDown } from 'lucide-react';

interface MaintenanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  currentUser: User | null;
  editData?: MaintenanceRecord | null;
}

export default function MaintenanceFormModal({ isOpen, onClose, onSave, currentUser, editData }: MaintenanceFormModalProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);

  const isEditMode = !!editData;

  const [formData, setFormData] = useState({
    asset_ids: [] as string[],
    technician_id: '',
    type: 'Rutin',
    scheduled_date: new Date().toISOString().split('T')[0],
    notes: '',
    estimated_cost: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [assetsRes, usersData] = await Promise.all([
          assetService.getAssets({ limit: 1000 }),
          currentUser?.role === 'Administrator' ? userService.getUsers() : Promise.resolve([])
        ]);
        
        const sortedAssets = assetsRes.data
          .filter((a: Asset) => a.status === 'Tersedia')
          .sort((a: Asset, b: Asset) => {
            const order: Record<string, number> = { 'Rusak Berat': 1, 'Rusak Ringan': 2, 'Baik': 3 };
            return (order[a.condition] || 99) - (order[b.condition] || 99);
          });
        setAssets(sortedAssets);
        
        if (currentUser?.role === 'Administrator') {
          setTechnicians(usersData.filter((u: User) => u.role === 'Teknisi'));
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
      
      // Delaying state update slightly to avoid synchronous setState inside effect warning
      setTimeout(() => {
        if (!isEditMode) {
          setFormData({
            asset_ids: [],
            technician_id: '',
            type: 'Rutin',
            scheduled_date: new Date().toISOString().split('T')[0],
            notes: '',
            estimated_cost: 0,
          });
        } else if (editData) {
          setFormData({
            asset_ids: [editData.asset_id],
            technician_id: editData.technician_id,
            type: editData.type,
            scheduled_date: editData.scheduled_date || new Date().toISOString().split('T')[0],
            notes: editData.notes || '',
            estimated_cost: editData.estimated_cost || 0,
          });
        }
        setError('');
      }, 0);
    }
  }, [isOpen, editData, isEditMode, currentUser?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.asset_ids.length === 0 && !isEditMode) {
      setError('Silakan pilih minimal 1 aset');
      return;
    }
    
    if (currentUser?.role === 'Administrator' && !formData.technician_id) {
      setError('Silakan pilih teknisi pengampu');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    try {
      if (isEditMode) {
        await maintenanceService.updateDetails(editData.id, {
          type: formData.type,
          scheduled_date: formData.scheduled_date,
          notes: formData.notes,
          estimated_cost: Number(formData.estimated_cost) || 0,
        });
      } else {
        let technician_name = '';
        if (currentUser?.role === 'Administrator') {
          const selectedTech = technicians.find(t => t.id === formData.technician_id);
          if (selectedTech) technician_name = selectedTech.name;
        }

        await maintenanceService.createMaintenance({
          asset_ids: formData.asset_ids,
          technician_id: formData.technician_id,
          technician_name: technician_name,
          type: formData.type,
          scheduled_date: formData.scheduled_date,
          notes: formData.notes,
          estimated_cost: Number(formData.estimated_cost) || 0,
        });
      }
      onSave();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } }, message?: string };
      setError(errorObj.response?.data?.error || errorObj.message || `Terjadi kesalahan saat ${isEditMode ? 'mengubah' : 'menjadwalkan'} maintenance`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-xl shadow-gray-900/10 dark:shadow-black/50 border border-gray-100 dark:border-gray-800/60 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5" />
            </div>
            {isEditMode ? 'Edit Pengajuan Maintenance' : 'Jadwalkan Maintenance Baru'}
          </h2>
          <button onClick={onClose} aria-label="Tutup modal maintenance" className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 md:p-5">
          {error && (
            <div role="alert" aria-live="assertive" className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm rounded-xl font-medium">
              {error}
            </div>
          )}

          <form id="maintenance-form" onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Aset yang Tersedia</label>
              <select
                className="sr-only"
                aria-label="Aset yang Tersedia"
                value={formData.asset_ids[0] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, asset_ids: val ? [val] : [] });
                }}
              >
                <option value="">-- Pilih Aset --</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.id} - {asset.name}</option>
                ))}
              </select>
              <div 
                className={`relative w-full ${isEditMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                tabIndex={0}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setIsAssetDropdownOpen(false);
                  }
                }}
              >
                <div 
                  className={`w-full bg-gray-50 dark:bg-gray-800/50 border ${error && formData.asset_ids.length === 0 && !isEditMode ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} text-gray-900 dark:text-white text-xs rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all flex justify-between items-center ${!isEditMode ? 'cursor-pointer' : ''}`}
                  onClick={() => !isEditMode && setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                >
                  <span className="truncate">
                    {isEditMode 
                      ? `${editData?.asset_id} - ${editData?.asset_name}`
                      : formData.asset_ids.length > 0 
                        ? `${formData.asset_ids.length} Aset Terpilih`
                        : '-- Pilih Aset --'
                    }
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isAssetDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isAssetDropdownOpen && !isEditMode && (
                  <div className="absolute z-[60] w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto outline-none">
                    {assets.length === 0 ? (
                      <div className="p-3 text-xs text-gray-500 text-center">Tidak ada aset tersedia</div>
                    ) : (
                      assets.map(asset => (
                        <div 
                          key={asset.id} 
                          className={`p-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center justify-between border-b border-gray-100 dark:border-gray-800/50 last:border-0 ${formData.asset_ids.includes(asset.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                          onClick={() => {
                            const selected = formData.asset_ids.includes(asset.id);
                            if (selected) {
                              setFormData({ ...formData, asset_ids: formData.asset_ids.filter(id => id !== asset.id) });
                            } else {
                              setFormData({ ...formData, asset_ids: [...formData.asset_ids, asset.id] });
                            }
                          }}
                        >
                          <div className="flex items-center gap-2 overflow-hidden pr-2">
                            <input 
                              type="checkbox" 
                              checked={formData.asset_ids.includes(asset.id)} 
                              readOnly 
                              className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 w-3.5 h-3.5 shrink-0"
                            />
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{asset.id}</span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{asset.name}</span>
                            </div>
                          </div>
                          <span className={`shrink-0 text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                            asset.condition === 'Rusak Berat' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            asset.condition === 'Rusak Ringan' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                            {asset.condition}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {assets.length === 0 && !isLoading && !isEditMode && (
                <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">Tidak ada aset berstatus &quot;Tersedia&quot;.</p>
              )}
            </div>

            {currentUser?.role === 'Administrator' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Teknisi Pengampu</label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <select
                    className={`w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isEditMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                    value={formData.technician_id}
                    onChange={(e) => setFormData({ ...formData, technician_id: e.target.value })}
                    required
                    disabled={isLoading || isEditMode}
                  >
                    {isEditMode ? (
                      <option value={editData.technician_id} className="bg-white dark:bg-gray-900">{editData.technician_name}</option>
                    ) : (
                      <>
                        <option value="" className="bg-white dark:bg-gray-900">-- Pilih Teknisi --</option>
                        {technicians.map(tech => (
                          <option key={tech.id} value={tech.id} className="bg-white dark:bg-gray-900">
                            {tech.name} (ID: {tech.idKaryawan || tech.id.substring(0,8)})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Tipe Servis</label>
                <select
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="Rutin" className="bg-white dark:bg-gray-900">Rutin</option>
                  <option value="Perbaikan" className="bg-white dark:bg-gray-900">Perbaikan</option>
                  <option value="Kalibrasi" className="bg-white dark:bg-gray-900">Kalibrasi</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Tanggal</label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs rounded-xl pl-9 pr-2 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Estimasi Biaya (Rp)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-[10px] text-xs font-bold text-gray-400">Rp</span>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.estimated_cost || ''}
                  onChange={(e) => setFormData({ ...formData, estimated_cost: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Catatan</label>
              <div className="relative">
                <FileText className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <textarea
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[80px]"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detail keluhan atau perbaikan..."
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-end gap-2 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            form="maintenance-form"
            disabled={isSubmitting || assets.length === 0}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : (
              isEditMode ? 'Simpan Perubahan' : 'Jadwalkan Sekarang'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
