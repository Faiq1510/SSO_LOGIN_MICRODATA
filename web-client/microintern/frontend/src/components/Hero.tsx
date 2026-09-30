import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, Calendar } from "lucide-react";
import PklLifecycleRail from "./PklLifecycleRail";

const Hero: React.FC = () => {
  return (
    <section className="relative bg-surface-0 text-text-primary py-16 md:py-24 px-6 md:px-10 overflow-hidden">
      <div className="absolute inset-0 bg-[conic-gradient(at_top_right,_var(--brand-dim)_0%,_transparent_50%)] opacity-30 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="font-mono-data text-xs text-brand uppercase tracking-widest mb-4 block">MICRODATA INDONESIA</span>
          <h1 className="font-display text-hero text-text-primary mb-6">
            Kelola PKL Anda
            <br />
            Dari Satu Tempat.
          </h1>
          <p className="text-base text-text-secondary leading-relaxed max-w-sm mb-10">
            Kelola siklus Praktik Kerja Lapangan secara digital. Mulai dari pendaftaran, presensi, hingga sertifikat.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
            <Link
              to="/registrasi"
              className="group relative inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-brand to-brand/95 hover:from-brand/90 hover:to-brand text-white font-semibold px-6 py-3.5 rounded-xl text-center transition-all duration-200 shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/35 hover:-translate-y-0.5 active:translate-y-0 text-sm cursor-pointer"
            >
              <span>Daftar Sekarang</span>
              <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/panduan"
              className="group inline-flex items-center justify-center gap-2.5 bg-surface-1 hover:bg-surface-2 border border-border-strong hover:border-brand/40 text-text-primary px-5 py-3.5 rounded-xl text-center transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 text-sm font-medium cursor-pointer"
            >
              <BookOpen size={17} className="text-brand transition-colors group-hover:text-brand/90" />
              <span>Panduan PKL</span>
            </Link>
            <a
              href="#jadwal-pkl"
              className="inline-flex items-center justify-center gap-2 bg-surface-1/50 hover:bg-surface-2 border border-border-subtle hover:border-border-strong text-text-secondary hover:text-text-primary px-5 py-3.5 rounded-xl text-center transition-all duration-200 text-sm font-medium cursor-pointer"
            >
              <Calendar size={16} className="text-text-muted" />
              <span>Jadwal</span>
            </a>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="bg-surface-1 border border-border-base rounded-2xl p-8 shadow-lg">
            <PklLifecycleRail variant="hero" stage="belum_daftar" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
