<?php

namespace App\Http\Controllers;

use App\Models\Cep;
use App\Models\VisiteEchangeCommentee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VisiteEchangeCommenteeController extends Controller
{
    public function index(Request $request)
    {
        $query = VisiteEchangeCommentee::where('user_id', $request->user()->id);
        if ($request->filled('cep_id')) {
            $cepId = $request->input('cep_id');
            $query->where(function ($q) use ($cepId) {
                $q->where('cep_id', $cepId)->orWhereNull('cep_id');
            });
        }
        if ($request->filled('commune_id')) {
            $cepIds = Cep::where('commune_id', $request->integer('commune_id'))
                ->where('user_id', $request->user()->id)
                ->pluck('id');
            $query->whereIn('cep_id', $cepIds);
        }
        return response()->json($query->orderBy('date')->orderBy('id')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cep_id'                               => ['nullable', 'integer', 'exists:cep,id'],
            'lignes'                               => ['required', 'array', 'min:1'],
            'lignes.*.date'                        => ['nullable', 'date'],
            'lignes.*.experimentations_tests'      => ['nullable', 'array'],
            'lignes.*.experimentations_tests.*'    => ['string', 'max:500'],
            'lignes.*.visiteurs_hommes'            => ['nullable', 'integer', 'min:0'],
            'lignes.*.visiteurs_femmes'            => ['nullable', 'integer', 'min:0'],
            'lignes.*.visiteurs_jeunes'            => ['nullable', 'integer', 'min:0'],
            'lignes.*.qui_sont_visiteurs'          => ['nullable', 'array'],
            'lignes.*.qui_sont_visiteurs.*'        => ['string', 'max:500'],
            'lignes.*.ce_qui_a_marche'             => ['nullable', 'array'],
            'lignes.*.ce_qui_a_marche.*'           => ['string', 'max:500'],
            'lignes.*.ce_qui_doit_etre_ameliore'   => ['nullable', 'array'],
            'lignes.*.ce_qui_doit_etre_ameliore.*' => ['string', 'max:500'],
        ]);

        $userId = $request->user()->id;
        $cepId  = $validated['cep_id'] ?? null;

        $saved = DB::transaction(function () use ($validated, $userId, $cepId) {
            $q = VisiteEchangeCommentee::where('user_id', $userId);
            $cepId ? $q->where('cep_id', $cepId) : $q->whereNull('cep_id');
            $q->delete();

            return collect($validated['lignes'])->map(function ($l) use ($userId, $cepId) {
                $hommes = $l['visiteurs_hommes'] ?? null;
                $femmes = $l['visiteurs_femmes'] ?? null;

                return VisiteEchangeCommentee::create([
                    'user_id'                    => $userId,
                    'cep_id'                     => $cepId,
                    'date'                       => $l['date']                      ?? null,
                    'experimentations_tests'     => $l['experimentations_tests']    ?? [],
                    'visiteurs_hommes'           => $hommes,
                    'visiteurs_femmes'           => $femmes,
                    'visiteurs_jeunes'           => $l['visiteurs_jeunes'] ?? null,
                    'visiteurs_total'            => ($hommes !== null || $femmes !== null) ? ($hommes ?? 0) + ($femmes ?? 0) : null,
                    'qui_sont_visiteurs'         => $l['qui_sont_visiteurs']        ?? [],
                    'ce_qui_a_marche'            => $l['ce_qui_a_marche']           ?? [],
                    'ce_qui_doit_etre_ameliore'  => $l['ce_qui_doit_etre_ameliore'] ?? [],
                ]);
            })->all();
        });

        return response()->json([
            'message' => count($saved) . ' visite(s) enregistrée(s) avec succès !',
            'data'    => $saved,
        ], 201);
    }
}
