<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request, OtpService $otpService): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => ['nullable', 'string', 'max:50', 'unique:'.User::class.',username'],
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $username = $request->input('username');

        if (blank($username)) {
            $baseUsername = Str::slug($request->name ?: Str::before($request->email, '@')) ?: 'user';
            $username = $baseUsername;
            $counter = 1;

            while (User::where('username', $username)->exists()) {
                $username = $baseUsername.$counter;
                $counter++;
            }
        }

        $request->session()->put('register.pending', [
            'name' => $request->name,
            'username' => $username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $otpService->generate($request->email, 'register', [
            'email' => $request->email,
        ]);

        return back()->with(
            'status',
            'Kode OTP telah dikirim ke email Anda. Silakan cek inbox atau folder spam.'
        );
    }

    public function showOtpVerification(Request $request): Response
    {
        $pending = $request->session()->get('register.pending');

        if (!$pending) {
            return redirect()->route('register');
        }

        return Inertia::render('Auth/RegisterOtpVerify', [
            'email' => $pending['email'],
        ]);
    }

    public function verifyOtp(Request $request, OtpService $otpService): RedirectResponse
    {
        $pending = $request->session()->get('register.pending');

        if (!$pending) {
            return redirect()->route('register')->withErrors([
                'otp' => 'Sesi pendaftaran telah kadaluwarsa. Silakan ulangi proses pendaftaran.',
            ]);
        }

        $request->validate([
            'otp' => ['required', 'digits:6'],
        ]);

        $otpCode = $otpService->verify($pending['email'], 'register', $request->input('otp'));

        if (!$otpCode) {
            return back()->withErrors([
                'otp' => 'Kode OTP salah atau sudah kedaluwarsa.',
            ]);
        }

        $user = User::create([
            'name' => $pending['name'],
            'username' => $pending['username'],
            'email' => $pending['email'],
            'password' => $pending['password'],
            'is_active' => false,
        ]);

        $user->assignRole('Pengguna');
        $request->session()->forget('register.pending');

        event(new Registered($user));

        return redirect()->route('login')->with(
            'info',
            'Registrasi berhasil! Akun Anda akan diaktifkan oleh administrator sebelum bisa digunakan.'
        );
    }

    public function resendOtp(Request $request, OtpService $otpService): RedirectResponse
    {
        $pending = $request->session()->get('register.pending');

        if (!$pending) {
            return redirect()->route('register');
        }

        $otpService->generate($pending['email'], 'register', [
            'email' => $pending['email'],
        ]);

        return back()->with('status', 'Kode OTP telah dikirim ulang ke email Anda.');
    }
}
