<?php

namespace App\Http\Controllers;

use App\Models\CaiEvolutionEspeces;
use Illuminate\Http\Request;

class CaiEvolutionEspecesController extends Controller
{
    public function index(Request $request)
    {
        $query = CaiEvolutionEspeces::where('user_id', $request->user()->id);

        if ($request->filled('commune_id')) {
            $query->where('commune_id', $request->commune_id);
        }
        if ($request->filled('date_session')) {
            $query->where('date_session', $request->date_session);
        }

        $record = $query->first();
        return response()->json($record ?? (object)[]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'date_session' => 'nullable|date',
            'commune_id'   => 'nullable|integer',
            'donnees'      => 'nullable|array',
        ]);

        $record = CaiEvolutionEspeces::updateOrCreate(
            [
                'user_id'      => $request->user()->id,
                'commune_id'   => $data['commune_id'] ?? null,
                'date_session' => $data['date_session'] ?? null,
            ],
            ['donnees' => $data['donnees'] ?? null]
        );

        return response()->json($record, 200);
    }
}
