import React, { useEffect, useState } from "react";
import { apiRequest } from "../../../utils/api";
import { useNotification } from "../../../components/ProviderNotifikasi";
import { Award, Download, Calendar } from "lucide-react";
import ModalPratinjauBerkas from "../../../components/ModalPratinjauBerkas";

interface CertificateItem {
  pengajuan_id: string;
  tanggal_masuk: string;
  tanggal_keluar: string;
  nomor_sertifikat: string;
  sertifikat_url: string;
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const HistoriPkl: React.FC = () => {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiRequest("/pendaftaran/histori");
        // Filter out history items that don't have a certificate
        const validCerts = (res.data || []).filter((item: Record<string, unknown>) => item.sertifikat_url);
        setCertificates(validCerts);
      } catch (err: unknown) {
        if (err instanceof Error) {
          showError(err.message || "Gagal memuat histori PKL");
        } else {
          showError("Gagal memuat histori PKL");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [showError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand/20 border-t-orange-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-surface-1 border border-border-base rounded-3xl text-center shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full -mr-12 -mt-12"></div>
        <div className="w-16 h-16 bg-brand/10 text-brand border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Award className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-text-primary tracking-tight mb-2">Belum Ada Sertifikat</h3>
        <p className="text-sm text-text-secondary leading-relaxed mb-6">Anda belum memiliki sertifikat yang diterbitkan dari periode Praktik Kerja Lapangan (PKL) Anda.</p>
        <div className="p-4 bg-surface-0/50 rounded-2xl border border-border-subtle text-left text-xs text-text-muted leading-relaxed italic">
          Silakan periksa halaman ini secara berkala. Riwayat sertifikat akan otomatis muncul setelah Anda menyelesaikan program PKL dan admin mengunggah sertifikat resmi.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Award className="w-6 h-6 text-brand" />
          Riwayat Sertifikat
        </h1>
        <p className="text-sm text-text-secondary">Daftar sertifikat dari seluruh periode PKL yang telah Anda selesaikan.</p>
      </div>

      <div className="relative border-l border-border-base ml-4 md:ml-6 pl-6 md:pl-8 space-y-8 py-4">
        {certificates.map((item, index) => {
          const isLatest = index === 0;
          return (
            <div key={item.pengajuan_id || index} className="relative">
              <div className={`absolute -left-[31px] md:-left-[39px] top-1 w-4 h-4 rounded-full border-4 border-zinc-950 ${isLatest ? "bg-orange-500" : "bg-zinc-700"}`} />

              <div className="bg-surface-1 border border-border-subtle rounded-2xl overflow-hidden shadow-sm shadow-black/20 group hover:border-border-strong/50 transition-colors">
                <div className="p-5 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full">
                      Sertifikat Resmi
                    </span>
                    <span className="text-xs font-mono-data text-text-secondary">{item.nomor_sertifikat || "Tanpa Nomor"}</span>
                  </div>
                </div>

                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Periode Pelaksanaan</span>
                    <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                      <Calendar className="w-4 h-4 text-brand" />
                      {item.tanggal_masuk && item.tanggal_keluar ? `${formatDate(item.tanggal_masuk)} — ${formatDate(item.tanggal_keluar)}` : "Periode tidak diketahui"}
                    </div>
                  </div>

                  <div className="pt-2 md:pt-0 shrink-0">
                    <button
                      onClick={() => setPreviewFile({ url: item.sertifikat_url, title: `Sertifikat - ${item.nomor_sertifikat}` })}
                      className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand/90 text-text-primary text-sm font-bold rounded-xl transition-all shadow-sm shadow-orange-900/20 active:scale-95"
                    >
                      <Download className="w-4 h-4" /> Lihat Sertifikat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {previewFile && <ModalPratinjauBerkas isOpen={previewFile !== null} fileUrl={previewFile.url} title={previewFile.title} onClose={() => setPreviewFile(null)} />}
    </div>
  );
};

export default HistoriPkl;
