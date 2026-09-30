<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f4f4f5; padding: 24px;">
    <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
        <h2 style="margin-top: 0;">EstateControl</h2>
        <p>
            @if($purpose === 'change_email')
                Kamu meminta perubahan email pada akun EstateControl. Gunakan kode berikut untuk melanjutkan:
            @elseif($purpose === 'forgot_password')
                Kamu meminta reset password akun EstateControl. Gunakan kode berikut untuk melanjutkan:
            @else
                Gunakan kode berikut untuk verifikasi:
            @endif
        </p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 24px 0;">
            {{ $otp }}
        </div>
        <p style="color: #6b7280; font-size: 13px;">
            Kode ini berlaku selama {{ $expiryMinutes }} menit. Jangan bagikan kode ini ke siapa pun, termasuk pihak yang mengaku dari EstateControl.
        </p>
        <p style="color: #6b7280; font-size: 13px;">
            Kalau kamu tidak merasa melakukan permintaan ini, abaikan email ini.
        </p>
    </div>
</body>
</html>