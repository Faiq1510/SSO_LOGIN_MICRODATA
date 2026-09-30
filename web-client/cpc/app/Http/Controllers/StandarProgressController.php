<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMatrixDetailRequest;
use App\Http\Requests\StoreMatrixProgressRequest;
use App\Models\MasterStandarProgress;
use App\Models\Material;
use App\Models\MatrixProgress;
use App\Models\MatrixProgressDetail;
use Inertia\Inertia;

class StandarProgressController extends Controller
{
    /**
     * GET /standar
     */
    /**
     * GET /standar/{master} — tampilkan detail tahapan sebuah Master Standar
     */
    public function index(MasterStandarProgress $master)
    {
        $matrixRows = MatrixProgress::with('details.material')
            ->where('master_standar_id', $master->id)
            ->orderBy('batas_atas')
            ->get()
            ->map(function ($matrix) use ($master) {
                return [
                    'id'              => $matrix->id,
                    'batas_atas'      => $matrix->batas_atas,
                    'range_progress'  => $matrix->range_progress,
                    'tahap_pekerjaan' => $matrix->tahap_pekerjaan,
                    'canDelete'       => true,
                    'details'         => $matrix->details->map(function ($d) {
                        return [
                            'id'            => $d->id,
                            'material_id'   => $d->material_id,
                            'kode_material' => $d->material->kode_material,
                            'nama_material' => $d->material->nama_material,
                            'satuan'        => $d->material->satuan,
                            'qty_standar'   => (float) $d->qty_standar,
                            'canDelete'     => true,
                        ];
                    })->values(),
                ];
            });

        $materials = Material::orderBy('nama_material')
            ->get(['id', 'kode_material', 'nama_material', 'satuan']);

        // Hanya tampilkan tahap dari MASTER_TAHAP yang belum dipakai di standar ini
        $usedTahap = $matrixRows->pluck('tahap_pekerjaan')->toArray();
        $tahapOptions = collect(MatrixProgress::MASTER_TAHAP)
            ->reject(fn($item) => in_array($item['tahap_pekerjaan'], $usedTahap))
            ->values();

        // Hitung canDelete per row berdasarkan unit yang menggunakan standar ini
        $matrixRows = $matrixRows->map(function ($row) use ($master) {
            $prevBatas = \DB::table('matrix_progress')
                ->where('master_standar_id', $master->id)
                ->where('batas_atas', '<', $row['batas_atas'])
                ->max('batas_atas');
            if (is_null($prevBatas)) {
                $prevBatas = 0;
            }

            // Cari unit_id yang terikat ke standar ini
            $unitIds = \DB::table('units')
                ->where('master_standar_id', $master->id)
                ->pluck('id');

            $usedInProgress = false;
            foreach ($unitIds as $unitId) {
                // Ambil progress terakhir untuk unit ini
                $latestProgress = \DB::table('progress_unit')
                    ->where('unit_id', $unitId)
                    ->orderByDesc('tanggal_update')
                    ->orderByDesc('id')
                    ->value('progress_percent');

                // Jika progress unit sudah melewati batas bawah tahap ini (yaitu $prevBatas),
                // maka tahap ini dianggap sudah pernah/sedang aktif digunakan oleh unit tersebut.
                if ($latestProgress !== null && $latestProgress > $prevBatas) {
                    $usedInProgress = true;
                    break;
                }
            }

            $row['canDelete'] = !$usedInProgress;

            $row['details'] = collect($row['details'])->map(function ($d) use ($unitIds) {
                $used = \DB::table('log_keluar_harian')
                    ->whereIn('unit_id', $unitIds)
                    ->where('material_id', $d['material_id'])
                    ->exists();
                $d['canDelete'] = !$used;
                return $d;
            })->values();

            return $row;
        });

        // Ambil tahap-tahap yang pernah dihapus (soft-deleted) untuk opsi restore/pulihkan
        $deletedStages = MatrixProgress::onlyTrashed()
            ->where('master_standar_id', $master->id)
            ->orderBy('tahap_pekerjaan')
            ->get(['id', 'tahap_pekerjaan', 'batas_atas'])
            ->map(fn($m) => [
                'id' => $m->id,
                'tahap_pekerjaan' => $m->tahap_pekerjaan,
                'batas_atas' => $m->batas_atas
            ]);

        return Inertia::render('StandarProgress/StandarProgressIndex', [
            'master'     => [
                'id'          => $master->id,
                'nama_standar' => $master->nama_standar,
                'deskripsi'   => $master->deskripsi,
            ],
            'matrixRows' => $matrixRows,
            'materials'  => $materials,
            'canEdit'    => auth()->user()?->hasRole('Super Admin') ?? false,
            'tahapOptions' => $tahapOptions,
            'deletedStages' => $deletedStages,
        ]);
    }

    /**
     * POST /standar/{master}
     */
    public function store(StoreMatrixProgressRequest $request, MasterStandarProgress $master)
    {
        $validated = $request->validated();
        
        // Cek apakah ada tahap yang terhapus dengan nama yang sama di standar ini
        $deletedMatrix = MatrixProgress::onlyTrashed()
            ->where('master_standar_id', $master->id)
            ->where('tahap_pekerjaan', $validated['tahap_pekerjaan'])
            ->first();

        if ($deletedMatrix) {
            $deletedMatrix->restore();
            // Update dengan data baru jika user mengubah batas atasnya saat merestore
            $deletedMatrix->update($validated);
            
            // Restore detailsnya juga jika ada
            $deletedMatrix->details()->restore();
        } else {
            MatrixProgress::create(array_merge($validated, [
                'master_standar_id' => $master->id,
            ]));
        }

        return redirect()
            ->route('standar.index', $master)
            ->with('success', 'Tahap standar progres berhasil ditambahkan.');
    }

    /**
     * PUT /standar/{master}/matrix/{matrix}
     */
    public function update(StoreMatrixProgressRequest $request, MasterStandarProgress $master, MatrixProgress $matrix)
    {
        $matrix->update($request->validated());

        return redirect()
            ->route('standar.index', $master)
            ->with('success', 'Tahap standar progres berhasil diperbarui.');
    }

    /**
     * DELETE /standar/{master}/matrix/{matrix}
     */
    public function destroy(MasterStandarProgress $master, MatrixProgress $matrix)
    {
        $matrix->details()->delete();
        $matrix->delete();

        return redirect()
            ->route('standar.index', $master)
            ->with('success', 'Tahap standar progres berhasil dihapus.');
    }

    /**
     * POST /standar/{master}/matrix/{matrix}/detail
     */
    public function storeDetail(StoreMatrixDetailRequest $request, MasterStandarProgress $master, MatrixProgress $matrix)
    {
        $matrix->details()->updateOrCreate(
            ['material_id' => $request->validated('material_id')],
            ['qty_standar' => $request->validated('qty_standar')]
        );

        return redirect()
            ->route('standar.index', $master)
            ->with('success', 'Standar material berhasil disimpan.');
    }

    /**
     * PUT /standar-detail/{detail}
     */
    public function updateDetail(StoreMatrixDetailRequest $request, MatrixProgressDetail $detail)
    {
        $detail->update($request->validated());

        $masterId = $detail->matrix->master_standar_id;
        return redirect()
            ->route('standar.index', $masterId)
            ->with('success', 'Standar material berhasil diperbarui.');
    }

    /**
     * DELETE /standar-detail/{detail}
     */
    public function destroyDetail(MatrixProgressDetail $detail)
    {
        $masterId = $detail->matrix->master_standar_id;
        $detail->delete();

        return redirect()
            ->route('standar.index', $masterId)
            ->with('success', 'Standar material berhasil dihapus.');
    }
}