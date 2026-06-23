<?php

namespace App\Http\Controllers;

use App\Models\HierarchisationDomaineActivite;
use App\Models\ProfilHistorique;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class HierarchisationDomaineActiviteController extends Controller
{
    private const DOMAINES_FIXES = [
        'Agriculture',
        'Elevage',
        'Foresterie',
        'Artisanat',
        'Transport',
        'Transformation',
        'Pêche',
    ];

    private const DOMAINES = [
        'Agriculture',
        'Elevage',
        'Foresterie',
        'Artisanat',
        'Transport',
        'Transformation',
        'Pêche',
        'Autre à préciser',
    ];

    public function villages(Request $request)
    {
        $profils = $this->profilsAccessibles($request)
            ->orderBy('village')
            ->orderBy('created_at')
            ->get();

        $villages = $profils
            ->groupBy(fn ($profil) => $profil->commune_id.'|'.$profil->arrondissement_id.'|'.mb_strtolower($profil->village))
            ->map(function ($items) {
                $profil = $items->first();

                return [
                    'profil_historique_id' => $profil->id,
                    'village' => $profil->village,
                    'commune' => $profil->commune,
                    'arrondissement' => $profil->arrondissement,
                    'departement' => $profil->departement,
                    'events_count' => $items->count(),
                ];
            })
            ->values();

        return response()->json($villages);
    }

    public function index(Request $request)
    {
        $query = HierarchisationDomaineActivite::with([
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
            'domaines' => ['required', 'array', 'min:8'],
            'domaines.*.domaine_activite' => ['required', 'string', Rule::in(self::DOMAINES)],
            'domaines.*.score' => ['nullable', 'integer', 'min:0'],
            'domaines.*.autre_precision' => ['nullable', 'string', 'max:255'],
        ]);

        $profil = $this->findAccessibleProfil($request, $validated['profil_historique_id']);
        $domaines = collect($validated['domaines'])
            ->filter(fn ($domaine) => $domaine['domaine_activite'] !== 'Autre à préciser' || filled($domaine['score']) || filled($domaine['autre_precision']))
            ->values()
            ->all();

        $domainesFixes = collect($domaines)
            ->whereIn('domaine_activite', self::DOMAINES_FIXES)
            ->pluck('domaine_activite')
            ->unique();

        if ($domainesFixes->count() !== count(self::DOMAINES_FIXES)) {
            return response()->json([
                'message' => 'Tous les domaines fixes doivent être présents.',
            ], 422);
        }

        foreach ($domaines as $domaine) {
            if ($domaine['domaine_activite'] === 'Autre à préciser' && filled($domaine['score']) && blank($domaine['autre_precision'] ?? null)) {
                return response()->json([
                    'message' => 'Veuillez préciser le nom de chaque autre domaine renseigné.',
                ], 422);
            }
        }

        $domaines = $this->calculerRangs($domaines);

        $saved = DB::transaction(function () use ($domaines, $profil, $request) {
            HierarchisationDomaineActivite::where('profil_historique_id', $profil->id)->delete();

            return collect($domaines)->map(fn ($domaine) => HierarchisationDomaineActivite::create([
                'profil_historique_id' => $profil->id,
                'user_id' => $request->user()->id,
                'domaine_activite' => $domaine['domaine_activite'],
                'score' => $domaine['score'] ?? null,
                'rang' => $domaine['rang'] ?? null,
                'autre_precision' => $domaine['autre_precision'] ?? null,
            ]))->all();
        });

        return response()->json([
            'message' => 'Hiérarchisation enregistrée avec succès !',
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

    private function calculerRangs(array $domaines): array
    {
        $avecScores = collect($domaines)
            ->filter(fn ($domaine) => filled($domaine['score'] ?? null))
            ->sortByDesc(fn ($domaine) => (int) $domaine['score'])
            ->values();

        $rangs = [];
        $rang = 1;

        foreach ($avecScores as $domaine) {
            $rangs[] = [
                'domaine_activite' => $domaine['domaine_activite'],
                'autre_precision' => $domaine['autre_precision'] ?? null,
                'score' => (int) $domaine['score'],
                'rang' => $rang,
            ];
            $rang++;
        }

        return collect($domaines)->map(function ($domaine) use (&$rangs) {
            if (! filled($domaine['score'] ?? null)) {
                return [
                    ...$domaine,
                    'score' => null,
                    'rang' => null,
                ];
            }

            $rangIndex = collect($rangs)->search(fn ($rang) =>
                $rang['domaine_activite'] === $domaine['domaine_activite']
                && ($rang['autre_precision'] ?? null) === ($domaine['autre_precision'] ?? null)
                && $rang['score'] === (int) $domaine['score']
            );

            $result = $rangs[$rangIndex];
            unset($rangs[$rangIndex]);
            $rangs = array_values($rangs);

            return [
                ...$domaine,
                'score' => (int) $domaine['score'],
                'rang' => $result['rang'],
            ];
        })->all();
    }
}
