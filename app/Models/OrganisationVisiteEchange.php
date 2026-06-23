<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrganisationVisiteEchange extends Model
{
    protected $table = 'organisation_visites_echanges';

    protected $fillable = [
        'user_id', 'date',
        'lieu_visite', 'nb_participants',
        'objectifs_visite',
        'ce_qui_a_marche',
        'ce_qui_doit_etre_ameliore',
    ];

    protected $casts = [
        'objectifs_visite'          => 'array',
        'ce_qui_a_marche'           => 'array',
        'ce_qui_doit_etre_ameliore' => 'array',
    ];

    public function user() { return $this->belongsTo(User::class); }
}
