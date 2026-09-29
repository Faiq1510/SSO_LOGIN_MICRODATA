<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Instansi extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Nama tabel di database
     */
    protected $table = 'instansis';

    /**
     * Kolom yang diizinkan untuk diisi (Mass Assignment)
     */
    protected $fillable = [
        'kode_instansi',
        'nama_instansi',
        'telepon', // <--- DITAMBAHKAN
        'alamat',  // <--- DITAMBAHKAN
    ];

    /**
     * Relasi: Satu Instansi bisa mengirimkan Banyak Surat Masuk
     */
    public function suratMasuks(): HasMany
    {
        return $this->hasMany(SuratMasuk::class, 'instansi_id');
    }

    /**
     * Relasi: Satu Instansi bisa menjadi tujuan Banyak Surat Keluar (Opsional)
     */
    public function suratKeluars(): HasMany
    {
        return $this->hasMany(SuratKeluar::class, 'instansi_id');
    }
}