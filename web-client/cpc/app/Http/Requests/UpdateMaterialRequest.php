<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['Super Admin', 'Admin']) ?? false;
    }

    public function rules(): array
    {
        $materialId = $this->route('material')->id;

        return [
            'kode_material' => ['required', 'string', 'max:20', Rule::unique('materials', 'kode_material')->ignore($materialId)],
            'nama_material' => ['required', 'string', 'max:150'],
            'kategori'      => ['required', 'string', Rule::in([
                'Struktur', 'Dinding', 'Atap', 'Finishing', 'Plumbing',
                'Elektrikal', 'Plafon', 'Pondasi', 'Bekisting',
            ])],
            'satuan' => ['required', 'string', Rule::in([
                'Zak', 'Sak', 'Rit', 'M3', 'Bh', 'Btg', 'Kg', 'Lbr', 'Ltr', 'Dus', 'Set', 'Kaleng', 'Roll', 'Pail',
            ])],
            'harga' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'kode_material.unique' => 'Kode material ":input" sudah dipakai material lain.',
        ];
    }
}
