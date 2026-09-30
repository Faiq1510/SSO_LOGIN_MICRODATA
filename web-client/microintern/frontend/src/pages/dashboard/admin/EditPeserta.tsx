import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../../utils/api";
import { getParticipantDetail } from "../../../services/peserta.service";
import { getInstitusiSuggestions, getProdiSuggestions } from "../../../services/profil.service";
import { useNotification } from "../../../components/ProviderNotifikasi";
import InputAutocomplete from "../../../components/InputAutocomplete";
import { ChevronLeft } from "lucide-react";

interface DBParticipantEdit {
  nama: string | null;
  nim: string | null;
  institusi: string | null;
  prodi: string | null;
  email: string | null;
}

const EditPeserta: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [institusi, setInstitusi] = useState("");
  const [prodi, setProdi] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await getParticipantDetail(id!);
        if (res.status === "success" && res.data) {
          const item = res.data as DBParticipantEdit;
          setNama(item.nama || "");
          setNim(item.nim || "");
          setInstitusi(item.institusi || "");
          setProdi(item.prodi || "");
          setEmail(item.email || "");
        }
      } catch (err) {
        console.error("Gagal memuat data peserta:", err);
        showError("Gagal memuat data peserta.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchDetail();
    }
  }, [id, showError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!nama.trim() || !nim.trim() || !institusi.trim() || !prodi.trim() || !email.trim()) {
      showError("Semua field kecuali password wajib diisi.");
      return;
    }

    try {
      const res = await apiRequest(`/admin/peserta/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          nama: nama.trim(),
          nim: nim.trim(),
          institusi: institusi.trim(),
          prodi: prodi.trim(),
          email: email.trim(),
          ...(password.trim() ? { password: password.trim() } : {}),
        }),
      });

      if (res.status === "success") {
        showSuccess("Data peserta berhasil diperbarui.");
        navigate(`/dashboard/admin/peserta/${id}`);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Gagal memperbarui data peserta.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-brand/20 border-t-orange-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <Link
        to={`/dashboard/admin/peserta/${id}`}
        className="group inline-flex items-center gap-2 px-4 py-2 w-fit rounded-full bg-surface-1 border border-border-base text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-all shadow-sm"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Detail Peserta
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Edit Data Peserta</h1>
        <p className="text-text-muted text-sm">Ubah informasi akun dan data profil peserta</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-1 border border-border-base rounded-3xl p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Nama Lengkap</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full bg-surface-0 border border-border-base text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">NIM / NISN</label>
            <input
              type="text"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              className="w-full bg-surface-0 border border-border-base text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Institusi</label>
          <InputAutocomplete
            value={institusi}
            onChange={setInstitusi}
            fetchSuggestions={async (q) => {
              const res = await getInstitusiSuggestions(q);
              return res.data || [];
            }}
            placeholder="Nama Institusi / Universitas"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Program Studi</label>
          <InputAutocomplete
            value={prodi}
            onChange={setProdi}
            fetchSuggestions={async (q) => {
              const res = await getProdiSuggestions(q, institusi);
              return res.data || [];
            }}
            placeholder="Program Studi"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Email Login</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface-0 border border-border-base text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none"
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Password Baru (Opsional)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kosongkan jika tidak ingin mengubah password"
            className="w-full bg-surface-0 border border-border-base text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none placeholder:text-zinc-600"
            autoComplete="new-password"
          />
        </div>
        <div className="flex gap-4 pt-4">
          <Link to={`/dashboard/admin/peserta/${id}`} className="flex-1 text-center bg-surface-2 hover:bg-zinc-700 text-text-primary font-bold py-3 rounded-xl transition-all">
            Batal
          </Link>
          <button type="submit" className="flex-[2] bg-brand hover:bg-brand/90 text-text-primary font-bold py-3 rounded-xl transition-all cursor-pointer">
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPeserta;
