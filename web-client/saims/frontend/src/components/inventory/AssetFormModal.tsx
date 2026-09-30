import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Asset, User } from '@/types';
import { assetService } from '@/services/asset.service';
import { X, Plus, Edit2, UploadCloud, Trash2, Image as ImageIcon } from 'lucide-react';
import ConfirmModal, { ConfirmModalType } from '@/components/ui/ConfirmModal';
import { useState } from 'react';

const assetSchema = z.object({
  name: z.string().min(1, "Nama aset wajib diisi"),
  category: z.string().min(1, "Kategori wajib diisi"),
  location: z.string().min(1, "Lokasi wajib diisi"),
  status: z.enum(['Tersedia', 'Tidak Tersedia', 'Dipinjam', 'Maintenance', 'Arsip']),
  condition: z.enum(['Baik', 'Rusak Ringan', 'Rusak Berat']),
  purchase_date: z.string().optional().or(z.literal('')),
  serial_number: z.string().optional().or(z.literal('')),
  description: z.string().min(1, "Deskripsi wajib diisi")
});

type AssetFormData = z.infer<typeof assetSchema>;

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  asset?: Asset;
  currentUser?: User | null;
}

interface BulkItem {
  serial_number: string;
  condition: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
  images: File[];
}

export default function AssetFormModal({ isOpen, onClose, onSave, asset, currentUser }: AssetFormModalProps) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      status: 'Tersedia',
      condition: 'Baik',
      category: 'IT',
      location: 'Jakarta'
    }
  });

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ConfirmModalType;
    onConfirm?: () => void;
    hideCancel?: boolean;
  }>({
    isOpen: false, title: '', message: '', type: 'info'
  });

  const [quantity, setQuantity] = useState<number>(1);
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([
    { serial_number: '', condition: 'Baik', images: [] }
  ]);

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isStatusDisabled = !!(asset && (asset.status === 'Dipinjam' || asset.status === 'Maintenance'));

  const closeModalState = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const onValidationError = () => {
    setModalConfig({
      isOpen: true,
      title: 'Data Belum Lengkap',
      message: 'Mohon isi seluruh bidang data yang masih kosong.',
      type: 'warning',
      hideCancel: true,
      onConfirm: closeModalState
    });
  };

  useEffect(() => {
    if (isOpen) {
      if (asset) {
        reset({
          name: asset.name,
          category: asset.category,
          location: asset.location,
          status: asset.status,
          condition: asset.condition,
          purchase_date: asset.purchase_date || '',
          serial_number: asset.serial_number || '',
          description: asset.description || ''
        });
        
        if (currentUser?.role === 'Administrator') {
          assetService.getAssetImages(asset.id).then(imgs => {
            setExistingImages(imgs || []);
          }).catch(err => console.error("Failed to fetch images", err));
        }
      } else {
        reset({
          name: '',
          category: 'IT',
          location: 'Jakarta',
          status: 'Tersedia',
          condition: 'Baik',
          purchase_date: new Date().toISOString().split('T')[0],
          serial_number: '',
          description: ''
        });
        setExistingImages([]);
      }
      setSelectedImages([]);
      setQuantity(1);
      setBulkItems([{ serial_number: '', condition: 'Baik', images: [] }]);
    }
  }, [isOpen, asset, reset]);

  useEffect(() => {
    if (!asset && quantity > 1) {
      setBulkItems(prev => {
        const next = [...prev];
        if (next.length < quantity) {
          for (let i = next.length; i < quantity; i++) {
            next.push({ serial_number: '', condition: 'Baik', images: [] });
          }
        } else if (next.length > quantity) {
          next.splice(quantity);
        }
        return next;
      });
    } else if (quantity === 1) {
      setBulkItems([{ serial_number: '', condition: 'Baik', images: [] }]);
    }
  }, [quantity, asset]);

  if (!isOpen) return null;

  const onSubmit = async (data: AssetFormData) => {
    try {
      setIsUploading(true);
      let savedAssets: Asset[] = [];
      if (asset) {
        const saved = await assetService.updateAsset(asset.id, data);
        savedAssets = [saved];
      } else if (quantity > 1) {
        const bulkPayload = {
          name: data.name,
          category: data.category,
          location: data.location,
          purchase_date: data.purchase_date,
          description: data.description,
          items: bulkItems.map(item => ({
            serial_number: item.serial_number,
            condition: item.condition,
            status: data.status
          }))
        };
        savedAssets = await assetService.createBulkAssets(bulkPayload);
      } else {
        const singlePayload = {
          ...data,
          serial_number: data.serial_number || ''
        };
        const saved = await assetService.createAsset(singlePayload);
        savedAssets = [saved];
      }

      if (currentUser?.role === 'Administrator') {
        if (quantity > 1) {
          const uploadPromises: Promise<any>[] = [];
          savedAssets.forEach((saved, idx) => {
            const files = bulkItems[idx]?.images || [];
            files.forEach((file, fIdx) => {
              uploadPromises.push(
                assetService.uploadImage(saved.id, file, fIdx === 0)
              );
            });
          });
          await Promise.all(uploadPromises);
        } else if (selectedImages.length > 0 && savedAssets.length > 0) {
          const uploadPromises = selectedImages.map((file, index) => 
            assetService.uploadImage(savedAssets[0].id, file, index === 0 && existingImages.length === 0)
          );
          await Promise.all(uploadPromises);
        }
      }

      onSave();
    } catch (error) {
      console.error("Failed to save asset", error);
      alert("Terjadi kesalahan saat menyimpan aset atau mengunggah gambar.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedImages(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
      if (droppedFiles.length > 0) {
        setSelectedImages(prev => [...prev, ...droppedFiles]);
      }
    }
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Hapus Gambar',
      message: 'Apakah Anda yakin ingin menghapus gambar ini secara permanen?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await assetService.deleteAssetImage(asset!.id, imageId);
          setExistingImages(prev => prev.filter(img => img.id !== imageId));
          closeModalState();
        } catch (err) {
          console.error("Failed to delete image", err);
          setModalConfig({
            isOpen: true,
            title: 'Gagal',
            message: 'Terjadi kesalahan saat menghapus gambar.',
            type: 'danger',
            hideCancel: true,
            onConfirm: closeModalState
          });
        }
      }
    });
  };

  const categories = ['IT', 'Elektronik', 'Furnitur', 'Kendaraan', 'Alat Kantor', 'Lainnya'];

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className={`bg-white dark:bg-gray-900 rounded-2xl w-full ${quantity > 1 && !asset ? 'max-w-3xl' : 'max-w-lg'} shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[95vh] flex flex-col border border-transparent dark:border-gray-800`}>

        {/* Header changed to support light/dark theme */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white p-4 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            {asset ? <Edit2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> : <Plus className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
            {asset ? `Edit Aset (${asset.id})` : quantity > 1 ? 'Registrasi Aset Baru (Bulk)' : 'Registrasi Aset Baru'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal registrasi aset"
            className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="asset-form" onSubmit={handleSubmit(onSubmit, onValidationError)} className="p-6 space-y-4 overflow-y-auto">

          <div className={`grid grid-cols-1 ${!asset ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Nama Barang *</label>
              <input
                {...register('name')}
                placeholder="Contoh: iPad Pro M2"
                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                type="text"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Kategori *</label>
              <select
                {...register('category')}
                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {!asset && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Jumlah Kuantitas</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
            )}
          </div>

          {(quantity === 1 || !!asset) ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Nomor Serial (S/N)</label>
                  <input
                    {...register('serial_number')}
                    placeholder="Contoh: SN-128490DX"
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 font-mono outline-none transition-all"
                    type="text"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Lokasi Aset *</label>
                  <select
                    {...register('location')}
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  >
                    <option value="Jakarta">Jakarta</option>
                    <option value="Bandarlampung">Bandarlampung</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Tgl Perolehan</label>
                  <input
                    {...register('purchase_date')}
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    type="date"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Kondisi Fisik *</label>
                  <select
                    {...register('condition')}
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  >
                    <option value="Baik">Baik (Normal)</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Status Aset *</label>
                  <select
                    disabled={isStatusDisabled}
                    {...register('status')}
                    className="w-full bg-gray-55 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isStatusDisabled ? (
                      <>
                        {asset?.status === 'Dipinjam' && <option value="Dipinjam">Dipinjam</option>}
                        {asset?.status === 'Maintenance' && <option value="Maintenance">Maintenance</option>}
                      </>
                    ) : (
                      <>
                        <option value="Tersedia">Tersedia</option>
                        <option value="Tidak Tersedia">Tidak Tersedia</option>
                        <option value="Arsip">Arsip</option>
                      </>
                    )}
                  </select>
                  {isStatusDisabled && (
                    <p className="text-[9px] text-amber-600 dark:text-amber-400 leading-tight mt-1 font-semibold">
                      Status hanya dapat diubah melalui modul Borrowing/Maintenance.
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Lokasi Aset *</label>
                <select
                  {...register('location')}
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                >
                  <option value="Jakarta">Jakarta</option>
                  <option value="Bandarlampung">Bandarlampung</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Tgl Perolehan *</label>
                <input
                  {...register('purchase_date')}
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  type="date"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Status Aset *</label>
                <select
                  {...register('status')}
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                >
                  <option value="Tersedia">Tersedia</option>
                  <option value="Tidak Tersedia">Tidak Tersedia</option>
                  <option value="Arsip">Arsip</option>
                </select>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Deskripsi / Spesifikasi *</label>
            <textarea
              {...register('description')}
              placeholder="Masukkan detail tambahan, misalnya RAM, warna, plat nomor kendaraan..."
              rows={3}
              className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            ></textarea>
          </div>

          {quantity > 1 && !asset && (
            <div className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  Detail Unit Aset ({quantity} Unit)
                </h4>
                {bulkItems[0]?.images.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const firstImages = bulkItems[0].images;
                      setBulkItems(prev => prev.map((item, idx) => idx === 0 ? item : { ...item, images: [...firstImages] }));
                    }}
                    className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1 rounded-md transition-colors"
                  >
                    Terapkan Foto Unit #1 ke Semua Unit
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bulkItems.map((item, idx) => (
                  <div key={idx} className="bg-gray-55 border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 space-y-3 relative dark:bg-gray-800/20">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-1.5">
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Unit #{idx + 1}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">No. Serial (S/N)</label>
                        <input
                          type="text"
                          value={item.serial_number}
                          placeholder="S/N unit"
                          onChange={(e) => {
                            const newSeq = [...bulkItems];
                            newSeq[idx].serial_number = e.target.value;
                            setBulkItems(newSeq);
                          }}
                          className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">Kondisi *</label>
                        <select
                          value={item.condition}
                          onChange={(e) => {
                            const newSeq = [...bulkItems];
                            newSeq[idx].condition = e.target.value as any;
                            setBulkItems(newSeq);
                          }}
                          className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        >
                          <option value="Baik">Baik</option>
                          <option value="Rusak Ringan">Rusak Ringan</option>
                          <option value="Rusak Berat">Rusak Berat</option>
                        </select>
                      </div>
                    </div>

                    {currentUser?.role === 'Administrator' && (
                      <div className="space-y-2 mt-2">
                        <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Foto Unit</label>
                        
                        <label
                          onDragOver={(e) => { 
                            e.preventDefault(); 
                            e.currentTarget.classList.add('border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-900/20'); 
                          }}
                          onDragLeave={(e) => { 
                            e.preventDefault(); 
                            e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-900/20'); 
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-900/20');
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                              const droppedFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
                              if (droppedFiles.length > 0) {
                                const newSeq = [...bulkItems];
                                newSeq[idx].images = [...newSeq[idx].images, ...droppedFiles];
                                setBulkItems(newSeq);
                              }
                            }
                          }}
                          className="flex flex-col items-center justify-center w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer transition-colors"
                        >
                          <div className="flex flex-col items-center gap-1.5 text-gray-500 dark:text-gray-400">
                            <UploadCloud className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                            <span className="text-[10px] font-medium"><span className="text-emerald-600 dark:text-emerald-400 font-semibold">Klik</span> atau seret foto ke sini</span>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files) {
                                const newSeq = [...bulkItems];
                                newSeq[idx].images = [...newSeq[idx].images, ...Array.from(e.target.files)];
                                setBulkItems(newSeq);
                              }
                            }}
                          />
                        </label>

                        {item.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {item.images.map((imgFile, imgIdx) => (
                              <div key={imgIdx} className="relative group rounded-lg bg-gray-100 dark:bg-gray-800 w-12 h-12 overflow-hidden border border-gray-200 dark:border-gray-700">
                                <img src={URL.createObjectURL(imgFile)} alt="preview" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  aria-label="Hapus gambar aset bulk"
                                  onClick={() => {
                                    const newSeq = [...bulkItems];
                                    newSeq[idx].images = newSeq[idx].images.filter((_, iIdx) => iIdx !== imgIdx);
                                    setBulkItems(newSeq);
                                  }}
                                  className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-xs backdrop-blur-sm transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(quantity === 1 || !!asset) && currentUser?.role === 'Administrator' && (
            <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
              <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Unggah Gambar Aset (Opsional)</label>
              
              {(existingImages.length > 0 || selectedImages.length > 0) && (
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {existingImages.map(img => (
                    <div key={img.id} className="relative group rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 aspect-square">
                      <Image src={img.image_url} alt="asset" fill sizes="150px" className="object-cover" />
                      <button type="button" aria-label="Hapus gambar yang telah diunggah" onClick={() => removeExistingImage(img.id)} className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {selectedImages.map((file, idx) => (
                    <div key={idx} className="relative group rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 aspect-square">
                      <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover opacity-80" />
                      <button type="button" aria-label="Hapus gambar yang dipilih" onClick={() => removeSelectedImage(idx)} className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-6 h-6 text-gray-400 dark:text-gray-500 mb-1" />
                  <p className="text-[11px] text-gray-500 dark:text-gray-400"><span className="font-semibold text-emerald-600 dark:text-emerald-400">Klik untuk mengunggah</span> atau seret gambar</p>
                </div>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-5 py-2 bg-gray-900 dark:bg-gray-100 border border-gray-950 dark:border-white text-white dark:text-gray-900 text-xs font-bold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {isSubmitting || isUploading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white dark:border-gray-900 border-t-transparent dark:border-t-transparent rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                'Simpan Aset'
              )}
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal 
        isOpen={modalConfig.isOpen} 
        onClose={closeModalState} 
        title={modalConfig.title} 
        message={modalConfig.message} 
        type={modalConfig.type} 
        onConfirm={modalConfig.onConfirm} 
        hideCancel={modalConfig.hideCancel} 
      />
    </div>
  );
}
