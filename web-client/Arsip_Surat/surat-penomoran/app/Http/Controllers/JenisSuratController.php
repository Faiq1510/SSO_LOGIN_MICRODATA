<?php

namespace App\Http\Controllers;

use App\Http\Requests\JenisSuratStoreRequest;
use App\Http\Requests\JenisSuratUpdateRequest;
use App\Models\JenisSurat;

class JenisSuratController extends Controller
{
    /**
     * Tampilkan daftar jenis surat.
     */
    public function index()
    {
        $jenisSurat = JenisSurat::latest()->get();

        return view('jenis_surat.index', compact('jenisSurat'));
    }

    /**
     * Simpan jenis surat baru (dari modal di form surat keluar).
     */
    public function store(JenisSuratStoreRequest $request)
    {
        $validated = $request->validated();

        $jenis = JenisSurat::create([
            'nama' => $validated['nama'],
            'kode_surat' => $validated['kode_surat'],
            'form_type' => $validated['form_type'],
            'template' => $validated['template'] ?? null,
        ]);

        return response()->json([
            'success'    => true,
            'message'    => 'Jenis surat berhasil ditambahkan.',
            'id'         => $jenis->id,
            'nama'       => $jenis->nama,
            'kode_surat' => $jenis->kode_surat,
            'form_type'  => $jenis->form_type,
        ]);
    }

    /**
     * Tampilkan form edit jenis surat.
     */
    public function edit(JenisSurat $jenisSurat)
    {
        return view('jenis_surat.edit', compact('jenisSurat'));
    }

    /**
     * Update jenis surat.
     */
    public function update(JenisSuratUpdateRequest $request, JenisSurat $jenisSurat)
    {
        $jenisSurat->update($request->validated());

        return redirect()
            ->route('jenis_surat.index')
            ->with('success', 'Data jenis surat berhasil diperbarui.');
    }

    /**
     * Soft delete jenis surat.
     */
    public function destroy(JenisSurat $jenisSurat)
    {
        $jenisSurat->delete();

        return redirect()
            ->route('jenis_surat.index')
            ->with('success', 'Data jenis surat berhasil dipindahkan ke tempat sampah.');
    }
}


