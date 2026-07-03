<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiFacteurLimitant extends Model
{
    protected $table = 'cai_facteurs_limitant';

    protected $fillable = [
        'user_id',
        'commune_id',
        'forces',
        'faiblesses',
        'opportunites',
        'menaces',
    ];
}
