import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Calendar, UserPlus, UserCheck, FileText, Clock, CheckCircle2, CalendarOff, Download, History, BookOpen, ChevronRight, ChevronDown, X, Check } from "lucide-react";

interface PanduanTopic {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  screenshot: string;
  summary: string;
  steps: string[];
  tips?: string;
  ctaText?: string;
  ctaLink?: string;
  sampleFileUrl?: string;
}

const TOPICS: PanduanTopic[] = [
  {
    id: "kalender",
    number: "01",
    title: "Melihat Kalender Ketersediaan PKL",
    subtitle: "Informasi Publik Sebelum Mendaftar",
    icon: Calendar,
    screenshot: "/panduan/01-kalender.png",
    summary:
      "Sebelum melakukan pendaftaran, Anda dapat mengecek daftar peserta PKL yang sedang berjalan dan mendatang serta periode ketersediaan kuota langsung dari beranda website.",
    steps: [
      "Buka halaman Beranda Microintern.",
      "Gulir ke bagian 'Jadwal & Ketersediaan PKL'.",
      "Lihat daftar institusi, program studi, periode tanggal, dan jumlah peserta per kelompok.",
      "Gunakan kolom pencarian atau filter status (Sedang Berjalan / Mendatang) untuk menemukan jadwal spesifik.",
    ],
    tips: "Data pribadi peserta lain disamarkan untuk perlindungan privasi.",
    ctaText: "Lihat Jadwal PKL",
    ctaLink: "/#jadwal-pkl",
  },
  {
    id: "registrasi",
    number: "02",
    title: "Registrasi & Login Akun",
    subtitle: "Pembuatan Akun Peserta",
    icon: UserPlus,
    screenshot: "/panduan/02-registrasi.png",
    summary: "Pendaftaran dapat dilakukan menggunakan Email & Password atau dengan akun Google OAuth (SSO) secara cepat dan aman.",
    steps: [
      "Klik tombol 'Daftar' pada header beranda.",
      "Pilih metode pendaftaran: melalui Email + Password atau 'Lanjutkan dengan Google'.",
      "Jika mendaftar dengan email, isi Nama Lengkap, Email, dan Password.",
      "Lakukan verifikasi email dengan memasukkan Kode OTP 6-digit yang dikirimkan ke kotak masuk email Anda.",
      "Setelah terverifikasi, Anda dapat login ke Dashboard Peserta.",
    ],
    tips: "Jika lupa kata sandi, gunakan fitur 'Lupa Password' di halaman login untuk menerima kode verifikasi pemulihan.",
    ctaText: "Daftar Sekarang",
    ctaLink: "/registrasi",
  },
  {
    id: "profil",
    number: "03",
    title: "Onboarding Tahap 1 — Data Diri",
    subtitle: "Pengisian Profil Peserta",
    icon: UserCheck,
    screenshot: "/panduan/03-profil.png",
    summary: "Tahap pertama onboarding mewajibkan peserta untuk melengkapi identitas pribadi dan akademik sebelum mengajukan pendaftaran PKL.",
    steps: [
      "Masuk ke Dashboard Peserta.",
      "Isi Nama Lengkap, NIM/NISN, Jenjang Pendidikan (Sekolah / Kuliah), Asal Institusi, dan Program Studi.",
      "Unggah berkas Curiculum Vitae (CV) dalam format PDF (maksimal 5 MB).",
      "Periksa kembali kebenaran data, lalu klik 'Simpan & Lanjutkan'.",
    ],
    tips: "Data diri yang sudah disimpan masih dapat diperbarui di kemudian hari melalui menu Pengaturan Profil.",
  },
  {
    id: "pengajuan",
    number: "04",
    title: "Onboarding Tahap 2 — Pengajuan PKL",
    subtitle: "Pilihan Individu atau Kelompok",
    icon: FileText,
    screenshot: "/panduan/04-pengajuan.png",
    summary: "Peserta menentukan jenis pendaftaran (Individu atau Kelompok), memilih periode pelaksanaan PKL, dan mengunggah Surat Pengantar Resmi.",
    steps: [
      "Pilih tipe pendaftaran: 'Individu' atau 'Kelompok'.",
      "Jika memilih 'Kelompok', tambahkan anggota dengan memasukkan Email registered anggota kelompok Anda.",
      "Tentukan Tanggal Masuk (minimal hari ini) dan Tanggal Keluar PKL.",
      "Unggah berkas Surat Pengantar dari Sekolah/Kampus (PDF/JPG/PNG, maksimal 10 MB).",
      "Sistem akan otomatis mengecek ketersediaan kuota pembimbing/ruangan pada periode yang Anda pilih.",
      "Klik 'Submit Pendaftaran PKL' untuk mengirim pengajuan.",
    ],
    tips: "Setiap anggota kelompok yang ditambahkan harus sudah mendaftar dan memiliki akun aktif di Microintern.",
  },
  {
    id: "status",
    number: "05",
    title: "Monitoring Status Pendaftaran",
    subtitle: "Verifikasi Berkas oleh Admin HRD",
    icon: Clock,
    screenshot: "/panduan/05-status.png",
    summary: "Setelah mengajukan pendaftaran, peserta dapat memantau proses verifikasi dokumen secara real-time dari Dashboard.",
    steps: [
      "Status 'Menunggu': Pengajuan Anda sedang ditinjau oleh Admin HRD.",
      "Anda dapat membatalkan pengajuan pendaftaran selama status masih 'Menunggu'.",
      "Status 'Aktif': Pengajuan Anda telah disetujui dan Surat Balasan Resmi dapat diunduh.",
      "Status 'Ditolak': Pengajuan tidak disetujui beserta alasan penolakan yang diberikan oleh Admin.",
    ],
    tips: "Notifikasi email akan dikirimkan secara otomatis setiap kali ada perubahan status pendaftaran Anda.",
  },
  {
    id: "presensi",
    number: "06",
    title: "Presensi Harian PKL",
    subtitle: "Pencatatan Kehadiran Datang & Pulang",
    icon: CheckCircle2,
    screenshot: "/panduan/06-presensi.png",
    summary: "Fitur presensi aktif secara otomatis selama rentang tanggal PKL berlangsung (Status Aktif).",
    steps: [
      "Akses menu 'Presensi' pada sidebar Dashboard.",
      "Klik tombol 'Datang' saat tiba di lokasi magang sebelum batas waktu jam masuk harian terlampaui.",
      "Klik tombol 'Pulang' di akhir jam kerja magang Anda.",
      "Riwayat presensi harian beserta timestamp kedatangan dan kepulangan akan tercatat secara akurat pada tabel riwayat.",
    ],
    tips: "Presensi Datang hanya dapat dilakukan 1 kali per hari sebelum batas waktu bolos terlampaui. Lewat dari batas waktu, peserta dianggap tidak hadir (Alpha).",
  },
  {
    id: "izin",
    number: "07",
    title: "Pengajuan & Pembatalan Izin",
    subtitle: "Pencatatan Halangan / Cuti Magang",
    icon: CalendarOff,
    screenshot: "/panduan/07-izin.png",
    summary: "Jika peserta tidak dapat hadir karena sakit atau keperluan lain, peserta wajib mengisi formulir pengajuan izin.",
    steps: [
      "Akses menu 'Izin' dan klik 'Buat Pengajuan Izin'.",
      "Pilih Tanggal Mulai dan Tanggal Selesai izin (hanya untuk hari ini dan tanggal mendatang).",
      "Tuliskan Alasan Izin secara rinci.",
      "Unggah Bukti Pendukung seperti Surat Dokter / Surat Izin (PDF/Gambar, opsional maks. 5 MB).",
      "Jika rencana berubah, Anda dapat membatalkan izin yang telah diajukan sebelum tanggal pelaksanaan.",
    ],
    tips: "Sistem secara otomatis akan mencatat baris izin harian pada rentang tanggal yang dipilih.",
  },
  {
    id: "penilaian",
    number: "08",
    title: "Evaluasi Nilai & Unduh Sertifikat",
    subtitle: "Rincian Penilaian & Berkas PDF",
    icon: Download,
    screenshot: "/panduan/08-penilaian.png",
    summary: "Peserta yang telah menyelesaikan PKL dapat melihat rincian nilai performa, predikat akhir, catatan mentor, dan mengunduh Sertifikat PDF.",
    steps: [
      "Buka menu 'Penilaian' pada sidebar Dashboard Peserta.",
      "Lihat Skor Kumulatif (0-100) dan Predikat Nilai (A, B, C, atau D).",
      "Periksa rincian nilai per kriteria (Kedisiplinan, Keahlian, Kerjasama, Sikap, Inisiatif, Hasil Kerja).",
      "Baca catatan dan masukan langsung dari mentor pembimbing.",
      "Klik tombol 'Sertifikat PDF' untuk membuka atau mengunduh sertifikat resmi ber-TTE digital.",
    ],
    tips: "Tombol unduh sertifikat akan aktif secara otomatis setelah admin menyelesaikan pengisian nilai dan mengunggah dokumen sertifikat.",
    sampleFileUrl: "/panduan/contoh_sertifikat.pdf",
  },
  {
    id: "riwayat",
    number: "09",
    title: "Riwayat PKL & Pendaftaran Baru",
    subtitle: "Arsip Rekam Jejak & Magang Baru",
    icon: History,
    screenshot: "/panduan/09-riwayat.png",
    summary: "Peserta dapat melihat seluruh arsip periode PKL terdahulu dan berhak mendaftar kembali untuk periode magang baru apabila telah selesai.",
    steps: [
      "Buka menu 'Riwayat PKL' pada sidebar Dashboard untuk melihat daftar periode magang yang pernah diikuti.",
      "Unduh kembali Surat Balasan atau Sertifikat dari periode PKL terdahulu kapan saja.",
      "Jika Anda ingin mendaftar PKL baru (magang ulang), pastikan tidak ada PKL yang sedang berstatus 'Aktif'.",
      "Klik 'Daftar PKL Baru' untuk memulai pendaftaran tanpa perlu mengisi ulang data profil pribadi.",
    ],
    tips: "Jika Anda memiliki pendaftaran lama yang berstatus 'Menunggu' atau 'Ditolak', pendaftaran baru akan menggantikan pengajuan lama secara otomatis.",
  },
];

const getNavLabel = (topic: PanduanTopic) => {
  if (topic.id === "penilaian") return "Penilaian";
  if (topic.id === "riwayat") return "Riwayat PKL";
  return topic.title.replace(/^Melihat |^Onboarding Tahap \d — |^Monitoring |^Pengajuan & Pembatalan /, "");
};

const Panduan: React.FC = () => {
  const [activeId, setActiveId] = useState<string>("kalender");
  const [isMobileModalOpen, setIsMobileModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const topic of TOPICS) {
        const element = document.getElementById(topic.id);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveId(topic.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTopic = (id: string) => {
    setActiveId(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const activeTopic = TOPICS.find((t) => t.id === activeId) || TOPICS[0];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-0 text-text-primary pb-24">
        <section className="relative border-b border-border-subtle bg-surface-1/50 py-16 px-4 sm:px-6 md:px-10 overflow-hidden">
          <div className="absolute top-0 right-1/3 w-96 h-96 bg-brand/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="max-w-6xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold mb-6">
              <BookOpen size={14} />
              <span>Panduan Pengguna Peserta PKL</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-text-primary tracking-tight mb-4">Panduan Lengkap Peserta PKL</h1>
            <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Pelajari seluruh alur dan langkah Praktik Kerja Lapangan di Microintern — mulai dari pengecekan kalender ketersediaan hingga penerbitan sertifikat digital.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-start">
            <aside className="hidden lg:block sticky top-20 bg-surface-1 border border-border-base rounded-2xl p-4 shadow-sm max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-hide">
              <div className="px-3 py-2 text-xs font-mono-data text-text-muted uppercase tracking-wider mb-2">Daftar Topik Panduan</div>
              <nav className="space-y-1">
                {TOPICS.map((topic) => {
                  const Icon = topic.icon;
                  const isActive = activeId === topic.id;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => scrollToTopic(topic.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left group cursor-pointer ${
                        isActive ? "bg-brand text-white font-semibold shadow-sm" : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                      }`}
                    >
                      <span className={`font-mono-data text-[11px] ${isActive ? "text-white/80" : "text-text-muted"}`}>{topic.number}</span>
                      <Icon size={15} className={`shrink-0 ${isActive ? "text-white" : "text-text-secondary group-hover:text-text-primary"}`} />
                      <span className="truncate">{getNavLabel(topic)}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div className="lg:hidden sticky top-16 z-40 mb-6">
              <button
                onClick={() => setIsMobileModalOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-surface-1/90 backdrop-blur-md border border-border-strong text-text-primary text-xs font-medium cursor-pointer shadow-lg shadow-black/5 hover:border-brand/40 transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-6 h-6 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-mono-data text-[11px] font-bold shrink-0">
                    {activeTopic.number}
                  </div>
                  <span className="truncate font-semibold text-text-primary">{getNavLabel(activeTopic)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-brand text-[11px] font-semibold shrink-0 ml-2">
                  <span>Pilih Topik</span>
                  <ChevronDown size={15} />
                </div>
              </button>
            </div>

            <div className="space-y-16">
              {TOPICS.map((topic) => {
                const Icon = topic.icon;
                return (
                  <section
                    key={topic.id}
                    id={topic.id}
                    className="bg-surface-1 border border-border-base rounded-3xl p-6 sm:p-8 shadow-sm transition-all hover:border-border-strong relative overflow-hidden group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
                          <Icon size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono-data text-xs text-brand font-bold">{topic.number}</span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">{topic.title}</h2>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-6">{topic.summary}</p>

                    <div className="mb-8 rounded-2xl overflow-hidden border border-border-base bg-surface-0 shadow-md group/img relative">
                      <div className="bg-surface-2 border-b border-border-subtle px-4 py-2 flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
                          <div className="w-3 h-3 rounded-full bg-amber-500/60"></div>
                          <div className="w-3 h-3 rounded-full bg-emerald-500/60"></div>
                        </div>
                        <span className="text-[11px] font-mono-data text-text-muted truncate ml-2">Microintern — {topic.subtitle}</span>
                      </div>
                      <img
                        src={topic.screenshot}
                        alt={`Screenshot ${topic.title}`}
                        className="w-full h-auto object-cover max-h-[480px] object-top group-hover/img:scale-[1.01] transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>

                    <div className="space-y-4 mb-6">
                      <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-mono-data">Langkah - Langkah:</h3>
                      <ol className="space-y-3">
                        {topic.steps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-text-secondary">
                            <span className="w-6 h-6 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold font-mono-data flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {topic.sampleFileUrl && (
                      <div className="mb-6 p-4 rounded-2xl bg-surface-2/70 border border-border-base flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand border border-brand/20 flex items-center justify-center shrink-0">
                            <FileText size={20} />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-text-primary">Contoh Sertifikat PKL Official (PDF)</h4>
                            <p className="text-[11px] sm:text-xs text-text-secondary">Lihat atau unduh contoh dokumen sertifikat resmi ber-TTE digital.</p>
                          </div>
                        </div>
                        <a
                          href={topic.sampleFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand/90 text-white text-xs font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer shrink-0 w-full sm:w-auto justify-center"
                        >
                          <Download size={15} />
                          <span>Unduh Contoh Sertifikat</span>
                        </a>
                      </div>
                    )}

                    {topic.tips && (
                      <div className="p-4 rounded-2xl bg-surface-2/60 border border-border-subtle text-xs text-text-muted flex items-start gap-3 leading-relaxed mb-6">
                        <span className="text-brand font-bold shrink-0">Catatan:</span>
                        <span>{topic.tips}</span>
                      </div>
                    )}

                    {topic.ctaText && topic.ctaLink && (
                      <div className="pt-2">
                        <Link to={topic.ctaLink} className="inline-flex items-center gap-2 text-xs font-semibold text-brand hover:text-brand/80 transition-colors">
                          <span>{topic.ctaText}</span>
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        </div>

        {isMobileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full sm:max-w-md bg-surface-1 border border-border-base rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-brand" />
                  <h3 className="text-sm font-bold text-text-primary font-mono-data uppercase tracking-wider">Daftar Topik Panduan</h3>
                </div>
                <button
                  onClick={() => setIsMobileModalOpen(false)}
                  className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
                {TOPICS.map((topic) => {
                  const Icon = topic.icon;
                  const isActive = activeId === topic.id;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => {
                        scrollToTopic(topic.id);
                        setIsMobileModalOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-xs text-left transition-all cursor-pointer ${
                        isActive
                          ? "bg-brand text-white font-semibold shadow-xs"
                          : "bg-surface-2/60 hover:bg-surface-2 border border-border-subtle text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span className={`font-mono-data text-[11px] ${isActive ? "text-white/80" : "text-text-muted"}`}>{topic.number}</span>
                        <Icon size={16} className={isActive ? "text-white" : "text-brand"} />
                        <span className="truncate">{getNavLabel(topic)}</span>
                      </div>
                      {isActive && <Check size={16} className="shrink-0 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default Panduan;
