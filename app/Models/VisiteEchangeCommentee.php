<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VisiteEchangeCommentee extends Model
{
    protected $table = 'visites_echanges_commentees';

    protected $fillable = [
        'user_id', 'cep_id', 'date',
        'experimentations_tests',
        'visiteurs_total', 'visiteurs_hommes', 'visiteurs_femmes',
        'qui_sont_visiteurs',
        'ce_qui_a_marche',
        'ce_qui_doit_etre_ameliore',
    ];

    protected $casts = [
        'experimentations_tests'    => 'array',
        'qui_sont_visiteurs'        => 'array',
        'ce_qui_a_marche'           => 'array',
        'ce_qui_doit_etre_ameliore' => 'array',
    ];

    public function user() { return $this->belongsTo(User::class); }
}
