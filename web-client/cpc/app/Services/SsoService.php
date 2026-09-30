<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class SsoService
{
    public function authorizationUrl(): string
    {
        $state = $this->randomString(32);
        $verifier = $this->randomString(64);
        $challenge = $this->base64Url(hash('sha256', $verifier, true));

        session([
            'sso.state' => $state,
            'sso.code_verifier' => $verifier,
        ]);

        return rtrim($this->issuer(), '/').'/oidc/auth?'.http_build_query([
            'client_id' => $this->clientId(),
            'redirect_uri' => $this->redirectUri(),
            'response_type' => 'code',
            'scope' => 'openid profile',
            'state' => $state,
            'code_challenge' => $challenge,
            'code_challenge_method' => 'S256',
        ]);
    }

    public function authenticate(string $code, string $state): User
    {
        $expectedState = session('sso.state');
        $verifier = session('sso.code_verifier');

        if (!$expectedState || !$verifier || !hash_equals($expectedState, $state)) {
            throw new RuntimeException('State SSO tidak valid atau sudah kedaluwarsa.');
        }

        $response = Http::asForm()
            ->withBasicAuth($this->clientId(), $this->clientSecret())
            ->post(rtrim($this->issuer(), '/').'/oidc/token', [
                'grant_type' => 'authorization_code',
                'code' => $code,
                'redirect_uri' => $this->redirectUri(),
                'code_verifier' => $verifier,
            ]);

        if ($response->failed()) {
            throw new RuntimeException($response->json('error_description') ?: 'Token SSO gagal ditukar.');
        }

        $idToken = $response->json('id_token');
        if (!is_string($idToken)) {
            throw new RuntimeException('ID token SSO tidak ditemukan.');
        }

        $claims = $this->verifyIdToken($idToken);
        $email = Str::lower((string) ($claims['email'] ?? ''));

        if ($email === '' && is_string($response->json('access_token'))) {
            $userInfo = Http::withToken($response->json('access_token'))
                ->withHeaders(['ngrok-skip-browser-warning' => 'true'])
                ->get(rtrim($this->issuer(), '/').'/oidc/me')
                ->json();

            if (is_array($userInfo)) {
                $claims = array_merge($claims, $userInfo);
                $email = Str::lower((string) ($claims['email'] ?? ''));
            }
        }

        if ($email === '') {
            throw new RuntimeException('Email tidak ditemukan dalam token SSO.');
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            $user = User::create([
                'name' => $claims['name'] ?? Str::before($email, '@'),
                'username' => $this->uniqueUsername($claims['name'] ?? Str::before($email, '@')),
                'email' => $email,
                'password' => Str::random(64),
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
            $user->assignRole('Pengguna');
        }

        if (!$user->is_active) {
            throw new RuntimeException('Akun CPC belum diaktifkan administrator.');
        }

        session()->forget(['sso.state', 'sso.code_verifier']);
        session(['sso.id_token' => $idToken]);
        Auth::login($user);
        request()->session()->regenerate();

        $user->forceFill(['last_login_at' => now()])->save();

        return $user;
    }

    public function logoutUrl(?string $idToken): string
    {
        return rtrim($this->issuer(), '/').'/oidc/session/end?'.http_build_query(array_filter([
            'client_id' => $this->clientId(),
            'id_token_hint' => $idToken,
            'post_logout_redirect_uri' => env('SSO_POST_LOGOUT_REDIRECT_URI'),
        ]));
    }

    private function verifyIdToken(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new RuntimeException('Format ID token SSO tidak valid.');
        }

        $header = json_decode($this->base64UrlDecode($parts[0]), true);
        $claims = json_decode($this->base64UrlDecode($parts[1]), true);
        $signature = $this->base64UrlDecode($parts[2]);

        if (!is_array($header) || !is_array($claims) || ($header['alg'] ?? null) !== 'RS256') {
            throw new RuntimeException('Algoritma ID token SSO tidak didukung.');
        }

        $jwks = Http::withHeaders([
            'ngrok-skip-browser-warning' => 'true',
        ])->get(rtrim($this->issuer(), '/').'/oidc/jwks')->json('keys', []);
        $jwk = collect($jwks)->firstWhere('kid', $header['kid'] ?? null);
        if (!is_array($jwk) || empty($jwk['n']) || empty($jwk['e'])) {
            throw new RuntimeException('Kunci publik SSO tidak ditemukan.');
        }

        $verified = openssl_verify(
            $parts[0].'.'.$parts[1],
            $signature,
            $this->jwkToPem($jwk['n'], $jwk['e']),
            OPENSSL_ALGO_SHA256,
        );

        if ($verified !== 1) {
            throw new RuntimeException('Signature ID token SSO tidak valid.');
        }

        if (($claims['iss'] ?? null) !== $this->issuer()
            || !in_array($this->clientId(), (array) ($claims['aud'] ?? []), true)
            || (($claims['exp'] ?? 0) < time())) {
            throw new RuntimeException('Claim ID token SSO tidak valid atau sudah kedaluwarsa.');
        }

        return $claims;
    }

    private function jwkToPem(string $modulus, string $exponent): string
    {
        $rsa = $this->derInteger($this->base64UrlDecode($modulus))
            .$this->derInteger($this->base64UrlDecode($exponent));
        $rsa = "\x30".$this->derLength(strlen($rsa)).$rsa;
        $algorithm = hex2bin('300d06092a864886f70d0101010500');
        $bitString = "\x03".$this->derLength(strlen("\x00".$rsa))."\x00".$rsa;
        $der = "\x30".$this->derLength(strlen($algorithm.$bitString)).$algorithm.$bitString;

        return "-----BEGIN PUBLIC KEY-----\n".chunk_split(base64_encode($der), 64, "\n")."-----END PUBLIC KEY-----\n";
    }

    private function derInteger(string $value): string
    {
        $value = ltrim($value, "\x00");
        if ($value !== '' && (ord($value[0]) & 0x80)) {
            $value = "\x00".$value;
        }

        return "\x02".$this->derLength(strlen($value)).$value;
    }

    private function derLength(int $length): string
    {
        if ($length < 128) {
            return chr($length);
        }

        $result = '';
        while ($length > 0) {
            $result = chr($length & 0xff).$result;
            $length >>= 8;
        }

        return chr(0x80 | strlen($result)).$result;
    }

    private function uniqueUsername(string $name): string
    {
        $base = Str::slug($name) ?: 'sso-user';
        $username = $base;
        $counter = 1;

        while (User::where('username', $username)->exists()) {
            $username = $base.$counter++;
        }

        return $username;
    }

    private function issuer(): string
    {
        return rtrim((string) env('SSO_ISSUER'), '/');
    }

    private function clientId(): string
    {
        return (string) env('SSO_CLIENT_ID');
    }

    private function clientSecret(): string
    {
        return (string) env('SSO_CLIENT_SECRET');
    }

    private function redirectUri(): string
    {
        return (string) env('SSO_REDIRECT_URI');
    }

    private function randomString(int $bytes): string
    {
        return $this->base64Url(random_bytes($bytes));
    }

    private function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        $padding = (4 - strlen($value) % 4) % 4;

        return base64_decode(
            strtr($value, '-_', '+/').str_repeat('=', $padding),
            true,
        ) ?: '';
    }
}