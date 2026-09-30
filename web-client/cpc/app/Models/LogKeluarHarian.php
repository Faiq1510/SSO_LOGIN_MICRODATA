<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\LogGudangHistory;

class LogKeluarHarian extends Model
{
    use SoftDeletes;

    protected $table = 'log_keluar_harian';

    protected $fillable = [
        'tanggal', 'unit_id', 'material_id', 'qty',
        'harga', 'total', 'keterangan', 'created_by', 'satuan',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'deleted_at' => 'datetime',
    ];

    public function histories()
    {
        return $this->hasMany(LogGudangHistory::class, 'log_id')
            ->where('tipe_log', 'keluar')
            ->latest('created_at');
    }

    protected static function booted()
    {
        static::created(function ($model) {
            LogGudangHistory::create([
                'user_id' => \Illuminate\Support\Facades\Auth::id(),
                'tipe_log' => 'keluar',
                'log_id' => $model->id,
                'action' => 'create',
                'data_baru' => $model->toArray(),
            ]);
        });

        static::updating(function ($model) {
            LogGudangHistory::create([
                'user_id' => \Illuminate\Support\Facades\Auth::id(),
                'tipe_log' => 'keluar',
                'log_id' => $model->id,
                'action' => 'update',
                'data_lama' => $model->getOriginal(),
                'data_baru' => $model->getAttributes(),
            ]);
        });

        static::deleted(function ($model) {
            LogGudangHistory::create([
                'user_id' => \Illuminate\Support\Facades\Auth::id(),
                'tipe_log' => 'keluar',
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

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}