import { useState, useEffect, useRef } from "react";
import { useForm, router, usePage } from "@inertiajs/react";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import ConfirmDialog from "@/Components/ConfirmDialog";
import AlertDialog from "@/Components/AlertDialog";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const KATEGORI_OPTIONS = [
    { value: "HPP", label: "HPP" },
    { value: "OPEX", label: "OPEX" },
    { value: "CAPEX", label: "CAPEX" },
];

const TIPE_NERACA_OPTIONS = [
    { value: "modal", label: "Modal (setoran owner)" },
    { value: "pendapatan", label: "Pendapatan (termin klien, dll)" },
    { value: "beban", label: "Beban (upah, sewa, operasional)" },
    { value: "pembelian_aset", label: "Pembelian Aset (beli material)" },
    { value: "liabilitas", label: "Liabilitas (utang ke pihak ketiga)" },
];

// Tipe neraca yang otomatis dianggap "jenis = masuk" (harus sama persis
// dengan App\Models\AkunReferensi::TIPE_NERACA_MASUK di backend).
const TIPE_NERACA_MASUK = ["modal", "pendapatan", "liabilitas"];

const TIPE_NERACA_LABELS = Object.fromEntries(
    TIPE_NERACA_OPTIONS.map((opt) => [opt.value, opt.label]),
);

function KategoriBadge({ kategori }) {
    const isHpp = kategori === "HPP";
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                isHpp
                    ? "bg-teal-50 text-teal-700 border-teal-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
        >
            {kategori}
        </span>
    );
}

function TipeNeracaBadge({ tipeNeraca }) {
    const styles = {
        modal: "bg-violet-50 text-violet-700 border-violet-200",
        pendapatan: "bg-emerald-50 text-emerald-700 border-emerald-200",
        beban: "bg-amber-50 text-amber-700 border-amber-200",
        pembelian_aset: "bg-sky-50 text-sky-700 border-sky-200",
        liabilitas: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                styles[tipeNeraca] ??
                "bg-slate-100 text-slate-600 border-slate-200"
            }`}
        >
            {TIPE_NERACA_LABELS[tipeNeraca] ?? tipeNeraca ?? "-"}
        </span>
    );
}

function JenisBadge({ tipeNeraca }) {
    const jenis = TIPE_NERACA_MASUK.includes(tipeNeraca) ? "masuk" : "keluar";
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                jenis === "masuk"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-red-50 text-red-600 border-red-200"
            }`}
        >
            {jenis === "masuk" ? "Kas Masuk" : "Kas Keluar"}
        </span>
    );
}

function AkunModal({
    open,
    onClose,
    editingAkun,
    parentOptions = [],
    akunList = [],
}) {
    const isEdit = Boolean(editingAkun);
    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            kode_akun: "",
            nama_akun: "",
            kategori: "HPP",
            tipe_neraca: "beban",
            tipe_akun: "induk",
            parent_id: "",
            children_ids: [],
        });

    let initialKode = editingAkun?.kode_akun ?? "";
    if (editingAkun?.parent_id && editingAkun?.parent_code) {
        initialKode = initialKode.replace(`${editingAkun.parent_code}-`, "");
    }

    let initialChildrenIds = [];
    if (editingAkun && !editingAkun.parent_id) {
        initialChildrenIds = akunList
            .filter((a) => a.parent_id === editingAkun.id)
            .map((a) => a.id.toString());
    }

    useEffect(() => {
        if (open) {
            let kode = editingAkun?.kode_akun ?? "";
            if (editingAkun?.parent_id && editingAkun?.parent_code) {
                kode = kode.replace(`${editingAkun.parent_code}-`, "");
            }

            let children = [];
            if (editingAkun && !editingAkun.parent_id) {
                children = akunList
                    .filter((a) => a.parent_id === editingAkun.id)
                    .map((a) => a.id.toString());
            }

            setData({
                kode_akun: kode,
                nama_akun: editingAkun?.nama_akun ?? "",
                kategori: editingAkun?.kategori ?? "HPP",
                tipe_neraca: editingAkun?.tipe_neraca ?? "beban",
                tipe_akun: editingAkun?.tipe_akun ?? "induk",
                parent_id: editingAkun?.parent_id ?? "",
                children_ids: children,
            });
            setAkunType(editingAkun?.tipe_akun ?? "induk");
            clearErrors();
        }
    }, [open, editingAkun]);

    const parentIdsInUse = new Set(
        akunList.filter((a) => a.parent_id).map((a) => a.parent_id),
    );

    const subAccountOptions = akunList.filter((a) => {
        if (a.id === editingAkun?.id) return false;

        // Akun yang sudah "berjenis" induk tidak boleh dijadikan sub akun,
        // walaupun belum punya sub akun sama sekali.
        if (a.tipe_akun === "induk") return false;

        if (a.parent_id) {
            return editingAkun && a.parent_id === editingAkun.id;
        }

        return true;
    });

    const selectedParent = parentOptions.find(
        (p) => p.id.toString() === data.parent_id.toString(),
    );
    const parentPrefix = selectedParent ? `${selectedParent.kode_akun}-` : "";

    const [akunType, setAkunType] = useState(editingAkun?.tipe_akun ?? "induk");
    const [subAkunOpen, setSubAkunOpen] = useState(false);
    const subAkunRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (subAkunRef.current && !subAkunRef.current.contains(e.target)) {
                setSubAkunOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function toggleChild(id) {
        const idStr = id.toString();
        setData(
            "children_ids",
            data.children_ids.includes(idStr)
                ? data.children_ids.filter((c) => c !== idStr)
                : [...data.children_ids, idStr],
        );
    }

    const selectedChildrenLabels = subAccountOptions
        .filter((opt) => data.children_ids.includes(opt.id.toString()))
        .map((opt) => opt.kode_akun);

    function handleClose() {
        reset();
        clearErrors();
        setAkunType("induk");
        onClose();
    }

    function handleSubmit(e) {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: handleClose,
        };

        if (isEdit) {
            put(
                route("finance.akun-referensi.update", {
                    akunReferensi: editingAkun.id,
                }),
                options,
            );
        } else {
            post(route("finance.akun-referensi.store"), options);
        }
    }

    if (!open) return null;

    const previewJenis = TIPE_NERACA_MASUK.includes(data.tipe_neraca)
        ? "masuk"
        : "keluar";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            aria-modal="true"
            role="dialog"
        >
            <div
                className="absolute inset-0 bg-slate-900/40"
                onClick={handleClose}
            />

            <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
                <div className="flex items-start justify-between px-6 pt-6 pb-2">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            {isEdit ? "Edit Akun" : "Tambah Akun"}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Akun ini otomatis tersedia di jurnal Kas Masuk atau
                            Kas Keluar sesuai Tipe Neraca yang dipilih.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        aria-label="Tutup"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="px-6 pb-6 pt-3 space-y-4"
                >
                    <div>
                        <label
                            htmlFor="kode_akun"
                            className="block text-sm font-medium text-slate-700 mb-1.5"
                        >
                            Kode Akun
                        </label>
                        <div className="flex">
                            {parentPrefix && (
                                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-500 sm:text-sm">
                                    {parentPrefix}
                                </span>
                            )}
                            <input
                                id="kode_akun"
                                type="text"
                                value={data.kode_akun}
                                onChange={(e) =>
                                    setData("kode_akun", e.target.value)
                                }
                                placeholder={
                                    parentPrefix ? "Contoh: 1" : "Contoh: 6103"
                                }
                                className={`w-full border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${parentPrefix ? "rounded-r-xl" : "rounded-xl"}`}
                            />
                        </div>
                        {errors.kode_akun && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.kode_akun}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="nama_akun"
                            className="block text-sm font-medium text-slate-700 mb-1.5"
                        >
                            Nama Akun
                        </label>
                        <input
                            id="nama_akun"
                            type="text"
                            value={data.nama_akun}
                            onChange={(e) =>
                                setData("nama_akun", e.target.value)
                            }
                            placeholder="Contoh: Listrik Proyek"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                        {errors.nama_akun && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.nama_akun}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="kategori"
                            className="block text-sm font-medium text-slate-700 mb-1.5"
                        >
                            Kategori
                        </label>
                        <select
                            id="kategori"
                            value={data.kategori}
                            onChange={(e) =>
                                setData("kategori", e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        >
                            {KATEGORI_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {errors.kategori && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.kategori}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                            Pilih <strong>HPP</strong> apabila akun kas keluar
                            ini termasuk biaya upah yang akan masuk ke HPP per
                            unit. Akun dengan kategori selain HPP akan dianggap
                            biaya operasional.
                        </p>
                    </div>

                    <div>
                        <label
                            htmlFor="tipe_neraca"
                            className="block text-sm font-medium text-slate-700 mb-1.5"
                        >
                            Tipe Neraca
                        </label>
                        <select
                            id="tipe_neraca"
                            value={data.tipe_neraca}
                            onChange={(e) =>
                                setData("tipe_neraca", e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        >
                            {TIPE_NERACA_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <div className="mt-1.5 flex items-center gap-2">
                            <p className="text-xs text-slate-400">
                                Menentukan klasifikasi akun ini di Laba Rugi
                                &amp; Neraca — akun akan otomatis muncul di
                                jurnal:
                            </p>
                            <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                    previewJenis === "masuk"
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-red-50 text-red-600"
                                }`}
                            >
                                {previewJenis === "masuk"
                                    ? "Kas Masuk"
                                    : "Kas Keluar"}
                            </span>
                        </div>
                        {errors.tipe_neraca && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.tipe_neraca}
                            </p>
                        )}
                    </div>

                    {!isEdit && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Jenis Akun
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAkunType("induk");
                                        setData("tipe_akun", "induk");
                                        setData("parent_id", "");
                                    }}
                                    className={`rounded-xl border px-3.5 py-2.5 text-sm font-medium ${
                                        akunType === "induk"
                                            ? "border-teal-500 bg-teal-50 text-teal-700"
                                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    Akun Induk
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAkunType("sub");
                                        setData("tipe_akun", "sub");
                                        setData("children_ids", []);
                                    }}
                                    className={`rounded-xl border px-3.5 py-2.5 text-sm font-medium ${
                                        akunType === "sub"
                                            ? "border-teal-500 bg-teal-50 text-teal-700"
                                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    Sub Akun
                                </button>
                            </div>
                        </div>
                    )}

                    {akunType === "sub" && (
                        <div>
                            <label
                                htmlFor="parent_id"
                                className="block text-sm font-medium text-slate-700 mb-1.5"
                            >
                                Akun Induk
                            </label>
                            <select
                                id="parent_id"
                                required
                                value={data.parent_id}
                                onChange={(e) =>
                                    setData("parent_id", e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            >
                                <option value="">Pilih akun induk...</option>
                                {parentOptions.map((opt) => (
                                    <option key={opt.id} value={opt.id}>
                                        {opt.kode_akun} - {opt.nama_akun}
                                    </option>
                                ))}
                            </select>
                            {errors.parent_id && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.parent_id}
                                </p>
                            )}
                        </div>
                    )}

                    {akunType === "induk" && subAccountOptions.length > 0 && (
                        <div className="relative" ref={subAkunRef}>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Sub Akun (Bisa pilih lebih dari satu)
                            </label>

                            <button
                                type="button"
                                onClick={() => setSubAkunOpen((o) => !o)}
                                className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-left focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            >
                                <span
                                    className={
                                        selectedChildrenLabels.length
                                            ? "text-slate-900"
                                            : "text-slate-400"
                                    }
                                >
                                    {selectedChildrenLabels.length
                                        ? selectedChildrenLabels.join(", ")
                                        : "Pilih sub akun..."}
                                </span>
                                <span className="text-slate-400 text-xs">
                                    ▼
                                </span>
                            </button>

                            {subAkunOpen && (
                                <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                                    {subAccountOptions.map((opt) => {
                                        const checked =
                                            data.children_ids.includes(
                                                opt.id.toString(),
                                            );
                                        return (
                                            <label
                                                key={opt.id}
                                                className="flex items-center gap-2 px-3.5 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() =>
                                                        toggleChild(opt.id)
                                                    }
                                                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                                />
                                                <span>
                                                    {opt.kode_akun} -{" "}
                                                    {opt.nama_akun}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {errors.children_ids && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.children_ids}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
                        >
                            Simpan
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                            Batal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Index({
    akunList = [],
    parentOptions = [],
    isSuperAdmin = false,
}) {
    const { flash } = usePage().props;
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAkun, setEditingAkun] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [akunToDelete, setAkunToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [forceDeleteTarget, setForceDeleteTarget] = useState(null);
    const [forceDeleting, setForceDeleting] = useState(false);
    const [restoring, setRestoring] = useState(null);
    const [notification, setNotification] = useState(() => {
        const message = flash?.error ?? flash?.info;
        return message
            ? { type: flash?.error ? "error" : "info", message }
            : null;
    });

    // Build hierarchical list for table
    const hierarchizedAkunList = [];
    const parentAkuns = akunList.filter((a) => !a.parent_id);
    const subAkuns = akunList.filter((a) => a.parent_id);

    parentAkuns.forEach((parent) => {
        hierarchizedAkunList.push(parent);
        const children = subAkuns.filter((s) => s.parent_id === parent.id);
        hierarchizedAkunList.push(...children);
    });
    const orphans = subAkuns.filter(
        (s) => !parentAkuns.some((p) => p.id === s.parent_id),
    );
    hierarchizedAkunList.push(...orphans);

    function openAdd() {
        setEditingAkun(null);
        setModalOpen(true);
    }

    function openEdit(akun) {
        setEditingAkun(akun);
        setModalOpen(true);
    }

    function openDelete(akun) {
        if (!akun.can_delete) {
            setNotification({
                type: "error",
                message:
                    akun.delete_reason ||
                    "Akun ini tidak bisa dihapus karena sudah digunakan atau memiliki data terkait.",
            });
            return;
        }

        setAkunToDelete(akun);
        setShowDeleteConfirm(true);
    }

    function openForceDelete(akun) {
        setForceDeleteTarget(akun);
    }

    function handleRestore(akun) {
        setRestoring(akun.id);
        router.post(
            route("finance.akun-referensi.restore", {
                akunReferensi: akun.id,
            }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setRestoring(null),
            },
        );
    }

    function handleForceDeleteConfirm() {
        setForceDeleting(true);
        router.delete(
            route("finance.akun-referensi.force-destroy", {
                akunReferensi: forceDeleteTarget.id,
            }),
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => {
                    setForceDeleting(false);
                    setForceDeleteTarget(null);
                },
            },
        );
    }

    function handleDeleteConfirm() {
        setDeleting(true);
        router.delete(
            route("finance.akun-referensi.destroy", {
                akunReferensi: akunToDelete.id,
            }),
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => {
                    setDeleting(false);
                    setShowDeleteConfirm(false);
                },
            },
        );
    }

    useEffect(() => {
        const message = flash?.error ?? flash?.info;
        setNotification(
            message ? { type: flash?.error ? "error" : "info", message } : null,
        );
    }, [flash?.error, flash?.info]);

    return (
        <div className="space-y-5">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-slate-900">
                    Akun Referensi
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Kelola kelompok akun untuk transaksi keuangan proyek
                </p>
            </div>

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                    {flash.error}
                </div>
            )}
            {flash?.info && (
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                    {flash.info}
                </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <h2 className="text-base font-semibold text-slate-900">
                        Daftar Akun
                    </h2>
                    <button
                        type="button"
                        onClick={openAdd}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
                    >
                        <Plus size={16} />
                        Tambah Akun
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-400 bg-slate-50">
                                <th className="px-6 py-3">Kode Akun</th>
                                <th className="px-6 py-3">Nama Akun</th>
                                <th className="px-6 py-3">Kategori</th>
                                <th className="px-6 py-3">Tipe Neraca</th>
                                <th className="px-6 py-3">Jenis</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hierarchizedAkunList.map((akun) => {
                                const isSub = Boolean(akun.parent_id);
                                return (
                                    <tr
                                        key={akun.id}
                                        className={`border-t border-slate-100 hover:bg-slate-50/60 ${isSub ? "bg-slate-50/30" : ""} ${akun.is_deleted ? "opacity-60 bg-red-50/30" : ""}`}
                                    >
                                        <td
                                            className={`px-6 py-4 font-medium text-teal-700 ${isSub ? "pl-10" : ""}`}
                                        >
                                            {isSub && (
                                                <span className="text-slate-300 mr-2">
                                                    └
                                                </span>
                                            )}
                                            {akun.kode_akun}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">
                                            <div className="flex flex-col">
                                                <span>{akun.nama_akun}</span>
                                                {akun.parent_name && (
                                                    <span className="mt-1 text-xs text-slate-500">
                                                        Induk:{" "}
                                                        {akun.parent_code} -{" "}
                                                        {akun.parent_name}
                                                    </span>
                                                )}
                                                {akun.indicator?.type ===
                                                    "deleted" && (
                                                    <span className="mt-1 text-[11px] font-semibold text-red-600">
                                                        {akun.indicator.message}
                                                    </span>
                                                )}
                                                {akun.indicator?.type ===
                                                    "edited" && (
                                                    <span className="mt-1 text-[11px] font-semibold text-amber-700">
                                                        {akun.indicator.message}
                                                    </span>
                                                )}
                                                {akun.indicator?.type ===
                                                    "created" && (
                                                    <span className="mt-1 text-[11px] font-semibold text-emerald-700">
                                                        {akun.indicator.message}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <KategoriBadge
                                                kategori={akun.kategori}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <TipeNeracaBadge
                                                tipeNeraca={akun.tipe_neraca}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <JenisBadge
                                                tipeNeraca={akun.tipe_neraca}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-3">
                                                {!akun.is_deleted ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEdit(akun)
                                                            }
                                                            title="Edit"
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sky-600 hover:bg-sky-50 transition-colors"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openDelete(akun)
                                                            }
                                                            title="Hapus"
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 transition-colors"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    isSuperAdmin && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRestore(
                                                                        akun,
                                                                    )
                                                                }
                                                                disabled={
                                                                    restoring ===
                                                                    akun.id
                                                                }
                                                                className="flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-200 transition disabled:opacity-60"
                                                                title="Batalkan penghapusan"
                                                            >
                                                                {restoring ===
                                                                akun.id
                                                                    ? "Memulihkan..."
                                                                    : "Pulihkan"}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openForceDelete(
                                                                        akun,
                                                                    )
                                                                }
                                                                className="flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 hover:bg-red-200 transition"
                                                                title="Konfirmasi hapus permanen"
                                                            >
                                                                <Trash2
                                                                    size={11}
                                                                />
                                                                Hapus Permanen
                                                            </button>
                                                        </>
                                                    )
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <AkunModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                editingAkun={editingAkun}
                parentOptions={parentOptions}
                akunList={akunList}
            />

            <ConfirmDialog
                open={showDeleteConfirm}
                title="Hapus akun ini?"
                message={
                    akunToDelete
                        ? `"${akunToDelete.nama_akun}" (${akunToDelete.kode_akun}) akan dihapus permanen dan tidak bisa dikembalikan.`
                        : "Akun ini akan dihapus permanen dan tidak bisa dikembalikan."
                }
                confirmText="Ya, Hapus"
                cancelText="Batal"
                danger
                processing={deleting}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            <ConfirmDialog
                open={Boolean(forceDeleteTarget)}
                title="Hapus permanen akun ini?"
                message={
                    forceDeleteTarget
                        ? `"${forceDeleteTarget.nama_akun}" (${forceDeleteTarget.kode_akun}) sudah dihapus sebelumnya. Tindakan ini akan menghapusnya secara permanen dan tidak bisa dikembalikan.`
                        : ""
                }
                confirmText="Ya, Hapus Permanen"
                cancelText="Batal"
                danger
                processing={forceDeleting}
                onConfirm={handleForceDeleteConfirm}
                onCancel={() => setForceDeleteTarget(null)}
            />

            <AlertDialog
                open={Boolean(notification)}
                title={
                    notification?.type === "error"
                        ? "Tidak bisa menghapus akun"
                        : "Informasi"
                }
                message={notification?.message}
                danger={notification?.type === "error"}
                confirmText="Tutup"
                onClose={() => setNotification(null)}
            />
        </div>
    );
}

Index.layout = (page) => <AuthenticatedLayout children={page} />;
