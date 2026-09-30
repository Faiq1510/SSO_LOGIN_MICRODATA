import React, { useState, useEffect } from "react";
import { getIzinSaya, deleteIzin } from "../../../services/izin.service";
import { getPendaftaranSaya } from "../../../services/pendaftaran.service";
import { getLocalDateString } from "../../../utils/date";
import { FileText, X, Plus, Trash, Loader2, Eye, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useNotification } from "../../../components/ProviderNotifikasi";
import ModalPratinjauBerkas from "../../../components/ModalPratinjauBerkas";

interface IzinLog {
  id: string;
  tanggal: string;
  kategori: string;
  alasan: string;
  bukti_url: string | null;
  created_at: string;
}

const IzinPeserta: React.FC = () => {
  const [leaves, setLeaves] = useState<IzinLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pklAktif, setPklAktif] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<IzinLog | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showSuccess, showError } = useNotification();

  const fetchLeaves = async () => {
    try {
      setIsLoading(true);
      const res = await getIzinSaya();
      if (res.status === "success" && Array.isArray(res.data)) {
        setLeaves(res.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data izin:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
    const checkPkl = async () => {
      try {
        const res = await getPendaftaranSaya();
        if (res.status === "success" && res.data) {
          const today = getLocalDateString();
          const tMasuk = res.data.tanggal_masuk.split("T")[0];
          const tKeluar = res.data.tanggal_keluar.split("T")[0];
          setPklAktif(res.data.status === "aktif" && today >= tMasuk && today <= tKeluar);
        } else {
          setPklAktif(false);
        }
      } catch (_err) {
        setPklAktif(false);
      }
    };
    checkPkl();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin membatalkan izin ini?")) return;
    setIsDeleting(true);
    try {
      await deleteIzin(id);
      showSuccess("Izin berhasil dibatalkan");
      setSelectedLeave(null);
      await fetchLeaves();
    } catch (err) {
      const error = err as Error;
      showError(error.message || "Gagal membatalkan izin");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadgeClass = (kategori: string) => {
    switch (kategori) {
      case "Izin Sakit":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "Izin Kegiatan":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Izin WFH":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default:
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full -mr-48 -mt-48 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Pengajuan Izin</h1>
          <p className="text-text-muted mt-2">Daftar riwayat pengajuan izin yang telah Anda buat.</p>
        </div>

        {pklAktif ? (
          <Link
            to="/dashboard/peserta/izin/baru"
            className="flex items-center justify-center gap-2 bg-brand hover:bg-brand/90 text-text-primary font-bold py-3 px-6 rounded-xl transition-all shadow-sm shadow-orange-900/20"
          >
            <Plus className="w-5 h-5" />
            Buat Pengajuan Izin
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => showError("Fitur izin hanya dapat diakses saat PKL Anda sedang aktif berjalan.")}
            className="flex items-center justify-center gap-2 bg-surface-2 text-text-muted font-bold py-3 px-6 rounded-xl border border-border-base cursor-not-allowed"
          >
            <Lock className="w-4 h-4" />
            Buat Pengajuan Izin
          </button>
        )}
      </div>

      <div className="bg-surface-1 border border-border-base rounded-[2.5rem] p-2 relative z-10 shadow-2xl shadow-black/20 overflow-hidden">
        <div className="md:hidden divide-y divide-border-base/50">
          {isLoading ? (
            <div className="px-5 py-12 text-center text-text-muted">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                <p>Memuat data...</p>
              </div>
            </div>
          ) : leaves.length > 0 ? (
            leaves.map((leave) => {
              const lDate = new Date(leave.tanggal);
              return (
                <div key={leave.id} className="p-5 hover:bg-surface-2 transition-colors cursor-pointer space-y-3" onClick={() => setSelectedLeave(leave)}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-text-primary">{lDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                      <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">{lDate.toLocaleDateString("id-ID", { weekday: "long" })}</span>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all shrink-0 ${getStatusBadgeClass(leave.kategori)}`}
                    >
                      {leave.kategori}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border-base/50 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLeave(leave);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-surface-2 hover:bg-surface-3 text-text-primary text-[10px] font-semibold rounded-lg transition-colors border border-border-base group-hover:border-zinc-700"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Detail
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-5 py-12 text-center text-text-muted">Belum ada data pengajuan izin.</div>
          )}
        </div>

        <div className="hidden md:block overflow-x-auto rounded-[2rem]">
          <table className="w-full text-left text-sm text-text-secondary">
            <thead className="text-[10px] text-text-muted uppercase tracking-[0.2em] bg-surface-0/30">
              <tr>
                <th scope="col" className="px-5 py-4 font-semibold w-16 text-center">
                  No
                </th>
                <th scope="col" className="px-5 py-4 font-semibold">
                  Tanggal Izin
                </th>
                <th scope="col" className="px-5 py-4 font-semibold">
                  Kategori
                </th>
                <th scope="col" className="px-5 py-4 font-semibold w-48 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base/50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                      <p>Memuat data...</p>
                    </div>
                  </td>
                </tr>
              ) : leaves.length > 0 ? (
                leaves.map((leave, index) => {
                  const lDate = new Date(leave.tanggal);
                  return (
                    <tr key={leave.id} className="group hover:bg-surface-2 transition-colors cursor-pointer" onClick={() => setSelectedLeave(leave)}>
                      <td className="px-5 py-4 text-center text-zinc-600 font-mono-data text-xs italic">{index + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-text-primary">{lDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                          <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">{lDate.toLocaleDateString("id-ID", { weekday: "long" })}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${getStatusBadgeClass(leave.kategori)}`}
                        >
                          {leave.kategori}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLeave(leave);
                          }}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-surface-2 hover:bg-surface-3 text-text-primary text-xs font-semibold rounded-lg transition-colors border border-border-base group-hover:border-zinc-700"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-text-muted">
                    Belum ada data pengajuan izin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLeave && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedLeave(null)}></div>
          <div className="relative w-full max-w-lg bg-surface-1 border border-border-base rounded-[2.5rem] shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-border-base flex items-center justify-between bg-surface-0/50">
              <h2 className="text-xl font-bold text-text-primary">Detail Izin</h2>
              <button onClick={() => setSelectedLeave(null)} className="p-2 text-text-muted hover:text-text-primary bg-surface-2 hover:bg-surface-3 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-8 py-8 space-y-6">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-1">Tanggal</p>
                <p className="text-text-primary font-medium">
                  {new Date(selectedLeave.tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-1">Kategori</p>
                <span
                  className={`inline-flex items-center px-3 py-1 mt-1 rounded-full text-xs font-bold uppercase tracking-widest border ${getStatusBadgeClass(selectedLeave.kategori)}`}
                >
                  {selectedLeave.kategori}
                </span>
              </div>

              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2">Alasan</p>
                <div className="bg-surface-0/50 p-4 rounded-2xl border border-border-base">
                  <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{selectedLeave.alasan}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2">Bukti Pendukung</p>
                {selectedLeave.bukti_url ? (
                  <button
                    type="button"
                    onClick={() => setPreviewFile({ url: selectedLeave.bukti_url!, title: "Bukti Izin" })}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-surface-2 hover:bg-surface-3 text-brand text-sm font-semibold rounded-xl border border-border-base transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Lihat Dokumen
                  </button>
                ) : (
                  <p className="text-sm text-text-muted italic bg-surface-0/50 p-4 rounded-2xl border border-border-base">Tidak ada lampiran dokumen.</p>
                )}
              </div>
            </div>
            <div className="px-8 py-6 border-t border-border-base bg-surface-0/50 flex gap-3">
              {new Date(selectedLeave.tanggal).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0) && (
                <button
                  onClick={() => handleDelete(selectedLeave.id)}
                  disabled={isDeleting}
                  className="flex-1 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-colors border border-red-500/20 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />}
                  Batalkan Izin
                </button>
              )}
              <button
                onClick={() => setSelectedLeave(null)}
                className="flex-1 py-3.5 bg-surface-2 hover:bg-surface-3 text-text-primary font-bold rounded-xl transition-colors border border-border-base"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      <ModalPratinjauBerkas isOpen={previewFile !== null} onClose={() => setPreviewFile(null)} fileUrl={previewFile?.url || null} title={previewFile?.title} />
    </div>
  );
};

export default IzinPeserta;
