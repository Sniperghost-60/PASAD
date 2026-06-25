<?php

namespace App\Http\Controllers;

use App\Models\BilanSessionAnimationCep;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BilanSessionAnimationCepController extends Controller
{
    public function index(Request $request)
    {
        $query = BilanSessionAnimationCep::where('user_id', $request->user()->id);
        if ($request->filled('cep_id')) {
            $cepId = $request->input('cep_id');
            $query->where(function ($q) use ($cepId) {
                $q->where('cep_id', $cepId)->orWhereNull('cep_id');
            });
        }
        return response()->json($query->orderBy('date_session')->orderBy('id')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cep_id'                           => ['nullable', 'integer', 'exists:cep,id'],
            'lignes'                           => ['required', 'array', 'min:1'],
            'lignes.*.date_session'            => ['nullable', 'date'],
            'lignes.*.participation_total'     => ['nullable', 'integer', 'min:0'],
            'lignes.*.participation_h'         => ['nullable', 'integer', 'min:0'],
            'lignes.*.participation_f'         => ['nullable', 'integer', 'min:0'],
            'lignes.*.participation_jeunes'    => ['nullable', 'integer', 'min:0'],
            'lignes.*.nb_aaes'                 => ['nullable', 'integer', 'min:0'],
            'lignes.*.nb_test_urne'            => ['nullable', 'integer', 'min:0'],
            'lignes.*.sujets_speciaux'         => ['nullable', 'string'],
            'lignes.*.visiteur_nom'            => ['nullable', 'string', 'max:255'],
            'lignes.*.visiteur_structure'      => ['nullable', 'string', 'max:255'],
        ]);

        $userId = $request->user()->id;
        $cepId  = $validated['cep_id'] ?? null;

        $saved = DB::transaction(function () use ($validated, $userId, $cepId) {
            $q = BilanSessionAnimationCep::where('user_id', $userId);
            $cepId ? $q->where('cep_id', $cepId) : $q->whereNull('cep_id');
            $q->delete();

            return collect($validated['lignes'])->map(fn ($l) =>
                BilanSessionAnimationCep::create([
                    'user_id'                 => $userId,
                    'cep_id'                  => $cepId,
                    'date_session'            => $l['date_session']           ?? null,
                    'participation_total'     => $l['participation_total']    ?? null,
                    'participation_h'         => $l['participation_h']     ?? null,
                    'participation_f'         => $l['participation_f']     ?? null,
                    'participation_jeunes'    => $l['participation_jeunes'] ?? null,
                    'nb_aaes'                 => $l['nb_aaes']                ?? null,
                    'nb_test_urne'            => $l['nb_test_urne']           ?? null,
                    'sujets_speciaux'         => $l['sujets_speciaux']        ?? null,
                    'visiteur_nom'            => $l['visiteur_nom']           ?? null,
                    'visiteur_structure'      => $l['visiteur_structure']     ?? null,
                ])
            )->all();
        });

        return response()->json([
            'message' => count($saved) . ' ligne(s) enregistrée(s) avec succès !',
            'data'    => $saved,
        ], 201);
    }
}
