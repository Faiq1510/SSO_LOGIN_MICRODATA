import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ProviderNotifikasi } from "./components/ProviderNotifikasi";
import RuteStatusPeserta from "./components/RuteStatusPeserta";

const PageLoader = () => (
  <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin"></div>
  </div>
);

const Beranda = lazy(() => import("./pages/Beranda"));
const Login = lazy(() => import("./pages/Login"));
const Registrasi = lazy(() => import("./pages/Registrasi"));
const LupaPassword = lazy(() => import("./pages/LupaPassword"));
const AturUlangPassword = lazy(() => import("./pages/AturUlangPassword"));
const KonfirmasiEmail = lazy(() => import("./pages/KonfirmasiEmail"));
const SsoEntry = lazy(() => import("./pages/SsoEntry"));
const SSOCallback = lazy(() => import("./pages/SSOCallback"));
const InfoPublik = lazy(() => import("./pages/InfoPublik"));
const Panduan = lazy(() => import("./pages/Panduan"));
const LayoutPeserta = lazy(() => import("./layouts/LayoutPeserta"));
const Onboarding = lazy(() => import("./pages/dashboard/peserta/Onboarding"));
const DataPribadi = lazy(() => import("./pages/dashboard/peserta/onboarding/DataPribadi"));
const PengisianDokumen = lazy(() => import("./pages/dashboard/peserta/onboarding/PengisianDokumen"));
const Presensi = lazy(() => import("./pages/dashboard/peserta/Presensi"));
const IzinPeserta = lazy(() => import("./pages/dashboard/peserta/Izin"));
const FormIzin = lazy(() => import("./pages/dashboard/peserta/FormIzin"));
const Penilaian = lazy(() => import("./pages/dashboard/peserta/Penilaian"));
const Settings = lazy(() => import("./pages/dashboard/peserta/Settings"));
const HistoriPkl = lazy(() => import("./pages/dashboard/peserta/HistoriPkl"));

const LayoutAdmin = lazy(() => import("./layouts/LayoutAdmin"));
const DashboardAdmin = lazy(() => import("./pages/dashboard/admin/DashboardAdmin"));
const Pendaftaran = lazy(() => import("./pages/dashboard/admin/Pendaftaran"));
const Peserta = lazy(() => import("./pages/dashboard/admin/Peserta"));
const DetailPeserta = lazy(() => import("./pages/dashboard/admin/DetailPeserta"));
const PresensiAdmin = lazy(() => import("./pages/dashboard/admin/Presensi"));
const PenilaianAdmin = lazy(() => import("./pages/dashboard/admin/Penilaian"));
const FormPenilaian = lazy(() => import("./pages/dashboard/admin/FormPenilaian"));
const WebsiteSettings = lazy(() => import("./pages/dashboard/admin/WebsiteSettings"));
const DokumenGenerated = lazy(() => import("./pages/dashboard/admin/DokumenGenerated"));
const SettingsAdmin = lazy(() => import("./pages/dashboard/admin/Settings"));
const Laporan = lazy(() => import("./pages/dashboard/admin/Laporan"));
const EditPeserta = lazy(() => import("./pages/dashboard/admin/EditPeserta"));
const IzinAdmin = lazy(() => import("./pages/dashboard/admin/Izin"));

const App: React.FC = () => {
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  return (
    <Router>
      <ProviderNotifikasi>
        <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100 selection:bg-brand-orange/30">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Beranda />} />
              <Route path="/panduan" element={<Panduan />} />
              <Route path="/privacy" element={<InfoPublik />} />
              <Route path="/terms" element={<InfoPublik />} />
              <Route path="/contact" element={<InfoPublik />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registrasi" element={<Registrasi />} />
              <Route path="/lupa-password" element={<LupaPassword />} />
              <Route path="/atur-ulang-password" element={<AturUlangPassword />} />
              <Route path="/konfirmasi-email" element={<KonfirmasiEmail />} />
              <Route path="/sso/start" element={<SsoEntry />} />
              <Route path="/sso/callback" element={<SSOCallback />} />
              <Route path="/dashboard/peserta" element={<LayoutPeserta />}>
                <Route index element={<Onboarding />} />
                <Route path="onboarding/data-pribadi" element={<DataPribadi />} />
                <Route path="onboarding/pengisian-dokumen" element={<PengisianDokumen />} />
                <Route element={<RuteStatusPeserta statusDibutuhkan="aktif" pesanDitolak="Fitur ini hanya dapat diakses selama masa PKL Anda sedang berjalan (Aktif)." />}>
                  <Route path="presensi" element={<Presensi />} />
                  <Route path="izin" element={<IzinPeserta />} />
                  <Route path="izin/baru" element={<FormIzin />} />
                </Route>
                <Route
                  element={<RuteStatusPeserta statusDibutuhkan="selesai" pesanDitolak="Fitur Penilaian dan Sertifikat hanya dapat diakses setelah masa PKL Anda telah Selesai." />}
                >
                  <Route path="penilaian" element={<Penilaian />} />
                </Route>
                <Route
                  element={
                    <RuteStatusPeserta
                      statusDibutuhkan={["menunggu", "aktif", "selesai", "ditolak"]}
                      pesanDitolak="Riwayat PKL hanya dapat diakses setelah Anda mengajukan pendaftaran PKL."
                    />
                  }
                >
                  <Route path="riwayat" element={<HistoriPkl />} />
                </Route>
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="/dashboard/admin" element={<LayoutAdmin />}>
                <Route index element={<DashboardAdmin />} />
                <Route path="pendaftaran" element={<Pendaftaran />} />
                <Route path="peserta" element={<Peserta />} />
                <Route path="peserta/:id" element={<DetailPeserta />} />
                <Route path="peserta/:id/ubah" element={<EditPeserta />} />
                <Route path="presensi" element={<PresensiAdmin />} />
                <Route path="izin" element={<IzinAdmin />} />
                <Route path="penilaian" element={<PenilaianAdmin />} />
                <Route path="penilaian/:id" element={<FormPenilaian />} />

                <Route path="website-settings" element={<WebsiteSettings />} />
                <Route path="dokumen" element={<DokumenGenerated />} />
                <Route path="laporan" element={<Laporan />} />
                <Route path="settings" element={<SettingsAdmin />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </ProviderNotifikasi>
    </Router>
  );
};

export default App;
