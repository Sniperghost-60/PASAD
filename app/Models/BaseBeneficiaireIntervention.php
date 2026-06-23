<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BaseBeneficiaireIntervention extends Model
{
    protected $table = 'base_beneficiaires_intervention';

    protected $fillable = [
        'user_id', 'date_session',
        'identification_participant_cep_id',
        'departement_id', 'commune_id', 'arrondissement_id', 'village',
        'nom_producteur', 'prenoms_producteur',
        'contact1_producteur', 'contact2_producteur',
        'sexe', 'annee_naissance', 'type_producteur',
        'type_parcelle', 'superficie_totale',
        'pratique_agroecologique_1', 'pratique_agroecologique_2', 'pratique_agroecologique_3',
        'coordonnee_x', 'coordonnee_y',
        'culture_principale', 'culture_associee',
    ];

    public function user()              { return $this->belongsTo(User::class); }
    public function departement()       { return $this->belongsTo(Departement::class); }
    public function commune()           { return $this->belongsTo(Commune::class); }
    public function arrondissement()    { return $this->belongsTo(Arrondissement::class); }
    public function participantCep()    { return $this->belongsTo(IdentificationParticipantCep::class, 'identification_participant_cep_id'); }
}
