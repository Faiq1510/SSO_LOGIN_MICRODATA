<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreKasMasukRequest;
use App\Models\AkunReferensi;
use App\Models\KasMasuk;
use App\Services\KasMasukService;
use Inertia\Inertia;

/**
 * @OA\Tag(
 *     name="Keuangan - Kas Masuk",
 *     description="Manajemen kas masuk"
 * )
 */
class KasMasukController extends Controller
{
    public function __construct(protected KasMasukService $service) {}

    /**
     * @OA\Get(
     *     path="/finance/kas-masuk",
     *     tags={"Keuangan - Kas Masuk"},
     *     summary="List kas masuk",
     *     security={{"sanctum": {}}},
     *     @OA\Response(response=200, description="Halaman kas masuk")
     * )
     */
    public function index()
    {
        $kasMasuk = KasMasuk::with('akunReferensi')
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->get();

        $totalBulanIni = KasMasuk::whereMonth('tanggal', now()->month)
            ->whereYear('tanggal', now()->year)
            ->sum('nominal');

        return Inertia::render('Finance/KasMasuk', [
            'kasMasuk' => $kasMasuk,
            'totalBulanIni' => $totalBulanIni,
            'akunOptions' => AkunReferensi::masuk()->get(['id', 'nama_akun']),
        ]);
    }

    /**
     * @OA\Post(
     *     path="/finance/kas-masuk",
     *     tags={"Keuangan - Kas Masuk"},
     *     summary="Tambah kas masuk",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
     *     @OA\Response(response=302, description="Redirect setelah kas masuk dicatat")
     * )
     */
    public function store(StoreKasMasukRequest $request)
    {
        $this->service->create($request->validated());

        return redirect()->back()->with('success', 'Kas masuk berhasil dicatat.');
    }

    /**
     * @OA\Put(
     *     path="/finance/kas-masuk/{kasMasuk}",
     *     tags={"Keuangan - Kas Masuk"},
     *     summary="Update kas masuk",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="kasMasuk", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
     *     @OA\Response(response=302, description="Redirect setelah kas masuk diperbarui")
     * )
     */
    public function update(StoreKasMasukRequest $request, KasMasuk $kasMasuk)
    {
        // Nanti kita tambahkan method update di KasMasukService (Poin 4)
        $this->service->update($kasMasuk, $request->validated());

        return redirect()->back()->with('success', 'Kas masuk berhasil diperbarui.');
    }

    /**
     * @OA\Delete(
     *     path="/finance/kas-masuk/{kasMasuk}",
     *     tags={"Keuangan - Kas Masuk"},
     *     summary="Hapus kas masuk",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="kasMasuk", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=302, description="Redirect setelah kas masuk dihapus")
     * )
     */
    public function destroy(KasMasuk $kasMasuk)
    {
        // Nanti kita tambahkan method delete di KasMasukService (Poin 4)
        $this->service->delete($kasMasuk);

        return redirect()->back()->with('success', 'Kas masuk berhasil dihapus.');
    }
}