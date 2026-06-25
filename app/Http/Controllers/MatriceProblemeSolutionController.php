<?php

namespace App\Http\Controllers;

use App\Models\MatriceProbleme;
use App\Models\MatriceProblemeSolution;
use App\Models\ProfilHistorique;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MatriceProblemeSolutionController extends Controller
{
    public function index(Request $request)
    {
        $query = MatriceProbleme::with([
            'solutions',
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
            'problemes' => ['required', 'array', 'min:1'],
            'problemes.*.probleme' => ['required', 'string'],
            'problemes.*.causes' => ['nullable', 'string'],
            'problemes.*.solutions_habituelles' => ['nullable', 'array'],
            'problemes.*.solutions_habituelles.*' => ['nullable', 'string'],
            'problemes.*.solutions_proposees' => ['nullable', 'array'],
            'problemes.*.solutions_proposees.*' => ['nullable', 'string'],
        ]);

        $profil = $this->findAccessibleProfil($request, $validated['profil_historique_id']);

        $saved = DB::transaction(function () use ($validated, $profil, $request) {
            MatriceProbleme::where('profil_historique_id', $profil->id)->delete();

            return collect($validated['problemes'])->map(function ($item) use ($profil, $request) {
                $probleme = MatriceProbleme::create([
                    'profil_historique_id' => $profil->id,
                    'commune_id'           => $profil->commune_id,
                    'user_id'              => $request->user()->id,
                    'probleme'             => $item['probleme'],
                    'causes'               => $item['causes'] ?? null,
                ]);

                foreach ($item['solutions_habituelles'] ?? [] as $solution) {
                    if (blank($solution)) continue;

                    $probleme->solutions()->create([
                        'type' => 'habituelle',
                        'solution' => $solution,
                        'statut' => 'validee',
                    ]);
                }

                foreach ($item['solutions_proposees'] ?? [] as $solution) {
                    if (blank($solution)) continue;

                    $probleme->solutions()->create([
                        'type' => 'proposee',
                        'solution' => $solution,
                        'statut' => 'en_attente',
                    ]);
                }

                return $probleme->fresh('solutions');
            })->all();
        });

        return response()->json([
            'message' => 'Matrice des problèmes et solutions enregistrée avec succès !',
            'data' => $saved,
        ], 201);
    }

    public function updateSolutionStatus(Request $request, MatriceProblemeSolution $solution)
    {
        $validated = $request->validate([
            'statut' => ['required', Rule::in(['validee', 'rejetee'])],
        ]);

        $solution->load('probleme');
        $this->findAccessibleProfil($request, $solution->probleme->profil_historique_id);

        if ($solution->type !== 'proposee') {
            return response()->json([
                'message' => 'Seules les solutions proposées peuvent être validées ou rejetées.',
            ], 422);
        }

        $solution->update(['statut' => $validated['statut']]);

        return response()->json([
            'message' => $validated['statut'] === 'validee' ? 'Solution validée.' : 'Solution rejetée.',
            'data' => $solution->fresh(),
        ]);
    }

    public function updateProblemPertinence(Request $request, MatriceProbleme $probleme)
    {
        $validated = $request->validate([
            'est_pertinent' => ['required', 'boolean'],
        ]);

        $this->findAccessibleProfil($request, $probleme->profil_historique_id);
        $probleme->update(['est_pertinent' => $validated['est_pertinent']]);

        return response()->json([
            'message' => $validated['est_pertinent'] ? 'Problème marqué pertinent.' : 'Problème retiré des pertinents.',
            'data' => $probleme->fresh('solutions'),
        ]);
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
