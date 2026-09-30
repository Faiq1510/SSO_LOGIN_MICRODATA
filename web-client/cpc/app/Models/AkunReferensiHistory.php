<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AkunReferensiHistory extends Model
{
    protected $fillable = [
        'akun_referensi_id',
        'user_id',
        'aksi',
        'detail',
    ];

    protected $casts = [
        'detail' => 'array',
    ];

    public function akunReferensi()
    {
        return $this->belongsTo(AkunReferensi::class)->withTrashed();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}