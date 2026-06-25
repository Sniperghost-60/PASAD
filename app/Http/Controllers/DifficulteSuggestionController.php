<?php

namespace App\Http\Controllers;

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
        return response()->json($query->orderBy('id')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cep_id'                    => ['nullable', 'integer', 'exists:cep,id'],
            'lignes'                    => ['required', 'array', 'min:1'],
            'lignes.*.difficulte'       => ['nullable', 'string'],
            'lignes.*.solution_utilisee' => ['nullable', 'string'],
            'lignes.*.suggestion'       => ['nullable', 'string'],
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
                    'difficulte'        => $l['difficulte']        ?? null,
                    'solution_utilisee' => $l['solution_utilisee'] ?? null,
                    'suggestion'        => $l['suggestion']        ?? null,
                ])
            )->all();
        });

        return response()->json([
            'message' => count($saved) . ' ligne(s) enregistrée(s) avec succès !',
            'data'    => $saved,
        ], 201);
    }
}
