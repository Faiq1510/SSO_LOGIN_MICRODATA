import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Calendar, Download } from "lucide-react";

function formatRupiah(value) {
    return "Rp " + new Intl.NumberFormat("id-ID").format(value ?? 0);
}

function formatTanggal(tanggal) {
    return new Date(tanggal).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

export default function KasFlow({ dokumen = [], summary = {}, startDate: initialStartDate = "", endDate: initialEndDate = "" }) {
    const [search, setSearch] = useState("");
    const [filterJenis, setFilterJenis] = useState("Semua");

    // State untuk Filter Tanggal
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);

    const filtered = useMemo(() => {
        return dokumen.filter((item) => {
            const cocokJenis = filterJenis === "Semua" || item.jenis === filterJenis;
            const q = search.toLowerCase();
            const cocokSearch =
                !q ||
                item.no_dokumen.toLowerCase().includes(q) ||
                (item.akun ?? "").toLowerCase().includes(q) ||
                (item.penerima ?? "").toLowerCase().includes(q);

            const tanggalItem = item.tanggal ? new Date(item.tanggal) : null;
            const cocokMulai = !startDate || (tanggalItem && tanggalItem >= new Date(startDate));
            const cocokAkhir = !endDate || (tanggalItem && tanggalItem <= new Date(endDate));

            return cocokJenis && cocokSearch && cocokMulai && cocokAkhir;
        });
    }, [dokumen, search, filterJenis, startDate, endDate]);

    // Fungsi Export PDF (Buka di tab baru untuk preview)
    const handleExportPDF = () => {
        const d = startDate ? new Date(startDate) : new Date();
        const bulan = d.getMonth() + 1;
        const tahun = d.getFullYear();

        const url = route('finance.kas-flow.export', { bulan, tahun });
        window.open(url, '_blank');
    };

    return (
        <AuthenticatedLayout>
            <Head title="Kas Flow" />

            <div className="space-y-6 print:bg-white">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold">Kas Flow</h1>
                        <p className="text-sm text-muted-foreground">
                            Surat pertanggungjawaban otomatis dari setiap transaksi
                        </p>
                    </div>

                    {/* Action Buttons: Tanggal & Export */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                            <Calendar size={16} className="text-gray-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setStartDate(value);
                                    router.get(
                                        route("finance.kas-flow"),
                                        { start_date: value, end_date: endDate },
                                        { preserveState: true, preserveScroll: true }
                                    );
                                }}
                                className="border-none bg-transparent p-0 text-sm focus:ring-0 text-gray-700 cursor-pointer"
                                title="Tanggal Awal"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setEndDate(value);
                                    router.get(
                                        route("finance.kas-flow"),
                                        { start_date: startDate, end_date: value },
                                        { preserveState: true, preserveScroll: true }
                                    );
                                }}
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 print:break-inside-avoid">
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                            Total SPJ terbit
                        </p>
                        <p className="mt-2 text-2xl font-bold">{summary.total_dokumen ?? 0} Dokumen</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {summary.jumlah_pengeluaran ?? 0} pengeluaran · {summary.jumlah_penerimaan ?? 0} penerimaan
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                            Total nilai pengeluaran
                        </p>
                        <p className="mt-2 text-2xl font-bold">
                            {formatRupiah(summary.total_nilai_pengeluaran)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">Akumulasi kas keluar</p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                            Total nilai penerimaan
                        </p>
                        <p className="mt-2 text-2xl font-bold">
                            {formatRupiah(summary.total_nilai_penerimaan)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">Akumulasi kas masuk</p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                            Selisih / saldo
                        </p>
                        <p className="mt-2 text-2xl font-bold">{formatRupiah(summary.saldo_akhir)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Penerimaan dikurangi pengeluaran</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card shadow-sm print:shadow-none print:border-gray-300">
                    <div className="text-center py-6 border-b border-gray-200 hidden print:block">
                        <h2 className="text-lg font-bold text-gray-800">SiteFlow — Kas Flow</h2>
                        {(startDate || endDate) && (
                            <p className="text-sm text-gray-500 mt-1">
                                Periode: {startDate ? formatTanggal(startDate) : "Awal"} s/d {endDate ? formatTanggal(endDate) : "Sekarang"}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 p-6 pb-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                        <h2 className="text-lg font-bold">Daftar Dokumen SPJ</h2>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Cari nomor, akun, penerima..."
                                className="rounded-xl border border-border px-3 py-2 text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <select
                                className="cursor-pointer rounded-xl border border-border px-3 py-2 text-sm"
                                value={filterJenis}
                                onChange={(e) => setFilterJenis(e.target.value)}
                            >
                                <option value="Semua">Semua</option>
                                <option value="Penerimaan">Penerimaan</option>
                                <option value="Pengeluaran">Pengeluaran</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full text-sm print:w-full print:table-fixed print:text-[9px]">
                            <thead>
                                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                                    <th className="px-6 py-3 print:px-1.5 print:py-1.5">No SPJ/BPT</th>
                                    <th className="px-6 py-3 print:px-1.5 print:py-1.5">Tanggal</th>
                                    <th className="px-6 py-3 print:px-1.5 print:py-1.5">Jenis</th>
                                    <th className="px-6 py-3 print:px-1.5 print:py-1.5">Akun / Termin</th>
                                    <th className="px-6 py-3 print:px-1.5 print:py-1.5">Unit</th>
                                    <th className="px-6 py-3 print:px-1.5 print:py-1.5">Penerima</th>
                                    <th className="px-6 py-3 print:px-1.5 print:py-1.5">Debit</th>
                                    <th className="px-6 py-3 print:px-1.5 print:py-1.5">Kredit</th>
                                    <th className="px-6 py-3 print:px-1.5 print:py-1.5">Metode</th>
                                    <th className="px-6 py-3 print:px-1.5 print:py-1.5">Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item) => (
                                    <tr key={item.no_dokumen} className="border-b border-border last:border-0">
                                        <td className="px-6 py-4 print:px-1.5 print:py-1.5 font-mono text-xs text-primary">
                                            {item.no_dokumen}
                                        </td>
                                        <td className="px-6 py-4 print:px-1.5 print:py-1.5">{formatTanggal(item.tanggal)}</td>
                                        <td className="px-6 py-4 print:px-1.5 print:py-1.5">
                                            <span
                                                className={
                                                    "rounded-full px-2 py-1 text-xs font-medium " +
                                                    (item.jenis === "Penerimaan"
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-amber-100 text-amber-700")
                                                }
                                            >
                                                {item.jenis}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 print:px-1.5 print:py-1.5 font-medium">{item.akun}</td>
                                        <td className="px-6 py-4 print:px-1.5 print:py-1.5 text-primary">{item.unit || "-"}</td>
                                        <td className="px-6 py-4 print:px-1.5 print:py-1.5">{item.penerima || "-"}</td>
                                        <td className="px-6 py-4 print:px-1.5 print:py-1.5 text-emerald-600">
                                            {item.debit > 0 ? formatRupiah(item.debit) : "-"}
                                        </td>
                                        <td className="px-6 py-4 print:px-1.5 print:py-1.5 text-red-600">
                                            {item.kredit > 0 ? formatRupiah(item.kredit) : "-"}
                                        </td>
                                        <td className="px-6 py-4 print:px-1.5 print:py-1.5">{item.metode}</td>
                                        <td className="px-6 py-4 print:px-1.5 print:py-1.5 font-semibold">{formatRupiah(item.saldo)}</td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-8 text-center text-muted-foreground">
                                            Tidak ada dokumen SPJ yang cocok.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between border-t border-border p-4 text-xs text-muted-foreground print:hidden">
                        <span>Menampilkan {filtered.length} dari {dokumen.length} dokumen</span>
                        <span>Diperbarui otomatis saat ada transaksi baru</span>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}