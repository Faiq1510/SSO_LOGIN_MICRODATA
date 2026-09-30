import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminGetAllEvaluations } from "../../../services/penilaian.service";
import { Pencil } from "lucide-react";
import Pagination from "../../../components/Pagination";

interface EvaluationItem {
  user_id: string;
  pengajuan_id: string;
  email: string;
  nama: string;
  nim: string;
  institusi: string;
  prodi: string;
  status_pengajuan: string;
  tanggal_masuk: string;
  tanggal_keluar: string;
  penilaian_id: string | null;
  nilai_akhir: string | number | null;
  penilaian_created_at: string | null;
}

const PenilaianAdmin: React.FC = () => {
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchEvaluations = async () => {
      setIsLoading(true);
      try {
        const res = await adminGetAllEvaluations({ page, limit });
        if (res.status === "success" && Array.isArray(res.data)) {
          setEvaluations(res.data);
          if (res.pagination) {
            setTotal(res.pagination.total);
            setTotalPages(res.pagination.totalPages);
          }
        }
      } catch (err) {
        console.error("Gagal memuat data penilaian:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluations();
  }, [page, limit]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand/5 rounded-full -translate-y-1/2 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight mb-2">Penilaian Peserta</h1>
          <p className="text-text-muted font-medium italic text-sm">Evaluasi performa akhir peserta yang telah selesai PKL.</p>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute -inset-0.5 rounded-2xl blur opacity-20"></div>
        <div className="relative bg-surface-1 border border-border-base rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left text-sm text-text-secondary min-w-[700px]">
              <thead className="text-[10px] text-text-muted uppercase tracking-[0.2em] bg-surface-0/30">
                <tr>
                  <th className="px-8 py-5 font-black">Participant / Institution</th>
                  <th className="px-8 py-5 font-black text-center">Completion Date</th>
                  <th className="px-8 py-5 font-black text-center">Scoring Status</th>
                  <th className="px-8 py-5 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-10 text-center text-text-muted">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                        Memuat data penilaian...
                      </div>
                    </td>
                  </tr>
                ) : evaluations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-text-muted italic">
                      Tidak ada peserta yang telah menyelesaikan PKL untuk dinilai.
                    </td>
                  </tr>
                ) : (
                  evaluations.map((item) => (
                    <tr key={item.user_id} className="group hover:bg-surface-2 transition-all">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-text-primary font-bold tracking-tight text-lg group-hover:text-orange-400 transition-colors">{item.nama}</span>
                          <span className="text-[10px] text-text-muted uppercase tracking-widest font-black mt-0.5">
                            {item.institusi} • {item.prodi}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center font-mono-data text-xs italic">{formatDate(item.tanggal_keluar)}</td>
                      <td className="px-8 py-6 text-center">
                        {item.penilaian_id ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="bg-emerald-500/5 text-emerald-500 text-[10px] font-black px-4 py-1.5 rounded-full border border-emerald-500/10 uppercase tracking-widest whitespace-nowrap">
                              Sudah Dinilai
                            </span>
                            <span className="text-xs font-mono-data text-text-muted">
                              Nilai Akhir: <strong className="text-text-secondary">{Number(item.nilai_akhir).toFixed(1)}</strong>
                            </span>
                          </div>
                        ) : (
                          <span className="bg-amber-500/5 text-amber-500 text-[10px] font-black px-4 py-1.5 rounded-full border border-amber-500/10 uppercase tracking-widest whitespace-nowrap">
                            Belum Dinilai
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        {item.penilaian_id ? (
                          <Link
                            to={`/dashboard/admin/penilaian/${item.user_id}?pengajuanId=${item.pengajuan_id}`}
                            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary font-black text-[10px] uppercase tracking-widest bg-surface-0/40 px-6 py-2.5 rounded-xl border border-border-base hover:bg-surface-2 transition-all active:scale-95 cursor-pointer"
                          >
                            Edit Nilai
                          </Link>
                        ) : (
                          <Link
                            to={`/dashboard/admin/penilaian/${item.user_id}?pengajuanId=${item.pengajuan_id}`}
                            className="inline-flex items-center gap-2 text-text-primary font-black text-[10px] uppercase tracking-widest bg-brand px-6 py-2.5 rounded-xl hover:bg-orange-500 transition-all shadow-sm shadow-orange-900/20 active:scale-95"
                          >
                            Beri Nilai
                            <Pencil className="w-3 h-3" />
                          </Link>
                        )}
                      </td>
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
    </div>
  );
};

export default PenilaianAdmin;
