'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package, CheckSquare, HandHelping, Wrench, BarChart3, PieChart, TrendingUp,
  ShieldCheck, Users, Sliders, Menu, X, LogOut, AlertTriangle, Bell, QrCode,
  User as UserIcon, ClipboardList, Trash2, ArchiveRestore
} from 'lucide-react';
import { User, UserRole, Notification } from '@/types';
import { ThemeToggle } from '@/components/ThemeToggle';
import { notificationService } from '@/services/notificationService';
import { authService } from '@/services/auth.service';
import PageLoading from '@/components/ui/PageLoading';

const NavItem = ({ href, icon: Icon, label, requiresRole, currentRole, pathname, isCollapsed, setMobileSidebarOpen, badge }: { href: string, icon: React.ElementType, label: string, requiresRole?: UserRole[], currentRole: UserRole, pathname: string, isCollapsed: boolean, setMobileSidebarOpen: (v: boolean) => void, badge?: number | boolean }) => {
  if (requiresRole && !requiresRole.includes(currentRole)) return null;
  
  const isActive = href === '/dashboard' 
  ? pathname === href 
  : pathname.startsWith(href) && 
    (pathname.length === href.length || pathname[href.length] === '/') && 
    !(href === '/inventory' && pathname.startsWith('/inventory/trash')) &&
    !(href === '/approval' && pathname.startsWith('/approval/deletions'));
  return (
    <Link href={href} onClick={() => setMobileSidebarOpen(false)}
      className={`relative flex items-center transition-all font-medium ${isCollapsed ? 'justify-center w-11 h-11 mx-auto rounded-xl' : 'w-full gap-3 px-3 py-2.5 rounded-lg text-sm'} ${isActive ? 'bg-orange-50 dark:bg-blue-900/30 text-orange-600 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}`}
      title={isCollapsed ? label : undefined}
    >
      <div className="relative">
        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-orange-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
        {isCollapsed && badge ? (
          <span className={`absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-red-500 font-bold text-white ring-2 ring-white dark:ring-gray-900 ${typeof badge === 'number' ? 'h-3 w-3 text-[8px]' : 'h-2.5 w-2.5'}`}>
            {typeof badge === 'number' ? (badge > 9 ? '9+' : badge) : ''}
          </span>
        ) : null}
      </div>
      {!isCollapsed && <span className="truncate flex-1">{label}</span>}
      {!isCollapsed && badge ? (
        <span className={`shrink-0 flex items-center justify-center rounded-full bg-red-500 text-white shadow-sm ${typeof badge === 'number' ? 'h-5 min-w-[20px] px-1 text-[10px] font-bold' : 'h-2 w-2'}`}>
          {typeof badge === 'number' ? (badge > 99 ? '99+' : badge) : ''}
        </span>
      ) : null}
    </Link>
  );
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getMyNotifications();
      setNotifications(res.data || []);
      setUnreadCount(res.unread_count || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('saims_user');

    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setIsAuthLoading(false);
        fetchNotifications();
      } catch (error) {
        console.error("Failed to parse user data from localStorage:", error);
        localStorage.removeItem('saims_user');
        localStorage.removeItem('saims_token');
        setIsRedirecting(true);
        // Clear HttpOnly cookies by hitting backend logout
        authService.logout().finally(() => {
          router.replace('/login');
        });
      }
    } else {
      // No user — redirect to login
      setIsRedirecting(true);
      localStorage.removeItem('saims_token');
      // Clear HttpOnly cookies by hitting backend logout
      authService.logout().finally(() => {
        router.replace('/login');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependensi kosong untuk mencegah infinite loop

  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(fetchNotifications, 15000); // Polling notifikasi setiap 15 detik
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (notifications.length === 0 || !currentUser) return;

    let typesToClear: string[] = [];
    if (pathname.startsWith('/approval/deletions')) {
      typesToClear = ['deletion'];
    } else if (pathname.startsWith('/approval')) {
      typesToClear = ['borrowing'];
    } else if (pathname.startsWith('/maintenance')) {
      typesToClear = ['maintenance', 'payment'];
    } else if (pathname.startsWith('/borrowings') && currentUser.role === 'Staff') {
      typesToClear = ['borrowing'];
    }

    if (typesToClear.length > 0) {
      const unread = notifications.filter(n => !n.is_read && typesToClear.includes(n.type));
      if (unread.length > 0) {
        // Mark all matching as read in the UI instantly
        setNotifications(prev => prev.map(n => typesToClear.includes(n.type) ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - unread.length));
        
        // Background update to backend sequentially to avoid bursting connections
        (async () => {
          for (const n of unread) {
            try {
              await notificationService.markAsRead(n.id);
            } catch (err) {
              console.error(err);
            }
          }
        })();
      }
    }
  }, [pathname, notifications, currentUser]);

  const handleReadNotification = async (notif: Notification) => {
    // Determine target path based on notification type and user role
    let targetPath = '';
    const isApprover = currentUser?.role === 'Administrator' || currentUser?.role === 'Supervisor';
    
    if (notif.type === 'borrowing') {
      // Supervisor/Admin goes to Approval Workflow, Staff goes to Borrowings history
      targetPath = isApprover ? '/approval' : '/borrowings';
    } else if (notif.type === 'maintenance' || notif.type === 'payment') {
      targetPath = '/maintenance';
    } else if (notif.type === 'deletion') {
      targetPath = '/approval/deletions';
    }

    if (targetPath) {
      router.push(targetPath);
      setShowNotifDropdown(false);
    }

    if (!notif.is_read) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications(notifications.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (e) {}
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error("Backend logout failed:", e);
    } finally {
      localStorage.removeItem('saims_token');
      localStorage.removeItem('saims_user');
      document.cookie = 'saims_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'saims_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      setCurrentUser(null);
      setShowLogoutConfirm(false);
      router.push('/');
    }
  };

  const getPageTitle = () => {
    if (pathname.includes('/dashboard')) return 'System Overview';
    if (pathname.includes('/inventory')) return 'Inventory Management';
    if (pathname.includes('/tracking')) return 'QR Tracking';
    if (pathname.includes('/borrowings')) return 'Peminjaman Aset';
    if (pathname.includes('/maintenance')) return 'Perbaikan & Maintenance';
    if (pathname.includes('/approval')) return 'Persetujuan Peminjaman';
    if (pathname.includes('/users')) return 'Manajemen Pengguna Sistem';
    if (pathname.includes('/audit-logs')) return 'Audit Logs';
    if (pathname.includes('/profile')) return 'Profil & Pengaturan Akun';
    return 'Dashboard';
  };

  if (isRedirecting) {
    return <PageLoading title="Mengalihkan..." subtitle="Mengalihkan ke halaman login" />;
  }

  if (isAuthLoading || !currentUser) {
    return <PageLoading title="Memuat SAIMS..." subtitle="Menyiapkan data pengguna dan modul sistem" />;
  }

  const currentRole = currentUser.role as UserRole;
  
  const navProps = { currentRole, pathname, isCollapsed, setMobileSidebarOpen };

  return (
    <div className="min-h-dvh bg-[#F8F9FA] dark:bg-gray-950 text-[#1A1A1A] dark:text-gray-100 font-sans antialiased flex flex-col md:flex-row relative" id="saims-main-shell">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:shadow-lg font-bold">
        Skip to main content
      </a>
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside className={`${isCollapsed ? 'w-24' : 'w-72'} bg-white dark:bg-gray-900 flex flex-col shrink-0 fixed inset-y-0 left-0 z-40 transition-[width,transform] duration-300 ease-in-out md:static md:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`h-16 border-b border-[#E5E7EB] dark:border-gray-800 shrink-0 flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-8'}`}>
          <div className="flex items-center justify-between w-full">
            <div 
              className={`flex items-center cursor-pointer select-none transition-all duration-300 ${isCollapsed ? 'mx-auto justify-center' : 'w-full'}`}
              onClick={() => setIsCollapsed(!isCollapsed)}
              title="Toggle Sidebar"
            >
              <Image 
                src="/microdata-logo.png" 
                alt="Microdata Logo" 
                width={150}
                height={50}
                style={{ width: 'auto' }}
                className={`object-contain transition-all duration-300 invert dark:invert-0 hue-rotate-180 dark:hue-rotate-0 ${isCollapsed ? 'h-10' : 'h-12 scale-110 origin-left'}`} 
              />
            </div>
            {!isCollapsed && (
              <button
                aria-label="Tutup Menu Navigasi"
                className="md:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <nav className="p-4 flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
          {!isCollapsed && (
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-2.5 transition-opacity duration-300">
              Menu Utama
            </p>
          )}
          <NavItem href="/dashboard" icon={BarChart3} label="Dashboard" {...navProps} />
          <NavItem href="/inventory" icon={Package} label="Inventory" {...navProps} />
          <NavItem href="/inventory/trash" icon={ArchiveRestore} label="Recycle Bin" requiresRole={['Administrator']} {...navProps} />
          <NavItem href="/borrowings" icon={HandHelping} label="Peminjaman" requiresRole={['Administrator', 'Supervisor', 'Staff']} {...navProps} badge={currentUser?.role === 'Staff' && notifications.some(n => !n.is_read && n.type === 'borrowing')} />
          <NavItem href="/maintenance" icon={Wrench} label="Maintenance" requiresRole={['Administrator', 'Teknisi']} {...navProps} badge={notifications.some(n => !n.is_read && (n.type === 'maintenance' || n.type === 'payment'))} />
          <NavItem href="/approval" icon={ShieldCheck} label="Approval Workflow" requiresRole={['Administrator', 'Supervisor']} {...navProps} badge={notifications.some(n => !n.is_read && n.type === 'borrowing')} />
          <NavItem href="/approval/deletions" icon={Trash2} label="Approval Penghapusan" requiresRole={['Supervisor']} {...navProps} badge={notifications.some(n => !n.is_read && n.type === 'deletion')} />
          
          {!isCollapsed && (
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mt-6 mb-2.5 transition-opacity duration-300">
              Pengaturan
            </p>
          )}
          <NavItem href="/audit-logs" icon={ClipboardList} label="Audit Logs" requiresRole={['Administrator']} {...navProps} />
          <NavItem href="/users" icon={Users} label="Kelola Pengguna" requiresRole={['Administrator']} {...navProps} />
          <NavItem href="/profile" icon={Sliders} label="Profil & Akun" {...navProps} />
        </nav>

        <div className="p-4 border-t border-[#E5E7EB] dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? '' : 'flex-1'}`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 border border-white dark:border-gray-800 shadow-sm flex items-center justify-center text-white shrink-0 overflow-hidden" title={currentUser.name}>
                <UserIcon className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate leading-none">{currentUser.name}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate leading-none">{currentUser.role}</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col min-w-0 min-h-dvh focus:outline-hidden">
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-[#E5E7EB] dark:border-gray-800 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              aria-label="Buka Menu Navigasi"
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileSidebarOpen(true);
                } else {
                  setIsCollapsed(!isCollapsed);
                }
              }}
              title="Toggle Sidebar"
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
              <button 
                aria-label="Buka Notifikasi"
                className="relative p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                onClick={() => {
                  const newState = !showNotifDropdown;
                  setShowNotifDropdown(newState);
                }}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                )}
              </button>
              
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-50 overflow-hidden flex flex-col max-h-96 animate-in slide-in-from-top-2">
                  <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">Notifikasi</h3>
                    {unreadCount > 0 && (
                      <button 
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={async () => {
                          await notificationService.markAllAsRead();
                          fetchNotifications();
                        }}
                      >
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">Belum ada notifikasi.</div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
                        {notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            className={`p-3 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${notif.is_read ? 'opacity-70' : 'bg-blue-50/50 dark:bg-blue-900/10'}`}
                            onClick={() => handleReadNotification(notif)}
                          >
                            <p className={`font-semibold ${notif.is_read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'}`}>{notif.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-medium">
                              {new Date(notif.created_at).toLocaleString('id-ID')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8 md:pt-6 lg:pt-6 space-y-6 flex-1 w-full max-w-7xl mx-auto">
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
