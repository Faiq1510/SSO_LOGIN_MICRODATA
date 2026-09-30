import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Calendar, Download } from "lucide-react";

function formatRupiah(value) {
    return "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(value ?? 0));
}

export default function Neraca({ neraca, perTanggal, startDate: initialStartDate, endDate: initialEndDate }) {
    const [startDate, setStartDate] = useState(initialStartDate || perTanggal);
    const [endDate, setEndDate] = useState(initialEndDate || perTanggal);

    function requestDateRange(newStartDate, newEndDate) {
        router.get(
            route("finance.neraca.index"),
            { start_date: newStartDate, end_date: newEndDate },
            { preserveState: true, preserveScroll: true }
        );
    }

    function handleEndDateChange(e) {
        const newDate = e.target.value;
        setEndDate(newDate);
        requestDateRange(startDate, newDate);
    }

    function handleStartDateChange(e) {
        const newDate = e.target.value;
        setStartDate(newDate);
        requestDateRange(newDate, endDate);
    }

    // Fungsi Export PDF (Membuka di tab baru untuk preview)
    const handleExportPDF = () => {
        const url = route("finance.neraca.export", {
            start_date: startDate,
            end_date: endDate,
        });
        window.open(url, '_blank');
    };

    const aset = neraca?.aset ?? { kas_setara_kas: 0, persediaan_material: 0, total: 0 };
    const liabilitas = neraca?.liabilitas ?? { details: [], total: 0 };
    const modal = neraca?.modal ?? { modal_disetor: 0, laba_rugi_berjalan: 0, total: 0 };
    const totalLiabilitasModal = neraca?.total_liabilitas_modal ?? 0;
    const isBalanced = neraca?.is_balanced ?? false;

    return (
        <AuthenticatedLayout>
            <Head title="Neraca - Laporan Keuangan" />

            <div className="space-y-4 print:bg-white">
                {/* Page Header + Controls (satu baris, biar tidak makan tempat vertikal) */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold">Neraca</h1>
                        <p className="text-sm text-muted-foreground">
                            Posisi keuangan proyek pada satu titik waktu tertentu
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                            <Calendar size={16} className="text-gray-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={handleStartDateChange}
                                className="border-none bg-transparent p-0 text-sm focus:ring-0 text-gray-700 cursor-pointer"
                                title="Tanggal Awal"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={handleEndDateChange}
                                className="border-none bg-transparent p-0 text-sm focus:ring-0 text-gray-700 cursor-pointer"
                                title="Per Tanggal"
                            />
                        </div>

                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                        >
                            <Download size={16} />
                            Export PDF
                        </button>
                    </div>
                </div>

                {/* Print-only header */}
                <div className="hidden print:block text-center py-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800">SiteFlow — Neraca</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Periode: {new Date(startDate).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })} s/d {new Date(endDate).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:break-inside-avoid">
                    {/* Total Aset */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Total Aset
                            </p>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-foreground">
                            {formatRupiah(aset.total)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Kas + persediaan material
                        </p>
                    </div>

                    {/* Total Liabilitas */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Total Liabilitas
                            </p>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-amber-600">
                            {formatRupiah(liabilitas.total)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Utang ke pihak ketiga
                        </p>
                    </div>

                    {/* Total Modal */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Total Modal
                            </p>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-emerald-600">
                            {formatRupiah(modal.total)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Equity pemilik + laba berjalan
                        </p>
                    </div>
                </div>

                {/* Balance Check Banner */}
                <div
                    className={`flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-medium print:break-inside-avoid ${
                        isBalanced
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                    }`}
                >
                    {isBalanced ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    )}
                    {isBalanced
                        ? "Neraca Seimbang ✓ — Total Aset = Total Liabilitas + Modal"
                        : `Neraca Tidak Seimbang ✕ — Selisih: ${formatRupiah(Math.abs(aset.total - totalLiabilitasModal))}`}
                </div>

                {/* Detail Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:break-inside-avoid">
                    {/* LEFT: ASET */}
                    <div className="rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border px-6 py-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                                Aset
                            </span>
                        </div>
                        <div className="divide-y divide-border">
                            <div className="flex items-center justify-between px-6 py-4">
                                <span className="text-sm text-foreground">Kas & Setara Kas</span>
                                <span className="text-sm font-semibold text-foreground">
                                    {formatRupiah(aset.kas_setara_kas)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between px-6 py-4">
                                <span className="text-sm text-foreground">Persediaan Material</span>
                                <span className="text-sm font-semibold text-foreground">
                                    {formatRupiah(aset.persediaan_material)}
                                </span>
                            </div>
                        </div>
                        <div className="border-t-2 border-blue-200 bg-blue-50/50 px-6 py-4 rounded-b-2xl">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold uppercase text-foreground">
                                    Total Aset
                                </span>
                                <span className="text-sm font-bold text-blue-600">
                                    {formatRupiah(aset.total)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: LIABILITAS + MODAL */}
                    <div className="space-y-4">
                        {/* LIABILITAS */}
                        <div className="rounded-2xl border border-border bg-card shadow-sm">
                            <div className="border-b border-border px-6 py-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                                    Liabilitas
                                </span>
                            </div>
                            <div className="divide-y divide-border">
                                {liabilitas.details.length > 0 ? (
                                    liabilitas.details.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between px-6 py-4"
                                        >
                                            <span className="text-sm text-foreground">
                                                {item.nama_akun}
                                            </span>
                                            <span className="text-sm font-semibold text-foreground">
                                                {formatRupiah(item.saldo)}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-6 py-4">
                                        <span className="text-sm text-muted-foreground italic">
                                            Belum ada liabilitas tercatat
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="border-t-2 border-amber-200 bg-amber-50/50 px-6 py-3 rounded-b-2xl">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase text-amber-700">
                                        Total Liabilitas
                                    </span>
                                    <span className="text-sm font-bold text-amber-600">
                                        {formatRupiah(liabilitas.total)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* MODAL */}
                        <div className="rounded-2xl border border-border bg-card shadow-sm">
                            <div className="border-b border-border px-6 py-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                    Modal
                                </span>
                            </div>
                            <div className="divide-y divide-border">
                                <div className="flex items-center justify-between px-6 py-4">
                                    <span className="text-sm text-foreground">
                                        Modal Disetor Owner
                                    </span>
                                    <span className="text-sm font-semibold text-foreground">
                                        {formatRupiah(modal.modal_disetor)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between px-6 py-4">
                                    <span className="text-sm text-foreground">
                                        Laba / Rugi Berjalan
                                    </span>
                                    <span className="text-sm font-semibold text-foreground">
                                        {formatRupiah(modal.laba_rugi_berjalan)}
                                    </span>
                                </div>
                            </div>
                            <div className="border-t-2 border-emerald-200 bg-emerald-50/50 px-6 py-3 rounded-b-2xl">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase text-emerald-700">
                                        Total Modal
                                    </span>
                                    <span className="text-sm font-bold text-emerald-600">
                                        {formatRupiah(modal.total)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* TOTAL LIABILITAS & MODAL */}
                        <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 px-6 py-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold uppercase text-foreground">
                                    Total Liabilitas & Modal
                                </span>
                                <span className="text-sm font-bold text-foreground">
                                    {formatRupiah(totalLiabilitasModal)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sync info footer */}
                <div className="flex justify-end print:hidden">
                    <p className="text-xs text-muted-foreground italic">
                        Sinkron otomatis · baca saja
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}