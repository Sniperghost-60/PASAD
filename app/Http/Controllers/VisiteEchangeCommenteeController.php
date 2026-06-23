<?php

namespace App\Http\Controllers;

use App\Models\VisiteEchangeCommentee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VisiteEchangeCommenteeController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            VisiteEchangeCommentee::where('user_id', $request->user()->id)
                ->orderBy('date')
                ->orderBy('id')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'lignes'                               => ['required', 'array', 'min:1'],
            'lignes.*.date'                        => ['nullable', 'date'],
            'lignes.*.experimentations_tests'      => ['nullable', 'array'],
            'lignes.*.experimentations_tests.*'    => ['string', 'max:500'],
            'lignes.*.visiteurs_total'             => ['nullable', 'integer', 'min:0'],
            'lignes.*.visiteurs_hommes'            => ['nullable', 'integer', 'min:0'],
            'lignes.*.visiteurs_femmes'            => ['nullable', 'integer', 'min:0'],
            'lignes.*.qui_sont_visiteurs'          => ['nullable', 'array'],
            'lignes.*.qui_sont_visiteurs.*'        => ['string', 'max:500'],
            'lignes.*.ce_qui_a_marche'             => ['nullable', 'array'],
            'lignes.*.ce_qui_a_marche.*'           => ['string', 'max:500'],
            'lignes.*.ce_qui_doit_etre_ameliore'   => ['nullable', 'array'],
            'lignes.*.ce_qui_doit_etre_ameliore.*' => ['string', 'max:500'],
        ]);

        $userId = $request->user()->id;

        $saved = DB::transaction(function () use ($validated, $userId) {
            VisiteEchangeCommentee::where('user_id', $userId)->delete();

            return collect($validated['lignes'])->map(fn ($l) =>
                VisiteEchangeCommentee::create([
                    'user_id'                    => $userId,
                    'date'                       => $l['date']                      ?? null,
                    'experimentations_tests'     => $l['experimentations_tests']    ?? [],
                    'visiteurs_total'            => $l['visiteurs_total']           ?? null,
                    'visiteurs_hommes'           => $l['visiteurs_hommes']          ?? null,
                    'visiteurs_femmes'           => $l['visiteurs_femmes']          ?? null,
                    'qui_sont_visiteurs'         => $l['qui_sont_visiteurs']        ?? [],
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
