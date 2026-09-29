<?php

namespace App\Http\Controllers;

use App\Http\Requests\InstansiStoreRequest;
use App\Http\Requests\InstansiUpdateRequest;
use App\Models\Instansi;

class InstansiController extends Controller
{
    public function index()
    {
        $instansi = Instansi::latest()->get();

        return view('instansi.index', compact('instansi'));
    }

    public function create()
    {
        return view('instansi.create');
    }

    public function store(InstansiStoreRequest $request)
    {
        // Simpan langsung ke database
        Instansi::create($request->validated());

        return redirect()
            ->route('instansi.index')
            ->with('success', 'Data instansi berhasil ditambahkan.');
    }

    public function edit(Instansi $instansi)
    {
        return view('instansi.edit', compact('instansi'));
    }

    public function update(InstansiUpdateRequest $request, Instansi $instansi)
    {
        // Update data di database
        $instansi->update($request->validated());

        return redirect()
            ->route('instansi.index')
            ->with('success', 'Data instansi berhasil diperbarui.');
    }

    public function destroy(Instansi $instansi)
    {
        $instansi->delete();

        return redirect()
            ->route('instansi.index')
            ->with('success', 'Data instansi berhasil dipindahkan ke tempat sampah.');
    }
}