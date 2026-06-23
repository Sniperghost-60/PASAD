<?php

namespace App\Http\Controllers;

use App\Models\OrganisationVisiteEchange;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrganisationVisiteEchangeController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            OrganisationVisiteEchange::where('user_id', $request->user()->id)
                ->orderBy('date')
                ->orderBy('id')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'lignes'                              => ['required', 'array', 'min:1'],
            'lignes.*.date'                       => ['nullable', 'date'],
            'lignes.*.lieu_visite'                => ['nullable', 'string', 'max:255'],
            'lignes.*.nb_participants'            => ['nullable', 'integer', 'min:0'],
            'lignes.*.objectifs_visite'             => ['nullable', 'array'],
            'lignes.*.objectifs_visite.*'           => ['string', 'max:500'],
            'lignes.*.ce_qui_a_marche'              => ['nullable', 'array'],
            'lignes.*.ce_qui_a_marche.*'            => ['string', 'max:500'],
            'lignes.*.ce_qui_doit_etre_ameliore'    => ['nullable', 'array'],
            'lignes.*.ce_qui_doit_etre_ameliore.*'  => ['string', 'max:500'],
        ]);

        $userId = $request->user()->id;

        $saved = DB::transaction(function () use ($validated, $userId) {
            OrganisationVisiteEchange::where('user_id', $userId)->delete();

            return collect($validated['lignes'])->map(fn ($l) =>
                OrganisationVisiteEchange::create([
                    'user_id'                    => $userId,
                    'date'                       => $l['date']                      ?? null,
                    'lieu_visite'                => $l['lieu_visite']               ?? null,
                    'nb_participants'             => $l['nb_participants']           ?? null,
                    'objectifs_visite'           => $l['objectifs_visite']          ?? [],
                    'ce_qui_a_marche'            => $l['ce_qui_a_marche']           ?? [],
                    'ce_qui_doit_etre_ameliore'  => $l['ce_qui_doit_etre_ameliore'] ?? [],
                ])
            )->all();
        });

        return response()->json([
            'message' => count($saved) . ' visite(s) enregistrée(s) avec succès !',
            'data'    => $saved,
        ], 201);
    }
}
