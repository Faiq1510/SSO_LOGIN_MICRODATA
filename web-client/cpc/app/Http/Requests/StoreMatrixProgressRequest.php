<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMatrixProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Saat update, $this->route('matrix') tersedia untuk exclude diri sendiri
        $matrixId = $this->route('matrix')?->id ?? $this->route('matrix');

        // Tahap harus unik hanya di dalam master_standar yang sama (bukan global)
        $masterId = $this->route('master')?->id ?? $this->route('master');

        return [
            'tahap_pekerjaan' => [
                'required',
                'string',
                'max:100',
                Rule::unique('matrix_progress', 'tahap_pekerjaan')
                    ->where('master_standar_id', $masterId)
                    ->withoutTrashed()
                    ->ignore($matrixId),
            ],
            'batas_atas' => [
                'required',
                'integer',
                'min:1',
                'max:100',
                Rule::unique('matrix_progress', 'batas_atas')
                    ->where('master_standar_id', $masterId)
                    ->withoutTrashed()
                    ->ignore($matrixId),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'tahap_pekerjaan.required' => 'Tahap pekerjaan wajib diisi.',
            'tahap_pekerjaan.unique'   => 'Tahap ini sudah ada pada standar progress ini.',
            'batas_atas.required'      => 'Batas atas progres wajib diisi.',
            'batas_atas.unique'        => 'Batas atas progres ini sudah digunakan pada standar progress ini.',
            'batas_atas.min'           => 'Batas atas progres minimal 1%.',
            'batas_atas.max'           => 'Batas atas progres maksimal 100%.',
        ];
    }
}
