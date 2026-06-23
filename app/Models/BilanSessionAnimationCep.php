<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BilanSessionAnimationCep extends Model
{
    protected $table = 'bilan_sessions_animation_cep';

    protected $fillable = [
        'user_id', 'date_session',
        'participation_total', 'participation_h', 'participation_f', 'participation_jeunes',
        'nb_aaes', 'nb_test_urne',
        'sujets_speciaux',
        'visiteur_nom', 'visiteur_structure',
    ];

    public function user() { return $this->belongsTo(User::class); }
}
