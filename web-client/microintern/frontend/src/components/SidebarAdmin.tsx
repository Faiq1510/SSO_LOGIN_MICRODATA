import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { type User, getLocalUser, setLocalUser, logout } from "../utils/api";
import { getProfil } from "../services/profil.service";
import { LayoutDashboard, FileText, Users, Calendar, Award, Database, FileBarChart, Settings, LogOut, ClipboardList, FileBadge } from "lucide-react";

interface SidebarAdminProps {
  onNavigate?: () => void;
}

const SidebarAdmin: React.FC<SidebarAdminProps> = ({ onNavigate }) => {
  const [user, setUser] = useState<User | null>(() => getLocalUser());

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

    const fetchProfile = async () => {
      try {
        const res = await getProfil();
        if (res.status === "success" && res.data) {
          const currentUser = getLocalUser();
          if (currentUser) {
            const updated: User = {
              ...currentUser,
              name: res.data.name || currentUser.name,
            };
            setLocalUser(updated);
          }
        }
      } catch (err) {
        console.error("Gagal memuat profil admin:", err);
      }
    };

    fetchProfile();

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

  const name = user?.name || user?.email || "Admin HRD";
  const initial = name.charAt(0).toUpperCase();

  return (
    <aside className="flex flex-col h-full w-full bg-surface-0 border-r border-border-subtle">
      <div className="h-12 shrink-0 flex items-center px-4 border-b border-border-subtle md:flex hidden">
        <NavLink to="/" className="flex items-center gap-2">
          <img src="/microdata-logo.webp" alt="Logo" className="h-8 w-auto" />
          <span className="text-[10px] bg-orange-600 text-[#ffffff] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Admin</span>
        </NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 scrollbar-hide">
        <NavLink
          to="/dashboard/admin"
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all font-medium text-sm ${
              isActive ? "border-l-[3px] border-brand bg-brand/8 text-brand rounded-lg" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span className="truncate">Overview</span>
        </NavLink>

        <NavLink
          to="/dashboard/admin/pendaftaran"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all font-medium text-sm ${
              isActive ? "border-l-[3px] border-brand bg-brand/8 text-brand rounded-lg" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
            }`
          }
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span className="truncate">Pendaftaran</span>
        </NavLink>

        <NavLink
          to="/dashboard/admin/peserta"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all font-medium text-sm ${
              isActive ? "border-l-[3px] border-brand bg-brand/8 text-brand rounded-lg" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
            }`
          }
        >
          <Users className="w-4 h-4 shrink-0" />
          <span className="truncate">Data Peserta</span>
        </NavLink>

        <NavLink
          to="/dashboard/admin/presensi"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all font-medium text-sm ${
              isActive ? "border-l-[3px] border-brand bg-brand/8 text-brand rounded-lg" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
            }`
          }
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span className="truncate">Presensi Harian</span>
        </NavLink>

        <NavLink
          to="/dashboard/admin/izin"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all font-medium text-sm ${
              isActive ? "border-l-[3px] border-brand bg-brand/8 text-brand rounded-lg" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
            }`
          }
        >
          <ClipboardList className="w-4 h-4 shrink-0" />
          <span className="truncate">Pengajuan Izin</span>
        </NavLink>

        <NavLink
          to="/dashboard/admin/penilaian"
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

        <NavLink
          to="/dashboard/admin/website-settings"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all font-medium text-sm ${
              isActive ? "border-l-[3px] border-brand bg-brand/8 text-brand rounded-lg" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
            }`
          }
        >
          <Database className="w-4 h-4 shrink-0" />
          <span className="truncate">Pengaturan Website</span>
        </NavLink>

        <NavLink
          to="/dashboard/admin/dokumen"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all font-medium text-sm ${
              isActive ? "border-l-[3px] border-brand bg-brand/8 text-brand rounded-lg" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
            }`
          }
        >
          <FileBadge className="w-4 h-4 shrink-0" />
          <span className="truncate">Dokumen Generated</span>
        </NavLink>

        <NavLink
          to="/dashboard/admin/laporan"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all font-medium text-sm ${
              isActive ? "border-l-[3px] border-brand bg-brand/8 text-brand rounded-lg" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
            }`
          }
        >
          <FileBarChart className="w-4 h-4 shrink-0" />
          <span className="truncate">Laporan</span>
        </NavLink>

        <NavLink
          to="/dashboard/admin/settings"
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
        {}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-[#ffffff] font-bold shadow-lg shadow-orange-900/20 shrink-0 text-xs">
            {initial}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-text-primary truncate">{name}</span>
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Staf Perusahaan</span>
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

export default SidebarAdmin;
