<?php

namespace App\Services;

use App\Mail\OtpMail;
use App\Models\OtpCode;
use Illuminate\Support\Facades\Mail;

class OtpService
{
    private const EXPIRY_MINUTES = 10;

    /**
     * Generate OTP baru untuk email+purpose tertentu, kirim email, dan
     * hapus OTP lama yang belum terpakai untuk kombinasi yang sama.
     */
    public function generate(string $email, string $purpose, array $payload = []): OtpCode
    {
        OtpCode::where('email', $email)
            ->where('purpose', $purpose)
            ->whereNull('verified_at')
            ->delete();

        $otpCode = OtpCode::create([
            'email' => $email,
            'otp' => str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT),
            'purpose' => $purpose,
            'payload' => $payload,
            'expires_at' => now()->addMinutes(self::EXPIRY_MINUTES),
        ]);

        Mail::to($email)->send(new OtpMail($otpCode->otp, $purpose, self::EXPIRY_MINUTES));

        return $otpCode;
    }

    /**
     * Verifikasi OTP. Return OtpCode kalau valid (dan langsung ditandai
     * verified), atau null kalau salah/expired/tidak ada.
     */
    public function verify(string $email, string $purpose, string $otp): ?OtpCode
    {
        $otpCode = OtpCode::where('email', $email)
            ->where('purpose', $purpose)
            ->where('otp', $otp)
            ->whereNull('verified_at')
            ->latest()
            ->first();

        if (!$otpCode || $otpCode->isExpired()) {
            return null;
        }

        $otpCode->update(['verified_at' => now()]);

        return $otpCode;
    }
}