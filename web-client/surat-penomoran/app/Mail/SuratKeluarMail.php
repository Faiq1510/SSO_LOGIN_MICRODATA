<?php
namespace App\Mail;
 
use App\Models\SuratKeluar;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;
 
class SuratKeluarMail extends Mailable
{
    use Queueable, SerializesModels;
 
    public SuratKeluar $surat;
    public array $lampiran; // ['nama' => ..., 'mime' => ..., 'isi' => ...]
 
    public function __construct(SuratKeluar $surat, array $lampiran)
    {
        $this->surat    = $surat;
        $this->lampiran = $lampiran;
    }
 
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Surat Keluar - ' . $this->surat->nomor_surat . ' - ' . $this->surat->perihal,
        );
    }
 
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.surat-keluar',
            with: [
                'surat' => $this->surat,
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