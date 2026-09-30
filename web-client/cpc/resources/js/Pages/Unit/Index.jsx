import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import AlertDialog from "@/Components/AlertDialog";
import {
    Pencil,
    Trash2,
    Search,
    X,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";

function SortableHeader({ label, column, sortBy, sortDir, onSort }) {
    const isActive = sortBy === column;

    return (
        <th
            onClick={() => onSort(column)}
            className="cursor-pointer select-none px-4 py-3 text-left font-semibold text-slate-700 hover:text-slate-900"
        >
            <span className="inline-flex items-center gap-1">
                {label}
                <ArrowUpDown
                    size={12}
                    className={isActive ? "text-sky-700" : "text-slate-700"}
                />
                {isActive && (
                    <span className="text-[10px] text-sky-700">
                        {sortDir === "asc" ? "↑" : "↓"}
                    </span>
                )}
            </span>
        </th>
    );
}

function highlightText(text, keyword) {
    if (!keyword) return text;
    const regex = new RegExp(`(${keyword})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
        regex.test(part) ? (
            <mark
                key={i}
                className="bg-yellow-200 text-slate-900 rounded-sm px-0.5"
            >
                {part}
            </mark>
        ) : (
            part
        ),
    );
}

function normalizeUnitCode(value, maxLength) {
    return value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, maxLength);
}

function formatDateString(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export default function UnitIndex({ units, masterStandards = [] }) {
    const { flash } = usePage().props;
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [deletingUnit, setDeletingUnit] = useState(null);
    const [notification, setNotification] = useState(() => {
        const message = flash?.error ?? flash?.info;
        return message
            ? { type: flash?.error ? "error" : "info", message }
            : null;
    });
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("Semua");
    const [sortBy, setSortBy] = useState(null);
    const [sortDir, setSortDir] = useState("asc");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // ── Select massal ──────────────────────────────────────────
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);

    function toggleSort(column) {
        if (sortBy === column) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortDir("asc");
        }
    }

    const filteredUnits = units
        .filter((unit) => {
            const keyword = search.toLowerCase();
            const matchSearch =
                (unit.nama_unit || "").toLowerCase().includes(keyword) ||
                (unit.zona || "").toLowerCase().includes(keyword) ||
                (unit.tukang || "").toLowerCase().includes(keyword);
            const matchStatus =
                filterStatus === "Semua" || unit.status === filterStatus;

            return matchSearch && matchStatus;
        })
        .sort((a, b) => {
            if (!sortBy) return 0;

            let valA = a[sortBy] ?? "";
            let valB = b[sortBy] ?? "";

            if (sortBy === "tanggal_mulai") {
                valA = valA ? new Date(valA).getTime() : 0;
                valB = valB ? new Date(valB).getTime() : 0;
                const result = valA - valB;
                return sortDir === "asc" ? result : -result;
            }

            const result = valA.localeCompare(valB, undefined, {
                numeric: true,
                sensitivity: "base",
            });
            return sortDir === "asc" ? result : -result;
        });
    const totalPages =
        pageSize === "all" ? 1 : Math.ceil(filteredUnits.length / pageSize);
    const paginatedUnits =
        pageSize === "all"
            ? filteredUnits
            : filteredUnits.slice(
                  (currentPage - 1) * pageSize,
                  currentPage * pageSize,
              );
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterStatus, pageSize]);

    // Kalau data berubah (misal habis delete), buang id yang sudah tidak ada dari seleksi
    useEffect(() => {
        setSelectedIds((prev) =>
            prev.filter((id) => units.some((u) => u.id === id)),
        );
    }, [units]);

    const pageIds = paginatedUnits.map((u) => u.id);
    const allOnPageSelected =
        pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    const someOnPageSelected = pageIds.some((id) => selectedIds.includes(id));

    function toggleSelectMode() {
        if (selectMode) {
            setSelectedIds([]);
        }
        setSelectMode((prev) => !prev);
    }

    function toggleSelectOne(id) {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    }

    function toggleSelectAllOnPage() {
        if (allOnPageSelected) {
            setSelectedIds((prev) =>
                prev.filter((id) => !pageIds.includes(id)),
            );
        } else {
            setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
        }
    }

    function clearSelection() {
        setSelectedIds([]);
        setSelectMode(false);
    }

    function confirmBulkDelete() {
        setBulkDeleting(true);
        router.delete(route("unit.destroyBulk"), {
            data: { ids: selectedIds },
            preserveScroll: true,
            onSuccess: () => {
                setSelectedIds([]);
                setBulkDeleteOpen(false);
                setSelectMode(false);
            },
            onFinish: () => setBulkDeleting(false),
        });
    }

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nama_unit: "",
        zona: "",
        status: "Aktif",
        tukang: "",
        tanggal_mulai: "",
        keterangan: "",
        master_standar_id: "",
    });

    function openAdd() {
        setEditingUnit(null);
        setData({
            nama_unit: "",
            zona: "",
            status: "Aktif",
            tukang: "",
            tanggal_mulai: "",
            keterangan: "",
            master_standar_id: masterStandards[0]?.id ?? "",
        });
        setDrawerOpen(true);
    }

    function openEdit(unit) {
        setEditingUnit(unit);
        setData({
            nama_unit: normalizeUnitCode(unit.nama_unit ?? "", 4),
            zona: normalizeUnitCode(unit.zona ?? "", 2),
            status: unit.status,
            tukang: unit.tukang,
            tanggal_mulai: unit.tanggal_mulai ?? "",
            keterangan: unit.keterangan ?? "",
            master_standar_id: unit.master_standar_id ?? "",
        });
        setDrawerOpen(true);
    }

    function submit(e) {
        e.preventDefault();
        if (editingUnit) {
            put(route("unit.update", editingUnit.id), {
                onSuccess: () => setDrawerOpen(false),
            });
        } else {
            post(route("unit.store"), {
                onSuccess: () => setDrawerOpen(false),
            });
        }
    }

    function handleDelete(unit) {
        if (!unit.can_delete) {
            setNotification({
                type: "error",
                message:
                    unit.delete_reason ||
                    "Data unit ini tidak bisa dihapus karena sudah digunakan.",
            });
            return;
        }

        setDeletingUnit(unit);
    }

    function confirmDelete() {
        if (!deletingUnit) return;
        router.delete(route("unit.destroy", deletingUnit.id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setDeletingUnit(null),
        });
    }

    useEffect(() => {
        const message = flash?.error ?? flash?.info;
        setNotification(
            message ? { type: flash?.error ? "error" : "info", message } : null,
        );
    }, [flash?.error, flash?.info]);

    return (
        <AuthenticatedLayout>
            <Head title="Mengelola Unit" />

            <div className="space-y-5 ">
                <div className="space-y-5">
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
                    <div className="mb-5">
                        <h1 className="text-xl font-bold text-slate-900">
                            Mengelola Unit
                        </h1>
                    </div>

                    {/* Tabel */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-3 p-4">
                            <h2 className="text-sm font-bold text-slate-900">
                                Daftar Unit ({filteredUnits.length})
                            </h2>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative flex-1 min-w-[160px]">
                                    <Search
                                        size={15}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Cari unit, zona, tukang..."
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-600"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="filter-status"
                                        className="sr-only"
                                    >
                                        Filter Status Unit
                                    </label>

                                    <select
                                        id="filter-status"
                                        value={filterStatus}
                                        onChange={(e) =>
                                            setFilterStatus(e.target.value)
                                        }
                                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-600"
                                    >
                                        <option value="">Semua Status</option>
                                        <option value="Aktif">Aktif</option>
                                        <option value="Non-aktif">
                                            Non-aktif
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label
                                        htmlFor="page-size"
                                        className="sr-only"
                                    >
                                        Jumlah Data per Halaman
                                    </label>

                                    <select
                                        id="page-size"
                                        value={pageSize}
                                        onChange={(e) =>
                                            setPageSize(
                                                e.target.value === "all"
                                                    ? "all"
                                                    : Number(e.target.value),
                                            )
                                        }
                                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-600"
                                    >
                                        <option value={10}>10 / halaman</option>
                                        <option value={50}>50 / halaman</option>
                                        <option value="all">Semua</option>
                                    </select>
                                </div>

                                <button
                                    onClick={toggleSelectMode}
                                    className={`cursor-pointer whitespace-nowrap rounded-xl border px-4 py-2 text-xs font-bold transition-colors ${
                                        selectMode
                                            ? "border-sky-600 bg-sky-50 text-sky-700"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                                    }`}
                                >
                                    {selectMode ? "Batal Pilih" : "Pilih"}
                                </button>

                                <button
                                    onClick={openAdd}
                                    className="cursor-pointer whitespace-nowrap rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                                >
                                    + Tambah Unit
                                </button>
                            </div>
                        </div>

                        {/* Toolbar aksi massal - hanya tampil kalau ada yang diseleksi */}
                        {selectMode && selectedIds.length > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sky-100 bg-sky-50 px-4 py-2.5">
                                <span className="text-sm font-semibold text-sky-700">
                                    {selectedIds.length} unit dipilih
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setBulkDeleteOpen(true)}
                                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600/90"
                                    >
                                        <Trash2 size={13} />
                                        Hapus Terpilih
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-sm">
                                <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-700">
                                    <tr>
                                        {selectMode && (
                                            <th className="w-10 px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={allOnPageSelected}
                                                    ref={(el) => {
                                                        if (el)
                                                            el.indeterminate =
                                                                !allOnPageSelected &&
                                                                someOnPageSelected;
                                                    }}
                                                    onChange={
                                                        toggleSelectAllOnPage
                                                    }
                                                    className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-500"
                                                />
                                            </th>
                                        )}
                                        <SortableHeader
                                            label="Unit"
                                            column="nama_unit"
                                            sortBy={sortBy}
                                            sortDir={sortDir}
                                            onSort={toggleSort}
                                        />
                                        <SortableHeader
                                            label="Zona"
                                            column="zona"
                                            sortBy={sortBy}
                                            sortDir={sortDir}
                                            onSort={toggleSort}
                                        />
                                        <th className="px-4 py-3 text-left font-semibold">
                                            Standar Progress
                                        </th>
                                        <SortableHeader
                                            label="Kepala Tukang"
                                            column="tukang"
                                            sortBy={sortBy}
                                            sortDir={sortDir}
                                            onSort={toggleSort}
                                        />
                                        <th className="px-4 py-3 text-left font-semibold">
                                            Status
                                        </th>
                                        <SortableHeader
                                            label="Tgl Mulai"
                                            column="tanggal_mulai"
                                            sortBy={sortBy}
                                            sortDir={sortDir}
                                            onSort={toggleSort}
                                        />
                                        <th className="px-4 py-3 text-left font-semibold">
                                            Keterangan
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedUnits.map((unit) => (
                                        <tr
                                            key={unit.id}
                                            className={`border-t border-slate-200 transition-colors hover:bg-slate-50 ${
                                                selectedIds.includes(unit.id)
                                                    ? "bg-sky-50/60"
                                                    : ""
                                            }`}
                                        >
                                            {selectMode && (
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(
                                                            unit.id,
                                                        )}
                                                        onChange={() =>
                                                            toggleSelectOne(
                                                                unit.id,
                                                            )
                                                        }
                                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-4 py-3 font-mono font-bold text-sky-700">
                                                {highlightText(
                                                    unit.nama_unit,
                                                    search,
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
                                                    {highlightText(
                                                        unit.zona,
                                                        search,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                                                {unit.nama_standar}
                                            </td>
                                            <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                                                {highlightText(
                                                    unit.tukang,
                                                    search,
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${
                                                        unit.status === "Aktif"
                                                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                                            : "bg-slate-200 text-slate-800 ring-slate-300"
                                                    }`}
                                                >
                                                    {unit.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-slate-700">
                                                {formatDateString(
                                                    unit.tanggal_mulai,
                                                )}
                                            </td>
                                            <td
                                                className="max-w-[160px] truncate px-4 py-3 text-xs text-slate-700"
                                                title={unit.keterangan}
                                            >
                                                {unit.keterangan || "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        aria-label="Edit Unit"
                                                        title="Edit"
                                                        onClick={() =>
                                                            openEdit(unit)
                                                        }
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sky-600 hover:bg-sky-50 transition-colors"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-label="Hapus Unit"
                                                        title="Hapus"
                                                        onClick={() =>
                                                            handleDelete(unit)
                                                        }
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedUnits.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={selectMode ? 9 : 8}
                                                className="px-4 py-6 text-center text-slate-400"
                                            >
                                                Belum ada data unit.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm">
                            <div className="text-slate-700">
                                {filteredUnits.length} unit ditemukan
                            </div>

                            {pageSize !== "all" && totalPages > 1 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.max(1, p - 1),
                                            )
                                        }
                                        disabled={currentPage === 1}
                                        title="Sebelumnya"
                                        className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                                    >
                                        <ChevronLeft size={15} />
                                    </button>
                                    <span className="text-slate-700">
                                        Halaman {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.min(totalPages, p + 1),
                                            )
                                        }
                                        disabled={currentPage === totalPages}
                                        title="Selanjutnya"
                                        className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                                    >
                                        <ChevronRight size={15} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Modal: Tambah/Edit Unit */}
                    {drawerOpen && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                            onClick={() => setDrawerOpen(false)}
                        >
                            <div
                                className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="mb-5 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        {editingUnit
                                            ? "Edit Unit"
                                            : "Tambah Unit Baru"}
                                    </h2>
                                    <button
                                        onClick={() => setDrawerOpen(false)}
                                        className="cursor-pointer rounded-lg p-1 text-slate-400 hover:text-slate-700"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <form onSubmit={submit} className="space-y-4">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Nama Unit
                                        </label>
                                        <input
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-600"
                                            value={data.nama_unit}
                                            maxLength={4}
                                            placeholder="Contoh: A1"
                                            onChange={(e) =>
                                                setData(
                                                    "nama_unit",
                                                    normalizeUnitCode(
                                                        e.target.value,
                                                        4,
                                                    ),
                                                )
                                            }
                                        />
                                        {errors.nama_unit && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.nama_unit}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Zona
                                        </label>
                                        <input
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-600"
                                            value={data.zona}
                                            maxLength={2}
                                            placeholder="Contoh: A"
                                            onChange={(e) =>
                                                setData(
                                                    "zona",
                                                    normalizeUnitCode(
                                                        e.target.value,
                                                        2,
                                                    ),
                                                )
                                            }
                                        />
                                        {errors.zona && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.zona}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="status-unit"
                                            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
                                        >
                                            Status
                                        </label>

                                        <select
                                            id="status-unit"
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-600"
                                            value={data.status}
                                            onChange={(e) =>
                                                setData(
                                                    "status",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="Aktif">Aktif</option>
                                            <option value="Non-aktif">
                                                Non-aktif
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Standar Progress
                                        </label>
                                        <select
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-600 disabled:bg-slate-100 disabled:text-slate-700"
                                            value={data.master_standar_id}
                                            onChange={(e) =>
                                                setData(
                                                    "master_standar_id",
                                                    e.target.value,
                                                )
                                            }
                                            disabled={
                                                editingUnit !== null &&
                                                !editingUnit.can_change_standar
                                            }
                                        >
                                            <option value="">
                                                Pilih Standar...
                                            </option>
                                            {masterStandards.map((std) => (
                                                <option
                                                    key={std.id}
                                                    value={std.id}
                                                >
                                                    {std.nama_standar}
                                                </option>
                                            ))}
                                        </select>
                                        {editingUnit !== null &&
                                            !editingUnit.can_change_standar && (
                                                <p className="mt-1 text-xs text-amber-600">
                                                    Standar tidak bisa diubah
                                                    karena progres unit sudah
                                                    berjalan.
                                                </p>
                                            )}
                                        {errors.master_standar_id && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.master_standar_id}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Kepala Tukang
                                        </label>
                                        <input
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-600"
                                            value={data.tukang}
                                            placeholder="Contoh: Pak Slamet"
                                            onChange={(e) =>
                                                setData(
                                                    "tukang",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {errors.tukang && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.tukang}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Tanggal Mulai
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-600"
                                            value={data.tanggal_mulai}
                                            onChange={(e) =>
                                                setData(
                                                    "tanggal_mulai",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Keterangan
                                        </label>
                                        <textarea
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-600"
                                            rows={3}
                                            value={data.keterangan}
                                            placeholder="Contoh: Progress terhambat cuaca hujan"
                                            onChange={(e) =>
                                                setData(
                                                    "keterangan",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="mt-6 flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="cursor-pointer flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                        >
                                            {editingUnit
                                                ? "Simpan Perubahan"
                                                : "Tambah Unit"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDrawerOpen(false)}
                                            className="cursor-pointer rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Modal konfirmasi hapus satuan */}
                    {deletingUnit && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                            onClick={() => setDeletingUnit(null)}
                        >
                            <div
                                className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h2 className="mb-2 text-lg font-semibold text-slate-900">
                                    Hapus Unit?
                                </h2>
                                <p className="mb-6 text-sm text-slate-700">
                                    Unit{" "}
                                    <span className="font-medium text-slate-700">
                                        {deletingUnit.nama_unit}
                                    </span>{" "}
                                    akan dihapus permanen. Tindakan ini tidak
                                    bisa dibatalkan.
                                </p>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setDeletingUnit(null)}
                                        className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="cursor-pointer rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                                    >
                                        Ya, Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal konfirmasi hapus massal */}
                    {bulkDeleteOpen && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                            onClick={() =>
                                !bulkDeleting && setBulkDeleteOpen(false)
                            }
                        >
                            <div
                                className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h2 className="mb-2 text-lg font-semibold text-slate-900">
                                    Hapus {selectedIds.length} Unit?
                                </h2>
                                <p className="mb-6 text-sm text-slate-700">
                                    Semua unit yang dipilih akan dihapus
                                    permanen. Tindakan ini tidak bisa
                                    dibatalkan.
                                </p>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setBulkDeleteOpen(false)}
                                        disabled={bulkDeleting}
                                        className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={confirmBulkDelete}
                                        disabled={bulkDeleting}
                                        className="cursor-pointer rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                                    >
                                        {bulkDeleting
                                            ? "Menghapus..."
                                            : `Ya, Hapus ${selectedIds.length} Unit`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    <AlertDialog
                        open={Boolean(notification)}
                        title={
                            notification?.type === "error"
                                ? "Tidak bisa menghapus unit"
                                : "Informasi"
                        }
                        message={notification?.message}
                        danger={notification?.type === "error"}
                        confirmText="Tutup"
                        onClose={() => setNotification(null)}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
