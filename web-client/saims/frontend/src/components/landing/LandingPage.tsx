'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package, BarChart3, HandHelping, Wrench, ShieldCheck, QrCode,
  MessageSquare, ArrowRight, ChevronDown, Sparkles, Zap, Globe,
  Users, Lock, Bell, CheckCircle2, Layers, Database, Menu, X,
  Receipt, History, Trash2, ArchiveRestore
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { dashboardService } from '@/services/dashboard.service';

/* ───── Animated counter hook ───── */
function useCounter(end: number, duration = 2000, delay = 0) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0;
      const step = end / (duration / 16);
      const timer = setInterval(() => {
        start += step;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }, delay);
    return () => clearTimeout(timeout);
  }, [end, duration, delay]);

  return count;
}

/* ───── Feature card data (12 Modules) ───── */
const features = [
  {
    icon: Package,
    title: 'Inventory Barang',
    desc: 'Kelola data aset, kategori, lokasi penyimpanan, dan status aset secara terpusat dengan riwayat perubahan lengkap.',
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: QrCode,
    title: 'QR Code Tracking',
    desc: 'Generate & scan QR Code untuk setiap aset. Tracking lokasi dan informasi aset secara real-time.',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-900/30',
    text: 'text-violet-600 dark:text-violet-400',
  },
  {
    icon: HandHelping,
    title: 'Peminjaman Aset',
    desc: 'Pengajuan, persetujuan, pengembalian, dan monitoring peminjaman aset dalam satu alur terintegrasi.',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Wrench,
    title: 'Maintenance',
    desc: 'Jadwal maintenance berkala, riwayat perbaikan, status tracking, dan reminder otomatis.',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Analytics',
    desc: 'Visualisasi data aset aktif, dipinjam, maintenance, grafik kategori, dan kondisi aset.',
    color: 'from-cyan-500 to-blue-600',
    bg: 'bg-cyan-50 dark:bg-cyan-900/30',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    icon: MessageSquare,
    title: 'Notifikasi WhatsApp',
    desc: 'Notifikasi otomatis untuk pengajuan, approval, reminder pengembalian, dan maintenance.',
    color: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
  },
  {
    icon: ShieldCheck,
    title: 'Approval Multi-Level',
    desc: 'Multi-level approval untuk peminjaman, maintenance, dan pengajuan penghapusan aset.',
    color: 'from-indigo-500 to-blue-600',
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    icon: Bell,
    title: 'Smart Reminder & Cron',
    desc: 'Pengingat otomatis pengembalian aset dan jadwal maintenance agar tidak ada yang terlewat.',
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50 dark:bg-rose-900/30',
    text: 'text-rose-600 dark:text-rose-400',
  },
  {
    icon: Receipt,
    title: 'Invoice & Bulk Payment',
    desc: 'Generate invoice PDF otomatis dan konfirmasi pembayaran massal pemeliharaan aset oleh Admin.',
    color: 'from-purple-500 to-indigo-600',
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
  },
  {
    icon: History,
    title: 'Audit Trail & Logging',
    desc: 'Pencatatan riwayat perubahan data krusial secara permanen (immutable) untuk transparansi sistem.',
    color: 'from-sky-500 to-blue-600',
    bg: 'bg-sky-50 dark:bg-sky-900/30',
    text: 'text-sky-600 dark:text-sky-400',
  },
  {
    icon: Trash2,
    title: 'Persetujuan Penghapusan',
    desc: 'Workflow khusus pengajuan dan persetujuan penghapusan aset berizin terbatas Supervisor.',
    color: 'from-red-500 to-rose-600',
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
  },
  {
    icon: ArchiveRestore,
    title: 'Recycle Bin & Auto GC',
    desc: 'Fitur pemulihan aset terhapus (Soft Delete) dan pembersihan file yatim otomatis (Garbage Collector).',
    color: 'from-teal-500 to-emerald-600',
    bg: 'bg-teal-50 dark:bg-teal-900/30',
    text: 'text-teal-600 dark:text-teal-400',
  },
];

/* ───── Role data ───── */
const roles = [
  {
    role: 'Administrator',
    desc: 'Mengelola seluruh data sistem, user, role, dan melihat seluruh laporan.',
    icon: Lock,
    gradient: 'from-blue-600 to-indigo-700',
  },
  {
    role: 'Staff',
    desc: 'Mengajukan peminjaman, melihat aset tersedia, dan riwayat peminjaman.',
    icon: Users,
    gradient: 'from-emerald-600 to-teal-700',
  },
  {
    role: 'Supervisor',
    desc: 'Melakukan approval pengajuan dan monitoring aset departemen.',
    icon: ShieldCheck,
    gradient: 'from-violet-600 to-purple-700',
  },
  {
    role: 'Teknisi',
    desc: 'Mengelola maintenance aset dan memperbarui status perbaikan.',
    icon: Wrench,
    gradient: 'from-amber-600 to-orange-700',
  },
];

/* ───── Stats data (Default) ───── */
const defaultStats = [
  { label: 'Modul Terintegrasi', value: 12, suffix: '' },
  { label: 'Jenis Role', value: 4, suffix: '' },
  { label: 'Notifikasi Otomatis', value: 100, suffix: '%' },
  { label: 'Uptime Sistem', value: 99, suffix: '.9%' },
];

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(true);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [statsData, setStatsData] = useState(defaultStats);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    dashboardService.getLandingStats()
      .then(data => {
        setStatsData([
          { label: 'Modul Terintegrasi', value: data.integrated_modules ? Math.max(data.integrated_modules, 12) : 12, suffix: '+' },
          { label: 'Jenis Role', value: data.role_types || 4, suffix: '' },
          { label: 'Notifikasi Otomatis', value: data.auto_notifications, suffix: '+' },
          { label: 'Uptime Sistem', value: Math.floor(data.system_uptime), suffix: `.${Math.round((data.system_uptime % 1) * 10)}%` },
        ]);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden">
      {/* ═══════════ NAVIGATION BAR ═══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-950/80 border-b border-gray-100/80 dark:border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px]">
            <div className="flex items-center">
              <Image
                src="/microdata-logo.png"
                alt="Microdata Logo"
                width={150}
                height={48}
                style={{ width: 'auto' }}
                className="h-9 sm:h-10 lg:h-12 w-auto object-contain dark:brightness-100 transition-all duration-300 origin-left"
              />
            </div>

            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Fitur</a>
                <a href="#roles" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Role</a>
                <a href="#architecture" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Arsitektur</a>
              </div>

              <ThemeToggle />

              <Link
                href="/login"
                className="text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-0.5"
              >
                Login
              </Link>

              {/* Mobile menu toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 dark:bg-gray-950/95 border-b border-gray-100 dark:border-gray-800 px-4 pt-3 pb-4 space-y-2 animate-in slide-in-from-top-2">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              Fitur
            </a>
            <a
              href="#roles"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              Role
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              Arsitektur
            </a>
          </div>
        )}
      </nav>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative pt-20 pb-12 sm:pt-24 sm:pb-16 overflow-hidden min-h-screen flex items-center">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-blue-100/60 to-indigo-100/40 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-violet-100/40 to-blue-100/30 dark:from-violet-900/20 dark:to-blue-900/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-50/50 dark:from-blue-900/10 to-transparent rounded-full" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
            style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-100/80 dark:border-blue-800/30 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Smart Asset & Inventory Management System</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-[1.1]">
              Kelola Aset{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Perusahaan
              </span>
              <br />
              dengan{' '}
              <span className="relative inline-block">
                Lebih Cerdas
                <svg className="absolute -bottom-5 left-0 w-full" viewBox="0 0 300 16" fill="none">
                  <path d="M5 12 C 80 2 220 2 295 10" stroke="url(#underlineGrad)" strokeWidth="5" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="underlineGrad" x1="0" y1="0" x2="300" y2="0">
                      <stop stopColor="#2563EB" />
                      <stop offset="1" stopColor="#7C3AED" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Solusi digital terpadu untuk inventaris, peminjaman, maintenance, approval workflow,
              dan notifikasi WhatsApp — semua dalam satu platform.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-1 text-base"
              >
                <Zap className="w-5 h-5" />
                Masuk ke Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="group inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold px-6 py-4 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-300 text-base"
              >
                Lihat Fitur
                <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* ── Stats Bar ── */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {statsData.map((stat, i) => (
              <StatCard key={i} label={stat.label} value={stat.value} suffix={stat.suffix} delay={i * 200} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES SECTION ═══════════ */}
      <section id="features" className="py-24 bg-gradient-to-b from-white to-gray-50/80 dark:from-gray-950 dark:to-gray-900/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 rounded-full px-3 py-1 mb-4">
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Fitur Lengkap</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Semua yang Anda Butuhkan
            </h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
              Dua belas modul terintegrasi untuk mengelola seluruh siklus hidup aset perusahaan.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className={`group relative bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-500 cursor-default ${activeFeature === i ? 'ring-2 ring-blue-500/20 scale-[1.02]' : ''}`}
                onMouseEnter={() => setActiveFeature(i)}
                onMouseLeave={() => setActiveFeature(null)}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Icon */}
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className={`w-6 h-6 ${f.text}`} />
                </div>

                {/* Content */}
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>

                {/* Hover gradient line */}
                <div className={`absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r ${f.color} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ ROLES SECTION ═══════════ */}
      <section id="roles" className="py-24 bg-white dark:bg-gray-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-900/30 rounded-full px-3 py-1 mb-4">
              <Users className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Multi-Role Access</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Akses Sesuai Peran
            </h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
              Setiap pengguna mendapat akses yang tepat sesuai tanggung jawab mereka.
            </p>
          </div>

          {/* Roles grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((r, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl p-[1px] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
              >
                {/* Gradient border */}
                <div className={`absolute inset-0 bg-gradient-to-br ${r.gradient} rounded-2xl opacity-10 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 h-full group-hover:bg-white/95 dark:group-hover:bg-gray-900/95 transition-colors">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${r.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <r.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{r.role}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{r.desc}</p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Akses Terkontrol</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ ARCHITECTURE SECTION ═══════════ */}
      <section id="architecture" className="py-24 bg-gradient-to-b from-gray-50/80 to-white dark:from-gray-900/50 dark:to-gray-950 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-50/40 dark:bg-blue-900/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-50/30 dark:bg-indigo-900/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full px-3 py-1 mb-4">
              <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">System Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Arsitektur Modern
            </h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
              Dibangun dengan teknologi terkini untuk performa dan skalabilitas terbaik.
            </p>
          </div>

          {/* Architecture visual */}
          <div className="max-w-4xl mx-auto">
            {/* Layer 1: Frontend */}
            <div className="relative">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Frontend</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Web Application — Next.js + React + TypeScript</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Next.js 16', 'React 19', 'TypeScript', 'TailwindCSS 4', 'Lucide Icons'].map((tech) => (
                    <span key={tech} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-semibold">{tech}</span>
                  ))}
                </div>
              </div>

              {/* Connector */}
              <div className="flex justify-center py-3">
                <div className="w-px h-8 bg-gradient-to-b from-blue-300 to-indigo-300 dark:from-blue-700 dark:to-indigo-700 relative">
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-400 rounded-full" />
                </div>
              </div>

              {/* Layer 2: Backend API */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Backend API</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500">RESTful API — Go (Golang) + Gin Framework + GORM</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['Go 1.26', 'Gin Engine', 'GORM ORM', 'JWT Auth', 'Swagger OpenAPI', 'WhatsApp Gateway'].map((tech) => (
                    <span key={tech} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-semibold">{tech}</span>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {[
                    { name: 'Inventory', icon: Package },
                    { name: 'Borrowing', icon: HandHelping },
                    { name: 'Maintenance', icon: Wrench },
                    { name: 'Approval', icon: ShieldCheck },
                    { name: 'Analytics', icon: BarChart3 },
                    { name: 'Notification', icon: MessageSquare },
                    { name: 'Asset Track', icon: QrCode },
                    { name: 'User Mgmt', icon: Users },
                    { name: 'Invoice & Payment', icon: Receipt },
                    { name: 'Audit Trail', icon: History },
                    { name: 'Deletion Request', icon: Trash2 },
                    { name: 'Recycle Bin & GC', icon: ArchiveRestore },
                  ].map((mod) => (
                    <div key={mod.name} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800">
                      <mod.icon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{mod.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connector */}
              <div className="flex justify-center py-3">
                <div className="w-px h-8 bg-gradient-to-b from-violet-300 to-emerald-300 dark:from-violet-700 dark:to-emerald-700 relative">
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-400 rounded-full" />
                </div>
              </div>

              {/* Layer 3: Database & Storage */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                      <Database className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">Database &amp; Storage</h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500">PostgreSQL (Relational DB) &amp; MinIO (S3 Object Storage)</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-semibold">PostgreSQL</span>
                    <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-semibold">MinIO S3 Storage</span>
                    <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-semibold">Docker Containers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA SECTION ═══════════ */}
      <section className="py-20 sm:py-24 relative overflow-hidden bg-gradient-to-br from-blue-50/90 via-slate-50 to-indigo-50/70 dark:from-gray-900/90 dark:via-gray-900/80 dark:to-gray-950 border-y border-blue-100/80 dark:border-gray-800/80 w-full">
        {/* Background Ambient Glow & Grid Pattern */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
            Siap Mengelola Aset<br />dengan Lebih Efisien?
          </h2>
          <p className="mt-5 text-gray-600 dark:text-gray-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Mulai gunakan SAIMS sekarang dan rasakan kemudahan manajemen aset digital yang terintegrasi.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto group inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-0.5 text-base"
            >
              Mulai Sekarang
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-gray-950 text-gray-400 pt-16 pb-8 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Brand */}
            <div>
              <div className="flex items-center mb-6">
                <Image
                  src="/microdata-logo.png"
                  alt="Microdata Logo"
                  width={150}
                  height={48}
                  style={{ width: 'auto' }}
                  className="h-10 lg:h-12 w-auto object-contain transition-all duration-300 origin-left"
                />
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                Smart Asset & Inventory Management System — Solusi digital terpadu untuk pengelolaan aset perusahaan.
              </p>
            </div>

            {/* Fitur */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Fitur Utama</h4>
              <ul className="space-y-2.5">
                {['Inventory Barang', 'QR Code Tracking', 'Peminjaman Aset', 'Maintenance', 'Dashboard Analytics', 'Notifikasi WhatsApp'].map((item) => (
                  <li key={item} className="text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-default">{item}</li>
                ))}
              </ul>
            </div>

            {/* Tech Stack */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Teknologi</h4>
              <ul className="space-y-2.5">
                {['Go (Golang)', 'Next.js 16', 'TypeScript', 'PostgreSQL', 'MinIO S3 Storage', 'WhatsApp Gateway'].map((item) => (
                  <li key={item} className="text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-default">{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400 font-medium">
                © 2026 PT Microdata Indonesia — SAIMS
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Developed by Marcel Kevin Togap Siagian &amp; Nadia Anatashiva
              </p>
            </div>
            <p className="text-xs text-gray-600">
              QR-Asset Tracking • Multi-level Approval • WhatsApp Gateway
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ───── Stat Card Component ───── */
function StatCard({ label, value, suffix, delay }: { label: string; value: number; suffix: string; delay: number }) {
  const count = useCounter(value, 2000, delay + 500);

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-100 dark:border-gray-800 rounded-2xl p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
        {count}{suffix}
      </p>
      <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}
