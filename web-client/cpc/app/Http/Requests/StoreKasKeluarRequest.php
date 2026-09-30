<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreKasKeluarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tanggal' => ['required', 'date'],
            'akun_referensi_id' => ['required', 'exists:akun_referensis,id'],
            'unit' => ['nullable', 'string', 'max:255'],
            'keterangan' => ['nullable', 'string', 'max:500'],
            'nominal_per_unit' => ['required', 'numeric', 'min:0'],
            'metode_bayar' => ['required', 'in:transfer,tunai'],
            'penerima' => ['nullable', 'string', 'max:255'],
            // max di sini satuannya KB -> 10MB = 10240 KB
            'lampiran' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'lampiran.max' => 'Ukuran lampiran maksimal 10MB.',
            'lampiran.mimes' => 'Lampiran harus berupa JPG, PNG, atau PDF.',
        ];
    }
}