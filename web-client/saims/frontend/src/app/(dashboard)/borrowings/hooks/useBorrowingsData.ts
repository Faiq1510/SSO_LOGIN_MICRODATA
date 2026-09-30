import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/lib/axios';

export interface Asset {
  id: string;
  name: string;
  category: string;
  status: string;
  location: string;
  has_pending_deletion?: boolean;
}

export interface Borrowing {
  id: string;
  user_id: string;
  borrower_name: string;
  asset_id: string;
  asset_name: string;
  start_date: string;
  end_date: string;
  purpose: string;
  status: string;
  rejection_reason: string;
  created_at: string;
}

interface UseBorrowingsDataProps {
  currentPage: number;
  debouncedSearch: string;
  adminTab: 'pending' | 'active' | 'archived';
  userRole: string;
  ITEMS_PER_PAGE: number;
}

export function useBorrowingsData({
  currentPage,
  debouncedSearch,
  adminTab,
  userRole,
  ITEMS_PER_PAGE
}: UseBorrowingsDataProps) {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBorrowings, setTotalBorrowings] = useState(0);
  const [isLoadingBorrowings, setIsLoadingBorrowings] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchBorrowings = useCallback(async (silent = false) => {
    if (!userRole) return;
    if (!silent) setIsLoadingBorrowings(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());
      if (debouncedSearch) params.append('search', debouncedSearch);

      // Map admin tabs to backend status filter
      if (userRole === 'Administrator') {
        if (adminTab === 'pending') params.append('status', 'Pending_Supervisor');
        else if (adminTab === 'active') params.append('status', 'Approved');
        else params.append('status', 'history');
      }

      const res = await axiosInstance.get(`/borrowings?${params.toString()}`);
      setBorrowings(res.data?.data || []);
      setTotalPages(res.data?.total_pages || 1);
      setTotalBorrowings(res.data?.total || 0);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Gagal memuat data peminjaman';
      setFetchError(msg);
      console.error('[fetchBorrowings]', err);
    } finally {
      if (!silent) setIsLoadingBorrowings(false);
    }
  }, [currentPage, debouncedSearch, adminTab, userRole, ITEMS_PER_PAGE]);

  // Initial and reactive fetch
  useEffect(() => {
    fetchBorrowings();
  }, [fetchBorrowings]);

  // Smart Polling & Visibility Change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchBorrowings(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchBorrowings(true);
      }
    }, 30000); // 30 seconds

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [fetchBorrowings]);

  return {
    borrowings,
    totalPages,
    totalBorrowings,
    isLoadingBorrowings,
    fetchError,
    fetchBorrowings
  };
}
