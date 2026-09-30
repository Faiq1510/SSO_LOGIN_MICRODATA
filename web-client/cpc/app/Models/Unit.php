<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    use HasFactory;

    protected $table = 'units';

    protected $fillable = [
        'nama_unit', 'zona', 'status', 'tukang', 'tanggal_mulai', 'keterangan', 'master_standar_id'
    ];

    public function masterStandar()
    {
        return $this->belongsTo(MasterStandarProgress::class, 'master_standar_id');
    }

    protected $casts = [
        'tanggal_mulai' => 'date',
    ];

    public function setNamaUnitAttribute($value): void
    {
        $this->attributes['nama_unit'] = $this->normalizeCode($value, 4);
    }

    public function setZonaAttribute($value): void
    {
        $this->attributes['zona'] = $this->normalizeCode($value, 2);
    }

    public function progress()
    {
        return $this->hasMany(ProgressUnit::class, 'unit_id');
    }

    public function latestProgress()
    {
        return $this->hasOne(ProgressUnit::class, 'unit_id')->latestOfMany('id');
    }

    public function logKeluar()
    {
        return $this->hasMany(LogKeluarHarian::class);
    }

    private function normalizeCode($value, int $length): string
    {
        $clean = preg_replace('/[^A-Z0-9]/i', '', (string) $value) ?? '';

        return strtoupper(substr($clean, 0, $length));
    }
}