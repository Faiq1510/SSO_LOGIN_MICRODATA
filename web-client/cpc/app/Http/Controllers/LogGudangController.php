<?php

namespace App\Http\Controllers;

use App\Models\ProgressUnit;
use App\Http\Requests\StoreLogKeluarRequest;
use App\Http\Requests\StoreLogMasukRequest;
use App\Models\LogKeluarHarian;
use App\Models\LogMasukGudang;
use App\Models\Material;
use App\Models\Unit;
use App\Services\StokGudangService;
use App\Services\MaterialConsumptionService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Requests\UpdateLogKeluarRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

/**
 * @OA\Tag(
 *     name="Gudang",
 *     description="Manajemen log dan stok gudang"
 * )
 */
class LogGudangController extends Controller
{
    /**
     * @OA\Get(
     *     path="/log-gudang",
     *     tags={"Gudang"},
     *     summary="Halaman log masuk/keluar gudang",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="tab", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="search", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="sort_by", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="sort_dir", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="per_page", in="query", @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Halaman log gudang")
     * )
     */
    public function index(Request $request)
    {
        Log::info('Bootstrap to controller: ' . round((microtime(true) - LARAVEL_START) * 1000, 2) . 'ms');

        $queryTimes = [];
        DB::listen(function ($query) use (&$queryTimes) {
            $queryTimes[] = $query->time;
            Log::info(sprintf('[%.2fms] %s', $query->time, $query->sql));
        });

        register_shutdown_function(function () use (&$queryTimes) {
            Log::info('TOTAL QUERY TIME: ' . array_sum($queryTimes) . 'ms (' . count($queryTimes) . ' queries)');
        });
        $stokService = new StokGudangService();
        $isSuperAdmin = Auth::user()?->hasRole('Super Admin') ?? false;
        $canEdit = Auth::user()?->hasAnyRole(['Super Admin', 'Admin']) ?? false;
        $tab = $request->get('tab', 'masuk');
        $search = $request->get('search', ''); // Tangkap parameter search
        $sortBy = $request->get('sort_by', 'tanggal');
        $sortDir = $request->get('sort_dir', 'desc') === 'asc' ? 'asc' : 'desc';
        $allowedPerPage = [10, 25, 50, 100];
        $perPage = in_array($request->integer('per_page', 10), $allowedPerPage, true)
            ? $request->integer('per_page', 10)
            : 10;

        $currentUserId = Auth::id();
        $tipeLogMap = ['masuk' => 'masuk', 'keluar' => 'keluar'];

        $mapRow = function ($log) use ($isSuperAdmin, $currentUserId) {
            $row = $log->toArray();

            if ($isSuperAdmin) {
                $latestHistory = $log->histories->first();

                // Cari history penghapusan (action=delete) untuk tahu siapa yang menghapus
                $deleteHistory = $log->deleted_at
                    ? $log->histories->where('action', 'delete')->first()
                    : null;

                $deletedByUserId = $deleteHistory?->user_id;

                $row['row_status'] = $log->deleted_at
                    ? 'deleted'
                    : ($latestHistory && $latestHistory->action === 'update' ? 'edited' : null);
                $row['row_status_label'] = $row['row_status'] === 'deleted'
                    ? 'Dihapus'
                    : ($row['row_status'] === 'edited' ? 'Diedit' : null);
                $row['row_status_by'] = optional($latestHistory?->user)->name;
                $row['row_status_at'] = $latestHistory?->created_at
                    ? $latestHistory->created_at instanceof \DateTimeInterface
                    ? $latestHistory->created_at->setTimezone(new \DateTimeZone('Asia/Jakarta'))->format('Y-m-d H:i:s')
                    : \Illuminate\Support\Carbon::parse($latestHistory->created_at)->setTimezone('Asia/Jakarta')->format('Y-m-d H:i:s')
                    : null;
                // Flag: apakah record ini dihapus oleh Super Admin yang sedang login
                $row['deleted_by_me'] = $log->deleted_at && $deletedByUserId === $currentUserId;
            }

            return $row;
        };

        // Bangun query log masuk/keluar dengan dukungan pencarian server-side
        $buildLog = function (string $type) use ($request, $isSuperAdmin, $mapRow, $search, $currentUserId, $sortBy, $sortDir, $perPage) {
            if ($type === 'masuk') {
                $query = LogMasukGudang::with('material');
                $pageParam = 'masuk_page';

                // Filter server-side untuk Log Masuk (berdasarkan supplier atau nama/kode material)
                if ($search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('supplier', 'ilike', "%{$search}%")
                            ->orWhereHas('material', function ($matQuery) use ($search) {
                                $matQuery->where('nama_material', 'ilike', "%{$search}%")
                                    ->orWhere('kode_material', 'ilike', "%{$search}%");
                            });
                    });
                }

                $tipeLog = 'masuk';
            } else {
                $query = LogKeluarHarian::with(['material', 'unit']);
                $pageParam = 'keluar_page';

                // Filter server-side untuk Log Keluar (berdasarkan nama unit atau nama/kode material)
                if ($search) {
                    $query->where(function ($q) use ($search) {
                        $q->whereHas('unit', function ($unitQuery) use ($search) {
                            $unitQuery->where('nama_unit', 'ilike', "%{$search}%");
                        })
                            ->orWhereHas('material', function ($matQuery) use ($search) {
                                $matQuery->where('nama_material', 'ilike', "%{$search}%")
                                    ->orWhere('kode_material', 'ilike', "%{$search}%");
                            });
                    });
                }

                $tipeLog = 'keluar';
            }

            if ($isSuperAdmin) {
                $query = $query->withTrashed()->with('histories.user');
                // Sembunyikan record yang dihapus oleh diri sendiri (Super Admin yang login).
                // Record dihapus oleh orang lain tetap ditampilkan dengan pemberitahuan.
                $query->where(function ($q) use ($currentUserId, $tipeLog) {
                    $q->whereNull('deleted_at') // Tampilkan record yang tidak dihapus
                        ->orWhereNull( // Atau yang dihapus tapi BUKAN oleh user yang sedang login
                            DB::raw("(
                              SELECT user_id FROM log_gudang_histories
                              WHERE log_id = " . ($tipeLog === 'masuk' ? 'log_masuk_gudang' : 'log_keluar_harian') . ".id
                                AND tipe_log = '{$tipeLog}'
                                AND action = 'delete'
                              ORDER BY created_at DESC
                              LIMIT 1
                          )")
                        )
                        ->orWhere( // Atau yang dihapus oleh orang lain (bukan current user)
                            DB::raw("(
                              SELECT user_id FROM log_gudang_histories
                              WHERE log_id = " . ($tipeLog === 'masuk' ? 'log_masuk_gudang' : 'log_keluar_harian') . ".id
                                AND tipe_log = '{$tipeLog}'
                                AND action = 'delete'
                              ORDER BY created_at DESC
                              LIMIT 1
                          )"),
                            '!=',
                            $currentUserId
                        );
                });
            }

            $sortColumnMap = $type === 'masuk'
                ? ['tanggal' => 'tanggal', 'qty' => 'qty', 'total' => 'total_harga']
                : ['tanggal' => 'tanggal', 'qty' => 'qty', 'total' => 'total'];

            $sortColumn = $sortColumnMap[$sortBy] ?? 'tanggal';

            return $query->orderBy($sortColumn, $sortDir)
                ->orderByDesc('id')
                ->paginate($perPage, ['*'], $pageParam, $request->integer($pageParam, 1))
                ->withQueryString()
                ->through($mapRow);
            ;
        };

        return Inertia::render('LogGudang/Index', [
            'masuk' => $tab === 'masuk'
                ? fn() => $buildLog('masuk')
                : Inertia::lazy(fn() => $buildLog('masuk')),
            'keluar' => $tab === 'keluar'
                ? fn() => $buildLog('keluar')
                : Inertia::lazy(fn() => $buildLog('keluar')),
            'materials' => fn() => (function () use ($stokService) {
                $movingAvg = $stokService->hitungMovingAverage(); // panggil SEKALI di luar loop
    
                return Material::orderBy('nama_material')
                    ->get(['id', 'kode_material as kode', 'nama_material as nama', 'satuan'])
                    ->map(function ($m) use ($movingAvg) {
                        $data = $movingAvg->get($m->id, ['sisa_stok' => 0, 'harga_rata_rata' => 0]);

                        return [
                            'id' => $m->id,
                            'kode' => $m->kode,
                            'nama' => $m->nama,
                            'satuan' => $m->satuan,
                            'harga_terakhir' => $data['harga_rata_rata'],
                        ];
                    });
            })(),
            'units' => fn() => Unit::orderBy('nama_unit')->get(['id', 'nama_unit', 'zona']),
            'stok' => fn() => $stokService->stokSemuaMaterial(),
            'canEdit' => $canEdit,
            'tab' => $tab,
            'filters' => [
                'search' => $search,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Halaman stok gudang (paginated) dengan search & sorting.
     */
    /**
     * @OA\Get(
     *     path="/stok-gudang",
     *     tags={"Gudang"},
     *     summary="Stok gudang paginated",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="q", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="sortBy", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="sortDir", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="perPage", in="query", @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Halaman stok gudang")
     * )
     */
    public function stokIndex(Request $request)
    {
        $perPage = $request->integer('perPage', 15);
        $q = (string) $request->get('q', '');
        $sortBy = (string) $request->get('sortBy', 'nama'); // nama | stok
        $sortDir = (string) $request->get('sortDir', 'asc');

        $query = Material::query()->select('materials.*');

        if ($q) {
            $query->where(function ($qb) use ($q) {
                $qb->where('nama_material', 'ilike', "%{$q}%")
                    ->orWhere('kode_material', 'ilike', "%{$q}%");
            });
        }

        if ($sortBy === 'stok') {
            Log::debug('stokIndex params', ['q' => $q, 'sortBy' => $sortBy, 'sortDir' => $sortDir, 'perPage' => $perPage, 'page' => $request->get('page')]);
            $orderExpr = "(COALESCE((SELECT SUM(qty) FROM log_masuk_gudang WHERE material_id = materials.id),0) - COALESCE((SELECT SUM(qty) FROM log_keluar_harian WHERE material_id = materials.id),0)) " . ($sortDir === 'asc' ? 'asc' : 'desc');
            $query->orderByRaw($orderExpr)->orderBy('nama_material', 'asc');
        } else {
            $query->orderBy('nama_material', $sortDir);
        }

        $page = $request->integer('page', 1);
        $materials = $query->paginate($perPage, ['*'], 'page', $page);

        $ids = collect($materials->items())->pluck('id')->toArray();
        $stokService = new StokGudangService();
        $movingAvg = $stokService->hitungMovingAverageFor($ids);

        $mapped = collect($materials->items())->map(function ($m) use ($movingAvg) {
            $data = $movingAvg->get($m->id, ['sisa_stok' => 0, 'harga_rata_rata' => 0]);
            $totalMasuk = \App\Models\LogMasukGudang::where('material_id', $m->id)->sum('qty');
            $totalKeluar = \App\Models\LogKeluarHarian::where('material_id', $m->id)->sum('qty');

            return [
                'material_id' => $m->id,
                'kode' => $m->kode_material,
                'nama' => $m->nama_material,
                'satuan' => $m->satuan,
                'total_masuk' => (float) $totalMasuk,
                'total_keluar' => (float) $totalKeluar,
                'sisa_stok' => $data['sisa_stok'],
                'harga_satuan' => $data['harga_rata_rata'],
                'nilai_rupiah' => $data['sisa_stok'] * $data['harga_rata_rata'],
                'is_warning' => $data['sisa_stok'] <= 0,
            ];
        });

        $materials->setCollection($mapped);

        return Inertia::render('StokGudang/Index', [
            'stok' => $materials,
            'filters' => [
                'q' => $q,
                'sortBy' => $sortBy,
                'sortDir' => $sortDir,
                'perPage' => $perPage,
            ],
        ]);
    }

    /**
     * @OA\Get(
     *     path="/log-gudang/history",
     *     tags={"Gudang"},
     *     summary="Riwayat perubahan log gudang",
     *     security={{"sanctum": {}}},
     *     @OA\Response(response=200, description="Riwayat log gudang")
     * )
     */
    public function history()
    {
        $histories = \App\Models\LogGudangHistory::with('user.roles')
            ->orderByDesc('created_at')
            ->take(100)
            ->get();

        $materials = Material::pluck('nama_material', 'id')->toArray();
        $units = Unit::pluck('nama_unit', 'id')->toArray();

        $formatted = $histories->map(function ($h) use ($materials, $units) {
            $details = [];
            $actionWord = '';

            switch ($h->action) {
                case 'create':
                    $actionWord = 'Menambahkan';
                    break;
                case 'update':
                    $actionWord = 'Mengubah';
                    break;
                case 'delete':
                    $actionWord = 'Menghapus';
                    break;
            }

            $logTypeWord = $h->tipe_log === 'masuk' ? 'Log Masuk' : 'Log Keluar';

            $data = $h->action === 'delete' ? $h->data_lama : $h->data_baru;
            $materialName = $materials[$data['material_id'] ?? null] ?? 'Material Tidak Diketahui';

            $summary = "{$actionWord} {$logTypeWord} - {$materialName}";

            if ($h->action === 'update') {
                $diff = [];
                $keysToCompare = [
                    'tanggal' => 'Tanggal',
                    'supplier' => 'Supplier',
                    'unit_id' => 'Unit',
                    'material_id' => 'Material',
                    'qty' => 'Qty',
                    'harga_satuan' => 'Harga Satuan',
                    'harga' => 'Harga',
                    'total_harga' => 'Total Harga',
                    'total' => 'Total',
                    'keterangan' => 'Keterangan'
                ];

                foreach ($keysToCompare as $key => $label) {
                    $oldVal = $h->data_lama[$key] ?? null;
                    $newVal = $h->data_baru[$key] ?? null;

                    $oldValClean = ($oldVal === null || $oldVal === '') ? null : $oldVal;
                    $newValClean = ($newVal === null || $newVal === '') ? null : $newVal;
                    if ($oldValClean === $newValClean)
                        continue;

                    if ($key === 'tanggal') {
                        $oldDate = $oldVal ? substr($oldVal, 0, 10) : null;
                        $newDate = $newVal ? substr($newVal, 0, 10) : null;
                        if ($oldDate === $newDate)
                            continue;
                    }

                    if (is_numeric($oldVal) && is_numeric($newVal)) {
                        if (floatval($oldVal) === floatval($newVal))
                            continue;
                    } else {
                        if ($oldVal === $newVal)
                            continue;
                    }

                    if ($key === 'material_id') {
                        $oldVal = $materials[$oldVal] ?? "ID $oldVal";
                        $newVal = $materials[$newVal] ?? "ID $newVal";
                    } elseif ($key === 'unit_id') {
                        $oldVal = $units[$oldVal] ?? "ID $oldVal";
                        $newVal = $units[$newVal] ?? "ID $newVal";
                    }

                    if (in_array($key, ['harga_satuan', 'harga', 'total_harga', 'total'])) {
                        $oldVal = 'Rp ' . number_format(floatval($oldVal ?? 0), 0, ',', '.');
                        $newVal = 'Rp ' . number_format(floatval($newVal ?? 0), 0, ',', '.');
                    }

                    if ($oldVal === null || $oldVal === '') {
                        $diff[] = "Mengisi {$label}: \"{$newVal}\"";
                    } elseif ($newVal === null || $newVal === '') {
                        $diff[] = "Menghapus {$label} (sebelumnya: \"{$oldVal}\")";
                    } else {
                        $diff[] = "Mengubah {$label} dari \"{$oldVal}\" menjadi \"{$newVal}\"";
                    }
                }
                $details = $diff;
            } else {
                $info = [];
                $info[] = "Tanggal: " . (is_array($data) && isset($data['tanggal']) ? substr($data['tanggal'], 0, 10) : '-');
                if ($h->tipe_log === 'masuk') {
                    $info[] = "Supplier: " . ($data['supplier'] ?? '-');
                } else {
                    $unitName = $units[$data['unit_id'] ?? null] ?? 'Unit Tidak Diketahui';
                    $info[] = "Unit: " . $unitName;
                }
                $info[] = "Qty: " . ($data['qty'] ?? 0);

                $hargaKey = $h->tipe_log === 'masuk' ? 'harga_satuan' : 'harga';
                $totalKey = $h->tipe_log === 'masuk' ? 'total_harga' : 'total';

                $hargaVal = 'Rp ' . number_format(floatval($data[$hargaKey] ?? 0), 0, ',', '.');
                $totalVal = 'Rp ' . number_format(floatval($data[$totalKey] ?? 0), 0, ',', '.');

                $info[] = "Harga: " . $hargaVal;
                $info[] = "Total: " . $totalVal;

                if (!empty($data['keterangan'])) {
                    $info[] = "Keterangan: " . $data['keterangan'];
                }
                $details = $info;
            }

            return [
                'id' => $h->id,
                'user_name' => $h->user->name ?? 'System/Deleted User',
                'user_role' => $h->user ? $h->user->roles->pluck('name')->first() : '-',
                'tipe_log' => $h->tipe_log,
                'action' => $h->action,
                'summary' => $summary,
                'details' => $details,
                'created_at' => $h->created_at
                    ? ($h->created_at instanceof \DateTimeInterface
                        ? $h->created_at->setTimezone(new \DateTimeZone('Asia/Jakarta'))->format('Y-m-d H:i:s')
                        : \Illuminate\Support\Carbon::parse($h->created_at)->setTimezone('Asia/Jakarta')->format('Y-m-d H:i:s'))
                    : null,
            ];
        });

        return response()->json($formatted);
    }

    /**
     * @OA\Post(
     *     path="/log-gudang/masuk",
     *     tags={"Gudang"},
     *     summary="Tambah log masuk gudang",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
     *     @OA\Response(response=302, description="Redirect setelah log masuk dibuat")
     * )
     */
    public function storeMasuk(StoreLogMasukRequest $request)
    {
        $data = $request->validated();

        DB::transaction(function () use ($data) {
            LogMasukGudang::create([...$data, 'created_by' => Auth::id()]);

            // Auto-journal: catat pembelian material ke kas keluar
            // hanya jika akun referensi '104' (Pembelian Aset/Material) sudah dikonfigurasi.
            $akunPembelianAset = \App\Models\AkunReferensi::where('kode_akun', '104')->value('id');

            if ($akunPembelianAset) {
                \App\Models\KasKeluar::create([
                    'tanggal' => $data['tanggal'],
                    'akun_referensi_id' => $akunPembelianAset,
                    'keterangan' => 'Pembelian material: ' . ($data['supplier'] ?? '-'),
                    'qty' => $data['qty'],
                    'nominal_per_unit' => $data['harga_satuan'],
                    'total' => $data['total_harga'],
                    'penerima' => $data['supplier'] ?? null,
                    'metode_bayar' => 'transfer',
                    'created_by' => Auth::id(),
                ]);
            }
        });

        return back()->with('success', 'Log masuk berhasil ditambahkan.');
    }

    /**
     * @OA\Put(
     *     path="/log-gudang/masuk/{logMasuk}",
     *     tags={"Gudang"},
     *     summary="Update log masuk gudang",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="logMasuk", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
     *     @OA\Response(response=302, description="Redirect setelah log masuk diperbarui")
     * )
     */
    public function updateMasuk(StoreLogMasukRequest $request, LogMasukGudang $logMasuk)
    {
        $data = $request->validated();

        $logMasuk->update($data);

        return back()->with('success', 'Log masuk berhasil diperbarui.');
    }

    /**
     * @OA\Delete(
     *     path="/log-gudang/masuk/{logMasuk}",
     *     tags={"Gudang"},
     *     summary="Soft-delete log masuk gudang",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="logMasuk", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=302, description="Redirect setelah log masuk dihapus")
     * )
     */
    public function destroyMasuk(LogMasukGudang $logMasuk)
    {
        $logMasuk->delete();

        return back()->with('success', 'Log masuk berhasil dihapus.');
    }

    /**
     * Hapus permanen (force delete) — hanya untuk Super Admin lain yang mengonfirmasi
     * penghapusan data yang sebelumnya di-soft-delete oleh Super Admin lain.
     */
    /**
     * @OA\Delete(
     *     path="/log-gudang/masuk/{id}/force",
     *     tags={"Gudang"},
     *     summary="Force-delete log masuk gudang",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=302, description="Redirect setelah log masuk dihapus permanen")
     * )
     */
    public function forceDestroyMasuk(int $id)
    {
        $logMasuk = LogMasukGudang::withTrashed()->findOrFail($id);

        // Pastikan record memang sudah di-soft-delete (bukan hapus normal)
        abort_unless($logMasuk->trashed(), 403, 'Data ini belum dihapus.');

        $logMasuk->forceDelete();

        return back()->with('success', 'Data berhasil dihapus permanen.');
    }

    /**
     * @OA\Post(
     *     path="/log-gudang/keluar",
     *     tags={"Gudang"},
     *     summary="Tambah log keluar gudang (multi-unit)",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
     *     @OA\Response(response=302, description="Redirect setelah log keluar dibuat")
     * )
     */
    public function storeKeluar(StoreLogKeluarRequest $request)
    {
        $data = $request->validated();

        $unitIds = $data['unit_ids'];
        $jumlahUnit = count($unitIds);
        $qtyPerUnit = round($data['qty'] / $jumlahUnit, 4);
        $harga = $data['harga'];

        DB::transaction(function () use ($unitIds, $data, $qtyPerUnit, $harga) {
            foreach ($unitIds as $unitId) {
                LogKeluarHarian::create([
                    'tanggal' => $data['tanggal'],
                    'unit_id' => $unitId,
                    'material_id' => $data['material_id'],
                    'qty' => $qtyPerUnit,
                    'harga' => $harga,
                    'satuan' => $data['satuan'] ?? null,
                    'total' => round($qtyPerUnit * $harga, 2),
                    'keterangan' => $data['keterangan'] ?? null,
                    'created_by' => Auth::id(),
                ]);

                $this->syncProgressStatus($unitId);
            }
        });

        $pesan = $jumlahUnit > 1
            ? "Log keluar berhasil ditambahkan ke {$jumlahUnit} unit."
            : 'Log keluar berhasil ditambahkan.';

        return back()->with('success', $pesan);
    }

    /**
     * @OA\Put(
     *     path="/log-gudang/keluar/{logKeluar}",
     *     tags={"Gudang"},
     *     summary="Update log keluar gudang",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="logKeluar", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
     *     @OA\Response(response=302, description="Redirect setelah log keluar diperbarui")
     * )
     */
    public function updateKeluar(UpdateLogKeluarRequest $request, LogKeluarHarian $logKeluar)
    {
        $data = $request->validated();

        $logKeluar->update($data);

        $this->syncProgressStatus($data['unit_id']);

        return back()->with('success', 'Log keluar berhasil diperbarui.');
    }

    /**
     * @OA\Delete(
     *     path="/log-gudang/keluar/{logKeluar}",
     *     tags={"Gudang"},
     *     summary="Soft-delete log keluar gudang",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="logKeluar", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=302, description="Redirect setelah log keluar dihapus")
     * )
     */
    public function destroyKeluar(LogKeluarHarian $logKeluar)
    {
        $unitId = $logKeluar->unit_id;

        $logKeluar->delete();

        $this->syncProgressStatus($unitId);

        return back()->with('success', 'Log keluar berhasil dihapus.');
    }

    /**
     * Hapus permanen (force delete) — hanya untuk Super Admin lain yang mengonfirmasi
     * penghapusan data yang sebelumnya di-soft-delete oleh Super Admin lain.
     */
    /**
     * @OA\Delete(
     *     path="/log-gudang/keluar/{id}/force",
     *     tags={"Gudang"},
     *     summary="Force-delete log keluar gudang",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=302, description="Redirect setelah log keluar dihapus permanen")
     * )
     */
    public function forceDestroyKeluar(int $id)
    {
        $logKeluar = LogKeluarHarian::withTrashed()->findOrFail($id);

        // Pastikan record memang sudah di-soft-delete
        abort_unless($logKeluar->trashed(), 403, 'Data ini belum dihapus.');

        $logKeluar->forceDelete();

        return back()->with('success', 'Data berhasil dihapus permanen.');
    }

    private function syncProgressStatus(int $unitId): void
    {
        $unit = Unit::findOrFail($unitId);

        $progressTerakhir = ProgressUnit::where('unit_id', $unit->id)
            ->latest('tanggal_update')
            ->first();

        if ($progressTerakhir) {
            $hasil = (new MaterialConsumptionService())->evaluasiUnit(
                $unit,
                $progressTerakhir->progress_percent
            );

            $progressTerakhir->update([
                'status_material' => $hasil['status'],
                'detail_material' => $hasil['detail'],
            ]);
        }
    }
}