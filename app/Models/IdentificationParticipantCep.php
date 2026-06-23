<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IdentificationParticipantCep extends Model
{
    use HasFactory;

    protected $table = 'identification_participants_cep';

    protected $fillable = [
        'user_id',
        'date_session',
        'departement_id',
        'commune_id',
        'arrondissement_id',
        'village',
        'nom_producteur',
        'prenoms_producteur',
        'contact1_producteur',
        'contact2_producteur',
        'sexe',
        'annee_naissance',
        'categorie_age',
        'speculation',
        'responsabilite_fonction',
    ];

    public function user()          { return $this->belongsTo(User::class); }
    public function departement()   { return $this->belongsTo(Departement::class); }
    public function commune()       { return $this->belongsTo(Commune::class); }
    public function arrondissement(){ return $this->belongsTo(Arrondissement::class); }
}
