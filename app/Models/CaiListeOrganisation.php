<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiListeOrganisation extends Model
{
    protected $fillable = [
        'user_id', 'commune_id',
        'nom_op', 'siege_contact', 'numero_groupement',
        'effectif_h', 'effectif_f', 'produits_agricoles',
        'mode_commercialisation', 'marche_actuel', 'attente',
    ];

    protected $casts = [
        'produits_agricoles' => 'array',
        'attente'            => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function commune()
    {
        return $this->belongsTo(Commune::class);
    }
}
