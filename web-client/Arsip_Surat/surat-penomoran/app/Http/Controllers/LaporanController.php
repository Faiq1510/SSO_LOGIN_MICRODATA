<?php

namespace App\Http\Controllers;

use App\Models\Arsip;
use App\Models\SuratKeluar;
use App\Exports\LaporanExport;
use App\Mail\LaporanMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;

class LaporanController extends Controller
{
    public function index(Request $request)
    {
        [$dari, $sampai] = $this->rentangTanggal($request);
        $jenis           = $request->input('jenis');
        $status          = $request->input('status');

        $jenisClean = strtolower(trim((string) $jenis));

        // Hitung Ringkasan berdasarkan Filter Tanggal, Jenis, dan Status
        $ringkasan = $this->hitungRingkasan($dari, $sampai, $jenis, $status);

        // ===================== TREN SURAT (LINE CHART) =====================
        $trenKeluar = collect();
        if (empty($jenisClean) || in_array($jenisClean, ['semua jenis', 'semua', 'surat keluar', 'keluar'])) {
            $queryKeluar = SuratKeluar::whereBetween('tanggal_surat', [$dari, $sampai]);
            if ($status && !in_array(strtolower($status), ['semua status', 'semua', ''])) {
                $queryKeluar->where('status', $status);
            }
            $trenKeluar = $queryKeluar
                ->selectRaw('DATE(tanggal_surat) as tanggal, COUNT(*) as jumlah')
                ->groupBy('tanggal')
                ->pluck('jumlah', 'tanggal');
        }

        $trenMasuk = collect();
        if ((empty($jenisClean) || in_array($jenisClean, ['semua jenis', 'semua', 'surat masuk', 'masuk'])) && class_exists(\App\Models\SuratMasuk::class)) {
            $queryMasuk = \App\Models\SuratMasuk::whereBetween('tanggal_surat', [$dari, $sampai]);
            if ($status && !in_array(strtolower($status), ['semua status', 'semua', ''])) {
                $queryMasuk->where('status', $status);
            }
            $trenMasuk = $queryMasuk
                ->selectRaw('DATE(tanggal_surat) as tanggal, COUNT(*) as jumlah')
                ->groupBy('tanggal')
                ->pluck('jumlah', 'tanggal');
        }

        $labelTanggal = collect();
        $tanggalBerjalan = $dari->copy();
        while ($tanggalBerjalan->lte($sampai)) {
            $labelTanggal->push($tanggalBerjalan->format('Y-m-d'));
            $tanggalBerjalan->addDay();
        }

        $dataTrenMasuk  = $labelTanggal->map(fn ($tgl) => $trenMasuk->get($tgl, 0))->values();
        $dataTrenKeluar = $labelTanggal->map(fn ($tgl) => $trenKeluar->get($tgl, 0))->values();
        $labelTrenChart = $labelTanggal->map(fn ($tgl) => Carbon::parse($tgl)->translatedFormat('d M'))->values();

        return view('laporan.index', array_merge($ringkasan, [
            'labelTrenChart' => $labelTrenChart,
            'dataTrenMasuk'  => $dataTrenMasuk,
            'dataTrenKeluar' => $dataTrenKeluar,
            'updatedAt'      => now()->translatedFormat('d M Y H:i'),
        ]));
    }

    // Direct Download PDF
    public function exportPdf(Request $request)
    {
        [$dari, $sampai] = $this->rentangTanggal($request);
        $jenis           = $request->input('jenis');
        $status          = $request->input('status');

        $ringkasan   = $this->hitungRingkasan($dari, $sampai, $jenis, $status);
        $daftarSurat = $this->daftarSuratGabungan($dari, $sampai, $jenis, $status);

        $pdf = Pdf::loadView('laporan.pdf', [
            'ringkasan' => $ringkasan,
            'data'      => $daftarSurat,
            'periode'   => ['mulai' => $dari, 'akhir' => $sampai],
        ])->setPaper('a4', 'portrait');

        $filename = 'laporan-surat-' . now()->format('Ymd_His') . '.pdf';

        return $pdf->download($filename);
    }

    // Direct Download Excel
    public function exportExcel(Request $request)
    {
        [$dari, $sampai] = $this->rentangTanggal($request);
        $jenis           = $request->input('jenis');
        $status          = $request->input('status');

        $daftarSurat = $this->daftarSuratGabungan($dari, $sampai, $jenis, $status);
        $filename    = 'laporan-surat-' . now()->format('Ymd_His') . '.xlsx';

        return Excel::download(new LaporanExport($daftarSurat), $filename);
    }

    public function exportPdfPublic(Request $request)
    {
        return $this->exportPdf($request);
    }

    public function sendEmail(Request $request)
    {
        $request->validate([
            'email'      => 'required|email',
            'lampiran'   => 'required|array|min:1',
            'lampiran.*' => 'file|mimes:pdf,xlsx,xls|max:10240',
        ]);

        [$dari, $sampai] = $this->rentangTanggal($request);
        $jenis           = $request->input('jenis');
        $status          = $request->input('status');

        $ringkasan = $this->hitungRingkasan($dari, $sampai, $jenis, $status);

        $lampiran = [];
        foreach ($request->file('lampiran') as $file) {
            $lampiran[] = [
                'nama' => $file->getClientOriginalName(),
                'mime' => $file->getMimeType(),
                'isi'  => file_get_contents($file->getRealPath()),
            ];
        }

        Mail::to($request->email)->send(
            new LaporanMail($ringkasan, $dari, $sampai, $lampiran)
        );

        $namaFile = collect($lampiran)->pluck('nama')->implode(', ');

        return back()->with('success', "Laporan ({$namaFile}) berhasil dikirim ke {$request->email}");
    }

    // ===================== HELPER: FILTER TANGGAL =====================
    private function rentangTanggal(Request $request): array
    {
        $dariInput   = $request->input('dari') ?? $request->input('start_date');
        $sampaiInput = $request->input('sampai') ?? $request->input('end_date');

        $dari = $dariInput
            ? Carbon::parse($dariInput)->startOfDay()
            : now()->startOfMonth();

        $sampai = $sampaiInput
            ? Carbon::parse($sampaiInput)->endOfDay()
            : now()->endOfMonth();

        return [$dari, $sampai];
    }

    // ===================== HELPER: RINGKASAN ANGKA =====================
    private function hitungRingkasan(Carbon $dari, Carbon $sampai, ?string $jenis = null, ?string $status = null): array
    {
        // Normalisasi string filter jenis
        $jenisClean = strtolower(trim((string) $jenis));

        // Tentukan apakah query Surat Keluar & Surat Masuk perlu dijalankan
        $hitungKeluar = empty($jenisClean) || in_array($jenisClean, ['semua jenis', 'semua', 'surat keluar', 'keluar']);
        $hitungMasuk  = empty($jenisClean) || in_array($jenisClean, ['semua jenis', 'semua', 'surat masuk', 'masuk']);

        if (in_array($jenisClean, ['surat masuk', 'masuk'])) {
            $hitungKeluar = false;
        }

        if (in_array($jenisClean, ['surat keluar', 'keluar'])) {
            $hitungMasuk = false;
        }

        $suratKeluar = 0;
        $suratMasuk  = 0;
        $selesai     = 0;
        $dalamProses = 0;
        $menunggu    = 0;

        // 1. Hitung Surat Keluar
        if ($hitungKeluar) {
            $keluarQuery = SuratKeluar::whereBetween('tanggal_surat', [$dari, $sampai]);
            if ($status && !in_array(strtolower($status), ['semua status', 'semua', ''])) {
                $keluarQuery->where('status', $status);
            }

            $suratKeluar = $keluarQuery->count();

            $selesai     += (clone $keluarQuery)->where('status', 'Selesai')->count();
            $dalamProses += (clone $keluarQuery)->whereIn('status', ['Dikirim', 'Diproses', 'Proses'])->count();
            $menunggu    += (clone $keluarQuery)->whereIn('status', ['Draft', 'Baru', 'Menunggu'])->count();
        }

        // 2. Hitung Surat Masuk
        if ($hitungMasuk && class_exists(\App\Models\SuratMasuk::class)) {
            $masukQuery = \App\Models\SuratMasuk::whereBetween('tanggal_surat', [$dari, $sampai]);
            if ($status && !in_array(strtolower($status), ['semua status', 'semua', ''])) {
                $masukQuery->where('status', $status);
            }

            $suratMasuk = $masukQuery->count();

            $selesai     += (clone $masukQuery)->where('status', 'Selesai')->count();
            $dalamProses += (clone $masukQuery)->whereIn('status', ['Dikirim', 'Diproses', 'Proses'])->count();
            $menunggu    += (clone $masukQuery)->whereIn('status', ['Draft', 'Baru', 'Menunggu'])->count();
        }

        // Total Surat menyesuaikan dengan jenis yang sedang difilter
        $totalSurat = $suratMasuk + $suratKeluar;

        // 3. Query Arsip
        $arsipQuery = Arsip::whereBetween('tanggal_surat', [$dari, $sampai]);
        if (!empty($jenisClean) && !in_array($jenisClean, ['semua jenis', 'semua'])) {
            $arsipQuery->where('jenis', 'LIKE', "%{$jenis}%");
        }
        if ($status && !in_array(strtolower($status), ['semua status', 'semua', ''])) {
            $arsipQuery->where('status', $status);
        }
        $arsip = $arsipQuery->count();

        $disposisi = 0;

        return [
            'totalSurat'  => $totalSurat,
            'suratMasuk'  => $suratMasuk,
            'suratKeluar' => $suratKeluar,
            'arsip'       => $arsip,
            'disposisi'   => $disposisi,
            'selesai'     => $selesai,
            'dalamProses' => $dalamProses,
            'menunggu'    => $menunggu,
        ];
    }

    // ===================== HELPER: DAFTAR SURAT UNTUK EXPORT =====================
    private function daftarSuratGabungan(Carbon $dari, Carbon $sampai, ?string $jenis = null, ?string $status = null)
    {
        $jenisClean = strtolower(trim((string) $jenis));

        $keluar = collect();
        if (empty($jenisClean) || in_array($jenisClean, ['semua jenis', 'semua', 'surat keluar', 'keluar'])) {
            $q = SuratKeluar::whereBetween('tanggal_surat', [$dari, $sampai]);
            if ($status && !in_array(strtolower($status), ['semua status', 'semua', ''])) {
                $q->where('status', $status);
            }
            $keluar = $q->get()->map(fn ($s) => [
                'nomor_surat' => $s->nomor_surat,
                'jenis'       => 'Surat Keluar',
                'keterangan'  => $s->perihal ?? $s->tujuan,
                'tanggal'     => $s->tanggal_surat,
                'status'      => $s->status,
            ]);
        }

        $masuk = collect();
        if ((empty($jenisClean) || in_array($jenisClean, ['semua jenis', 'semua', 'surat masuk', 'masuk'])) && class_exists(\App\Models\SuratMasuk::class)) {
            $q = \App\Models\SuratMasuk::whereBetween('tanggal_surat', [$dari, $sampai]);
            if ($status && !in_array(strtolower($status), ['semua status', 'semua', ''])) {
                $q->where('status', $status);
            }
            $masuk = $q->get()->map(fn ($s) => [
                'nomor_surat' => $s->nomor_surat ?? '-',
                'jenis'       => 'Surat Masuk',
                'keterangan'  => $s->perihal ?? ($s->pengirim ?? '-'),
                'tanggal'     => $s->tanggal_surat,
                'status'      => $s->status ?? '-',
            ]);
        }

        return $keluar->concat($masuk)->sortBy('tanggal')->values();
    }
}