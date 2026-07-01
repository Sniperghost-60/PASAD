<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CaiProgrammeQuinzaine;

class CaiProgrammeQuinzaineController extends Controller
{
    public function index(Request $request)
    {
        $query = CaiProgrammeQuinzaine::where('user_id', $request->user()->id);

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
        $validated = $request->validate([
            'date_session' => 'nullable|date',
            'commune_id'   => 'nullable|integer',
            'donnees'      => 'nullable|array',
        ]);

        $donnees = $validated['donnees'] ?? [];

        $record = CaiProgrammeQuinzaine::updateOrCreate(
            [
                'user_id'      => $request->user()->id,
                'commune_id'   => $validated['commune_id'] ?? null,
                'date_session' => $validated['date_session'] ?? null,
            ],
            ['donnees' => $donnees]
        );

        return response()->json($record, 200);
    }
}
