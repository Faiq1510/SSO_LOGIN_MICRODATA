import React from "react";
import { Link, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const contentByPath: Record<string, { title: string; body: string[] }> = {
  "/privacy": {
    title: "Privacy Policy",
    body: [
      "Microintern menyimpan data peserta PKL untuk kebutuhan pendaftaran, verifikasi, presensi, penilaian, dan penerbitan sertifikat.",
      "Data tidak ditampilkan pada jadwal publik kecuali informasi non-pribadi seperti institusi, program studi, periode, dan jumlah peserta.",
    ],
  },
  "/terms": {
    title: "Terms of Service",
    body: [
      "Pengguna wajib mengisi data yang benar dan menjaga keamanan akun masing-masing.",
      "Admin HRD berwenang memverifikasi, menerima, atau menolak pengajuan berdasarkan kelengkapan dokumen dan ketersediaan kuota.",
    ],
  },
  "/contact": {
    title: "Contact",
    body: ["Untuk bantuan pendaftaran PKL, hubungi Admin HRD melalui email resmi perusahaan atau datang ke kantor HRD pada jam kerja."],
  },
};

const PublicInfo: React.FC = () => {
  const { pathname } = useLocation();
  const content = contentByPath[pathname] ?? contentByPath["/contact"];

  return (
    <>
      <Header />
      <main className="flex-grow px-6 py-16 md:px-12">
        <div className="max-w-3xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-8 md:p-10">
          <h1 className="text-3xl font-black text-white tracking-tight mb-6">{content.title}</h1>
          <div className="space-y-4 text-zinc-400 leading-relaxed">
            {pathname === "/privacy" && (
              <>
                <p>Microintern menyimpan data peserta PKL untuk kebutuhan pendaftaran, verifikasi, presensi, penilaian, dan penerbitan sertifikat.</p>
                <p>Data tidak ditampilkan pada jadwal publik kecuali informasi non-pribadi seperti institusi, program studi, periode, dan jumlah peserta.</p>
              </>
            )}
            {pathname === "/terms" && (
              <>
                <p>Pengguna wajib mengisi data yang benar dan menjaga keamanan akun masing-masing.</p>
                <p>Admin HRD berwenang memverifikasi, menerima, atau menolak pengajuan berdasarkan kelengkapan dokumen dan ketersediaan kuota.</p>
              </>
            )}
            {(pathname === "/contact" || (pathname !== "/privacy" && pathname !== "/terms")) && (
              <p>Untuk bantuan pendaftaran PKL, hubungi Admin HRD melalui email resmi perusahaan atau datang ke kantor HRD pada jam kerja.</p>
            )}
          </div>
          <Link to="/" className="inline-flex mt-8 text-orange-500 hover:text-orange-400 font-bold">
            Kembali ke Beranda
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PublicInfo;
