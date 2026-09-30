<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            ['nama_unit' => 'A01', 'zona' => 'A', 'status' => 'Aktif',     'tukang' => 'Pak Slamet',  'tanggal_mulai' => '2026-01-05'],
            ['nama_unit' => 'A02', 'zona' => 'A', 'status' => 'Aktif',     'tukang' => 'Pak Slamet',  'tanggal_mulai' => '2026-01-10'],
            ['nama_unit' => 'A03', 'zona' => 'A', 'status' => 'Aktif',     'tukang' => 'Pak Slamet',  'tanggal_mulai' => '2026-01-15'],
            ['nama_unit' => 'B01', 'zona' => 'B', 'status' => 'Aktif',     'tukang' => 'Pak Dedi',    'tanggal_mulai' => '2026-02-01'],
            ['nama_unit' => 'B02', 'zona' => 'B', 'status' => 'Aktif',     'tukang' => 'Pak Dedi',    'tanggal_mulai' => '2026-02-05'],
            ['nama_unit' => 'B03', 'zona' => 'B', 'status' => 'Non-aktif', 'tukang' => 'Pak Dedi',    'tanggal_mulai' => null],
            ['nama_unit' => 'C01', 'zona' => 'C', 'status' => 'Aktif',     'tukang' => 'Pak Wawan',   'tanggal_mulai' => '2026-03-01'],
            ['nama_unit' => 'C02', 'zona' => 'C', 'status' => 'Aktif',     'tukang' => 'Pak Wawan',   'tanggal_mulai' => '2026-03-10'],
            ['nama_unit' => 'C03', 'zona' => 'C', 'status' => 'Aktif',     'tukang' => 'Pak Ujang',   'tanggal_mulai' => '2026-03-15'],
            ['nama_unit' => 'D01', 'zona' => 'D', 'status' => 'Aktif',     'tukang' => 'Pak Ujang',   'tanggal_mulai' => '2026-04-01'],
            ['nama_unit' => 'D02', 'zona' => 'D', 'status' => 'Non-aktif', 'tukang' => null,          'tanggal_mulai' => null],
            ['nama_unit' => 'D03', 'zona' => 'D', 'status' => 'Aktif',     'tukang' => 'Pak Ujang',   'tanggal_mulai' => '2026-04-20'],
        ];

        foreach ($units as $u) {
            Unit::updateOrCreate(
                ['nama_unit' => $u['nama_unit']],
                [
                    'zona'          => $u['zona'],
                    'status'        => $u['status'],
                    'tukang'        => $u['tukang'],
                    'tanggal_mulai' => $u['tanggal_mulai'],
                    'keterangan'    => $u['status'] === 'Non-aktif' ? 'Belum mulai konstruksi' : null,
                ]
            );
        }
    }
}