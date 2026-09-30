<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterStandarProgress extends Model
{
    protected $table = 'master_standar_progress';

    protected $fillable = [
        'nama_standar',
        'deskripsi',
    ];

    public function matrixProgress()
    {
        return $this->hasMany(MatrixProgress::class, 'master_standar_id');
    }

    public function units()
    {
        return $this->hasMany(Unit::class, 'master_standar_id');
    }
}
