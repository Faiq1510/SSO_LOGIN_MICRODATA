import React, { useState, useEffect } from "react";
import { getPresensiHariIni, getRiwayatPresensi } from "../../../services/presensi.service";
import { getPendaftaranSaya } from "../../../services/pendaftaran.service";
import { apiRequest } from "../../../utils/api";
import { useNotification } from "../../../components/ProviderNotifikasi";
import { getLocalDateString } from "../../../utils/date";
import { LogIn, LogOut } from "lucide-react";

interface AttendanceRecord {
  id: string;
  tanggal: string;
  jam_masuk: string | null;
  jam_keluar: string | null;
  status: "hadir" | "izin" | "alpha";
  kategori_izin?: string;
}

interface RegistrationData {
  id: string;
  tanggal_masuk: string;
  tanggal_keluar: string;
  status: string;
  kelompok_id: string;
}

const Presensi: React.FC = () => {
  const { showError, showSuccess } = useNotification();
  const [time, setTime] = useState<Date>(new Date());
  const [status, setStatus] = useState<"belum" | "datang" | "pulang">("belum");
  const [jamDatang, setJamDatang] = useState<string | null>(null);
  const [jamPulang, setJamPulang] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [activePeriod, setActivePeriod] = useState<boolean>(false);
  const [hasIzinToday, setHasIzinToday] = useState<boolean>(false);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [batasWaktuPresensi, setBatasWaktuPresensi] = useState<string>("23:59:00");

  const formatTimeStr = (isoStr: string | null) => {
    if (!isoStr) return null;
    const d = new Date(isoStr);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const calculateDuration = (masuk: string | null, keluar: string | null) => {
    if (!masuk || !keluar) return "—";
    const start = new Date(masuk).getTime();
    const end = new Date(keluar).getTime();
    if (end < start) return "—";
    const diffMs = end - start;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHrs > 0) {
      return `${diffHrs}h ${diffMins}m`;
    }
    return `${diffMins}m`;
  };

  const getLocalDateStr = (date: Date = new Date()): string => {
    return getLocalDateString(date);
  };

  const parseDateLocal = (dateStr: string): Date => {
    const [year, month, day] = String(dateStr).split("T")[0].split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const getDateKey = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const fetchAttendanceStatus = React.useCallback(async () => {
    try {
      const res = await getPresensiHariIni();
      if (res.status === "success" && res.data) {
        const { presensi, batas_waktu_presensi } = res.data;
        if (batas_waktu_presensi) {
          setBatasWaktuPresensi(batas_waktu_presensi);
        }
        const p = presensi;
        if (p) {
          if (p.status === "izin") {
            setHasIzinToday(true);
            setStatus("belum");
          } else {
            setHasIzinToday(false);
            if (p.jam_keluar) {
              setStatus("pulang");
              setJamDatang(formatTimeStr(p.jam_masuk));
              setJamPulang(formatTimeStr(p.jam_keluar));
            } else if (p.jam_masuk) {
              setStatus("datang");
              setJamDatang(formatTimeStr(p.jam_masuk));
              setJamPulang(null);
            } else {
              setStatus("belum");
              setJamDatang(null);
              setJamPulang(null);
            }
          }
        } else {
          setHasIzinToday(false);
          setStatus("belum");
          setJamDatang(null);
          setJamPulang(null);
        }
      } else {
        setHasIzinToday(false);
        setStatus("belum");
        setJamDatang(null);
        setJamPulang(null);
      }
    } catch (err) {
      console.error("Gagal mengambil status presensi hari ini:", err);
    }
  }, []);

  const fetchRiwayat = React.useCallback(async () => {
    try {
      const res = await getRiwayatPresensi();
      if (res.status === "success" && Array.isArray(res.data)) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error("Gagal mengambil riwayat presensi:", err);
    }
  }, []);

  const checkPendaftaran = React.useCallback(async () => {
    try {
      const res = await getPendaftaranSaya();
      if (res.status === "success" && res.data) {
        setRegistration(res.data);
        const localTodayStr = getLocalDateStr();
        const tMasuk = res.data.tanggal_masuk.split("T")[0];
        const tKeluar = res.data.tanggal_keluar.split("T")[0];
        const isActive = res.data.status === "aktif" && localTodayStr >= tMasuk && localTodayStr <= tKeluar;
        setActivePeriod(isActive);
      }
    } catch (err) {
      console.error("Gagal mengambil data pendaftaran:", err);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);

    const initData = async () => {
      setIsLoading(true);
      setHistory([]);
      setRegistration(null);
      setStatus("belum");
      setJamDatang(null);
      setJamPulang(null);
      setHasIzinToday(false);
      await Promise.all([checkPendaftaran(), fetchAttendanceStatus(), fetchRiwayat()]);
      setIsLoading(false);
    };

    initData();

    return () => clearInterval(timer);
  }, [checkPendaftaran, fetchAttendanceStatus, fetchRiwayat]);

  const handleDatang = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest("/presensi/datang", { method: "POST" });
      if (res.status === "success") {
        showSuccess("Presensi datang berhasil dicatat!");
        await Promise.all([fetchAttendanceStatus(), fetchRiwayat()]);
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Gagal mencatat presensi datang.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePulang = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest("/presensi/pulang", { method: "POST" });
      if (res.status === "success") {
        showSuccess("Presensi pulang berhasil dicatat!");
        await Promise.all([fetchAttendanceStatus(), fetchRiwayat()]);
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Gagal mencatat presensi pulang.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTanggal = (date: Date) => {
    return date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const getStatusBadgeClass = (statusVal: string) => {
    switch (statusVal) {
      case "hadir":
        return "bg-emerald-500/5 text-emerald-500 border-emerald-500/20 group-hover:bg-emerald-500/10";
      case "izin":
        return "bg-amber-500/5 text-amber-500 border-amber-500/20 group-hover:bg-amber-500/10";
      case "alpha":
        return "bg-red-500/5 text-red-500 border-red-500/20 group-hover:bg-red-500/10";
      default:
        return "bg-zinc-500/5 text-text-muted border-zinc-500/20 group-hover:bg-zinc-500/10";
    }
  };

  const getStatusLabel = (statusVal: string, kategori?: string) => {
    switch (statusVal) {
      case "hadir":
        return "Hadir";
      case "izin":
        return kategori || "Izin";
      case "alpha":
        return "Alpha";
      default:
        return statusVal;
    }
  };

  const hours = String(time.getHours()).padStart(2, "0");
  const minutes = String(time.getMinutes()).padStart(2, "0");
  const seconds = String(time.getSeconds()).padStart(2, "0");
  const timeStr = `${hours}:${minutes}:${seconds}`;
  const isPastDeadline = timeStr > (batasWaktuPresensi || "23:59:00");

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full -mr-48 -mt-48 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight mb-2">Presensi Digital</h1>
          <p className="text-text-muted font-medium italic">Sistem kehadiran real-time Microintern.</p>
        </div>
        <div className="bg-surface-1 border border-border-base p-4 px-6 rounded-3xl flex items-center justify-center gap-6 shadow-inner">
          <div className="flex flex-col items-center text-center">
            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 font-mono-data tracking-tighter">
              {time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{formatTanggal(time)}</p>
          </div>
        </div>
      </div>

      {}
      {!isLoading && !registration && (
        <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl text-sm font-medium">
          Anda belum mendaftarkan kelompok PKL atau belum disubmit. Silakan selesaikan pendaftaran Anda di dashboard.
        </div>
      )}
      {!isLoading && registration && registration.status !== "aktif" && (
        <div className="p-5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-3xl text-sm font-medium">
          Status pengajuan PKL Anda saat ini: <strong className="uppercase">{registration.status}</strong>. Tombol presensi akan aktif setelah disetujui oleh admin.
        </div>
      )}
      {!isLoading && registration && registration.status === "aktif" && !activePeriod && (
        <div className="flex items-start gap-4 p-5 bg-blue-500/5 border border-blue-500/10 rounded-3xl shadow-inner backdrop-blur-md">
          <div className="flex items-center justify-center p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
              />
            </svg>
          </div>

          <div className="space-y-1">
            <h4 className="text-[11px] font-bold text-blue-400 tracking-wider uppercase">Informasi Periode PKL</h4>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Periode PKL Anda berjalan pada{" "}
              <span className="font-semibold text-white underline decoration-blue-500/40 decoration-2 underline-offset-4">
                {new Date(registration.tanggal_masuk).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </span>{" "}
              s/d{" "}
              <span className="font-semibold text-white underline decoration-blue-500/40 decoration-2 underline-offset-4">
                {new Date(registration.tanggal_keluar).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </span>
              . Presensi hanya aktif pada rentang tanggal tersebut.
            </p>
          </div>
        </div>
      )}
      {!isLoading && hasIzinToday && (
        <div className="p-5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-3xl text-sm font-medium">
          Hari ini Anda terdaftar dalam status <strong>Izin / Cuti</strong>. Tombol presensi dinonaktifkan.
        </div>
      )}
      {!isLoading && registration && registration.status === "aktif" && activePeriod && !hasIzinToday && status === "belum" && isPastDeadline && (
        <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl text-sm font-medium">
          Batas waktu presensi hari ini ({batasWaktuPresensi.substring(0, 5)}) telah terlewati. Anda tidak dapat melakukan presensi lagi hari ini.
        </div>
      )}

      <div className="max-w-4xl mx-auto w-full group relative">
        <div className="relative bg-surface-0/80 border border-border-subtle p-6 sm:p-10 rounded-3xl overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full -ml-32 -mb-32"></div>

          <div className="relative z-10 flex flex-col items-center justify-center text-center mb-10">
            <span className="px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 text-brand rounded-full text-xs font-black uppercase tracking-widest mb-4">
              Status Hari Ini
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight mb-2">
              {status === "belum" && "Belum Presensi"}
              {status === "datang" && "Sedang Berlangsung"}
              {status === "pulang" && "Selesai"}
            </h2>
            <p className="text-text-secondary font-medium text-lg">
              {status === "belum" && "Silakan catat kehadiran Anda hari ini."}
              {status === "datang" && "Semangat menjalani aktivitas PKL hari ini!"}
              {status === "pulang" && "Terima kasih atas kerja keras Anda hari ini!"}
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <button
              onClick={handleDatang}
              disabled={status !== "belum" || !activePeriod || hasIzinToday || isLoading || isPastDeadline}
              className={`relative group/btn flex flex-col items-center justify-center p-8 rounded-2xl border transition-all duration-300 overflow-hidden ${
                status === "belum" && activePeriod && !hasIzinToday && !isLoading && !isPastDeadline
                  ? "border-orange-500/30 hover:border-orange-500 hover:bg-orange-500/5 text-brand"
                  : "border-border-subtle bg-surface-1 text-zinc-600 cursor-not-allowed"
              }`}
            >
              <div
                className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-6 transition-all duration-500 ${
                  status === "belum" && activePeriod && !hasIzinToday && !isLoading && !isPastDeadline
                    ? "bg-orange-500/20 group-hover/btn:scale-110 group-hover/btn:-rotate-12 shadow-inner"
                    : "bg-surface-1"
                }`}
              >
                <LogIn className="w-10 h-10" />
              </div>
              <span className="font-black text-2xl tracking-tight uppercase mb-2">Datang</span>
              <span className="px-4 py-1.5 rounded-full bg-surface-0/80 border border-border-base text-sm font-bold opacity-80 font-mono-data">
                {jamDatang ? `${jamDatang} WIB` : "Menunggu.."}
              </span>
            </button>

            <button
              onClick={handlePulang}
              disabled={status !== "datang" || !activePeriod || hasIzinToday || isLoading}
              className={`relative group/btn flex flex-col items-center justify-center p-8 rounded-2xl border transition-all duration-300 overflow-hidden ${
                status === "datang" && activePeriod && !hasIzinToday && !isLoading
                  ? "border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/5 text-emerald-500"
                  : "border-border-subtle bg-surface-1 text-zinc-600 cursor-not-allowed"
              }`}
            >
              <div
                className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-6 transition-all duration-500 ${
                  status === "datang" && activePeriod && !hasIzinToday && !isLoading
                    ? "bg-emerald-500/20 group-hover/btn:scale-110 group-hover/btn:rotate-12 shadow-inner"
                    : "bg-surface-1"
                }`}
              >
                <LogOut className="w-10 h-10" />
              </div>
              <span className="font-black text-2xl tracking-tight uppercase mb-2">Pulang</span>
              <span className="px-4 py-1.5 rounded-full bg-surface-0/80 border border-border-base text-sm font-bold opacity-80 font-mono-data">
                {jamPulang ? `${jamPulang} WIB` : "Menunggu.."}
              </span>
            </button>
          </div>
        </div>
      </div>

      {registration && (
        <section className="bg-surface-1 border border-border-base rounded-3xl p-6 shadow-sm">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Rekap Presensi Saya</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-surface-0/50 rounded-2xl p-4 space-y-1 border border-border-subtle">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Hadir</p>
              <p className="text-3xl font-black text-text-primary tabular-nums">{history.filter((h) => h.status === "hadir").length}</p>
              <p className="text-[10px] text-emerald-500 font-medium">Hari</p>
            </div>
            <div className="bg-surface-0/50 rounded-2xl p-4 space-y-1 border border-border-subtle">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Izin</p>
              <p className="text-3xl font-black text-text-primary tabular-nums">{history.filter((h) => h.status === "izin").length}</p>
              <p className="text-[10px] text-amber-400 font-medium">Hari</p>
            </div>
            <div className="bg-surface-0/50 rounded-2xl p-4 space-y-1 border border-border-subtle">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Alpha</p>
              <p className="text-3xl font-black text-text-primary tabular-nums">{history.filter((h) => h.status === "alpha").length}</p>
              <p className="text-[10px] text-red-400 font-medium">Hari</p>
            </div>
            <div className="bg-surface-0/50 rounded-2xl p-4 space-y-1 border border-border-subtle">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total</p>
              <p className="text-3xl font-black text-text-primary tabular-nums">{history.length}</p>
              <p className="text-[10px] text-text-secondary font-medium">Hari Tercatat</p>
            </div>
            <div className="col-span-2 sm:col-span-3 lg:col-span-1 bg-surface-0/50 rounded-2xl p-4 space-y-1 border border-border-subtle">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Presentase Kehadiran</p>
              {(() => {
                const totalHadir = history.filter((h) => h.status === "hadir").length;
                const percent = history.length > 0 ? (totalHadir / history.length) * 100 : 0;
                const colorClass = percent < 80 ? "text-red-500" : percent < 90 ? "text-amber-400" : "text-emerald-500";
                return <p className={`text-3xl font-black tabular-nums ${colorClass}`}>{percent.toFixed(1)}%</p>;
              })()}
              <p className="text-[10px] text-text-secondary font-medium">dari total tercatat</p>
            </div>
          </div>
        </section>
      )}

      <div className="bg-surface-1 border border-border-base rounded-2xl shadow-sm overflow-hidden">
        <div className="p-8 sm:p-10 border-b border-border-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h2 className="text-2xl font-black text-text-primary tracking-tight">Log Aktivitas</h2>
            <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1 italic">
              Histori Kehadiran: {selectedDate instanceof Date ? selectedDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" }) : ""}
            </p>
          </div>

          <div className="relative flex items-center">
            <input
              type="month"
              value={selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}` : ""}
              onChange={(e) => {
                if (e.target.value) {
                  const [year, month] = e.target.value.split("-");
                  setSelectedDate(new Date(Number(year), Number(month) - 1, 1));
                }
              }}
              className="bg-surface-0 border border-border-base text-text-primary hover:bg-surface-1 hover:border-border-strong px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer outline-none focus:border-orange-500/50"
            />
          </div>
        </div>

        <div className="md:hidden divide-y divide-border-subtle">
          {(() => {
            const days = getDaysInMonth(selectedDate).filter((tDate) => {
              const isWeekend = tDate.getDay() === 0 || tDate.getDay() === 6;
              if (!isWeekend) return true;
              return history.some((h) => {
                const hDate = parseDateLocal(String(h.tanggal));
                return hDate.getFullYear() === tDate.getFullYear() && hDate.getMonth() === tDate.getMonth() && hDate.getDate() === tDate.getDate();
              });
            });
            return days.map((tDate) => {
              const item = history.find((h) => {
                const hDate = parseDateLocal(String(h.tanggal));
                return hDate.getFullYear() === tDate.getFullYear() && hDate.getMonth() === tDate.getMonth() && hDate.getDate() === tDate.getDate();
              });

              if (item) {
                return (
                  <div key={getDateKey(tDate)} className="p-5 hover:bg-surface-2 transition-colors space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-text-primary">{tDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                        <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">{tDate.toLocaleDateString("id-ID", { weekday: "long" })}</span>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all shrink-0 ${getStatusBadgeClass(
                          item.status
                        )}`}
                      >
                        {getStatusLabel(item.status, item.kategori_izin)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-border-subtle/50">
                      <div>
                        <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Masuk</p>
                        <p className="font-mono-data text-text-secondary">{formatTimeStr(item.jam_masuk) || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Keluar</p>
                        <p className="font-mono-data text-text-secondary">{formatTimeStr(item.jam_keluar) || "—"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Durasi</p>
                        <p className="font-mono-data text-orange-400">{calculateDuration(item.jam_masuk, item.jam_keluar)}</p>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={getDateKey(tDate)} className="p-5 hover:bg-surface-2 transition-colors opacity-60 space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-text-primary">{tDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                      <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">{tDate.toLocaleDateString("id-ID", { weekday: "long" })}</span>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all bg-zinc-500/5 text-text-muted border-zinc-500/20 shrink-0">
                      Belum
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-border-subtle/50">
                    <div>
                      <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Masuk</p>
                      <p className="font-mono-data text-text-muted">—</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Keluar</p>
                      <p className="font-mono-data text-text-muted">—</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Durasi</p>
                      <p className="font-mono-data text-text-muted">—</p>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        <div className="hidden md:block overflow-x-auto rounded-b-[2.5rem]">
          <table className="w-full text-left text-sm text-text-secondary">
            <thead className="text-[10px] text-text-muted uppercase tracking-[0.2em] bg-surface-0/30">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold text-center w-20">
                  ID
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Timeline
                </th>
                <th scope="col" className="px-5 py-3 font-semibold text-center">
                  Masuk
                </th>
                <th scope="col" className="px-5 py-3 font-semibold text-center">
                  Keluar
                </th>
                <th scope="col" className="px-5 py-3 font-semibold text-center">
                  Durasi
                </th>
                <th scope="col" className="px-5 py-3 font-semibold text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {(() => {
                const days = getDaysInMonth(selectedDate).filter((tDate) => {
                  const isWeekend = tDate.getDay() === 0 || tDate.getDay() === 6;
                  if (!isWeekend) return true;
                  return history.some((h) => {
                    const hDate = parseDateLocal(String(h.tanggal));
                    return hDate.getFullYear() === tDate.getFullYear() && hDate.getMonth() === tDate.getMonth() && hDate.getDate() === tDate.getDate();
                  });
                });
                return days.map((tDate, index) => {
                  const item = history.find((h) => {
                    const hDate = parseDateLocal(String(h.tanggal));
                    return hDate.getFullYear() === tDate.getFullYear() && hDate.getMonth() === tDate.getMonth() && hDate.getDate() === tDate.getDate();
                  });

                  if (item) {
                    return (
                      <tr key={getDateKey(tDate)} className="group hover:bg-surface-2 transition-colors">
                        <td className="px-5 py-3.5 text-center text-zinc-600 font-mono-data text-xs italic">{index + 1}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-bold text-text-primary">{tDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                            <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">{tDate.toLocaleDateString("id-ID", { weekday: "long" })}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono-data text-text-secondary group-hover:text-text-primary transition-colors">
                          {formatTimeStr(item.jam_masuk) || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono-data text-text-secondary group-hover:text-text-primary transition-colors">
                          {formatTimeStr(item.jam_keluar) || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono-data text-orange-400">{calculateDuration(item.jam_masuk, item.jam_keluar)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${getStatusBadgeClass(
                              item.status
                            )}`}
                          >
                            {getStatusLabel(item.status, item.kategori_izin)}
                          </span>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={getDateKey(tDate)} className="group hover:bg-surface-2 transition-colors opacity-60">
                      <td className="px-5 py-3.5 text-center text-zinc-600 font-mono-data text-xs italic">{index + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-text-primary">{tDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                          <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">{tDate.toLocaleDateString("id-ID", { weekday: "long" })}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono-data text-text-muted">—</td>
                      <td className="px-5 py-3.5 text-center font-mono-data text-text-muted">—</td>
                      <td className="px-5 py-3.5 text-center font-mono-data text-text-muted">—</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all bg-zinc-500/5 text-text-muted border-zinc-500/20">
                          Belum
                        </span>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Presensi;
