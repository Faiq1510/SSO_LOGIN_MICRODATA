<?php
/**
 * TEMPEL potongan ini ke routes/web.php milikmu (skeleton bersama).
 * Naruh di dalam group yang sudah pakai middleware ['auth'] + middleware role
 * dari Orang A (login/auth). JANGAN bikin file routes baru — web.php dipakai bersama.
 *
 * Role: Super Admin & Admin boleh CRUD Master Material, Owner tidak boleh sama sekali
 * (tidak usah ditambahkan resource-nya di sisi Owner / jangan expose route ini ke Owner).
 */

use App\Http\Controllers\MaterialController;

Route::middleware(['auth', 'role:Super Admin|Admin'])->group(function () {
    Route::resource('material', MaterialController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->parameters(['material' => 'material']);
});

/**
 * Ini otomatis generate route:
 *   GET    /material              -> material.index
 *   POST   /material               -> material.store
 *   PUT    /material/{material}    -> material.update
 *   DELETE /material/{material}    -> material.destroy
 *
 * 'role:Super Admin|Admin' asumsinya middleware alias dari spatie/laravel-permission
 * (RoleMiddleware) sudah didaftarkan Orang A di bootstrap/app.php atau Kernel.php.
 * Kalau middleware itu belum jadi, sesuai kesepakatan tim: hapus dulu bagian
 * middleware role-nya (biar tidak saling nunggu), kasih // TODO: middleware role,
 * lalu Orang A tinggal tempel belakangan tanpa ubah controller/page ini.
 */
