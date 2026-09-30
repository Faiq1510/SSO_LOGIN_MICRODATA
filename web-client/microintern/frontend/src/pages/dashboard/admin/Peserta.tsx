import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getParticipants } from "../../../services/peserta.service";
import { Search, ChevronRight } from "lucide-react";
import HeaderHalaman from "../../../components/HeaderHalaman";
import BadgeStatus from "../../../components/BadgeStatus";
import StatistikPeserta from "../../../components/StatistikPeserta";
import Pagination from "../../../components/Pagination";
import CustomSelect from "../../../components/CustomSelect";

interface PesertaItem {
  id: string;
  nama: string;
  nim: string;
  institusi: string;
  prodi: string;
  status: string;
  email: string;
  tglDaftar: string;
  tanggalMasuk: string | null;
  tanggalKeluar: string | null;
}

interface DBParticipant {
  id: string;
  email: string;
  nama: string | null;
  nim: string | null;
  institusi: string | null;
  prodi: string | null;
  status_pengajuan: string | null;
  created_at: string;
  tanggal_masuk: string | null;
  tanggal_keluar: string | null;
}

type StatusOption = "Semua" | "Aktif" | "Menunggu" | "Onboarding" | "Selesai" | "Ditolak";

const statusStyle: Record<string, { dot: string; pill: string }> = {
  Aktif: {
    dot: "bg-emerald-400 animate-pulse",
    pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]",
  },
  Selesai: {
    dot: "bg-purple-400",
    pill: "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[inset_0_0_10px_rgba(168,85,247,0.1)]",
  },
  Menunggu: {
    dot: "bg-amber-400",
    pill: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[inset_0_0_10px_rgba(251,191,36,0.1)]",
  },
  Ditolak: {
    dot: "bg-red-400",
    pill: "bg-red-500/10 text-red-400 border-red-500/20 shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]",
  },
  Onboarding: {
    dot: "bg-zinc-500",
    pill: "bg-zinc-500/10 text-text-secondary border-border-strong shadow-[inset_0_0_10px_rgba(113,113,122,0.1)]",
  },
};

const getStyle = (status: string) => statusStyle[status] ?? { dot: "bg-zinc-600", pill: "bg-surface-2 text-text-secondary border-border-strong" };

const avatarColors = ["from-orange-500 to-amber-600", "from-sky-500 to-blue-600", "from-violet-500 to-purple-600", "from-emerald-500 to-teal-600", "from-rose-500 to-pink-600"];

const getAvatarColor = (name: string) => {
  const code = name.charCodeAt(0) || 0;
  return avatarColors[code % avatarColors.length];
};

const SearchIcon = () => <Search className="w-4 h-4" />;

const ParticipantRow: React.FC<{ data: PesertaItem }> = ({ data }) => {
  const color = getAvatarColor(data.nama);
  const initial = data.nama.charAt(0).toUpperCase();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-4 hover:bg-surface-2 transition-colors group">
      <div
        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-text-primary font-bold shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-300`}
      >
        {initial}
      </div>

      <div className="flex-1 min-w-0 pr-1 sm:pr-4">
        <p className="text-sm font-semibold text-text-primary group-hover:text-brand transition-colors truncate">{data.nama}</p>
        <p className="text-[11px] text-text-muted truncate">
          {data.institusi} &bull; <span className="uppercase font-semibold">{data.prodi}</span>
        </p>
        <p className="text-[11px] text-text-secondary lg:hidden mt-0.5 truncate">
          {data.tanggalMasuk && data.tanggalKeluar ? `${formatDate(data.tanggalMasuk)} - ${formatDate(data.tanggalKeluar)}` : "Belum ditentukan"}
        </p>
      </div>

      <div className="hidden md:block w-32 shrink-0">
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">NIM / NISN</p>
        <p className="text-[11px] font-mono-data text-text-secondary truncate">{data.nim}</p>
      </div>

      <div className="hidden lg:block w-40 shrink-0">
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">Periode</p>
        <p className="text-[11px] text-text-secondary truncate">
          {data.tanggalMasuk && data.tanggalKeluar ? `${formatDate(data.tanggalMasuk)} - ${formatDate(data.tanggalKeluar)}` : "Belum ditentukan"}
        </p>
      </div>

      <div className="shrink-0 w-auto sm:w-28 flex justify-end sm:justify-center">
        <BadgeStatus status={data.status} size="sm" />
      </div>

      <div className="shrink-0 pl-1 sm:pl-2">
        <Link
          to={`/dashboard/admin/peserta/${data.id}`}
          className="inline-flex text-text-muted hover:text-brand p-1 sm:p-2 rounded-xl hover:bg-surface-3 border border-transparent hover:border-border-base transition-all"
          title="Lihat Detail"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </Link>
      </div>
    </div>
  );
};

const SkeletonRow = () => (
  <div className="flex items-center gap-4 px-5 py-4 bg-surface-1 border-b border-border-subtle animate-pulse">
    <div className="w-10 h-10 rounded-lg bg-surface-2 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-surface-2 rounded-md w-1/3" />
      <div className="h-3 bg-surface-2 rounded w-1/4" />
      <div className="h-3 bg-surface-2 rounded w-1/2 lg:hidden" />
    </div>
    <div className="hidden md:block w-32 space-y-2">
      <div className="h-3 bg-surface-2 rounded w-16" />
      <div className="h-3 bg-surface-2 rounded w-24" />
    </div>
    <div className="hidden lg:block w-40 space-y-2">
      <div className="h-3 bg-surface-2 rounded w-16" />
      <div className="h-3 bg-surface-2 rounded w-28" />
    </div>
    <div className="w-28 flex justify-center">
      <div className="h-6 bg-surface-2 rounded-full w-16" />
    </div>
    <div className="w-9 h-9 bg-surface-2 rounded-xl shrink-0" />
  </div>
);

const Peserta: React.FC = () => {
  const [pesertaData, setPesertaData] = useState<PesertaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [allParticipantsRaw, setAllParticipantsRaw] = useState<DBParticipant[]>([]);
  const [institutions, setInstitutions] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusOption>("Semua");
  const [institutionFilter, setInstitutionFilter] = useState("Semua");
  const [prodiFilter, setProdiFilter] = useState("Semua");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    let ignore = false;

    const fetchFilterOptions = async () => {
      try {
        const res = await getParticipants({ limit: 100000 });
        if (ignore) return;

        if (res.status === "success" && Array.isArray(res.data)) {
          const uniqueInsts: string[] = Array.from(new Set(res.data.map((d: DBParticipant) => d.institusi || "-").filter((i: string) => i && i !== "-")));
          setInstitutions(uniqueInsts);
          setAllParticipantsRaw(res.data as DBParticipant[]);

          const counts: Record<string, number> = {};
          res.data.forEach((item: DBParticipant) => {
            let displayStatus = "Onboarding";
            if (item.status_pengajuan === "aktif") displayStatus = "Aktif";
            else if (item.status_pengajuan === "selesai") displayStatus = "Selesai";
            else if (item.status_pengajuan === "menunggu") displayStatus = "Menunggu";
            else if (item.status_pengajuan === "ditolak") displayStatus = "Ditolak";
            counts[displayStatus] = (counts[displayStatus] || 0) + 1;
          });
          setStatusCounts(counts);
        }
      } catch (err) {
        if (!ignore) console.error("Gagal memuat opsi filter:", err);
      }
    };

    fetchFilterOptions();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const fetchPeserta = async () => {
      setIsLoading(true);
      try {
        const res = await getParticipants({
          page,
          limit,
          search: debouncedSearchQuery,
          status: statusFilter,
          institusi: institutionFilter,
          prodi: prodiFilter,
        });

        if (ignore) return;

        if (res.status === "success" && Array.isArray(res.data)) {
          const mappedData: PesertaItem[] = (res.data as DBParticipant[]).map((item) => {
            let displayStatus = "Onboarding";
            if (item.status_pengajuan === "aktif") displayStatus = "Aktif";
            else if (item.status_pengajuan === "selesai") displayStatus = "Selesai";
            else if (item.status_pengajuan === "menunggu") displayStatus = "Menunggu";
            else if (item.status_pengajuan === "ditolak") displayStatus = "Ditolak";

            return {
              id: item.id,
              nama: item.nama || "Tanpa Nama",
              nim: item.nim || "-",
              institusi: item.institusi || "-",
              prodi: item.prodi || "-",
              status: displayStatus,
              email: item.email,
              tglDaftar: item.created_at
                ? new Date(item.created_at).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "-",
              tanggalMasuk: item.tanggal_masuk,
              tanggalKeluar: item.tanggal_keluar,
            };
          });

          setPesertaData(mappedData);
          if (res.pagination) {
            setTotal(res.pagination.total);
            setTotalPages(res.pagination.totalPages);
          }
        }
      } catch (err) {
        if (!ignore) console.error("Gagal memuat data peserta:", err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchPeserta();

    return () => {
      ignore = true;
    };
  }, [page, limit, debouncedSearchQuery, statusFilter, institutionFilter, prodiFilter]);

  const countByStatus = (status: string) => statusCounts[status] || 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-brand/10 rounded-full -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-blue-600/10 rounded-full pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
        <HeaderHalaman title="Manajemen Peserta" subtitle="Lihat dan kelola direktori peserta PKL." />
      </div>

      <StatistikPeserta />

      <div className="relative z-20 bg-surface-1 border border-border-subtle rounded-3xl p-3 sm:p-4 flex flex-col lg:flex-row gap-3 shadow-sm">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
            <SearchIcon />
          </span>
          <input
            id="participant-search"
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            placeholder="Cari nama, NIM, institusi, atau email…"
            className="w-full bg-surface-0/50 border border-border-subtle text-text-primary pl-11 pr-4 py-3.5 rounded-2xl text-sm focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-text-secondary transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <CustomSelect
            value={institutionFilter}
            onChange={(val) => {
              setInstitutionFilter(val);
              setProdiFilter("Semua");
              setPage(1);
            }}
            options={[{ value: "Semua", label: "Semua Institusi" }, ...institutions.map((inst) => ({ value: inst, label: inst }))]}
            className="min-w-[200px]"
          />

          <CustomSelect
            value={prodiFilter}
            onChange={(val) => {
              setProdiFilter(val);
              setPage(1);
            }}
            options={[
              { value: "Semua", label: "Semua Program Studi" },
              ...Array.from(
                new Set(
                  allParticipantsRaw
                    .filter((d) => institutionFilter === "Semua" || d.institusi === institutionFilter)
                    .map((d) => d.prodi || "-")
                    .filter((p) => p && p !== "-")
                )
              ).map((prodi) => ({ value: prodi, label: prodi })),
            ]}
            className="min-w-[200px]"
          />
        </div>
      </div>

      {!isLoading && (
        <div className="flex flex-wrap gap-2 shrink-0 relative z-10">
          {(["Aktif", "Menunggu", "Onboarding", "Selesai", "Ditolak"] as const).map((s) => {
            const count = countByStatus(s);
            if (count === 0 && statusFilter !== s) return null;
            const st = getStyle(s);
            return (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(statusFilter === s ? "Semua" : s);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                  statusFilter === s ? st.pill : "bg-surface-1 text-text-muted border-border-subtle hover:border-border-strong/80 hover:bg-surface-2"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {s}
                <span className="opacity-60 font-mono-data">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {!isLoading && (
        <div className="flex items-center justify-between relative z-10 px-2">
          <p className="text-xs text-text-muted font-medium">
            Menampilkan{" "}
            <span className="text-text-primary font-black">
              {pesertaData.length > 0 ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, total)}
            </span>{" "}
            dari {total} peserta
          </p>
          {(searchQuery || statusFilter !== "Semua" || institutionFilter !== "Semua" || prodiFilter !== "Semua") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("Semua");
                setInstitutionFilter("Semua");
                setProdiFilter("Semua");
                setPage(1);
              }}
              className="text-[10px] font-black text-text-muted hover:text-orange-400 uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-1.5"
            >
              ✕ Reset Filter
            </button>
          )}
        </div>
      )}

      <div className="relative z-10">
        {isLoading ? (
          <div className="flex flex-col bg-surface-1 border border-border-base rounded-xl overflow-hidden shadow-sm">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : pesertaData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-1 border border-border-subtle rounded-xl">
            <div className="w-16 h-16 rounded-2xl bg-surface-0 border border-border-base flex items-center justify-center text-zinc-600 shadow-inner mb-4">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-text-primary font-bold text-lg mb-1 tracking-tight">Tidak ada peserta ditemukan</p>
            <p className="text-text-muted text-sm max-w-sm leading-relaxed mb-6">Kami tidak dapat menemukan peserta yang sesuai dengan filter atau kata kunci pencarian Anda.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("Semua");
                setInstitutionFilter("Semua");
                setProdiFilter("Semua");
                setPage(1);
              }}
              className="inline-flex items-center gap-2 text-xs font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 px-5 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border-subtle bg-surface-1 border border-border-base rounded-xl overflow-hidden shadow-sm">
            {pesertaData.map((data, index) => (
              <ParticipantRow key={`${data.id}-${data.tanggalMasuk ?? "none"}-${data.tanggalKeluar ?? "none"}-${index}`} data={data} />
            ))}
          </div>
        )}
      </div>

      {!isLoading && total > 0 && (
        <div className="relative z-10">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Peserta;
