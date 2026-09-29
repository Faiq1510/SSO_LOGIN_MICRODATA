<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class SuratKeluarFactory extends Factory
{
    public function definition(): array
    {
        return [

            'nomor_surat' =>
                str_pad(fake()->unique()->numberBetween(1,999),3,'0',STR_PAD_LEFT)
                .'/PT-MDI/'
                .date('m')
                .'/'
                .date('Y'),

            'tanggal_surat' => fake()->dateTimeBetween('-6 months','now'),

            'jenis_surat' => fake()->randomElement([
                'Surat Tugas',
                'Surat Undangan',
                'Surat Pemberitahuan',
                'Surat Edaran',
                'Surat Permohonan'
            ]),

            'tujuan' => fake()->randomElement([
                'PT PLN',
                'PT Telkom Indonesia',
                'Universitas Mitra Indonesia',
                'Bank Mandiri',
                'Direktur'
            ]),

            'perihal' => fake()->sentence(4),

            'isi_surat' => fake()->paragraph(4),

            'lampiran' => fake()->randomElement([
                '1 Berkas',
                '2 Lembar',
                '3 Dokumen',
                null
            ]),

            'penandatangan' => fake()->name(),

            'jabatan_penandatangan' => fake()->randomElement([
                'Direktur',
                'Manager',
                'Kepala Divisi'
            ]),

            'file_surat' => null,

            'status' => fake()->randomElement([
                'Draft',
                'Dikirim',
                'Selesai'
            ]),

            'user_id' => 1,

            'surat_masuk_id' => null,

        ];
    }
}
