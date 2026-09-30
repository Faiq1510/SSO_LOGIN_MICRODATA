<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\AkunReferensi;

class StoreAkunReferensiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation()
    {
        if ($this->parent_id) {
            $parent = AkunReferensi::find($this->parent_id);
            if ($parent && !str_starts_with($this->kode_akun, $parent->kode_akun . '-')) {
                $this->merge([
                    'kode_akun' => $parent->kode_akun . '-' . $this->kode_akun,
                ]);
            }
        }
    }

    public function rules(): array
    {
        // Saat update, route model binding mengisi {akunReferensi} sehingga
        // ID-nya bisa dipakai untuk mengecualikan diri sendiri dari cek unique.
        $akunReferensiId = $this->route('akunReferensi');

       return [
            'kode_akun' => [
                'required',
                'string',
                'max:20',
                Rule::unique('akun_referensis', 'kode_akun')->ignore($akunReferensiId),
            ],
            'nama_akun' => ['required', 'string', 'max:255'],
            'kategori' => ['required', Rule::in(['HPP', 'OPEX', 'CAPEX'])],
            'tipe_akun' => ['required', Rule::in(['induk', 'sub'])],
            'parent_id' => ['nullable', 'required_if:tipe_akun,sub', 'exists:akun_referensis,id'],
            'children_ids' => ['nullable', 'array'],
            'children_ids.*' => ['exists:akun_referensis,id'],
            'tipe_neraca' => ['required', Rule::in(['modal', 'pendapatan', 'beban', 'pembelian_aset', 'liabilitas'])],
        ];
    }

    public function messages(): array
    {
        return [
            'kode_akun.required' => 'Kode akun wajib diisi.',
            'kode_akun.unique' => 'Kode akun ini sudah dipakai.',
            'nama_akun.required' => 'Nama akun wajib diisi.',
            'kategori.required' => 'Kategori wajib dipilih.',
            'kategori.in' => 'Kategori tidak valid.',
            'parent_id.exists' => 'Akun induk yang dipilih tidak valid.',
            'parent_id.required_if' => 'Akun induk wajib dipilih untuk sub akun.',
            'tipe_akun.required' => 'Jenis akun wajib dipilih.',
            'children_ids.array' => 'Daftar sub akun tidak valid.',
            'children_ids.*.exists' => 'Salah satu sub akun yang dipilih tidak valid.',
            'tipe_neraca.required' => 'Tipe neraca wajib dipilih.',
            'tipe_neraca.in' => 'Tipe neraca tidak valid.',
        ];
    }
}