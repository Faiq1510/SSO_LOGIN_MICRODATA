<?php

namespace App\Http\Requests;

use App\Models\JenisSurat;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class SuratKeluarUpdateRequest extends FormRequest
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
        $tipeForm = $this->input('tipe_form');
        if (!empty($tipeForm)) {
            $isKuasa = ($tipeForm === 'kuasa');
        } else {
            $isKuasa = JenisSurat::where('nama', $this->jenis_surat)
                ->where('form_type', 'kuasa')
                ->exists() || Str::contains(strtolower((string) $this->jenis_surat), 'kuasa');
        }

        return [
            'tanggal_surat'         => 'required|date',
            'nomor_surat'           => 'nullable|string|max:100',
            'jenis_surat'           => 'required|string|max:100',
            'kode_surat'            => 'nullable|string|max:10',
            'kode_divisi'           => 'required|string|max:20',
            'instansi_id'           => 'nullable|exists:instansis,id',
            'tujuan'                => $isKuasa ? 'nullable|string|max:255' : 'required|string|max:255',
            'perihal'               => $isKuasa ? 'nullable|string|max:255' : 'required|string|max:255',
            'isi_surat'             => $isKuasa ? 'nullable|string' : 'required|string',
            'data_khusus'           => $isKuasa ? 'required|array' : 'nullable|array',
            'lampiran'              => 'nullable|string|max:255',
            'penandatangan'         => $isKuasa ? 'nullable|string|max:255' : 'required|string|max:255',
            'jabatan_penandatangan' => $isKuasa ? 'nullable|string|max:255' : 'required|string|max:255',
            'status'                => 'required|in:Draft,Dikirim,Selesai',
            'file_surat'            => 'nullable|mimes:pdf|max:2048',
        ];
    }
}
