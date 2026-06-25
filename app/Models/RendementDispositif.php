<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RendementDispositif extends Model
{
    protected $table = 'rendement_dispositif';

    protected $fillable = [
        'user_id', 'cep_id',
        'commune_id', 'arrondissement_id', 'village',
        'nom_producteur', 'culture_technologie',
        'rendement_annee_n1',
        'rendement_annee_n_technologie',
        'rendement_annee_n_temoin',
    ];

    protected $casts = [
        'rendement_annee_n1'           => 'float',
        'rendement_annee_n_technologie' => 'float',
        'rendement_annee_n_temoin'      => 'float',
    ];

    public function user()           { return $this->belongsTo(User::class); }
    public function commune()        { return $this->belongsTo(Commune::class); }
    public function arrondissement() { return $this->belongsTo(Arrondissement::class); }
}
