<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Material extends Model
{
    protected $fillable = [
        'kode_material', 'nama_material', 'satuan', 'kategori', 'harga',
    ];

    public function logMasuk()
    {
        return $this->hasMany(LogMasukGudang::class);
    }

    public function logKeluar()
    {
        return $this->hasMany(LogKeluarHarian::class);
    }

    public function latestLogMasuk()
    {
    return $this->hasOne(\App\Models\LogMasukGudang::class)
    ->latestOfMany(['tanggal', 'id']);
    }
}