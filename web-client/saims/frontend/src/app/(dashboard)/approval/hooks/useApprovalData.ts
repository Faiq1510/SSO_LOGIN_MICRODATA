import { useState, useEffect } from 'react';
import { Borrowing, Asset } from '@/types';
import axiosInstance from '@/lib/axios';

export function useApprovalData() {
  const [pendingBorrowings, setPendingBorrowings] = useState<Borrowing[]>([]);
  const [returnBorrowings, setReturnBorrowings] = useState<Borrowing[]>([]);
  const [damagedAssets, setDamagedAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setFetchError(null);
    try {
      const [borrowingsRes, assetsRes] = await Promise.all([
        axiosInstance.get('/borrowings?limit=1000'),
        axiosInstance.get('/assets?limit=1000')
      ]);

      const pending = (borrowingsRes.data?.data || []).filter((b: Borrowing) => b.status === 'Pending_Supervisor');
      setPendingBorrowings(pending);

      const toReturn = (borrowingsRes.data?.data || []).filter((b: Borrowing) => b.status === 'Menunggu_Kembali');
      setReturnBorrowings(toReturn);

      const damaged = (assetsRes.data?.data || []).filter((a: Asset) => a.condition === 'Rusak Berat' && a.status !== 'Arsip');
      setDamagedAssets(damaged);
    } catch (error: any) {
      const msg = error?.response?.data?.error || error.message || 'Terjadi kesalahan saat memuat data';
      setFetchError(msg);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData(true);
      }
    }, 30000); // 30 seconds

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);

  return {
    pendingBorrowings,
    returnBorrowings,
    damagedAssets,
    isLoading,
    fetchError,
    fetchData
  };
}
