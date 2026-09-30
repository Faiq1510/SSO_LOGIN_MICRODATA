import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminDashboard } from "../../../services/settings.service";
import { type User, getLocalUser } from "../../../utils/api";
import { Eye, ArrowUpRight, Users, FileText, FileBarChart } from "lucide-react";
import BadgeStatus from "../../../components/BadgeStatus";

interface Member {
  user_id: string;
  nama_lengkap: string;
  nim_nisn: string;
  institusi: string;
  program_studi: string;
  cv_url: string | null;
}

interface Registration {
  id: string;
  kelompok_id: string;
  jenis_kelompok: "individu" | "kelompok";
  ketua_id: string;
  tanggal_masuk: string;
  tanggal_keluar: string;
  surat_pengantar_url: string;
  status: "menunggu" | "aktif" | "selesai" | "ditolak";
  alasan_tolak: string | null;
  created_at: string;
  anggota: Member[];
}

interface DashboardStats {
  total_menunggu: number;
  total_aktif: number;
  total_selesai: number;
  total_ditolak: number;
  total_semua: number;
}

// Internal SVG ring component
const StatRing: React.FC<{ value: number; total: number; colorClass: string }> = ({ value, total, colorClass }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const size = 64;
  const strokeWidth = 5;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  // Guard against divide by zero
  const percentage = total > 0 ? value / total : 0;
  const strokeDashoffset = mounted ? circumference - percentage * circumference : circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background ring */}
      <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="transparent" stroke="currentColor" strokeWidth={strokeWidth} className="text-surface-2" />
        {/* Foreground ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-1000 ease-out`}
        />
      </svg>
    </div>
  );
};

const DashboardAdmin: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_menunggu: 0,
    total_aktif: 0,
    total_selesai: 0,
    total_ditolak: 0,
    total_semua: 0,
  });
  const [recentRegistrations, setRecentRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [user, setUser] = useState<User | null>(() => getLocalUser());
  const userName = user?.name || user?.email || "Admin";
  const firstName = userName.split(" ")[0];

  useEffect(() => {
    const handleUserUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<User>;
      if (customEvent.detail) {
        setUser(customEvent.detail);
      } else {
        setUser(getLocalUser());
      }
    };
    window.addEventListener("user-updated", handleUserUpdate);

    const fetchDashboardData = async () => {
      try {
        const res = await getAdminDashboard();
        if (res.status === "success" && res.data) {
          setStats(res.data.stats);
          setRecentRegistrations(res.data.recentRegistrations || []);
        }
      } catch (err) {
        console.error("Gagal mengambil data dashboard admin:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      window.removeEventListener("user-updated", handleUserUpdate);
    };
  }, []);

  const formatDateRange = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return "-";
    const start = new Date(startStr);
    const end = new Date(endStr);
    const format = (d: Date) =>
      d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      });
    const year = start.getFullYear();
    return `${format(start)} - ${format(end)} ${year}`;
  };

  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return "Selamat pagi";
    if (hour >= 11 && hour < 15) return "Selamat siang";
    if (hour >= 15 && hour < 18) return "Selamat sore";
    return "Selamat malam";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-text-primary tracking-tight font-display leading-none mb-2">
            {getGreeting()}, {firstName}.
          </h1>
          <p className="text-sm font-medium text-text-secondary">{currentDate}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-surface-1 border border-border-base rounded-xl p-5 flex items-center justify-between gap-4 min-w-0 group">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted truncate" title="Total Pendaftar">
              Total Pendaftar
            </span>
            <span className="text-3xl sm:text-4xl font-bold text-brand font-display tabular-nums tracking-tight leading-none">{stats.total_semua}</span>
          </div>
          <div className="shrink-0">
            <StatRing value={stats.total_semua} total={stats.total_semua} colorClass="text-brand" />
          </div>
        </div>
        <div className="bg-surface-1 border border-border-base rounded-xl p-5 flex items-center justify-between gap-4 min-w-0 group">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted truncate" title="Aktif">
              Aktif
            </span>
            <span className="text-3xl sm:text-4xl font-bold text-text-primary font-display tabular-nums tracking-tight leading-none">{stats.total_aktif}</span>
          </div>
          <div className="shrink-0">
            <StatRing value={stats.total_aktif} total={stats.total_semua} colorClass="text-status-active" />
          </div>
        </div>
        <div className="bg-surface-1 border border-border-base rounded-xl p-5 flex items-center justify-between gap-4 min-w-0 group">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted truncate" title="Antrian">
              Antrian
            </span>
            <span className="text-3xl sm:text-4xl font-bold text-text-primary font-display tabular-nums tracking-tight leading-none">{stats.total_menunggu}</span>
          </div>
          <div className="shrink-0">
            <StatRing value={stats.total_menunggu} total={stats.total_semua} colorClass="text-status-pending" />
          </div>
        </div>
        <div className="bg-surface-1 border border-border-base rounded-xl p-5 flex items-center justify-between gap-4 min-w-0 group">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted truncate" title="Lulus">
              Lulus
            </span>
            <span className="text-3xl sm:text-4xl font-bold text-text-primary font-display tabular-nums tracking-tight leading-none">{stats.total_selesai}</span>
          </div>
          <div className="shrink-0">
            <StatRing value={stats.total_selesai} total={stats.total_semua} colorClass="text-status-done" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-1 border border-border-base rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-border-subtle flex justify-between items-center bg-surface-1/50">
            <div>
              <h2 className="text-sm font-bold text-text-primary">Pendaftaran Masuk</h2>
              <p className="text-[11px] text-text-muted mt-0.5">Aktivitas registrasi terbaru</p>
            </div>
            <Link to="/dashboard/admin/pendaftaran" className="text-[11px] font-bold text-brand hover:text-brand-glow transition-colors uppercase tracking-widest">
              Lihat Semua →
            </Link>
          </div>
          <div className="overflow-x-auto scrollbar-hide flex-1">
            <table className="w-full text-left min-w-[480px]">
              <thead className="bg-surface-0/50">
                <tr className="border-b border-border-subtle">
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted">Institusi & Tipe</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted">Periode</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/30">
                {recentRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-sm text-text-muted bg-surface-0/20">
                      Belum ada pengajuan masuk hari ini.
                    </td>
                  </tr>
                ) : (
                  recentRegistrations.map((reg) => {
                    const firstMember = reg.anggota && reg.anggota.length > 0 ? reg.anggota[0] : null;
                    const institusi = firstMember ? firstMember.institusi : "Tidak diketahui";
                    const tipeLabel = reg.jenis_kelompok === "individu" ? "Individu" : `Kelompok (${reg.anggota?.length || 0})`;

                    return (
                      <tr key={reg.id} className="hover:bg-surface-2/50 transition-colors group">
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-text-primary block">{institusi}</span>
                          <span className="text-[11px] text-text-muted mt-0.5 block">{tipeLabel}</span>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono-data text-text-secondary">{formatDateRange(reg.tanggal_masuk, reg.tanggal_keluar)}</td>
                        <td className="px-5 py-4">
                          <BadgeStatus status={reg.status} size="sm" />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            to="/dashboard/admin/pendaftaran"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-2 text-text-muted hover:bg-brand hover:text-white transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-surface-1 border border-border-base rounded-xl p-5">
            <h2 className="text-sm font-bold text-text-primary mb-4">Aksi Cepat</h2>
            <div className="flex flex-col gap-2">
              <Link
                to="/dashboard/admin/pendaftaran"
                className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle hover:border-border-strong hover:bg-surface-2 transition-all group"
              >
                <div className="w-8 h-8 rounded-md bg-surface-0 flex items-center justify-center text-text-muted group-hover:text-brand transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-primary">Kelola Pendaftaran</span>
                  <span className="text-[11px] text-text-muted">Tinjau pengajuan baru</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-text-muted ml-auto group-hover:text-brand transition-colors" />
              </Link>

              <Link
                to="/dashboard/admin/peserta"
                className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle hover:border-border-strong hover:bg-surface-2 transition-all group"
              >
                <div className="w-8 h-8 rounded-md bg-surface-0 flex items-center justify-center text-text-muted group-hover:text-brand transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-primary">Data Peserta</span>
                  <span className="text-[11px] text-text-muted">Lihat profil & progres</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-text-muted ml-auto group-hover:text-brand transition-colors" />
              </Link>

              <Link
                to="/dashboard/admin/laporan"
                className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle hover:border-border-strong hover:bg-surface-2 transition-all group"
              >
                <div className="w-8 h-8 rounded-md bg-surface-0 flex items-center justify-center text-text-muted group-hover:text-brand transition-colors">
                  <FileBarChart className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-primary">Ekspor Laporan</span>
                  <span className="text-[11px] text-text-muted">Unduh rekap data CSV/PDF</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-text-muted ml-auto group-hover:text-brand transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
