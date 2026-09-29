<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Instansi;
class SuratMasukFactory extends Factory
{
   public function definition(): array
{
    return [

    'nomor_agenda' => 'AGD-'.fake()->unique()->numerify('####'),

    'nomor_surat' =>
        str_pad(fake()->unique()->numberBetween(1,999),3,'0',STR_PAD_LEFT)
        .'/UMITRA/AKD/'
        .date('m')
        .'/'
        .date('Y'),

    'tanggal_surat' => fake()->dateTimeBetween('-6 months','now'),

    'tanggal_terima' => fake()->dateTimeBetween('-6 months','now'),

    'asal_surat' => fake()->company(),

    'jenis_surat' => fake()->randomElement([
        'Surat Tugas',
        'Surat Undangan',
        'Surat Pemberitahuan',
        'Surat Edaran',
        'Surat Permohonan'
    ]),

    'perihal' => fake()->randomElement([
        'PKL',
        'Magang',
        'Kerjasama',
        'Undangan Seminar',
        'Agenda Bulanan',
        'Permohonan Data'
    ]),

    'status' => fake()->randomElement([
        'Baru',
        'Diproses',
        'Selesai'
    ]),

    'user_id' => 1,

];
}
}
