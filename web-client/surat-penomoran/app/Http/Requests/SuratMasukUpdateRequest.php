<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SuratMasukUpdateRequest extends FormRequest
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
            'nomor_surat'    => 'required|string|max:255',
            'instansi_id'    => 'required|exists:instansis,id',
            'tanggal_surat'  => 'required|date',
            'tanggal_terima' => 'required|date',
            'jenis_surat'    => 'required|string|max:255',
            'perihal'        => 'required|string|max:255',
            'isi_ringkas'    => 'nullable|string',
            'lampiran'       => 'nullable|string|max:255',
            'keterangan'     => 'nullable|string',
            'status'         => 'required|in:Baru,Diproses,Selesai',
            'file_surat'     => 'nullable|mimes:pdf|max:2048',
        ];
    }
}
