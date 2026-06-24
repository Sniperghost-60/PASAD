<?php

namespace App\Http\Controllers;

use App\Models\RapportDemarrageCep;
use Illuminate\Http\Request;

class RapportDemarrageCepController extends Controller
{
    public function index(Request $request)
    {
        $query = RapportDemarrageCep::with('commune')
            ->where('user_id', $request->user()->id);

        if ($request->filled('cep_id')) {
            $query->where('cep_id', $request->input('cep_id'));
        }

        return response()->json($query->first());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cep_id'                       => ['nullable', 'integer', 'exists:cep,id'],
            'departement'                  => ['nullable', 'string', 'max:255'],
            'commune_id'                   => ['nullable', 'integer', 'exists:communes,id'],
            'facilitateur'                 => ['nullable', 'string', 'max:255'],
            'structure'                    => ['nullable', 'string', 'max:255'],
            'telephone'                    => ['nullable', 'string', 'max:50'],
            'longitude'                    => ['nullable', 'string', 'max:100'],
            'latitude'                     => ['nullable', 'string', 'max:100'],
            'beneficiaires_villages'       => ['nullable', 'string'],
            'raison_installation'          => ['nullable', 'string'],
            'seance_sensibilisation'       => ['nullable', 'boolean'],
            'sensibilisation_total'        => ['nullable', 'integer', 'min:0'],
            'sensibilisation_hommes'       => ['nullable', 'integer', 'min:0'],
            'sensibilisation_femmes'       => ['nullable', 'integer', 'min:0'],
            'sensibilisation_autorites'    => ['nullable', 'string'],
            'enquete_base'                 => ['nullable', 'boolean'],
            'enquete_nb_seances'           => ['nullable', 'integer', 'min:0'],
            'enquete_total'                => ['nullable', 'integer', 'min:0'],
            'enquete_hommes'               => ['nullable', 'integer', 'min:0'],
            'enquete_femmes'               => ['nullable', 'integer', 'min:0'],
            'enquete_resultats_restitues'  => ['nullable', 'boolean'],
            'enquete_details'              => ['nullable', 'string'],
            'apprenants_total'             => ['nullable', 'integer', 'min:0'],
            'apprenants_hommes'            => ['nullable', 'integer', 'min:0'],
            'apprenants_femmes'            => ['nullable', 'integer', 'min:0'],
            'choix_participants'           => ['nullable', 'string'],
            'nom_groupe'                   => ['nullable', 'string', 'max:255'],
            'slogan_groupe'                => ['nullable', 'string', 'max:255'],
            'jour_animation'               => ['nullable', 'string', 'max:100'],
            'constitution_definie'         => ['nullable', 'boolean'],
            'sous_groupes'                 => ['nullable', 'boolean'],
            'nb_sous_groupes'              => ['nullable', 'integer', 'min:0'],
            'comite_en_place'              => ['nullable', 'boolean'],
            'postes_comite'                => ['nullable', 'array'],
            'postes_comite.*'              => ['string'],
            'autres_postes'                => ['nullable', 'string'],
            'site_identifie'               => ['nullable', 'boolean'],
            'statut_site'                  => ['nullable', 'string', 'in:accord_cession,communautaire,location'],
        ]);

        $cepId   = $validated['cep_id'] ?? null;
        $rapport = RapportDemarrageCep::updateOrCreate(
            ['user_id' => $request->user()->id, 'cep_id' => $cepId],
            array_merge($validated, ['user_id' => $request->user()->id, 'cep_id' => $cepId])
        );

        return response()->json([
            'message' => 'Rapport enregistré avec succès !',
            'data'    => $rapport,
        ], 201);
    }
}
