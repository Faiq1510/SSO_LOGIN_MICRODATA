<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLogMasukRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tanggal'      => ['required', 'date'],
            'supplier'     => ['required', 'string', 'max:255'],
            'material_id'  => ['required', 'exists:materials,id'],
            'qty'          => ['required', 'numeric', 'min:0'],
            'harga_satuan' => ['required', 'numeric', 'min:0'],
            'total_harga'  => ['required', 'numeric', 'min:0'],
            'keterangan'   => ['nullable', 'string'],
        ];
    }
}