<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\JenisSurat;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate([
            'email' => 'test@example.com',
        ], [
            'name' => 'Test User',
            'password' => bcrypt('password'),
        ]);

        $this->seedJenisSurat();
    }

    /**
     * Data awal jenis surat beserta kode surat dan template.
     */
    private function seedJenisSurat(): void
    {
        $data = [
            [
                'nama' => 'Surat Tugas',
                'kode_surat' => 'ST',
                'form_type' => 'umum',
                'template' => null,
            ],
            [
                'nama' => 'Surat Undangan',
                'kode_surat' => 'SU',
                'form_type' => 'umum',
                'template' => null,
            ],
            [
                'nama' => 'Surat Pemberitahuan',
                'kode_surat' => 'SP',
                'form_type' => 'umum',
                'template' => null,
            ],
            [
                'nama' => 'Surat Permohonan',
                'kode_surat' => 'PM',
                'form_type' => 'umum',
                'template' => null,
            ],
            [
                'nama' => 'Surat Kuasa',
                'kode_surat' => 'SK',
                'form_type' => 'kuasa',
                'template' => null,
            ],
        ];

        foreach ($data as $item) {
            JenisSurat::updateOrCreate(
                ['nama' => $item['nama']],
                $item
            );
        }
    }
}

