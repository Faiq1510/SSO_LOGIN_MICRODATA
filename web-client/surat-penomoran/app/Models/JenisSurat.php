<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JenisSurat extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'nama',
        'kode_surat',
        'form_type',
        'template',
    ];
}

