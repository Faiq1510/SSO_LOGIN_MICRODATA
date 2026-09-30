import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../../components/ProviderNotifikasi";
import { uploadFile } from "../../../services/penilaian.service";
import { getPendaftaranSaya } from "../../../services/pendaftaran.service";
import { apiRequest } from "../../../utils/api";
import { getLocalDateString } from "../../../utils/date";
import { Upload, ChevronDown, Trash, FileText } from "lucide-react";

const MAX_DOKUMEN_SIZE = 5 * 1024 * 1024;
const ALLOWED_DOKUMEN_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const getFirstFile = (files: unknown) => (files instanceof FileList ? files.item(0) : null);

const optionsTipeIzin = ["Izin Sakit", "Izin Kegiatan", "Izin WFH"] as const;

const leaveSchema = z
  .object({
    tipeIzin: z.enum(optionsTipeIzin),
    tanggalMulai: z.string().min(1, "Tanggal mulai wajib diisi"),
    tanggalSelesai: z.string().min(1, "Tanggal selesai wajib diisi"),
    alasan: z.string().min(1, "Alasan wajib diisi").min(10, "Alasan minimal 10 karakter"),
    dokumen: z
      .any()
      .optional()
      .refine((files) => {
        const file = getFirstFile(files);
        return !file || ALLOWED_DOKUMEN_TYPES.includes(file.type);
      }, "Dokumen harus PDF, JPG, atau PNG")
      .refine((files) => {
        const file = getFirstFile(files);
        return !file || file.size <= MAX_DOKUMEN_SIZE;
      }, "Ukuran dokumen maksimal 5MB"),
  })
  .refine((data) => data.tanggalMulai >= getLocalDateString(), {
    message: "Tanggal mulai izin tidak boleh di masa lalu",
    path: ["tanggalMulai"],
  })
  .refine((data) => data.tanggalSelesai >= getLocalDateString(), {
    message: "Tanggal selesai izin tidak boleh di masa lalu",
    path: ["tanggalSelesai"],
  })
  .refine((data) => data.tanggalMulai <= data.tanggalSelesai, {
    message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
    path: ["tanggalSelesai"],
  });

type LeaveValues = z.infer<typeof leaveSchema>;

const FormIzin: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeaveValues>({
    resolver: zodResolver(leaveSchema),
    defaultValues: { tipeIzin: "Izin Sakit" },
  });

  const selectedTipeIzin = watch("tipeIzin");
  const watchTanggalMulai = watch("tanggalMulai");
  const watchDokumen = watch("dokumen");
  const selectedDokumen = getFirstFile(watchDokumen);

  const handleClearDokumen = () => {
    setValue("dokumen", undefined);
  };

  useEffect(() => {
    const checkPklStatus = async () => {
      try {
        const res = await getPendaftaranSaya();
        if (res.status === "success" && res.data) {
          const today = getLocalDateString();
          const tMasuk = res.data.tanggal_masuk.split("T")[0];
          const tKeluar = res.data.tanggal_keluar.split("T")[0];
          const isAktif = res.data.status === "aktif" && today >= tMasuk && today <= tKeluar;
          if (!isAktif) {
            showError("Fitur izin hanya dapat diakses saat PKL Anda sedang aktif berjalan.");
            navigate("/dashboard/peserta/izin", { replace: true });
            return;
          }
        } else {
          showError("Anda tidak memiliki jadwal PKL yang aktif.");
          navigate("/dashboard/peserta/izin", { replace: true });
          return;
        }
      } catch (_err) {
        showError("Gagal memverifikasi status PKL Anda.");
        navigate("/dashboard/peserta/izin", { replace: true });
        return;
      } finally {
        setIsCheckingStatus(false);
      }
    };
    checkPklStatus();
  }, [navigate, showError]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const onSubmit = async (data: LeaveValues) => {
    try {
      let buktiUrl: string | null = null;
      const file = getFirstFile(data.dokumen);

      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await uploadFile(formData);

        if (uploadRes.status === "success" && uploadRes.data?.url) {
          buktiUrl = uploadRes.data.url;
        } else {
          showError("Gagal mengunggah dokumen pendukung.");
          return;
        }
      }

      const res = await apiRequest("/izin", {
        method: "POST",
        body: JSON.stringify({
          tanggalMulai: data.tanggalMulai,
          tanggalSelesai: data.tanggalSelesai,
          kategori: data.tipeIzin,
          alasan: data.alasan,
          buktiUrl,
        }),
      });

      if (res.status === "success") {
        showSuccess("Pengajuan izin berhasil dikirim!");
        navigate("/dashboard/peserta/izin");
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Gagal mengirim pengajuan izin.");
    }
  };

  if (isCheckingStatus) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-1">Pengajuan Izin</h1>
        <p className="text-text-secondary">Silakan isi formulir di bawah ini untuk mengajukan izin ketidakhadiran.</p>
      </div>

      <div className="bg-surface-1 border border-border-base rounded-3xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2" ref={dropdownRef}>
            <label className="text-sm font-medium text-text-secondary">Tipe Izin</label>
            <div className="relative">
              <input type="hidden" {...register("tipeIzin")} />
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between bg-surface-0 border ${errors.tipeIzin ? "border-red-500" : "border-border-base hover:border-border-strong"} text-text-primary px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all cursor-pointer font-medium text-left`}
              >
                <span>{selectedTipeIzin}</span>
                <ChevronDown className={`w-5 h-5 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180 text-brand" : ""}`} />
              </button>

              {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-surface-0 border border-border-base rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="py-1">
                    {optionsTipeIzin.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setValue("tipeIzin", option, { shouldValidate: true });
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${selectedTipeIzin === option ? "bg-brand/10 text-brand font-semibold" : "text-text-secondary hover:bg-surface-1 hover:text-text-primary"}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {errors.tipeIzin && <p className="text-red-500 text-xs mt-1">{errors.tipeIzin.message}</p>}
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Tanggal Mulai</label>
              <input
                {...register("tanggalMulai")}
                type="date"
                min={getLocalDateString()}
                className={`w-full bg-surface-0 border ${errors.tanggalMulai ? "border-red-500" : "border-border-base"} text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all`}
              />
              {errors.tanggalMulai && <p className="text-red-500 text-xs mt-1">{errors.tanggalMulai.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Tanggal Selesai</label>
              <input
                {...register("tanggalSelesai")}
                type="date"
                min={watchTanggalMulai && watchTanggalMulai >= getLocalDateString() ? watchTanggalMulai : getLocalDateString()}
                className={`w-full bg-surface-0 border ${errors.tanggalSelesai ? "border-red-500" : "border-border-base"} text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all`}
              />
              {errors.tanggalSelesai && <p className="text-red-500 text-xs mt-1">{errors.tanggalSelesai.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Alasan</label>
            <textarea
              {...register("alasan")}
              rows={4}
              placeholder="Jelaskan alasan izin Anda..."
              className={`w-full bg-surface-0 border ${errors.alasan ? "border-red-500" : "border-border-base"} text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all resize-none`}
            ></textarea>
            {errors.alasan && <p className="text-red-500 text-xs mt-1">{errors.alasan.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">
              Dokumen Pendukung <span className="text-text-muted font-normal">(Opsional / Surat Dokter)</span>
            </label>
            {selectedDokumen ? (
              <div className="relative p-4 bg-surface-0 border border-border-base hover:border-border-strong rounded-xl flex items-center justify-between gap-4 transition-colors group/file">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand border border-orange-500/20 shrink-0 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">{selectedDokumen.name}</p>
                    <p className="text-[10px] text-text-secondary mt-0.5">{(selectedDokumen.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleClearDokumen}
                    className="p-1.5 text-red-500 hover:text-text-primary hover:bg-red-600/20 bg-surface-1 border border-border-base hover:border-red-500/30 rounded-lg transition-all duration-300 cursor-pointer active:scale-95"
                    title="Hapus Berkas"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center group transition-all duration-300 ${errors.dokumen ? "border-red-500/50 bg-red-500/5" : "border-border-base bg-surface-0 hover:border-orange-500/50"}`}
              >
                <input {...register("dokumen")} type="file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="w-10 h-10 bg-surface-1 rounded-full flex items-center justify-center mb-3 text-text-secondary group-hover:text-brand transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-text-primary text-sm font-medium">Unggah Dokumen</p>
                <p className="text-text-muted text-xs mt-1">PDF atau Gambar, maks 5MB</p>
              </div>
            )}
            {errors.dokumen && <p className="text-red-500 text-xs mt-1 text-center">{errors.dokumen.message as string}</p>}
          </div>

          <div className="flex gap-4 pt-4 border-t border-border-base">
            <button
              type="button"
              onClick={() => navigate("/dashboard/peserta/izin")}
              className="flex-1 bg-surface-1 hover:bg-surface-2 text-text-primary font-medium py-3.5 rounded-xl transition-all border border-border-base"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] bg-brand hover:bg-brand/90 text-text-primary font-bold py-3.5 rounded-xl transition-all shadow-sm shadow-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormIzin;
