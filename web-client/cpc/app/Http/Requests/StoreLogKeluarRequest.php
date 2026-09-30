<?php

namespace App\Http\Requests;

use App\Services\StokGudangService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreLogKeluarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tanggal'      => ['required', 'date'],
            'unit_ids'     => ['required', 'array', 'min:1'],
            'unit_ids.*'   => ['required', 'exists:units,id', 'distinct'],
            'material_id'  => ['required', 'exists:materials,id'],
            'qty'          => ['required', 'numeric', 'min:0.01'], // total barang (semua unit)
            'harga'        => ['required', 'numeric', 'min:0'],
            'keterangan'   => ['nullable', 'string'],
            'satuan'       => ['nullable', 'string', 'max:20'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $materialId = $this->input('material_id');
            $qtyTotal   = (float) $this->input('qty');
            $unitIds    = (array) $this->input('unit_ids', []);
            $jumlahUnit = count($unitIds);

            if (! $materialId || $qtyTotal <= 0 || $jumlahUnit === 0) {
                return;
            }

            // Wajib habis dibagi rata ke semua unit yang dipilih.
            $sisaBagi = fmod($qtyTotal, $jumlahUnit);
            if (abs($sisaBagi) > 0.0001 && abs($sisaBagi - $jumlahUnit) > 0.0001) {
                $qtyPerUnit = $qtyTotal / $jumlahUnit;
                $validator->errors()->add(
                    'qty',
                    "Total {$qtyTotal} tidak bisa dibagi rata ke {$jumlahUnit} unit (hasil: " . round($qtyPerUnit, 4) . " per unit). Sesuaikan total atau jumlah unit."
                );
                return;
            }

            $stokService  = app(StokGudangService::class);
            $stokTersedia = $stokService->stokMaterial((int) $materialId);

            if ($qtyTotal > $stokTersedia) {
                $validator->errors()->add(
                    'qty',
                    "Stok tidak mencukupi. Sisa stok tersedia: {$stokTersedia}."
                );
            }
        });
    }
}