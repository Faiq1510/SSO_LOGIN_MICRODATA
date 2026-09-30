<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use App\Models\MatrixProgress;
use App\Models\LogKeluarHarian;
use App\Models\LogMasukGudang;
use App\Models\KasMasuk;
use App\Models\KasKeluar;
use App\Services\StokGudangService;
use App\Services\NeracaService;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function __construct(
        protected StokGudangService $stokService,
        protected NeracaService $neracaService,
    ) {}

    public function index()
    {
        $user = auth()->user();
        $canOperasional = $user->hasAnyRole(['Super Admin', 'Admin', 'Owner', 'Pengguna']);
        $canKeuangan    = $user->hasAnyRole(['Super Admin', 'Admin Keuangan', 'Owner']);

        $data = [
            'canOperasional' => $canOperasional,
            'canKeuangan'    => $canKeuangan,
        ];

        if ($canOperasional) {
            $data = array_merge($data, $this->dataOperasional());
        }

        if ($canKeuangan) {
            $data = array_merge($data, $this->dataKeuangan());
        }

        return Inertia::render('Dashboard/Index', $data);
    }

    private function dataOperasional(): array
    {
        $units = Unit::with(['latestProgress'])->get();

        $matrixSorted = MatrixProgress::with('details')->orderBy('batas_atas')->get();

        $running = [];
        $cumulativeByBatasAtas = [];

        foreach ($matrixSorted as $m) {
            foreach ($m->details as $d) {
                $running[$d->material_id] = ($running[$d->material_id] ?? 0) + (float) $d->qty_standar;
            }
            $cumulativeByBatasAtas[$m->batas_atas] = $running;
        }

        $batasAtasList = $matrixSorted->pluck('batas_atas')->sort()->values();

        $aktualByUnit = LogKeluarHarian::selectRaw('unit_id, material_id, SUM(qty) as total_qty')
            ->groupBy('unit_id', 'material_id')
            ->get()
            ->groupBy('unit_id');

        $computeStatusMaterial = function (Unit $u) use ($cumulativeByBatasAtas, $batasAtasList, $aktualByUnit) {
            $progress = (float) ($u->latestProgress?->progress_percent ?? 0);

            if ($cumulativeByBatasAtas === []) {
                return 'Aman';
            }

            $currentBatasAtas = $batasAtasList->first(fn ($b) => $b >= $progress) ?? $batasAtasList->last();
            $standarMap = $cumulativeByBatasAtas[$currentBatasAtas] ?? [];

            if ($standarMap === []) {
                return 'Aman';
            }

            $aktualMap = ($aktualByUnit[$u->id] ?? collect())->keyBy('material_id');

            $maxRatio = 0;
            foreach ($standarMap as $materialId => $standarQty) {
                if ($standarQty <= 0) {
                    continue;
                }
                $aktualQty = (float) ($aktualMap[$materialId]->total_qty ?? 0);
                $ratio = ($aktualQty / $standarQty) * 100;
                $maxRatio = max($maxRatio, $ratio);
            }

            if ($maxRatio > 120) {
                return 'Boros';
            }
            if ($maxRatio > 100) {
                return 'Warning';
            }
            return 'Aman';
        };

        $monitoring = $units->mapWithKeys(function (Unit $unit) {
            $detail = $unit->latestProgress?->detail_material ?? [];

            $rows = collect($detail)->map(fn ($d) => [
                'nama_material' => $d['material'],
                'standar'       => $d['qty_standar'],
                'aktual'        => $d['qty_aktual'],
                'analisa'       => strtoupper($d['status']),
            ])->all();

            return [$unit->id => $rows];
        });

        $rows = $units->map(function (Unit $u) use ($computeStatusMaterial) {
            $progress = (int) ($u->latestProgress?->progress_percent ?? 0);

            return [
                'id'             => $u->id,
                'nama_unit'      => $u->nama_unit,
                'zona'           => $u->zona,
                'tukang'         => $u->tukang,
                'progress'       => $progress,
                'status'         => $u->status,
                'statusMaterial' => $computeStatusMaterial($u),
            ];
        });

        return [
            'kpiOperasional' => [
                'totalUnit'   => $units->count(),
                'unitAktif'   => $units->where('status', 'Aktif')->count(),
                'unitDiinput' => $units->filter(fn ($u) => $u->latestProgress !== null)->count(),
                'unitWarning' => $rows->where('statusMaterial', 'Warning')->count(),
                'unitBoros'   => $rows->where('statusMaterial', 'Boros')->count(),
            ],
            'rows'       => $rows,
            'monitoring' => $monitoring,
        ];
    }

    /**
     * Data keuangan untuk dashboard.
     *
     * SUMBER KEBENARAN TUNGGAL: Saldo Kas, Total Modal Masuk, dan Sisa Material
     * Keluar diambil LANGSUNG dari NeracaService::calculate(), bukan dihitung
     * ulang di sini. Ini menjamin dashboard & halaman Neraca selalu identik:
     *
     * - Saldo Kas        = neraca.aset.kas_setara_kas
     * - Total Modal Masuk = neraca.modal.modal_disetor
     *                       (kas masuk akun tipe 'modal' + jurnal manual akun modal)
     * - Sisa Material Keluar = neraca.aset.persediaan_material
     *                       (metode harga historis: total masuk gudang - total
     *                       keluar gudang, BUKAN moving average StokGudangService)
     *
     * "Total Pengeluaran" & "Pengeluaran Bulan Ini" SENGAJA TIDAK disamakan
     * dengan "Beban" di Neraca. Kartu ini merepresentasikan cash flow murni
     * (seluruh Kas Keluar, termasuk pembayaran utang/liabilitas), sedangkan
     * "Beban" di Neraca hanya kas keluar dengan akun bertipe 'beban'. Ini dua
     * konsep akuntansi yang berbeda by design, bukan bug.
     *
     * `stokGudang` (dipakai di tab Operasional & auto-fill harga Log Keluar)
     * tetap pakai moving average dari StokGudangService — di luar cakupan
     * sinkronisasi ini karena kebutuhannya berbeda (harga transaksi berjalan,
     * bukan valuasi neraca).
     */
    private function dataKeuangan(): array
    {
        $today = now();
        $bulanIni = Carbon::now();

        // ===== Single source of truth: NeracaService =====
        $neraca = $this->neracaService->calculate($today->format('Y-m-d'));

        $saldoKas           = $neraca['aset']['kas_setara_kas'];
        $totalModalMasuk    = $neraca['modal']['modal_disetor'];
        $sisaMaterialKeluar = $neraca['aset']['persediaan_material'];

        // ===== Total Pengeluaran = seluruh kas keluar proyek (cash flow murni) =====
        $totalKasKeluarAll = (float) KasKeluar::where('tanggal', '<=', $today)->sum('total');
        $totalPengeluaran = $totalKasKeluarAll;

        // Pengeluaran bulan berjalan (kas keluar riil bulan ini)
        $pengeluaranBulanIni = (float) KasKeluar::whereMonth('tanggal', $bulanIni->month)
            ->whereYear('tanggal', $bulanIni->year)
            ->sum('total');

        // ===== Metrik material/gudang bulan berjalan (tetap dari modul gudang) =====

        $nilaiMaterialMasuk = (float) LogMasukGudang::whereMonth('tanggal', $bulanIni->month)
            ->whereYear('tanggal', $bulanIni->year)
            ->sum(\DB::raw('qty * harga_satuan'));

        $totalMaterialKeluar = (float) LogKeluarHarian::sum('total');

        // ===== Tren Cashflow Mingguan (8 minggu terakhir dari hari ini, bukan bulan kalender) =====
        $endDate = $today->copy()->endOfWeek(Carbon::SUNDAY);
        $startDate = $endDate->copy()->subWeeks(7)->startOfWeek(Carbon::MONDAY);

        $masukPerWeek = KasMasuk::whereBetween('tanggal', [$startDate, $endDate])
            ->get(['tanggal', 'nominal'])
            ->groupBy(function ($item) {
                return Carbon::parse($item->tanggal)->startOfWeek(Carbon::MONDAY)->format('Y-m-d');
            })
            ->map(fn ($items) => $items->sum(fn ($item) => (float) $item->nominal))
            ->toArray();

        $keluarPerWeek = KasKeluar::whereBetween('tanggal', [$startDate, $endDate])
            ->get(['tanggal', 'total'])
            ->groupBy(function ($item) {
                return Carbon::parse($item->tanggal)->startOfWeek(Carbon::MONDAY)->format('Y-m-d');
            })
            ->map(fn ($items) => $items->sum(fn ($item) => (float) $item->total))
            ->toArray();

        $weekKeys = [];
        $cursor = $startDate->copy();
        while ($cursor->lte($endDate)) {
            $weekKeys[] = $cursor->format('Y-m-d');
            $cursor->addWeek();
        }

        $cashflowWeekly = array_map(function ($weekStart) use ($masukPerWeek, $keluarPerWeek) {
            $start = Carbon::parse($weekStart);
            $end = $start->copy()->endOfWeek(Carbon::SUNDAY);
            $masuk = $masukPerWeek[$weekStart] ?? 0;
            $keluar = $keluarPerWeek[$weekStart] ?? 0;

            return [
                'weekLabel' => sprintf(
                    'Minggu %s (%s - %s)',
                    $start->weekOfYear,
                    $start->translatedFormat('d M'),
                    $end->translatedFormat('d M'),
                ),
                'masuk'  => $masuk,
                'keluar' => $keluar,
                'saldo'  => $masuk - $keluar,
            ];
        }, $weekKeys);

        // ===== Akun Pengeluaran Terbesar (group by akun referensi, bukan material) =====

        $topPengeluaran = KasKeluar::query()
            ->selectRaw('akun_referensi_id, SUM(total) as total_pengeluaran')
            ->with('akunReferensi')
            ->groupBy('akun_referensi_id')
            ->orderByDesc('total_pengeluaran')
            ->take(5)
            ->get()
            ->map(fn ($item) => [
                'nama'  => $item->akunReferensi?->nama_akun ?? 'Tidak diketahui',
                'total' => (float) $item->total_pengeluaran,
            ])
            ->all();

        return [
            'kpiKeuangan' => [
                'pengeluaranBulanIni' => $pengeluaranBulanIni,
                'saldoBulanIni'       => $saldoKas,
                'totalModalMasuk'     => $totalModalMasuk,
                'totalPengeluaran'    => $totalPengeluaran,
                'saldoKas'            => $saldoKas,
                'nilaiMaterialMasuk'  => $nilaiMaterialMasuk,
                'totalMaterialKeluar' => $totalMaterialKeluar,
                'sisaMaterialKeluar'  => $sisaMaterialKeluar,
            ],
            'cashflowWeekly' => $cashflowWeekly,
            'topPengeluaran' => $topPengeluaran,
            'stokGudang'     => $this->stokService->getStokGudang(),
        ];
    }
}