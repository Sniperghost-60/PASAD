<?php

namespace App\Http\Controllers;

use App\Models\ProfilHistorique;
use Illuminate\Http\Request;

class ProfilHistoriqueController extends Controller
{
    public function index(Request $request)
    {
        $query = ProfilHistorique::with(['user', 'departement', 'commune', 'arrondissement']);

        // Si l'utilisateur est un conseiller, filtrer par ses zones
        $user = $request->user();
        if ($user->hasRole('Conseiller')) {
            $communeIds = $user->communes->pluck('id');
            $arrondissementIds = $user->arrondissements->pluck('id');

            $query->where(function($q) use ($communeIds, $arrondissementIds) {
                $q->whereIn('commune_id', $communeIds)
                  ->orWhereIn('arrondissement_id', $arrondissementIds);
            });
        }

        // Filtre par commune sélectionnée (mobile)
        $query->when(
            $request->filled('commune_id'),
            fn ($q) => $q->where('commune_id', $request->integer('commune_id'))
        );

        $profils = $query->orderBy('annee', 'desc')->get();

        return response()->json($profils);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'commune_id'          => 'required|exists:communes,id',
            'arrondissement_id'   => 'required|exists:arrondissements,id',
            'village'             => 'required|string|max:255',
            'events'              => 'required|array|min:1',
            'events.*.annee'      => 'required|integer|min:1900|max:2100',
            'events.*.evenements' => 'required|string',
            'events.*.impact'     => 'required|string',
        ]);

        // Récupérer le departement_id depuis la commune
        $commune = \App\Models\Commune::with('departement')->findOrFail($validated['commune_id']);

        $created = [];
        foreach ($validated['events'] as $event) {
            $created[] = ProfilHistorique::create([
                'user_id'           => $request->user()->id,
                'departement_id'    => $commune->departement_id,
                'commune_id'        => $validated['commune_id'],
                'arrondissement_id' => $validated['arrondissement_id'],
                'village'           => $validated['village'],
                'annee'             => $event['annee'],
                'evenements'        => $event['evenements'],
                'impact'            => $event['impact'],
            ]);
        }

        return response()->json([
            'message' => count($created) . ' événement(s) enregistré(s) avec succès !',
            'data' => $created
        ], 201);
    }

    public function show($id)
    {
        $profil = ProfilHistorique::with(['user', 'departement', 'commune', 'arrondissement'])->findOrFail($id);
        return response()->json($profil);
    }

    public function update(Request $request, $id)
    {
        $profil = ProfilHistorique::findOrFail($id);

        $validated = $request->validate([
            'departement_id' => 'sometimes|exists:departements,id',
            'commune_id' => 'sometimes|exists:communes,id',
            'arrondissement_id' => 'sometimes|exists:arrondissements,id',
            'village' => 'sometimes|string|max:255',
            'annee' => 'sometimes|integer|min:1900|max:2100',
            'evenements' => 'sometimes|string',
            'impact' => 'sometimes|string',
        ]);

        $profil->update($validated);

        return response()->json([
            'message' => 'Profil historique mis à jour avec succès !',
            'data' => $profil->fresh(['user', 'departement', 'commune', 'arrondissement'])
        ]);
    }

    public function destroy($id)
    {
        $profil = ProfilHistorique::findOrFail($id);
        $profil->delete();

        return response()->json([
            'message' => 'Profil historique supprimé avec succès !'
        ]);
    }
}
