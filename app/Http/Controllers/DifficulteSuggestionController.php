<?php

namespace App\Http\Controllers;

use App\Models\Cep;
use App\Models\DifficulteSuggestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DifficulteSuggestionController extends Controller
{
    public function index(Request $request)
    {
        $query = DifficulteSuggestion::where('user_id', $request->user()->id);
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
        return response()->json($query->orderBy('id')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cep_id'                      => ['nullable', 'integer', 'exists:cep,id'],
            'lignes'                      => ['required', 'array', 'min:1'],
            'lignes.*.difficulte'         => ['nullable', 'array'],
            'lignes.*.difficulte.*'       => ['string', 'max:1000'],
            'lignes.*.solution_utilisee'  => ['nullable', 'array'],
            'lignes.*.solution_utilisee.*'=> ['string', 'max:1000'],
            'lignes.*.suggestion'         => ['nullable', 'array'],
            'lignes.*.suggestion.*'       => ['string', 'max:1000'],
        ]);

        $userId = $request->user()->id;
        $cepId  = $validated['cep_id'] ?? null;

        $saved = DB::transaction(function () use ($validated, $userId, $cepId) {
            $q = DifficulteSuggestion::where('user_id', $userId);
            $cepId ? $q->where('cep_id', $cepId) : $q->whereNull('cep_id');
            $q->delete();

            return collect($validated['lignes'])->map(fn ($l) =>
                DifficulteSuggestion::create([
                    'user_id'           => $userId,
                    'cep_id'            => $cepId,
                    'difficulte'        => array_values(array_filter($l['difficulte']        ?? [], 'strlen')) ?: null,
                    'solution_utilisee' => array_values(array_filter($l['solution_utilisee'] ?? [], 'strlen')) ?: null,
                    'suggestion'        => array_values(array_filter($l['suggestion']        ?? [], 'strlen')) ?: null,
                ])
            )->all();
        });

        return response()->json([
            'message' => count($saved) . ' ligne(s) enregistrée(s) avec succès !',
            'data'    => $saved,
        ], 201);
    }
}
