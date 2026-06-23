<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HierarchisationDomaineActivite extends Model
{
    use HasFactory;

    protected $table = 'hierarchisation_domaines_activites';

    protected $fillable = [
        'profil_historique_id',
        'user_id',
        'domaine_activite',
        'score',
        'rang',
        'autre_precision',
    ];

    public function profilHistorique()
    {
        return $this->belongsTo(ProfilHistorique::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
