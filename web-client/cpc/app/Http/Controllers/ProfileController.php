<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\OtpCode;
use App\Services\OtpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

/**
 * @OA\Tag(
 *     name="User - Profile",
 *     description="Aksi profil pengguna dan OTP untuk email/password"
 * )
 */
class ProfileController extends Controller
{
    /**
     * @OA\Get(
     *     path="/profile",
     *     tags={"User - Profile"},
     *     summary="Lihat profil pengguna",
     *     security={{"sanctum": {}}},
     *     @OA\Response(response=200, description="Halaman profil pengguna")
     * )
     */
    public function index(Request $request): Response
    {
        $user = $request->user()->load('roles');

        return Inertia::render('Profile/Index', [
            'user' => [
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->roles->first()?->name ?? '-',
                'is_active' => $user->is_active,
                'last_login' => $user->last_login_at,
                'permissions' => $user
                    ->getAllPermissions()
                    ->pluck('name')
                    ->values(),
            ],
        ]);
    }

    /**
     * Update Profile (nama & username saja — email diubah lewat flow OTP terpisah)
     */
    /**
     * @OA\Patch(
     *     path="/profile",
     *     tags={"User - Profile"},
     *     summary="Update profil pengguna",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
     *     @OA\Response(response=302, description="Redirect setelah profil diperbarui")
     * )
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validated();
        // Email sengaja diabaikan di sini, walau dikirim dari client.
        // Perubahan email HANYA boleh lewat sendEmailOtp() + verifyEmailOtp().
        unset($validated['email']);

        $user->fill($validated);
        $user->save();

        return Redirect::route('profile')->with('success', 'Profil berhasil diperbarui.');
    }

    /**
     * Step 1: kirim OTP ke email baru
     */
     public function sendEmailOtp(Request $request, OtpService $otpService): RedirectResponse
    {
        $user = $request->user();

        $otpService->generate($user->email, 'change_email_old', [
            'user_id' => $user->id,
        ]);

        return back()->with('success', 'Kode OTP telah dikirim ke ' . $user->email);
    }


    /**
     * Step 2: verifikasi OTP, baru email di-update
     */
    public function verifyOldEmailOtp(Request $request, OtpService $otpService): RedirectResponse
    {
        $request->validate([
            'otp' => ['required', 'digits:6'],
        ]);

        $user = $request->user();

        $otpCode = $otpService->verify($user->email, 'change_email_old', $request->input('otp'));

        if (!$otpCode || (int) ($otpCode->payload['user_id'] ?? 0) !== $user->id) {
            return back()->withErrors(['otp' => 'Kode OTP salah atau sudah kedaluwarsa.']);
        }

        return back()->with('oldEmailVerified', true);
    }

public function sendNewEmailOtp(Request $request, OtpService $otpService): RedirectResponse
    {
        $request->validate([
            'new_email' => ['required', 'email', 'max:150', 'unique:users,email'],
        ]);

        $user = $request->user();
        $newEmail = $request->input('new_email');

        if ($newEmail === $user->email) {
            return back()->withErrors(['new_email' => 'Email baru harus berbeda dari email saat ini.']);
        }

        $recentlyVerified = \App\Models\OtpCode::where('email', $user->email)
            ->where('purpose', 'change_email_old')
            ->whereNotNull('verified_at')
            ->where('verified_at', '>=', now()->subMinutes(15))
            ->exists();

        if (!$recentlyVerified) {
            return back()->withErrors(['new_email' => 'Verifikasi email lama sudah kedaluwarsa, silakan ulangi dari awal.']);
        }

        $otpService->generate($newEmail, 'change_email_new', [
            'user_id' => $user->id,
        ]);

        return back()->with('success', 'Kode OTP telah dikirim ke ' . $newEmail);
    }

    public function verifyNewEmailOtp(Request $request, OtpService $otpService): RedirectResponse
    {
        $request->validate([
            'new_email' => ['required', 'email'],
            'otp' => ['required', 'digits:6'],
        ]);

        $user = $request->user();
        $newEmail = $request->input('new_email');

        $otpCode = $otpService->verify($newEmail, 'change_email_new', $request->input('otp'));

        if (!$otpCode || (int) ($otpCode->payload['user_id'] ?? 0) !== $user->id) {
            return back()->withErrors(['otp' => 'Kode OTP salah atau sudah kedaluwarsa.']);
        }

        $user->email = $newEmail;
        $user->email_verified_at = now();
        $user->save();

        return Redirect::route('profile')->with('success', 'Email berhasil diperbarui.');
    }

    public function sendPasswordOtp(Request $request, OtpService $otpService): RedirectResponse
    {
        $user = $request->user();

        $otpService->generate($user->email, 'forgot_password', [
            'user_id' => $user->id,
        ]);

        return back()->with('success', 'Kode OTP telah dikirim ke ' . $user->email);
    }

    public function verifyPasswordOtp(Request $request, OtpService $otpService): RedirectResponse
    {
        $request->validate([
            'otp' => ['required', 'digits:6'],
        ]);

        $user = $request->user();
        $otpCode = $otpService->verify($user->email, 'forgot_password', $request->input('otp'));

        if (!$otpCode || (int) ($otpCode->payload['user_id'] ?? 0) !== $user->id) {
            return back()->withErrors(['otp' => 'Kode OTP salah atau sudah kedaluwarsa.']);
        }

        return back()->with('passwordOtpVerified', true);
    }

    public function resetPasswordWithOtp(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = $request->user();
        $otpCode = OtpCode::where('email', $user->email)
            ->where('purpose', 'forgot_password')
            ->whereNotNull('verified_at')
            ->latest()
            ->first();

        if (!$otpCode) {
            return back()->withErrors(['otp' => 'Harap verifikasi OTP terlebih dahulu sebelum mengganti password.']);
        }

        $user->password = Hash::make($request->input('password'));
        $user->save();

        return Redirect::route('profile')->with('success', 'Password berhasil diperbarui.');
    }

    /**
     * Hapus akun
     */
    /**
     * @OA\Delete(
     *     path="/profile",
     *     tags={"User - Profile"},
     *     summary="Hapus akun pengguna",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
     *     @OA\Response(response=302, description="Redirect setelah akun dihapus")
     * )
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}