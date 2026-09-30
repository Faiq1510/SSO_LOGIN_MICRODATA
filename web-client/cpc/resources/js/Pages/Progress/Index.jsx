import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_COLOR = {
    AMAN: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    WARNING: "bg-amber-50 text-amber-700 ring-amber-200",
    BOROS: "bg-red-50 text-red-700 ring-red-200",
};

function StatusBadge({ status }) {
    if (!status) return <span className="text-xs text-slate-400">-</span>;
    return (
        <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${STATUS_COLOR[status] ?? "bg-slate-200 text-slate-700 ring-slate-300"}`}
        >
            {status}
        </span>
    );
}

function UnitStatusBadge({ status }) {
    const isAktif = status === "Aktif";
    return (
        <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${
                isAktif
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-slate-200 text-slate-700 ring-slate-300"
            }`}
        >
            {status ?? "Non-Aktif"}
        </span>
    );
}

function UnitStatusPreviewBadge({ status }) {
    const map = {
        "NOT STARTED": "bg-slate-200 text-slate-700 ring-slate-300",
        "ON PROGRESS": "bg-sky-50 text-sky-700 ring-sky-200",
        DONE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    };
    return (
        <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${map[status] ?? "bg-slate-200 text-slate-700 ring-slate-300"}`}
        >
            {status}
        </span>
    );
}

const STATUS_PRIORITY = { BOROS: 3, WARNING: 2, AMAN: 1 };

function computeUnitStatus(progressPercent) {
    const p = Number(progressPercent);
    if (Number.isNaN(p)) return "NOT STARTED";
    if (p >= 100) return "DONE";
    if (p > 0) return "ON PROGRESS";
    return "NOT STARTED";
}

function getOverallStatus(unitId, monitoring) {
    const rows = monitoring[unitId];
    if (!rows || rows.length === 0) return null;

    return rows.reduce((worst, row) => {
        if (!worst) return row.analisa;
        return STATUS_PRIORITY[row.analisa] > STATUS_PRIORITY[worst]
            ? row.analisa
            : worst;
    }, null);
}

export default function ProgressIndex({
    units,
    masterStandars,
    monitoring,
    pagination,
    filters,
}) {
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [expandedUnitId, setExpandedUnitId] = useState(null);
    const [historyUnit, setHistoryUnit] = useState(null);

    function goToServer(overrides = {}) {
        router.get(
            route("progress.index"),
            {
                per_page: filters.per_page,
                status: filters.status,
                standar: filters.standar,
                page: pagination?.current_page ?? 1,
                ...overrides,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function setSelectedStatusFilter(status) {
        goToServer({ status, page: 1 });
    }

    function setPageSize(value) {
        goToServer({ per_page: value, page: 1 });
    }

    const { data, setData, post, processing, errors, reset } = useForm({
        unit_id: "",
        progress_percent: "",
        tanggal_update: "",
        status: "ON PROGRESS",
    });

    useEffect(() => {
        setData("status", computeUnitStatus(data.progress_percent));
    }, [data.progress_percent]);

    function openUpdate(unit) {
        setSelectedUnit(unit);
        const initialProgress = unit.latest_progress?.progress_percent ?? "";
        setData({
            unit_id: unit.id,
            progress_percent: initialProgress,
            tanggal_update: "",
            status: computeUnitStatus(initialProgress),
        });
    }

    function submit(e) {
        e.preventDefault();
        post(route("progress.store"), {
            onSuccess: () => setSelectedUnit(null),
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Update Progress Unit" />

            <div className="space-y-5">
                <div className="space-y-5">
                    <div className="mb-5">
                        <h1 className="text-xl font-bold text-slate-900">
                            Update Progress Unit
                        </h1>
                        <p className="text-sm text-slate-700">
                            Input klaim progres lapangan, membandingkan dengan
                            pemakaian material.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-bold text-slate-900">
                                    Daftar Unit ({units.length}
                                    {pagination ? ` / ${pagination.total}` : ""}
                                    )
                                </h2>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <div className="flex gap-1.5">
                                        <button
                                            onClick={() =>
                                                setSelectedStatusFilter(null)
                                            }
                                            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                                                filters.status === null
                                                    ? "bg-slate-900 text-white"
                                                    : "bg-slate-200 text-slate-600 hover:bg-slate-200"
                                            }`}
                                        >
                                            Semua Status
                                        </button>
                                        <button
                                            onClick={() =>
                                                setSelectedStatusFilter("AMAN")
                                            }
                                            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                                                filters.status === "AMAN"
                                                    ? "bg-emerald-600 text-white"
                                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                            }`}
                                        >
                                            Aman
                                        </button>
                                        <button
                                            onClick={() =>
                                                setSelectedStatusFilter(
                                                    "WARNING",
                                                )
                                            }
                                            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                                                filters.status === "WARNING"
                                                    ? "bg-amber-500 text-white"
                                                    : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                            }`}
                                        >
                                            Warning
                                        </button>
                                        <button
                                            onClick={() =>
                                                setSelectedStatusFilter("BOROS")
                                            }
                                            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                                                filters.status === "BOROS"
                                                    ? "bg-red-600 text-white"
                                                    : "bg-red-50 text-red-700 hover:bg-red-100"
                                            }`}
                                        >
                                            Boros
                                        </button>
                                    </div>
                                    <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>
                                    <label
                                        htmlFor="filter-standar"
                                        className="sr-only"
                                    >
                                        Filter Standar
                                    </label>
                                    <select
                                        id="filter-standar"
                                        aria-label="Filter Standar"
                                        value={filters.standar || ""}
                                        onChange={(e) =>
                                            goToServer({
                                                standar: e.target.value || null,
                                                page: 1,
                                            })
                                        }
                                        className="cursor-pointer rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-200 focus:border-sky-600"
                                    >
                                        <option value="">Semua Standar</option>
                                        {masterStandars.map((std) => (
                                            <option key={std.id} value={std.id}>
                                                {std.nama_standar}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <label htmlFor="per-page" className="sr-only">
                                Jumlah Data Per Halaman
                            </label>
                            <select
                                id="per-page"
                                aria-label="Jumlah Data Per Halaman"
                                value={filters.per_page}
                                onChange={(e) =>
                                    setPageSize(
                                        e.target.value === "all"
                                            ? "all"
                                            : Number(e.target.value),
                                    )
                                }
                                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-600"
                            >
                                <option value={10}>10 / halaman</option>
                                <option value={50}>50 / halaman</option>
                                <option value="all">Semua</option>
                            </select>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-200 text-xs uppercase tracking-wider text-slate-700">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">
                                        Unit
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold">
                                        Standar Progress
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold">
                                        Progress Terakhir
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold">
                                        Tanggal Update
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold">
                                        Status Unit
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold">
                                        Status Material
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {units.map((unit) => (
                                    <React.Fragment key={unit.id}>
                                        <tr className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-mono font-bold text-sky-700">
                                                {unit.nama_unit}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-700">
                                                {unit.master_standar
                                                    ?.nama_standar ?? "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {unit.latest_progress
                                                    ? `${unit.latest_progress.progress_percent}%`
                                                    : "-"}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">
                                                {unit.latest_progress
                                                    ?.tanggal_update ?? "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <UnitStatusBadge
                                                    status={unit.status}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge
                                                    status={getOverallStatus(
                                                        unit.id,
                                                        monitoring,
                                                    )}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() =>
                                                            openUpdate(unit)
                                                        }
                                                        className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-sky-800 hover:border-sky-600"
                                                    >
                                                        Update Progress
                                                    </button>
                                                    {monitoring[unit.id] && (
                                                        <button
                                                            onClick={() =>
                                                                setExpandedUnitId(
                                                                    expandedUnitId ===
                                                                        unit.id
                                                                        ? null
                                                                        : unit.id,
                                                                )
                                                            }
                                                            className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-400"
                                                        >
                                                            {expandedUnitId ===
                                                            unit.id
                                                                ? "Tutup Detail"
                                                                : "Lihat Detail"}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            setHistoryUnit(unit)
                                                        }
                                                        className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-400"
                                                    >
                                                        Riwayat
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedUnitId === unit.id && (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="bg-slate-50 px-4 py-4"
                                                >
                                                    <table className="w-full text-xs">
                                                        <thead className="text-slate-400">
                                                            <tr>
                                                                <th className="pb-2 text-left font-semibold">
                                                                    Material
                                                                </th>
                                                                <th className="pb-2 text-left font-semibold">
                                                                    Standar
                                                                </th>
                                                                <th className="pb-2 text-left font-semibold">
                                                                    Aktual
                                                                </th>
                                                                <th className="pb-2 text-left font-semibold">
                                                                    Sisa
                                                                </th>
                                                                <th className="pb-2 text-left font-semibold">
                                                                    Status
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {monitoring[
                                                                unit.id
                                                            ].map((row, i) => (
                                                                <tr
                                                                    key={i}
                                                                    className="border-t border-slate-200"
                                                                >
                                                                    <td className="py-2 font-semibold text-slate-700">
                                                                        {
                                                                            row.nama_material
                                                                        }
                                                                    </td>
                                                                    <td className="py-2 text-slate-700">
                                                                        {
                                                                            row.standar
                                                                        }
                                                                    </td>
                                                                    <td className="py-2 text-slate-700">
                                                                        {
                                                                            row.aktual
                                                                        }
                                                                    </td>
                                                                    <td className="py-2 text-slate-700">
                                                                        {Math.max(
                                                                            row.sisa,
                                                                            0,
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2">
                                                                        <StatusBadge
                                                                            status={
                                                                                row.analisa
                                                                            }
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                        {pagination && pagination.last_page > 1 && (
                            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3 text-sm">
                                <button
                                    onClick={() =>
                                        goToServer({
                                            page: Math.max(
                                                1,
                                                pagination.current_page - 1,
                                            ),
                                        })
                                    }
                                    disabled={pagination.current_page === 1}
                                    title="Sebelumnya"
                                    className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                                >
                                    <ChevronLeft size={15} />
                                </button>
                                <span className="text-slate-700">
                                    Halaman {pagination.current_page} /{" "}
                                    {pagination.last_page}
                                </span>
                                <button
                                    onClick={() =>
                                        goToServer({
                                            page: Math.min(
                                                pagination.last_page,
                                                pagination.current_page + 1,
                                            ),
                                        })
                                    }
                                    disabled={
                                        pagination.current_page ===
                                        pagination.last_page
                                    }
                                    title="Selanjutnya"
                                    className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                                >
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        )}
                    </div>

                    {selectedUnit && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                            onClick={() => setSelectedUnit(null)}
                        >
                            <div
                                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h2 className="mb-1 text-lg font-bold text-slate-900">
                                    Update Progress — {selectedUnit.nama_unit}
                                </h2>
                                <p className="mb-5 text-sm text-slate-700">
                                    Progress terakhir:{" "}
                                    {selectedUnit.latest_progress
                                        ?.progress_percent ?? 0}
                                    %
                                </p>

                                <form onSubmit={submit} className="space-y-4">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Progress (%)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-600"
                                            value={data.progress_percent}
                                            onChange={(e) =>
                                                setData(
                                                    "progress_percent",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {errors.progress_percent && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.progress_percent}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Tanggal Update
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-600"
                                            value={data.tanggal_update}
                                            onChange={(e) =>
                                                setData(
                                                    "tanggal_update",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {errors.tanggal_update && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.tanggal_update}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            Status
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <UnitStatusPreviewBadge
                                                status={data.status}
                                            />
                                            <span className="text-xs text-slate-700">
                                                Otomatis mengikuti progress (%)
                                            </span>
                                        </div>
                                        {/* status tetap dikirim ke backend sebagai info, tapi nilai final ditentukan server */}
                                    </div>

                                    <div className="mt-6 flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="cursor-pointer flex-1 rounded-xl bg-sky-600 py-3 text-sm font-bold text-white hover:bg-sky-600/90 disabled:opacity-50"
                                        >
                                            Simpan Progress
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedUnit(null)
                                            }
                                            className="cursor-pointer rounded-xl border border-slate-200 px-4 py-3 text-sm"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {historyUnit && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                            onClick={() => setHistoryUnit(null)}
                        >
                            <div
                                className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h2 className="mb-1 text-lg font-bold text-slate-900">
                                    Riwayat Progress - {historyUnit.nama_unit}
                                </h2>
                                <p className="mb-4 text-sm text-slate-700">
                                    Seluruh histori update progress unit ini,
                                    terbaru di atas.
                                </p>

                                <div className="max-h-96 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-slate-200 text-xs uppercase tracking-wider text-slate-700">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-semibold">
                                                    Tanggal
                                                </th>
                                                <th className="px-3 py-2 text-left font-semibold">
                                                    Progress
                                                </th>
                                                <th className="px-3 py-2 text-left font-semibold">
                                                    Status
                                                </th>
                                                <th className="px-3 py-2 text-left font-semibold">
                                                    Material
                                                </th>
                                                <th className="px-3 py-2 text-left font-semibold">
                                                    Oleh
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(historyUnit.progress ?? [])
                                                .length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="px-3 py-4 text-center text-slate-400"
                                                    >
                                                        Belum ada histori.
                                                    </td>
                                                </tr>
                                            )}
                                            {(historyUnit.progress ?? []).map(
                                                (h) => (
                                                    <tr
                                                        key={h.id}
                                                        className="border-t border-slate-200"
                                                    >
                                                        <td className="px-3 py-2 text-slate-700">
                                                            {h.tanggal_update}
                                                        </td>
                                                        <td className="px-3 py-2 font-semibold text-slate-700">
                                                            {h.progress_percent}
                                                            %
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-700">
                                                            {h.status}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <StatusBadge
                                                                status={
                                                                    h.status_material
                                                                }
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-700">
                                                            {h.updated_by
                                                                ?.name ?? "-"}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setHistoryUnit(null)}
                                    className="cursor-pointer mt-5 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
77;
