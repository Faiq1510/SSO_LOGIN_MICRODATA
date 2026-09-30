import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { type User, getLocalUser, setLocalUser, logout } from "../utils/api";
import { getPengajuan } from "../services/pendaftaran.service";
import { getProfil } from "../services/profil.service";
import { useNotification } from "./ProviderNotifikasi";
import { Zap, Clock, Lock, Award, Settings, LogOut, History, ClipboardList } from "lucide-react";

interface SidebarPesertaProps {
  onNavigate?: () => void;
}

const SidebarPeserta: React.FC<SidebarPesertaProps> = ({ onNavigate }) => {
  const [user, setUser] = useState<User | null>(() => getLocalUser());
  const { showError } = useNotification();
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const handleUserUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<User>;
      if (customEvent.detail) {
        setUser(customEvent.detail);
      } else {
        setUser(getLocalUser());
      }
    };
    const handleStorageChange = () => {
      setUser(getLocalUser());
    };

    window.addEventListener("user-updated", handleUserUpdate);
    window.addEventListener("storage", handleStorageChange);

    const fetchStatusAndProfile = async () => {
      try {
        const [resStatus, resProfil] = await Promise.all([getPengajuan().catch(() => null), getProfil().catch(() => null)]);
        if (resStatus && resStatus.data) {
          setStatus(resStatus.data.status || "belum_mulai");
        }
        if (resProfil && resProfil.status === "success" && resProfil.data) {
          const currentUser = getLocalUser();
          if (currentUser) {
            const updated: User = {
              ...currentUser,
              name: resProfil.data.name || currentUser.name,
              jenjang_pendidikan: resProfil.data.profile?.jenjang_pendidikan || currentUser.jenjang_pendidikan,
            };
            setLocalUser(updated);
          }
        }
      } catch (err) {
        console.error("Gagal memuat data sidebar:", err);
      }
    };

    fetchStatusAndProfile();

    return () => {
      window.removeEventListener("user-updated", handleUserUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    if (onNavigate) {
      onNavigate();
    }
  };

  const name = user?.name || user?.email || "Peserta";
  const initial = name.charAt(0).toUpperCase();
  const roleLabel = user?.jenjang_pendidikan === "sekolah" ? "Siswa" : "Mahasiswa";

  return (
    <aside className="flex flex-col h-full w-full bg-surface-0 border-r border-border-subtle">
      <div className="h-12 shrink-0 flex items-center px-4 border-b border-border-subtle">
        <NavLink to="/">
          <img src="/microdata-logo.webp" alt="Logo" className="h-8 w-auto" />
        </NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 scrollbar-hide">
        <NavLink
          to="/dashboard/peserta"
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all font-medium text-sm ${
              isActive ? "border-l-[3px] border-brand bg-brand/8 text-brand rounded-lg" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
            }`
          }
        >
          <Zap className="w-4 h-4 shrink-0" />
          <span className="truncate">Onboarding</span>
        </NavLink>

        {status === "aktif" ? (
          <>
            <NavLink
              to="/dashboard/peserta/presensi"
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all font-medium text-sm ${
                  isActive ? "border-l-[3px] border-brand bg-brand/8 text-brand rounded-lg" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
                }`
              }
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span className="truncate">Presensi</span>
            </NavLink>
            <NavLink
              to="/dashboard/peserta/izin"
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all font-medium text-sm ${
                  isActive ? "border-l-[3px] border-brand bg-brand/8 text-brand rounded-lg" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
                }`
              }
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span className="truncate">Izin</span>
            </NavLink>
          </>
        ) : (
          <>
            <button
              onClick={() => showError("Fitur Presensi hanya aktif selama masa PKL Anda sedang berjalan (Aktif).")}
              className="flex items-center justify-between w-full px-3 py-2 text-text-muted hover:bg-surface-2/50 rounded-lg transition-all font-medium text-sm cursor-not-allowed group text-left"
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 shrink-0 text-text-muted" />
                <span className="truncate">Presensi</span>
              </div>
              <Lock className="w-3.5 h-3.5 text-border-strong group-hover:text-text-muted transition-colors" />
            </button>
            <button
              onClick={() => showError("Fitur Izin hanya aktif selama masa PKL Anda sedang berjalan (Aktif).")}
              className="flex items-center justify-between w-full px-3 py-2 text-text-muted hover:bg-surface-2/50 rounded-lg transition-all font-medium text-sm cursor-not-allowed group text-left"
            >
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-4 h-4 shrink-0 text-text-muted" />
                <span className="truncate">Izin</span>
              </div>
              <Lock className="w-3.5 h-3.5 text-border-strong group-hover:text-text-muted transition-colors" />
            </button>
          </>
        )}

        {status === "selesai" ? (
          <NavLink
            to="/dashboard/peserta/penilaian"
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all font-medium text-sm ${
                isActive ? "border-l-[3px] border-brand bg-brand/8 text-brand rounded-lg" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`
            }
          >
            <Award className="w-4 h-4 shrink-0" />
            <span className="truncate">Penilaian</span>
          </NavLink>
        ) : (
          <button
            onClick={() => showError("Fitur Penilaian dan Sertifikat hanya dapat diakses setelah masa PKL Anda telah Selesai.")}
            className="flex items-center justify-between w-full px-3 py-2 text-text-muted hover:bg-surface-2/50 rounded-lg transition-all font-medium text-sm cursor-not-allowed group text-left"
          >
            <div className="flex items-center gap-2.5">
              <Award className="w-4 h-4 shrink-0 text-text-muted" />
              <span className="truncate">Penilaian</span>
            </div>
            <Lock className="w-3.5 h-3.5 text-border-strong group-hover:text-text-muted transition-colors" />
          </button>
        )}

        {status && status !== "belum_mulai" && (
          <NavLink
            to="/dashboard/peserta/riwayat"
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all font-medium text-sm ${
                isActive ? "border-l-[3px] border-brand bg-brand/8 text-brand rounded-lg" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`
            }
          >
            <History className="w-4 h-4 shrink-0" />
            <span className="truncate">Riwayat PKL</span>
          </NavLink>
        )}

        <NavLink
          to="/dashboard/peserta/settings"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all font-medium text-sm ${
              isActive ? "border-l-[3px] border-brand bg-brand/8 text-brand rounded-lg" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
            }`
          }
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="truncate">Pengaturan Akun</span>
        </NavLink>
      </nav>

      <div className="p-3 border-t border-border-subtle shrink-0 space-y-2">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-900/20 shrink-0 text-xs">
            {initial}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-text-primary truncate">{name}</span>
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{roleLabel}</span>
          </div>
        </div>

        <Link
          to="/login"
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-text-muted hover:text-red-500 hover:bg-surface-1 rounded-lg transition-all font-medium text-sm group"
        >
          <LogOut className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="truncate">Keluar</span>
        </Link>
      </div>
    </aside>
  );
};

export default SidebarPeserta;
