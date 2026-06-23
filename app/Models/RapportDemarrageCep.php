<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RapportDemarrageCep extends Model
{
    protected $table = 'rapport_demarrage_cep';

    protected $fillable = [
        'user_id', 'departement', 'commune_id', 'facilitateur', 'structure', 'telephone',
        'longitude', 'latitude',
        'beneficiaires_villages', 'raison_installation',
        'seance_sensibilisation', 'sensibilisation_total', 'sensibilisation_hommes',
        'sensibilisation_femmes', 'sensibilisation_autorites',
        'enquete_base', 'enquete_nb_seances', 'enquete_total', 'enquete_hommes',
        'enquete_femmes', 'enquete_resultats_restitues', 'enquete_details',
        'apprenants_total', 'apprenants_hommes', 'apprenants_femmes',
        'choix_participants', 'nom_groupe', 'slogan_groupe', 'jour_animation',
        'constitution_definie', 'sous_groupes', 'nb_sous_groupes',
        'comite_en_place', 'postes_comite', 'autres_postes',
        'site_identifie', 'statut_site',
    ];

    protected $casts = [
        'seance_sensibilisation'       => 'boolean',
        'enquete_base'                 => 'boolean',
        'enquete_resultats_restitues'  => 'boolean',
        'constitution_definie'         => 'boolean',
        'sous_groupes'                 => 'boolean',
        'comite_en_place'              => 'boolean',
        'site_identifie'               => 'boolean',
        'postes_comite'                => 'array',
    ];

    public function user()    { return $this->belongsTo(User::class); }
    public function commune() { return $this->belongsTo(Commune::class); }
}
