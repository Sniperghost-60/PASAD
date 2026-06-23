<?php

namespace App\Http\Controllers;

use App\Models\DifficulteSuggestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DifficulteSuggestionController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            DifficulteSuggestion::where('user_id', $request->user()->id)
                ->orderBy('id')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'lignes'                    => ['required', 'array', 'min:1'],
            'lignes.*.difficulte'       => ['nullable', 'string'],
            'lignes.*.solution_utilisee' => ['nullable', 'string'],
            'lignes.*.suggestion'       => ['nullable', 'string'],
        ]);

        $userId = $request->user()->id;

        $saved = DB::transaction(function () use ($validated, $userId) {
            DifficulteSuggestion::where('user_id', $userId)->delete();

            return collect($validated['lignes'])->map(fn ($l) =>
                DifficulteSuggestion::create([
                    'user_id'           => $userId,
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
