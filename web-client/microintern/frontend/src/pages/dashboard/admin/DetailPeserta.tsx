import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getParticipantDetail, getParticipantHistori, getParticipantPresensi } from "../../../services/peserta.service";
import { useNotification } from "../../../components/ProviderNotifikasi";
import { ChevronLeft, ChevronRight, FileText, Pencil } from "lucide-react";

import ModalPratinjauBerkas from "../../../components/ModalPratinjauBerkas";

interface ParticipantDetailData {
  nama: string;
  email: string;
  nim: string;
  institusi: string;
  prodi: string;
  status: string;
  email_verified: boolean;
  periode: string;
  tanggal_masuk: string | null;
  tanggal_keluar: string | null;
  cv: string | null;
  surat: string | null;
  surat_balasan_url: string | null;
  sertifikat_url: string | null;
  attendance: {
    total_hadir: number;
    total_izin: number;
    total_alpha: number;
  };
}

interface DBParticipantDetail {
  nama: string | null;
  email: string;
  nim: string | null;
  institusi: string | null;
  prodi: string | null;
  status_pengajuan: string | null;
  email_verified: boolean;
  tanggal_masuk: string | null;
  tanggal_keluar: string | null;
  cv_url: string | null;
  surat_pengantar_url: string | null;
  surat_balasan_url: string | null;
  sertifikat_url: string | null;
  attendance: {
    total_hadir: number;
    total_izin: number;
    total_alpha: number;
  } | null;
}

interface HistoryItem {
  pengajuan_id: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  jenis_kelompok: string;
  jumlah_anggota?: string;
  status: string;
  surat_balasan_url?: string;
  sertifikat_url?: string;
  nomor_sertifikat?: string;
  nilai_akhir?: number | string;
  created_at: string;
}

interface AttendanceRecord {
  id: string | null;
  user_id: string;
  tanggal: string;
  jam_masuk: string | null;
  jam_keluar: string | null;
  status: "hadir" | "izin" | "alpha" | "belum";
  kategori_izin: string | null;
}

const IconFile = () => <FileText className="w-5 h-5" />;

const IconEdit = () => <Pencil className="w-4 h-4" />;

const countWeekdays = (startStr: string | null, endStr: string | null): number => {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  let count = 0;
  const cur = new Date(s.getTime());
  while (cur <= e) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full border uppercase tracking-widest ${
      active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
    {active ? "Aktif" : "Nonaktif"}
  </span>
);

const LedgerRow: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="flex items-baseline justify-between gap-4 py-4 border-b border-border-subtle last:border-0">
    <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] shrink-0 w-40">{label}</span>
    <span className={`text-right ${mono ? "font-mono-data text-xs text-text-secondary" : "text-sm font-medium text-text-primary"}`}>{value}</span>
  </div>
);

const AttendanceBar: React.FC<{
  hadir: number;
  izin: number;
  alpha: number;
  totalDuration: number;
}> = ({ hadir, izin, alpha, totalDuration }) => {
  const total = Math.max(totalDuration, hadir + izin + alpha) || 1;
  const pHadir = (hadir / total) * 100;
  const pIzin = (izin / total) * 100;
  const pAlpha = (alpha / total) * 100;

  return (
    <div className="space-y-5">
      {/* Progress Bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-zinc-800 gap-px">
        <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${pHadir}%` }} />
        <div className="bg-amber-400 transition-all duration-700" style={{ width: `${pIzin}%` }} />
        <div className="bg-red-500 transition-all duration-700" style={{ width: `${pAlpha}%` }} />
      </div>
      {/* Stat Grid */}
      <div className="grid grid-cols-5 divide-x divide-zinc-800">
        <div className="pr-6 space-y-1">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Hadir</p>
          <p className="text-3xl font-black text-text-primary tabular-nums">{hadir}</p>
          <p className="text-[10px] text-emerald-500 font-medium">Hari</p>
        </div>
        <div className="px-6 space-y-1">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Izin</p>
          <p className="text-3xl font-black text-text-primary tabular-nums">{izin}</p>
          <p className="text-[10px] text-amber-400 font-medium">Hari</p>
        </div>
        <div className="px-6 space-y-1">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Alpha</p>
          <p className="text-3xl font-black text-text-primary tabular-nums">{alpha}</p>
          <p className="text-[10px] text-red-400 font-medium">Hari</p>
        </div>
        <div className="px-6 space-y-1">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total</p>
          <p className="text-3xl font-black text-text-primary tabular-nums">{total}</p>
          <p className="text-[10px] text-text-secondary font-medium">Hari Tercatat</p>
        </div>
        <div className="pl-6 space-y-1">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Presentase Kehadiran</p>
          <p className={`text-3xl font-black tabular-nums ${pHadir < 80 ? "text-red-500" : pHadir < 90 ? "text-amber-400" : "text-emerald-500"}`}>{pHadir.toFixed(1)}%</p>
          <p className="text-[10px] text-text-secondary font-medium">dari total tercatat</p>
        </div>
      </div>
    </div>
  );
};

const DocTile: React.FC<{
  label: string;
  filename: string | null;
  accentColor: string;
  onClick: () => void;
}> = ({ label, filename, accentColor, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!filename}
    className={`group w-full flex items-center gap-4 p-4 bg-surface-0 border rounded-2xl transition-all duration-200 text-left cursor-pointer
      ${filename ? `border-border-base hover:border-${accentColor}-500/40 hover:bg-surface-1` : "border-border-subtle opacity-40 cursor-not-allowed"}`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-${accentColor}-500/10 text-${accentColor}-400`}>
      <IconFile />
    </div>
    <div className="flex-1 overflow-hidden">
      <p className="text-xs font-bold text-text-primary">{label}</p>
      <p className="text-[10px] text-text-muted truncate mt-0.5">{filename ? filename.split("/").pop() : "Belum diunggah"}</p>
    </div>
  </button>
);

const DetailPeserta: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [participant, setParticipant] = useState<ParticipantDetailData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string } | null>(null);
  const { showError } = useNotification();
  const [presensi, setPresensi] = useState<AttendanceRecord[]>([]);
  const [availableMonths, setAvailableMonths] = useState<Date[]>([]);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(0);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await getParticipantDetail(id!);
        if (res.status === "success" && res.data) {
          const item = res.data as DBParticipantDetail;

          let displayStatus = "Onboarding";
          if (item.status_pengajuan === "aktif") displayStatus = "Aktif";
          else if (item.status_pengajuan === "selesai") displayStatus = "Selesai";
          else if (item.status_pengajuan === "menunggu") displayStatus = "Menunggu";
          else if (item.status_pengajuan === "ditolak") displayStatus = "Ditolak";

          let displayPeriode = "-";
          if (item.tanggal_masuk && item.tanggal_keluar) {
            const start = new Date(item.tanggal_masuk);
            const end = new Date(item.tanggal_keluar);
            const formatDate = (d: Date) =>
              d.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
            displayPeriode = `${formatDate(start)} – ${formatDate(end)}`;
          }

          setParticipant({
            nama: item.nama || "Tanpa Nama",
            email: item.email,
            nim: item.nim || "-",
            institusi: item.institusi || "-",
            prodi: item.prodi || "-",
            status: displayStatus,
            email_verified: item.email_verified,
            periode: displayPeriode,
            tanggal_masuk: item.tanggal_masuk,
            tanggal_keluar: item.tanggal_keluar,
            cv: item.cv_url,
            surat: item.surat_pengantar_url,
            surat_balasan_url: item.surat_balasan_url,
            sertifikat_url: item.sertifikat_url,
            attendance: item.attendance || { total_hadir: 0, total_izin: 0, total_alpha: 0 },
          });

          if (item.tanggal_masuk && item.tanggal_keluar) {
            const start = new Date(item.tanggal_masuk);
            const end = new Date(item.tanggal_keluar);
            const months: Date[] = [];
            const curr = new Date(start.getFullYear(), start.getMonth(), 1);
            const last = new Date(end.getFullYear(), end.getMonth(), 1);
            while (curr <= last) {
              months.push(new Date(curr));
              curr.setMonth(curr.getMonth() + 1);
            }
            setAvailableMonths(months);
            const today = new Date();
            const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const foundIndex = months.findIndex((m) => m.getTime() === todayMonth.getTime());
            if (foundIndex !== -1) {
              setCurrentMonthIndex(foundIndex);
            } else {
              setCurrentMonthIndex(0);
            }
          }
        }
        const resHistori = await getParticipantHistori(id!);
        if (resHistori.status === "success") {
          setHistory(resHistori.data || []);
        }
        const resPresensi = await getParticipantPresensi(id!);
        if (resPresensi.status === "success") {
          setPresensi(resPresensi.data || []);
        }
      } catch (err) {
        console.error("Gagal memuat detail peserta:", err);
        showError(err instanceof Error ? err.message : "Gagal memuat detail peserta.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchDetail();
  }, [id, showError]);

  const handlePreview = (fileUrl: string | null, title: string) => {
    if (!fileUrl) {
      showError("Dokumen tidak ditemukan.");
      return;
    }
    setPreviewFile({ url: fileUrl, title });
  };

  const handlePrevMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex < availableMonths.length - 1) {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  };

  const renderCalendarDays = (activeMonth: Date) => {
    if (!participant || !participant.tanggal_masuk || !participant.tanggal_keluar) {
      return null;
    }

    const year = activeMonth.getFullYear();
    const month = activeMonth.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    const cells = [];

    for (let i = 0; i < startOffset; i++) {
      cells.push(<div key={`empty-${i}`} className="opacity-0 cursor-default select-none pointer-events-none" />);
    }

    const startLimit = new Date(participant.tanggal_masuk);
    startLimit.setHours(0, 0, 0, 0);
    const endLimit = new Date(participant.tanggal_keluar);
    endLimit.setHours(0, 0, 0, 0);

    for (let d = 1; d <= totalDays; d++) {
      const cellDate = new Date(year, month, d);
      cellDate.setHours(0, 0, 0, 0);

      const cellTime = cellDate.getTime();
      const inRange = cellTime >= startLimit.getTime() && cellTime <= endLimit.getTime();

      if (!inRange) {
        cells.push(
          <div
            key={`day-${d}`}
            className="aspect-square rounded-xl bg-transparent border border-transparent opacity-50 flex items-center justify-center text-text-secondary text-xs cursor-default select-none pointer-events-none"
          >
            {d}
          </div>
        );
        continue;
      }

      const record = presensi.find((p) => {
        const pDate = new Date(p.tanggal);
        return pDate.getFullYear() === cellDate.getFullYear() && pDate.getMonth() === cellDate.getMonth() && pDate.getDate() === cellDate.getDate();
      });

      let detailText = "Belum tercatat";
      let cellClass = "bg-surface-2 text-text-secondary border-border-strong/60 hover:bg-surface-3";

      if (record) {
        const status = record.status;
        if (status === "hadir") {
          const formatTime = (isoStr: string | null) => {
            if (!isoStr) return "—";
            return new Date(isoStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
          };
          detailText = `Hadir (Masuk: ${formatTime(record.jam_masuk)} | Pulang: ${formatTime(record.jam_keluar)})`;
          cellClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20";
        } else if (status === "izin") {
          detailText = `Izin (${record.kategori_izin || "Cuti"})`;
          cellClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20";
        } else if (status === "alpha") {
          detailText = "Alpha (Tanpa Keterangan)";
          cellClass = "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20";
        }
      } else {
        const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
        if (isWeekend) {
          detailText = "Libur Akhir Pekan";
          cellClass = "bg-surface-1/40 text-text-secondary/70 border-border-base border-dashed hover:bg-surface-2/40";
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (cellTime < today.getTime()) {
            detailText = "Alpha (Tanpa Keterangan)";
            cellClass = "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20";
          }
        }
      }

      const formattedDate = cellDate.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      cells.push(
        <div
          key={`day-${d}`}
          className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative group transition-all duration-200 cursor-pointer ${cellClass}`}
        >
          <span className="text-xs font-black tracking-tight">{d}</span>

          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-zinc-950 border border-zinc-800 text-text-primary text-[10px] py-1.5 px-3 rounded-xl shadow-xl z-50 whitespace-nowrap">
            <p className="font-bold text-text-primary">{formattedDate}</p>
            <p className="text-text-secondary mt-0.5">{detailText}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-950"></div>
          </div>
        </div>
      );
    }

    return cells;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-brand/20 border-t-orange-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!participant) {
    return <div className="text-center text-text-muted italic py-20 bg-surface-1 border border-border-base rounded-3xl">Peserta tidak ditemukan atau data tidak lengkap.</div>;
  }

  const initial = participant.nama.charAt(0).toUpperCase();

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <Link
        to="/dashboard/admin/peserta"
        className="group inline-flex items-center gap-2 px-4 py-2 w-fit rounded-full bg-surface-1 border border-border-base text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-all shadow-sm"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Daftar Peserta
      </Link>

      {}
      <div className="relative bg-surface-1 border border-border-base rounded-3xl overflow-hidden">
        {}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6 p-8">
          {}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-text-primary text-3xl font-black shadow-sm shadow-orange-900/30">
              {initial}
            </div>
            {}
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 ${participant.email_verified ? "bg-emerald-400" : "bg-zinc-600"}`} />
          </div>

          {}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-text-primary tracking-tight truncate">{participant.nama}</h1>
              <StatusBadge active={participant.email_verified} />
            </div>
            <p className="text-sm text-text-muted">{participant.email}</p>
            <p className="text-xs text-text-secondary font-mono-data mt-1">PKL {participant.status}</p>
          </div>

          {}
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              to={`/dashboard/admin/peserta/${id}/ubah`}
              className="inline-flex items-center gap-2 bg-brand hover:bg-orange-500 text-text-primary px-4 py-2 rounded-xl text-xs font-bold shadow-sm shadow-orange-900/30 transition-all"
            >
              <IconEdit />
              Edit Data
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <section className="bg-surface-1 border border-border-base rounded-3xl p-8">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-2">Informasi Akademik &amp; PKL</p>
          <h2 className="text-lg font-bold text-text-primary mb-6">Data Peserta</h2>

          <div>
            <LedgerRow label="NIM / NISN" value={participant.nim} />
            <LedgerRow label="Institusi Asal" value={participant.institusi} />
            <LedgerRow label="Program Studi" value={participant.prodi} />
            <LedgerRow label="Periode PKL" value={participant.periode} />
          </div>
        </section>

        <section className="bg-surface-1 border border-border-base rounded-3xl p-8 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-2">Rekap Kehadiran</p>
              <h2 className="text-lg font-bold text-text-primary">Status Presensi</h2>
            </div>

            {availableMonths.length > 0 && (
              <div className="flex items-center gap-3 bg-surface-2 border border-border-subtle px-4 py-2 rounded-2xl">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={currentMonthIndex === 0}
                  className="p-1 hover:text-brand disabled:opacity-30 disabled:hover:text-inherit transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-text-primary min-w-[100px] text-center uppercase tracking-wider">
                  {availableMonths[currentMonthIndex].toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={currentMonthIndex === availableMonths.length - 1}
                  className="p-1 hover:text-brand disabled:opacity-30 disabled:hover:text-inherit transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <AttendanceBar
              hadir={participant.attendance.total_hadir}
              izin={participant.attendance.total_izin}
              alpha={participant.attendance.total_alpha}
              totalDuration={countWeekdays(participant.tanggal_masuk, participant.tanggal_keluar)}
            />

            {availableMonths.length > 0 ? (
              <div className="border-t border-border-subtle pt-6">
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
                    <div key={day} className="text-center text-[10px] font-bold text-text-secondary uppercase tracking-wider py-1">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">{renderCalendarDays(availableMonths[currentMonthIndex])}</div>

                <div className="flex flex-wrap gap-4 mt-6 justify-center text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20" />
                    <span>Hadir</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-md bg-amber-500/10 border border-amber-500/20" />
                    <span>Izin</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-md bg-red-500/10 border border-red-500/20" />
                    <span>Alpha</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-md bg-surface-2 border border-border-strong/60" />
                    <span>Belum</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 border border-border-base border-dashed" />
                    <span>Weekend</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-text-muted text-xs py-8 border-t border-border-subtle">Belum ada jadwal PKL aktif atau data presensi belum tersedia.</div>
            )}
          </div>
        </section>
      </div>

      {}
      <section className="bg-surface-1 border border-border-base rounded-3xl p-8">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-2">Berkas Pendukung</p>
        <h2 className="text-lg font-bold text-text-primary mb-6">Dokumen</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <DocTile label="Curriculum Vitae" filename={participant.cv} accentColor="orange" onClick={() => handlePreview(participant.cv, `CV ${participant.nama}`)} />
          <DocTile
            label="Surat Pengantar"
            filename={participant.surat}
            accentColor="blue"
            onClick={() => handlePreview(participant.surat, `Surat Pengantar ${participant.nama}`)}
          />
          <DocTile
            label="Surat Balasan"
            filename={participant.surat_balasan_url}
            accentColor="emerald"
            onClick={() => handlePreview(participant.surat_balasan_url, `Surat Balasan ${participant.nama}`)}
          />
          <DocTile
            label="Sertifikat"
            filename={participant.sertifikat_url}
            accentColor="amber"
            onClick={() => handlePreview(participant.sertifikat_url, `Sertifikat ${participant.nama}`)}
          />
        </div>
      </section>

      {history.length > 0 && (
        <section className="bg-surface-1 border border-border-base rounded-3xl p-8">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-2">Riwayat Historis</p>
          <h2 className="text-lg font-bold text-text-primary mb-6">Riwayat PKL Peserta</h2>

          <div className="overflow-x-auto rounded-2xl border border-border-base">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface-0/40 text-text-secondary">
                <tr>
                  <th className="px-5 py-4 font-semibold uppercase tracking-wider">Periode</th>
                  <th className="px-5 py-4 font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 font-semibold uppercase tracking-wider">Nilai</th>
                  <th className="px-5 py-4 font-semibold uppercase tracking-wider">Surat Balasan</th>
                  <th className="px-5 py-4 font-semibold uppercase tracking-wider">Sertifikat</th>
                  <th className="px-5 py-4 font-semibold uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-text-secondary">
                {history.map((item) => {
                  const isSelesai = item.status === "selesai";
                  const formatDate = (dateStr: string) => {
                    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
                  };
                  return (
                    <tr key={item.pengajuan_id} className="hover:bg-surface-2 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        {item.tanggal_mulai && item.tanggal_selesai ? `${formatDate(item.tanggal_mulai)} - ${formatDate(item.tanggal_selesai)}` : "-"}
                      </td>
                      <td className="px-5 py-4 capitalize">{item.status}</td>
                      <td className="px-5 py-4 font-mono-data font-bold text-emerald-400">{item.nilai_akhir ? Number(item.nilai_akhir).toFixed(2) : "-"}</td>
                      <td className="px-5 py-4">
                        {item.surat_balasan_url ? (
                          <button onClick={() => handlePreview(item.surat_balasan_url!, "Surat Balasan")} className="text-brand hover:text-orange-400 font-medium">
                            Lihat
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {item.sertifikat_url ? (
                          <button onClick={() => handlePreview(item.sertifikat_url!, "Sertifikat")} className="text-amber-500 hover:text-amber-400 font-medium">
                            Lihat
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {isSelesai && (
                          <Link to={`/dashboard/admin/penilaian/${id}?pengajuanId=${item.pengajuan_id}`} className="text-blue-500 hover:text-blue-400 font-medium">
                            Nilai
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {}
      <ModalPratinjauBerkas isOpen={previewFile !== null} onClose={() => setPreviewFile(null)} fileUrl={previewFile?.url || null} title={previewFile?.title} />
    </div>
  );
};

export default DetailPeserta;
