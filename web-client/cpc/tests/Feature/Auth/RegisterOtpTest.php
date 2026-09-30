<?php

namespace Tests\Feature\Auth;

use App\Models\OtpCode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class RegisterOtpTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_is_created_only_after_otp_verification(): void
    {
        Mail::fake();

        $response = $this->post('/register', [
            'name' => 'Jane Doe',
            'username' => 'jane',
            'email' => 'jane@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertSessionHas('status');
        $this->assertDatabaseMissing('users', ['email' => 'jane@example.com']);

        $otpCode = OtpCode::where('email', 'jane@example.com')->latest()->first();
        $this->assertNotNull($otpCode);

        $verifyResponse = $this->post('/register/verify-otp', [
            'otp' => $otpCode->otp,
        ]);

        $verifyResponse->assertRedirectContains('/login');
        $this->assertDatabaseHas('users', ['email' => 'jane@example.com', 'is_active' => false]);
        $this->assertTrue(User::where('email', 'jane@example.com')->first()->hasRole('Pengguna'));
    }
}
