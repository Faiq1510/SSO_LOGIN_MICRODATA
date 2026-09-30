'use client';

import React, { useState, useEffect } from 'react';
import DashboardAnalytics from '@/components/dashboard/DashboardAnalytics';
import { dashboardService, DashboardStats } from '@/services/dashboard.service';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (err: any) {
        setError(err?.message || 'Gagal memuat statistik dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-gray-500 dark:text-gray-400 font-medium">Memuat statistik dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-4 text-center my-8">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return <DashboardAnalytics stats={stats} />;
}
