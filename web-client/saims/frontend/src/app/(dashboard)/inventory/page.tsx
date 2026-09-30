"use client";

import React, { useEffect, useState } from 'react';
import { Asset, AssetStatus, AssetCondition, User } from '@/types';
import { assetService } from '@/services/asset.service';
import { Search, Plus, Edit2, Trash2, SlidersHorizontal, MapPin, QrCode, ChevronLeft, ChevronRight, ScanLine, Box } from 'lucide-react';
import AssetFormModal from '@/components/inventory/AssetFormModal';
import PrintQRModal from '@/components/inventory/PrintQRModal';
import ConfirmModal, { ConfirmModalType } from '@/components/ui/ConfirmModal';
import RequestDeletionModal from '@/components/inventory/RequestDeletionModal';
import TextModal from '@/components/ui/TextModal';
import Link from 'next/link';
import PageHeaderCard from '@/components/ui/PageHeaderCard';
import Pagination from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { resolveAssetImageUrl } from '@/lib/image-url';

export default function InventoryPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isReqDeletionModalOpen, setIsReqDeletionModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});
  
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);
  const [selectedAssetDesc, setSelectedAssetDesc] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [totalPages, setTotalPages] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);

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

  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      const data = await assetService.getAssets({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        category: categoryFilter === 'Semua' ? '' : categoryFilter,
        status: statusFilter === 'Semua' ? '' : statusFilter,
        condition: conditionFilter === 'Semua Kondisi' ? '' : conditionFilter,
        location: locationFilter === 'Semua Lokasi' ? '' : locationFilter
      });


      setAssets(data.data);
      setTotalPages(data.total_pages);
      setTotalAssets(data.total);
    } catch (error) {
      console.error("Failed to fetch assets", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchAssets();
    }, 300);
    return () => clearTimeout(handler);
  }, [currentPage, searchQuery, categoryFilter, statusFilter, conditionFilter, locationFilter]);

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

  const handleDelete = async (asset: Asset) => {
    if (currentUser?.role === 'Administrator') {
      setSelectedAsset(asset);
      setIsReqDeletionModalOpen(true);
      return;
    }

    setModalConfig({
      isOpen: true,
      title: 'Hapus Aset',
      message: 'Apakah Anda yakin ingin menghapus aset ini? Tindakan ini tidak dapat dibatalkan.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await assetService.deleteAsset(asset.id);
          fetchAssets();
        } catch (error: any) {
          console.error("Failed to delete asset", error);
          const apiErrorMessage = error?.response?.data?.error || 'Terjadi kesalahan saat menghapus aset.';
          setTimeout(() => {
            setModalConfig({
              isOpen: true,
              title: 'Gagal Menghapus',
              message: apiErrorMessage,
              type: 'danger',
              hideCancel: true,
              onConfirm: closeModalState
            });
          }, 300);
        }
      }
    });
  };

  const openAddModal = () => {
    setSelectedAsset(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const openQRModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsQRModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsQRModalOpen(false);
    setIsReqDeletionModalOpen(false);
    setSelectedAsset(undefined);
  };

  const handleSaveSuccess = () => {
    closeModal();
    fetchAssets();
  };

  const predefinedCategories = ['IT', 'Elektronik', 'Furnitur', 'Kendaraan', 'Alat Kantor'];
  const categories = predefinedCategories;
  const statuses = ['Tersedia', 'Tidak Tersedia', 'Dipinjam', 'Maintenance', 'Arsip'];
  const conditions = ['Baik', 'Rusak Ringan', 'Rusak Berat'];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, statusFilter, conditionFilter]);

  const currentAssets = assets;

  const getStatusStyle = (status: AssetStatus) => {
    switch (status) {
      case 'Tersedia': return { text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30' };
      case 'Tidak Tersedia': return { text: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/30' };
      case 'Dipinjam': return { text: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/30' };
      case 'Maintenance': return { text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30' };
      case 'Arsip': return { text: 'text-zinc-700 dark:text-zinc-400', bg: 'bg-zinc-50 dark:bg-zinc-500/10', border: 'border-zinc-200 dark:border-zinc-500/30' };
      default: return { text: 'text-zinc-700 dark:text-zinc-400', bg: 'bg-zinc-50 dark:bg-zinc-500/10', border: 'border-zinc-200 dark:border-zinc-500/30' };
    }
  };

  const getConditionStyle = (cond: AssetCondition) => {
    switch (cond) {
      case 'Baik': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
      case 'Rusak Ringan': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
      case 'Rusak Berat': return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30';
      default: return 'bg-zinc-50 dark:bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-500/30';
    }
  };

  const handlePrevImage = (e: React.MouseEvent, assetId: string, total: number) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndexes(prev => ({
      ...prev,
      [assetId]: ((prev[assetId] || 0) - 1 + total) % total
    }));
  };

  const handleNextImage = (e: React.MouseEvent, assetId: string, total: number) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndexes(prev => ({
      ...prev,
      [assetId]: ((prev[assetId] || 0) + 1) % total
    }));
  };

  return (
    <>
      <div className="space-y-5" id="inventory-workspace">
        <PageHeaderCard
          moduleBadge="Modul Master Data"
          badgeColorClass="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800"
          title="Daftar Inventaris Aset"
          description="Kelola seluruh aset perusahaan, pantau ketersediaan, dan catat kondisi barang secara real-time."
          icon={Box}
          iconColorClass="text-purple-600"
          rightContent={
            <>
              <div className="hidden sm:block text-center bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-100 dark:border-gray-700 min-w-[100px]">
                <span className="text-[10px] text-gray-400 block font-semibold uppercase">Total Tersedia</span>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{totalAssets} Unit</span>
              </div>
              <div className="flex flex-col gap-2.5 w-full sm:w-auto">
                <Link href="/tracking" className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-all justify-center">
                  <ScanLine className="w-4 h-4" /> Scanner QR Code
                </Link>
                {currentUser?.role === 'Administrator' && (
                  <button
                    onClick={openAddModal}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gray-900 dark:bg-white border border-gray-950 dark:border-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-lg transition-all shadow-xs justify-center"
                  >
                    <Plus className="w-4 h-4" /> Tambah Aset Baru
                  </button>
                )}
              </div>
            </>
          }
        />

        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-gray-800/50 pb-2">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter Pencarian</span>
          </div>
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative w-full lg:w-1/4">
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5" />
              <input
                placeholder="Cari ID, Nama, Serial, Lokasi..."
                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-xs rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full lg:w-3/4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2">
                <span className="text-[10px] lg:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Kategori</span>
                <select
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-sm rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500 [&>option]:bg-white dark:[&>option]:bg-gray-800"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="Semua">Semua</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2">
                <span className="text-[10px] lg:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Status</span>
                <select
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-sm rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500 [&>option]:bg-white dark:[&>option]:bg-gray-800"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="Semua">Semua</option>
                  {statuses.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2">
                <span className="text-[10px] lg:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Kondisi</span>
                <select
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-sm rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500 [&>option]:bg-white dark:[&>option]:bg-gray-800"
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}
                >
                  <option value="Semua Kondisi">Semua</option>
                  {conditions.map(cond => <option key={cond} value={cond}>{cond}</option>)}
                </select>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2">
                <span className="text-[10px] lg:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Lokasi</span>
                <select
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-sm rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500 [&>option]:bg-white dark:[&>option]:bg-gray-800"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                >
                  <option value="Semua Lokasi">Semua</option>
                  <option value="Jakarta">Jakarta</option>
                  <option value="Bandarlampung">Bandarlampung</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div 
                key={i} 
                className="bg-white dark:bg-[#1A1F2E] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between min-h-[340px] sm:h-[380px]"
              >
                <div>
                  <Skeleton className="h-40 sm:h-48 w-full rounded-none" />
                  <div className="p-4 sm:p-5">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-10 w-full mb-5" />
                    <div className="flex gap-2 mb-2">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="border-t border-zinc-100 dark:border-zinc-800/50 mx-4 sm:mx-5 py-3 sm:py-4 flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : currentAssets.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#1A1F2E] rounded-xl shadow-xs border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-500 dark:text-zinc-400"
          >
            Tidak ada aset yang ditemukan.
          </motion.div>
        ) : (
          <>
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
            >
              <AnimatePresence mode="popLayout">
                {currentAssets.map((asset, index) => {
                  const statusStyle = getStatusStyle(asset.status);
                  const condStyle = getConditionStyle(asset.condition);

                  const serialNumberDisplay = asset.serial_number ? `SN: ${asset.serial_number}` : 'SN: -';
                  const descriptionDisplay = asset.description || `Aset ini masuk dalam kategori ${asset.category} dan saat ini dialokasikan di ${asset.location}.`;

                  const currentImageIdx = asset.images && asset.images.length > 0
                    ? (imageIndexes[asset.id] || 0) % asset.images.length
                    : 0;
                  const currentImage = asset.images && asset.images.length > 0
                    ? asset.images[currentImageIdx]
                    : undefined;
                  const currentImageSrc = currentImage ? resolveAssetImageUrl(currentImage as any) : '';

                  return (
                    <motion.div 
                      layout
                      key={asset.id} 
                      className="bg-white dark:bg-[#1A1F2E] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <div>
                      <div className="relative h-40 sm:h-48 w-full bg-zinc-100 dark:bg-zinc-800 group overflow-hidden flex items-center justify-center">
                        {asset.images && asset.images.length > 0 && currentImageSrc ? (
                          <>
                            <AnimatePresence initial={false}>
                              <motion.div
                                key={currentImageIdx}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 w-full h-full"
                              >
                                <Image
                                  src={currentImageSrc}
                                  alt={asset.name}
                                  fill
                                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              </motion.div>
                            </AnimatePresence>

                            {asset.images.length > 1 && (
                              <>
                                <button
                                  onClick={(e) => handlePrevImage(e, asset.id, asset.images!.length)}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  aria-label="Previous image"
                                >
                                  <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={(e) => handleNextImage(e, asset.id, asset.images!.length)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  aria-label="Next image"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>

                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {asset.images.map((_, idx) => (
                                    <span
                                      key={idx}
                                      className={`w-1.5 h-1.5 rounded-full transition-colors ${(imageIndexes[asset.id] || 0) === idx ? 'bg-white' : 'bg-white/50'}`}
                                    ></span>
                                  ))}
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-500 font-medium">No Image</span>
                        )}

                        <div className="absolute top-3 left-3">
                          <span className="bg-black/60 backdrop-blur-md text-white/90 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border border-white/10 shadow-sm pointer-events-none">
                            {asset.category}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="bg-black/60 backdrop-blur-md text-white/90 text-[11px] font-mono font-bold tracking-wider px-2.5 py-1 rounded border border-white/10 shadow-sm pointer-events-none">
                            {asset.id}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5">
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-[16px] sm:text-[17px] line-clamp-1 mb-1" title={asset.name}>
                          {asset.name}
                        </h3>
                        <p className="text-[11px] sm:text-[12px] font-mono text-zinc-500 dark:text-zinc-400 mb-3 sm:mb-4">{serialNumberDisplay}</p>

                        <div 
                          className="text-[12px] sm:text-[13px] text-zinc-600 dark:text-zinc-300 line-clamp-2 h-9 sm:h-10 mb-4 sm:mb-5 leading-relaxed break-words cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          onClick={() => {
                            if (descriptionDisplay) {
                              setSelectedAssetDesc(descriptionDisplay);
                              setIsDescModalOpen(true);
                            }
                          }}
                        >
                          {descriptionDisplay}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium border flex items-center gap-1.5 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
                            {asset.status}
                          </span>
                          {asset.has_pending_deletion && (
                            <span className="text-[11px] px-2.5 py-1 rounded-full font-bold border flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" title="Aset sedang dalam proses pengajuan penghapusan">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Pengajuan Hapus
                            </span>
                          )}
                          <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium border flex items-center gap-1 ${condStyle}`}>
                            Kondisi: {asset.condition}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-zinc-100 dark:border-zinc-800/50 mx-4 sm:mx-5 py-3 sm:py-4 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 text-[12px] sm:text-[13px]">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate max-w-[120px] font-medium">{asset.location}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openQRModal(asset)} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition" title="Lihat QR Code Tracking">
                          <QrCode className="w-4 h-4" />
                        </button>
                        {currentUser?.role === 'Administrator' && (
                          <>
                            <button
                              onClick={() => openEditModal(asset)}
                              className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition" title="Ubah Aset"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(asset)}
                              className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition" title="Hapus Aset"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              </AnimatePresence>
            </motion.div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalAssets}
              itemsPerPage={itemsPerPage}
              onPageChange={(p) => setCurrentPage(p)}
              itemName="aset"
              isLoading={isLoading}
            />
          </>
        )}
      </div>

      <AssetFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveSuccess}
        asset={selectedAsset}
        currentUser={currentUser}
      />

      <PrintQRModal
        isOpen={isQRModalOpen}
        onClose={closeModal}
        asset={selectedAsset}
      />

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeModalState}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        hideCancel={modalConfig.hideCancel}
        confirmText={modalConfig.type === 'danger' && !modalConfig.hideCancel ? 'Hapus' : 'Oke'}
      />

      <RequestDeletionModal
        isOpen={isReqDeletionModalOpen}
        onClose={closeModal}
        onSave={() => {
          closeModal();
          fetchAssets();
          setModalConfig({
            isOpen: true,
            title: 'Berhasil Mengajukan',
            message: 'Permohonan penghapusan aset berhasil diajukan ke Supervisor.',
            type: 'info',
            hideCancel: true,
            onConfirm: closeModalState
          });
        }}
        asset={selectedAsset}
      />

      <TextModal
        isOpen={isDescModalOpen}
        onClose={() => setIsDescModalOpen(false)}
        title="Detail Deskripsi Aset"
        content={selectedAssetDesc}
      />
    </>
  );
}
