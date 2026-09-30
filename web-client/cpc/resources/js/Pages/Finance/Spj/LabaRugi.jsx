import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const LabaRugi = ({ pendapatan = [], beban = [], summary = {}, filters = {} }) => {
  const [startDate, setStartDate] = useState(filters.start_date || '');
  const [endDate, setEndDate] = useState(filters.end_date || '');

  const handleApplyFilter = (newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    router.get(
      route('finance.laba-rugi'),
      { start_date: newStartDate, end_date: newEndDate },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handleStartDateChange = (e) => {
    handleApplyFilter(e.target.value, endDate);
  };

  const handleEndDateChange = (e) => {
    handleApplyFilter(startDate, e.target.value);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('Rp', 'Rp ');
  };

  const formatTanggal = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const handleExportPDF = () => {
    const url = route('finance.laba-rugi.export', {
        start_date: startDate,
        end_date: endDate,
    });
    window.open(url, '_blank');
  };

  const data = {
    summary: {
      totalPendapatan: summary.totalPendapatan ?? 0,
      sumberPendapatan: summary.sumberPendapatan ?? 0,
      totalBeban: summary.totalBeban ?? 0,
      akunBeban: summary.akunBeban ?? 0,
      labaKotor: summary.labaKotor ?? 0,
      margin: summary.margin ?? 0,
    },
    pendapatan,
    beban,
  };

  return (
    <AuthenticatedLayout>
      <Head title="Laba Rugi - Laporan Keuangan" />

      <div className="print:bg-white">
        {/* Header - Disembunyikan saat dicetak (print:hidden) */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 print:hidden">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Laporan Laba Rugi</h1>
            <p className="text-sm text-gray-500 mt-1">Pendapatan proyek dikurangi beban operasional</p>
          </div>

          {/* Action Buttons: Tanggal & Export */}
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
              className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Download size={16} />
              Export PDF
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 print:break-inside-avoid">
          {/* Total Pendapatan */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 print:border-gray-300 print:shadow-none">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Pendapatan</p>
                <h3 className="text-3xl font-extrabold tracking-tight text-slate-800">{formatCurrency(data.summary.totalPendapatan)}</h3>
                <p className="text-sm text-slate-400 mt-1">{data.summary.sumberPendapatan} sumber pendapatan</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-full print:border print:border-slate-300">
                <TrendingUp size={20} className="text-slate-500" />
              </div>
            </div>
          </div>

          {/* Total Beban Operasional */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 print:border-gray-300 print:shadow-none">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Beban Operasional</p>
                <h3 className="text-3xl font-extrabold tracking-tight text-slate-800">{formatCurrency(data.summary.totalBeban)}</h3>
                <p className="text-sm text-slate-400 mt-1">{data.summary.akunBeban} akun beban</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-full print:border print:border-slate-300">
                <TrendingDown size={20} className="text-slate-500" />
              </div>
            </div>
          </div>

          {/* Laba Kotor */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 print:border-gray-300 print:shadow-none">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Laba Kotor</p>
                <h3 className="text-3xl font-extrabold tracking-tight text-slate-800">{formatCurrency(data.summary.labaKotor)}</h3>
                <p className="text-sm text-slate-400 mt-1">Margin {data.summary.margin >= 0 ? '+' : ''}{data.summary.margin}% dari pendapatan</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-full print:border print:border-slate-300">
                <DollarSign size={20} className="text-slate-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Report Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-6 mb-6 print:shadow-none print:border-gray-300">
          <h2 className="text-lg font-bold text-gray-800">SiteFlow — Laporan Laba Rugi</h2>
          <p className="text-sm text-gray-500 mt-1">
            Periode: {formatTanggal(startDate)} s/d {formatTanggal(endDate)}
          </p>
        </div>

        {/* Pendapatan Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto mb-6 print:shadow-none print:border-gray-300">
          <div className="p-6 min-w-[700px] print:min-w-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-slate-400 print:border print:border-slate-600"></div>
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pendapatan</h3>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 backdrop-blur print:bg-white print:border-b-2 print:border-slate-300">
                  <th className="py-4 px-4 text-left font-bold text-slate-500 text-xs tracking-wider w-32">KODE</th>
                  <th className="py-4 px-4 text-left font-bold text-slate-500 text-xs tracking-wider">URAIAN PENDAPATAN</th>
                  <th className="py-4 px-4 text-left font-bold text-slate-500 text-xs tracking-wider">KETERANGAN</th>
                  <th className="py-4 px-4 text-right font-bold text-slate-500 text-xs tracking-wider">NOMINAL</th>
                </tr>
              </thead>
              <tbody>
                {data.pendapatan.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-400 italic">Belum ada data pendapatan.</td>
                  </tr>
                ) : (
                  data.pendapatan.map((item, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors print:border-slate-200">
                      <td className="py-5 px-4 text-slate-600 font-mono text-xs">{item.id}</td>
                      <td className="py-5 px-4 font-semibold text-slate-800">{item.uraian}</td>
                      <td className="py-5 px-4 text-slate-500">{item.keterangan}</td>
                      <td className="py-5 px-4 text-right font-bold text-slate-800">{formatCurrency(item.nominal)}</td>
                    </tr>
                  ))
                )}
                <tr className="bg-slate-100/60 border-l-4 border-l-slate-400 border-t-2 border-slate-200 print:bg-white print:border-slate-400">
                  <td colSpan="3" className="py-5 px-4 font-bold text-slate-800 tracking-wide">TOTAL PENDAPATAN</td>
                  <td className="py-5 px-4 text-right font-extrabold text-slate-800 text-base">{formatCurrency(data.summary.totalPendapatan)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Beban Operasional Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto mb-6 print:shadow-none print:border-gray-300 print:break-inside-avoid">
          <div className="p-6 min-w-[700px] print:min-w-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-slate-400 print:border print:border-slate-600"></div>
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex gap-2">
                Beban Operasional <span className="text-slate-400 normal-case font-normal">(Kas Keluar)</span>
              </h3>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 backdrop-blur print:bg-white print:border-b-2 print:border-slate-300">
                  <th className="py-4 px-4 text-left font-bold text-slate-500 text-xs tracking-wider">NAMA AKUN</th>
                  <th className="py-4 px-4 text-left font-bold text-slate-500 text-xs tracking-wider">TRANSAKSI</th>
                  <th className="py-4 px-4 text-left font-bold text-slate-500 text-xs tracking-wider">UNIT TERKAIT</th>
                  <th className="py-4 px-4 text-right font-bold text-slate-500 text-xs tracking-wider">TOTAL BEBAN</th>
                </tr>
              </thead>
              <tbody>
                {data.beban.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-400 italic">Belum ada data beban operasional.</td>
                  </tr>
                ) : (
                  data.beban.map((item, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors print:border-slate-200">
                      <td className="py-5 px-4 font-semibold text-slate-800">{item.akun}</td>
                      <td className="py-5 px-4 text-slate-500">{item.transaksi}</td>
                      <td className="py-5 px-4 text-slate-500">{item.unit}</td>
                      <td className="py-5 px-4 text-right font-bold text-slate-800">{formatCurrency(item.nominal)}</td>
                    </tr>
                  ))
                )}
                <tr className="bg-slate-100/60 border-l-4 border-l-slate-400 border-t-2 border-slate-200 print:bg-white print:border-slate-400">
                  <td colSpan="3" className="py-5 px-4 font-bold text-slate-800 tracking-wide">TOTAL BEBAN OPERASIONAL</td>
                  <td className="py-5 px-4 text-right font-extrabold text-slate-800 text-base">{formatCurrency(data.summary.totalBeban)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Summary (Laba Kotor) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto print:shadow-none print:border-gray-300 print:break-inside-avoid">
          <div className="bg-slate-50 p-6 flex justify-between items-end min-w-[700px] print:min-w-full print:bg-white">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-slate-600 print:border print:border-slate-800"></div>
                <span className="font-bold text-slate-800 text-sm">LABA KOTOR</span>
                <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded print:border print:border-slate-800">LABA</span>
              </div>
              <p className="text-sm text-slate-500">
                Pendapatan {formatCurrency(data.summary.totalPendapatan)} - Beban Operasional {formatCurrency(data.summary.totalBeban)}
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-extrabold text-slate-800 mb-1">
                {data.summary.labaKotor >= 0 ? '+' : ''}{formatCurrency(data.summary.labaKotor)}
              </h2>
              <p className="text-sm text-slate-500 font-medium">Margin {data.summary.margin >= 0 ? '+' : ''}{data.summary.margin}%</p>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default LabaRugi;