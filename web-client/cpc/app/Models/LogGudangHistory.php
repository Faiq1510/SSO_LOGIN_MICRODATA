<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogGudangHistory extends Model
{
    protected $table = 'log_gudang_histories';

    protected $fillable = [
        'user_id',
        'tipe_log',
        'log_id',
        'action',
        'data_lama',
        'data_baru',
    ];

    protected $casts = [
        'data_lama' => 'array',
        'data_baru' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
