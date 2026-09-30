<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\StandarProgressController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LogGudangController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\UserRoleController;
use App\Http\Controllers\AkunReferensiController;
use App\Http\Controllers\HppController;
use App\Http\Controllers\KartuMaterialUnitController;
use App\Http\Controllers\KasMasukController;
use App\Http\Controllers\KasKeluarController;
use App\Http\Controllers\SpjController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\NeracaController;

Route::middleware('auth')->group(function () {
    Route::post('/notifications/{activityLog}/read', [NotificationController::class, 'read'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.readAll');
});

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'index'])->name('profile');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/profile/email/send-otp', [ProfileController::class, 'sendEmailOtp'])->name('profile.email.send-otp');
    Route::post('/profile/email/verify-old-otp', [ProfileController::class, 'verifyOldEmailOtp'])->name('profile.email.verify-old-otp');
    Route::post('/profile/email/send-new-otp', [ProfileController::class, 'sendNewEmailOtp'])->name('profile.email.send-new-otp');
    Route::post('/profile/email/verify-new-otp', [ProfileController::class, 'verifyNewEmailOtp'])->name('profile.email.verify-new-otp');
    Route::post('/profile/password/send-otp', [ProfileController::class, 'sendPasswordOtp'])->name('profile.password.send-otp');
    Route::post('/profile/password/verify-otp', [ProfileController::class, 'verifyPasswordOtp'])->name('profile.password.verify-otp');
    Route::post('/profile/password/reset', [ProfileController::class, 'resetPasswordWithOtp'])->name('profile.password.reset');
});

Route::middleware(['auth', 'role:Super Admin|Admin'])->group(function () {
    Route::resource('material', MaterialController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->parameters(['material' => 'material']);
});

// Unit — dikunci hanya untuk role operasional, "Pengguna" tidak boleh masuk
Route::middleware(['auth', 'verified', 'role:Super Admin|Admin|Owner', 'check.menu'])->group(function () {
    Route::get('/unit', [UnitController::class, 'index'])->name('unit.index');
    Route::post('/unit', [UnitController::class, 'store'])->name('unit.store');
    Route::put('/unit/{unit}', [UnitController::class, 'update'])->name('unit.update');
    Route::delete('/unit/bulk-destroy', [UnitController::class, 'destroyBulk'])->name('unit.destroyBulk');
    Route::delete('/unit/{unit}', [UnitController::class, 'destroy'])->name('unit.destroy');
});

// Dashboard — SATU-SATUNYA definisi, sudah termasuk role "Pengguna"
Route::middleware(['auth', 'role:Super Admin|Admin|Admin Keuangan|Owner|Pengguna', 'check.menu'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

Route::middleware(['auth', 'role:Super Admin|Admin|Admin Keuangan', 'check.menu'])->group(function () {
    Route::get('/log-gudang', [LogGudangController::class, 'index'])->name('gudang.index');
    Route::get('/log-gudang/history', [LogGudangController::class, 'history'])->name('log-gudang.history');
});

Route::middleware(['auth', 'role:Super Admin|Admin'])->prefix('log-gudang')->name('log-gudang.')->group(function () {
    Route::post('/masuk', [LogGudangController::class, 'storeMasuk'])->name('masuk.store');
    Route::put('/masuk/{logMasuk}', [LogGudangController::class, 'updateMasuk'])->name('masuk.update');
    Route::delete('/masuk/{logMasuk}', [LogGudangController::class, 'destroyMasuk'])->name('masuk.destroy');
    Route::post('/keluar', [LogGudangController::class, 'storeKeluar'])->name('keluar.store');
    Route::put('/keluar/{logKeluar}', [LogGudangController::class, 'updateKeluar'])->name('keluar.update');
    Route::delete('/keluar/{logKeluar}', [LogGudangController::class, 'destroyKeluar'])->name('keluar.destroy');
});

// Force delete (hapus permanen) — hanya Super Admin, untuk mengonfirmasi penghapusan oleh SA lain
Route::middleware(['auth', 'role:Super Admin'])->prefix('log-gudang')->name('log-gudang.')->group(function () {
    Route::delete('/masuk/{id}/force', [LogGudangController::class, 'forceDestroyMasuk'])->name('masuk.force-destroy');
    Route::delete('/keluar/{id}/force', [LogGudangController::class, 'forceDestroyKeluar'])->name('keluar.force-destroy');
});

// Progress — dikunci, "Pengguna" tidak boleh masuk
Route::middleware(['auth', 'verified', 'role:Super Admin|Admin', 'check.menu'])->group(function () {
    Route::get('/progress', [ProgressController::class, 'index'])->name('progress.index');
    Route::post('/progress', [ProgressController::class, 'store'])->name('progress.store');
});

// Standar — dikunci, "Pengguna" tidak boleh masuk
Route::middleware(['auth', 'role:Super Admin|Admin', 'check.menu'])->group(function () {
    Route::get('/standar', [\App\Http\Controllers\MasterStandarProgressController::class, 'index'])->name('standar.master.index');
    Route::post('/standar/master', [\App\Http\Controllers\MasterStandarProgressController::class, 'store'])->name('standar.master.store');
    Route::put('/standar/master/{master}', [\App\Http\Controllers\MasterStandarProgressController::class, 'update'])->name('standar.master.update');
    Route::delete('/standar/master/{master}', [\App\Http\Controllers\MasterStandarProgressController::class, 'destroy'])->name('standar.master.destroy');

    Route::get('/standar/{master}', [StandarProgressController::class, 'index'])->name('standar.index');
    Route::post('/standar/{master}', [StandarProgressController::class, 'store'])->name('standar.store');
    Route::put('/standar/{master}/matrix/{matrix}', [StandarProgressController::class, 'update'])->name('standar.update');
    Route::delete('/standar/{master}/matrix/{matrix}', [StandarProgressController::class, 'destroy'])->name('standar.destroy');
    Route::post('/standar/{master}/matrix/{matrix}/detail', [StandarProgressController::class, 'storeDetail'])->name('standar.detail.store');
    Route::put('/standar-detail/{detail}', [StandarProgressController::class, 'updateDetail'])->name('standar.detail.update');
    Route::delete('/standar-detail/{detail}', [StandarProgressController::class, 'destroyDetail'])->name('standar.detail.destroy');
});

Route::middleware(['auth', 'role:Super Admin'])->group(function () {
    Route::get('/user-role', [UserRoleController::class, 'index'])->name('users.index');
    Route::get('/user-role/create', [UserRoleController::class, 'create'])->name('users.create');
    Route::post('/user-role', [UserRoleController::class, 'store'])->name('users.store');
    Route::get('/user-role/{user}/edit', [UserRoleController::class, 'edit'])->name('users.edit');
    Route::put('/user-role/{user}', [UserRoleController::class, 'update'])->name('users.update');
    Route::patch('/users/{user}/toggle', [UserRoleController::class, 'toggleStatus'])->name('users.toggle');
    Route::delete('/user-role/{user}', [UserRoleController::class, 'destroy'])->name('users.destroy');
    // Simpan override visibilitas menu untuk user
    Route::post('/user-role/{user}/menu-override', [UserRoleController::class, 'updateMenuOverride'])->name('users.menu-override.update');
});

Route::middleware(['auth', 'role:Super Admin|Admin Keuangan', 'check.menu'])->prefix('finance')->name('finance.')->group(function () {
    // Route Laba Rugi sudah dipindahkan ke sini
    Route::get('laba-rugi', [FinanceController::class, 'labaRugi'])->name('laba-rugi');

    Route::get('arus-kas', [FinanceController::class, 'arusKas'])->name('arus-kas');
    Route::get('arus-kas/export', [FinanceController::class, 'exportArusKas'])->name('arus-kas.export');

    Route::get('kas-flow', [SpjController::class, 'index'])->name('kas-flow');
    Route::get('kas-flow/export', [SpjController::class, 'export'])->name('kas-flow.export');

    Route::get('kas-keluar', [KasKeluarController::class, 'index'])->name('kas-keluar');
    Route::post('kas-keluar', [KasKeluarController::class, 'store'])->name('kas-keluar.store');
    Route::put('kas-keluar/{kasKeluar}', [KasKeluarController::class, 'update'])->name('kas-keluar.update');
    Route::delete('kas-keluar/{kasKeluar}', [KasKeluarController::class, 'destroy'])->name('kas-keluar.destroy');
    Route::get('kas-masuk', [KasMasukController::class, 'index'])->name('kas-masuk');
    Route::post('kas-masuk', [KasMasukController::class, 'store'])->name('kas-masuk.store');
    Route::put('kas-masuk/{kasMasuk}', [KasMasukController::class, 'update'])->name('kas-masuk.update');
    Route::delete('kas-masuk/{kasMasuk}', [KasMasukController::class, 'destroy'])->name('kas-masuk.destroy');

    Route::get('akun-referensi', [AkunReferensiController::class, 'index'])
        ->name('akun-referensi');
    Route::post('akun-referensi', [AkunReferensiController::class, 'store'])
        ->name('akun-referensi.store');
    Route::put('akun-referensi/{akunReferensi}', [AkunReferensiController::class, 'update'])
        ->name('akun-referensi.update');
    Route::delete('akun-referensi/{akunReferensi}', [AkunReferensiController::class, 'destroy'])
        ->name('akun-referensi.destroy');

    Route::get('kartu-material-unit', [KartuMaterialUnitController::class, 'index'])
        ->name('kartu-material-unit');
    Route::get('hpp-per-unit', [HppController::class, 'index'])
        ->name('hpp-per-unit');
    Route::get('neraca', [NeracaController::class, 'index'])
        ->name('neraca.index');
    Route::get('neraca/export', [NeracaController::class, 'export'])->name('neraca.export');
    Route::get('laba-rugi/export', [FinanceController::class, 'exportLabaRugi'])->name('laba-rugi.export');
});

    // Force delete (hapus permanen) akun referensi — hanya Super Admin,
    // untuk mengonfirmasi penghapusan data yang sudah di-soft-delete.
    Route::middleware(['auth', 'role:Super Admin'])->prefix('finance')->name('finance.')->group(function () {
        Route::delete('akun-referensi/{akunReferensi}/force-destroy', [AkunReferensiController::class, 'forceDestroy'])
            ->name('akun-referensi.force-destroy');
        Route::post('akun-referensi/{akunReferensi}/restore', [AkunReferensiController::class, 'restore'])
            ->name('akun-referensi.restore');
    });

    // Halaman stok gudang terpisah (pagination, search, sorting)

// Halaman stok gudang terpisah (pagination, search, sorting)
Route::middleware(['auth', 'check.menu'])->group(function () {
    Route::get('/stok-gudang', [LogGudangController::class, 'stokIndex'])->name('stok.index');
});

Route::middleware(['auth', 'role:Super Admin|Admin|Admin Keuangan', 'check.menu'])
    ->prefix('finance')->name('finance.')->group(function () {
        Route::get('kartu-material-unit', [KartuMaterialUnitController::class, 'index'])
            ->name('kartu-material-unit');
    });

require __DIR__.'/auth.php';