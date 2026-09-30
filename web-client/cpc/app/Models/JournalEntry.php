<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JournalEntry extends Model
{
    use HasFactory;

    protected $table = 'journal_entries';

    protected $fillable = [
        'account_id',
        'debit',
        'credit',
        'tanggal',
        'keterangan',
    ];

    public function account()
    {
        return $this->belongsTo(AkunReferensi::class, 'account_id');
    }
}
