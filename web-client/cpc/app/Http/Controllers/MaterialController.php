<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMaterialRequest;
use App\Http\Requests\UpdateMaterialRequest;
use App\Models\Material;
use Inertia\Inertia;
use Inertia\Response;

/**
 * @OA\Tag(
 *     name="Material",
 *     description="Manajemen material"
 * )
 */
class MaterialController extends Controller
{
    private const KATEGORI_OPTIONS = [
        'Struktur', 'Dinding', 'Atap', 'Finishing', 'Plumbing',
        'Elektrikal', 'Plafon', 'Pondasi', 'Bekisting',
    ];

    private const SATUAN_OPTIONS = [
        'Zak', 'Sak', 'Rit', 'M3', 'Bh', 'Btg', 'Kg', 'Lbr', 'Ltr', 'Dus', 'Set', 'Kaleng', 'Roll', 'Pail',
    ];

    /**
     * @OA\Get(
     *     path="/material",
     *     tags={"Material"},
     *     summary="List material",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="q", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="kategori", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="sortBy", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="sortDir", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="pageSize", in="query", @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Halaman daftar material")
     * )
     */
    public function index(\Illuminate\Http\Request $request): Response
    {
        $query = Material::query();

        if ($request->filled('q')) {
            $search = $request->q;
            $query->where(function ($q) use ($search) {
                $q->where('kode_material', 'ilike', "%{$search}%")
                  ->orWhere('nama_material', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('kategori') && $request->kategori !== 'Semua') {
            $query->where('kategori', $request->kategori);
        }

        if ($request->filled('sortBy')) {
            $sortDir = $request->sortDir === 'desc' ? 'desc' : 'asc';
            $query->orderBy($request->sortBy, $sortDir);
        } else {
            $query->orderBy('kode_material', 'asc');
        }

        $pageSize = $request->input('pageSize', 10);
        $materials = $query->paginate($pageSize)->withQueryString();

        $materials->getCollection()->transform(function ($material) {
            $hasLogs = $material->logMasuk()->exists() || $material->logKeluar()->exists();

            return array_merge($material->toArray(), [
                'can_delete' => !$hasLogs,
                'delete_reason' => $hasLogs
                    ? 'Material tidak bisa dihapus karena sudah ada transaksi gudang yang menggunakan material ini.'
                    : null,
            ]);
        });

        // Calculate next material code
        $latestMaterial = Material::where('kode_material', 'like', 'MT%')
                            ->get()
                            ->map(function ($item) {
                                preg_match('/^MT(\d+)$/', $item->kode_material, $matches);
                                return $matches ? (int)$matches[1] : 0;
                            })
                            ->max();
        $nextKodeMaterial = 'MT' . str_pad(($latestMaterial ?: 0) + 1, 3, '0', STR_PAD_LEFT);

        return Inertia::render('Material/Index', [
            'materials' => $materials,
            'kategoriOptions' => self::KATEGORI_OPTIONS,
            'satuanOptions'   => self::SATUAN_OPTIONS,
            'filters' => $request->only(['q', 'kategori', 'sortBy', 'sortDir', 'pageSize']),
            'nextKodeMaterial' => $nextKodeMaterial,
        ]);
    }

    /**
     * @OA\Post(
     *     path="/material",
     *     tags={"Material"},
     *     summary="Tambah material baru",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(type="object", description="Payload material baru")
     *     ),
     *     @OA\Response(response=302, description="Redirect setelah material dibuat")
     * )
     */
    public function store(StoreMaterialRequest $request)
    {
        Material::create($request->validated());

        return back()->with('success', 'Material baru berhasil ditambahkan.');
    }

    /**
     * @OA\Put(
     *     path="/material/{material}",
     *     tags={"Material"},
     *     summary="Update material",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="material", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(type="object", description="Data update material")),
     *     @OA\Response(response=302, description="Redirect setelah material diperbarui")
     * )
     */
    public function update(UpdateMaterialRequest $request, Material $material)
    {
        $material->update($request->validated());

        return back()->with('success', 'Material berhasil diperbarui.');
    }

    /**
     * @OA\Delete(
     *     path="/material/{material}",
     *     tags={"Material"},
     *     summary="Hapus material",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="material", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=302, description="Redirect setelah material dihapus")
     * )
     */
    public function destroy(Material $material)
    {
        if ($material->logMasuk()->exists() || $material->logKeluar()->exists()) {
            return back()->with('error', 'Material tidak bisa dihapus karena sudah ada transaksi gudang yang menggunakan material ini.');
        }

        $material->delete();

        return back()->with('success', 'Material berhasil dihapus.');
    }
}
