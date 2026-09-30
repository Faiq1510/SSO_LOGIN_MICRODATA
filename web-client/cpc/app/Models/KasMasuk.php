<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KasMasuk extends Model
{
    use HasFactory;

    protected $fillable = [
        'tanggal',
        'akun_referensi_id',
        'keterangan',
        'nominal',
        'dari',
        'untuk',
        'minggu_ke',
        'created_by',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'nominal' => 'decimal:2',
    ];

    public function akunReferensi()
    {
        return $this->belongsTo(AkunReferensi::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}