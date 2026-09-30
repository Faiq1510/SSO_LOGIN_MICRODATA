import React, { useState, useEffect } from "react";
import { apiRequest } from "../../../utils/api";
import { useNotification } from "../../../components/ProviderNotifikasi";
import { Clock, Mail, Server, FileText } from "lucide-react";

interface WebsiteSettingsData {
  kapasitas_maksimal: number;
  batas_waktu_bolos?: string;
  emailNotification: boolean;
  used_quota?: number;
  template_nomor_surat?: string;
  template_nomor_sertifikat?: string;
  nomor_awal_surat?: number;
  nomor_awal_sertifikat?: number;
  counter_surat?: number;
  counter_sertifikat?: number;
}

const previewNomor = (template: string, nomorAwal: number, counter: number = 0): string => {
  const now = new Date();
  const ROMAWI = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  const nextNumber = Math.max(nomorAwal, counter + 1);
  const padded = nextNumber.toString().padStart(3, "0");
  return template
    .replace("{no}", padded)
    .replace("{tahun}", now.getFullYear().toString())
    .replace("{bulan_romawi}", ROMAWI[now.getMonth()])
    .replace("{bulan}", (now.getMonth() + 1).toString().padStart(2, "0"));
};

const WebsiteSettings: React.FC = () => {
  const { showSuccess, showError } = useNotification();

  const [quota, setQuota] = useState<number | string>(10);
  const [batasWaktuBolos, setBatasWaktuBolos] = useState<string>("23:59");
  const [emailNotification, setEmailNotification] = useState(true);

  const [templateNomorSurat, setTemplateNomorSurat] = useState("{no}/SDM/PT-MDI/{bulan_romawi}/{tahun}");
  const [templateNomorSertifikat, setTemplateNomorSertifikat] = useState("CERT/MDI/{tahun}/{no}");
  const [nomorAwalSurat, setNomorAwalSurat] = useState<number | string>(1);
  const [nomorAwalSertifikat, setNomorAwalSertifikat] = useState<number | string>(1);
  const [counterSurat, setCounterSurat] = useState<number>(0);
  const [counterSertifikat, setCounterSertifikat] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const response = await apiRequest("/admin/website-settings");
        if (response.status === "success" && response.data && active) {
          const data: WebsiteSettingsData = response.data;
          setQuota(data.kapasitas_maksimal);
          if (data.batas_waktu_bolos) {
            setBatasWaktuBolos(data.batas_waktu_bolos.substring(0, 5));
          }
          setEmailNotification(data.emailNotification);
          if (data.template_nomor_surat) setTemplateNomorSurat(data.template_nomor_surat);
          if (data.template_nomor_sertifikat) setTemplateNomorSertifikat(data.template_nomor_sertifikat);
          if (data.nomor_awal_surat !== undefined) setNomorAwalSurat(data.nomor_awal_surat);
          if (data.nomor_awal_sertifikat !== undefined) setNomorAwalSertifikat(data.nomor_awal_sertifikat);
          if (data.counter_surat !== undefined) setCounterSurat(data.counter_surat);
          if (data.counter_sertifikat !== undefined) setCounterSertifikat(data.counter_sertifikat);
        }
      } catch (err) {
        console.error("Failed to load website configuration:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadSettings();
    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!templateNomorSurat.includes("{no}")) {
      showError("Template nomor surat harus mengandung placeholder {no}");
      return;
    }
    if (!templateNomorSertifikat.includes("{no}")) {
      showError("Template nomor sertifikat harus mengandung placeholder {no}");
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiRequest("/admin/website-settings", {
        method: "PUT",
        body: JSON.stringify({
          kapasitas_maksimal: Number(quota),
          batas_waktu_bolos: batasWaktuBolos + ":00",
          emailNotification,
          template_nomor_surat: templateNomorSurat,
          template_nomor_sertifikat: templateNomorSertifikat,
          nomor_awal_surat: Number(nomorAwalSurat) || 1,
          nomor_awal_sertifikat: Number(nomorAwalSertifikat) || 1,
        }),
      });
      if (response.status === "success") {
        showSuccess("Konfigurasi website berhasil disimpan.");
        setRefreshTrigger((t) => t + 1);
      }
    } catch (err) {
      const error = err as Error;
      showError(error.message || "Gagal memperbarui konfigurasi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotification = async () => {
    const nextValue = !emailNotification;
    try {
      const response = await apiRequest("/admin/website-settings", {
        method: "PUT",
        body: JSON.stringify({
          emailNotification: nextValue,
        }),
      });
      if (response.status === "success") {
        setEmailNotification(response.data.emailNotification);
        showSuccess("Pengaturan notifikasi berhasil diperbarui.");
      }
    } catch (err) {
      const error = err as Error;
      showError(error.message || "Gagal mengubah pengaturan notifikasi.");
    }
  };

  const appendPlaceholder = (target: "surat" | "sertifikat", placeholder: string) => {
    if (target === "surat") {
      setTemplateNomorSurat((prev) => prev + placeholder);
    } else {
      setTemplateNomorSertifikat((prev) => prev + placeholder);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Pengaturan Website</h1>
        <p className="text-text-secondary">Kelola kuota, jam operasional, notifikasi, dan format penomoran dokumen.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="bg-surface-1 border border-border-base rounded-3xl p-8 shadow-sm">
            <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
              <Server className="w-5 h-5 text-brand" />
              Sistem Operasional
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Kapasitas Maksimal (Orang)</label>
                <input
                  type="number"
                  min="1"
                  value={quota}
                  onChange={(e) => setQuota(e.target.value)}
                  className="w-full bg-surface-0 border border-border-base text-text-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Batas Waktu Presensi (Alpha)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Clock className="w-4 h-4 text-text-muted" />
                  </div>
                  <input
                    type="time"
                    value={batasWaktuBolos}
                    onChange={(e) => setBatasWaktuBolos(e.target.value)}
                    className="w-full bg-surface-0 border border-border-base text-text-primary pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-surface-2 hover:bg-zinc-700 text-text-primary font-bold py-3 rounded-xl transition-all border border-border-strong mt-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          </section>

          <section className="bg-surface-1 border border-border-base rounded-3xl p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand" />
              Format Nomor Dokumen
            </h3>

            <div className="space-y-4">
              <div className="border-b border-border-base pb-4 space-y-3">
                <h4 className="text-sm font-bold text-text-primary">Surat Balasan</h4>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted font-medium">Template Format</label>
                  <input
                    type="text"
                    value={templateNomorSurat}
                    onChange={(e) => setTemplateNomorSurat(e.target.value)}
                    placeholder="{no}/SDM/PT-MDI/{bulan_romawi}/{tahun}"
                    className="w-full bg-surface-0 border border-border-base text-text-primary px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none text-sm"
                  />
                  {!templateNomorSurat.includes("{no}") && <p className="text-xs text-red-500">Wajib menyertakan placeholder &#123;no&#125;</p>}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted font-medium">Nomor Awal Counter</label>
                    <input
                      type="number"
                      min="1"
                      value={nomorAwalSurat}
                      onChange={(e) => setNomorAwalSurat(e.target.value)}
                      className="w-full bg-surface-0 border border-border-base text-text-primary px-4 py-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted font-medium">Counter Saat Ini</label>
                    <div className="bg-surface-0 border border-border-base rounded-xl px-3 py-2 text-xs font-mono text-text-primary">{counterSurat}</div>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted font-medium">Preview Live (Berikutnya)</label>
                    <div className="bg-surface-0 border border-border-base rounded-xl px-3 py-2 text-xs font-mono text-brand truncate">
                      {previewNomor(templateNomorSurat, Number(nomorAwalSurat) || 1, counterSurat)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["{no}", "{tahun}", "{bulan_romawi}", "{bulan}"].map((ph) => (
                    <button
                      key={ph}
                      type="button"
                      onClick={() => appendPlaceholder("surat", ph)}
                      className="px-2 py-0.5 bg-surface-0 hover:bg-surface-2 border border-border-base text-text-secondary text-xs rounded-lg transition-all font-mono cursor-pointer"
                    >
                      +{ph}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-text-primary">Sertifikat</h4>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted font-medium">Template Format</label>
                  <input
                    type="text"
                    value={templateNomorSertifikat}
                    onChange={(e) => setTemplateNomorSertifikat(e.target.value)}
                    placeholder="CERT/MDI/{tahun}/{no}"
                    className="w-full bg-surface-0 border border-border-base text-text-primary px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none text-sm"
                  />
                  {!templateNomorSertifikat.includes("{no}") && <p className="text-xs text-red-500">Wajib menyertakan placeholder &#123;no&#125;</p>}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted font-medium">Nomor Awal Counter</label>
                    <input
                      type="number"
                      min="1"
                      value={nomorAwalSertifikat}
                      onChange={(e) => setNomorAwalSertifikat(e.target.value)}
                      className="w-full bg-surface-0 border border-border-base text-text-primary px-4 py-2 rounded-xl focus:ring-2 focus:ring-orange-600 outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted font-medium">Counter Saat Ini</label>
                    <div className="bg-surface-0 border border-border-base rounded-xl px-3 py-2 text-xs font-mono text-text-primary">{counterSertifikat}</div>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted font-medium">Preview Live (Berikutnya)</label>
                    <div className="bg-surface-0 border border-border-base rounded-xl px-3 py-2 text-xs font-mono text-brand truncate">
                      {previewNomor(templateNomorSertifikat, Number(nomorAwalSertifikat) || 1, counterSertifikat)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["{no}", "{tahun}", "{bulan_romawi}", "{bulan}"].map((ph) => (
                    <button
                      key={ph}
                      type="button"
                      onClick={() => appendPlaceholder("sertifikat", ph)}
                      className="px-2 py-0.5 bg-surface-0 hover:bg-surface-2 border border-border-base text-text-secondary text-xs rounded-lg transition-all font-mono cursor-pointer"
                    >
                      +{ph}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="w-full bg-surface-2 hover:bg-zinc-700 text-text-primary font-bold py-3 rounded-xl transition-all border border-border-strong cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "Menyimpan..." : "Simpan Format Nomor"}
            </button>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-surface-1 border border-border-base rounded-3xl p-8 shadow-sm">
            <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-brand" />
              Notifikasi Sistem
            </h3>
            <div className="flex items-center justify-between p-4 bg-surface-0 border border-border-base rounded-2xl">
              <div>
                <p className="text-text-primary font-medium">Email Otomatis</p>
                <p className="text-xs text-text-muted">Kirim email otomatis ke pendaftar.</p>
              </div>
              <button
                type="button"
                onClick={handleToggleNotification}
                className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${emailNotification ? "bg-brand" : "bg-surface-2"}`}
                aria-label="Toggle notifikasi email"
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full transition-all ${emailNotification ? "right-1 bg-white" : "left-1 bg-zinc-600"}`} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default WebsiteSettings;
