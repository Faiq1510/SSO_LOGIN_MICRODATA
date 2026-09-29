<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class JenisSuratStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('kode_surat')) {
            $this->merge([
                'kode_surat' => strtoupper($this->kode_surat),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nama'       => 'required|string|max:100|unique:jenis_surats,nama',
            'kode_surat' => 'required|string|max:10|unique:jenis_surats,kode_surat',
            'form_type'  => 'required|in:umum,kuasa',
            'template'   => 'nullable|string',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'kode_surat.unique'   => 'Kode surat sudah pernah terpakai.',
            'nama.unique'         => 'Nama jenis surat sudah pernah terpakai.',
            'kode_surat.required' => 'Kode surat wajib diisi.',
            'nama.required'       => 'Nama jenis surat wajib diisi.',
        ];
    }
}
