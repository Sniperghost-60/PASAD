<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaiListeProducteur extends Model
{
    protected $table = 'cai_liste_producteurs';

    protected $fillable = [
        'user_id',
        'commune_id',
        'nom_prenom',
        'sexe',
        'age',
        'village',
        'contact',
        'op_appartenance',
        'produits_agricoles',
        'mode_commercialisation',
        'marche_actuel',
        'attentes',
    ];

    protected $casts = [
        'produits_agricoles' => 'array',
        'attentes'           => 'array',
    ];

    public function user()    { return $this->belongsTo(User::class); }
    public function commune() { return $this->belongsTo(Commune::class); }
}
