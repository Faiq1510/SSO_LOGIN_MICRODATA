"use client";

import React, { useEffect, useState } from 'react';
import { Asset, User } from '@/types';
import { assetService } from '@/services/asset.service';
import { Search, ChevronLeft, ChevronRight, ArchiveRestore, Clock, History } from 'lucide-react';
import PageHeaderCard from '@/components/ui/PageHeaderCard';
import Pagination from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function TrashInventoryPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);

  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      const data = await assetService.getDeletedAssets({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
      });

      setAssets(data.data);
      setTotalPages(data.total_pages);
      setTotalAssets(data.total);
    } catch (error) {
      console.error("Failed to fetch deleted assets", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchAssets();
    }, 300);
    return () => clearTimeout(handler);
  }, [currentPage, searchQuery]);

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

  const handleRestore = async (assetId: string) => {
    if (currentUser?.role === 'Administrator') {
      try {
        await assetService.restoreAsset(assetId);
        fetchAssets();
      } catch (error) {
        console.error("Failed to restore asset", error);
        alert("Gagal mengembalikan aset.");
      }
    } else {
      alert("Hanya Administrator yang dapat mengembalikan aset.");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeaderCard
        moduleBadge="Modul Master Data"
        badgeColorClass="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-855"
        title="Recycle Bin (Trash)"
        description="Aset yang dihapus akan tersimpan di sini sementara sebelum benar-benar dihilangkan dari sistem."
        icon={History}
        iconColorClass="text-red-600"
        rightContent={
          <div className="hidden sm:block text-center bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-100 dark:border-gray-700 min-w-[100px]">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-semibold uppercase">Total Terhapus</span>
            <span className="text-lg font-bold text-red-600 dark:text-red-400">{totalAssets} Unit</span>
          </div>
        }
      />

      {/* Filter Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl shadow-xs border border-gray-100 dark:border-gray-800">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="Cari aset yang terhapus..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            // Loading Skeletons
            Array.from({ length: itemsPerPage }).map((_, idx) => (
              <motion.div
                key={`skeleton-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-[#1A1F2E] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between p-4 space-y-4 min-h-[340px] sm:h-[380px]"
              >
                <Skeleton className="h-40 sm:h-48 w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </motion.div>
            ))
          ) : assets.length > 0 ? (
            // Deleted Assets List
            assets.map((asset, index) => (
              <motion.div
                key={asset.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="group bg-white dark:bg-[#1A1F2E] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Image Placeholder */}
                  <div className="relative h-40 sm:h-48 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
                    <div className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-50 bg-zinc-200 dark:bg-zinc-800/40 flex items-center justify-center">
                      <span className="text-zinc-400 dark:text-zinc-500 font-medium text-sm">Deleted Image</span>
                    </div>
                    
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider border bg-white/95 dark:bg-black/60 backdrop-blur-sm text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30">
                        Deleted
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="bg-black/60 backdrop-blur-md text-white/90 text-[11px] font-mono font-bold tracking-wider px-2.5 py-1 rounded border border-white/10 shadow-sm pointer-events-none">
                        {asset.id}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5">
                    {/* Hover state warna di bawah ini sudah dihapus */}
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-[16px] sm:text-[17px] line-clamp-1 mb-1" title={asset.name}>
                      {asset.name}
                    </h3>
                    <p className="text-[11px] sm:text-[12px] font-semibold text-zinc-500 dark:text-zinc-400 mb-3">{asset.category}</p>

                    <div className="mt-4 space-y-2 text-[12px] sm:text-[13px] text-zinc-600 dark:text-zinc-300 flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                        <span className="truncate">
                          Dihapus Pada: {asset.deleted_at ? format(new Date(asset.deleted_at), 'dd MMM yyyy HH:mm', { locale: id }) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="border-t border-zinc-100 dark:border-zinc-800/50 mx-4 sm:mx-5 py-3 sm:py-4 flex justify-end">
                  <button
                    onClick={() => handleRestore(asset.id)}
                    className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition"
                    title="Restore Asset"
                  >
                    <ArchiveRestore className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            // Empty State
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-12 text-center bg-white dark:bg-[#1A1F2E] rounded-xl shadow-xs border border-zinc-200 dark:border-zinc-800 p-8 sm:p-12"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
                <ArchiveRestore className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">Tidak ada aset di Recycle Bin</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Aset yang dihapus akan muncul di sini.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination Container */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalAssets}
        itemsPerPage={itemsPerPage}
        onPageChange={(p) => setCurrentPage(p)}
        itemName="data"
        isLoading={isLoading}
      />
    </div>
  );
}