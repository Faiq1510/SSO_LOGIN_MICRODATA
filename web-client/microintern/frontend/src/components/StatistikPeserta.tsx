import React, { useState, useEffect } from "react";
import { getParticipantStats } from "../services/peserta.service";
import { GraduationCap, School, BookOpen, Clock, Users, Award, TrendingUp } from "lucide-react";

interface StatItem {
  label: string;
  count: number;
}

interface StatsData {
  by_prodi: StatItem[];
  by_institusi: StatItem[];
  by_jenjang: StatItem[];
  by_tipe: StatItem[];
  durasi: {
    min: number | null;
    avg: number | null;
    max: number | null;
  };
}

type TabOption = "prodi" | "institusi" | "jenjang" | "tipe";

const StatistikPeserta: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabOption>("prodi");

  useEffect(() => {
    let ignore = false;
    const fetchStats = async () => {
      try {
        const res = await getParticipantStats();
        if (!ignore && res.status === "success" && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Gagal memuat statistik peserta:", err);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };
    fetchStats();
    return () => {
      ignore = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-28 bg-surface-1 border border-border-subtle rounded-2xl" />
          <div className="h-28 bg-surface-1 border border-border-subtle rounded-2xl" />
          <div className="h-28 bg-surface-1 border border-border-subtle rounded-2xl sm:col-span-2 lg:col-span-1" />
        </div>
        <div className="h-48 bg-surface-1 border border-border-subtle rounded-2xl" />
      </div>
    );
  }

  if (!stats) return null;

  const topProdi = stats.by_prodi.length > 0 ? stats.by_prodi[0] : null;

  const totalJenjang = stats.by_jenjang.reduce((acc, curr) => acc + curr.count, 0);
  const kuliahItem = stats.by_jenjang.find((i) => i.label === "kuliah");
  const kuliahCount = kuliahItem ? kuliahItem.count : 0;
  const kuliahPct = totalJenjang > 0 ? Math.round((kuliahCount / totalJenjang) * 100) : 0;

  const totalTipe = stats.by_tipe.reduce((acc, curr) => acc + curr.count, 0);
  const individuItem = stats.by_tipe.find((i) => i.label === "individu");
  const individuCount = individuItem ? individuItem.count : 0;
  const individuPct = totalTipe > 0 ? Math.round((individuCount / totalTipe) * 100) : 0;

  const getActiveData = (): StatItem[] => {
    switch (activeTab) {
      case "institusi":
        return stats.by_institusi;
      case "jenjang":
        return stats.by_jenjang.map((item) => ({
          ...item,
          label: item.label === "kuliah" ? "Perguruan Tinggi / Kuliah" : item.label === "sekolah" ? "Sekolah (SMA/SMK)" : item.label,
        }));
      case "tipe":
        return stats.by_tipe.map((item) => ({
          ...item,
          label: item.label === "individu" ? "Pendaftaran Individu" : item.label === "kelompok" ? "Pendaftaran Kelompok" : item.label,
        }));
      default:
        return stats.by_prodi;
    }
  };

  const activeData = getActiveData();
  const maxCount = activeData.length > 0 ? Math.max(...activeData.map((d) => d.count)) : 1;
  const totalActiveCount = activeData.reduce((acc, item) => acc + item.count, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-surface-1 border border-border-base rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:border-brand/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-surface-2 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary tracking-tight font-display">Durasi Magang</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary bg-surface-2 px-2 py-0.5 rounded-full border border-border-subtle">Metrik</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-border-subtle bg-surface-2 rounded-xl p-2.5 border border-border-subtle">
            <div>
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block">Min</span>
              <span className="text-xs font-bold text-text-primary font-mono-data mt-1 block">{stats.durasi.min !== null ? `${stats.durasi.min} d` : "-"}</span>
            </div>
            <div className="pl-1">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block">Rerata</span>
              <span className="text-xs font-bold text-brand font-mono-data mt-1 block">{stats.durasi.avg !== null ? `${stats.durasi.avg} d` : "-"}</span>
            </div>
            <div className="pl-1">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block">Max</span>
              <span className="text-xs font-bold text-text-primary font-mono-data mt-1 block">{stats.durasi.max !== null ? `${stats.durasi.max} d` : "-"}</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-1 border border-border-base rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:border-brand/30 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-surface-2 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary tracking-tight font-display">Prodi Terbanyak</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-surface-2 px-2 py-0.5 rounded-full border border-emerald-500/40">Top 1</span>
          </div>
          {topProdi ? (
            <div className="bg-surface-2 rounded-xl p-2.5 border border-border-subtle flex items-center justify-between">
              <span className="text-xs font-semibold text-text-primary truncate pr-2">{topProdi.label}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-bold text-emerald-400 font-mono-data">{topProdi.count}</span>
                <span className="text-[10px] text-text-muted font-medium">peserta</span>
              </div>
            </div>
          ) : (
            <div className="bg-surface-2 rounded-xl p-2.5 border border-border-subtle text-center text-text-muted text-xs">Belum ada data prodi</div>
          )}
        </div>

        <div className="bg-surface-1 border border-border-base rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:border-brand/30 transition-colors sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-surface-2 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary tracking-tight font-display">Rasio Demografi</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-surface-2 px-2 py-0.5 rounded-full border border-purple-500/40">Proporsi</span>
          </div>
          <div className="grid grid-cols-2 gap-2 bg-surface-2 rounded-xl p-2.5 border border-border-subtle">
            <div>
              <div className="flex justify-between items-center text-[10px] text-text-muted font-medium">
                <span>Kuliah</span>
                <span className="font-bold text-text-primary font-mono-data">{kuliahPct}%</span>
              </div>
              <div className="h-1.5 bg-surface-1 rounded-full overflow-hidden mt-1">
                <div style={{ width: `${kuliahPct}%` }} className="h-full bg-purple-500 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center text-[10px] text-text-muted font-medium">
                <span>Individu</span>
                <span className="font-bold text-text-primary font-mono-data">{individuPct}%</span>
              </div>
              <div className="h-1.5 bg-surface-1 rounded-full overflow-hidden mt-1">
                <div style={{ width: `${individuPct}%` }} className="h-full bg-sky-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-1 border border-border-base rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-text-primary font-display tracking-tight">Distribusi Demografi Peserta</h4>
            <p className="text-[11px] text-text-muted">Rincian sebaran data pendaftaran peserta berdasarkan kategori.</p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
            <button
              onClick={() => setActiveTab("prodi")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${
                activeTab === "prodi"
                  ? "bg-brand text-white border-brand shadow-sm font-bold"
                  : "bg-surface-2 text-text-muted border-border-subtle hover:text-text-primary hover:border-border-strong"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Prodi
            </button>
            <button
              onClick={() => setActiveTab("institusi")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${
                activeTab === "institusi"
                  ? "bg-brand text-white border-brand shadow-sm font-bold"
                  : "bg-surface-2 text-text-muted border-border-subtle hover:text-text-primary hover:border-border-strong"
              }`}
            >
              <School className="w-3.5 h-3.5" />
              Institusi
            </button>
            <button
              onClick={() => setActiveTab("jenjang")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${
                activeTab === "jenjang"
                  ? "bg-brand text-white border-brand shadow-sm font-bold"
                  : "bg-surface-2 text-text-muted border-border-subtle hover:text-text-primary hover:border-border-strong"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Jenjang
            </button>
            <button
              onClick={() => setActiveTab("tipe")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${
                activeTab === "tipe"
                  ? "bg-brand text-white border-brand shadow-sm font-bold"
                  : "bg-surface-2 text-text-muted border-border-subtle hover:text-text-primary hover:border-border-strong"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Tipe
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {activeData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-text-muted bg-surface-2 rounded-xl border border-border-subtle">
              <span className="text-xs">Belum ada data statistik untuk kategori ini.</span>
            </div>
          ) : (
            activeData.map((data) => {
              const pct = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
              const shareOfTotal = totalActiveCount > 0 ? Math.round((data.count / totalActiveCount) * 100) : 0;
              return (
                <div key={data.label} className="space-y-1 bg-surface-2 p-3 rounded-xl border border-border-subtle hover:border-border-strong transition-colors">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-text-primary truncate pr-4">{data.label}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-text-secondary font-medium bg-surface-1 px-2 py-0.5 rounded-md border border-border-subtle">
                        {shareOfTotal}% dari total
                      </span>
                      <span className="font-mono-data text-brand font-bold text-xs">{data.count}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-surface-1 rounded-full overflow-hidden w-full">
                    <div style={{ width: `${pct}%` }} className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-full" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default StatistikPeserta;
