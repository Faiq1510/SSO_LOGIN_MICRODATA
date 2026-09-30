import { Head, useForm, router } from "@inertiajs/react";
import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Edit3, Trash2 } from "lucide-react";

function formatRupiah(value) {
    return "Rp " + new Intl.NumberFormat("id-ID").format(value ?? 0);
}

export default function KasKeluar({ kasKeluar = [], akunOptions = [], unitOptions = [] }) {
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        tanggal: "",
        akun_referensi_id: "",
        unit: "",
        keterangan: "",
        nominal_per_unit: "",
        metode_bayar: "transfer",
        penerima: "",
        lampiran: null,
        _method: "post", // Penting untuk trik PUT request dengan file upload
    });

    const total = Number(data.nominal_per_unit) || 0;

    function openCreateForm() {
        setEditingItem(null);
        reset();
        clearErrors();
        setData((prev) => ({ ...prev, _method: "post" }));
        setShowForm(true);
    }

    function openEditForm(item) {
        setEditingItem(item);
        clearErrors();
        setData({
            tanggal: item.tanggal ? item.tanggal.substring(0, 10) : "",
            akun_referensi_id: item.akun_referensi_id || "",
            unit: item.unit || "",
            keterangan: item.keterangan || "",
            nominal_per_unit: item.nominal_per_unit || "",
            metode_bayar: item.metode_bayar || "transfer",
            penerima: item.penerima || "",
            lampiran: null, // Lampiran dikosongkan secara default saat edit (tidak wajib diisi lagi)
            _method: "put", // Beritahu Laravel bahwa ini sebenarnya request PUT
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
            // Walaupun route update (PUT), kita pakai post() karena ada form data/file upload
            post(route("finance.kas-keluar.update", editingItem.id), {
                forceFormData: true,
                onSuccess: () => closeForm(),
            });
        } else {
            post(route("finance.kas-keluar.store"), {
                forceFormData: true,
                onSuccess: () => closeForm(),
            });
        }
    }

    function handleDelete() {
        if (!deletingItem) return;
        router.delete(route("finance.kas-keluar.destroy", deletingItem.id), {
            onSuccess: () => setDeletingItem(null),
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Kas Keluar" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Kas Keluar</h1>
                        <p className="text-sm text-muted-foreground">
                            Jurnal pengeluaran proyek selain pembelian material
                            gudang
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between p-6 pb-4">
                        <h2 className="text-lg font-bold">Jurnal Kas Keluar</h2>
                        <button
                            onClick={openCreateForm}
                            className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            + Catat Kas Keluar
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                                    <th className="px-6 py-3">Tanggal</th>
                                    <th className="px-6 py-3">Nama Akun</th>
                                    <th className="px-6 py-3">Unit</th>
                                    <th className="px-6 py-3">Keterangan</th>
                                    <th className="px-6 py-3">Nominal</th>
                                    <th className="px-6 py-3">Total</th>
                                    <th className="px-6 py-3">Lampiran</th>
                                    <th className="px-6 py-3 text-right">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {kasKeluar.map((item) => (
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
                                        <td className="px-6 py-4 text-primary whitespace-nowrap">
                                            {item.unit || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground min-w-[200px]">
                                            {item.keterangan || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {formatRupiah(
                                                item.nominal_per_unit,
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-semibold whitespace-nowrap">
                                            {formatRupiah(item.total)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.lampiran_url ? (
                                                <a
                                                    href={item.lampiran_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-primary underline hover:text-primary/80 transition-colors"
                                                >
                                                    Lihat
                                                </a>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    aria-label={`Edit catatan kas keluar ${item.keterangan || item.id}`}
                                                    onClick={() => openEditForm(item)}
                                                    title="Edit"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sky-600 hover:bg-sky-50 transition-colors"
                                                >
                                                    <Edit3 size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={`Hapus catatan kas keluar ${item.keterangan || item.id}`}
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
                                {kasKeluar.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-6 py-8 text-center text-muted-foreground"
                                        >
                                            Belum ada jurnal kas keluar.
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
                    <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold">
                                    {editingItem
                                        ? "Edit Kas Keluar"
                                        : "Catat Kas Keluar"}
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    SPJ{" "}
                                    {editingItem
                                        ? "diperbarui"
                                        : "dibuat otomatis"}{" "}
                                    saat disimpan.
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-label="Tutup form kas keluar"
                                onClick={closeForm}
                                className="cursor-pointer rounded-full p-2 hover:bg-muted text-muted-foreground transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form
                            onSubmit={submit}
                            className="mt-4 grid grid-cols-2 gap-4"
                        >
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
                                    Nama Akun
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
                                    <option value="">Pilih akun</option>
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
                            </div>

                            <div>
                                <label htmlFor="unit-select" className="text-sm font-medium">
                                    Unit{" "}
                                    <span className="text-xs text-muted-foreground font-normal">
                                        (Opsional)
                                    </span>
                                </label>
                                <select
                                    id="unit-select"
                                    className="mt-1 w-full rounded-xl border border-border px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    value={data.unit}
                                    onChange={(e) =>
                                        setData("unit", e.target.value)
                                    }
                                >
                                    <option value="">Pilih unit</option>
                                    {unitOptions.map((unit) => (
                                        <option key={unit.id} value={unit.nama_unit}>
                                            {unit.nama_unit}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">
                                    Keterangan
                                </label>
                                <input
                                    type="text"
                                    className="mt-1 w-full rounded-xl border border-border px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    value={data.keterangan}
                                    onChange={(e) =>
                                        setData("keterangan", e.target.value)
                                    }
                                />
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
                                        value={
                                            data.nominal_per_unit === "" ||
                                            data.nominal_per_unit === null
                                                ? ""
                                                : new Intl.NumberFormat(
                                                      "id-ID",
                                                  ).format(
                                                      Number(
                                                          data.nominal_per_unit,
                                                      ),
                                                  )
                                        }
                                        onChange={(e) =>
                                            setData(
                                                "nominal_per_unit",
                                                e.target.value.replace(
                                                    /\D/g,
                                                    "",
                                                ),
                                            )
                                        }
                                    />
                                </div>
                                {errors.nominal_per_unit && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {errors.nominal_per_unit}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="metode-bayar-select" className="text-sm font-medium">
                                    Metode Bayar
                                </label>
                                <select
                                    id="metode-bayar-select"
                                    className="mt-1 w-full rounded-xl border border-border px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    value={data.metode_bayar}
                                    onChange={(e) =>
                                        setData("metode_bayar", e.target.value)
                                    }
                                >
                                    <option value="transfer">Transfer</option>
                                    <option value="tunai">Tunai</option>
                                </select>
                            </div>

                            <div className="col-span-2">
                                <label className="text-sm font-medium">
                                    Penerima
                                </label>
                                <input
                                    type="text"
                                    className="mt-1 w-full rounded-xl border border-border px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    value={data.penerima}
                                    onChange={(e) =>
                                        setData("penerima", e.target.value)
                                    }
                                />
                            </div>

                            <div className="col-span-2">
                                <label htmlFor="lampiran-bukti" className="text-sm font-medium">
                                    Lampiran No Bukti (opsional, maks 10MB)
                                </label>
                                {editingItem && editingItem.lampiran_url && (
                                    <p className="text-xs mb-1 text-emerald-600">
                                        ✓ Ada lampiran tersimpan. (Abaikan jika
                                        tidak ingin mengganti file lama)
                                    </p>
                                )}
                                <input
                                    id="lampiran-bukti"
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    className="mt-1 w-full rounded-xl border border-border px-3 py-2 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                                    onChange={(e) =>
                                        setData(
                                            "lampiran",
                                            e.target.files[0] ?? null,
                                        )
                                    }
                                />
                                {errors.lampiran && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {errors.lampiran}
                                    </p>
                                )}
                            </div>

                            <div className="col-span-2 rounded-xl bg-secondary/50 p-3 text-sm">
                                Total:{" "}
                                <span className="font-semibold">
                                    {formatRupiah(total)}
                                </span>
                            </div>

                            <div className="col-span-2 flex justify-end gap-2 pt-2">
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
                        <h3 className="text-lg font-bold">Hapus Kas Keluar?</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Apakah Anda yakin ingin menghapus catatan kas keluar
                            sebesar{" "}
                            <span className="font-bold text-foreground">
                                {formatRupiah(deletingItem.total)}
                            </span>
                            ?
                            {deletingItem.lampiran_url &&
                                " File lampiran yang terkait juga akan dihapus."}
                            Data yang sudah dihapus tidak dapat dikembalikan.
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