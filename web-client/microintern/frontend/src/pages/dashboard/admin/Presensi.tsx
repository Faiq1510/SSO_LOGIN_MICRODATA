import React, { useState, useEffect } from "react";
import { adminGetPresensiHarian } from "../../../services/presensi.service";
import { getLocalDateString } from "../../../utils/date";
import { Search } from "lucide-react";

interface AttendanceLog {
  user_id: string;
  nama_lengkap: string;
  institusi: string;
  program_studi: string;
  id: string | null;
  tanggal: string | null;
  jam_masuk: string | null;
  jam_keluar: string | null;
  status: "hadir" | "izin" | "alpha" | "belum";
  kategori_izin?: string;
}

const Attendances: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [attendances, setAttendances] = useState<AttendanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (selectedDate instanceof Date) {
      const fetchAttendances = async (date: Date) => {
        try {
          await Promise.resolve();
          if (active) setIsLoading(true);

          const dateStr = getLocalDateString(date);

          const res = await adminGetPresensiHarian(dateStr);
          if (active && res.status === "success" && Array.isArray(res.data)) {
            setAttendances(res.data);
          }
        } catch (err) {
          console.error("Gagal mengambil data presensi harian:", err);
        } finally {
          if (active) setIsLoading(false);
        }
      };

      fetchAttendances(selectedDate);
    }
    return () => {
      active = false;
    };
  }, [selectedDate]);

  const formatTimeStr = (isoStr: string | null) => {
    if (!isoStr) return "—";
    const d = new Date(isoStr);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
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

  const getStatusBadgeClass = (statusVal: string) => {
    switch (statusVal) {
      case "hadir":
        return "bg-emerald-500/5 text-emerald-500 border-emerald-500/10";
      case "izin":
        return "bg-amber-500/5 text-amber-500 border-amber-500/10";
      case "alpha":
        return "bg-red-500/5 text-red-500 border-red-500/10";
      case "belum":
      default:
        return "bg-zinc-500/5 text-text-muted border-zinc-500/10";
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
      case "belum":
        return "Belum Absen";
      default:
        return statusVal;
    }
  };

  const totalActive = attendances.length;
  const totalHadir = attendances.filter((a) => a.status === "hadir").length;
  const totalIzin = attendances.filter((a) => a.status === "izin").length;
  const totalBelum = attendances.filter((a) => a.status === "belum").length;

  const filteredAttendances = attendances.filter(
    (a) =>
      a.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.institusi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.program_studi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand/5 rounded-full -translate-y-1/2 pointer-events-none"></div>

      <div className="flex flex-col gap-8 lg:flex-row lg:justify-between lg:items-center">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight mb-2">Monitoring Presensi</h1>
          <p className="text-text-muted font-medium italic text-sm">Pantau kehadiran real-time seluruh peserta PKL aktif.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 sm:min-w-[240px]">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search participants..."
              className="w-full bg-surface-1 border border-border-base text-text-primary pl-12 pr-4 py-3 rounded-2xl text-sm focus:border-orange-500/50 outline-none transition-all shadow-inner"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          </div>
          <div className="relative">
            <input
              type="date"
              value={getLocalDateString(selectedDate)}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(new Date(e.target.value));
                }
              }}
              className="bg-surface-1 border border-border-base text-text-primary px-4 py-3 rounded-2xl text-sm focus:border-orange-500/50 outline-none transition-all shadow-inner cursor-pointer w-full sm:w-auto h-full"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-1 border border-border-base p-6 rounded-2xl shadow-sm relative group overflow-hidden">
          <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Hadir</p>
          <h3 className="text-3xl font-black text-emerald-500 mt-2 font-mono-data tracking-tight">{totalHadir}</h3>
        </div>
        <div className="bg-surface-1 border border-border-base p-6 rounded-2xl shadow-sm relative group overflow-hidden">
          <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Izin/Sakit</p>
          <h3 className="text-3xl font-black text-amber-500 mt-2 font-mono-data tracking-tight">{totalIzin}</h3>
        </div>
        <div className="bg-surface-1 border border-border-base p-6 rounded-2xl shadow-sm relative group overflow-hidden">
          <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Belum Absen</p>
          <h3 className="text-3xl font-black text-text-muted mt-2 font-mono-data tracking-tight">{totalBelum}</h3>
        </div>
        <div className="bg-surface-1 border border-border-base p-6 rounded-2xl shadow-sm relative group overflow-hidden">
          <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Total Active</p>
          <h3 className="text-3xl font-black text-text-primary mt-2 font-mono-data tracking-tight">{totalActive}</h3>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute -inset-0.5 rounded-2xl blur opacity-20"></div>
        <div className="relative bg-surface-1 border border-border-base rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border-subtle flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-text-primary tracking-tight">Daily Attendance Log</h3>
              <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1 italic">
                Tanggal: {selectedDate instanceof Date ? selectedDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
              </p>
            </div>
          </div>

          <div className="md:hidden divide-y divide-border-subtle">
            {isLoading ? (
              <div className="px-5 py-8 text-center text-text-muted italic">Memuat data presensi...</div>
            ) : filteredAttendances.length === 0 ? (
              <div className="px-5 py-8 text-center text-text-muted italic">Tidak ada peserta aktif pada tanggal ini atau data tidak ditemukan.</div>
            ) : (
              filteredAttendances.map((item) => (
                <div key={item.user_id} className="p-5 hover:bg-surface-2 transition-all space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col min-w-0">
                      <span className="text-text-primary font-bold tracking-tight text-base truncate">{item.nama_lengkap}</span>
                      <span className="text-[10px] text-text-muted uppercase tracking-widest font-black mt-0.5 truncate">
                        {item.institusi} - {item.program_studi}
                      </span>
                    </div>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest shrink-0 ${getStatusBadgeClass(item.status)}`}>
                      {getStatusLabel(item.status, item.kategori_izin)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-border-subtle/50">
                    <div>
                      <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Clock In</p>
                      <p className="font-mono-data text-text-secondary">{item.jam_masuk ? formatTimeStr(item.jam_masuk) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Clock Out</p>
                      <p className="font-mono-data text-text-secondary">{item.jam_keluar ? formatTimeStr(item.jam_keluar) : "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Duration</p>
                      <p className="font-mono-data text-orange-400">{calculateDuration(item.jam_masuk, item.jam_keluar)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto scrollbar-hide rounded-b-[2.5rem]">
            <table className="w-full text-left text-sm text-text-secondary min-w-[700px]">
              <thead className="text-[10px] text-text-muted uppercase tracking-[0.2em] bg-surface-0/30">
                <tr>
                  <th className="px-5 py-3 font-semibold">Identity / Institusi</th>
                  <th className="px-5 py-3 font-semibold text-center">Clock In</th>
                  <th className="px-5 py-3 font-semibold text-center">Clock Out</th>
                  <th className="px-5 py-3 font-semibold text-center">Duration</th>
                  <th className="px-5 py-3 font-semibold text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-text-muted italic">
                      Memuat data presensi...
                    </td>
                  </tr>
                ) : filteredAttendances.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-text-muted italic">
                      Tidak ada peserta aktif pada tanggal ini atau data tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredAttendances.map((item) => (
                    <tr key={item.user_id} className="group hover:bg-surface-2 transition-all">
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-text-primary font-bold tracking-tight text-lg group-hover:text-orange-400 transition-colors">{item.nama_lengkap}</span>
                          <span className="text-[10px] text-text-muted uppercase tracking-widest font-black mt-0.5 italic">
                            {item.institusi} - {item.program_studi}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono-data text-xs text-text-secondary">{item.jam_masuk ? formatTimeStr(item.jam_masuk) : "—"}</td>
                      <td className="px-5 py-3.5 text-center font-mono-data text-xs text-text-secondary">{item.jam_keluar ? formatTimeStr(item.jam_keluar) : "—"}</td>
                      <td className="px-5 py-3.5 text-center font-mono-data text-xs text-orange-400">{calculateDuration(item.jam_masuk, item.jam_keluar)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border uppercase tracking-widest ${getStatusBadgeClass(item.status)}`}>
                          {getStatusLabel(item.status, item.kategori_izin)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendances;
