<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiFacteurLimitant extends Model
{
    protected $table = 'cai_facteurs_limitant';

    protected $fillable = [
        'user_id',
        'commune_id',
        'date_session',
        'forces',
        'faiblesses',
        'opportunites',
        'menaces',
    ];

    protected $casts = [
        'date_session' => 'date:Y-m-d',
    ];
}
