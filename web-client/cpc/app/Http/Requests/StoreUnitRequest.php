<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $data = $this->all();

        if (array_key_exists('nama_unit', $data)) {
            $data['nama_unit'] = $this->normalizeCode((string) $data['nama_unit'], 4);
        }

        if (array_key_exists('zona', $data)) {
            $data['zona'] = $this->normalizeCode((string) $data['zona'], 2);
        }

        $this->merge($data);
    }
    public function rules(): array
    {
        $unit = $this->route('unit');
        $unitId = $unit?->id;

        return [
            'nama_unit' => [
                'required',
                'string',
                'max:4',
                'regex:/^[A-Z0-9]+$/',
                function ($attribute, $value, $fail) use ($unitId) {
                    $exists = \App\Models\Unit::whereRaw('LOWER(nama_unit) = ?', [strtolower($value)])
                        ->when($unitId, fn ($q) => $q->where('id', '!=', $unitId))
                        ->exists();

                    if ($exists) {
                        $fail('Nama unit sudah digunakan.');
                    }
                },
            ],
            'zona'              => ['required', 'string', 'max:2', 'regex:/^[A-Z0-9]+$/'],
            'status'            => ['required', 'string', 'in:Aktif,Non-aktif'],
            'tukang'            => ['required', 'string', 'max:100'],
            'tanggal_mulai'     => ['nullable', 'date'],
            'keterangan'        => ['nullable', 'string'],
            'master_standar_id' => [
                'required',
                'exists:master_standar_progress,id',
                function ($attribute, $value, $fail) use ($unit) {
                    if ($unit) {
                        $lastProgress = $unit->latestProgress?->progress_percent ?? 0;
                        if ($lastProgress > 0 && (int)$value !== (int)$unit->master_standar_id) {
                            $fail('Standar tidak dapat diubah karena progres unit sudah berjalan.');
                        }
                    }
                }
            ],
        ];
    }

    private function normalizeCode(string $value, int $length): string
    {
        $clean = preg_replace('/[^A-Z0-9]/i', '', $value) ?? '';

        return strtoupper(substr($clean, 0, $length));
    }
}