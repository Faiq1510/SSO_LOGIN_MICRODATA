<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InstansiStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'kode_instansi' => 'required|string|max:100|unique:instansis,kode_instansi',
            'nama_instansi' => 'required|string|max:255',
            'telepon'       => 'nullable|string|max:20',
            'alamat'        => 'nullable|string',
        ];
    }
}
