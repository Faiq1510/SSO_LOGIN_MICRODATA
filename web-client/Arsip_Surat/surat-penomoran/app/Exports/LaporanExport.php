<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Carbon\Carbon;

class LaporanExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return collect($this->data);
    }

    public function headings(): array
    {
        return [
            'No',
            'Nomor Surat',
            'Jenis',
            'Perihal / Keterangan',
            'Tanggal',
            'Status',
        ];
    }

    public function map($surat): array
    {
        static $no = 0;
        $no++;

        return [
            $no,
            $surat['nomor_surat'] ?? '-',
            ucfirst($surat['jenis'] ?? '-'),
            $surat['keterangan'] ?? '-',
            isset($surat['tanggal']) ? Carbon::parse($surat['tanggal'])->translatedFormat('d M Y') : '-',
            ucfirst($surat['status'] ?? '-'),
        ];
    }
}