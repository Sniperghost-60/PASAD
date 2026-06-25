<?php

namespace App\Http\Controllers;

use App\Models\HierarchisationSpeculationAgricole;
use App\Models\ProfilHistorique;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class HierarchisationSpeculationAgricoleController extends Controller
{
    private const SPECULATIONS_FIXES = [
        'Soja',
        'Maïs',
        'Riz',
        'Manioc',
        'Niébé',
        "Pois d'angole",
        'Mucuna',
        'Igname',
    ];

    private const SPECULATIONS = [
        'Soja',
        'Maïs',
        'Riz',
        'Manioc',
        'Niébé',
        "Pois d'angole",
        'Mucuna',
        'Igname',
        'Autre à préciser',
    ];

    public function index(Request $request)
    {
        $query = HierarchisationSpeculationAgricole::with([
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

        return response()->json($query->orderBy('rang')->orderBy('id')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'profil_historique_id' => ['required', 'integer', 'exists:profil_historique,id'],
            'speculations' => ['required', 'array', 'min:9'],
            'speculations.*.speculation_agricole' => ['required', 'string', Rule::in(self::SPECULATIONS)],
            'speculations.*.score' => ['nullable', 'integer', 'min:0'],
            'speculations.*.autre_precision' => ['nullable', 'string', 'max:255'],
        ]);

        $profil = $this->findAccessibleProfil($request, $validated['profil_historique_id']);
        $speculations = collect($validated['speculations'])
            ->filter(fn ($speculation) => $speculation['speculation_agricole'] !== 'Autre à préciser' || filled($speculation['score']) || filled($speculation['autre_precision']))
            ->values()
            ->all();

        $speculationsFixes = collect($speculations)
            ->whereIn('speculation_agricole', self::SPECULATIONS_FIXES)
            ->pluck('speculation_agricole')
            ->unique();

        if ($speculationsFixes->count() !== count(self::SPECULATIONS_FIXES)) {
            return response()->json([
                'message' => 'Toutes les spéculations fixes doivent être présentes.',
            ], 422);
        }

        foreach ($speculations as $speculation) {
            if ($speculation['speculation_agricole'] === 'Autre à préciser' && filled($speculation['score']) && blank($speculation['autre_precision'] ?? null)) {
                return response()->json([
                    'message' => 'Veuillez préciser le nom de chaque autre spéculation renseignée.',
                ], 422);
            }
        }

        $speculations = $this->calculerRangs($speculations);

        $saved = DB::transaction(function () use ($speculations, $profil, $request) {
            HierarchisationSpeculationAgricole::where('profil_historique_id', $profil->id)->delete();

            return collect($speculations)->map(fn ($speculation) => HierarchisationSpeculationAgricole::create([
                'profil_historique_id' => $profil->id,
                'commune_id'           => $profil->commune_id,
                'user_id'              => $request->user()->id,
                'domaine_activite'     => 'Agriculture',
                'speculation_agricole' => $speculation['speculation_agricole'],
                'score'                => $speculation['score'] ?? null,
                'rang'                 => $speculation['rang'] ?? null,
                'autre_precision'      => $speculation['autre_precision'] ?? null,
            ]))->all();
        });

        return response()->json([
            'message' => 'Hiérarchisation des spéculations enregistrée avec succès !',
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

    private function calculerRangs(array $speculations): array
    {
        $avecScores = collect($speculations)
            ->filter(fn ($speculation) => filled($speculation['score'] ?? null))
            ->sortByDesc(fn ($speculation) => (int) $speculation['score'])
            ->values();

        $rangs = [];
        $rang = 1;

        foreach ($avecScores as $speculation) {
            $rangs[] = [
                'speculation_agricole' => $speculation['speculation_agricole'],
                'autre_precision' => $speculation['autre_precision'] ?? null,
                'score' => (int) $speculation['score'],
                'rang' => $rang,
            ];
            $rang++;
        }

        return collect($speculations)->map(function ($speculation) use (&$rangs) {
            if (! filled($speculation['score'] ?? null)) {
                return [
                    ...$speculation,
                    'score' => null,
                    'rang' => null,
                ];
            }

            $rangIndex = collect($rangs)->search(fn ($rang) =>
                $rang['speculation_agricole'] === $speculation['speculation_agricole']
                && ($rang['autre_precision'] ?? null) === ($speculation['autre_precision'] ?? null)
                && $rang['score'] === (int) $speculation['score']
            );

            $result = $rangs[$rangIndex];
            unset($rangs[$rangIndex]);
            $rangs = array_values($rangs);

            return [
                ...$speculation,
                'score' => (int) $speculation['score'],
                'rang' => $result['rang'],
            ];
        })->all();
    }
}
