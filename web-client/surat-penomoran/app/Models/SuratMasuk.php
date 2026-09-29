<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class SuratMasuk extends Model
{
    use HasFactory;
    use SoftDeletes;

    /**
     * Nama tabel yang terikat dengan model (opsional jika sesuai konvensi "surat_masuks")
     *
     * @var string
     */
    protected $table = 'surat_masuks';

    /**
     * Atribut yang dapat diisi secara masal (mass assignable).
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'instansi_id',
        'user_id',
        'nomor_agenda',
        'nomor_surat',
        'tanggal_surat',
        'tanggal_terima',
        'asal_surat',
        'jenis_surat',
        'perihal',
        'isi_ringkas',
        'lampiran',
        'file_surat',
        'keterangan',
        'status',
        'nama_petugas',
        'jabatan_petugas',
        'nama_pimpinan',
        'jabatan_pimpinan',
    ];

    /**
     * Casting tipe data otomatis untuk atribut tertentu.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'tanggal_surat'  => 'date',
        'tanggal_terima' => 'date',
    ];

    /**
     * Relasi ke User (Admin/User yang menginput surat)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Relasi ke Instansi (Asal pengirim surat - tetap terbaca walau masuk sampah)
     */
    public function instansi(): BelongsTo
    {
        return $this->belongsTo(Instansi::class, 'instansi_id')->withTrashed();
    }

    /**
     * Relasi ke Surat Keluar (Balasan surat jika ada)
     */
    public function suratKeluars(): HasMany
    {
        return $this->hasMany(SuratKeluar::class, 'surat_masuk_id');
    }

    /**
     * Relasi ke Arsip (Satu surat masuk memiliki satu record arsip)
     */
    public function arsip(): HasOne
    {
        return $this->hasOne(Arsip::class, 'surat_masuk_id');
    }
}
