<?php

namespace App\Http\Controllers;

use App\Http\Requests\AccountUpdatePasswordRequest;
use App\Http\Requests\AccountUpdateRequest;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AccountController extends Controller
{
    public function edit()
    {
        return view('akun.index');
    }

    public function update(AccountUpdateRequest $request)
    {
        /** @var User $user */
        $user = Auth::user();

        $user->update($request->only('name', 'email'));

        return back()->with('success', 'Profil berhasil diperbarui.');
    }

    public function updatePassword(AccountUpdatePasswordRequest $request)
    {
        /** @var User $user */
        $user = Auth::user();

        if (! Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'Password lama tidak sesuai.']);
        }

        $user->update(['password' => Hash::make($request->password)]);

        return back()->with('success', 'Password berhasil diubah.');
    }
}