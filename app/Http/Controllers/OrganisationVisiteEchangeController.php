<?php

namespace App\Http\Controllers;

use App\Models\OrganisationVisiteEchange;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrganisationVisiteEchangeController extends Controller
{
    public function index(Request $request)
    {
        $query = OrganisationVisiteEchange::where('user_id', $request->user()->id);
        if ($request->filled('cep_id')) {
            $cepId = $request->input('cep_id');
            $query->where(function ($q) use ($cepId) {
                $q->where('cep_id', $cepId)->orWhereNull('cep_id');
            });
        }
        return response()->json($query->orderBy('date')->orderBy('id')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cep_id'                              => ['nullable', 'integer', 'exists:cep,id'],
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
        $cepId  = $validated['cep_id'] ?? null;

        $saved = DB::transaction(function () use ($validated, $userId, $cepId) {
            $q = OrganisationVisiteEchange::where('user_id', $userId);
            $cepId ? $q->where('cep_id', $cepId) : $q->whereNull('cep_id');
            $q->delete();

            return collect($validated['lignes'])->map(fn ($l) =>
                OrganisationVisiteEchange::create([
                    'user_id'                    => $userId,
                    'cep_id'                     => $cepId,
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
