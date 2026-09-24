<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class JenisSuratUpdateRequest extends FormRequest
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
        $jenisSuratId = $this->route('jenisSurat')?->id ?? $this->route('jenisSurat') ?? $this->route('jenis_surat');

        return [
            'nama'       => 'required|string|max:100|unique:jenis_surats,nama,' . $jenisSuratId,
            'kode_surat' => 'required|string|max:10|unique:jenis_surats,kode_surat,' . $jenisSuratId,
            'form_type'  => 'required|in:umum,kuasa',
            'template'   => 'nullable|string',
        ];
    }
}
