<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Arsip extends Model
{
    use SoftDeletes;
    
    protected $table = 'arsips';

    protected $fillable = [

        'surat_masuk_id',

        'surat_keluar_id',

        'nomor_surat',

        'jenis',

        'jenis_surat',

        'perihal',

        'pengirim_penerima',

        'tanggal_surat',

        'lampiran',

        'file_surat',

        'status',

        'user_id',

    ];

    protected $casts = [

        'tanggal_surat' => 'date',

    ];

    /*
    |--------------------------------------------------------------------------
    | Relasi
    |--------------------------------------------------------------------------
    */

    public function suratMasuk()
    {
        return $this->belongsTo(SuratMasuk::class);
    }

    public function suratKeluar()
    {
        return $this->belongsTo(SuratKeluar::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
