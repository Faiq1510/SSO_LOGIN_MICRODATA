import { useEffect, useMemo, useState } from "react";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import AlertDialog from "@/Components/AlertDialog";
import {
    Pencil,
    Trash2,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    X,
} from "lucide-react";

function formatRupiah(n) {
    const num = Number(n) || 0;
    return "Rp " + Math.round(num).toLocaleString("id-ID");
}

function highlightMatch(text, keyword) {
    if (!keyword.trim()) return text;
    const regex = new RegExp(`(${keyword})`, "ig");
    const parts = text.split(regex);
    return parts.map((part, index) =>
        regex.test(part) ? (
            <mark
                key={index}
                className="rounded bg-yellow-200 px-0.5 text-black"
            >
                {part}
            </mark>
        ) : (
            part
        ),
    );
}

// Kolom yang bisa disortir. key = null artinya kolom tidak bisa diklik.
const TABLE_COLUMNS = [
    { label: "Kode", key: "kode_material" },
    { label: "Nama Material", key: "nama_material" },
    { label: "Kategori", key: null },
    { label: "Satuan", key: null },
    { label: "Harga Acuan", key: "harga" },
    { label: "Aksi", key: null, align: "right" },
];

// Pilihan jumlah baris per halaman
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function MaterialIndex({
    materials,
    kategoriOptions,
    satuanOptions,
    filters,
    nextKodeMaterial,
}) {
    const { flash, auth } = usePage().props;
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null); // material row being edited, or null = add mode
    const [deletingMaterial, setDeletingMaterial] = useState(null);
    const [notification, setNotification] = useState(() => {
        const message = flash?.error ?? flash?.info;
        return message
            ? { type: flash?.error ? "error" : "info", message }
            : null;
    });
    const [query, setQuery] = useState(filters?.q || "");
    const [kategoriFilter, setKategoriFilter] = useState(
        filters?.kategori || "Semua",
    );
    const [sortBy, setSortBy] = useState(filters?.sortBy || null); // "kode_material" | "nama_material" | "harga" | null
    const [sortDir, setSortDir] = useState(filters?.sortDir || "asc"); // "asc" | "desc"
    const [pageSize, setPageSize] = useState(filters?.pageSize || 10);

    const form = useForm({
        kode_material: "",
        nama_material: "",
        satuan: satuanOptions[0],
        kategori: kategoriOptions[0],
        harga: 0,
    });

    function toggleSort(key) {
        if (sortBy === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(key);
            // default arah: harga dari mahal ke murah, teks dari A ke Z
            setSortDir(key === "harga" ? "desc" : "asc");
        }
    }

    useEffect(() => {
        const params = {};
        if (query) params.q = query;
        if (kategoriFilter && kategoriFilter !== "Semua")
            params.kategori = kategoriFilter;
        if (sortBy) {
            params.sortBy = sortBy;
            params.sortDir = sortDir;
        }
        if (pageSize !== 10) params.pageSize = pageSize;

        const delayDebounceFn = setTimeout(() => {
            router.get(route("material.index"), params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query, kategoriFilter, sortBy, sortDir, pageSize]);

    useEffect(() => {
        const message = flash?.error ?? flash?.info;
        setNotification(
            message ? { type: flash?.error ? "error" : "info", message } : null,
        );
    }, [flash?.error, flash?.info]);

    function openAdd() {
        setEditTarget(null);
        form.reset();
        form.clearErrors();
        form.setData({
            kode_material: nextKodeMaterial,
            nama_material: "",
            satuan: satuanOptions[0],
            kategori: kategoriOptions[0],
            harga: 0,
        });
        setDrawerOpen(true);
    }

    function openEdit(m) {
        setEditTarget(m);
        form.clearErrors();
        form.setData({
            kode_material: m.kode_material,
            nama_material: m.nama_material,
            satuan: m.satuan,
            kategori: m.kategori,
            harga: m.harga,
        });
        setDrawerOpen(true);
    }

    function closeDrawer() {
        setDrawerOpen(false);
        setEditTarget(null);
        form.clearErrors();
    }

    function handleSave(e) {
        e.preventDefault();
        if (editTarget) {
            form.put(route("material.update", editTarget.id), {
                preserveScroll: true,
                onSuccess: () => closeDrawer(),
            });
        } else {
            form.post(route("material.store"), {
                preserveScroll: true,
                onSuccess: () => closeDrawer(),
            });
        }
    }

    function handleDelete(material) {
        if (!material.can_delete) {
            setNotification({
                type: "error",
                message:
                    material.delete_reason ||
                    "Data material ini tidak bisa dihapus karena sudah digunakan.",
            });
            return;
        }

        setDeletingMaterial(material);
    }

    function confirmDelete() {
        if (!deletingMaterial) return;
        router.delete(route("material.destroy", deletingMaterial.id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                if (editTarget?.id === deletingMaterial.id) {
                    closeDrawer();
                }
                setDeletingMaterial(null);
            },
        });
    }

    return (
        <AuthenticatedLayout auth={usePage().props.auth}>
            <Head title="Master Material" />

            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold">Master Material</h1>
                    <p className="text-sm text-muted-foreground"></p>
                </div>
                {flash?.success && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                        {flash.error}
                    </div>
                )}
                {flash?.info && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                        {flash.info}
                    </div>
                )}

                {/* ── Table ───────────────────────────────────────────── */}
                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="font-bold">
                            Daftar Material ({materials.total})
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Cari kode atau nama..."
                                className="rounded-xl border border-border bg-white px-3 py-2 text-xs outline-none focus:border-primary"
                            />
                            <label
                                htmlFor="kategori-filter"
                                className="sr-only"
                            >
                                Filter kategori material
                            </label>

                            <select
                                id="kategori-filter"
                                value={kategoriFilter}
                                onChange={(e) =>
                                    setKategoriFilter(e.target.value)
                                }
                                className="rounded-xl border border-border bg-white px-3 py-2 text-xs outline-none focus:border-primary"
                            >
                                <option>Semua</option>
                                {kategoriOptions.map((k) => (
                                    <option key={k}>{k}</option>
                                ))}
                            </select>
                            <label htmlFor="page-size" className="sr-only">
                                Baris per halaman
                            </label>

                            <select
                                id="page-size"
                                value={pageSize}
                                onChange={(e) =>
                                    setPageSize(Number(e.target.value))
                                }
                                className="rounded-xl border border-border bg-white px-3 py-2 text-xs outline-none focus:border-primary"
                            >
                                {PAGE_SIZE_OPTIONS.map((n) => (
                                    <option key={n} value={n}>
                                        {n} / halaman
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                aria-label="Tambah material baru"
                                onClick={openAdd}
                                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                            >
                                + Tambah Material
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[660px] text-sm">
                            <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    {TABLE_COLUMNS.map((col) => (
                                        <th
                                            key={col.label}
                                            onClick={
                                                col.key
                                                    ? () => toggleSort(col.key)
                                                    : undefined
                                            }
                                            className={`px-4 py-3 font-semibold ${
                                                col.align === "right"
                                                    ? "text-right"
                                                    : "text-left"
                                            } ${col.key ? "cursor-pointer select-none hover:text-foreground" : ""}`}
                                        >
                                            <span
                                                className={`inline-flex items-center gap-1 ${
                                                    col.align === "right"
                                                        ? "justify-end w-full"
                                                        : ""
                                                }`}
                                            >
                                                {col.label}
                                                {col.key &&
                                                    (sortBy === col.key ? (
                                                        sortDir === "asc" ? (
                                                            <ArrowUp
                                                                size={12}
                                                            />
                                                        ) : (
                                                            <ArrowDown
                                                                size={12}
                                                            />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown
                                                            size={12}
                                                            className="opacity-40"
                                                        />
                                                    ))}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {materials.data.map((m) => (
                                    <tr
                                        key={m.id}
                                        className={`border-t border-border hover:bg-secondary/50 ${
                                            editTarget?.id === m.id
                                                ? "bg-primary/5"
                                                : ""
                                        }`}
                                    >
                                        <td className="px-4 py-3 font-mono text-xs font-bold text-primary">
                                            {highlightMatch(
                                                m.kode_material,
                                                query,
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-semibold">
                                            {highlightMatch(
                                                m.nama_material,
                                                query,
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                                                {m.kategori}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {m.satuan}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs font-semibold">
                                            {formatRupiah(m.harga)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                aria-label={`Edit material ${m.nama_material}`}
                                                onClick={() => openEdit(m)}
                                                title="Edit"
                                                className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sky-600 hover:bg-sky-50 transition-colors"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                aria-label={`Hapus material ${m.nama_material}`}
                                                onClick={() => handleDelete(m)}
                                                title="Hapus"
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {materials.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-10 text-center text-sm text-muted-foreground"
                                        >
                                            Tidak ada material yang cocok.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* ── Pagination footer ──────────────────────────────── */}
                    {materials.total > 0 && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                            <span>
                                Menampilkan {materials.from}–{materials.to} dari{" "}
                                {materials.total} data
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (materials.prev_page_url) {
                                            const url = new URL(
                                                materials.prev_page_url,
                                            );
                                            url.searchParams.set("q", query);
                                            if (kategoriFilter !== "Semua")
                                                url.searchParams.set(
                                                    "kategori",
                                                    kategoriFilter,
                                                );
                                            if (sortBy) {
                                                url.searchParams.set(
                                                    "sortBy",
                                                    sortBy,
                                                );
                                                url.searchParams.set(
                                                    "sortDir",
                                                    sortDir,
                                                );
                                            }
                                            if (pageSize !== 10)
                                                url.searchParams.set(
                                                    "pageSize",
                                                    pageSize,
                                                );
                                            router.get(
                                                url.href,
                                                {},
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                },
                                            );
                                        }
                                    }}
                                    disabled={!materials.prev_page_url}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-40 hover:bg-secondary/50"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <span className="font-semibold text-foreground">
                                    Halaman {materials.current_page} /{" "}
                                    {materials.last_page}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (materials.next_page_url) {
                                            const url = new URL(
                                                materials.next_page_url,
                                            );
                                            url.searchParams.set("q", query);
                                            if (kategoriFilter !== "Semua")
                                                url.searchParams.set(
                                                    "kategori",
                                                    kategoriFilter,
                                                );
                                            if (sortBy) {
                                                url.searchParams.set(
                                                    "sortBy",
                                                    sortBy,
                                                );
                                                url.searchParams.set(
                                                    "sortDir",
                                                    sortDir,
                                                );
                                            }
                                            if (pageSize !== 10)
                                                url.searchParams.set(
                                                    "pageSize",
                                                    pageSize,
                                                );
                                            router.get(
                                                url.href,
                                                {},
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                },
                                            );
                                        }
                                    }}
                                    disabled={!materials.next_page_url}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-40 hover:bg-secondary/50"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modal: Tambah / Edit Material ───────────────────────── */}
            {drawerOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                    onClick={closeDrawer}
                >
                    <div
                        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">
                                {editTarget
                                    ? "Edit Material"
                                    : "Tambah Material Baru"}
                            </h2>
                            <button
                                onClick={closeDrawer}
                                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Kode Material
                                </span>
                                <input
                                    value={form.data.kode_material}
                                    onChange={(e) =>
                                        form.setData(
                                            "kode_material",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="MT061"
                                    className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm font-mono outline-none focus:border-primary"
                                />
                                {form.errors.kode_material && (
                                    <span className="mt-1 block text-xs text-red-600">
                                        {form.errors.kode_material}
                                    </span>
                                )}
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Nama Material
                                </span>
                                <input
                                    value={form.data.nama_material}
                                    onChange={(e) =>
                                        form.setData(
                                            "nama_material",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Nama material"
                                    className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                                />
                                {form.errors.nama_material && (
                                    <span className="mt-1 block text-xs text-red-600">
                                        {form.errors.nama_material}
                                    </span>
                                )}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Kategori
                                    </span>
                                    <select
                                        value={form.data.kategori}
                                        onChange={(e) =>
                                            form.setData(
                                                "kategori",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                                    >
                                        {kategoriOptions.map((k) => (
                                            <option key={k}>{k}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Satuan
                                    </span>
                                    <select
                                        value={form.data.satuan}
                                        onChange={(e) =>
                                            form.setData(
                                                "satuan",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                                    >
                                        {satuanOptions.map((s) => (
                                            <option key={s}>{s}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Harga Acuan (Rp)
                                </span>
                                <input
                                    type="number"
                                    min={0}
                                    value={form.data.harga}
                                    onChange={(e) =>
                                        form.setData("harga", e.target.value)
                                    }
                                    className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm font-mono outline-none focus:border-primary"
                                />
                                {form.errors.harga && (
                                    <span className="mt-1 block text-xs text-red-600">
                                        {form.errors.harga}
                                    </span>
                                )}
                                <span className="mt-1 block text-xs text-muted-foreground">
                                    {formatRupiah(form.data.harga)}
                                </span>
                            </label>
                            <div className="mt-2 flex gap-2">
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
                                >
                                    {form.processing
                                        ? "Menyimpan..."
                                        : "Simpan"}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeDrawer}
                                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deletingMaterial && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                    onClick={() => setDeletingMaterial(null)}
                >
                    <div
                        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="mb-2 text-lg font-semibold text-slate-900">
                            Hapus Material?
                        </h2>
                        <p className="mb-6 text-sm text-slate-500">
                            Material{" "}
                            <span className="font-medium text-slate-700">
                                {deletingMaterial.nama_material}
                            </span>{" "}
                            ({deletingMaterial.kode_material}) akan dihapus
                            permanen. Histori transaksi lama tidak ikut
                            terhapus.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setDeletingMaterial(null)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <AlertDialog
                open={Boolean(notification)}
                title={
                    notification?.type === "error"
                        ? "Tidak bisa menghapus material"
                        : "Informasi"
                }
                message={notification?.message}
                danger={notification?.type === "error"}
                confirmText="Tutup"
                onClose={() => setNotification(null)}
            />
        </AuthenticatedLayout>
    );
}
