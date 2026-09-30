/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Package, CheckSquare, HandHelping, Wrench, BarChart3, PieChart, TrendingUp,
  ShieldCheck, Users, Sliders, Menu, X, LogOut, AlertTriangle, Bell,
  User as UserIcon
} from 'lucide-react';
import { User, UserRole, Asset } from '@/types';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DashboardStats } from '@/services/dashboard.service';
import { motion } from 'framer-motion';

// ============================================================================
// DASHBOARD LAYOUT COMPONENT
// ============================================================================

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const approvalPillCount = 0;

  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('saims_token');
    const savedUser = localStorage.getItem('saims_user');

    if (savedToken && savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    } else {
      router.push('/login');
    }
    setIsAuthLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('saims_token');
    localStorage.removeItem('saims_user');
    document.cookie = 'saims_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'saims_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setCurrentUser(null);
    setShowLogoutConfirm(false);
    router.push('/');
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'System Overview';
      case 'inventory': return 'Inventory Management';
      case 'borrow': return 'Peminjaman Aset';
      case 'maintenance': return 'Perbaikan & Maintenance';
      case 'approval': return 'Persetujuan Peminjaman & Penghapusan';
      case 'users': return 'Manajemen Pengguna Sistem';
      case 'profile': return 'Profil & Pengaturan Akun';
      default: return 'Dashboard';
    }
  };

  if (isAuthLoading || !currentUser) {
    return <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-950 flex items-center justify-center font-semibold text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  const currentRole = currentUser.role as UserRole;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-950 text-[#1A1A1A] dark:text-gray-100 font-sans antialiased flex flex-col md:flex-row relative" id="saims-main-shell">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside className={`w-64 bg-white dark:bg-gray-900 border-r border-[#E5E7EB] dark:border-gray-800 flex flex-col shrink-0 fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-[#E5E7EB] dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center w-full">
              <Image
                src="/microdata-logo.png"
                alt="Microdata Logo"
                width={150}
                height={40}
                style={{ width: 'auto' }}
                className="object-contain h-10 invert dark:invert-0 hue-rotate-180 dark:hue-rotate-0 transition-all duration-300"
              />
            </div>
            <button
              className="md:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase mt-1">Smart Asset & Inventory</p>
        </div>

        <nav className="p-4 flex-1 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-2.5">
            Menu Utama
          </p>

          <button onClick={() => { onTabChange('dashboard'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}`}
          >
            <BarChart3 className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
            <span>Dashboard</span>
          </button>

          {currentRole === 'Administrator' && (
            <button onClick={() => { onTabChange('users'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'users' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
              <span>Kelola Pengguna</span>
            </button>
          )}

          <button onClick={() => { onTabChange('profile'); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}`}
          >
            <Sliders className={`w-4 h-4 ${activeTab === 'profile' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
            <span>Profil & Pengaturan</span>
          </button>
        </nav>

        <div className="p-4 border-t border-[#E5E7EB] dark:border-gray-800 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 border border-white dark:border-gray-800 shadow-sm flex items-center justify-center text-white shrink-0 overflow-hidden">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate leading-none">{currentUser.name}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate leading-none">{currentUser.role}</p>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-[#E5E7EB] dark:border-gray-800 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-tight font-display">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:flex items-center gap-2 text-[11px] font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-100 dark:border-green-800/30">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              WhatsApp Bot Online
            </span>
            <ThemeToggle />
            <div className="relative">
              <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900"></span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8 pt-2 space-y-6 flex-1 w-full max-w-7xl mx-auto">
          {children}
        </div>

        <footer className="bg-white dark:bg-gray-900 border-t border-[#E5E7EB] dark:border-gray-800 text-gray-400 dark:text-gray-500 py-5 text-center text-xs mt-auto">
          <p className="font-semibold text-gray-600 dark:text-gray-400">SAIMS — Smart Asset & Inventory Management System</p>
          <p className="text-gray-400 mt-1">Sistem Terintegrasi Notifikasi WhatsApp Gateway, QR-Asset Tracking & Multi-level Approval • 2026</p>
        </footer>
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-xl shadow-gray-900/10 dark:shadow-black/50 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800/60">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">Konfirmasi Keluar</h3>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
              Apakah Anda yakin ingin keluar dari aplikasi? Anda harus login kembali untuk mengakses sistem.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DASHBOARD ANALYTICS COMPONENT
// ============================================================================

const AnimatedCounter = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1500;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(easeProgress * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <>{count}</>;
};

interface DashboardAnalyticsProps {
  stats: DashboardStats;
}

export default function DashboardAnalytics({ stats }: DashboardAnalyticsProps) {
  const [mounted, setMounted] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredCondition, setHoveredCondition] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Calculate counter stats
  const totalAssets = stats.total_assets;
  const activeAssets = stats.available_assets;
  const borrowedAssets = stats.borrowed_assets;
  const maintenanceAssets = stats.maintenance_assets;

  // Percentage calculations
  const activePct = totalAssets > 0 ? Math.round((activeAssets / totalAssets) * 100) : 0;
  const borrowedPct = totalAssets > 0 ? Math.round((borrowedAssets / totalAssets) * 100) : 0;
  const maintenancePct = totalAssets > 0 ? Math.round((maintenanceAssets / totalAssets) * 100) : 0;

  // 2. Category distribution
  const categoriesList = (stats.categories_stats || []).map((item) => ({
    name: item.category,
    count: item.count,
    percentage: totalAssets > 0 ? Math.round((item.count / totalAssets) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  // 3. Condition distribution
  const conditionMapObject: Record<string, number> = {
    'Baik': 0,
    'Rusak Ringan': 0,
    'Rusak Berat': 0
  };

  if (stats.conditions_stats) {
    stats.conditions_stats.forEach((item) => {
      if (conditionMapObject[item.condition] !== undefined) {
        conditionMapObject[item.condition] = item.count;
      }
    });
  }

  const conditionsList = Object.entries(conditionMapObject).map(([name, count]) => ({
    name,
    count,
    colorClass: name === 'Baik' ? 'bg-emerald-500' : name === 'Rusak Ringan' ? 'bg-amber-500' : 'bg-red-500',
    borderColor: name === 'Baik' ? '#10b981' : name === 'Rusak Ringan' ? '#f59e0b' : '#ef4444',
    percentage: totalAssets > 0 ? Math.round((count / totalAssets) * 100) : 0,
    exactPercentage: totalAssets > 0 ? (count / totalAssets) * 100 : 0,
  }));

  // Find most populated category
  const topCategory = categoriesList[0]?.name || 'Belum Ada';

  return (
    <div className="space-y-6" id="dashboard-analytics">
      {/* 4 Stats Cards Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {/* Total Assets Card */}
        <div id="stat-total" className="bg-white dark:bg-gray-900 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 rounded-xl p-4 sm:p-5 flex items-start justify-between flex-col sm:flex-row gap-3 sm:gap-0">
          <div className="space-y-1">
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 truncate">Total Aset</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight"><AnimatedCounter value={totalAssets} /></h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 pt-2">Terdaftar di database pusat</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Active/Tersedia Assets Card */}
        <div id="stat-active" className="bg-white dark:bg-gray-900 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 rounded-xl p-4 sm:p-5 flex items-start justify-between flex-col sm:flex-row gap-3 sm:gap-0">
          <div className="space-y-1 w-full sm:max-w-[120px]">
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 truncate">Aktif & Tersedia</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-green-600 dark:text-green-400 tracking-tight"><AnimatedCounter value={activeAssets} /></h3>
            <div className="flex items-center gap-2 pt-2">
              <div className="flex-1 h-1 bg-green-100 dark:bg-green-900/30 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${mounted ? activePct : 0}%` }} />
              </div>
              <p className="text-[10px] font-bold text-green-600 dark:text-green-400"><AnimatedCounter value={activePct} />%</p>
            </div>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800/30">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Borrowed Assets Card */}
        <div id="stat-borrowed" className="bg-white dark:bg-gray-900 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 rounded-xl p-4 sm:p-5 flex items-start justify-between flex-col sm:flex-row gap-3 sm:gap-0">
          <div className="space-y-1 w-full sm:max-w-[120px]">
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 truncate">Dipinjam</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight"><AnimatedCounter value={borrowedAssets} /></h3>
            <div className="flex items-center gap-2 pt-2">
              <div className="flex-1 h-1 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${mounted ? borrowedPct : 0}%` }} />
              </div>
              <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400"><AnimatedCounter value={borrowedPct} />%</p>
            </div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30">
            <HandHelping className="w-5 h-5" />
          </div>
        </div>

        {/* Maintenance Assets Card */}
        <div id="stat-maintenance" className="bg-white dark:bg-gray-900 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 rounded-xl p-4 sm:p-5 flex items-start justify-between flex-col sm:flex-row gap-3 sm:gap-0">
          <div className="space-y-1 w-full sm:max-w-[120px]">
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 truncate">Maintenance</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-red-500 dark:text-red-400 tracking-tight"><AnimatedCounter value={maintenanceAssets} /></h3>
            <div className="flex items-center gap-2 pt-2">
              <div className="flex-1 h-1 bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${mounted ? maintenancePct : 0}%` }} />
              </div>
              <p className="text-[10px] font-bold text-red-500 dark:text-red-400"><AnimatedCounter value={maintenancePct} />%</p>
            </div>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500 dark:text-red-400 border border-red-100 dark:border-red-800/30">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </motion.div>

      {/* Two Columns for Visual Charts */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Left Column: Category Chart */}
        <div className="lg:col-span-2 min-w-0 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Distribusi Kategori Aset</h3>
              </div>
              <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded font-medium">
                Asset Terbanyak: {topCategory}
              </span>
            </div>

            {/* Custom interactive vertical bars styling */}
            <div className="space-y-4 pt-2">
              {categoriesList.length === 0 ? (
                <p className="text-xs text-gray-450 dark:text-gray-500 text-center py-6">Belum ada data visual</p>
              ) : (
                categoriesList.map((item, index) => (
                  <div
                    key={item.name}
                    className={`space-y-1.5 cursor-pointer transition-all duration-300 ${hoveredCategory && hoveredCategory !== item.name ? 'opacity-40 grayscale-[50%]' : 'opacity-100'}`}
                    onMouseEnter={() => setHoveredCategory(item.name)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <div className="flex justify-between text-xs font-medium text-gray-700 dark:text-gray-300">
                      <span className={`transition-colors ${hoveredCategory === item.name ? 'font-bold text-gray-900 dark:text-white' : ''}`}>{item.name}</span>
                      <span className={`font-semibold transition-colors ${hoveredCategory === item.name ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        <span><AnimatedCounter value={item.count} /> Aset (<AnimatedCounter value={item.percentage} />%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${index === 0 ? 'bg-blue-600' :
                          index === 1 ? 'bg-green-500' :
                            index === 2 ? 'bg-amber-500' : 'bg-gray-400 dark:bg-gray-600'
                          } ${hoveredCategory === item.name ? 'brightness-110' : ''}`}
                        style={{ width: `${mounted ? item.percentage : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-6 flex justify-between items-center text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              Kelompok aset didominasi peralatan elektronik
            </span>
          </div>
        </div>

        {/* Right Column: Condition Chart */}
        <div className="min-w-0 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Kondisi Aset</h3>
              </div>
            </div>

            {/* Simulated Donut Chart using responsive clean graphics */}
            <div className="flex flex-col items-center gap-6 py-4">
              {/* Left side: SVG Donut */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* SVG circular donut visualization */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="currentColor"
                    className="text-gray-200 dark:text-gray-800"
                    strokeWidth="3"
                  />
                  {/* Good Condition Stroke */}
                  {conditionsList.map((cond, i) => {
                    // Accumulate stroke offset mathematically
                    let offset = 0;
                    for (let j = 0; j < i; j++) {
                      offset += conditionsList[j].exactPercentage;
                    }
                    if (cond.percentage === 0) return null;
                    const strokeColor = cond.name === 'Baik' ? '#10b981' : cond.name === 'Rusak Ringan' ? '#f59e0b' : '#ef4444';
                    return (
                      <circle
                        key={cond.name}
                        cx="18"
                        cy="18"
                        r="15.91549430918954"
                        fill="transparent"
                        stroke={strokeColor}
                        strokeWidth={hoveredCondition === cond.name ? "4.5" : "3"}
                        strokeDasharray={mounted ? `${cond.exactPercentage} ${100 - cond.exactPercentage}` : `0 100`}
                        strokeDashoffset={100 - offset}
                        className={`transition-all duration-1000 ease-out cursor-pointer hover:drop-shadow-md ${hoveredCondition && hoveredCondition !== cond.name ? 'opacity-30' : 'opacity-100'}`}
                        onMouseEnter={() => setHoveredCondition(cond.name)}
                        onMouseLeave={() => setHoveredCondition(null)}
                      />
                    );
                  })}
                </svg>
                {/* Inside details text indicator */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className={`absolute flex flex-col items-center justify-center transition-all duration-300 ${hoveredCondition ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                    <span className="text-xl font-extrabold text-gray-900 dark:text-white"><AnimatedCounter value={totalAssets} /></span>
                    <p className="text-[8px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-bold mt-0.5">Total</p>
                  </div>
                  <div className={`absolute flex flex-col items-center justify-center transition-all duration-300 ${hoveredCondition ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                    <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                      {hoveredCondition ? conditionsList.find(c => c.name === hoveredCondition)?.count : 0}
                    </span>
                    <p className="text-[8px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-bold max-w-[90px] leading-tight mx-auto text-center mt-0.5">
                      {hoveredCondition}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right side: Legend and exact stats */}
              <div className="w-full space-y-2">
                {conditionsList.map((cond) => {
                  const barColor = cond.name === 'Baik' ? 'bg-green-500' : cond.name === 'Rusak Ringan' ? 'bg-amber-500' : 'bg-red-500';
                  return (
                    <div
                      key={cond.name}
                      className={`space-y-1 cursor-pointer transition-all duration-300 ${hoveredCondition && hoveredCondition !== cond.name ? 'opacity-40 grayscale-[50%]' : 'opacity-100'}`}
                      onMouseEnter={() => setHoveredCondition(cond.name)}
                      onMouseLeave={() => setHoveredCondition(null)}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${barColor} transition-transform ${hoveredCondition === cond.name ? 'scale-125' : ''}`} />
                          <span className={`transition-colors font-medium ${hoveredCondition === cond.name ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-600 dark:text-gray-300'}`}>{cond.name}</span>
                        </div>
                        <span className={`font-bold transition-transform ${hoveredCondition === cond.name ? 'text-gray-900 dark:text-white scale-110 origin-right' : 'text-gray-900 dark:text-white'}`}>
                          <span><AnimatedCounter value={cond.percentage} />%</span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 h-1 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} transition-all duration-1000 ease-out ${hoveredCondition === cond.name ? 'brightness-110' : ''}`} style={{ width: `${mounted ? cond.percentage : 0}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3 mt-2 leading-relaxed">
            *Aset Rusak Berat memerlukan tindakan penghapusan atau rujukan servis.
          </p>
        </div>
      </motion.div>
    </div>
  );
}