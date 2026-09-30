<?php

namespace App\Http\Controllers;

use App\Models\AkunReferensi;
use App\Models\JournalEntry;
use App\Models\KasMasuk;
use App\Models\KasKeluar;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

/**
 * @OA\Tag(
 *     name="Keuangan - Laporan",
 *     description="Laporan keuangan dan ekspor PDF"
 * )
 */
class FinanceController extends Controller
{
    /**
     * @OA\Get(
     *     path="/finance/laba-rugi",
     *     tags={"Keuangan - Laporan"},
     *     summary="Laporan Laba Rugi",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="start_date", in="query", @OA\Schema(type="string", format="date")),
     *     @OA\Parameter(name="end_date", in="query", @OA\Schema(type="string", format="date")),
     *     @OA\Response(response=200, description="Halaman laporan laba rugi")
     * )
     */
    public function labaRugi(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', now()->endOfMonth()->toDateString());

        $pendapatanAkunIds = AkunReferensi::where('tipe_neraca', 'pendapatan')->pluck('id');
        $bebanAkunIds = AkunReferensi::where('tipe_neraca', 'beban')->pluck('id');

        $pendapatanKas = KasMasuk::with('akunReferensi')
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->whereIn('akun_referensi_id', $pendapatanAkunIds)
            ->get();

        $pendapatanJournal = JournalEntry::with('account')
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->whereIn('account_id', $pendapatanAkunIds)
            ->get();

        $pendapatanRows = $pendapatanKas->map(function (KasMasuk $item) {
            return [
                'id' => 'BPT-' . $item->id,
                'uraian' => $item->akunReferensi?->nama_akun,
                'keterangan' => $item->keterangan,
                'nominal' => (float) $item->nominal,
            ];
        });

        $pendapatanJournalRows = $pendapatanJournal->map(function (JournalEntry $entry) {
            return [
                'id' => 'JE-' . $entry->id,
                'uraian' => $entry->account?->nama_akun,
                'keterangan' => $entry->keterangan,
                'nominal' => (float) $entry->credit - (float) $entry->debit,
            ];
        })->filter(fn ($row) => $row['nominal'] !== 0);

        $pendapatan = $pendapatanRows
            ->concat($pendapatanJournalRows)
            ->sortBy('uraian')
            ->values();

        $bebanKas = KasKeluar::with('akunReferensi')
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->whereIn('akun_referensi_id', $bebanAkunIds)
            ->get();

        $bebanJournal = JournalEntry::with('account')
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->whereIn('account_id', $bebanAkunIds)
            ->get();

        $bebanRows = $bebanKas->map(function (KasKeluar $item) {
            return [
                'akun' => $item->akunReferensi?->nama_akun,
                'transaksi' => $item->keterangan,
                'unit' => $item->unit,
                'nominal' => (float) $item->total,
            ];
        });

        $bebanJournalRows = $bebanJournal->map(function (JournalEntry $entry) {
            return [
                'akun' => $entry->account?->nama_akun,
                'transaksi' => 'Jurnal',
                'unit' => null,
                'nominal' => (float) $entry->debit - (float) $entry->credit,
            ];
        })->filter(fn ($row) => $row['nominal'] !== 0);

        $beban = $bebanRows
            ->concat($bebanJournalRows)
            ->sortBy('akun')
            ->values();

        $totalPendapatan = $pendapatan->sum('nominal');
        $totalBeban = $beban->sum('nominal');
        $labaKotor = $totalPendapatan - $totalBeban;
        $margin = $totalPendapatan > 0 ? round(($labaKotor / $totalPendapatan) * 100, 1) : 0;

        $summary = [
            'totalPendapatan' => $totalPendapatan,
            'sumberPendapatan' => $pendapatan->pluck('uraian')->unique()->count(),
            'totalBeban' => $totalBeban,
            'akunBeban' => $beban->pluck('akun')->unique()->count(),
            'labaKotor' => $labaKotor,
            'margin' => $margin,
        ];

        return Inertia::render('Finance/Spj/LabaRugi', [
            'pendapatan' => $pendapatan,
            'beban' => $beban,
            'summary' => $summary,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    public function exportLabaRugi(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', now()->endOfMonth()->toDateString());

        $pendapatanAkunIds = AkunReferensi::where('tipe_neraca', 'pendapatan')->pluck('id');
        $bebanAkunIds = AkunReferensi::where('tipe_neraca', 'beban')->pluck('id');

        $pendapatanKas = KasMasuk::with('akunReferensi')
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->whereIn('akun_referensi_id', $pendapatanAkunIds)
            ->get();

        $pendapatanJournal = JournalEntry::with('account')
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->whereIn('account_id', $pendapatanAkunIds)
            ->get();

        $pendapatanRows = $pendapatanKas->map(function (KasMasuk $item) {
            return [
                'id' => 'BPT-' . $item->id,
                'uraian' => $item->akunReferensi?->nama_akun,
                'keterangan' => $item->keterangan,
                'nominal' => (float) $item->nominal,
            ];
        });

        $pendapatanJournalRows = $pendapatanJournal->map(function (JournalEntry $entry) {
            return [
                'id' => 'JE-' . $entry->id,
                'uraian' => $entry->account?->nama_akun,
                'keterangan' => $entry->keterangan,
                'nominal' => (float) $entry->credit - (float) $entry->debit,
            ];
        })->filter(fn ($row) => $row['nominal'] !== 0);

        $pendapatan = $pendapatanRows
            ->concat($pendapatanJournalRows)
            ->sortBy('uraian')
            ->values();

        $bebanKas = KasKeluar::with('akunReferensi')
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->whereIn('akun_referensi_id', $bebanAkunIds)
            ->get();

        $bebanJournal = JournalEntry::with('account')
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->whereIn('account_id', $bebanAkunIds)
            ->get();

        $bebanRows = $bebanKas->map(function (KasKeluar $item) {
            return [
                'akun' => $item->akunReferensi?->nama_akun,
                'transaksi' => $item->keterangan,
                'unit' => $item->unit,
                'nominal' => (float) $item->total,
            ];
        });

        $bebanJournalRows = $bebanJournal->map(function (JournalEntry $entry) {
            return [
                'akun' => $entry->account?->nama_akun,
                'transaksi' => 'Jurnal',
                'unit' => null,
                'nominal' => (float) $entry->debit - (float) $entry->credit,
            ];
        })->filter(fn ($row) => $row['nominal'] !== 0);

        $beban = $bebanRows
            ->concat($bebanJournalRows)
            ->sortBy('akun')
            ->values();

        $totalPendapatan = $pendapatan->sum('nominal');
        $totalBeban = $beban->sum('nominal');
        $labaKotor = $totalPendapatan - $totalBeban;

        $summary = [
            'totalPendapatan' => $totalPendapatan,
            'sumberPendapatan' => $pendapatan->pluck('uraian')->unique()->count(),
            'totalBeban' => $totalBeban,
            'akunBeban' => $beban->pluck('akun')->unique()->count(),
            'labaKotor' => $labaKotor,
        ];

        $periode = Carbon::createFromFormat('Y-m-d', $endDate)->translatedFormat('F Y');

        $pdf = Pdf::loadView('pdf.labarugi', [
            'pendapatan' => $pendapatan,
            'beban' => $beban,
            'summary' => $summary,
            'periode' => $periode,
            'createdBy' => auth()->user()?->name ?? null,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('LabaRugi-' . now()->format('Y-m') . '.pdf');
    }

    /**
     * @OA\Get(
     *     path="/finance/arus-kas",
     *     tags={"Keuangan - Laporan"},
     *     summary="Halaman arus kas",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="start_date", in="query", @OA\Schema(type="string", format="date")),
     *     @OA\Parameter(name="end_date", in="query", @OA\Schema(type="string", format="date")),
     *     @OA\Response(response=200, description="Halaman arus kas")
     * )
     */
    public function arusKas(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', now()->endOfMonth()->toDateString());

        $data = $this->buildArusKasData($startDate, $endDate);

        return Inertia::render('Finance/ArusKas', [
            'items' => $data['items'],
            'summary' => $data['summary'],
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Export PDF Arus Kas
     *
     * @OA\Get(
     *     path="/finance/arus-kas/export",
     *     tags={"Keuangan - Laporan"},
     *     summary="Export PDF arus kas",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="start_date", in="query", @OA\Schema(type="string", format="date")),
     *     @OA\Parameter(name="end_date", in="query", @OA\Schema(type="string", format="date")),
     *     @OA\Response(response=200, description="PDF arus kas ditampilkan")
     * )
     */
    public function exportArusKas(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', now()->endOfMonth()->toDateString());

        $data = $this->buildArusKasData($startDate, $endDate);
        $periode = Carbon::createFromFormat('Y-m-d', $endDate)->translatedFormat('F Y');

        $pdf = Pdf::loadView('pdf.arus_kas', [
            'items' => $data['items'],
            'summary' => $data['summary'],
            'periode' => $periode,
            'createdBy' => auth()->user()?->name ?? null,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('ArusKas-' . now()->format('Y-m') . '.pdf');
    }

    /**
     * Helper: build arus kas data grouped by akun referensi
     */
    private function buildArusKasData(string $startDate, string $endDate): array
    {
        // Masuk: group by akun
        $masukByAkun = KasMasuk::with('akunReferensi')
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->get()
            ->groupBy(fn ($item) => $item->akunReferensi?->nama_akun ?? 'Lain-lain')
            ->map(fn ($group) => $group->sum('nominal'));

        // Keluar: group by akun
        $keluarByAkun = KasKeluar::with('akunReferensi')
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->get()
            ->groupBy(fn ($item) => $item->akunReferensi?->nama_akun ?? 'Lain-lain')
            ->map(fn ($group) => $group->sum('total'));

        // Gabungkan semua nama akun
        $allAkun = $masukByAkun->keys()->merge($keluarByAkun->keys())->unique()->sort()->values();

        $items = $allAkun->map(fn ($akun) => [
            'uraian' => $akun,
            'masuk' => (float) ($masukByAkun[$akun] ?? 0),
            'keluar' => (float) ($keluarByAkun[$akun] ?? 0),
        ])->values()->toArray();

        $totalMasuk = array_sum(array_column($items, 'masuk'));
        $totalKeluar = array_sum(array_column($items, 'keluar'));

        return [
            'items' => $items,
            'summary' => [
                'totalMasuk' => $totalMasuk,
                'totalKeluar' => $totalKeluar,
                'arusBersih' => $totalMasuk - $totalKeluar,
            ],
        ];
    }
}