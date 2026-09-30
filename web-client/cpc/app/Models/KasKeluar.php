<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KasKeluar extends Model
{
    use HasFactory;

    protected $fillable = [
        'tanggal',
        'akun_referensi_id',
        'unit',
        'keterangan',
        'qty',
        'satuan',
        'nominal_per_unit',
        'total',
        'metode_bayar',
        'penerima',
        'lampiran_path',
        'is_pembelian_material',
        'material_id',
        'created_by',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'qty' => 'decimal:2',
        'nominal_per_unit' => 'decimal:2',
        'total' => 'decimal:2',
        'is_pembelian_material' => 'boolean',
    ];

    public function akunReferensi()
    {
        return $this->belongsTo(AkunReferensi::class);
    }

    public function material()
    {
        return $this->belongsTo(Material::class);
    }

    public function logMasukGudang()
    {
        return $this->hasOne(LogMasukGudang::class, 'kas_keluar_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getLampiranUrlAttribute(): ?string
    {
        return $this->lampiran_path ? asset('storage/' . $this->lampiran_path) : null;
    }
}