import React, { useState, useEffect, useCallback } from "react";
import { FileText, Award, Eye, FileCheck, Layers } from "lucide-react";
import { getSuratBalasanList, getSertifikatList } from "../../../services/dokumen.service";
import ModalPratinjauBerkas from "../../../components/ModalPratinjauBerkas";
import Pagination from "../../../components/Pagination";

interface AnggotaItem {
  nama_lengkap: string;
  institusi: string;
}

interface SuratBalasanItem {
  id: string;
  nomor_surat: string;
  jenis: "diterima" | "ditolak";
  file_url: string;
  generated_at: string;
  pengajuan_id: string;
  anggota: AnggotaItem[];
}

interface SertifikatItem {
  id: string;
  nomor_sertifikat: string;
  file_url: string;
  generated_at: string;
  nama_lengkap: string;
  institusi: string;
  program_studi: string;
}

const DokumenGenerated: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"surat-balasan" | "sertifikat">("surat-balasan");

  const [suratList, setSuratList] = useState<SuratBalasanItem[]>([]);
  const [suratTotal, setSuratTotal] = useState(0);
  const [suratPage, setSuratPage] = useState(1);
  const [suratLimit, setSuratLimit] = useState(10);
  const [suratTotalPages, setSuratTotalPages] = useState(1);
  const [loadingSurat, setLoadingSurat] = useState(true);

  const [sertifikatList, setSertifikatList] = useState<SertifikatItem[]>([]);
  const [sertifikatTotal, setSertifikatTotal] = useState(0);
  const [sertifikatPage, setSertifikatPage] = useState(1);
  const [sertifikatLimit, setSertifikatLimit] = useState(10);
  const [sertifikatTotalPages, setSertifikatTotalPages] = useState(1);
  const [loadingSertifikat, setLoadingSertifikat] = useState(true);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  const fetchSuratBalasan = useCallback(async () => {
    setLoadingSurat(true);
    try {
      const res = await getSuratBalasanList(suratPage, suratLimit);
      if (res.status === "success" && res.data) {
        setSuratList(res.data.data || []);
        setSuratTotal(res.data.total || 0);
        setSuratTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load response letters:", err);
    } finally {
      setLoadingSurat(false);
    }
  }, [suratPage, suratLimit]);

  const fetchSertifikat = useCallback(async () => {
    setLoadingSertifikat(true);
    try {
      const res = await getSertifikatList(sertifikatPage, sertifikatLimit);
      if (res.status === "success" && res.data) {
        setSertifikatList(res.data.data || []);
        setSertifikatTotal(res.data.total || 0);
        setSertifikatTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load certificates:", err);
    } finally {
      setLoadingSertifikat(false);
    }
  }, [sertifikatPage, sertifikatLimit]);

  useEffect(() => {
    if (activeTab === "surat-balasan") {
      fetchSuratBalasan();
    } else {
      fetchSertifikat();
    }
  }, [activeTab, fetchSuratBalasan, fetchSertifikat]);

  const handleOpenPreview = (fileUrl: string, title: string) => {
    setPreviewFileUrl(fileUrl);
    setPreviewTitle(title);
    setPreviewModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Dokumen Generated</h1>
        <p className="text-text-secondary text-sm mt-1">Arsip dokumen resmi (Surat Balasan &amp; Sertifikat) yang telah diterbitkan oleh sistem.</p>
      </div>

      <div className="flex border-b border-border-base gap-2">
        <button
          onClick={() => setActiveTab("surat-balasan")}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "surat-balasan"
              ? "border-brand text-brand bg-brand/5 rounded-t-xl"
              : "border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-t-xl"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Surat Balasan</span>
        </button>

        <button
          onClick={() => setActiveTab("sertifikat")}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "sertifikat"
              ? "border-brand text-brand bg-brand/5 rounded-t-xl"
              : "border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-t-xl"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Sertifikat</span>
        </button>
      </div>

      {activeTab === "surat-balasan" && (
        <div className="space-y-4">
          <div className="bg-surface-1 border border-border-base rounded-2xl overflow-hidden shadow-sm">
            {loadingSurat ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
              </div>
            ) : suratList.length === 0 ? (
              <div className="text-center p-12 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto text-text-muted">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary">Belum Ada Surat Balasan</h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto">Surat balasan otomatis ter-generate ketika admin menerima atau menolak pengajuan PKL.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-2/60 text-text-muted text-xs uppercase tracking-wider border-b border-border-base">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Nomor Surat</th>
                      <th className="py-3.5 px-4 font-semibold">Jenis</th>
                      <th className="py-3.5 px-4 font-semibold">Peserta / Kelompok</th>
                      <th className="py-3.5 px-4 font-semibold">Tanggal Generate</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-base text-text-primary">
                    {suratList.map((item) => {
                      const namaList = item.anggota?.map((a) => a.nama_lengkap).filter(Boolean) || [];
                      const inst = item.anggota?.[0]?.institusi || "-";
                      return (
                        <tr key={item.id} className="hover:bg-surface-2/40 transition-colors">
                          <td className="py-4 px-4 font-mono font-medium text-xs text-brand">{item.nomor_surat}</td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                item.jenis === "diterima"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}
                            >
                              {item.jenis}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-0.5">
                              {namaList.length > 0 ? (
                                namaList.map((nama, idx) => (
                                  <div key={idx} className="font-medium text-text-primary">
                                    {nama}
                                  </div>
                                ))
                              ) : (
                                <div className="font-medium text-text-primary">-</div>
                              )}
                            </div>
                            <div className="text-xs text-text-muted mt-1">{inst}</div>
                          </td>
                          <td className="py-4 px-4 text-xs text-text-secondary">{formatDate(item.generated_at)}</td>
                          <td className="py-4 px-4 text-right">
                            {item.file_url ? (
                              <button
                                onClick={() => handleOpenPreview(item.file_url, `Surat Balasan - ${item.nomor_surat}`)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-2 hover:bg-surface-3 text-text-primary border border-border-base transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Pratinjau</span>
                              </button>
                            ) : (
                              <span className="text-xs text-text-muted italic">Berkas tidak ada</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {suratTotal > 0 && (
            <Pagination
              page={suratPage}
              totalPages={suratTotalPages}
              total={suratTotal}
              limit={suratLimit}
              onPageChange={(p) => setSuratPage(p)}
              onLimitChange={(l) => {
                setSuratLimit(l);
                setSuratPage(1);
              }}
            />
          )}
        </div>
      )}

      {activeTab === "sertifikat" && (
        <div className="space-y-4">
          <div className="bg-surface-1 border border-border-base rounded-2xl overflow-hidden shadow-sm">
            {loadingSertifikat ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
              </div>
            ) : sertifikatList.length === 0 ? (
              <div className="text-center p-12 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto text-text-muted">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary">Belum Ada Sertifikat</h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto">Sertifikat otomatis ter-generate saat admin menyelesaikan penilaian peserta PKL.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-2/60 text-text-muted text-xs uppercase tracking-wider border-b border-border-base">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Nomor Sertifikat</th>
                      <th className="py-3.5 px-4 font-semibold">Nama Peserta</th>
                      <th className="py-3.5 px-4 font-semibold">Institusi &amp; Prodi</th>
                      <th className="py-3.5 px-4 font-semibold">Tanggal Generate</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-base text-text-primary">
                    {sertifikatList.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-2/40 transition-colors">
                        <td className="py-4 px-4 font-mono font-medium text-xs text-brand">{item.nomor_sertifikat}</td>
                        <td className="py-4 px-4 font-medium text-text-primary">{item.nama_lengkap || "-"}</td>
                        <td className="py-4 px-4">
                          <div className="text-text-primary font-medium">{item.institusi || "-"}</div>
                          <div className="text-xs text-text-muted">{item.program_studi || "-"}</div>
                        </td>
                        <td className="py-4 px-4 text-xs text-text-secondary">{formatDate(item.generated_at)}</td>
                        <td className="py-4 px-4 text-right">
                          {item.file_url ? (
                            <button
                              onClick={() => handleOpenPreview(item.file_url, `Sertifikat - ${item.nomor_sertifikat}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-2 hover:bg-surface-3 text-text-primary border border-border-base transition-all cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Pratinjau</span>
                            </button>
                          ) : (
                            <span className="text-xs text-text-muted italic">Berkas tidak ada</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {sertifikatTotal > 0 && (
            <Pagination
              page={sertifikatPage}
              totalPages={sertifikatTotalPages}
              total={sertifikatTotal}
              limit={sertifikatLimit}
              onPageChange={(p) => setSertifikatPage(p)}
              onLimitChange={(l) => {
                setSertifikatLimit(l);
                setSertifikatPage(1);
              }}
            />
          )}
        </div>
      )}

      <ModalPratinjauBerkas isOpen={previewModalOpen} onClose={() => setPreviewModalOpen(false)} fileUrl={previewFileUrl} title={previewTitle} />
    </div>
  );
};

export default DokumenGenerated;
