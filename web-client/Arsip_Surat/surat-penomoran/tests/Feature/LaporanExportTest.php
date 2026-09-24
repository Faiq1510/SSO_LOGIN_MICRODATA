<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\SuratKeluar;
use App\Models\SuratMasuk;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LaporanExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_laporan_pdf_export_can_be_downloaded(): void
    {
        $user = User::factory()->create();

        SuratKeluar::create([
            'nomor_surat'   => '001/SK/2026',
            'tanggal_surat' => now()->format('Y-m-d'),
            'jenis_surat'   => 'Surat Keluar',
            'kode_divisi'   => 'UM',
            'tujuan'        => 'Dinas Pendidikan',
            'perihal'       => 'Undangan Rapat',
            'isi_surat'     => 'Isi undangan rapat',
            'status'        => 'Selesai',
            'user_id'       => $user->id,
        ]);

        $response = $this->actingAs($user)->get(route('laporan.export.pdf', [
            'dari'   => now()->startOfMonth()->format('Y-m-d'),
            'sampai' => now()->endOfMonth()->format('Y-m-d'),
            'jenis'  => 'Surat Keluar',
            'status' => 'Selesai',
        ]));

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_laporan_excel_export_can_be_downloaded(): void
    {
        $user = User::factory()->create();

        SuratKeluar::create([
            'nomor_surat'   => '002/SK/2026',
            'tanggal_surat' => now()->format('Y-m-d'),
            'jenis_surat'   => 'Surat Keluar',
            'kode_divisi'   => 'UM',
            'tujuan'        => 'Dinas Kesehatan',
            'perihal'       => 'Pemberitahuan',
            'isi_surat'     => 'Isi surat pemberitahuan',
            'status'        => 'Dikirim',
            'user_id'       => $user->id,
        ]);

        $response = $this->actingAs($user)->get(route('laporan.export.excel', [
            'dari'   => now()->startOfMonth()->format('Y-m-d'),
            'sampai' => now()->endOfMonth()->format('Y-m-d'),
            'jenis'  => 'Surat Keluar',
            'status' => 'Dikirim',
        ]));

        $response->assertStatus(200);
        $this->assertTrue(
            str_contains($response->headers->get('content-type') ?? '', 'spreadsheet') ||
            str_contains($response->headers->get('content-type') ?? '', 'octet-stream') ||
            str_contains($response->headers->get('content-disposition') ?? '', '.xlsx')
        );
    }
}
