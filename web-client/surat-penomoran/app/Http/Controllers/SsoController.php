<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SsoController extends Controller
{
    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function decodeJwtPayload(string $jwt): array
    {
        $parts = explode('.', $jwt);
        $payload = strtr($parts[1], '-_', '+/');
        $payload = str_pad($payload, strlen($payload) % 4 === 0 ? strlen($payload) : strlen($payload) + 4 - strlen($payload) % 4, '=');
        return json_decode(base64_decode($payload), true);
    }

    // Langkah 1: redirect ke IdP (menggantikan halaman login lokal)
    public function redirect(Request $request)
    {
        $verifier = $this->base64UrlEncode(random_bytes(32));
        $challenge = $this->base64UrlEncode(hash('sha256', $verifier, true));
        $state = $this->base64UrlEncode(random_bytes(8));

        session([
            'sso_code_verifier' => $verifier,
            'sso_state' => $state,
        ]);

        $query = http_build_query([
            'client_id' => config('services.sso.client_id'),
            'redirect_uri' => config('services.sso.redirect_uri'),
            'response_type' => 'code',
            'scope' => 'openid profile',
            'state' => $state,
            'code_challenge' => $challenge,
            'code_challenge_method' => 'S256',
        ]);

        return redirect(config('services.sso.issuer') . '/oidc/auth?' . $query);
    }

    // Langkah 2: terima code, tukar jadi token, buat/cocokkan user lokal
    public function callback(Request $request)
    {
        if ($request->query('state') !== session('sso_state')) {
            abort(400, 'State tidak cocok.');
        }

        $response = Http::asForm()
            ->withBasicAuth(config('services.sso.client_id'), config('services.sso.client_secret'))
            ->post(config('services.sso.internal_url') . '/oidc/token', [
                'grant_type' => 'authorization_code',
                'code' => $request->query('code'),
                'redirect_uri' => config('services.sso.redirect_uri'),
                'code_verifier' => session('sso_code_verifier'),
            ]);

        if ($response->failed()) {
            abort(400, 'Gagal menukar token: ' . $response->body());
        }

        $tokenData = $response->json();
        $claims = $this->decodeJwtPayload($tokenData['id_token']);

        session(['sso_id_token' => $tokenData['id_token']]);

        $email = $claims['email'] ?? ($claims['sub'] . '@microdata.id');
        $name = $claims['name'] ?? $claims['sub'];

        // JIT provisioning: cocokkan lewat email, buat baru kalau belum ada
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => bcrypt(Str::random(32)), // tidak pernah dipakai untuk login
                'role' => 'Viewer',
                'status' => 'Aktif',
            ],
        );

        Auth::login($user);

        return redirect()->intended('/dashboard');
    }

    public function logout(Request $request)
    {
        $idToken = session('sso_id_token');
        Auth::logout();
        $request->session()->invalidate();

        if (!$idToken) {
            return redirect('/login');
        }

        $query = http_build_query([
            'id_token_hint' => $idToken,
            'post_logout_redirect_uri' => config('services.sso.post_logout_redirect_uri'),
        ]);

        return redirect(config('services.sso.issuer') . '/oidc/session/end?' . $query);
    }
}