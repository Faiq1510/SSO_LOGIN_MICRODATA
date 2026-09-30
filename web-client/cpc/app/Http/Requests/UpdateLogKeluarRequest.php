<?php

namespace App\Http\Requests;

use App\Services\StokGudangService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateLogKeluarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tanggal'     => ['required', 'date'],
            'unit_id'     => ['required', 'exists:units,id'],
            'material_id' => ['required', 'exists:materials,id'],
            'qty'         => ['required', 'numeric', 'min:0.01'],
            'harga'       => ['required', 'numeric', 'min:0'],
            'total'       => ['required', 'numeric', 'min:0'],
            'keterangan'  => ['nullable', 'string'],
            'satuan'      => ['nullable', 'string', 'max:20'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $materialId = $this->input('material_id');
            $qtyDiminta = (float) $this->input('qty');

            if (! $materialId || $qtyDiminta <= 0) {
                return;
            }

            $stokService  = app(StokGudangService::class);
            $stokTersedia = $stokService->stokMaterial((int) $materialId);

            $logKeluar = $this->route('logKeluar');
            if ($logKeluar && (int) $logKeluar->material_id === (int) $materialId) {
                $stokTersedia += (float) $logKeluar->qty;
            }

            if ($qtyDiminta > $stokTersedia) {
                $validator->errors()->add(
                    'qty',
                    "Stok tidak mencukupi. Sisa stok tersedia: {$stokTersedia}."
                );
            }
        });
    }
}