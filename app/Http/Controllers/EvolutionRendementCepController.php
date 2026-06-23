<?php

namespace App\Http\Controllers;

use App\Models\EvolutionRendementCep;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EvolutionRendementCepController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            EvolutionRendementCep::with(['commune', 'arrondissement'])
                ->where('user_id', $request->user()->id)
                ->orderBy('id')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'lignes'                                => ['required', 'array', 'min:1'],
            'lignes.*.commune_id'                   => ['nullable', 'integer', 'exists:communes,id'],
            'lignes.*.arrondissement_id'            => ['nullable', 'integer', 'exists:arrondissements,id'],
            'lignes.*.village'                      => ['nullable', 'string', 'max:255'],
            'lignes.*.type_experimentation_cep'     => ['nullable', 'string', 'max:255'],
            'lignes.*.culture'                      => ['nullable', 'string', 'max:255'],
            'lignes.*.technologies_dispositif_1'    => ['nullable', 'string', 'max:255'],
            'lignes.*.technologies_dispositif_2'    => ['nullable', 'string', 'max:255'],
            'lignes.*.technologies_dispositif_3'    => ['nullable', 'string', 'max:255'],
            'lignes.*.technologies_dispositif_4'    => ['nullable', 'string', 'max:255'],
            'lignes.*.rendement_dispositif_1'       => ['nullable', 'numeric', 'min:0'],
            'lignes.*.rendement_dispositif_2'       => ['nullable', 'numeric', 'min:0'],
            'lignes.*.rendement_dispositif_3'       => ['nullable', 'numeric', 'min:0'],
            'lignes.*.rendement_dispositif_4'       => ['nullable', 'numeric', 'min:0'],
        ]);

        $userId = $request->user()->id;

        $saved = DB::transaction(function () use ($validated, $userId) {
            EvolutionRendementCep::where('user_id', $userId)->delete();

            return collect($validated['lignes'])->map(fn ($l) =>
                EvolutionRendementCep::create([
                    'user_id'                    => $userId,
                    'commune_id'                 => $l['commune_id']                ?? null,
                    'arrondissement_id'          => $l['arrondissement_id']         ?? null,
                    'village'                    => $l['village']                   ?? null,
                    'type_experimentation_cep'   => $l['type_experimentation_cep']  ?? null,
                    'culture'                    => $l['culture']                   ?? null,
                    'technologies_dispositif_1'  => $l['technologies_dispositif_1'] ?? null,
                    'technologies_dispositif_2'  => $l['technologies_dispositif_2'] ?? null,
                    'technologies_dispositif_3'  => $l['technologies_dispositif_3'] ?? null,
                    'technologies_dispositif_4'  => $l['technologies_dispositif_4'] ?? null,
                    'rendement_dispositif_1'     => $l['rendement_dispositif_1']    ?? null,
                    'rendement_dispositif_2'     => $l['rendement_dispositif_2']    ?? null,
                    'rendement_dispositif_3'     => $l['rendement_dispositif_3']    ?? null,
                    'rendement_dispositif_4'     => $l['rendement_dispositif_4']    ?? null,
                ])
            )->all();
        });

        return response()->json([
            'message' => count($saved) . ' ligne(s) enregistrée(s) avec succès !',
            'data'    => $saved,
        ], 201);
    }
}
