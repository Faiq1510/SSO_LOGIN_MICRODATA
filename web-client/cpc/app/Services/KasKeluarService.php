<?php

namespace App\Services;

use App\Models\KasKeluar;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class KasKeluarService
{
    public function create(array $data, ?UploadedFile $lampiran = null): KasKeluar
    {
        return DB::transaction(function () use ($data, $lampiran) {
            $nominalPerUnit = (float) $data['nominal_per_unit'];

            $lampiranPath = null;
            if ($lampiran) {
                // disimpan di storage/app/public/lampiran-kas-keluar
                $lampiranPath = $lampiran->store('lampiran-kas-keluar', 'public');
            }

            return KasKeluar::create([
                'tanggal' => $data['tanggal'],
                'akun_referensi_id' => $data['akun_referensi_id'],
                'unit' => $data['unit'] ?? null,
                'keterangan' => $data['keterangan'] ?? null,
                'qty' => 1,
                'satuan' => null,
                'nominal_per_unit' => $nominalPerUnit,
                'total' => $nominalPerUnit,
                'metode_bayar' => $data['metode_bayar'],
                'penerima' => $data['penerima'] ?? null,
                'lampiran_path' => $lampiranPath,
                'created_by' => Auth::id(),
            ]);
        });
    }

    public function update(KasKeluar $kasKeluar, array $data, ?UploadedFile $lampiran = null): KasKeluar
    {
        return DB::transaction(function () use ($kasKeluar, $data, $lampiran) {
            $nominalPerUnit = (float) $data['nominal_per_unit'];
            
            $updateData = [
                'tanggal' => $data['tanggal'],
                'akun_referensi_id' => $data['akun_referensi_id'],
                'unit' => $data['unit'] ?? null,
                'keterangan' => $data['keterangan'] ?? null,
                'nominal_per_unit' => $nominalPerUnit,
                'total' => $nominalPerUnit,
                'metode_bayar' => $data['metode_bayar'],
                'penerima' => $data['penerima'] ?? null,
            ];

            // Kalau ada file lampiran baru yang di-upload
            if ($lampiran) {
                // Hapus lampiran lama kalau ada di storage
                if ($kasKeluar->lampiran_path) {
                    Storage::disk('public')->delete($kasKeluar->lampiran_path);
                }
                // Simpan lampiran baru dan set path-nya
                $updateData['lampiran_path'] = $lampiran->store('lampiran-kas-keluar', 'public');
            }

            $kasKeluar->update($updateData);

            return $kasKeluar;
        });
    }

    public function delete(KasKeluar $kasKeluar): void
    {
        DB::transaction(function () use ($kasKeluar) {
            // Hapus file lampiran dari storage kalau ada
            if ($kasKeluar->lampiran_path) {
                Storage::disk('public')->delete($kasKeluar->lampiran_path);
            }
            // Hapus data dari database
            $kasKeluar->delete();
        });
    }
}