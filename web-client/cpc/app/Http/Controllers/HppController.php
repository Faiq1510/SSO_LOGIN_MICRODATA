<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\KasKeluar;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * @OA\Tag(
 *     name="Keuangan - HPP",
 *     description="Laporan HPP per unit"
 * )
 */
class HppController extends Controller
{
    /**
     * @OA\Get(
     *     path="/finance/hpp-per-unit",
     *     tags={"Keuangan - HPP"},
     *     summary="Halaman HPP per unit",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="pageSize", in="query", @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Halaman HPP per unit")
     * )
     */
    public function index(Request $request)
    {
        $pageSize = (int) $request->query('pageSize', 10);
        if (! in_array($pageSize, [10, 25, 50, 100], true)) {
            $pageSize = 10;
        }

        $materialCosts = DB::table('log_keluar_harian')
            ->select('unit_id', DB::raw('COALESCE(SUM(total), 0) as total_material'))
            ->groupBy('unit_id')
            ->pluck('total_material', 'unit_id');

        $cashCosts = KasKeluar::query()
            ->with('akunReferensi')
            ->whereNotNull('unit')
            ->select('id', 'unit', 'total', 'akun_referensi_id')
            ->get()
            ->groupBy('unit')
            ->map(function ($items) {
                $totalUpah = $items->sum(fn ($item) => $item->akunReferensi?->kategori === 'HPP' ? (float) $item->total : 0);
                $totalOperasional = $items->sum(fn ($item) => $item->akunReferensi?->kategori !== 'HPP' ? (float) $item->total : 0);

                return (object) [
                    'total_upah' => $totalUpah,
                    'total_operasional' => $totalOperasional,
                ];
            });

        $unitDetails = Unit::query()
            ->orderBy('zona')
            ->orderBy('nama_unit')
            ->get()
            ->map(function ($unit) use ($materialCosts, $cashCosts) {
                $material = (float) ($materialCosts[$unit->id] ?? 0);
                $cash = $cashCosts->get($unit->nama_unit);
                $upah = (float) ($cash->total_upah ?? 0);
                $operasional = (float) ($cash->total_operasional ?? 0);
                $total = $material + $upah + $operasional;

                return [
                    'id' => $unit->id,
                    'nama_unit' => $unit->nama_unit,
                    'zona' => $unit->zona,
                    'biaya_material' => $material,
                    'biaya_upah' => $upah,
                    'biaya_operasional' => $operasional,
                    'total_hpp' => $total,
                ];
            });

        $totalProyek = $unitDetails->sum('total_hpp');
        $unitTertinggi = $unitDetails->sortByDesc('total_hpp')->first();
        $rataRata = $unitDetails->count() ? $totalProyek / $unitDetails->count() : 0;

        $rows = Unit::query()
            ->orderBy('zona')
            ->orderBy('nama_unit')
            ->paginate($pageSize)
            ->withQueryString()
            ->through(function ($unit) use ($materialCosts, $cashCosts) {
                $material = (float) ($materialCosts[$unit->id] ?? 0);
                $cash = $cashCosts->get($unit->nama_unit);
                $upah = (float) ($cash->total_upah ?? 0);
                $operasional = (float) ($cash->total_operasional ?? 0);
                $total = $material + $upah + $operasional;

                return [
                    'id' => $unit->id,
                    'nama_unit' => $unit->nama_unit,
                    'zona' => $unit->zona,
                    'biaya_material' => $material,
                    'biaya_upah' => $upah,
                    'biaya_operasional' => $operasional,
                    'total_hpp' => $total,
                ];
            });

        return Inertia::render('HPP/Index', [
            'rows' => $rows,
            'summary' => [
                'total_proyek' => $totalProyek,
                'rata_rata' => $rataRata,
                'unit_tertinggi' => $unitTertinggi,
            ],
            'filters' => [
                'pageSize' => $pageSize,
            ],
        ]);
    }
}