<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\SsoService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SsoController extends Controller
{
    public function redirect(SsoService $sso): RedirectResponse
    {
        abort_unless((bool) env('SSO_ENABLED', false), 404);

        return redirect()->away($sso->authorizationUrl());
    }

    public function callback(Request $request, SsoService $sso): RedirectResponse
    {
        if ($request->filled('error')) {
            return redirect()->route('login')->withErrors([
                'login' => $request->input('error_description', 'Login SSO dibatalkan.'),
            ]);
        }

        try {
            $sso->authenticate(
                (string) $request->query('code'),
                (string) $request->query('state'),
            );

            return redirect()->intended(route('dashboard', absolute: false));
        } catch (\Throwable $exception) {
            report($exception);

            return redirect()->route('login')->withErrors([
                'login' => $exception->getMessage(),
            ]);
        }
    }

    public function logout(Request $request, SsoService $sso): RedirectResponse
    {
        $idToken = $request->session()->pull('sso.id_token');
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->away($sso->logoutUrl($idToken));
    }
}