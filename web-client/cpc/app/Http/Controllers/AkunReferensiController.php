<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAkunReferensiRequest;
use App\Models\AkunReferensi;
use App\Models\AkunReferensiHistory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

/**
 * @OA\Tag(
 *     name="Keuangan - Akun Referensi",
 *     description="Manajemen akun referensi untuk laporan dan jurnal"
 * )
 */
class AkunReferensiController extends Controller
{
    /**
     * @OA\Get(
     *     path="/finance/akun-referensi",
     *     tags={"Keuangan - Akun Referensi"},
     *     summary="List akun referensi",
     *     security={{"sanctum": {}}},
     *     @OA\Response(response=200, description="Halaman daftar akun referensi")
     * )
     */
    public function index()
    {
        $user = Auth::user();
        $isSuperAdmin = $user->hasRole('Super Admin');

        // Super Admin lihat semua termasuk yang sudah dihapus (soft delete).
        // Admin Keuangan hanya lihat yang masih aktif.
        $query = $isSuperAdmin
            ? AkunReferensi::withTrashed()
            : AkunReferensi::query();

        $akunList = $query
            ->with(['creator:id,name', 'updater:id,name', 'deleter:id,name', 'parent:id,kode_akun,nama_akun'])
            ->orderBy('kode_akun')
            ->get()
            ->map(function (AkunReferensi $akun) use ($isSuperAdmin, $user) {
                $indicator = null;

                // Indikator cuma dihitung untuk Super Admin, dan disembunyikan
                // kalau pelaku terakhir adalah user yang sedang login sendiri.
                if ($isSuperAdmin) {
                    if ($akun->trashed() && $akun->deleted_by !== $user->id) {
                        $indicator = [
                            'type' => 'deleted',
                            'message' => sprintf(
                                'Akun ini telah dihapus oleh %s pada %s',
                                $akun->deleter?->name ?? 'seseorang',
                                $akun->deleted_at->translatedFormat('d M Y, H:i')
                            ),
                        ];
                    } elseif (!$akun->trashed()
                        && $akun->updated_by
                        && !$akun->wasRecentlyCreated
                        && $akun->updated_at->ne($akun->created_at)
                        && $akun->updated_by !== $user->id
                    ) {
                        $indicator = [
                            'type' => 'edited',
                            'message' => sprintf(
                                'Akun telah diedit oleh %s pada %s',
                                $akun->updater?->name ?? 'seseorang',
                                $akun->updated_at->translatedFormat('d M Y, H:i')
                            ),
                        ];
                    } elseif (!$akun->trashed()
                        && $akun->updated_at->eq($akun->created_at)
                        && $akun->created_by
                        && $akun->created_by !== $user->id
                    ) {
                        $indicator = [
                            'type' => 'created',
                            'message' => sprintf(
                                'Akun ditambahkan oleh %s pada %s',
                                $akun->creator?->name ?? 'seseorang',
                                $akun->created_at->translatedFormat('d M Y, H:i')
                            ),
                        ];
                    }
                }

                $hasTransaction = $akun->kasMasuks()->exists() || $akun->kasKeluars()->exists();
                $hasChildren = $akun->children()->count() > 0;
                $deleteReason = null;
                if ($akun->trashed()) {
                    $deleteReason = 'Akun ini sudah dihapus sebelumnya.';
                } elseif ($hasChildren) {
                    $deleteReason = 'Akun induk tidak bisa dihapus karena masih memiliki sub akun.';
                } elseif ($hasTransaction) {
                    $deleteReason = 'Akun tidak bisa dihapus karena sudah digunakan dalam transaksi kas.';
                }

                return [
                    'id' => $akun->id,
                    'kode_akun' => $akun->kode_akun,
                    'nama_akun' => $akun->nama_akun,
                    'kategori' => $akun->kategori,
                    'tipe_akun' => $akun->tipe_akun,
                    'parent_id' => $akun->parent_id,
                    'parent_name' => $akun->parent?->nama_akun,
                    'parent_code' => $akun->parent?->kode_akun,
                    'jenis' => $akun->jenis,
                    'tipe_neraca' => $akun->tipe_neraca,
                    'is_deleted' => $akun->trashed(),
                    'indicator' => $indicator,
                    'can_delete' => !$hasChildren && !$hasTransaction && !$akun->trashed(),
                    'delete_reason' => $deleteReason,
                ];
            })
            ->values();

        $histories = $isSuperAdmin
            ? AkunReferensiHistory::with(['user:id,name'])
                ->latest()
                ->limit(100)
                ->get()
                ->map(fn (AkunReferensiHistory $h) => [
                    'id' => $h->id,
                    'aksi' => $h->aksi,
                    'kode_akun' => $h->akunReferensi?->kode_akun,
                    'nama_akun' => $h->akunReferensi?->nama_akun,
                    'user' => $h->user?->name ?? 'Sistem',
                    'created_at' => $h->created_at->translatedFormat('d M Y, H:i'),
                ])
            : [];

        // Some installations may not yet have the `parent_id` column (migration
        // not applied). Guard the query to avoid SQL errors in that case.
        if (Schema::hasColumn('akun_referensis', 'parent_id')) {
            $parentOptions = AkunReferensi::query()
                ->whereNull('deleted_at')
                ->whereNull('parent_id')
                ->where('tipe_akun', 'induk')
                ->orderBy('kode_akun')
                ->get(['id', 'kode_akun', 'nama_akun'])
                ->map(fn (AkunReferensi $akun) => [
                    'id' => $akun->id,
                    'kode_akun' => $akun->kode_akun,
                    'nama_akun' => $akun->nama_akun,
                ]);
        } else {
            $parentOptions = [];
        }

        return Inertia::render('AkunReferensi/Index', [
            'akunList' => $akunList,
            'histories' => $histories,
            'isSuperAdmin' => $isSuperAdmin,
            'parentOptions' => $parentOptions,
        ]);
    }

    /**
     * @OA\Post(
     *     path="/finance/akun-referensi",
     *     tags={"Keuangan - Akun Referensi"},
     *     summary="Tambah akun referensi",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
     *     @OA\Response(response=302, description="Redirect setelah akun referensi dibuat")
     * )
     */
    public function store(StoreAkunReferensiRequest $request)
    {
        $akun = AkunReferensi::create([
            ...$request->except('children_ids'),
            'created_by' => Auth::id(),
        ]);

        if (!$request->parent_id && $request->has('children_ids')) {
            $this->syncChildren($akun, $request->children_ids);
        }

        AkunReferensiHistory::create([
            'akun_referensi_id' => $akun->id,
            'user_id' => Auth::id(),
            'aksi' => 'ditambahkan',
        ]);

        return to_route('finance.akun-referensi')->with('success', 'Akun berhasil ditambahkan.');
    }

    /**
     * @OA\Put(
     *     path="/finance/akun-referensi/{akunReferensi}",
     *     tags={"Keuangan - Akun Referensi"},
     *     summary="Update akun referensi",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="akunReferensi", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
     *     @OA\Response(response=302, description="Redirect setelah akun referensi diperbarui")
     * )
     */
    public function update(StoreAkunReferensiRequest $request, $akunReferensi)
    {
        $akunReferensi = AkunReferensi::withTrashed()->findOrFail($akunReferensi);
        $before = $akunReferensi->only(['kode_akun', 'nama_akun', 'kategori', 'tipe_neraca']);

        $akunReferensi->update([
            ...$request->except('children_ids'),
            'updated_by' => Auth::id(),
        ]);

        if ($akunReferensi->wasChanged('kode_akun')) {
            // Cascade update kode_akun ke sub-akun
            foreach ($akunReferensi->children as $child) {
                // Hapus awalan kode lama, pasang awalan kode baru
                $suffix = str_replace($before['kode_akun'] . '-', '', $child->kode_akun);
                $child->update(['kode_akun' => $akunReferensi->kode_akun . '-' . $suffix]);
            }
        }

        if (!$request->parent_id && $request->has('children_ids')) {
            $this->syncChildren($akunReferensi, $request->children_ids);
        }

        AkunReferensiHistory::create([
            'akun_referensi_id' => $akunReferensi->id,
            'user_id' => Auth::id(),
            'aksi' => 'diedit',
            'detail' => [
                'sebelum' => $before,
                'sesudah' => $akunReferensi->only(['kode_akun', 'nama_akun', 'kategori', 'tipe_neraca']),
            ],
        ]);

        return to_route('finance.akun-referensi')->with('success', 'Akun berhasil diperbarui.');
    }

    /**
     * @OA\Delete(
     *     path="/finance/akun-referensi/{akunReferensi}",
     *     tags={"Keuangan - Akun Referensi"},
     *     summary="Hapus akun referensi",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="akunReferensi", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=302, description="Redirect setelah akun referensi dihapus")
     * )
     */
    public function destroy($akunReferensi)
    {
        $akunReferensi = AkunReferensi::withTrashed()->findOrFail($akunReferensi);

        if ($akunReferensi->children()->count() > 0) {
            return to_route('finance.akun-referensi')->with('error', 'Akun induk tidak bisa dihapus karena masih memiliki sub akun.');
        }

        if ($akunReferensi->kasMasuks()->exists() || $akunReferensi->kasKeluars()->exists()) {
            return to_route('finance.akun-referensi')->with('error', 'Akun tidak bisa dihapus karena sudah digunakan dalam transaksi kas.');
        }

        if ($akunReferensi->trashed()) {
            return to_route('finance.akun-referensi')->with('info', 'Akun ini sudah dihapus sebelumnya.');
        }

        $akunReferensi->update(['deleted_by' => Auth::id()]);
        $akunReferensi->delete();

        AkunReferensiHistory::create([
            'akun_referensi_id' => $akunReferensi->id,
            'user_id' => Auth::id(),
            'aksi' => 'dihapus',
        ]);

        return to_route('finance.akun-referensi')->with('success', 'Akun berhasil dihapus.');
    }

    public function restore($akunReferensi)
    {
        $akunReferensi = AkunReferensi::withTrashed()->findOrFail($akunReferensi);

        abort_unless($akunReferensi->trashed(), 403, 'Data ini tidak dalam status terhapus.');

        $akunReferensi->restore();
        $akunReferensi->update(['deleted_by' => null]);

        AkunReferensiHistory::create([
            'akun_referensi_id' => $akunReferensi->id,
            'user_id' => Auth::id(),
            'aksi' => 'dipulihkan',
        ]);

        return to_route('finance.akun-referensi')->with('success', 'Akun berhasil dipulihkan.');
    }

    public function forceDestroy($akunReferensi)
    {
        $akunReferensi = AkunReferensi::withTrashed()->findOrFail($akunReferensi);

        abort_unless($akunReferensi->trashed(), 403, 'Data ini belum dihapus.');

        $akunReferensi->forceDelete();

        return to_route('finance.akun-referensi')->with('success', 'Akun berhasil dihapus permanen.');
    }

    private function syncChildren(AkunReferensi $parent, array $childrenIds)
    {
        // Lepas parent_id dari sub-akun yang sudah tidak dipilih
        $oldChildren = AkunReferensi::where('parent_id', $parent->id)
            ->whereNotIn('id', $childrenIds)
            ->get();
            
        foreach ($oldChildren as $child) {
            $child->update([
                'parent_id' => null,
                'kode_akun' => str_replace($parent->kode_akun . '-', '', $child->kode_akun)
            ]);
        }

        // Pasang parent_id dan update kode_akun untuk sub-akun yang dipilih
        if (!empty($childrenIds)) {
            $newChildren = AkunReferensi::whereIn('id', $childrenIds)->get();
            foreach ($newChildren as $child) {
                $newKode = str_starts_with($child->kode_akun, $parent->kode_akun . '-') 
                            ? $child->kode_akun 
                            : $parent->kode_akun . '-' . $child->kode_akun;

                $child->update([
                    'parent_id' => $parent->id,
                    'kode_akun' => $newKode
                ]);
            }
        }
    }
}