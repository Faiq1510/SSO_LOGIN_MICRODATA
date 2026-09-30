<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class OtpPasswordResetController extends Controller
{
    public function send(Request $request, OtpService $otpService): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $email = $request->input('email');
        $user = User::where('email', $email)->first();

        if ($user) {
            $otpService->generate($email, 'forgot_password', [
                'user_id' => $user->id,
            ]);
        }

        return back()->with('status', 'Kode OTP telah dikirim ke email Anda jika terdaftar.');
    }

    public function reset(Request $request, OtpService $otpService): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'otp' => ['required', 'digits:6'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = User::where('email', $validated['email'])->first();
        $otpCode = $user
            ? $otpService->verify($user->email, 'forgot_password', $validated['otp'])
            : null;

        if (!$user || !$otpCode) {
            throw ValidationException::withMessages([
                'otp' => ['Kode OTP salah atau sudah kedaluwarsa.'],
            ]);
        }

        $user->password = Hash::make($validated['password']);
        $user->save();

        return Redirect::route('login')->with('status', 'Password berhasil direset. Silakan login kembali.');
    }
}
