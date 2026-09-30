<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreKasMasukRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // sudah dihandle middleware role di route
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'akun_referensi_id' => $this->input('akun_referensi_id', $this->input('akun_id')),
            'dari' => $this->filled('dari') ? $this->input('dari') : 'Tidak disebutkan',
            'untuk' => $this->filled('untuk') ? $this->input('untuk') : 'Kas Proyek SiteFlow',
        ]);
    }

    public function rules(): array
    {
        return [
            'tanggal' => ['required', 'date'],
            'akun_referensi_id' => ['required', 'exists:akun_referensis,id'],
            'keterangan' => ['nullable', 'string', 'max:500'],
            'nominal' => ['required', 'numeric', 'min:0', 'max:1000000000000'],
            'dari' => ['nullable', 'string', 'max:255'],
            'untuk' => ['nullable', 'string', 'max:255'],
        ];
    }
}