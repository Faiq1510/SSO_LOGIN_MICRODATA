<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckMenuAccess
{
    /**
     * Daftar semua menu yang ada di sidebar beserta route name-nya.
     * Ini harus konsisten dengan definisi menu di Sidebar.jsx.
     */
    public const MENU_ROUTE_MAP = [
        'dashboard'                    => 'dashboard',
        'unit.index'                   => 'unit.index',
        'gudang.index'                 => 'gudang.index',
        'progress.index'               => 'progress.index',
        'standar.index'                => 'standar.index',
        'material.index'               => 'material.index',
        'users.index'                  => 'users.index',
        'finance.kartu-material-unit'  => 'finance.kartu-material-unit',
        'finance.hpp-per-unit'         => 'finance.hpp-per-unit',
        'finance.akun-referensi'       => 'finance.akun-referensi',
        'finance.kas-masuk'            => 'finance.kas-masuk',
        'finance.kas-keluar'           => 'finance.kas-keluar',
        'finance.kas-flow'             => 'finance.kas-flow',
    ];

    /**
     * Periksa apakah user diblokir dari route saat ini berdasarkan menu overrides.
     * Hanya bekerja untuk menu_key yang visible=false (disembunyikan oleh Super Admin).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Super Admin tidak kena blokir
        if ($user->hasRole('Super Admin')) {
            return $next($request);
        }

        // Ambil override milik user ini
        $overrides = $user->menuOverrides->keyBy('menu_key');

        // Cari menu_key yang cocok dengan route saat ini
        $currentRouteName = $request->route()?->getName();

        foreach (self::MENU_ROUTE_MAP as $menuKey => $routeName) {
            if ($currentRouteName === $routeName) {
                // Ada override untuk menu ini?
                if (isset($overrides[$menuKey])) {
                    $override = $overrides[$menuKey];

                    // Jika visible=false → akses diblokir
                    if (!$override->visible) {
                        abort(403, 'Akses menu ini telah dinonaktifkan oleh administrator.');
                    }
                }
                break;
            }
        }

        return $next($request);
    }
}
