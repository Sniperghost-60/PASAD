<?php

namespace App\Http\Controllers;

use App\Models\CurriculumApprentissageCep;
use App\Models\ProfilHistorique;
use App\Models\ResumeProtocoleExperimentation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResumeProtocoleExperimentationController extends Controller
{
    public function problemesDisponibles(Request $request)
    {
        $validated = $request->validate([
            'profil_historique_id' => ['required', 'integer', 'exists:profil_historique,id'],
        ]);

        $profil = $this->findAccessibleProfil($request, $validated['profil_historique_id']);

        $problemes = CurriculumApprentissageCep::where('profil_historique_id', $profil->id)
            ->with('probleme')
            ->get()
            ->unique('matrice_probleme_id')
            ->map(fn ($row) => [
                'id'       => $row->matrice_probleme_id,
                'probleme' => $row->probleme?->probleme ?? '(inconnu)',
            ])
            ->values();

        return response()->json($problemes);
    }

    public function index(Request $request)
    {
        $query = ResumeProtocoleExperimentation::with(['probleme', 'profilHistorique', 'user']);

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
            'profil_historique_id'                       => ['required', 'integer', 'exists:profil_historique,id'],
            'experimentations'                           => ['required', 'array', 'min:1'],
            'experimentations.*.matrice_probleme_id'     => ['required', 'integer', 'exists:matrice_problemes,id'],
            'experimentations.*.titre_experimentation'   => ['nullable', 'string'],
            'experimentations.*.dispositif_experimental' => ['nullable', 'string'],
            'experimentations.*.sujet_special'           => ['nullable', 'string'],
        ]);

        $profil = $this->findAccessibleProfil($request, $validated['profil_historique_id']);

        // Vérifier que les problèmes viennent bien du curriculum CEP de ce village
        $curriculumIds = CurriculumApprentissageCep::where('profil_historique_id', $profil->id)
            ->pluck('matrice_probleme_id')
            ->unique();

        foreach ($validated['experimentations'] as $exp) {
            if (! $curriculumIds->contains((int) $exp['matrice_probleme_id'])) {
                return response()->json([
                    'message' => 'Chaque expérimentation doit être liée à un problème du curriculum CEP de ce village.',
                ], 422);
            }
        }

        $hasTitre = collect($validated['experimentations'])
            ->filter(fn ($e) => filled($e['titre_experimentation'] ?? null))
            ->isNotEmpty();

        if (! $hasTitre) {
            return response()->json([
                'message' => "Ajoutez au moins un titre d'expérimentation.",
            ], 422);
        }

        $saved = DB::transaction(function () use ($validated, $profil, $request) {
            ResumeProtocoleExperimentation::where('profil_historique_id', $profil->id)->delete();

            return collect($validated['experimentations'])->map(fn ($exp) =>
                ResumeProtocoleExperimentation::create([
                    'profil_historique_id'    => $profil->id,
                    'commune_id'              => $profil->commune_id,
                    'matrice_probleme_id'     => $exp['matrice_probleme_id'],
                    'user_id'                 => $request->user()->id,
                    'titre_experimentation'   => $exp['titre_experimentation'] ?? '',
                    'dispositif_experimental' => $exp['dispositif_experimental'] ?? null,
                    'sujet_special'           => $exp['sujet_special'] ?? null,
                ])
            )->all();
        });

        return response()->json([
            'message' => 'Résumé des protocoles enregistré avec succès !',
            'data'    => $saved,
        ], 201);
    }

    private function profilsAccessibles(Request $request)
    {
        $query = ProfilHistorique::with(['departement', 'commune', 'arrondissement']);
        $user  = $request->user();

        if ($user->hasRole('Conseiller')) {
            $communeIds        = $user->communes->pluck('id');
            $arrondissementIds = $user->arrondissements->pluck('id');

            $query->where(function ($q) use ($communeIds, $arrondissementIds) {
                $q->whereIn('commune_id', $communeIds)
                  ->orWhereIn('arrondissement_id', $arrondissementIds);
            });
        }

        $query->when(
            $request->filled('commune_id'),
            fn ($q) => $q->where('commune_id', $request->integer('commune_id'))
        );

        return $query;
    }

    private function findAccessibleProfil(Request $request, int $id): ProfilHistorique
    {
        return $this->profilsAccessibles($request)->findOrFail($id);
    }
}
