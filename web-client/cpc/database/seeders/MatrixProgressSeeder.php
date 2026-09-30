<?php

namespace Database\Seeders;

use App\Models\Material;
use App\Models\MatrixProgress;
use Illuminate\Database\Seeder;

class MatrixProgressSeeder extends Seeder
{
    // kode_material => qty_standar kumulatif di tahap tsb
    private array $stageMaterials = [
        'Persiapan + Galian' => [
            'MT052' => 5,   // Urugan Tanah
        ],
        'Pondasi' => [
            'MT051' => 8,   // Batu Kali
            'MT001' => 15,  // Semen
            'MT006' => 20,  // Besi 6
        ],
        'Sloof' => [
            'MT001' => 10,
            'MT002' => 3,   // Pasir Pasang
            'MT007' => 25,  // Besi 8
        ],
        'Kolom + Ring Balok' => [
            'MT001' => 12,
            'MT003' => 3,   // Pasir Cor
            'MT005' => 2,   // Split
            'MT007' => 30,
        ],
        'Bata Tahap 1' => [
            'MT004' => 800, // Bata Bolong
            'MT001' => 8,
            'MT002' => 2,
        ],
        'Bata Tahap 2' => [
            'MT004' => 900,
            'MT001' => 9,
            'MT002' => 2,
        ],
        'Struktur Atas + Atap' => [
            'MT010' => 40,  // Kayu Kaso
            'MT011' => 15,  // Kayu Balok
            'MT001' => 6,
        ],
        'Kuda-kuda + Penutup Atap' => [
            'MT012' => 300, // Genteng
            'MT013' => 20,  // Nok Genteng
            'MT010' => 20,
        ],
        'Plesteran' => [
            'MT001' => 20,
            'MT002' => 4,
        ],
        'Acian' => [
            'MT016' => 15,  // Semen Putih
        ],
        'Keramik + Plumbing' => [
            'MT014' => 40,  // Keramik Lantai
            'MT021' => 15,  // Pipa PVC 1/2"
            'MT026' => 4,   // Kran Air
        ],
        'Pengecatan + Instalasi' => [
            'MT017' => 10,  // Cat Tembok
            'MT018' => 5,   // Cat Dasar
            'MT030' => 6,   // Kabel NYM
            'MT032' => 15,  // Stop Kontak
        ],
        'Finishing' => [
            'MT037' => 6,   // Engsel Pintu
            'MT040' => 3,   // Pintu Panel
            'MT041' => 4,   // Jendela Aluminium
        ],
    ];

    // Material yang lebih sensitif terhadap overuse (default lain: 1.10 / 1.30)
    private array $customThreshold = [
        'MT001' => ['warning' => 1.10, 'boros' => 1.30], // Semen
        'MT004' => ['warning' => 1.10, 'boros' => 1.30], // Bata Bolong
    ];

    public function run(): void
    {
        foreach ($this->stageMaterials as $tahap => $materials) {
            $matrix = MatrixProgress::firstOrCreate(['tahap_pekerjaan' => $tahap]);

            foreach ($materials as $kode => $qty) {
                $material = Material::where('kode_material', $kode)->first();
                if (! $material) {
                    continue;
                }

                $threshold = $this->customThreshold[$kode] ?? ['warning' => 1.10, 'boros' => 1.30];

                $matrix->details()->updateOrCreate(
                    ['material_id' => $material->id],
                    [
                        'qty_standar'   => $qty,
                        'batas_warning' => $threshold['warning'],
                        'batas_boros'   => $threshold['boros'],
                    ]
                );
            }
        }
    }
}