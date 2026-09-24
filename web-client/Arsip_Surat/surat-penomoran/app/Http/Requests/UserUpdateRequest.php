<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UserUpdateRequest extends FormRequest
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
        $userId = $this->route('user')?->id ?? $this->route('user') ?? $this->route('id');

        return [
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:users,email,' . $userId,
            'password'   => 'nullable|string|min:8|confirmed',
            'role'       => 'required|in:Admin,Operator,Verifikator,Viewer',
            'unit_kerja' => 'nullable|string|max:255',
            'status'     => 'required|in:Aktif,Nonaktif',
        ];
    }
}
