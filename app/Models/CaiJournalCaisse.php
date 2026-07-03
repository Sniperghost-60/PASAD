<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiJournalCaisse extends Model
{
    protected $table    = 'cai_journal_caisse';
    protected $fillable = ['user_id', 'commune_id', 'donnees'];
    protected $casts    = [
        'donnees' => 'array',
    ];
}
