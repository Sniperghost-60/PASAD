<?php

namespace App\Http\Controllers;

use App\Models\CaiEtudeMarche;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CaiEtudeMarcheController extends Controller
{
    public function index(Request $request)
    {
        $communeId = $request->query('commune_id');

        $rows = CaiEtudeMarche::where('user_id', Auth::id())
            ->when($communeId, fn($q) => $q->where('commune_id', $communeId))
            ->get();

        return response()->json($rows);
    }

    public function store(Request $request)
    {
        $request->validate([
            'commune_id'                       => 'nullable|exists:communes,id',
            'rows'                             => 'required|array',
            'rows.*.categorie'                 => 'required|string',
            'rows.*.parametre'                 => 'required|string',
            'rows.*.tendances_marches'         => 'nullable|array',
            'rows.*.tendances_marches.*'       => 'string',
            'rows.*.situation_exploitation'    => 'nullable|array',
            'rows.*.situation_exploitation.*'  => 'string',
            'rows.*.ecarts_combler'            => 'nullable|array',
            'rows.*.ecarts_combler.*'          => 'string',
        ]);

        $communeId = $request->input('commune_id');
        $rows      = $request->input('rows', []);

        $normalize = fn (?array $values) => collect($values ?? [])
            ->map(fn ($v) => trim((string) $v))
            ->filter()
            ->values()
            ->all();

        foreach ($rows as $row) {
            CaiEtudeMarche::updateOrCreate(
                [
                    'user_id'    => Auth::id(),
                    'commune_id' => $communeId,
                    'parametre'  => $row['parametre'],
                ],
                [
                    'categorie'              => $row['categorie'],
                    'tendances_marches'      => $normalize($row['tendances_marches']      ?? []),
                    'situation_exploitation' => $normalize($row['situation_exploitation'] ?? []),
                    'ecarts_combler'         => $normalize($row['ecarts_combler']         ?? []),
                ]
            );
        }

        return response()->json(['message' => 'Fiche enregistrée'], 201);
    }
}
