<?php

namespace App\Http\Requests;
use App\Models\ProgressUnit;
use Illuminate\Validation\Validator;

use Illuminate\Foundation\Http\FormRequest;

class StoreProgressUnitRequest extends FormRequest
{
   public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['Super Admin', 'Admin']) ?? false;
    }

    public function rules(): array
    {
        return [
            'unit_id'          => ['required', 'exists:units,id'],
            'progress_percent' => ['required', 'integer', 'min:0', 'max:100'],
            'tanggal_update'   => ['required', 'date'],
            'status'           => ['required', 'string', 'in:NOT STARTED,ON PROGRESS,DONE'],
        ];
    }
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $unitId = $this->input('unit_id');
            $progressBaru = (int) $this->input('progress_percent');

            $terakhir = ProgressUnit::where('unit_id', $unitId)
                ->orderByDesc('tanggal_update')
                ->orderByDesc('id')
                ->value('progress_percent');

            if ($terakhir !== null && $progressBaru < (int) $terakhir) {
                $validator->errors()->add(
                    'progress_percent',
                    "Progress gak boleh turun (terakhir: {$terakhir}%)."
                );
            }
        });
    }
}