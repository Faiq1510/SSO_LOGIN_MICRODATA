<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreKasKeluarRequest;
use App\Models\AkunReferensi;
use App\Models\KasKeluar;
use App\Models\Material;
use App\Services\KasKeluarService;
use App\Models\Unit;
use Inertia\Inertia;

/**
 * @OA\Tag(
 *     name="Keuangan - Kas Keluar",
 *     description="Manajemen kas keluar"
 * )
 */
class KasKeluarController extends Controller
{
    public function __construct(protected KasKeluarService $service) {}

    /**
     * @OA\Get(
     *     path="/finance/kas-keluar",
     *     tags={"Keuangan - Kas Keluar"},
     *     summary="List kas keluar",
     *     security={{"sanctum": {}}},
     *     @OA\Response(response=200, description="Halaman kas keluar")
     * )
     */
    public function index()
    {
        $kasKeluar = KasKeluar::with('akunReferensi')
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->get()
            ->map(fn ($item) => [
                ...$item->toArray(),
                'lampiran_url' => $item->lampiran_path ? asset('storage/' . $item->lampiran_path) : null,
            ]);

        return Inertia::render('Finance/KasKeluar', [
            'kasKeluar' => $kasKeluar,
            'akunOptions' => AkunReferensi::keluar()->orderBy('kode_akun')->get(['id', 'kode_akun', 'nama_akun']),
            'unitOptions' => Unit::orderBy('nama_unit')->get(['id', 'nama_unit']),
        ]);
    }

    /**
     * @OA\Post(
     *     path="/finance/kas-keluar",
     *     tags={"Keuangan - Kas Keluar"},
     *     summary="Tambah kas keluar",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
     *     @OA\Response(response=302, description="Redirect setelah kas keluar dicatat")
     * )
     */
    public function store(StoreKasKeluarRequest $request)
    {
        $this->service->create($request->validated(), $request->file('lampiran'));

        return redirect()->back()->with('success', 'Kas keluar berhasil dicatat.');
    }

    /**
     * @OA\Put(
     *     path="/finance/kas-keluar/{kasKeluar}",
     *     tags={"Keuangan - Kas Keluar"},
     *     summary="Update kas keluar",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="kasKeluar", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
     *     @OA\Response(response=302, description="Redirect setelah kas keluar diperbarui")
     * )
     */
    public function update(StoreKasKeluarRequest $request, KasKeluar $kasKeluar)
    {
        // Lempar request file ke service biar di-handle replace lampirannya
        $this->service->update($kasKeluar, $request->validated(), $request->file('lampiran'));

        return redirect()->back()->with('success', 'Kas keluar berhasil diperbarui.');
    }

    /**
     * @OA\Delete(
     *     path="/finance/kas-keluar/{kasKeluar}",
     *     tags={"Keuangan - Kas Keluar"},
     *     summary="Hapus kas keluar",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="kasKeluar", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=302, description="Redirect setelah kas keluar dihapus")
     * )
     */
    public function destroy(KasKeluar $kasKeluar)
    {
        // Hapus data dan file lampiran dari storage akan di-handle di service
        $this->service->delete($kasKeluar);

        return redirect()->back()->with('success', 'Kas keluar berhasil dihapus.');
    }
}