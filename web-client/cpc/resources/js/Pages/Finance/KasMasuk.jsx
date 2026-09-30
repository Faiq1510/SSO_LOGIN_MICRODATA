import { Head, useForm, router } from "@inertiajs/react";
import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Edit3, Trash2 } from "lucide-react";

const MAX_NOMINAL = 1000000000000;

function formatRupiah(value) {
    return "Rp " + new Intl.NumberFormat("id-ID").format(value ?? 0);
}

function formatRibuan(value) {
    if (value === "" || value === null || value === undefined) return "";
    const angka = String(value).replace(/\D/g, "");
    if (angka === "") return "";
    return new Intl.NumberFormat("id-ID").format(Number(angka));
}

function parseRibuan(value) {
    const angka = value.replace(/\D/g, "");
    if (angka === "") return "";
    const numeric = Number(angka);
    return String(Math.min(numeric, MAX_NOMINAL));
}

// Harus persis sama dengan App\Models\AkunReferensi::TIPE_NERACA_MASUK /
// StoreAkunReferensiRequest, supaya label & warnanya konsisten di semua halaman.
const TIPE_NERACA_LABELS = {
    modal: "Modal (setoran owner)",
    pendapatan: "Pendapatan (termin klien, dll)",
    beban: "Beban (upah, sewa, operasional)",
    pembelian_aset: "Pembelian Aset (beli material)",
    liabilitas: "Liabilitas (utang ke pihak ketiga)",
};

const TIPE_NERACA_STYLES = {
    modal: "bg-violet-50 text-violet-700 border-violet-200",
    pendapatan: "bg-emerald-50 text-emerald-700 border-emerald-200",
    beban: "bg-amber-50 text-amber-700 border-amber-200",
    pembelian_aset: "bg-sky-50 text-sky-700 border-sky-200",
    liabilitas: "bg-rose-50 text-rose-700 border-rose-200",
};

function TipeNeracaBadge({ tipeNeraca }) {
    if (!tipeNeraca) return null;
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                TIPE_NERACA_STYLES[tipeNeraca] ??
                "bg-slate-100 text-slate-600 border-slate-200"
            }`}
        >
            {TIPE_NERACA_LABELS[tipeNeraca] ?? tipeNeraca}
        </span>
    );
}

export default function KasMasuk({
    kasMasuk = [],
    totalBulanIni = 0,
    akunOptions = [],
}) {
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            tanggal: "",
            akun_referensi_id: "",
            keterangan: "",
            nominal: "",
            dari: "",
            untuk: "",
        });

    function openCreateForm() {
        setEditingItem(null);
        reset();
        clearErrors();
        setShowForm(true);
    }

    function openEditForm(item) {
        setEditingItem(item);
        clearErrors();
        setData({
            tanggal: item.tanggal ? item.tanggal.substring(0, 10) : "",
            akun_referensi_id: item.akun_referensi_id || "",
            keterangan: item.keterangan || "",
            nominal: item.nominal || "",
            dari: item.dari || "",
            untuk: item.untuk || "",
        });
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditingItem(null);
        reset();
        clearErrors();
    }

    function submit(e) {
        e.preventDefault();
        if (editingItem) {
            put(route("finance.kas-masuk.update", editingItem.id), {
                onSuccess: () => closeForm(),
            });
        } else {
            post(route("finance.kas-masuk.store"), {
                onSuccess: () => closeForm(),
            });
        }
    }

    function handleDelete() {
        if (!deletingItem) return;
        router.delete(route("finance.kas-masuk.destroy", deletingItem.id), {
            onSuccess: () => setDeletingItem(null),
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Kas Masuk" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Kas Masuk</h1>
                    <p className="text-sm text-muted-foreground">
                        Jurnal dana masuk untuk pembangunan proyek
                    </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm max-w-sm">
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                        Total kas masuk bulan ini
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                        {formatRupiah(totalBulanIni)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {kasMasuk.length} jurnal kas masuk
                    </p>
                </div>

                <div className="rounded-2xl border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between p-6 pb-4">
                        <h2 className="text-lg font-bold">Jurnal Kas Masuk</h2>
                        <button
                            onClick={openCreateForm}
                            className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            + Catat Kas Masuk
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                                    <th className="px-6 py-3">Tanggal</th>
                                    <th className="px-6 py-3">Akun</th>
                                    <th className="px-6 py-3">Keterangan</th>
                                    <th className="px-6 py-3">Nominal</th>
                                    <th className="px-6 py-3">Dari</th>
                                    <th className="px-6 py-3">Untuk</th>
                                    <th className="px-6 py-3">Minggu ke-</th>
                                    <th className="px-6 py-3 text-right">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {kasMasuk.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(
                                                item.tanggal,
                                            ).toLocaleDateString("id-ID", {
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-6 py-4 font-medium whitespace-nowrap">
                                            {item.akun_referensi?.nama_akun}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground min-w-[200px]">
                                            {item.keterangan || "-"}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-emerald-600 whitespace-nowrap">
                                            {formatRupiah(item.nominal)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.dari}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.untuk}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            Minggu ke-{item.minggu_ke}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    aria-label={`Edit catatan kas masuk ${item.keterangan || item.id}`}
                                                    onClick={() => openEditForm(item)}
                                                    title="Edit"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sky-600 hover:bg-sky-50 transition-colors"
                                                >
                                                    <Edit3 size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={`Hapus catatan kas masuk ${item.keterangan || item.id}`}
                                                    onClick={() => setDeletingItem(item)}
                                                    title="Hapus"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {kasMasuk.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-6 py-8 text-center text-muted-foreground"
                                        >
                                            Belum ada jurnal kas masuk.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL FORM: TAMBAH / EDIT */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={closeForm}
                    />

                    {/* modal content */}
                    <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold">
                                {editingItem
                                    ? "Edit Kas Masuk"
                                    : "Catat Kas Masuk"}
                            </h2>
                            <button
                                type="button"
                                aria-label="Tutup form kas masuk"
                                onClick={closeForm}
                                className="cursor-pointer rounded-full p-2 hover:bg-muted text-muted-foreground transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submit} className="mt-4 space-y-4">
                            <div>
                                <label className="text-sm font-medium">
                                    Tanggal
                                </label>
                                <input
                                    type="date"
                                    className="mt-1 w-full rounded-xl border border-border px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    value={data.tanggal}
                                    onChange={(e) =>
                                        setData("tanggal", e.target.value)
                                    }
                                />
                                {errors.tanggal && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {errors.tanggal}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="akun-referensi-select" className="text-sm font-medium">
                                    Akun
                                </label>
                                <select
                                    id="akun-referensi-select"
                                    className="mt-1 w-full rounded-xl border border-border px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    value={data.akun_referensi_id}
                                    onChange={(e) =>
                                        setData(
                                            "akun_referensi_id",
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">
                                        Pilih akun / sumber dana
                                    </option>
                                    {akunOptions.map((akun) => (
                                        <option key={akun.id} value={akun.id}>
                                            {akun.nama_akun}
                                        </option>
                                    ))}
                                </select>
                                {errors.akun_referensi_id && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {errors.akun_referensi_id}
                                    </p>
                                )}
                                {data.akun_referensi_id && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            Tipe Neraca:
                                        </span>
                                        <TipeNeracaBadge
                                            tipeNeraca={
                                                akunOptions.find(
                                                    (a) =>
                                                        String(a.id) ===
                                                        String(
                                                            data.akun_referensi_id,
                                                        ),
                                                )?.tipe_neraca
                                            }
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium">
                                    Keterangan{" "}
                                    <span className="text-xs text-muted-foreground font-normal">
                                        (Opsional)
                                    </span>
                                </label>
                                <textarea
                                    rows={3}
                                    className="mt-1 w-full rounded-xl border border-border px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    value={data.keterangan}
                                    onChange={(e) =>
                                        setData("keterangan", e.target.value)
                                    }
                                    placeholder="Tulis detail jika diperlukan..."
                                />
                                {errors.keterangan && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {errors.keterangan}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium">
                                    Nominal
                                </label>
                                <div className="relative mt-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        Rp
                                    </span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        className="w-full rounded-xl border border-border py-2 pl-9 pr-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        value={formatRibuan(data.nominal)}
                                        onChange={(e) =>
                                            setData(
                                                "nominal",
                                                parseRibuan(e.target.value),
                                            )
                                        }
                                    />
                                </div>
                                {errors.nominal && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {errors.nominal}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium">
                                    Dari
                                </label>
                                <input
                                    type="text"
                                    className="mt-1 w-full rounded-xl border border-border px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    value={data.dari}
                                    onChange={(e) =>
                                        setData("dari", e.target.value)
                                    }
                                    placeholder="Contoh: Owner / Investor"
                                />
                                {errors.dari && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {errors.dari}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium">
                                    Untuk
                                </label>
                                <input
                                    type="text"
                                    className="mt-1 w-full rounded-xl border border-border px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    value={data.untuk}
                                    onChange={(e) =>
                                        setData("untuk", e.target.value)
                                    }
                                    placeholder="Contoh: Kas Proyek SiteFlow"
                                />
                                {errors.untuk && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {errors.untuk}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="cursor-pointer rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-70"
                                >
                                    {processing ? "Menyimpan..." : "Simpan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI HAPUS */}
            {deletingItem && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setDeletingItem(null)}
                    />
                    <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <span className="text-xl text-red-600">!</span>
                        </div>
                        <h3 className="text-lg font-bold">Hapus Kas Masuk?</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Apakah Anda yakin ingin menghapus catatan kas masuk
                            sebesar{" "}
                            <span className="font-bold text-foreground">
                                {formatRupiah(deletingItem.nominal)}
                            </span>
                            ? Data yang sudah dihapus tidak dapat dikembalikan.
                        </p>

                        <div className="mt-6 flex justify-center gap-3">
                            <button
                                onClick={() => setDeletingItem(null)}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                            >
                                Ya, Hapus Data
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
