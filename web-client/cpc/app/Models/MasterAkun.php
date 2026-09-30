<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterAkun extends Model
{
    protected $table = 'master_akun';

    protected $fillable = [
        'kode_akun',
        'nama_akun',
        'kategori',
    ];

    public function kasMasuk()
    {
        return $this->hasMany(KasMasuk::class, 'akun_id');
    }

    public function kasKeluar()
    {
        return $this->hasMany(KasKeluar::class, 'akun_id');
    }
}
