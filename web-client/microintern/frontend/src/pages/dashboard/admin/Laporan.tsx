import React, { useState, useRef, useEffect } from "react";
import { getAuthToken } from "../../../utils/api";
import { useNotification } from "../../../components/ProviderNotifikasi";
import { Users, Calendar, Star, Download, Loader2, ChevronDown, Filter, CalendarDays } from "lucide-react";

type ExportType = "peserta" | "presensi" | "nilai";
type ExportFormat = "csv" | "xlsx" | "pdf";
type DateRangeMode = "semua" | "bulan_ini" | "tahun_ini" | "custom";

interface ReportConfig {
  type: ExportType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const UsersIcon = () => <Users className="w-5 h-5" />;
const CalendarIcon = () => <Calendar className="w-5 h-5" />;
const StarIcon = () => <Star className="w-5 h-5" />;
const DownloadIcon = () => <Download className="w-4 h-4" />;
const SpinnerIcon = () => <Loader2 className="w-4 h-4 animate-spin" />;

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const REPORTS: ReportConfig[] = [
  {
    type: "peserta",
    title: "Rekap Peserta",
    description: "Daftar lengkap peserta PKL beserta NIM, institusi, program studi, dan status pengajuan.",
    icon: <UsersIcon />,
  },
  {
    type: "presensi",
    title: "Rekap Kehadiran",
    description: "Log presensi harian peserta: jam masuk, jam keluar, dan status kehadiran.",
    icon: <CalendarIcon />,
  },
  {
    type: "nilai",
    title: "Rekap Nilai",
    description: "Daftar peserta beserta instansi, program studi, tanggal selesai PKL, nilai akhir, dan catatan pembimbing.",
    icon: <StarIcon />,
  },
];

const CustomSelect: React.FC<{
  value: ExportFormat;
  onChange: (value: ExportFormat) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options: { id: ExportFormat; label: string }[] = [
    { id: "xlsx", label: "Excel File" },
    { id: "csv", label: "CSV File" },
    { id: "pdf", label: "PDF File" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full sm:w-[130px] bg-surface-0 border rounded-lg pl-4 pr-3 py-2 text-sm text-text-secondary focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? "border-brand ring-2 ring-brand/20" : "border-border-base hover:border-border-strong"
        }`}
      >
        <span>{options.find((o) => o.id === value)?.label}</span>
        <ChevronDown className={`h-4 w-4 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full sm:w-[140px] top-full right-0 mt-1.5 bg-surface-0 border border-border-base rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.1)] py-1.5 animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onChange(opt.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                value === opt.id ? "bg-brand/10 text-brand font-semibold" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Laporan: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState<Record<ExportType, boolean>>({
    peserta: false,
    presensi: false,
    nilai: false,
  });

  const [formats, setFormats] = useState<Record<ExportType, ExportFormat>>({
    peserta: "xlsx",
    presensi: "xlsx",
    nilai: "xlsx",
  });

  const [dateMode, setDateMode] = useState<DateRangeMode>("semua");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const getEffectiveDates = (): { startDate: string; endDate: string; label: string } => {
    const now = new Date();
    const year = now.getFullYear();

    if (dateMode === "bulan_ini") {
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      const monthName = now.toLocaleString("id-ID", { month: "long" });
      return {
        startDate: `${year}-${month}-01`,
        endDate: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
        label: `Bulan Ini (${monthName} ${year})`,
      };
    }

    if (dateMode === "tahun_ini") {
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
        label: `Tahun Ini (${year})`,
      };
    }

    if (dateMode === "custom") {
      if (customStartDate && customEndDate) {
        return {
          startDate: customStartDate,
          endDate: customEndDate,
          label: `${customStartDate} s/d ${customEndDate}`,
        };
      }
      if (customStartDate) {
        return {
          startDate: customStartDate,
          endDate: "",
          label: `Mulai ${customStartDate}`,
        };
      }
      if (customEndDate) {
        return {
          startDate: "",
          endDate: customEndDate,
          label: `Sampai ${customEndDate}`,
        };
      }
      return {
        startDate: "",
        endDate: "",
        label: "Custom Range",
      };
    }

    return {
      startDate: "",
      endDate: "",
      label: "Semua Data",
    };
  };

  const effective = getEffectiveDates();

  const handleFormatChange = (type: ExportType, format: ExportFormat) => {
    setFormats((prev) => ({ ...prev, [type]: format }));
  };

  const handleExport = async (type: ExportType) => {
    const format = formats[type];
    setLoading((prev) => ({ ...prev, [type]: true }));

    const token = getAuthToken();
    let url = `${BASE_URL}/admin/laporan/export?type=${type}&format=${format}`;
    if (effective.startDate) url += `&startDate=${encodeURIComponent(effective.startDate)}`;
    if (effective.endDate) url += `&endDate=${encodeURIComponent(effective.endDate)}`;

    const extMap: Record<ExportFormat, string> = { csv: ".csv", xlsx: ".xlsx", pdf: ".pdf" };
    const filename = `rekap-${type}-${new Date().toISOString().slice(0, 10)}${extMap[format]}`;

    try {
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);

      showSuccess(`Laporan berhasil diunduh.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengunduh laporan.";
      showError(msg);
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="max-w-5xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Laporan &amp; Export</h1>
        <p className="text-text-secondary mt-1 text-sm">Unduh data rekapitulasi sistem untuk analisis lanjutan, arsip, atau pelaporan.</p>
      </div>

      <div className="bg-surface-1 border border-border-subtle rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <Filter className="w-4 h-4 text-brand" />
            <span>Filter Rentang Tanggal</span>
          </div>
          <span className="text-xs text-brand font-medium bg-brand/10 px-3 py-1 rounded-full border border-brand/20 self-start sm:self-auto">{effective.label}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDateMode("semua")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              dateMode === "semua" ? "bg-brand text-white" : "bg-surface-2 text-text-secondary hover:text-text-primary border border-border-subtle"
            }`}
          >
            Semua Data
          </button>
          <button
            type="button"
            onClick={() => setDateMode("bulan_ini")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              dateMode === "bulan_ini" ? "bg-brand text-white" : "bg-surface-2 text-text-secondary hover:text-text-primary border border-border-subtle"
            }`}
          >
            Bulan Ini
          </button>
          <button
            type="button"
            onClick={() => setDateMode("tahun_ini")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              dateMode === "tahun_ini" ? "bg-brand text-white" : "bg-surface-2 text-text-secondary hover:text-text-primary border border-border-subtle"
            }`}
          >
            Tahun Ini
          </button>
          <button
            type="button"
            onClick={() => setDateMode("custom")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              dateMode === "custom" ? "bg-brand text-white" : "bg-surface-2 text-text-secondary hover:text-text-primary border border-border-subtle"
            }`}
          >
            Custom Range
          </button>
        </div>

        {dateMode === "custom" && (
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-surface-0 border border-border-base rounded-lg px-3 py-2 text-xs">
              <CalendarDays className="w-4 h-4 text-text-muted shrink-0" />
              <span className="text-text-secondary shrink-0">Dari:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-transparent text-text-primary focus:outline-none w-full"
              />
            </div>
            <div className="flex-1 flex items-center gap-2 bg-surface-0 border border-border-base rounded-lg px-3 py-2 text-xs">
              <CalendarDays className="w-4 h-4 text-text-muted shrink-0" />
              <span className="text-text-secondary shrink-0">Sampai:</span>
              <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="bg-transparent text-text-primary focus:outline-none w-full" />
            </div>
          </div>
        )}
      </div>

      <div className="bg-surface-1 border border-border-subtle rounded-2xl shadow-sm">
        {REPORTS.map((report, idx) => (
          <div
            key={report.type}
            className={`p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors hover:bg-surface-2 first:rounded-t-2xl last:rounded-b-2xl ${
              idx !== 0 ? "border-t border-border-subtle" : ""
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0 shadow-[0_0_10px_var(--brand-dim)]">
                {report.icon}
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-primary">{report.title}</h3>
                <p className="text-sm text-text-secondary mt-1 max-w-md leading-relaxed">{report.description}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
              <CustomSelect value={formats[report.type]} onChange={(val) => handleFormatChange(report.type, val)} disabled={loading[report.type]} />

              <button
                onClick={() => handleExport(report.type)}
                disabled={loading[report.type]}
                className="bg-brand hover:brightness-110 text-white shadow-[0_0_15px_var(--brand-glow)] disabled:bg-surface-2 disabled:text-text-muted disabled:shadow-none disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 min-w-[100px] w-full sm:w-auto"
              >
                {loading[report.type] ? (
                  <>
                    <SpinnerIcon />
                    <span>Proses...</span>
                  </>
                ) : (
                  <>
                    <DownloadIcon />
                    <span>Unduh</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Laporan;
