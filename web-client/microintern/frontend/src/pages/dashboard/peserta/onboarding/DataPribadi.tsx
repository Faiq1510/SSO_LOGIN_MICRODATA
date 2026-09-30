import React, { useEffect, useState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { getProfil, getInstitusiSuggestions, getProdiSuggestions } from "../../../../services/profil.service";
import { getPendaftaranSaya } from "../../../../services/pendaftaran.service";
import { uploadFile } from "../../../../services/penilaian.service";
import { apiRequest, getLocalUser, setLocalUser } from "../../../../utils/api";
import { useNotification } from "../../../../components/ProviderNotifikasi";
import ModalPratinjauBerkas from "../../../../components/ModalPratinjauBerkas";
import InputAutocomplete from "../../../../components/InputAutocomplete";
import { User, FileText, CloudUpload, ArrowRight, Trash, ChevronDown } from "lucide-react";

const MAX_CV_SIZE = 5 * 1024 * 1024;
const getFirstFile = (files: unknown) => (files instanceof FileList ? files.item(0) : null);

const personalDataBaseSchema = z.object({
  namaLengkap: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  jenjangPendidikan: z.enum(["sekolah", "kuliah"]),
  nimNisn: z.string().min(5, "Nomor identitas minimal 5 karakter"),
  institusi: z.string().min(3, "Nama institusi minimal 3 karakter"),
  prodi: z.string().min(2, "Program studi minimal 2 karakter"),
  cv: z
    .any()
    .refine((files) => {
      const file = getFirstFile(files);
      if (!file) return true;
      return file.type === "application/pdf";
    }, "CV harus berupa file PDF")
    .refine((files) => {
      const file = getFirstFile(files);
      if (!file) return true;
      return file.size <= MAX_CV_SIZE;
    }, "Ukuran CV maksimal 5MB")
    .optional(),
});

type PersonalDataValues = z.infer<typeof personalDataBaseSchema>;

const DataPribadi: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useNotification();
  const [existingCvUrl, setExistingCvUrl] = useState<string | null>(null);
  const [initialCvUrl, setInitialCvUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string } | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const personalDataSchema = useMemo(() => {
    return personalDataBaseSchema.refine(
      (data) => {
        if (!existingCvUrl && (!data.cv || data.cv.length === 0)) return false;
        return true;
      },
      {
        message: "CV wajib diunggah",
        path: ["cv"],
      }
    );
  }, [existingCvUrl]);

  const resolver = useMemo(() => zodResolver(personalDataSchema), [personalDataSchema]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PersonalDataValues>({
    resolver,
  });

  const cvValue = watch("cv");
  const selectedCv = getFirstFile(cvValue);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const subRes = await getPendaftaranSaya();
        if (subRes.status === "success" && subRes.data) {
          const status = subRes.data.status;
          if (status === "aktif") {
            showError("Anda tidak dapat mengubah data karena status pendaftaran Anda sudah aktif.");
            navigate("/dashboard/peserta");
            return;
          }
        }

        const response = await getProfil();
        if (response.status === "success" && response.data) {
          const profileData = response.data.profile;
          setOnboardingStatus(profileData?.onboarding_status || null);
          reset({
            namaLengkap: profileData?.nama_lengkap || "",
            jenjangPendidikan: (profileData?.jenjang_pendidikan as "sekolah" | "kuliah") || "kuliah",
            nimNisn: profileData?.nim_nisn || "",
            institusi: profileData?.institusi || "",
            prodi: profileData?.program_studi || "",
          });
          if (profileData?.cv_url) {
            setExistingCvUrl(profileData.cv_url);
            setInitialCvUrl(profileData.cv_url);
          }
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [reset, navigate, showError]);

  const handleClearCv = () => {
    setValue("cv", undefined);
    setExistingCvUrl(null);
  };

  const onSubmit = async (data: PersonalDataValues) => {
    try {
      let cvUrl = existingCvUrl;
      const file = getFirstFile(data.cv);

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await uploadFile(formData);
        cvUrl = uploadRes.data.url;
      }

      if (initialCvUrl && cvUrl !== initialCvUrl) {
        try {
          await apiRequest("/upload", {
            method: "DELETE",
            body: JSON.stringify({ url: initialCvUrl }),
          });
        } catch (err) {
          console.error("Gagal menghapus berkas CV lama:", err);
        }
      }

      const res = await apiRequest("/profil", {
        method: "PUT",
        body: JSON.stringify({
          nama_lengkap: data.namaLengkap,
          jenjang_pendidikan: data.jenjangPendidikan,
          nim_nisn: data.nimNisn,
          institusi: data.institusi,
          program_studi: data.prodi,
          cv_url: cvUrl,
          onboarding_status: "step_1_selesai",
        }),
      });

      if (res.status === "success" && res.data) {
        const localUser = getLocalUser();
        if (localUser) {
          setLocalUser({
            ...localUser,
            name: res.data.name || data.namaLengkap,
            jenjang_pendidikan: res.data.profile?.jenjang_pendidikan || data.jenjangPendidikan,
          });
        }
      }

      navigate("/dashboard/peserta/onboarding/pengisian-dokumen");
    } catch (err) {
      const error = err as Error;
      showError(error.message || "Gagal menyimpan data diri.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand/20 border-t-orange-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-brand flex items-center justify-center text-text-primary font-bold shadow-sm shadow-orange-900/20 shrink-0 text-sm sm:text-base">
          1
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">Tahap 1: Data Diri & CV</h1>
          <p className="text-xs sm:text-sm text-text-secondary">Lengkapi data diri akademik Anda dan unggah berkas CV terbaru.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <section className="bg-surface-1 border border-border-base rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm space-y-5">
            <h3 className="text-base sm:text-lg font-bold text-text-primary mb-5 sm:mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-brand shrink-0" />
              Profil Peserta
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-text-secondary">Nama Lengkap</label>
                <input
                  {...register("namaLengkap")}
                  className={`w-full bg-surface-0 border ${errors.namaLengkap ? "border-red-500" : "border-border-base"} text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all text-xs sm:text-sm`}
                  placeholder="Masukkan nama lengkap"
                />
                {errors.namaLengkap && <p className="text-red-500 text-xs font-bold mt-1">{errors.namaLengkap.message}</p>}
              </div>

              <div className="space-y-2" ref={dropdownRef}>
                <label className="text-xs sm:text-sm font-medium text-text-secondary">Jenjang Pendidikan</label>
                <div className="relative">
                  <input type="hidden" {...register("jenjangPendidikan")} />
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full flex items-center justify-between bg-surface-0 border ${errors.jenjangPendidikan ? "border-red-500" : "border-border-base hover:border-border-strong"} text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all cursor-pointer font-medium text-left text-xs sm:text-sm`}
                  >
                    <span>{watch("jenjangPendidikan") === "sekolah" ? "Siswa (Sekolah)" : "Mahasiswa (Kuliah)"}</span>
                    <ChevronDown className={`w-5 h-5 text-text-muted transition-transform duration-200 ${isDropdownOpen ? "rotate-180 text-brand" : ""}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-surface-0 border border-border-base rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setValue("jenjangPendidikan", "kuliah", { shouldValidate: true });
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-xs sm:text-sm transition-colors ${watch("jenjangPendidikan") === "kuliah" ? "bg-brand/10 text-brand font-semibold" : "text-text-secondary hover:bg-surface-1 hover:text-text-primary"}`}
                        >
                          Mahasiswa (Kuliah)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setValue("jenjangPendidikan", "sekolah", { shouldValidate: true });
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-xs sm:text-sm transition-colors ${watch("jenjangPendidikan") === "sekolah" ? "bg-brand/10 text-brand font-semibold" : "text-text-secondary hover:bg-surface-1 hover:text-text-primary"}`}
                        >
                          Siswa (Sekolah)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {errors.jenjangPendidikan && <p className="text-red-500 text-xs font-bold mt-1">{errors.jenjangPendidikan.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-text-secondary">{watch("jenjangPendidikan") === "sekolah" ? "NISN" : "NIM"}</label>
                <input
                  {...register("nimNisn")}
                  className={`w-full bg-surface-0 border ${errors.nimNisn ? "border-red-500" : "border-border-base"} text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all text-xs sm:text-sm`}
                  placeholder={watch("jenjangPendidikan") === "sekolah" ? "Nomor Induk Siswa Nasional" : "Nomor Induk Mahasiswa"}
                />
                {errors.nimNisn && <p className="text-red-500 text-xs font-bold mt-1">{errors.nimNisn.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-text-secondary">Institusi Pendidikan</label>
                <InputAutocomplete
                  value={watch("institusi") || ""}
                  onChange={(val) => setValue("institusi", val, { shouldValidate: true })}
                  fetchSuggestions={async (q) => {
                    const res = await getInstitusiSuggestions(q);
                    return res.data || [];
                  }}
                  placeholder="Nama Universitas / Sekolah"
                  error={errors.institusi?.message}
                />
                {errors.institusi && <p className="text-red-500 text-xs font-bold mt-1">{errors.institusi.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-text-secondary">Program Studi</label>
                <InputAutocomplete
                  value={watch("prodi") || ""}
                  onChange={(val) => setValue("prodi", val, { shouldValidate: true })}
                  fetchSuggestions={async (q) => {
                    const currentInst = watch("institusi");
                    const res = await getProdiSuggestions(q, currentInst);
                    return res.data || [];
                  }}
                  placeholder="Teknik Informatika, dst"
                  error={errors.prodi?.message}
                />
                {errors.prodi && <p className="text-red-500 text-xs font-bold mt-1">{errors.prodi.message}</p>}
              </div>
            </div>
          </section>

          <div className="space-y-6 flex flex-col justify-between">
            <section className="bg-surface-1 border border-border-base rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm space-y-4 flex-1">
              <h3 className="text-base sm:text-lg font-bold text-text-primary mb-5 sm:mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand shrink-0" />
                Curriculum Vitae (CV)
              </h3>

              <div className="space-y-2">
                {selectedCv || existingCvUrl ? (
                  <div
                    className="relative p-4 bg-surface-0 border border-border-base hover:border-border-strong rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-colors group/file"
                    onClick={() => {
                      if (existingCvUrl && !selectedCv) {
                        setPreviewFile({ url: existingCvUrl, title: "CV Saya" });
                      } else if (selectedCv) {
                        const objUrl = URL.createObjectURL(selectedCv);
                        setPreviewFile({ url: objUrl, title: selectedCv.name });
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand border border-orange-500/20 shrink-0 group-hover/file:bg-orange-500 group-hover/file:text-text-primary transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-text-primary truncate">
                          {selectedCv ? selectedCv.name : (existingCvUrl || "").split("/").pop() || "Curriculum_Vitae.pdf"}
                        </p>
                        <p className="text-[10px] text-text-secondary mt-0.5">{selectedCv ? `${(selectedCv.size / (1024 * 1024)).toFixed(2)} MB` : "File PDF"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearCv();
                        }}
                        className="p-1.5 text-red-500 hover:text-text-primary hover:bg-red-600/20 bg-surface-1 border border-border-base hover:border-red-500/30 rounded-lg transition-all duration-300 cursor-pointer active:scale-95"
                        title="Hapus Berkas"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center group transition-all duration-300 ${
                      errors.cv ? "border-red-500/50 bg-red-500/5" : "border-border-base bg-surface-0 hover:border-orange-500/50"
                    }`}
                  >
                    <input {...register("cv")} type="file" accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4 transition-colors bg-surface-1 text-text-secondary group-hover:text-brand">
                      <CloudUpload className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-text-primary text-xs sm:text-sm">Klik atau drop file di sini</p>
                    <p className="text-text-secondary text-xs mt-1">Hanya file PDF, maksimal 5MB</p>
                  </div>
                )}
                {errors.cv && <p className="text-red-500 text-xs font-bold mt-1 text-center">{errors.cv.message as string}</p>}
              </div>
            </section>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {onboardingStatus === "selesai" && (
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/peserta")}
                  className="w-full sm:flex-1 bg-surface-1 hover:bg-surface-2 text-text-primary font-bold py-3.5 sm:py-4 rounded-xl transition-all border border-border-base cursor-pointer text-xs sm:text-sm"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`font-bold py-3.5 sm:py-4 rounded-xl transition-all shadow-sm shadow-orange-950/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm ${
                  onboardingStatus === "selesai" ? "w-full sm:flex-[2] bg-brand hover:bg-brand/90 text-text-primary" : "w-full bg-brand hover:bg-brand/90 text-text-primary"
                }`}
              >
                {isSubmitting ? (
                  "Menyimpan..."
                ) : (
                  <>
                    Simpan & Lanjutkan
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
      <ModalPratinjauBerkas isOpen={previewFile !== null} onClose={() => setPreviewFile(null)} fileUrl={previewFile?.url || null} title={previewFile?.title} />
    </div>
  );
};

export default DataPribadi;
