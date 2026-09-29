<?php


namespace App\Mail;
 
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
 
class LaporanMail extends Mailable
{
    use Queueable, SerializesModels;
 
    public array $ringkasan;
    public Carbon $dari;
    public Carbon $sampai;
    public array $lampiran; // array of ['nama' => ..., 'mime' => ..., 'isi' => ...]
 
    public function __construct(array $ringkasan, Carbon $dari, Carbon $sampai, array $lampiran)
    {
        $this->ringkasan = $ringkasan;
        $this->dari      = $dari;
        $this->sampai    = $sampai;
        $this->lampiran  = $lampiran;
    }
 
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Laporan Surat - ' . $this->dari->translatedFormat('d M Y') . ' s/d ' . $this->sampai->translatedFormat('d M Y'),
        );
    }
 
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.laporan',
            with: [
                'ringkasan' => $this->ringkasan,
                'dari'      => $this->dari,
                'sampai'    => $this->sampai,
            ],
        );
    }
 
    public function attachments(): array
    {
        return collect($this->lampiran)->map(function ($file) {
            return Attachment::fromData(fn () => $file['isi'], $file['nama'])
                ->withMime($file['mime']);
        })->all();
    }
}