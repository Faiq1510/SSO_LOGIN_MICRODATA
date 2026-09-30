import React, { useEffect, useState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../../../components/ProviderNotifikasi";
import { apiRequest, getLocalUser } from "../../../../utils/api";
import { getPendaftaranSaya } from "../../../../services/pendaftaran.service";
import { uploadFile } from "../../../../services/penilaian.service";
import ModalPratinjauBerkas from "../../../../components/ModalPratinjauBerkas";
import { getLocalDateString } from "../../../../utils/date";
import { AlertTriangle, Check, FileText, CloudUpload, ChevronDown, Layers, Trash } from "lucide-react";

const MAX_SURAT_SIZE = 10 * 1024 * 1024;
const ALLOWED_SURAT_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const getFirstFile = (files: unknown) => (files instanceof FileList ? files.item(0) : null);

interface User {
  id: string;
  name: string;
  email: string;
  institusi?: string | null;
  program_studi?: string | null;
}

interface Member {
  user_id: string;
  email: string;
  nama_lengkap: string | null;
  nim_nisn: string | null;
  institusi: string | null;
  program_studi: string | null;
}

const submissionBaseSchema = z
  .object({
    tipePendaftaran: z.enum(["Individu", "Kelompok"]),
    tanggalMasuk: z.string().min(1, "Tanggal masuk wajib diisi"),
    tanggalKeluar: z.string().min(1, "Tanggal keluar wajib diisi"),
    namaPenerbitSurat: z.string().min(1, "Nama/Jabatan penerbit surat wajib diisi"),
    nomorSuratPengantar: z.string().min(1, "Nomor surat wajib diisi"),
    tanggalSuratPengantar: z.string().min(1, "Tanggal surat wajib diisi"),
    perihalSurat: z.string().min(1, "Perihal surat wajib diisi"),
    suratPengantar: z
      .any()
      .refine((files) => {
        const file = getFirstFile(files);
        if (!file) return true;
        return ALLOWED_SURAT_TYPES.includes(file.type);
      }, "Surat pengantar harus PDF, JPG, atau PNG")
      .refine((files) => {
        const file = getFirstFile(files);
        if (!file) return true;
        return file.size <= MAX_SURAT_SIZE;
      }, "Ukuran surat pengantar maksimal 10MB")
      .optional(),
    anggotaKelompok: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
        })
      )
      .optional(),
  })
  .refine((data) => data.tanggalMasuk >= getLocalDateString(), {
    message: "Tanggal masuk tidak boleh di masa lalu",
    path: ["tanggalMasuk"],
  })
  .refine((data) => data.tanggalMasuk < data.tanggalKeluar, {
    message: "Tanggal keluar harus setelah tanggal masuk",
    path: ["tanggalKeluar"],
  })
  .refine(
    (data) => {
      if (data.tipePendaftaran === "Individu") return true;
      const currentUser = getLocalUser();
      if (!currentUser) return (data.anggotaKelompok?.length ?? 0) > 0;
      const otherMembers = (data.anggotaKelompok || []).filter((m) => m.id !== currentUser.id);
      return otherMembers.length > 0;
    },
    {
      message: "Tambahkan minimal 1 anggota kelompok yang sudah terdaftar",
      path: ["anggotaKelompok"],
    }
  );

type SubmissionValues = z.infer<typeof submissionBaseSchema>;

const PengisianDokumen: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [tipe, setTipe] = useState<"Individu" | "Kelompok">("Individu");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedMembers, setAddedMembers] = useState<User[]>([]);
  const [existingSuratUrl, setExistingSuratUrl] = useState<string | null>(null);
  const [initialSuratUrl, setInitialSuratUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionsTipe = ["Individu", "Kelompok"];

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

  interface QuotaInfo {
    peserta_aktif: number;
    kapasitas_maks: number;
    tersedia: boolean;
  }

  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [checkingQuota, setCheckingQuota] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);

  const submissionSchema = useMemo(() => {
    return submissionBaseSchema.refine(
      (data) => {
        if (!existingSuratUrl && (!data.suratPengantar || data.suratPengantar.length === 0)) return false;
        return true;
      },
      {
        message: "Surat pengantar wajib diunggah",
        path: ["suratPengantar"],
      }
    );
  }, [existingSuratUrl]);

  const resolver = useMemo(() => zodResolver(submissionSchema), [submissionSchema]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubmissionValues>({
    resolver,
    defaultValues: {
      tipePendaftaran: "Individu",
      anggotaKelompok: [],
      namaPenerbitSurat: "",
      nomorSuratPengantar: "",
      tanggalSuratPengantar: "",
      perihalSurat: "Surat Permohonan Kerja Praktik",
    },
  });

  const suratValue = watch("suratPengantar");
  const selectedSurat = getFirstFile(suratValue);

  const tMasuk = watch("tanggalMasuk");
  const tKeluar = watch("tanggalKeluar");

  useEffect(() => {
    if (!tMasuk || !tKeluar) {
      setQuotaInfo(null);
      setQuotaError(null);
      return;
    }

    const dateMasuk = new Date(tMasuk);
    const dateKeluar = new Date(tKeluar);

    if (dateKeluar <= dateMasuk) {
      setQuotaInfo(null);
      setQuotaError(null);
      return;
    }

    let active = true;
    const checkAvailability = async () => {
      setCheckingQuota(true);
      setQuotaError(null);
      try {
        const res = await apiRequest(`/pendaftaran/cek-kuota?tanggalMasuk=${tMasuk}&tanggalKeluar=${tKeluar}`);
        if (res.status === "success" && res.data && active) {
          setQuotaInfo(res.data);
        }
      } catch (err) {
        console.error("Gagal mengecek kuota:", err);
        if (active) setQuotaError("Gagal memeriksa ketersediaan kuota slot.");
      } finally {
        if (active) setCheckingQuota(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      checkAvailability();
    }, 500);

    return () => {
      active = false;
      clearTimeout(debounceTimer);
    };
  }, [tMasuk, tKeluar]);

  useEffect(() => {
    const loadSubmission = async () => {
      try {
        const res = await getPendaftaranSaya();
        if (res.status === "success" && res.data) {
          const subData = res.data;

          if (subData.status === "aktif") {
            showError("Anda tidak dapat mengubah data karena status pendaftaran Anda sudah aktif.");
            navigate("/dashboard/peserta");
            return;
          }

          if (subData.status !== "selesai") {
            const formatToInputDate = (dStr: string) => {
              if (!dStr) return "";
              return getLocalDateString(dStr);
            };

            const mappedMembers = (subData.anggota || []).map((m: Member) => ({
              id: m.user_id,
              name: m.nama_lengkap || "",
              email: m.email,
            }));

            const isKelompok = subData.jenis_kelompok === "kelompok" || (subData.anggota && subData.anggota.length > 1);
            const tipeVal = isKelompok ? "Kelompok" : "Individu";

            setTipe(tipeVal);
            const initialMembers = tipeVal === "Kelompok" ? mappedMembers : [];
            setAddedMembers(initialMembers);
            setExistingSuratUrl(subData.surat_pengantar_url);
            setInitialSuratUrl(subData.surat_pengantar_url);

            reset({
              tipePendaftaran: tipeVal,
              tanggalMasuk: formatToInputDate(subData.tanggal_masuk),
              tanggalKeluar: formatToInputDate(subData.tanggal_keluar),
              anggotaKelompok: initialMembers,
              namaPenerbitSurat: subData.nama_penerbit_surat || "",
              nomorSuratPengantar: subData.nomor_surat_pengantar || "",
              tanggalSuratPengantar: formatToInputDate(subData.tanggal_surat_pengantar),
              perihalSurat: subData.perihal_surat || "Surat Permohonan Kerja Praktik",
            });
          }
        }
      } catch (err) {
        console.error("Gagal mengambil data pendaftaran lama:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSubmission();
  }, [reset, navigate, showError]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await apiRequest(`/users?search=${query}`);
      if (res.status === "success" && res.data) {
        const currentUser = getLocalUser();
        const filtered = res.data.filter((u: User) => u.id !== currentUser?.id);
        setSearchResults(filtered);
      }
    } catch (err) {
      console.error("Gagal melakukan pencarian anggota kelompok:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const addMember = (user: User) => {
    if (addedMembers.find((m) => m.id === user.id)) return;
    const newMembers = [...addedMembers, user];
    setAddedMembers(newMembers);
    setValue("anggotaKelompok", newMembers);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeMember = (userId: string) => {
    const currentUser = getLocalUser();
    if (currentUser && userId === currentUser.id) {
      handleTypeChange("Individu");
      return;
    }
    const newMembers = addedMembers.filter((m) => m.id !== userId);
    setAddedMembers(newMembers);
    setValue("anggotaKelompok", newMembers);
  };

  const handleTypeChange = (value: "Individu" | "Kelompok") => {
    setTipe(value);
    setValue("tipePendaftaran", value, { shouldValidate: true });
    if (value === "Individu") {
      setAddedMembers([]);
      setValue("anggotaKelompok", []);
      setSearchQuery("");
      setSearchResults([]);
    } else {
      const currentUser = getLocalUser();
      if (currentUser) {
        const userMember: User = {
          id: currentUser.id,
          name: currentUser.name || "Tanpa Nama",
          email: currentUser.email,
        };
        if (!addedMembers.some((m) => m.id === userMember.id)) {
          const newMembers = [userMember, ...addedMembers];
          setAddedMembers(newMembers);
          setValue("anggotaKelompok", newMembers);
        }
      }
    }
  };

  const handleClearSurat = () => {
    setValue("suratPengantar", undefined);
    setExistingSuratUrl(null);
  };

  const onSubmit = async (data: SubmissionValues) => {
    const currentUser = getLocalUser();
    const otherMembers = (data.anggotaKelompok || []).filter((m) => m.id !== currentUser?.id);
    const totalMembers = 1 + (data.tipePendaftaran === "Kelompok" ? otherMembers.length : 0);
    if (quotaInfo) {
      const available = quotaInfo.kapasitas_maks - quotaInfo.peserta_aktif;
      if (totalMembers > available) {
        showError(`Gagal mengirim pengajuan. Kapasitas kuota penuh untuk periode tersebut. Slot tersedia: ${available > 0 ? available : 0} orang.`);
        return;
      }
    }

    try {
      let suratPengantarUrl = existingSuratUrl;
      const file = getFirstFile(data.suratPengantar);

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await uploadFile(formData);
        suratPengantarUrl = uploadRes.data.url;
      }

      if (!suratPengantarUrl) {
        throw new Error("Surat pengantar wajib diunggah.");
      }

      if (initialSuratUrl && suratPengantarUrl !== initialSuratUrl) {
        try {
          await apiRequest("/upload", {
            method: "DELETE",
            body: JSON.stringify({ url: initialSuratUrl }),
          });
        } catch (err) {
          console.error("Gagal menghapus berkas surat pengantar lama:", err);
        }
      }

      await apiRequest("/pendaftaran", {
        method: "POST",
        body: JSON.stringify({
          tipePendaftaran: data.tipePendaftaran,
          tanggalMasuk: data.tanggalMasuk,
          tanggalKeluar: data.tanggalKeluar,
          nama_penerbit_surat: data.namaPenerbitSurat,
          nomor_surat_pengantar: data.nomorSuratPengantar,
          tanggal_surat_pengantar: data.tanggalSuratPengantar,
          perihal_surat: data.perihalSurat,
          suratPengantarUrl,
          anggotaKelompok: otherMembers,
        }),
      });

      showSuccess("Pendaftaran berhasil disubmit! Menunggu verifikasi admin.");
      navigate("/dashboard/peserta");
    } catch (err) {
      const error = err as Error;
      showError(error.message || "Gagal menyimpan pengajuan PKL.");
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
          2
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">Tahap 2: Pengajuan PKL</h1>
          <p className="text-xs sm:text-sm text-text-secondary">Tentukan tipe pendaftaran, periode pelaksanaan, dan lengkapi berkas surat pengantar.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <section className="bg-surface-1 border border-border-base rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm space-y-6">
            <h3 className="text-base sm:text-lg font-bold text-text-primary mb-5 sm:mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand shrink-0" />
              Detail Pengajuan
            </h3>

            <div className="space-y-2" ref={dropdownRef}>
              <label className="text-xs sm:text-sm font-medium text-text-secondary">Tipe Pendaftaran</label>
              <div className="relative">
                <input type="hidden" {...register("tipePendaftaran")} />
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full flex items-center justify-between bg-surface-0 border ${errors.tipePendaftaran ? "border-red-500" : "border-border-base hover:border-border-strong"} text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all cursor-pointer font-medium text-left text-xs sm:text-sm`}
                >
                  <span>{tipe}</span>
                  <ChevronDown className={`w-5 h-5 text-text-muted transition-transform duration-200 ${isDropdownOpen ? "rotate-180 text-brand" : ""}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-surface-0 border border-border-base rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-1">
                      {optionsTipe.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            handleTypeChange(option as "Individu" | "Kelompok");
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-xs sm:text-sm transition-colors ${tipe === option ? "bg-brand/10 text-brand font-semibold" : "text-text-secondary hover:bg-surface-1 hover:text-text-primary"}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {errors.tipePendaftaran && <p className="text-red-500 text-xs mt-1">{errors.tipePendaftaran.message}</p>}
            </div>

            {tipe === "Kelompok" && (
              <div className="bg-surface-0 border border-border-base rounded-2xl p-4 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div>
                  <h4 className="text-text-primary font-bold mb-1 text-xs sm:text-sm uppercase tracking-wider">Anggota Kelompok</h4>
                  <p className="text-text-muted text-xs sm:text-sm">Pastikan anggota kelompok Anda sudah terdaftar di sistem Microintern.</p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <input
                      className="w-full bg-surface-1 border border-border-base text-text-primary px-4 py-3 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-orange-600 outline-none transition-all"
                      placeholder="Cari Nama atau Email Anggota..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                    {isSearching && (
                      <div className="absolute right-4 top-3">
                        <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-surface-1 border border-border-base rounded-xl shadow-sm overflow-hidden">
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => addMember(user)}
                            className="w-full text-left px-4 py-3 hover:bg-surface-2 border-b border-border-base last:border-0 transition-colors"
                          >
                            <p className="text-text-primary text-xs sm:text-sm font-medium">{user.name || "Tanpa Nama"}</p>
                            <p className="text-text-muted text-xs">{user.email}</p>
                            {(user.institusi || user.program_studi) && (
                              <p className="text-text-muted text-xs mt-0.5">{[user.program_studi, user.institusi].filter(Boolean).join(" - ")}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {addedMembers.length > 0 && (
                    <div className="overflow-x-auto border border-border-base rounded-xl">
                      <table className="w-full text-left border-collapse min-w-max">
                        <thead className="bg-surface-1">
                          <tr>
                            <th className="px-4 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Nama</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Email</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {addedMembers.map((member) => (
                            <tr key={member.id} className="hover:bg-surface-1 transition-colors">
                              <td className="px-4 py-3 text-xs sm:text-sm text-text-primary whitespace-nowrap">{member.name || "Tanpa Nama"}</td>
                              <td className="px-4 py-3 text-xs sm:text-sm text-text-secondary whitespace-nowrap">{member.email}</td>
                              <td className="px-4 py-3 text-xs sm:text-sm text-right whitespace-nowrap">
                                <button type="button" onClick={() => removeMember(member.id)} className="text-red-500 hover:text-red-400 font-medium">
                                  Hapus
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {errors.anggotaKelompok && <p className="text-red-500 text-xs">{errors.anggotaKelompok.message as string}</p>}
                </div>
              </div>
            )}

            <div className="bg-surface-0 border border-border-base rounded-2xl p-4 sm:p-5 space-y-6">
              <div>
                <h4 className="text-text-primary font-bold mb-1 text-xs sm:text-sm uppercase tracking-wider">Detail Surat Pengantar Institusi</h4>
                <p className="text-text-muted text-xs sm:text-sm">Informasi ini akan digunakan untuk meng-generate surat balasan otomatis.</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-text-secondary">Penerbit Surat (Contoh: Ka. Dekan Fakultas TI)</label>
                  <input
                    {...register("namaPenerbitSurat")}
                    placeholder="Nama / Jabatan Penerbit"
                    className={`w-full bg-surface-1 border ${errors.namaPenerbitSurat ? "border-red-500" : "border-border-base"} text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all text-xs sm:text-sm`}
                  />
                  {errors.namaPenerbitSurat && <p className="text-red-500 text-xs mt-1">{errors.namaPenerbitSurat.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-text-secondary">Nomor Surat Pengantar</label>
                  <input
                    {...register("nomorSuratPengantar")}
                    placeholder="Contoh: 123/UN1/FT/2026"
                    className={`w-full bg-surface-1 border ${errors.nomorSuratPengantar ? "border-red-500" : "border-border-base"} text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all text-xs sm:text-sm`}
                  />
                  {errors.nomorSuratPengantar && <p className="text-red-500 text-xs mt-1">{errors.nomorSuratPengantar.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-text-secondary">Tanggal Surat Diterbitkan</label>
                  <input
                    {...register("tanggalSuratPengantar")}
                    type="date"
                    className={`w-full bg-surface-1 border ${errors.tanggalSuratPengantar ? "border-red-500" : "border-border-base"} text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all text-xs sm:text-sm`}
                  />
                  {errors.tanggalSuratPengantar && <p className="text-red-500 text-xs mt-1">{errors.tanggalSuratPengantar.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-text-secondary">Perihal Surat</label>
                  <input
                    {...register("perihalSurat")}
                    placeholder="Contoh: Permohonan Kerja Praktik"
                    className={`w-full bg-surface-1 border ${errors.perihalSurat ? "border-red-500" : "border-border-base"} text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all text-xs sm:text-sm`}
                  />
                  {errors.perihalSurat && <p className="text-red-500 text-xs mt-1">{errors.perihalSurat.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-text-secondary">Tanggal Masuk</label>
                  <div className="relative">
                    <input
                      {...register("tanggalMasuk")}
                      type="date"
                      className={`w-full bg-surface-1 border ${errors.tanggalMasuk ? "border-red-500" : "border-border-base"} text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all text-xs sm:text-sm`}
                    />
                  </div>
                  {errors.tanggalMasuk && <p className="text-red-500 text-xs mt-1">{errors.tanggalMasuk.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-text-secondary">Tanggal Keluar</label>
                  <div className="relative">
                    <input
                      {...register("tanggalKeluar")}
                      type="date"
                      className={`w-full bg-surface-1 border ${errors.tanggalKeluar ? "border-red-500" : "border-border-base"} text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all text-xs sm:text-sm`}
                    />
                  </div>
                  {errors.tanggalKeluar && <p className="text-red-500 text-xs mt-1">{errors.tanggalKeluar.message}</p>}
                </div>
              </div>
            </div>
          </section>

          <div className="space-y-6 flex flex-col justify-between">
            <section className="bg-surface-1 border border-border-base rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm space-y-4 flex-1">
              <h3 className="text-base sm:text-lg font-bold text-text-primary mb-5 sm:mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand shrink-0" />
                Surat Pengantar Kampus/Sekolah
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  {selectedSurat || existingSuratUrl ? (
                    <div
                      className="relative p-4 bg-surface-0 border border-border-base hover:border-border-strong rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-colors group/file"
                      onClick={() => {
                        if (existingSuratUrl && !selectedSurat) {
                          setPreviewFile({ url: existingSuratUrl, title: "Surat Pengantar" });
                        } else if (selectedSurat) {
                          const objUrl = URL.createObjectURL(selectedSurat);
                          setPreviewFile({ url: objUrl, title: selectedSurat.name });
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand border border-orange-500/20 shrink-0 group-hover/file:bg-orange-500 group-hover/file:text-text-primary transition-colors">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-text-primary truncate">
                            {selectedSurat ? selectedSurat.name : (existingSuratUrl || "").split("/").pop() || "Surat_Pengantar.pdf"}
                          </p>
                          <p className="text-[10px] text-text-secondary mt-0.5">{selectedSurat ? `${(selectedSurat.size / (1024 * 1024)).toFixed(2)} MB` : "File PDF"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearSurat();
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
                        errors.suratPengantar ? "border-red-500/50 bg-red-500/5" : "border-border-base bg-surface-0 hover:border-orange-500/50"
                      }`}
                    >
                      <input {...register("suratPengantar")} type="file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4 transition-colors bg-surface-1 text-text-secondary group-hover:text-brand">
                        <CloudUpload className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-text-primary text-xs sm:text-sm">Klik atau drop file di sini</p>
                      <p className="text-text-secondary text-xs mt-1">PDF atau Gambar (JPG/PNG), maksimal 10MB</p>
                    </div>
                  )}
                  {errors.suratPengantar && <p className="text-red-500 text-xs mt-1 text-center">{errors.suratPengantar.message as string}</p>}
                </div>

                {(checkingQuota || quotaInfo || quotaError) && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    {checkingQuota && (
                      <div className="p-4 bg-surface-0 border border-border-base rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-text-secondary">
                        <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin shrink-0"></div>
                        <span>Memeriksa ketersediaan kuota slot...</span>
                      </div>
                    )}

                    {quotaError && !checkingQuota && (
                      <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-red-400">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <span>{quotaError}</span>
                      </div>
                    )}

                    {quotaInfo &&
                      !checkingQuota &&
                      !quotaError &&
                      (() => {
                        const currentUser = getLocalUser();
                        const otherMembers = addedMembers.filter((m) => m.id !== currentUser?.id);
                        const totalMembers = 1 + (tipe === "Kelompok" ? otherMembers.length : 0);
                        const availableSlots = quotaInfo.kapasitas_maks - quotaInfo.peserta_aktif;
                        const isSufficient = availableSlots >= totalMembers;

                        if (isSufficient) {
                          return (
                            <div className="p-4 sm:p-5 bg-emerald-950/10 border border-emerald-500/20 rounded-2xl flex gap-3 sm:gap-4 text-emerald-400 animate-in zoom-in-95 duration-200">
                              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shrink-0">
                                <Check className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="font-bold text-text-primary text-xs sm:text-sm">Slot Tersedia</h5>
                                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                                  Terdapat <span className="text-emerald-400 font-semibold font-mono-data">{availableSlots} slot</span> tersisa dari kapasitas maksimal{" "}
                                  <span className="text-text-secondary font-semibold font-mono-data">{quotaInfo.kapasitas_maks} peserta</span>.
                                </p>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="p-4 sm:p-5 bg-red-950/10 border border-red-500/20 rounded-2xl flex gap-3 sm:gap-4 text-red-400 animate-in zoom-in-95 duration-200">
                              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="font-bold text-text-primary text-xs sm:text-sm">Kapasitas Kuota Penuh</h5>
                                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                                  Slot tersedia hanya <span className="text-red-400 font-semibold font-mono-data">{availableSlots > 0 ? availableSlots : 0} orang</span>, kelompok
                                  Anda beranggotakan <span className="text-text-secondary font-semibold font-mono-data">{totalMembers} orang</span>.
                                </p>
                              </div>
                            </div>
                          );
                        }
                      })()}
                  </div>
                )}
              </div>
            </section>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard/peserta/onboarding/data-pribadi")}
                className="w-full sm:flex-1 bg-surface-1 hover:bg-surface-2 text-text-primary font-bold py-3.5 sm:py-4 rounded-xl transition-all border border-border-base cursor-pointer text-xs sm:text-sm"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  checkingQuota ||
                  (quotaInfo !== null &&
                    (() => {
                      const currentUser = getLocalUser();
                      const otherMembers = addedMembers.filter((m) => m.id !== currentUser?.id);
                      return quotaInfo.kapasitas_maks - quotaInfo.peserta_aktif < 1 + (tipe === "Kelompok" ? otherMembers.length : 0);
                    })())
                }
                className="w-full sm:flex-[2] bg-brand hover:bg-brand/90 text-text-primary font-bold py-3.5 sm:py-4 rounded-xl transition-all shadow-sm shadow-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm"
              >
                {isSubmitting
                  ? "Mengirim..."
                  : quotaInfo !== null && quotaInfo.kapasitas_maks - quotaInfo.peserta_aktif < 1 + (tipe === "Kelompok" ? addedMembers.length : 0)
                    ? "Kuota Tidak Cukup"
                    : "Submit Pendaftaran Final"}
              </button>
            </div>
          </div>
        </div>
      </form>
      <ModalPratinjauBerkas isOpen={previewFile !== null} onClose={() => setPreviewFile(null)} fileUrl={previewFile?.url || null} title={previewFile?.title} />
    </div>
  );
};

export default PengisianDokumen;
