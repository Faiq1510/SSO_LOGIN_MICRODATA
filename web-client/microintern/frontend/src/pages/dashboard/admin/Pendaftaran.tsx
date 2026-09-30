import React, { useEffect, useState, useMemo, useCallback } from "react";
import { adminGetAllPendaftaran, adminTerimaPendaftaran, adminTolakPendaftaran } from "../../../services/pendaftaran.service";
import { apiRequest } from "../../../utils/api";
import { useNotification } from "../../../components/ProviderNotifikasi";
import ModalPratinjauBerkas from "../../../components/ModalPratinjauBerkas";
import { Eye, Loader2, X, FileText, Calendar, RotateCcw } from "lucide-react";
import HeaderHalaman from "../../../components/HeaderHalaman";
import BadgeStatus from "../../../components/BadgeStatus";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import Pagination from "../../../components/Pagination";
import CustomSelect from "../../../components/CustomSelect";

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

const Pendaftaran: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filterStatus, setFilterStatus] = useState<"semua" | "menunggu" | "aktif" | "selesai" | "ditolak">("semua");
  const [isLoading, setIsLoading] = useState(true);

  const [reviewModalData, setReviewModalData] = useState<Registration | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string } | null>(null);

  const [reviewNote, setReviewNote] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const { showSuccess, showError } = useNotification();

  const fetchRegistrations = useCallback(async () => {
    try {
      const res = await adminGetAllPendaftaran({
        page,
        limit,
        status: filterStatus,
      });
      if (res.status === "success" && res.data) {
        setRegistrations(res.data as Registration[]);
        if (res.pagination) {
          setTotal(res.pagination.total);
          setTotalPages(res.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil data pendaftaran admin:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, filterStatus]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleReviewAction = async (action: "terima" | "tolak") => {
    if (!reviewModalData) return;

    if (action === "tolak" && !reviewNote.trim()) {
      return showError("Alasan penolakan wajib diisi.");
    }

    setIsSubmittingReview(true);
    try {
      const payload = action === "terima" ? { catatan: reviewNote } : { alasan_tolak: reviewNote };

      if (action === "terima") {
        await adminTerimaPendaftaran(reviewModalData.id, payload);
      } else {
        await adminTolakPendaftaran(reviewModalData.id, payload);
      }

      showSuccess(action === "terima" ? "Pendaftaran berhasil diterima. Surat balasan telah otomatis digenerate." : "Penolakan berhasil dikirim.");

      setReviewModalData(null);
      setReviewNote("");
      await fetchRegistrations();
    } catch (err) {
      const error = err as Error;
      showError(error.message || `Gagal memproses ${action === "terima" ? "penerimaan" : "penolakan"} pendaftaran.`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const columns = useMemo<ColumnDef<Registration>[]>(
    () => [
      {
        accessorKey: "nama_pendaftar",
        header: "Nama Pendaftar",
        cell: (info) => {
          const reg = info.row.original;
          const ketua = reg.anggota.find((m) => m.user_id === reg.ketua_id) || reg.anggota[0];
          if (!ketua) return "-";
          return (
            <div className="flex flex-col gap-1 py-1">
              <span className="text-text-primary font-bold tracking-tight text-base group-hover:text-orange-400 transition-colors">{ketua.nama_lengkap}</span>
              <span className="text-[11px] text-text-muted font-medium">{ketua.program_studi}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "institusi",
        header: "Institusi",
        cell: (info) => {
          const reg = info.row.original;
          const ketua = reg.anggota.find((m) => m.user_id === reg.ketua_id) || reg.anggota[0];
          return <span className="text-text-secondary font-semibold text-sm">{ketua?.institusi || "-"}</span>;
        },
      },
      {
        accessorKey: "periode",
        header: "Periode",
        cell: (info) => {
          const reg = info.row.original;
          const masuk = new Date(reg.tanggal_masuk).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
          const keluar = new Date(reg.tanggal_keluar).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary font-mono-data text-[13px]">{masuk}</span>
              <span className="text-text-muted text-[11px] font-medium">s/d {keluar}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "tipe",
        header: "Tipe",
        cell: (info) => {
          const reg = info.row.original;
          return reg.jenis_kelompok === "kelompok" ? (
            <span className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-widest font-black text-[10px] whitespace-nowrap shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Kelompok ({reg.anggota.length})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full border border-orange-500/20 uppercase tracking-widest font-black text-[10px] shadow-[inset_0_0_10px_rgba(249,115,22,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              Individu
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => {
          const status = info.row.original.status;
          if (status === "ditolak") {
            return (
              <button
                onClick={() => showError(info.row.original.alasan_tolak || "Tidak ada alasan penolakan.")}
                className="transition-all cursor-pointer hover:scale-105 active:scale-95 block"
                title="Klik untuk melihat alasan penolakan"
              >
                <BadgeStatus status={status} />
              </button>
            );
          }
          return <BadgeStatus status={status} />;
        },
      },
      {
        id: "action",
        header: "Aksi",
        cell: (info) => {
          const reg = info.row.original;
          return (
            <div className="flex gap-3 items-center">
              <button
                onClick={() => {
                  setReviewModalData(reg);
                  setReviewNote("");
                }}
                className="bg-surface-2 hover:bg-zinc-700 hover:text-text-primary text-text-secondary px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer hover:shadow-sm active:scale-95 border border-border-strong/50"
              >
                Review
              </button>
              {(reg.status === "aktif" || reg.status === "ditolak") && (
                <button
                  onClick={() => setCancelTargetId(reg.id)}
                  className="group relative px-2 py-2 rounded-xl transition-all active:scale-95 cursor-pointer text-text-muted hover:text-brand hover:bg-orange-500/10"
                  title="Batal Keputusan"
                >
                  <RotateCcw className="w-4 h-4 transition-transform group-hover:scale-110" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [showError]
  );

  const table = useReactTable({
    data: registrations,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-border-base rounded-full"></div>
          <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative">
      <HeaderHalaman title="Manajemen Pendaftaran" subtitle="Verifikasi dan proses pengajuan PKL baru secara terpusat." />

      <div className="relative group z-10">
        <div className="absolute -inset-0.5 rounded-2xl blur opacity-20"></div>
        <div className="relative bg-surface-1 border border-border-base rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-text-primary tracking-tight">Daftar Pendaftaran Masuk</h3>
              <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1 italic">Semua pengajuan pendaftaran baru</p>
            </div>

            <div className="hidden sm:flex bg-surface-2 p-1 rounded-xl border border-border-subtle overflow-x-auto w-full sm:w-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {(["semua", "menunggu", "aktif", "selesai", "ditolak"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status);
                    setPage(1);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all capitalize whitespace-nowrap ${
                    filterStatus === status ? "bg-surface-0 text-brand shadow-sm" : "text-text-muted hover:text-text-secondary hover:bg-surface-3"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="block sm:hidden w-full">
              <CustomSelect
                value={filterStatus}
                onChange={(val) => {
                  setFilterStatus(val);
                  setPage(1);
                }}
                options={[
                  { value: "semua", label: "Semua" },
                  { value: "menunggu", label: "Menunggu" },
                  { value: "aktif", label: "Aktif" },
                  { value: "selesai", label: "Selesai" },
                  { value: "ditolak", label: "Ditolak" },
                ]}
                className="w-full"
              />
            </div>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[650px] scrollbar-hide rounded-b-[2.5rem] relative">
            <table className="w-full text-left text-sm text-text-secondary min-w-[1000px] border-collapse">
              <thead className="text-[10px] text-text-muted uppercase tracking-[0.2em] bg-surface-0/30">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-5 py-3 font-semibold text-left">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="h-[400px]">
                      <div className="flex flex-col items-center justify-center h-full text-text-muted">
                        <FileText className="w-16 h-16 mb-6 opacity-20" />
                        <p className="font-medium text-lg">Belum ada pengajuan pendaftaran saat ini.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="group hover:bg-surface-2 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-5 py-3.5 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && total > 0 && (
            <div className="p-4 border-t border-border-subtle bg-surface-1">
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
      </div>

      {reviewModalData &&
        (() => {
          const ketua = reviewModalData.anggota.find((m) => m.user_id === reviewModalData.ketua_id) || reviewModalData.anggota[0];
          const ketuaNama = ketua?.nama_lengkap || "";
          const titleLabel = reviewModalData.jenis_kelompok === "kelompok" ? `Kelompok ${ketuaNama}` : `Individu ${ketuaNama}`;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 lg:p-10">
              <div className="absolute inset-0 bg-surface-0/70 transition-opacity" onClick={() => setReviewModalData(null)}></div>
              <div className="relative bg-surface-1 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 ease-out flex flex-col border border-border-base">
                <div className="p-6 border-b border-border-subtle flex justify-between items-center shrink-0">
                  <h3 className="text-xl font-bold text-text-primary capitalize tracking-tight">Review: {titleLabel}</h3>
                  <button
                    onClick={() => setReviewModalData(null)}
                    className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all rounded-full cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                  {/* Detail & Dokumen */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-surface-0 border border-border-subtle rounded-xl p-5 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-text-secondary" />
                        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Detail PKL</h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-text-muted uppercase tracking-widest">Durasi</p>
                        <p className="text-sm font-bold text-text-primary">
                          {new Date(reviewModalData.tanggal_masuk).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} -{" "}
                          {new Date(reviewModalData.tanggal_keluar).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-text-muted uppercase tracking-widest">Institusi</p>
                        <p className="text-sm font-bold text-text-primary">{ketua?.institusi || "-"}</p>
                      </div>
                    </div>

                    <div className="bg-surface-0 border border-border-subtle rounded-xl p-5 flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-4 h-4 text-text-secondary" />
                        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Dokumen</h4>
                      </div>
                      <p className="text-sm text-text-secondary mb-4 flex-1">Surat Pengantar dari instansi pendidikan peserta.</p>
                      <button
                        onClick={() => setPreviewFile({ url: reviewModalData.surat_pengantar_url, title: "Surat Pengantar" })}
                        className="w-full bg-surface-2 hover:bg-surface-3 text-text-primary py-2.5 rounded-lg text-xs font-bold transition-all border border-border-base cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Lihat Dokumen
                      </button>
                    </div>
                  </div>

                  {/* Anggota */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                      Anggota Tim
                      <span className="bg-surface-2 text-text-muted px-2 py-0.5 rounded-full text-[10px] font-bold">{reviewModalData.anggota.length}</span>
                    </h4>
                    <div className="border border-border-subtle rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm border-collapse">
                        <tbody className="divide-y divide-zinc-800/50">
                          {reviewModalData.anggota.map((member) => (
                            <tr key={member.user_id} className="bg-surface-0 hover:bg-surface-1 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-text-primary">{member.nama_lengkap}</p>
                                  {member.user_id === reviewModalData.ketua_id && (
                                    <span className="text-[9px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Ketua</span>
                                  )}
                                </div>
                                <p className="text-xs text-text-muted">{member.program_studi}</p>
                              </td>
                              <td className="p-3 text-right">
                                {member.cv_url ? (
                                  <button
                                    onClick={() => setPreviewFile({ url: member.cv_url!, title: `CV ${member.nama_lengkap}` })}
                                    className="text-xs font-bold text-brand hover:text-brand/80 underline-offset-2 hover:underline transition-all cursor-pointer"
                                  >
                                    Lihat CV
                                  </button>
                                ) : (
                                  <span className="text-xs text-text-muted">Tidak ada CV</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {reviewModalData.status === "menunggu" && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Catatan Evaluasi / Alasan Penolakan</label>
                      <textarea
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        className="w-full bg-surface-0 border border-border-base focus:border-brand text-text-primary px-4 py-3 rounded-xl focus:ring-1 focus:ring-brand outline-none transition-all h-24 text-sm resize-none"
                        placeholder="Opsional. Catatan ini akan dikirim via email ke peserta..."
                      />
                    </div>
                  )}
                </div>

                {reviewModalData.status === "menunggu" && (
                  <div className="p-6 border-t border-border-subtle bg-surface-1 flex gap-3 shrink-0">
                    <button
                      onClick={() => handleReviewAction("tolak")}
                      disabled={isSubmittingReview}
                      className="flex-1 bg-surface-2 hover:bg-red-950/30 border border-border-base hover:border-red-900/50 text-text-secondary hover:text-red-400 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
                    >
                      {isSubmittingReview ? <Loader2 className="animate-spin h-4 w-4" /> : "Tolak"}
                    </button>
                    <button
                      onClick={() => handleReviewAction("terima")}
                      disabled={isSubmittingReview}
                      className="flex-[2] bg-brand hover:bg-brand/90 text-text-primary font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm shadow-sm"
                    >
                      {isSubmittingReview ? <Loader2 className="animate-spin h-4 w-4" /> : "Terima Pendaftaran"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      {cancelTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-0/80 animate-in fade-in duration-300">
          <div className="relative bg-surface-1 border border-border-base w-full max-w-md rounded-2xl p-8 shadow-[0_0_80px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20 pointer-events-none bg-orange-500"></div>

            <div className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-orange-500/20 to-orange-600/5 text-brand border border-orange-500/20 shadow-[0_0_40px_rgba(249,115,22,0.15)]">
              <RotateCcw className="w-10 h-10 animate-pulse" />
            </div>

            <h3 className="relative z-10 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 text-center tracking-tight mb-3">
              Batalkan Keputusan?
            </h3>
            <p className="relative z-10 text-sm text-text-secondary text-center leading-relaxed mb-8">
              Apakah Anda yakin ingin membatalkan keputusan ini dan mengembalikan status pengajuan menjadi <strong className="text-zinc-200">Menunggu</strong>?
            </p>
            <div className="relative z-10 flex gap-4">
              <button
                onClick={() => setCancelTargetId(null)}
                className="flex-1 bg-surface-2 hover:bg-zinc-700 text-text-primary font-bold py-4 rounded-2xl transition-all border border-border-strong text-sm tracking-wide uppercase cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  const id = cancelTargetId;
                  setCancelTargetId(null);
                  try {
                    await apiRequest(`/pendaftaran/admin/${id}/batal`, {
                      method: "PUT",
                    });
                    showSuccess("Keputusan berhasil dibatalkan.");
                    await fetchRegistrations();
                  } catch (err) {
                    const error = err as Error;
                    showError(error.message || "Gagal membatalkan keputusan.");
                  }
                }}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-text-primary font-bold py-4 rounded-2xl transition-all shadow-sm hover:shadow-orange-500/25 text-sm tracking-wide uppercase cursor-pointer"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalPratinjauBerkas isOpen={previewFile !== null} onClose={() => setPreviewFile(null)} fileUrl={previewFile?.url || null} title={previewFile?.title} />
    </div>
  );
};

export default Pendaftaran;
