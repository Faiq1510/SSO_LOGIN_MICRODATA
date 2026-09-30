<?php

namespace Tests\Feature;

use App\Models\AkunReferensi;
use App\Models\KasKeluar;
use App\Models\KasMasuk;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FinanceTransactionTest extends TestCase
{
    use RefreshDatabase;

    public function test_kas_masuk_can_be_created_with_the_frontend_payload(): void
    {
        $role = Role::create(['name' => 'Admin Keuangan']);
        $user = User::factory()->create();
        $user->assignRole($role);

        $akun = AkunReferensi::create([
            'kode_akun' => '1001',
            'nama_akun' => 'Kas Proyek',
            'kategori' => 'Kas',
            'jenis' => 'masuk',
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->post(route('finance.kas-masuk.store'), [
                'tanggal' => '2026-07-22',
                'akun_id' => $akun->id,
                'nominal' => '120000',
                'keterangan' => 'Uang muka',
                'dari' => 'Developer',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas(KasMasuk::class, [
            'akun_referensi_id' => $akun->id,
            'nominal' => '120000.00',
            'dari' => 'Developer',
        ]);
    }

    public function test_kas_keluar_can_be_created_with_the_frontend_payload(): void
    {
        $role = Role::create(['name' => 'Admin Keuangan']);
        $user = User::factory()->create();
        $user->assignRole($role);

        $akun = AkunReferensi::create([
            'kode_akun' => '5001',
            'nama_akun' => 'Belanja Material',
            'kategori' => 'HPP',
            'jenis' => 'keluar',
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->post(route('finance.kas-keluar.store'), [
                'tanggal'          => '2026-07-22',
                'akun_referensi_id' => $akun->id,
                'unit'             => 'A1',
                'nominal_per_unit' => '75000',
                'penerima'         => 'SPJ-001',
                'metode_bayar'     => 'tunai',
                'keterangan'       => 'Pembelian',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas(KasKeluar::class, [
            'akun_referensi_id' => $akun->id,
            'unit'              => 'A1',
            'penerima'          => 'SPJ-001',
            'total'             => '75000.00',
        ]);
    }
}
