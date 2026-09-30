<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProgressUnitRequest;
use App\Models\ProgressUnit;
use App\Models\Unit;
use App\Models\MasterStandarProgress;
use App\Traits\LogsActivity;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Services\MaterialConsumptionService;
use Illuminate\Http\Request;

/**
 * @OA\Tag(
 *     name="Progress",
 *     description="Monitoring dan update progress unit"
 * )
 */
class ProgressController extends Controller
{
    use LogsActivity;

    public function __construct(protected MaterialConsumptionService $consumptionService)
    {
    }

    /**
     * @OA\Get(
     *     path="/progress",
     *     tags={"Progress"},
     *     summary="Monitoring progress seluruh unit",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="per_page", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="status", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="standar", in="query", @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="Halaman monitoring progress")
     * )
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $status  = $request->input('status');
        $standar = $request->input('standar');

        $query = Unit::with([
            'masterStandar',
            'latestProgress',
            'progress' => fn ($q) => $q->with('updatedBy')->orderByDesc('tanggal_update')->orderByDesc('id'),
        ])->orderBy('nama_unit');

        if ($status) {
            $query->whereHas('latestProgress', fn ($q) => $q->where('status_material', $status));
        }

        if ($standar) {
            $query->where('master_standar_id', $standar);
        }

        $pagination = null;

        if ($perPage === 'all') {
            $units = $query->get();
        } else {
            $paginated = $query->paginate((int) $perPage)->withQueryString();
            $units = collect($paginated->items());
            $pagination = [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'total'        => $paginated->total(),
            ];
        }

        $monitoring = $units->mapWithKeys(function (Unit $unit) {
            $detail = $unit->latestProgress?->detail_material ?? [];

            $rows = collect($detail)->map(fn ($d) => [
                'nama_material' => $d['material'],
                'standar'       => $d['qty_standar'],
                'aktual'        => $d['qty_aktual'],
                'sisa'          => $d['sisa'] ?? ($d['qty_aktual'] - $d['qty_standar']),
                'analisa'       => strtoupper($d['status']),
            ])->all();

            return [$unit->id => $rows];
        });

        return Inertia::render('Progress/Index', [
            'units'      => $units->values(),
            'masterStandars' => MasterStandarProgress::all(),
            'monitoring' => $monitoring,
            'pagination' => $pagination,
            'filters'    => [
                'per_page' => $perPage,
                'status'   => $status,
                'standar'  => $standar,
            ],
        ]);
    }

    /**
     * @OA\Post(
     *     path="/progress",
     *     tags={"Progress"},
     *     summary="Update progress unit",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
     *     @OA\Response(response=302, description="Redirect setelah progress diperbarui")
     * )
     */
    public function store(StoreProgressUnitRequest $request)
    {
        $unit = Unit::findOrFail($request->validated('unit_id'));
    $progressPercent = (int) $request->validated('progress_percent');
    $hasil = $this->consumptionService->evaluasiUnit($unit, $progressPercent);

    // Status ditentukan otomatis dari progress_percent, bukan dari input user
    $status = match (true) {
        $progressPercent >= 100 => 'DONE',
        $progressPercent > 0    => 'ON PROGRESS',
        default                 => 'NOT STARTED',
    };

    DB::transaction(function () use ($request, $unit, $hasil, $status) {
        $progress = ProgressUnit::create([
            ...$request->validated(),
            'status'           => $status,
            'updated_by'       => Auth::id(),
            'status_material'  => strtoupper($hasil['status']),
            'detail_material'  => $hasil['detail'],
        ]);

        if ($unit->status !== 'Aktif') {
            $unit->update(['status' => 'Aktif']);
        }

        $this->notifikasiJikaBermasalah($unit, $hasil, $progress);
    });

    return back()->with('success', 'Progress unit berhasil diperbarui.');
}

    private function notifikasiJikaBermasalah(Unit $unit, array $hasil, ProgressUnit $progress): void
    {
        $status = strtoupper($hasil['status']);

        if ($status !== 'WARNING' && $status !== 'BOROS') {
            return;
        }

        // Ambil nama-nama material yang statusnya bukan Aman, buat isi deskripsi
        $materialBermasalah = collect($hasil['detail'])
            ->filter(fn ($d) => strtoupper($d['status']) !== 'AMAN')
            ->pluck('material')
            ->implode(', ');

        $this->logActivity(
            module: 'progress',
            action: strtolower($status), // 'warning' atau 'boros', dipakai NotificationIcon di frontend
            description: "Unit {$unit->nama_unit}: pemakaian material {$status} pada {$materialBermasalah}",
            subject: $progress,
        );
    }
}