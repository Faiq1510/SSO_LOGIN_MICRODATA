<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUnitRequest;
use App\Models\Unit;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * @OA\Tag(
 *     name="Unit",
 *     description="Manajemen unit"
 * )
 */
class UnitController extends Controller
{
    /**
     * @OA\Get(
     *     path="/unit",
     *     tags={"Unit"},
     *     summary="List semua unit",
     *     security={{"sanctum": {}}},
     *     @OA\Response(response=200, description="Halaman daftar unit")
     * )
     */
    public function index()
    {
        $units = Unit::with(['masterStandar', 'latestProgress'])
            ->withCount('logKeluar')
            ->orderBy('nama_unit')
            ->get()
            ->map(function (Unit $unit) {
                $lastProgress = $unit->latestProgress?->progress_percent ?? 0;
                return [
                    'id' => $unit->id,
                    'nama_unit' => $unit->nama_unit,
                    'zona' => $unit->zona,
                    'status' => $unit->status,
                    'tukang' => $unit->tukang,
                    'tanggal_mulai' => $unit->tanggal_mulai,
                    'keterangan' => $unit->keterangan,
                    'master_standar_id' => $unit->master_standar_id,
                    'nama_standar' => $unit->masterStandar?->nama_standar ?? '-',
                    'can_delete' => $unit->log_keluar_count === 0,
                    'delete_reason' => $unit->log_keluar_count > 0
                        ? 'Unit tidak bisa dihapus karena sudah memiliki catatan penggunaan material.'
                        : null,
                    'can_change_standar' => $lastProgress === 0,
                ];
            });

        $masterStandards = \App\Models\MasterStandarProgress::orderBy('nama_standar')->get(['id', 'nama_standar']);

        return Inertia::render('Unit/Index', [
            'units' => $units,
            'masterStandards' => $masterStandards,
        ]);
    }

    /**
     * @OA\Post(
     *     path="/unit",
     *     tags={"Unit"},
     *     summary="Tambah unit baru",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(type="object", description="Payload unit baru")
     *     ),
     *     @OA\Response(response=302, description="Redirect setelah unit dibuat")
     * )
     */
    public function store(StoreUnitRequest $request)
    {
        Unit::create($request->validated());

        return redirect()->back()->with('success', 'Unit berhasil ditambahkan.');
    }

    /**
     * @OA\Put(
     *     path="/unit/{unit}",
     *     tags={"Unit"},
     *     summary="Update unit",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="unit",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(type="object", description="Data update unit")
     *     ),
     *     @OA\Response(response=302, description="Redirect setelah unit diperbarui")
     * )
     */
    public function update(StoreUnitRequest $request, Unit $unit)
    {
        $unit->update($request->validated());
    
        return redirect()->back()->with('success', 'Unit berhasil diperbarui.');
    }

    /**
     * @OA\Delete(
     *     path="/unit/{unit}",
     *     tags={"Unit"},
     *     summary="Hapus satu unit",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="unit",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=302, description="Redirect setelah unit dihapus")
     * )
     */
    public function destroy(Unit $unit)
    {
        if ($unit->logKeluar()->exists()) {
            return redirect()->back()->with('error', 'Unit tidak bisa dihapus karena sudah memiliki catatan penggunaan material.');
        }

        $unit->delete();

        return redirect()->back()->with('success', 'Unit berhasil dihapus.');
    }

    /**
     * @OA\Delete(
     *     path="/unit/bulk-destroy",
     *     tags={"Unit"},
     *     summary="Hapus banyak unit sekaligus",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(type="object",
     *             @OA\Property(property="ids", type="array", @OA\Items(type="integer"))
     *         )
     *     ),
     *     @OA\Response(response=302, description="Redirect setelah unit dihapus")
     * )
     */
    public function destroyBulk(Request $request)
    {
        $ids = $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|exists:units,id',
        ])['ids'];

        $unitsWithLogs = Unit::whereIn('id', $ids)
            ->whereHas('logKeluar')
            ->pluck('nama_unit')
            ->toArray();

        if (!empty($unitsWithLogs)) {
            $names = implode(', ', $unitsWithLogs);
            return redirect()->back()->with('error', "Tidak bisa menghapus unit-unit berikut karena sudah memiliki catatan penggunaan material: {$names}.");
        }

        $count = Unit::whereIn('id', $ids)->delete();

        return redirect()->back()->with('success', "{$count} unit berhasil dihapus.");
    }
}