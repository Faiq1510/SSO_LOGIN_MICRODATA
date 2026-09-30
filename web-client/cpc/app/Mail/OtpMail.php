<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $otp,
        public string $purpose,
        public int $expiryMinutes,
    ) {}

    public function build()
    {
        $subject = match ($this->purpose) {
            'change_email' => 'Kode Verifikasi Ubah Email - EstateControl',
            'forgot_password' => 'Kode Reset Password - EstateControl',
            default => 'Kode Verifikasi - EstateControl',
        };

        return $this->subject($subject)
            ->view('emails.otp')
            ->with([
                'otp' => $this->otp,
                'purpose' => $this->purpose,
                'expiryMinutes' => $this->expiryMinutes,
            ]);
    }
}