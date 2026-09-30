<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route sudah dijaga middleware role:Super Admin|Admin, ini pengaman tambahan.
        return $this->user()?->hasAnyRole(['Super Admin', 'Admin']) ?? false;
    }

    public function rules(): array
    {
        return [
            'kode_material' => ['required', 'string', 'max:20', 'unique:materials,kode_material'],
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
