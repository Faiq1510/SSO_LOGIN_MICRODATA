<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgressUnit extends Model
{
    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    protected $table = 'progress_unit';

    protected $fillable = [
        'unit_id', 'progress_percent', 'tanggal_update', 'status', 'updated_by',
        'status_material', 'detail_material',
    ];

    protected $casts = [
    'tanggal_update' => 'date:Y-m-d',
    'detail_material' => 'array',
    ];

    public function unit()
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }
}