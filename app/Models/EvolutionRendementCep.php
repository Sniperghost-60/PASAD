<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EvolutionRendementCep extends Model
{
    protected $table = 'evolution_rendements_cep';

    protected $fillable = [
        'user_id',
        'commune_id', 'arrondissement_id', 'village',
        'type_experimentation_cep', 'culture',
        'technologies_dispositif_1', 'technologies_dispositif_2',
        'technologies_dispositif_3', 'technologies_dispositif_4',
        'rendement_dispositif_1', 'rendement_dispositif_2',
        'rendement_dispositif_3', 'rendement_dispositif_4',
    ];

    public function user()            { return $this->belongsTo(User::class); }
    public function commune()         { return $this->belongsTo(Commune::class); }
    public function arrondissement()  { return $this->belongsTo(Arrondissement::class); }
}
