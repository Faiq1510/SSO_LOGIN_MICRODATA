<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMatrixDetailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isUpdate = !is_null($this->route('detail'));

        return [
            'material_id' => [$isUpdate ? 'sometimes' : 'required', 'exists:materials,id'],
            'qty_standar' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'material_id.required' => 'Material wajib dipilih.',
            'material_id.exists' => 'Material tidak ditemukan.',
            'qty_standar.required' => 'Qty standar wajib diisi.',
            'qty_standar.min' => 'Qty standar tidak boleh negatif.',
        ];
    }
}
