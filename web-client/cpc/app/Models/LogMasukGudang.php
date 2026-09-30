<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\LogGudangHistory;

class LogMasukGudang extends Model
{
    use SoftDeletes;

    protected $table = 'log_masuk_gudang';

    protected $fillable = [
        'tanggal',
        'supplier',
        'material_id',
        'qty',
        'harga_satuan',
        'total_harga',
        'keterangan',
        'created_by',
        'kas_keluar_id',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'qty' => 'decimal:2',
        'harga_satuan' => 'decimal:2',
        'total_harga' => 'decimal:2',
        'deleted_at' => 'datetime',
    ];

    public function histories()
    {
        return $this->hasMany(LogGudangHistory::class, 'log_id')
            ->where('tipe_log', 'masuk')
            ->latest('created_at');
    }

    protected static function booted()
    {
        static::created(function ($model) {
            LogGudangHistory::create([
                'user_id' => \Illuminate\Support\Facades\Auth::id(),
                'tipe_log' => 'masuk',
                'log_id' => $model->id,
                'action' => 'create',
                'data_baru' => $model->toArray(),
            ]);
        });

        static::updating(function ($model) {
            LogGudangHistory::create([
                'user_id' => \Illuminate\Support\Facades\Auth::id(),
                'tipe_log' => 'masuk',
                'log_id' => $model->id,
                'action' => 'update',
                'data_lama' => $model->getOriginal(),
                'data_baru' => $model->getAttributes(),
            ]);
        });

        static::deleted(function ($model) {
            LogGudangHistory::create([
                'user_id' => \Illuminate\Support\Facades\Auth::id(),
                'tipe_log' => 'masuk',
                'log_id' => $model->id,
                'action' => 'delete',
                'data_lama' => $model->toArray(),
            ]);
        });
    }

    public function material()
    {

        return $this->belongsTo(Material::class);
    }
    public function kasKeluar()
{
    return $this->belongsTo(KasKeluar::class);
}
}