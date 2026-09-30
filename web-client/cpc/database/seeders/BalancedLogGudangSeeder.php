<?php

namespace Database\Seeders;

use App\Models\LogMasukGudang;
use App\Models\Material;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class BalancedLogGudangSeeder extends Seeder
{
    private array $suppliers = [
        'UD Sumber Jaya',
        'Toko Bangunan Makmur',
        'CV Beton Perkasa',
        'Toko Besi Sentosa',
        'UD Material Utama',
    ];

    public function run(): void
    {
        $adminId = User::where('email', 'admin@gmail.com')->value('id')
            ?? User::query()->value('id');

        $start = Carbon::parse('2026-01-01');

        foreach (Material::all() as $material) {
            $targetStock = match ($material->nama_material) {
                'Bata Bolong' => 25000,
                default => match ($material->kategori) {
                    'Struktur', 'Dinding', 'Atap' => 8000,
                    'Finishing', 'Plumbing', 'Listrik' => 3000,
                    default => 1200,
                },
            };

            $remaining = $targetStock;
            $tanggal = $start->copy()->addDays(rand(0, 3));

            while ($remaining > 0) {
                $batch = min($remaining, match ($material->kategori) {
                    'Struktur', 'Dinding', 'Atap' => rand(1200, 2500),
                    'Finishing', 'Plumbing', 'Listrik' => rand(500, 1200),
                    default => rand(200, 700),
                });

                LogMasukGudang::create([
                    'tanggal'      => $tanggal->toDateString(),
                    'supplier'     => $this->suppliers[array_rand($this->suppliers)],
                    'material_id'  => $material->id,
                    'qty'          => $batch,
                    'harga_satuan' => max(1000, (float) ($material->harga > 0 ? $material->harga : 150000)),
                    'total_harga'  => round($batch * max(1000, (float) ($material->harga > 0 ? $material->harga : 150000)), 2),
                    'keterangan'   => '',
                    'created_by'   => $adminId,
                ]);

                $remaining -= $batch;
                $tanggal = $tanggal->copy()->addDays(rand(2, 6));
            }
        }
    }
}
