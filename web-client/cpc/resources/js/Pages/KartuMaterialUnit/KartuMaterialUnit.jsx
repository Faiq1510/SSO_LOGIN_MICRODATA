import { useEffect, useMemo, useState } from "react";
import { Head } from "@inertiajs/react";
import {
    ChevronLeft,
    ChevronRight,
    PackageCheck,
    FileSpreadsheet,
} from "lucide-react";
import ExcelJS from "exceljs";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const PROGRESS_RANGES = [
    { label: "Semua Progress", min: 0, max: 100 },
    { label: "0% - 25%", min: 0, max: 25 },
    { label: "26% - 50%", min: 26, max: 50 },
    { label: "51% - 75%", min: 51, max: 75 },
    { label: "76% - 99%", min: 76, max: 99 },
    { label: "100% (Selesai)", min: 100, max: 100 },
];

export default function KartuMaterialUnit({
    units = [],
    materialList = [],
    materialSatuan = {},
}) {
    const [query, setQuery] = useState("");
    const [zone, setZone] = useState("Semua Zona");
    const [progressRangeLabel, setProgressRangeLabel] =
        useState("Semua Progress");
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);

    const safeUnits = Array.isArray(units) ? units : [];
    const safeMaterialList = Array.isArray(materialList) ? materialList : [];
    const safeMaterialSatuan =
        materialSatuan && typeof materialSatuan === "object"
            ? materialSatuan
            : {};

    const zones = [...new Set(safeUnits.map((u) => u.zona).filter(Boolean))];

    const activeRange =
        PROGRESS_RANGES.find((r) => r.label === progressRangeLabel) ||
        PROGRESS_RANGES[0];

    const rows = safeUnits.filter(
        (u) =>
            (zone === "Semua Zona" || u.zona === zone) &&
            u.progress >= activeRange.min &&
            u.progress <= activeRange.max &&
            `${u.id} ${u.zona}`.toLowerCase().includes(query.toLowerCase()),
    );

    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const paginatedRows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }, [rows, page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [query, zone, progressRangeLabel, pageSize]);

    useEffect(() => {
        setPage((currentPage) => Math.min(currentPage, totalPages));
    }, [totalPages]);

    const rangeStart = rows.length === 0 ? 0 : (page - 1) * pageSize + 1;
    const rangeEnd = Math.min(page * pageSize, rows.length);

    const handleExportExcel = async () => {
        if (rows.length === 0) return;
        const { default: ExcelJS } = await import("exceljs");
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "SiteFlow";
        workbook.created = new Date();

        const sheet = workbook.addWorksheet("Kartu Material Unit", {
            views: [{ state: "frozen", ySplit: 4 }], // freeze header saat scroll
        });

        const headers = ["Unit", "Zona", "Progress (%)", ...safeMaterialList];

        // === Judul & info filter di atas tabel ===
        sheet.mergeCells(1, 1, 1, headers.length);
        const titleCell = sheet.getCell(1, 1);
        titleCell.value = "Kartu Material per Unit";
        titleCell.font = { bold: true, size: 14, color: { argb: "FF1E293B" } };
        titleCell.alignment = { vertical: "middle", horizontal: "left" };

        sheet.mergeCells(2, 1, 2, headers.length);
        const filterCell = sheet.getCell(2, 1);
        const zoneLabel = zone === "Semua Zona" ? "Semua Zona" : `Zona ${zone}`;
        filterCell.value = `Filter: ${zoneLabel} • ${progressRangeLabel} • Diekspor pada ${new Date().toLocaleString("id-ID")}`;
        filterCell.font = {
            italic: true,
            size: 10,
            color: { argb: "FF64748B" },
        };

        sheet.getRow(3).height = 4; // spacer row

        // === Header tabel (row 4) ===
        const headerRow = sheet.getRow(4);
        headerRow.values = headers;
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF1D4ED8" },
            };
            cell.alignment = { vertical: "middle", horizontal: "center" };
            cell.border = {
                top: { style: "thin", color: { argb: "FF94A3B8" } },
                bottom: { style: "thin", color: { argb: "FF94A3B8" } },
                left: { style: "thin", color: { argb: "FF94A3B8" } },
                right: { style: "thin", color: { argb: "FF94A3B8" } },
            };
        });
        headerRow.height = 22;

        // === Isi data ===
        const sortedRows = [...rows].sort((a, b) => b.progress - a.progress);
        sortedRows.forEach((unit, idx) => {
            const rowValues = [
                unit.id,
                `Zona ${unit.zona}`,
                unit.progress,
                ...safeMaterialList.map((mat) => {
                    const value = unit.usage[mat];
                    return value
                        ? `${value} ${safeMaterialSatuan[mat] || ""}`.trim()
                        : "—";
                }),
            ];

            const dataRow = sheet.addRow(rowValues);

            dataRow.eachCell((cell, colNumber) => {
                cell.alignment = {
                    vertical: "middle",
                    horizontal: colNumber <= 2 ? "left" : "center",
                };
                cell.border = {
                    top: { style: "thin", color: { argb: "FFE2E8F0" } },
                    bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
                    left: { style: "thin", color: { argb: "FFE2E8F0" } },
                    right: { style: "thin", color: { argb: "FFE2E8F0" } },
                };
                // zebra stripe
                if (idx % 2 === 1) {
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFF8FAFC" },
                    };
                }
            });

            // highlight kolom progress kalau 100%
            const progressCell = dataRow.getCell(3);
            if (unit.progress >= 100) {
                progressCell.font = { bold: true, color: { argb: "FF15803D" } };
            }
        });

        // === Lebar kolom otomatis ===
        sheet.columns.forEach((col, i) => {
            let maxLength = headers[i] ? headers[i].length : 10;
            col.eachCell?.({ includeEmpty: true }, (cell) => {
                const len = cell.value ? String(cell.value).length : 0;
                if (len > maxLength) maxLength = len;
            });
            col.width = Math.min(Math.max(maxLength + 4, 10), 30);
        });

        // === Autofilter di header ===
        sheet.autoFilter = {
            from: { row: 4, column: 2 },
            to: { row: sheet.rowCount, column: 3 },
        };

        const zoneFileLabel =
            zone === "Semua Zona" ? "SemuaZona" : `Zona${zone}`;
        const progressFileLabel = progressRangeLabel.replace(
            /[^a-zA-Z0-9]/g,
            "",
        );
        const fileName = `KartuMaterialUnit_${zoneFileLabel}_${progressFileLabel}.xlsx`;

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold">Kartu Material Unit</h2>}
        >
            <Head title="Kartu Material Unit" />

            <div className="space-y-5">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-[-0.02em]">
                        Kartu Material per Unit
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Rekap pemakaian material aktual dari log keluar gudang
                    </p>
                </div>

                <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                        <h2 className="font-bold">Kartu Material per Unit</h2>
                        <div className="flex flex-wrap gap-2">
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Cari unit, zona..."
                                className="w-36 rounded-xl border border-border bg-white px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <select
                                aria-label="Filter zona"
                                value={zone}
                                onChange={(e) => setZone(e.target.value)}
                                className="rounded-xl border border-border bg-white px-3 text-xs font-semibold"
                            >
                                <option>Semua Zona</option>
                                {zones.map((z) => (
                                    <option key={z}>{z}</option>
                                ))}
                            </select>
                            <select
                                aria-label="Filter progress"
                                value={progressRangeLabel}
                                onChange={(e) =>
                                    setProgressRangeLabel(e.target.value)
                                }
                                className="rounded-xl border border-border bg-white px-3 text-xs font-semibold"
                            >
                                {PROGRESS_RANGES.map((r) => (
                                    <option key={r.label} value={r.label}>
                                        {r.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                aria-label="Jumlah data per halaman"
                                value={pageSize}
                                onChange={(e) =>
                                    setPageSize(Number(e.target.value))
                                }
                                className="rounded-xl border border-border bg-white px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>
                                        {size} / halaman
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => handleExportExcel()}
                                disabled={rows.length === 0}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-500 disabled:text-white disabled:cursor-not-allowed"
                            >
                                <FileSpreadsheet size={14} />
                                Export Excel
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1380px] text-sm">
                            <thead className="bg-muted text-[10px] uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    {[
                                        "Unit",
                                        "Zona",
                                        "Progress",
                                        ...safeMaterialList,
                                    ].map((h) => (
                                        <th
                                            key={h}
                                            className="whitespace-nowrap px-4 py-3 text-left font-bold"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.length ? (
                                    paginatedRows.map((unit) => (
                                        <tr
                                            key={unit.id}
                                            className="border-t border-border hover:bg-muted/40"
                                        >
                                            <td className="px-4 py-3 font-mono text-sm font-bold text-primary">
                                                {unit.id}
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                Zona {unit.zona}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-16 rounded-full bg-muted">
                                                        <div
                                                            className="h-1.5 rounded-full bg-primary"
                                                            style={{
                                                                width: `${unit.progress}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="font-mono text-xs">
                                                        {unit.progress}%
                                                    </span>
                                                </div>
                                            </td>
                                            {safeMaterialList.map((mat) => (
                                                <td
                                                    key={mat}
                                                    className="px-4 py-3 font-mono text-xs"
                                                >
                                                    {unit.usage[mat]
                                                        ? `${unit.usage[mat]} ${safeMaterialSatuan[mat] || ""}`
                                                        : "—"}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={
                                                3 + safeMaterialList.length
                                            }
                                            className="px-5 py-14 text-center"
                                        >
                                            <PackageCheck
                                                size={26}
                                                className="mx-auto mb-2 text-muted-foreground/40"
                                            />
                                            <p className="text-sm font-semibold text-muted-foreground">
                                                Tidak ada unit pada filter ini
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {rows.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-xs text-muted-foreground">
                            <span>
                                Menampilkan {rangeStart}–{rangeEnd} dari{" "}
                                {rows.length} data
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    aria-label="Halaman sebelumnya"
                                    title="Halaman sebelumnya"
                                    onClick={() =>
                                        setPage((currentPage) =>
                                            Math.max(1, currentPage - 1),
                                        )
                                    }
                                    disabled={page <= 1}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-40 hover:bg-secondary/50"
                                >
                                    <ChevronLeft aria-hidden="true" size={14} />
                                </button>
                                <span className="font-semibold text-foreground">
                                    Halaman {page} / {totalPages}
                                </span>
                                <button
                                    type="button"
                                    aria-label="Halaman berikutnya"
                                    title="Halaman berikutnya"
                                    onClick={() =>
                                        setPage((currentPage) =>
                                            Math.min(
                                                totalPages,
                                                currentPage + 1,
                                            ),
                                        )
                                    }
                                    disabled={page >= totalPages}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-40 hover:bg-secondary/50"
                                >
                                    <ChevronRight
                                        aria-hidden="true"
                                        size={14}
                                    />
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
