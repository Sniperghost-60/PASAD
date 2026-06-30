<?php

namespace App\Http\Controllers;

use App\Models\RendementDispositif;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RendementDispositifController extends Controller
{
    public function index(Request $request)
    {
        $query = RendementDispositif::with(['commune', 'arrondissement'])
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
            'cep_id'                                  => ['nullable', 'integer', 'exists:cep,id'],
            'lignes'                                  => ['required', 'array', 'min:1'],
            'lignes.*.commune_id'                     => ['nullable', 'integer', 'exists:communes,id'],
            'lignes.*.arrondissement_id'              => ['nullable', 'integer', 'exists:arrondissements,id'],
            'lignes.*.village'                        => ['nullable', 'string', 'max:255'],
            'lignes.*.nom_producteur'                 => ['nullable', 'string', 'max:255'],
            'lignes.*.culture_technologie'            => ['nullable', 'string', 'max:255'],
            'lignes.*.rendement_annee_n1'             => ['nullable', 'numeric', 'min:0'],
            'lignes.*.rendement_annee_n_technologie'  => ['nullable', 'numeric', 'min:0'],
            'lignes.*.rendement_annee_n_temoin'       => ['nullable', 'numeric', 'min:0'],
        ]);

        $userId = $request->user()->id;
        $cepId  = $validated['cep_id'] ?? null;

        $saved = DB::transaction(function () use ($validated, $userId, $cepId) {
            $q = RendementDispositif::where('user_id', $userId);
            $cepId ? $q->where('cep_id', $cepId) : $q->whereNull('cep_id');
            $q->delete();

            return collect($validated['lignes'])->map(fn ($l) =>
                RendementDispositif::create([
                    'user_id'                        => $userId,
                    'cep_id'                         => $cepId,
                    'commune_id'                     => $l['commune_id']                    ?? null,
                    'arrondissement_id'              => $l['arrondissement_id']             ?? null,
                    'village'                        => $l['village']                       ?? null,
                    'nom_producteur'                 => $l['nom_producteur']                ?? null,
                    'culture_technologie'            => $l['culture_technologie']           ?? null,
                    'rendement_annee_n1'             => $l['rendement_annee_n1']            ?? null,
                    'rendement_annee_n_technologie'  => $l['rendement_annee_n_technologie'] ?? null,
                    'rendement_annee_n_temoin'       => $l['rendement_annee_n_temoin']      ?? null,
                ])
            )->all();
        });

        return response()->json([
            'message' => count($saved) . ' ligne(s) enregistrée(s) avec succès !',
            'data'    => $saved,
        ], 201);
    }
}
