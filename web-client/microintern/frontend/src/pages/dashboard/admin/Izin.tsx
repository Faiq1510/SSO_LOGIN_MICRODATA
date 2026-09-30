import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { adminGetAllIzin } from "../../../services/izin.service";
import { getLocalDateString } from "../../../utils/date";
import { Search, FileText, X, Eye, XCircle } from "lucide-react";
import ModalPratinjauBerkas from "../../../components/ModalPratinjauBerkas";

interface IzinLog {
  id: string;
  user_id: string;
  nama_lengkap: string;
  institusi: string;
  program_studi: string;
  tanggal: string;
  kategori: string;
  alasan: string;
  bukti_url: string | null;
  created_at: string;
}

const IzinAdmin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return null;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [leaves, setLeaves] = useState<IzinLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedLeave, setSelectedLeave] = useState<IzinLog | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) {
        setSelectedDate(parsed);
      }
    } else {
      setSelectedDate(null);
    }
  }, [dateParam]);

  useEffect(() => {
    let active = true;
    const fetchLeaves = async () => {
      try {
        if (active) setIsLoading(true);

        const dateStr = selectedDate instanceof Date ? getLocalDateString(selectedDate) : undefined;
        const res = await adminGetAllIzin(dateStr);
        if (active && res.status === "success" && Array.isArray(res.data)) {
          setLeaves(res.data);
        }
      } catch (err) {
        console.error("Gagal mengambil data izin:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchLeaves();
    return () => {
      active = false;
    };
  }, [selectedDate]);

  const filteredLeaves = leaves.filter(
    (a) =>
      a.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.institusi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.program_studi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full -translate-y-1/2 pointer-events-none"></div>

      <div className="flex flex-col gap-8 lg:flex-row lg:justify-between lg:items-center">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight mb-2">Pengajuan Izin</h1>
          <p className="text-text-muted font-medium italic text-sm">Pantau daftar pengajuan izin dan sakit dari peserta PKL.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 sm:min-w-[240px]">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari peserta..."
              className="w-full bg-surface-1 border border-border-base text-text-primary pl-12 pr-4 py-3 rounded-2xl text-sm focus:border-amber-500/50 outline-none transition-all shadow-inner"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          </div>
          <div className="relative flex items-center gap-2">
            <input
              type="date"
              value={selectedDate instanceof Date ? getLocalDateString(selectedDate) : ""}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(new Date(e.target.value));
                } else {
                  setSelectedDate(null);
                }
              }}
              className="bg-surface-1 border border-border-base text-text-primary px-4 py-3 rounded-2xl text-sm focus:border-amber-500/50 outline-none transition-all shadow-inner cursor-pointer w-full sm:w-auto h-full"
            />
            {selectedDate instanceof Date && (
              <button
                onClick={() => setSelectedDate(null)}
                className="p-3 bg-surface-1 border border-border-base text-text-muted hover:text-text-primary rounded-2xl transition-all shadow-inner"
                title="Hapus filter tanggal"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        <div className="bg-surface-1 border border-border-base p-6 rounded-2xl shadow-sm relative group overflow-hidden">
          <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Total Pengajuan Izin</p>
          <h3 className="text-3xl font-black text-amber-500 mt-2 font-mono-data tracking-tight">{leaves.length}</h3>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute -inset-0.5 rounded-2xl blur opacity-20"></div>
        <div className="relative bg-surface-1 border border-border-base rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border-subtle flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-text-primary tracking-tight">Daftar Izin</h3>
              <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1 italic">
                {selectedDate instanceof Date
                  ? `Tanggal: ${selectedDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`
                  : "Semua Tanggal"}
              </p>
            </div>
          </div>

          <div className="md:hidden divide-y divide-border-subtle">
            {isLoading ? (
              <div className="px-5 py-8 text-center text-text-muted italic">Memuat data izin...</div>
            ) : filteredLeaves.length === 0 ? (
              <div className="px-5 py-8 text-center text-text-muted italic">Tidak ada pengajuan izin.</div>
            ) : (
              filteredLeaves.map((item) => (
                <div key={item.id} className="p-5 hover:bg-surface-2 transition-all cursor-pointer space-y-3" onClick={() => setSelectedLeave(item)}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col min-w-0">
                      <span className="text-text-primary font-bold tracking-tight text-base truncate">{item.nama_lengkap}</span>
                      <span className="text-[10px] text-text-muted uppercase tracking-widest font-black mt-0.5 truncate">
                        {item.institusi} - {item.program_studi}
                      </span>
                    </div>
                    <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
                      {item.kategori}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border-subtle/50 flex justify-between items-center gap-4">
                    <p className="text-text-secondary text-xs line-clamp-2 flex-1">{item.alasan}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLeave(item);
                      }}
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors shrink-0 inline-flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Detail
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto scrollbar-hide rounded-b-[2.5rem]">
            <table className="w-full text-left text-sm text-text-secondary min-w-[700px]">
              <thead className="text-[10px] text-text-muted uppercase tracking-[0.2em] bg-surface-0/30">
                <tr>
                  <th className="px-5 py-3 font-semibold">Identitas / Institusi</th>
                  <th className="px-5 py-3 font-semibold">Kategori</th>
                  <th className="px-5 py-3 font-semibold">Alasan Singkat</th>
                  <th className="px-5 py-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-text-muted italic">
                      Memuat data izin...
                    </td>
                  </tr>
                ) : filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-text-muted italic">
                      Tidak ada pengajuan izin.
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((item) => (
                    <tr key={item.id} className="group hover:bg-surface-2 transition-all">
                      <td className="px-5 py-3.5 w-1/3">
                        <div className="flex flex-col">
                          <span className="text-text-primary font-bold tracking-tight text-lg group-hover:text-amber-400 transition-colors">{item.nama_lengkap}</span>
                          <span className="text-[10px] text-text-muted uppercase tracking-widest font-black mt-0.5 italic">
                            {item.institusi} - {item.program_studi}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 w-1/6">
                        <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold uppercase tracking-widest">{item.kategori}</span>
                      </td>
                      <td className="px-5 py-3.5 w-1/3">
                        <p className="text-text-secondary text-sm line-clamp-2">{item.alasan}</p>
                      </td>
                      <td className="px-5 py-3.5 text-center w-1/6">
                        <button
                          onClick={() => setSelectedLeave(item)}
                          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors inline-flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Detail Izin */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setSelectedLeave(null)} />
          <div className="relative bg-surface-0 border border-border-base rounded-3xl w-full max-w-lg overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border-subtle">
              <h3 className="text-lg font-bold text-text-primary">Detail Pengajuan Izin</h3>
              <button onClick={() => setSelectedLeave(null)} className="p-2 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-surface-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">Nama Peserta</p>
                <p className="text-text-primary font-medium">{selectedLeave.nama_lengkap}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">Tanggal Izin</p>
                <p className="text-text-primary font-medium">
                  {new Date(selectedLeave.tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">Kategori</p>
                <p className="text-text-primary font-medium inline-block px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs uppercase tracking-widest">
                  {selectedLeave.kategori}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">Alasan</p>
                <div className="bg-surface-1 p-4 rounded-xl border border-border-subtle">
                  <p className="text-text-secondary text-sm whitespace-pre-wrap">{selectedLeave.alasan}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2">Bukti Pendukung</p>
                {selectedLeave.bukti_url ? (
                  <button
                    type="button"
                    onClick={() => setPreviewFile({ url: selectedLeave.bukti_url!, title: `Bukti Izin - ${selectedLeave.nama_lengkap}` })}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-surface-2 hover:bg-surface-3 text-amber-500 text-sm font-semibold rounded-xl border border-border-base transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Lihat Dokumen
                  </button>
                ) : (
                  <p className="text-sm text-text-muted italic bg-surface-0/50 p-4 rounded-2xl border border-border-base">Tidak ada lampiran dokumen.</p>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-border-subtle flex justify-end bg-surface-1">
              <button onClick={() => setSelectedLeave(null)} className="bg-zinc-100 text-zinc-900 hover:bg-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors">
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

export default IzinAdmin;
