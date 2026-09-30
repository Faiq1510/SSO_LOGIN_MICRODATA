'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  FileQuestion, ServerCrash, ShieldAlert, ArrowLeft, RefreshCw, Home,
  Package, HandHelping, Wrench
} from 'lucide-react';

export type HttpErrorCode = 400 | 401 | 403 | 404 | 500 | 502 | 503;

interface ErrorViewProps {
  code?: HttpErrorCode | number;
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorView({
  code = 404,
  title,
  message,
  onRetry
}: ErrorViewProps) {
  useEffect(() => {
    // Lock body scroll to prevent double scrollbars when ErrorView overlay is active
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);
  const is400Series = code >= 400 && code < 500;
  const is500Series = code >= 500;

  // Determine icon & default texts based on status code
  let IconComponent = FileQuestion;
  let defaultTitle = 'Halaman Tidak Ditemukan';
  let defaultMessage = 'Maaf, halaman yang Anda cari tidak ada, telah dipindahkan, atau alamat URL salah.';
  let badgeText = '404 NOT FOUND';
  let badgeColor = 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';

  if (code === 401 || code === 403) {
    IconComponent = ShieldAlert;
    defaultTitle = code === 401 ? 'Autentikasi Diperlukan' : 'Akses Ditolak';
    defaultMessage = 'Anda tidak memiliki hak akses yang cukup untuk membaca atau mengedit halaman modul ini.';
    badgeText = `${code} UNAUTHORIZED`;
    badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  } else if (code === 400) {
    IconComponent = ShieldAlert;
    defaultTitle = 'Permintaan Tidak Valid';
    defaultMessage = 'Format parameter HTTP request yang dikirimkan oleh browser tidak sesuai.';
    badgeText = '400 BAD REQUEST';
    badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  } else if (is500Series) {
    IconComponent = ServerCrash;
    defaultTitle = 'Kendala Server Internal';
    defaultMessage = 'Terjadi kesalahan sistem atau kendala koneksi backend database SAIMS. Tim teknis sedang menangani masalah ini.';
    badgeText = `${code} SERVER ERROR`;
    badgeColor = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
  }

  const finalTitle = title || defaultTitle;
  const finalMessage = message || defaultMessage;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#F8F9FA] dark:bg-[#0B0F17] text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center p-6 overflow-y-auto transition-colors duration-300">
      {/* Background Decorative Lighting Ambient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-500/10 dark:bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />

      {/* Main Glassmorphic Card Container */}
      <div className="relative z-10 w-full max-w-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 rounded-3xl p-8 md:p-10 shadow-2xl shadow-gray-900/10 dark:shadow-black/50 text-center flex flex-col items-center">
        
        {/* Giant Stylized Numeric Code */}
        <div className="relative mb-4 select-none">
          <span className="text-8xl md:text-9xl font-black font-display tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-gray-900 via-gray-700 to-gray-400 dark:from-white dark:via-gray-300 dark:to-gray-700 opacity-90">
            {code}
          </span>
          <div className="absolute -top-3 -right-3 p-3 rounded-2xl bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700">
            <IconComponent className={`w-7 h-7 ${is500Series ? 'text-red-500' : is400Series ? 'text-orange-500' : 'text-blue-500'}`} />
          </div>
        </div>

        {/* Badge */}
        <div className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase border mb-4 tracking-wider ${badgeColor}`}>
          {badgeText}
        </div>

        {/* Title & Description */}
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2 font-display">
          {finalTitle}
        </h1>
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium mb-8 max-w-md">
          {finalMessage}
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center mb-8">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs md:text-sm rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>

          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs md:text-sm rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Coba Lagi</span>
            </button>
          )}
        </div>

        {/* Quick Nav Shortcut Links */}
        <div className="w-full pt-6 border-t border-gray-100 dark:border-gray-800/80">
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-3">
            Pintasan Modul SAIMS
          </span>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <Link
              href="/inventory"
              className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex flex-col items-center gap-1 font-semibold"
            >
              <Package className="w-4 h-4 text-orange-500" />
              <span>Inventory</span>
            </Link>
            <Link
              href="/borrowings"
              className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex flex-col items-center gap-1 font-semibold"
            >
              <HandHelping className="w-4 h-4 text-blue-500" />
              <span>Peminjaman</span>
            </Link>
            <Link
              href="/maintenance"
              className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex flex-col items-center gap-1 font-semibold"
            >
              <Wrench className="w-4 h-4 text-indigo-500" />
              <span>Maintenance</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
