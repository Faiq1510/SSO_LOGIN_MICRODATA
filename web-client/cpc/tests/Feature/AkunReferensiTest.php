<?php

namespace Tests\Feature;

use App\Models\AkunReferensi;
use App\Models\KasMasuk;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AkunReferensiTest extends TestCase
{
    use RefreshDatabase;

    public function test_deleted_account_is_removed_from_the_visible_list(): void
    {
        $role = Role::create(['name' => 'Admin Keuangan']);
        $user = User::factory()->create();
        $user->assignRole($role);

        $akun = AkunReferensi::create([
            'kode_akun' => '6103',
            'nama_akun' => 'Listrik Proyek',
            'kategori' => 'HPP',
            'jenis' => 'keluar',
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->delete(route('finance.akun-referensi.destroy', ['akunReferensi' => $akun->id]))
            ->assertRedirect();

        $response = $this->actingAs($user)
            ->get(route('finance.akun-referensi'));

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('AkunReferensi/Index')
                ->where('akunList', fn ($akunList) => collect($akunList)->doesntContain(fn ($item) => $item['id'] === $akun->id))
            );
    }

    public function test_child_account_can_be_created_under_parent_account(): void
    {
        $role = Role::create(['name' => 'Admin Keuangan']);
        $user = User::factory()->create();
        $user->assignRole($role);

        $parent = AkunReferensi::create([
            'kode_akun'   => '1000',
            'nama_akun'   => 'Bank',
            'kategori'    => 'HPP',
            'jenis'       => 'masuk',
            'tipe_akun'   => 'induk',
            'tipe_neraca' => 'modal',
            'created_by'  => $user->id,
        ]);

        $this->actingAs($user)
            ->post(route('finance.akun-referensi.store'), [
                'kode_akun'   => '1001',
                'nama_akun'   => 'Bank BCA',
                'kategori'    => 'HPP',
                'tipe_akun'   => 'sub',
                'tipe_neraca' => 'modal',
                'parent_id'   => $parent->id,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('akun_referensis', [
            'nama_akun' => 'Bank BCA',
            'parent_id' => $parent->id,
        ]);
    }

    public function test_account_cannot_be_deleted_when_used_in_kas_transactions(): void
    {
        $role = Role::create(['name' => 'Admin Keuangan']);
        $user = User::factory()->create();
        $user->assignRole($role);

        $akun = AkunReferensi::create([
            'kode_akun' => '6103',
            'nama_akun' => 'Listrik Proyek',
            'kategori' => 'HPP',
            'jenis' => 'keluar',
            'created_by' => $user->id,
        ]);

        // create a kas_masuk record to mark the account as used
        KasMasuk::create([
            'tanggal' => now()->toDateString(),
            'akun_referensi_id' => $akun->id,
            'keterangan' => 'Test kas masuk',
            'nominal' => 100000,
            'dari' => 'Owner',
            'untuk' => 'Kas Proyek SiteFlow',
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->delete(route('finance.akun-referensi.destroy', ['akunReferensi' => $akun->id]))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('akun_referensis', ['id' => $akun->id, 'deleted_at' => null]);
    }
}
