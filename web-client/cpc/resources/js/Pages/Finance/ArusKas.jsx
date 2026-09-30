import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Calendar, Download, TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";

function formatRupiah(value) {
    return "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(value ?? 0));
}

function formatTanggal(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

export default function ArusKas({ items = [], summary = {}, filters = {} }) {
    const [startDate, setStartDate] = useState(filters.start_date || "");
    const [endDate, setEndDate] = useState(filters.end_date || "");

    const handleStartDateChange = (e) => {
        const value = e.target.value;
        setStartDate(value);
        router.get(
            route("finance.arus-kas"),
            { start_date: value, end_date: endDate },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleEndDateChange = (e) => {
        const value = e.target.value;
        setEndDate(value);
        router.get(
            route("finance.arus-kas"),
            { start_date: startDate, end_date: value },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleExportPDF = () => {
        const url = route("finance.arus-kas.export", {
            start_date: startDate,
            end_date: endDate,
        });
        window.open(url, '_blank');
    };

    const arusBersih = summary.arusBersih ?? 0;

    return (
        <AuthenticatedLayout>
            <Head title="Arus Kas - Laporan Keuangan" />

            <div className="space-y-6 print:bg-white">
                {/* Header */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold">Laporan Arus Kas</h1>
                        <p className="text-sm text-muted-foreground">
                            Ringkasan aliran kas masuk dan keluar berdasarkan akun
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
                                title="Tanggal Akhir"
                            />
                        </div>

                        <button
                            onClick={handleExportPDF}
                            className="cursor-pointer flex items-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                        >
                            <Download size={16} />
                            Export PDF
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:break-inside-avoid">
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Total Kas Masuk
                                </p>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {formatRupiah(summary.totalMasuk)}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Penerimaan periode ini</p>
                            </div>
                            <div className="p-2 bg-emerald-50 rounded-full">
                                <TrendingUp size={20} className="text-emerald-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Total Kas Keluar
                                </p>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {formatRupiah(summary.totalKeluar)}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Pengeluaran periode ini</p>
                            </div>
                            <div className="p-2 bg-red-50 rounded-full">
                                <TrendingDown size={20} className="text-red-500" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Arus Kas Bersih
                                </p>
                                <h3 className={`text-2xl font-bold ${arusBersih >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {arusBersih >= 0 ? "+" : ""}{formatRupiah(arusBersih)}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Masuk dikurangi keluar</p>
                            </div>
                            <div className={`p-2 rounded-full ${arusBersih >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                                <ArrowLeftRight size={20} className={arusBersih >= 0 ? "text-emerald-600" : "text-red-500"} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden print:shadow-none print:border-gray-300">
                    {/* Print-only header */}
                    <div className="text-center py-6 border-b border-gray-200 hidden print:block">
                        <h2 className="text-lg font-bold text-gray-800">SiteFlow — Laporan Arus Kas</h2>
                        {(startDate || endDate) && (
                            <p className="text-sm text-gray-500 mt-1">
                                Periode: {startDate ? formatTanggal(startDate) : "Awal"} s/d{" "}
                                {endDate ? formatTanggal(endDate) : "Sekarang"}
                            </p>
                        )}
                    </div>

                    <div className="px-6 py-4 border-b border-border print:hidden">
                        <h2 className="text-lg font-bold">Detail Arus Kas per Akun</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground bg-gray-50 print:bg-white print:border-b-2 print:border-gray-300">
                                    <th className="px-6 py-3 font-semibold">Uraian / Akun</th>
                                    <th className="px-6 py-3 font-semibold text-right">Kas Masuk</th>
                                    <th className="px-6 py-3 font-semibold text-right">Kas Keluar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr
                                        key={index}
                                        className="border-b border-border last:border-0 print:border-gray-200"
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-800">
                                            {item.uraian}
                                        </td>
                                        <td className="px-6 py-4 text-right text-emerald-600 font-semibold">
                                            {item.masuk > 0 ? formatRupiah(item.masuk) : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-right text-red-500 font-semibold">
                                            {item.keluar > 0 ? formatRupiah(item.keluar) : "-"}
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-6 py-8 text-center text-muted-foreground"
                                        >
                                            Tidak ada transaksi pada periode ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {items.length > 0 && (
                                <tfoot>
                                    <tr className="border-t-2 border-gray-300 bg-gray-50 print:bg-white">
                                        <td className="px-6 py-4 font-bold text-gray-800">TOTAL</td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-700">
                                            {formatRupiah(summary.totalMasuk)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-red-600">
                                            {formatRupiah(summary.totalKeluar)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {/* Arus Bersih Footer */}
                    {items.length > 0 && (
                        <div
                            className={`px-6 py-4 flex justify-between items-center border-t-2 ${
                                arusBersih >= 0
                                    ? "border-emerald-200 bg-emerald-50/60"
                                    : "border-red-200 bg-red-50/60"
                            } print:bg-white print:border-gray-400`}
                        >
                            <span className="font-bold text-sm uppercase">Arus Kas Bersih</span>
                            <span
                                className={`text-xl font-bold ${
                                    arusBersih >= 0 ? "text-emerald-600" : "text-red-600"
                                }`}
                            >
                                {arusBersih >= 0 ? "+" : ""}
                                {formatRupiah(arusBersih)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end print:hidden">
                    <p className="text-xs text-muted-foreground italic">
                        Sinkron otomatis · baca saja
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
