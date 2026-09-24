<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;
use App\Models\Instansi;

class SuratKeluar extends Model
{
    use SoftDeletes; 
    
    protected $fillable = [
        'nomor_surat',
        'tanggal_surat',
        'jenis_surat',
        'kode_surat',
        'kode_divisi',
        'instansi_id',
        'tujuan',
        'perihal',
        'isi_surat',
        'data_khusus',
        'lampiran',
        'penandatangan',
        'jabatan_penandatangan',
        'file_surat',
        'status',
        'user_id',
    ];

    protected $casts = [
        'tanggal_surat' => 'date',
        'data_khusus' => 'array',
    ];

    /**
     * Relasi ke User
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi ke JenisSurat
     */
    public function jenisSurat()
    {
        return $this->belongsTo(JenisSurat::class, 'jenis_surat', 'nama');
    }

    /**
     * Relasi ke Instansi (tetap terbaca walau instansi dihapus/masuk sampah)
     */
    public function instansi()
    {
        return $this->belongsTo(Instansi::class)->withTrashed();
    }
}

