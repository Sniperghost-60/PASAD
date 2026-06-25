<?php

namespace App\Http\Controllers;

use App\Models\CurriculumApprentissageCep;
use App\Models\MatriceProbleme;
use App\Models\ProfilHistorique;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CurriculumApprentissageCepController extends Controller
{
    public function problemesPertinents(Request $request)
    {
        $validated = $request->validate([
            'profil_historique_id' => ['required', 'integer', 'exists:profil_historique,id'],
        ]);

        $profil = $this->findAccessibleProfil($request, $validated['profil_historique_id']);

        return response()->json(
            MatriceProbleme::where('profil_historique_id', $profil->id)
                ->where('est_pertinent', true)
                ->orderBy('id')
                ->get()
        );
    }

    public function index(Request $request)
    {
        $query = CurriculumApprentissageCep::with([
            'probleme',
            'profilHistorique.departement',
            'profilHistorique.commune',
            'profilHistorique.arrondissement',
            'user',
        ]);

        if ($request->filled('profil_historique_id')) {
            $profil = $this->findAccessibleProfil($request, $request->integer('profil_historique_id'));
            $query->where('profil_historique_id', $profil->id);
        } else {
            $accessibleIds = $this->profilsAccessibles($request)->pluck('id');
            $query->whereIn('profil_historique_id', $accessibleIds);
        }

        return response()->json($query->orderBy('id')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'profil_historique_id' => ['required', 'integer', 'exists:profil_historique,id'],
            'activites' => ['required', 'array', 'min:1'],
            'activites.*.matrice_probleme_id' => ['required', 'integer', 'exists:matrice_problemes,id'],
            'activites.*.option_solution_tester' => ['nullable', 'string'],
            'activites.*.quoi_faire_activite' => ['nullable', 'string'],
            'activites.*.moyens' => ['nullable', 'string'],
            'activites.*.periode_debut' => ['nullable', 'date'],
            'activites.*.periode_fin' => ['nullable', 'date'],
            'activites.*.responsable' => ['nullable', 'string', 'max:255'],
        ]);

        $profil = $this->findAccessibleProfil($request, $validated['profil_historique_id']);
        $pertinentIds = MatriceProbleme::where('profil_historique_id', $profil->id)
            ->where('est_pertinent', true)
            ->pluck('id');

        if (collect($validated['activites'])->whereNotNull('option_solution_tester')->filter(fn ($activite) => filled($activite['option_solution_tester']))->isEmpty()) {
            return response()->json([
                'message' => 'Ajoutez au moins une option à tester.',
            ], 422);
        }

        if (collect($validated['activites'])->whereNotNull('quoi_faire_activite')->filter(fn ($activite) => filled($activite['quoi_faire_activite']))->isEmpty()) {
            return response()->json([
                'message' => 'Ajoutez au moins une activité.',
            ], 422);
        }

        foreach ($validated['activites'] as $activite) {
            if (! $pertinentIds->contains((int) $activite['matrice_probleme_id'])) {
                return response()->json([
                    'message' => 'Chaque activité doit être liée à un problème pertinent du village.',
                ], 422);
            }

            if (! empty($activite['periode_debut']) && ! empty($activite['periode_fin']) && $activite['periode_fin'] < $activite['periode_debut']) {
                return response()->json([
                    'message' => 'La fin de période doit être après le début.',
                ], 422);
            }
        }

        $saved = DB::transaction(function () use ($validated, $profil, $request) {
            CurriculumApprentissageCep::where('profil_historique_id', $profil->id)->delete();

            return collect($validated['activites'])->map(fn ($activite) => CurriculumApprentissageCep::create([
                'profil_historique_id'   => $profil->id,
                'commune_id'             => $profil->commune_id,
                'matrice_probleme_id'    => $activite['matrice_probleme_id'],
                'user_id'                => $request->user()->id,
                'option_solution_tester' => $activite['option_solution_tester'] ?? '',
                'quoi_faire_activite'    => $activite['quoi_faire_activite'] ?? '',
                'moyens'                 => $activite['moyens'] ?? null,
                'periode_debut'          => $activite['periode_debut'] ?? null,
                'periode_fin'            => $activite['periode_fin'] ?? null,
                'responsable'            => $activite['responsable'] ?? null,
            ]))->all();
        });

        return response()->json([
            'message' => "Curriculum d'apprentissage enregistré avec succès !",
            'data' => $saved,
        ], 201);
    }

    private function profilsAccessibles(Request $request)
    {
        $query = ProfilHistorique::with(['departement', 'commune', 'arrondissement']);
        $user = $request->user();

        if ($user->hasRole('Conseiller')) {
            $communeIds = $user->communes->pluck('id');
            $arrondissementIds = $user->arrondissements->pluck('id');

            $query->where(function ($q) use ($communeIds, $arrondissementIds) {
                $q->whereIn('commune_id', $communeIds)
                    ->orWhereIn('arrondissement_id', $arrondissementIds);
            });
        }

        return $query;
    }

    private function findAccessibleProfil(Request $request, int $id): ProfilHistorique
    {
        return $this->profilsAccessibles($request)->findOrFail($id);
    }
}
