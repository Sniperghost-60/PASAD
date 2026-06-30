<?php

namespace App\Http\Controllers;

use App\Models\EvolutionRendementCep;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EvolutionRendementCepController extends Controller
{
    public function index(Request $request)
    {
        $query = EvolutionRendementCep::with(['commune', 'arrondissement'])
            ->where('user_id', $request->user()->id);
        if ($request->filled('cep_id')) {
            $cepId = $request->input('cep_id');
            $query->where(function ($q) use ($cepId) {
                $q->where('cep_id', $cepId)->orWhereNull('cep_id');
            });
        }
        if ($request->filled('commune_id')) {
            $query->where('commune_id', $request->integer('commune_id'));
        }
        return response()->json($query->orderBy('id')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cep_id'                                => ['nullable', 'integer', 'exists:cep,id'],
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
        $cepId  = $validated['cep_id'] ?? null;

        $saved = DB::transaction(function () use ($validated, $userId, $cepId) {
            $q = EvolutionRendementCep::where('user_id', $userId);
            $cepId ? $q->where('cep_id', $cepId) : $q->whereNull('cep_id');
            $q->delete();

            return collect($validated['lignes'])->map(fn ($l) =>
                EvolutionRendementCep::create([
                    'user_id'                    => $userId,
                    'cep_id'                     => $cepId,
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
