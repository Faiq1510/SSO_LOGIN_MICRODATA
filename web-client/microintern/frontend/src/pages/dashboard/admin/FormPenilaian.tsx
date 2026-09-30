import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link, useSearchParams } from "react-router-dom";
import { useNotification } from "../../../components/ProviderNotifikasi";
import { adminGetEvaluationByUser, adminCreateEvaluation, adminUpdateEvaluation } from "../../../services/penilaian.service";
import { AlertTriangle, ChevronLeft, Check, Pencil, X, Plus, Trash2 } from "lucide-react";

interface KriteriaItem {
  kriteria_id: string;
  nama_kriteria: string;
  urutan: number;
  nilai: number | "";
}

interface AttendanceSummary {
  total_hadir: number;
  total_izin: number;
  total_alpha: number;
  total_tercatat: number;
}

const FormPenilaian: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const pengajuanId = searchParams.get("pengajuanId") || undefined;
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [participantName, setParticipantName] = useState("");
  const [hasExisting, setHasExisting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);

  const [kriteriaItems, setKriteriaItems] = useState<KriteriaItem[]>([]);
  const [initialKriteriaItems, setInitialKriteriaItems] = useState<KriteriaItem[]>([]);
  const [initialCatatan, setInitialCatatan] = useState("");

  useEffect(() => {
    const fetchEvaluationDetail = async () => {
      try {
        const res = await adminGetEvaluationByUser(id!, pengajuanId);
        if (res.status === "success" && res.data) {
          const { participant, evaluation, template, attendanceSummary: summary } = res.data;
          setParticipantName(participant.nama || "Tanpa Nama");
          if (summary) {
            setAttendanceSummary({
              total_hadir: summary.total_hadir ?? 0,
              total_izin: summary.total_izin ?? 0,
              total_alpha: summary.total_alpha ?? 0,
              total_tercatat: summary.total_tercatat ?? 0,
            });
          }
          if (template) {
            setTemplateId(template.id);
          }
          if (evaluation) {
            setHasExisting(true);
            setIsEditMode(false);
            setCatatan(evaluation.catatan || "");
            setInitialCatatan(evaluation.catatan || "");

            const items: KriteriaItem[] = (evaluation.items || []).map((item: { kriteria_id: string; nama_kriteria?: string; urutan?: number; nilai: number }) => ({
              kriteria_id: item.kriteria_id,
              nama_kriteria: item.nama_kriteria || "",
              urutan: item.urutan || 0,
              nilai: Number(item.nilai),
            }));
            setKriteriaItems(items);
            setInitialKriteriaItems(items);
          } else {
            setHasExisting(false);
            setIsEditMode(true);
            setCatatan("");

            const items: KriteriaItem[] = (template?.kriteria || []).map((k: { id: string; nama_kriteria: string; urutan: number }) => ({
              kriteria_id: k.id,
              nama_kriteria: k.nama_kriteria,
              urutan: k.urutan,
              nilai: "",
            }));
            setKriteriaItems(items);
          }
        }
      } catch (err: unknown) {
        console.error("Gagal memuat detail penilaian:", err);
        const error = err as Error;
        setErrorMessage(error.message || "Terjadi kesalahan saat memuat data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluationDetail();
  }, [id, pengajuanId]);

  const getNumVal = (val: number | ""): number => (val === "" ? 0 : val);

  const handleBatal = () => {
    setKriteriaItems(initialKriteriaItems);
    setCatatan(initialCatatan);
    setIsEditMode(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasEmptyName = kriteriaItems.some((item) => !item.nama_kriteria.trim());
    if (hasEmptyName) {
      showError("Semua nama kriteria harus diisi!");
      return;
    }

    const namesSet = new Set<string>();
    for (const item of kriteriaItems) {
      const nameKey = item.nama_kriteria.trim().toLowerCase();
      if (namesSet.has(nameKey)) {
        showError("Nama kriteria penilaian tidak boleh duplikat!");
        return;
      }
      namesSet.add(nameKey);
    }

    setIsSubmitting(true);

    try {
      const payload = {
        template_id: templateId,
        pengajuan_id: pengajuanId,
        items: kriteriaItems.map((item) => ({
          nama_kriteria: item.nama_kriteria,
          nilai: getNumVal(item.nilai),
        })),
        catatan,
      };

      const res = hasExisting ? await adminUpdateEvaluation(id!, payload) : await adminCreateEvaluation(id!, payload);

      if (res.status === "success" || res.statusCode === 201) {
        showSuccess("Penilaian berhasil disimpan!");
        navigate("/dashboard/admin/penilaian");
      }
    } catch (err: unknown) {
      console.error("Gagal menyimpan penilaian:", err);
      const error = err as Error;
      showError(error.message || "Gagal menyimpan penilaian.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const avg = kriteriaItems.length > 0 ? (kriteriaItems.reduce((acc, item) => acc + getNumVal(item.nilai), 0) / kriteriaItems.length).toFixed(1) : "0.0";

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-text-muted">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium">Memuat data penilaian...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-surface-1 border border-border-base rounded-3xl text-center shadow-sm">
        <div className="w-16 h-16 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-text-primary tracking-tight mb-2">Akses Ditolak</h3>
        <p className="text-sm text-text-secondary leading-relaxed mb-8">{errorMessage}</p>
        <Link
          to="/dashboard/admin/penilaian"
          className="inline-block w-full bg-surface-2 hover:bg-zinc-700 text-text-primary font-bold py-3.5 rounded-xl transition-all cursor-pointer text-sm"
        >
          Kembali ke Daftar Penilaian
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard/admin/penilaian"
            className="w-10 h-10 rounded-full bg-surface-1 border border-border-base flex items-center justify-center text-text-secondary hover:text-text-primary transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">{hasExisting ? "Penilaian PKL" : "Beri Penilaian PKL"}</h1>
            <p className="text-text-muted text-sm">
              Peserta: <span className="text-brand font-bold">{participantName}</span>
            </p>
          </div>
        </div>
        <div className="bg-surface-1 border border-border-base p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="text-right">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none mb-1">Rata-rata {hasExisting && !isEditMode ? "Akhir" : "Sementara"}</p>
            <p className="text-2xl font-black text-text-primary leading-none">{avg}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center text-text-primary text-xl font-bold">
            {parseFloat(avg) >= 80 ? "A" : parseFloat(avg) >= 70 ? "B" : "C"}
          </div>
        </div>
      </div>

      {attendanceSummary && (
        <section className="bg-surface-1 border border-border-base rounded-3xl p-6 shadow-sm">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Rekap Presensi Peserta</p>
          <div className="grid grid-cols-5 divide-x divide-zinc-800">
            <div className="pr-6 space-y-1">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Hadir</p>
              <p className="text-3xl font-black text-text-primary tabular-nums">{attendanceSummary.total_hadir}</p>
              <p className="text-[10px] text-emerald-500 font-medium">Hari</p>
            </div>
            <div className="px-6 space-y-1">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Izin</p>
              <p className="text-3xl font-black text-text-primary tabular-nums">{attendanceSummary.total_izin}</p>
              <p className="text-[10px] text-amber-400 font-medium">Hari</p>
            </div>
            <div className="px-6 space-y-1">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Alpha</p>
              <p className="text-3xl font-black text-text-primary tabular-nums">{attendanceSummary.total_alpha}</p>
              <p className="text-[10px] text-red-400 font-medium">Hari</p>
            </div>
            <div className="px-6 space-y-1">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total</p>
              <p className="text-3xl font-black text-text-primary tabular-nums">{attendanceSummary.total_tercatat}</p>
              <p className="text-[10px] text-text-secondary font-medium">Hari Tercatat</p>
            </div>
            <div className="pl-6 space-y-1">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Presentase Kehadiran</p>
              {(() => {
                const percent = attendanceSummary.total_tercatat > 0 ? (attendanceSummary.total_hadir / attendanceSummary.total_tercatat) * 100 : 0;
                const colorClass = percent < 80 ? "text-red-500" : percent < 90 ? "text-amber-400" : "text-emerald-500";
                return <p className={`text-3xl font-black tabular-nums ${colorClass}`}>{percent.toFixed(1)}%</p>;
              })()}
              <p className="text-[10px] text-text-secondary font-medium">dari total tercatat</p>
            </div>
          </div>
        </section>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-surface-1 border border-border-base rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6 border-b border-border-subtle pb-4">
            <h3 className="text-lg font-bold text-text-primary">{isEditMode ? "Kriteria Evaluasi (0-100)" : "Hasil Evaluasi"}</h3>
            {hasExisting && (
              <button
                type="button"
                onClick={() => (isEditMode ? handleBatal() : setIsEditMode(true))}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand hover:text-brand/80 bg-brand/10 hover:bg-brand/20 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
              >
                {isEditMode ? (
                  <>
                    <X className="w-3.5 h-3.5" /> Batal
                  </>
                ) : (
                  <>
                    <Pencil className="w-3.5 h-3.5" /> Edit Nilai
                  </>
                )}
              </button>
            )}
          </div>
          {isEditMode ? (
            <div className="space-y-4">
              <div className="hidden sm:flex gap-4 px-2 text-[10px] font-black uppercase tracking-wider text-text-muted">
                <div className="flex-1">Nama Kriteria</div>
                <div className="w-24 text-center">Nilai</div>
                <div className="w-10"></div>
              </div>

              <div className="grid grid-cols-1 gap-y-3">
                {kriteriaItems.map((item, idx) => (
                  <div key={item.kriteria_id || idx} className="flex flex-col sm:flex-row gap-3 items-center">
                    <div className="flex-1 w-full">
                      <label className="block sm:hidden text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1">Nama Kriteria</label>
                      <input
                        type="text"
                        required
                        value={item.nama_kriteria}
                        onChange={(e) => {
                          const updated = [...kriteriaItems];
                          updated[idx].nama_kriteria = e.target.value;
                          setKriteriaItems(updated);
                        }}
                        className="w-full h-10 bg-surface-0 border border-border-base text-text-primary px-3.5 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all text-sm font-semibold"
                      />
                    </div>
                    <div className="w-full sm:w-24">
                      <label className="block sm:hidden text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1">Nilai</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={item.nilai}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^0-9]/g, "");
                          if (val !== "" && parseInt(val) > 100) val = "100";
                          const updated = [...kriteriaItems];
                          updated[idx].nilai = val === "" ? "" : parseInt(val);
                          setKriteriaItems(updated);
                        }}
                        onFocus={(e) => e.target.select()}
                        className="w-full h-10 bg-surface-0 border border-border-base text-text-primary px-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all font-mono-data text-sm font-semibold text-center"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = kriteriaItems.filter((_, i) => i !== idx);
                        setKriteriaItems(updated);
                      }}
                      className="h-10 w-full sm:w-10 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all active:scale-95 cursor-pointer mt-2 sm:mt-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setKriteriaItems([
                    ...kriteriaItems,
                    {
                      kriteria_id: "",
                      nama_kriteria: "",
                      urutan: kriteriaItems.length + 1,
                      nilai: "",
                    },
                  ]);
                }}
                className="w-full py-3 border-2 border-dashed border-border-base hover:border-brand text-text-secondary hover:text-brand font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Kriteria Baru
              </button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/30">
              {kriteriaItems.map((item) => (
                <div key={item.kriteria_id} className="py-2.5 flex justify-between items-center group">
                  <span className="text-text-secondary font-medium tracking-tight text-sm">{item.nama_kriteria}</span>
                  <span className="font-mono-data text-sm font-semibold text-text-primary bg-surface-0 px-3 py-1 rounded-lg border border-border-base">{item.nilai}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-surface-1 border border-border-base rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text-primary">Catatan Performa</h3>
            {isEditMode && <span className={`text-xs font-bold ${catatan.length >= 200 ? "text-red-500" : "text-text-muted"}`}>{catatan.length} / 200</span>}
          </div>
          {isEditMode ? (
            <textarea
              value={catatan}
              maxLength={200}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full bg-surface-0 border border-border-base text-text-primary px-4 py-4 rounded-2xl focus:ring-2 focus:ring-orange-600 outline-none transition-all h-32 text-sm resize-none"
              placeholder="Tuliskan masukan atau alasan penilaian untuk peserta (Maks. 200 karakter)..."
            />
          ) : (
            <div className="bg-surface-0 border border-border-base px-6 py-5 rounded-2xl min-h-[100px] text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
              {catatan || <span className="italic text-text-muted">Tidak ada catatan performa.</span>}
            </div>
          )}
        </section>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4 border-t border-border-subtle/30">
          {isEditMode ? (
            <>
              <p className="text-[11px] text-text-muted max-w-md leading-relaxed">
                Nilai yang disimpan akan langsung tampil di dashboard peserta dan mengaktifkan tombol download sertifikat.
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand hover:bg-brand/90 text-text-primary font-bold px-8 py-4 rounded-2xl transition-all shadow-sm shadow-orange-900/40 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Nilai"}
                <Check className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="w-full text-center sm:text-right">
              <span className="inline-block px-6 py-3.5 bg-emerald-500/5 text-emerald-500 text-[10px] font-black rounded-2xl border border-emerald-500/10 uppercase tracking-widest">
                Penilaian Tersimpan
              </span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default FormPenilaian;
