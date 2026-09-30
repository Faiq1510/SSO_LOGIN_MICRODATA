'use client';

import React from 'react';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';

interface PageLoadingProps {
  title?: string;
  subtitle?: string;
}

export default function PageLoading({
  title = 'Memuat SAIMS...',
  subtitle = 'Menyiapkan data autentikasi dan konteks sistem'
}: PageLoadingProps) {
  return (
    <div className="min-h-dvh bg-[#F8F9FA] dark:bg-[#0B0F17] text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-orange-500/10 dark:bg-orange-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main Loading Card */}
      <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
        {/* Animated Logo Container with Glow */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Spinner Outer Ring */}
          <div className="w-20 h-20 rounded-2xl border-2 border-orange-500/20 dark:border-blue-500/20 border-t-orange-500 dark:border-t-blue-400 animate-spin" />
          
          {/* Pulsing Logo in Center */}
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <Image
              src="/microdata-logo.png"
              alt="SAIMS Logo"
              width={48}
              height={48}
              style={{ width: 'auto', height: 'auto' }}
              className="object-contain invert dark:invert-0 hue-rotate-180 dark:hue-rotate-0 animate-pulse"
              priority
            />
          </div>
        </div>

        {/* Status Text & Message */}
        <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight mb-1 font-display">
          {title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium mb-2">
          {subtitle}
        </p>

        {/* Security Badge Footer */}
        <div className="mt-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 text-[11px] font-semibold text-gray-600 dark:text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
          <span>SAIMS Encrypted Session</span>
        </div>
      </div>
    </div>
  );
}
