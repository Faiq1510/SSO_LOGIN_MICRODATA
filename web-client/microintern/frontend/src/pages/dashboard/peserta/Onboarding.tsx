import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getProfil } from "../../../services/profil.service";
import { getPendaftaranSaya, pesertaCancelPendaftaran } from "../../../services/pendaftaran.service";
import { useNotification } from "../../../components/ProviderNotifikasi";
import { type User, getLocalUser, setLocalUser } from "../../../utils/api";
import ModalPratinjauBerkas from "../../../components/ModalPratinjauBerkas";
import { ArrowRight, Check, Lock, Eye, Pencil, Trash2, Clock, XCircle, Award, RefreshCw, History, FileText } from "lucide-react";
import PklLifecycleRail from "../../../components/PklLifecycleRail";

interface Member {
  user_id: string;
  email: string;
  nama_lengkap: string | null;
  nim_nisn: string | null;
  institusi: string | null;
  program_studi: string | null;
}

interface SubmissionData {
  id: string;
  kelompok_id: string;
  tanggal_masuk: string;
  tanggal_keluar: string;
  surat_pengantar_url: string;
  status: "menunggu" | "aktif" | "selesai" | "ditolak";
  alasan_tolak: string | null;
  surat_balasan_url?: string | null;
  catatan?: string | null;
  jenis_kelompok?: "individu" | "kelompok";
  anggota: Member[];
}

interface ProfileData {
  id: string;
  email: string;
  role: "peserta" | "admin";
  name: string;
  isGoogleConnected: boolean;
  hasPassword: boolean;
  profile: {
    nama_lengkap: string;
    nim_nisn: string;
    institusi: string;
    program_studi: string;
    cv_url: string | null;
    onboarding_status: "belum_mulai" | "step_1_selesai" | "selesai";
  } | null;
}

const Onboarding: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string } | null>(null);

  const [user, setUser] = useState<User | null>(() => getLocalUser());
  const userName = user?.name || user?.email || "Peserta";
  const firstName = userName.split(" ")[0];

  useEffect(() => {
    const handleUserUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<User>;
      if (customEvent.detail) {
        setUser(customEvent.detail);
      } else {
        setUser(getLocalUser());
      }
    };
    window.addEventListener("user-updated", handleUserUpdate);
    return () => window.removeEventListener("user-updated", handleUserUpdate);
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const [profileRes, subRes] = await Promise.all([getProfil(), getPendaftaranSaya()]);
      if (profileRes.status === "success" && profileRes.data) {
        setProfile(profileRes.data);
        const currentUser = getLocalUser();
        if (currentUser) {
          setLocalUser({
            ...currentUser,
            name: profileRes.data.name || currentUser.name,
            jenjang_pendidikan: profileRes.data.profile?.jenjang_pendidikan || currentUser.jenjang_pendidikan,
          });
        }
      }
      if (subRes.status === "success" && subRes.data) {
        setSubmission(subRes.data);
      } else {
        setSubmission(null);
      }
    } catch (err) {
      console.error("Gagal memuat status onboarding:", err);
      showError("Gagal memuat status onboarding.");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  const handleCancelSubmission = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menarik pengajuan ini? Anda akan kembali ke langkah pengisian data.")) return;
    setIsCanceling(true);
    try {
      await pesertaCancelPendaftaran();
      showSuccess("Pengajuan berhasil ditarik.");
      await fetchStatus();
    } catch (err) {
      const error = err as Error;
      showError(error.message || "Gagal menarik pengajuan.");
    } finally {
      setIsCanceling(false);
    }
  };

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pesan = params.get("pesan");
    if (pesan) {
      showError(pesan);
      navigate("/dashboard/peserta", { replace: true });
    }
  }, [location.search, showError, navigate]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const pklProgress = useMemo(() => {
    if (!submission || submission.status !== "aktif") return null;
    const start = new Date(submission.tanggal_masuk).getTime();
    const end = new Date(submission.tanggal_keluar).getTime();
    const now = new Date().getTime();

    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    let currentDays = Math.ceil((now - start) / (1000 * 60 * 60 * 24));

    if (currentDays < 0) currentDays = 0;
    if (currentDays > totalDays) currentDays = totalDays;

    return {
      current: currentDays,
      total: totalDays,
      percent: Math.min(100, Math.max(0, (currentDays / totalDays) * 100)),
    };
  }, [submission]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  const onboardingStatus = profile?.profile?.onboarding_status || "belum_mulai";

  if (onboardingStatus === "belum_mulai" || onboardingStatus === "step_1_selesai") {
    const isStep1Done = onboardingStatus === "step_1_selesai";

    return (
      <div className="space-y-10 animate-fade-up max-w-3xl mx-auto pt-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-text-primary tracking-tight font-display">Halo, {firstName}.</h1>
          <p className="text-text-secondary text-sm">Selesaikan dua langkah berikut untuk {isStep1Done ? "mengajukan" : "mulai"} PKL.</p>
        </div>

        <div className="bg-surface-1 border border-border-base rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm">
          <PklLifecycleRail variant="onboarding" stage="belum_daftar" />
          <p className="text-center text-xs text-text-secondary mt-2">Selesaikan pendaftaran untuk mengaktifkan status PKL Anda.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div
            className={`relative bg-surface-1 border rounded-xl overflow-hidden flex flex-col transition-all ${isStep1Done ? "border-border-base" : "border-brand/50 ring-1 ring-brand/50 shadow-lg shadow-brand/10"}`}
          >
            <div className="p-5 sm:p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Langkah 1</span>
                {isStep1Done && (
                  <div className="w-6 h-6 rounded-full bg-status-active/20 text-status-active flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-text-primary mb-2">Data Diri & CV</h3>
              <p className="text-xs sm:text-sm text-text-secondary mb-6 leading-relaxed">
                {isStep1Done ? "Identitas dan berkas pribadi Anda sudah disimpan." : "Lengkapi profil Anda dan unggah Curriculum Vitae."}
              </p>

              <div className="mt-auto">
                <Link
                  to="/dashboard/peserta/onboarding/data-pribadi"
                  className={`inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-4 py-2 rounded-lg transition-colors w-max ${
                    isStep1Done ? "bg-surface-2 text-text-primary hover:bg-surface-3" : "bg-brand text-white hover:bg-brand/90"
                  }`}
                >
                  {isStep1Done ? "Edit Data" : "Mulai"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          <div
            className={`relative bg-surface-1 border rounded-xl overflow-hidden flex flex-col transition-all ${isStep1Done ? "border-brand/50 ring-1 ring-brand/50 shadow-lg shadow-brand/10" : "border-border-subtle opacity-70"}`}
          >
            <div className="p-5 sm:p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Langkah 2</span>
                {!isStep1Done && <Lock className="w-4 h-4 text-text-muted" />}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-text-primary mb-2">Pengajuan PKL</h3>
              <p className="text-xs sm:text-sm text-text-secondary mb-6 leading-relaxed">
                Pilih jadwal, unggah surat pengantar kampus, dan tentukan apakah Anda berkelompok atau individu.
              </p>

              <div className="mt-auto">
                {isStep1Done ? (
                  <Link
                    to="/dashboard/peserta/onboarding/pengisian-dokumen"
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand/90 transition-colors w-max"
                  >
                    Selesaikan
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold bg-surface-2 text-text-muted px-4 py-2 rounded-lg cursor-not-allowed w-max"
                  >
                    Terkunci
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submission) {
    const isMenunggu = submission.status === "menunggu";
    const isAktif = submission.status === "aktif";
    const isDitolak = submission.status === "ditolak";
    const isSelesai = submission.status === "selesai";
    const cvUrl = profile?.profile?.cv_url;

    return (
      <div className="space-y-8 animate-fade-up max-w-4xl mx-auto pt-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight mb-2">Status PKL</h1>
          <p className="text-text-secondary text-sm font-medium italic">Pantau status pendaftaran dan pelaksanaan PKL Anda.</p>
        </div>

        <div className="bg-surface-1 border border-border-base rounded-2xl p-6 sm:p-8 shadow-sm">
          <PklLifecycleRail variant="onboarding" stage={submission.status} />
          <p className="text-center text-xs text-text-secondary mt-2 pt-3">
            {isMenunggu && "Pengajuan PKL Anda sedang diproses oleh HRD."}
            {isAktif && "Status PKL Anda aktif. Silakan lakukan presensi harian."}
            {isDitolak && "Pengajuan PKL Anda ditolak. Silakan perbaiki data diri Anda."}
            {isSelesai && "Selamat! Anda telah menyelesaikan seluruh masa pelaksanaan PKL."}
          </p>
        </div>

        {isAktif ? (
          <div className="bg-surface-1 border border-border-base rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[320px] relative overflow-hidden shadow-lg shadow-brand/5">
            <div className="absolute top-0 left-0 w-full h-1 bg-surface-2">
              <div className="h-full bg-brand transition-all duration-1000" style={{ width: `${pklProgress?.percent || 0}%` }} />
            </div>

            <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-6">PKL Sedang Berjalan</h2>

            <div className="flex flex-col items-center gap-1 mb-8">
              <span className="text-sm font-medium text-text-secondary mb-2">Hari ke-</span>
              <div className="flex items-baseline gap-2 font-display tabular-nums">
                <span className="text-7xl font-bold text-text-primary leading-none">{pklProgress?.current}</span>
                <span className="text-2xl font-medium text-text-muted">/ {pklProgress?.total}</span>
              </div>
              <div className="text-xs text-text-muted mt-2 font-medium">
                Periode: {formatDate(submission.tanggal_masuk)} – {formatDate(submission.tanggal_keluar)}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/dashboard/peserta/presensi" className="bg-brand text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-brand/90 transition-colors">
                Catat Kehadiran →
              </Link>
              <Link
                to="/dashboard/peserta/izin"
                className="bg-surface-2 text-text-primary font-bold text-sm px-6 py-3 rounded-xl border border-border-base hover:bg-surface-3 transition-colors"
              >
                Ajukan Izin
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {isMenunggu && (
              <div className="relative overflow-hidden bg-surface-1 border border-border-base rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
                <div className="absolute top-0 right-0 w-48 h-48 bg-status-pending/5 rounded-full -mr-24 -mt-24 pointer-events-none" />
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-status-pending/10 text-status-pending border border-status-pending/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div className="flex-1 space-y-4 relative z-10">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-status-pending px-2.5 py-0.5 rounded-full bg-status-pending/10 border border-status-pending/20">
                      Menunggu Verifikasi
                    </span>
                    <h2 className="text-xl font-bold text-text-primary pt-2 font-display">Status Pengajuan PKL</h2>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">Pengajuan Anda diterima dan sedang diproses. Kami akan memberi tahu Anda jika statusnya diperbarui.</p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Link
                      to="/dashboard/peserta/onboarding/data-pribadi"
                      className="inline-flex items-center gap-2 bg-brand/10 border border-brand/30 text-brand font-bold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 hover:bg-brand hover:text-white cursor-pointer shadow-sm shadow-brand/5 hover:shadow-brand/25"
                    >
                      <Pencil size={15} />
                      Edit Data Diri
                    </Link>
                    <button
                      onClick={handleCancelSubmission}
                      disabled={isCanceling}
                      className="inline-flex items-center gap-2 bg-status-reject/10 border border-status-reject/30 text-status-reject font-bold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 hover:bg-status-reject hover:text-white disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-sm shadow-status-reject/5 hover:shadow-status-reject/25"
                    >
                      <Trash2 size={15} />
                      {isCanceling ? "Menarik..." : "Tarik Pengajuan"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isDitolak && (
              <div className="relative overflow-hidden bg-surface-1 border border-border-base rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
                <div className="absolute top-0 right-0 w-48 h-48 bg-status-reject/5 rounded-full -mr-24 -mt-24 pointer-events-none" />
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-status-reject/10 text-status-reject border border-status-reject/20 flex items-center justify-center">
                  <XCircle className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-4 relative z-10">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-status-reject px-2.5 py-0.5 rounded-full bg-status-reject/10 border border-status-reject/20">
                      Pengajuan Ditolak
                    </span>
                    <h2 className="text-xl font-bold text-text-primary pt-2 font-display">Perlu Perbaikan Data</h2>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Pengajuan Anda ditolak oleh HRD. Silakan periksa catatan di bawah, perbaiki data Anda, lalu kirimkan kembali pengajuan Anda.
                  </p>
                  <div className="bg-status-reject/5 border border-status-reject/15 rounded-xl p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-status-reject">Catatan HRD</span>
                    <p className="text-sm text-text-primary font-medium">{submission.alasan_tolak || "-"}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Link
                      to="/dashboard/peserta/onboarding/data-pribadi"
                      className="inline-flex items-center gap-2 bg-status-reject text-white hover:bg-status-reject/90 font-bold text-sm px-5 py-2.5 rounded-xl transition-all"
                    >
                      <Pencil size={15} />
                      Edit Data & Ajukan Ulang
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {isSelesai && (
              <div className="relative overflow-hidden bg-surface-1 border border-border-base rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
                <div className="absolute top-0 right-0 w-48 h-48 bg-status-done/5 rounded-full -mr-24 -mt-24 pointer-events-none" />
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-status-done/10 text-status-done border border-status-done/20 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-4 relative z-10">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-status-done px-2.5 py-0.5 rounded-full bg-status-done/10 border border-status-done/20">
                      Selesai Magang
                    </span>
                    <h2 className="text-xl font-bold text-text-primary pt-2 font-display">Selamat atas Kelulusan Anda!</h2>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Selamat! Anda telah menyelesaikan seluruh rangkaian kegiatan Praktik Kerja Lapangan (PKL) di Microintern. Nilai dan sertifikat Anda kini telah tersedia.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Link
                      to="/dashboard/peserta/penilaian"
                      className="inline-flex items-center gap-2 bg-brand text-white hover:bg-brand/90 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
                    >
                      <Award size={15} />
                      Lihat Nilai & Sertifikat
                    </Link>
                    <Link
                      to="/dashboard/peserta/onboarding/pengisian-dokumen"
                      className="inline-flex items-center gap-2 bg-surface-2 text-text-primary border border-border-base hover:bg-surface-3 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
                    >
                      <RefreshCw size={15} />
                      Daftar PKL Baru
                    </Link>
                    <Link
                      to="/dashboard/peserta/riwayat"
                      className="inline-flex items-center gap-2 bg-surface-2 text-text-primary border border-border-base hover:bg-surface-3 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
                    >
                      <History size={15} />
                      Riwayat PKL
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-surface-1 border border-border-base rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-subtle">
            <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 text-brand flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-text-primary font-display">Rincian Pengajuan</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Periode Pelaksanaan</span>
              <span className="text-sm font-semibold text-text-primary font-mono-data">
                {formatDate(submission.tanggal_masuk)} — {formatDate(submission.tanggal_keluar)}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Tipe Pengajuan</span>
              <span className="text-sm font-semibold text-text-primary capitalize">
                {submission.jenis_kelompok === "kelompok" || (submission.anggota && submission.anggota.length > 1)
                  ? `Kelompok (${submission.anggota?.length || 1} orang)`
                  : "Individu"}
              </span>
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2 mt-2 border-t border-border-subtle pt-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Berkas Dilampirkan</span>
              <div className="flex flex-wrap gap-3">
                {cvUrl && (
                  <button
                    onClick={() => setPreviewFile({ url: cvUrl, title: "Curriculum Vitae (CV)" })}
                    className="inline-flex items-center gap-2 text-xs font-semibold bg-surface-2 border border-border-base text-text-primary px-3 py-1.5 rounded-lg hover:bg-surface-3 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-text-secondary" />
                    Curriculum Vitae (CV)
                  </button>
                )}
                <button
                  onClick={() => setPreviewFile({ url: submission.surat_pengantar_url, title: "Surat Pengantar Kampus" })}
                  className="inline-flex items-center gap-2 text-xs font-semibold bg-surface-2 border border-border-base text-text-primary px-3 py-1.5 rounded-lg hover:bg-surface-3 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-text-secondary" />
                  Surat Pengantar
                </button>
                {submission.surat_balasan_url && (
                  <button
                    onClick={() => setPreviewFile({ url: submission.surat_balasan_url!, title: "Surat Balasan PKL" })}
                    className="inline-flex items-center gap-2 text-xs font-semibold bg-surface-2 border border-border-base text-text-primary px-3 py-1.5 rounded-lg hover:bg-surface-3 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-text-secondary" />
                    Surat Balasan HRD
                  </button>
                )}
              </div>
            </div>
          </div>

          {(submission.jenis_kelompok === "kelompok" || (submission.anggota && submission.anggota.length > 1)) && submission.anggota && submission.anggota.length > 0 && (
            <div className="mt-2 border-t border-border-subtle pt-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Anggota Kelompok</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse min-w-max">
                  <tbody>
                    {submission.anggota.map((member) => (
                      <tr key={member.user_id} className="border-b border-border-subtle/50 last:border-0">
                        <td className="py-3 pr-4 font-bold text-text-primary whitespace-nowrap">{member.nama_lengkap || "Peserta"}</td>
                        <td className="py-3 pr-4 text-text-secondary whitespace-nowrap">{member.institusi || "-"}</td>
                        <td className="py-3 text-text-muted font-mono-data text-right whitespace-nowrap">{member.nim_nisn || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <ModalPratinjauBerkas isOpen={previewFile !== null} onClose={() => setPreviewFile(null)} fileUrl={previewFile?.url || null} title={previewFile?.title} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8 bg-surface-1 border border-border-base rounded-2xl text-text-secondary text-sm">Terjadi kesalahan saat memuat data.</div>
  );
};

export default Onboarding;
