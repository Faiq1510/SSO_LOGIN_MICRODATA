import React, { useState, useEffect } from "react";
import { getMyEvaluation } from "../../../services/penilaian.service";
import { AlertTriangle, CheckCircle, Download, MessageSquare } from "lucide-react";
import { viewDocument } from "../../../utils/download";

interface EvaluationItem {
  id: string;
  penilaian_id: string;
  kriteria_id: string;
  nilai: number;
  nama_kriteria: string;
  urutan: number;
}

interface EvaluationData {
  id: string;
  user_id: string;
  dinilai_oleh: string;
  template_id: string;
  nilai_akhir: number | string;
  catatan: string | null;
  sertifikat_url: string | null;
  items?: EvaluationItem[];
}

const PenilaianPeserta: React.FC = () => {
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notCompletedMessage, setNotCompletedMessage] = useState("");
  const [isGraded, setIsGraded] = useState(false);

  useEffect(() => {
    const fetchMyEvaluation = async () => {
      try {
        const res = await getMyEvaluation();
        if (res.status === "success") {
          if (res.data) {
            setEvaluation(res.data);
            setIsGraded(true);
          } else {
            setIsGraded(false);
          }
        }
      } catch (err: unknown) {
        console.error("Gagal memuat nilai saya:", err);
        const error = err as Error;
        setNotCompletedMessage(error.message || "Anda belum bisa mengakses fitur ini.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyEvaluation();
  }, []);

  const getPredicate = (scoreNum: number) => {
    if (scoreNum >= 80) return "A";
    if (scoreNum >= 70) return "B";
    if (scoreNum >= 60) return "C";
    return "D";
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-text-muted">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium">Memuat data evaluasi...</p>
      </div>
    );
  }

  if (notCompletedMessage) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-surface-1 border border-border-base rounded-3xl text-center shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full -mr-12 -mt-12"></div>
        <div className="w-16 h-16 bg-brand/10 text-brand border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-text-primary tracking-tight mb-2">Evaluasi Belum Tersedia</h3>
        <p className="text-sm text-text-secondary leading-relaxed mb-6">{notCompletedMessage}</p>
        <div className="p-4 bg-surface-0/50 rounded-2xl border border-border-subtle text-left text-xs text-text-muted leading-relaxed italic">
          Nilai akhir dan sertifikat digital hanya dapat diakses setelah masa magang Anda berakhir (melewati Tanggal Keluar) dan status pengajuan PKL Anda diubah menjadi "Selesai".
        </div>
      </div>
    );
  }

  if (!isGraded || !evaluation) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-surface-1 border border-border-base rounded-3xl text-center shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12"></div>
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-text-primary tracking-tight mb-2">PKL Selesai</h3>
        <p className="text-sm text-text-secondary leading-relaxed mb-6">Anda telah menyelesaikan masa magang PKL. Saat ini mentor/admin sedang memproses penilaian Anda.</p>
        <div className="p-4 bg-surface-0/50 rounded-2xl border border-border-subtle text-left text-xs text-text-muted leading-relaxed italic">
          Silakan periksa halaman ini secara berkala. Tombol download sertifikat akan otomatis aktif setelah penilaian selesai diinput oleh admin.
        </div>
      </div>
    );
  }

  const scoreNum = Number(evaluation.nilai_akhir);
  const predicate = getPredicate(scoreNum);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand/5 rounded-full -translate-y-1/2 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight mb-2">Evaluasi Akhir</h1>
          <p className="text-text-muted font-medium italic">Hasil penilaian performa selama masa PKL.</p>
        </div>
        {evaluation.sertifikat_url ? (
          <button
            onClick={() => viewDocument("Sertifikat PKL", evaluation.sertifikat_url)}
            className="group relative flex items-center justify-center gap-3 bg-white text-black font-black py-4 px-8 rounded-2xl transition-all hover:bg-orange-500 hover:text-text-primary active:scale-95 shadow-sm cursor-pointer"
          >
            <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Sertifikat PDF
          </button>
        ) : (
          <button
            disabled
            className="group relative flex items-center justify-center gap-3 bg-zinc-850 text-zinc-600 font-black py-4 px-8 rounded-2xl border border-border-subtle cursor-not-allowed opacity-60"
            title="Sertifikat belum diunggah oleh admin"
          >
            <Download className="w-5 h-5" />
            Sertifikat Belum Tersedia
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-orange-600 to-amber-500 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative bg-gradient-to-br from-orange-600 to-amber-600 rounded-2xl p-6 sm:p-8 lg:p-6 xl:p-8 text-center text-text-primary shadow-sm">
              <p className="text-orange-100 font-black uppercase tracking-[0.3em] text-[10px] mb-4">Cumulative Score</p>
              <h2 className="text-6xl sm:text-7xl lg:text-6xl xl:text-7xl font-black mb-4 tracking-tighter leading-none">{scoreNum.toFixed(1)}</h2>
              <div className="bg-black/20 rounded-2xl py-3 px-6 inline-block font-black text-lg sm:text-xl lg:text-base xl:text-xl border border-white/10 uppercase tracking-widest">
                Predikat: {predicate}
              </div>
            </div>
          </div>

          <div className="bg-surface-1 border border-border-base rounded-2xl p-8 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full -mr-12 -mt-12 group-hover:bg-brand/10 transition-all duration-700"></div>
            <h3 className="text-lg font-bold text-text-primary tracking-tight mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand" />
              Feedback Mentor
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed italic">{evaluation.catatan ? `"${evaluation.catatan}"` : "Tidak ada catatan tambahan dari mentor."}</p>
          </div>
        </div>

        <div className="lg:col-span-2 group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-800 to-zinc-700/50 rounded-2xl blur opacity-30"></div>
          <div className="relative bg-surface-1 border border-border-base rounded-2xl overflow-hidden flex flex-col shadow-sm">
            <div className="p-8 border-b border-border-subtle">
              <h3 className="text-xl font-bold text-text-primary tracking-tight uppercase tracking-widest text-xs opacity-50">Rincian Penilaian</h3>
            </div>
            <div className="flex-1">
              {(evaluation.items || []).map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-8 hover:bg-surface-2 transition-all group/item ${
                    idx !== (evaluation.items?.length || 0) - 1 ? "border-b border-border-subtle" : ""
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-text-primary font-bold text-lg group-hover/item:text-orange-400 transition-colors tracking-tight">{item.nama_kriteria}</span>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Kriteria Penilaian</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-48 h-1.5 bg-surface-0 rounded-full overflow-hidden hidden sm:block shadow-inner">
                      <div className="h-full bg-brand rounded-full group-hover/item:bg-orange-500 transition-all duration-700" style={{ width: `${item.nilai}%` }}></div>
                    </div>
                    <span className="text-text-primary font-black text-2xl w-20 text-right font-mono-data">{item.nilai}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PenilaianPeserta;
