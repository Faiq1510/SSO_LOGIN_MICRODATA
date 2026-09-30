<?php

namespace Database\Seeders;

use App\Models\LogMasukGudang;
use App\Models\Material;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class LogGudangSeeder extends Seeder
{
    private array $suppliers = [
        'UD Sumber Jaya', 'Toko Bangunan Makmur', 'CV Beton Perkasa',
        'Toko Besi Sentosa', 'UD Material Utama',
    ];

    public function run(): void
    {
        $adminId = User::where('email', 'admin@gmail.com')->value('id')
            ?? User::query()->value('id');

        $start = Carbon::parse('2026-01-01');

        foreach (Material::all() as $material) {
            $hargaAcuan = $material->harga > 0
                ? (float) $material->harga
                : rand(5, 300) * 1000;

            if ($material->harga <= 0) {
                $material->update(['harga' => $hargaAcuan]);
            }

            $jumlahTransaksi = rand(2, 4);
            $tanggal = $start->copy()->addDays(rand(0, 10));

            for ($i = 0; $i < $jumlahTransaksi; $i++) {
                $qty = match ($material->kategori) {
                    'Struktur', 'Dinding', 'Atap' => rand(50, 500),
                    'Finishing', 'Plumbing', 'Listrik' => rand(10, 60),
                    default => rand(5, 40),
                };

                $hargaSatuan = $hargaAcuan * (1 + (rand(-5, 5) / 100));
                $total = $qty * $hargaSatuan;

                LogMasukGudang::create([
                    'tanggal'      => $tanggal->toDateString(),
                    'supplier'     => $this->suppliers[array_rand($this->suppliers)],
                    'material_id'  => $material->id,
                    'qty'          => $qty,
                    'harga_satuan' => round($hargaSatuan, 2),
                    'total_harga'  => round($total, 2),
                    'keterangan'   => 'Restock berkala',
                    'created_by'   => $adminId,
                ]);

                $tanggal = $tanggal->copy()->addDays(rand(7, 20));
            }
        }
    }
}