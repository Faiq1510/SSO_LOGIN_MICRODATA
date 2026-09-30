<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

class MatrixProgressDetail extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'matrix_progress_detail';

    protected $fillable = [
        'matrix_id',
        'material_id',
        'qty_standar',
    ];

    protected $casts = [
        'qty_standar' => 'decimal:2',
    ];

    public function matrix()
    {
        return $this->belongsTo(MatrixProgress::class, 'matrix_id');
    }

    public function material()
    {
        return $this->belongsTo(Material::class, 'material_id');
    }
}
