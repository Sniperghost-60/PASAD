<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiProgrammationMarche extends Model
{
    protected $table    = 'cai_programmation_marche';
    protected $fillable = ['user_id', 'commune_id', 'donnees'];
    protected $casts    = [
        'donnees' => 'array',
    ];
}
