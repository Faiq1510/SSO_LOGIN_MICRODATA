<?php

namespace Database\Seeders;

use App\Models\AkunReferensi;
use Illuminate\Database\Seeder;

class AkunReferensiSeeder extends Seeder
{
    public function run(): void
    {

        $data = [
        ['kode_akun' => '001', 'nama_akun' => 'Termin 1', 'tipe_neraca' => 'pendapatan', 'kategori' => 'HPP'],
        ['kode_akun' => '002', 'nama_akun' => 'Termin 2', 'tipe_neraca' => 'pendapatan', 'kategori' => 'HPP'],
        ['kode_akun' => '003', 'nama_akun' => 'Penjualan Unit', 'tipe_neraca' => 'pendapatan', 'kategori' => 'HPP'],
        ['kode_akun' => '101', 'nama_akun' => 'Upah Tukang Harian', 'tipe_neraca' => 'beban', 'kategori' => 'OPEX'],
        ['kode_akun' => '102', 'nama_akun' => 'Transportasi & BBM', 'tipe_neraca' => 'beban', 'kategori' => 'OPEX'],
        ['kode_akun' => '103', 'nama_akun' => 'Biaya Administrasi', 'tipe_neraca' => 'beban', 'kategori' => 'OPEX'],
            [
                'kode_akun'   => '104',
                'nama_akun'   => 'Pembelian Material',
                'kategori'    => 'OPEX',
                'tipe_neraca' => 'pembelian_aset',
                'tipe_akun'   => 'induk',
            ],
        ];

        foreach ($data as $item) {
            AkunReferensi::updateOrCreate(
                ['kode_akun' => $item['kode_akun']],
                $item
            );
        }
    }
}