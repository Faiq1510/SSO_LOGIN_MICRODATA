<?php

namespace Tests\Feature;

use App\Models\Material;
use Database\Seeders\BalancedLogGudangSeeder;
use Database\Seeders\LogGudangSeeder;
use Database\Seeders\MaterialSeeder;
use Database\Seeders\MatrixProgressSeeder;
use Database\Seeders\ProgressUnitSeeder;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\UnitSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BalancedLogGudangSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_does_not_create_negative_stock(): void
    {
        $this->seed([
            RoleSeeder::class,
            UserSeeder::class,
            UnitSeeder::class,
            MaterialSeeder::class,
            RolePermissionSeeder::class,
            MatrixProgressSeeder::class,
            LogGudangSeeder::class,
            BalancedLogGudangSeeder::class,
            ProgressUnitSeeder::class,
        ]);

        $materials = Material::all();

        foreach ($materials as $material) {
            $masuk = (float) $material->logMasuk()->sum('qty');
            $keluar = (float) $material->logKeluar()->sum('qty');
            $sisa = $masuk - $keluar;

            if ($sisa < 0) {
                dump([
                    'material' => $material->nama_material,
                    'masuk' => $masuk,
                    'keluar' => $keluar,
                    'sisa' => $sisa,
                ]);
        }
            $this->assertGreaterThanOrEqual(
                0.0,
                $masuk - $keluar,
                "Material {$material->nama_material} ended with negative stock."
            );
        }
    }
}
