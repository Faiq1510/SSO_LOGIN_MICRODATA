<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\KasKeluar;
use App\Models\KasMasuk;

class AkunReferensi extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'kode_akun',
        'nama_akun',
        'kategori',
        'jenis',
        'tipe_akun',
        'parent_id',
        'tipe_neraca',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'deleted_at' => 'datetime',
    ];

    /**
     * Tipe neraca yang mewakili aliran dana MASUK (kas_masuks).
     * Selain yang ada di daftar ini, dianggap KELUAR (kas_keluars).
     *
     * Ini menentukan otomatis field `jenis`, supaya user tidak perlu
     * memilihnya manual dan tidak mungkin salah/tidak konsisten dengan
     * tipe_neraca-nya sendiri.
     */
    public const TIPE_NERACA_MASUK = ['modal', 'pendapatan', 'liabilitas'];

    protected static function booted()
    {
        static::saving(function (AkunReferensi $akun) {
            $akun->jenis = in_array($akun->tipe_neraca, self::TIPE_NERACA_MASUK, true)
                ? 'masuk'
                : 'keluar';
        });
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function deleter()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function histories()
    {
        return $this->hasMany(AkunReferensiHistory::class)->latest();
    }

    public function kasMasuks()
    {
        return $this->hasMany(KasMasuk::class, 'akun_referensi_id');
    }

    public function kasKeluars()
    {
        return $this->hasMany(KasKeluar::class, 'akun_referensi_id');
    }

    public function parent()
    {
        return $this->belongsTo(AkunReferensi::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(AkunReferensi::class, 'parent_id')->orderBy('kode_akun');
    }

    public function scopeMasuk($query)
    {
        return $query->where('jenis', 'masuk');
    }

    public function scopeKeluar($query)
    {
        return $query->where('jenis', 'keluar');
    }
}