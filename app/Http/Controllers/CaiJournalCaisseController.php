<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CaiJournalCaisse;

class CaiJournalCaisseController extends Controller
{
    public function index(Request $request)
    {
        $query = CaiJournalCaisse::where('user_id', $request->user()->id);

        if ($request->filled('commune_id')) {
            $query->where('commune_id', $request->commune_id);
        }

        $record = $query->first();
        return response()->json($record ?? (object)[]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'commune_id' => 'nullable|integer',
            'donnees'    => 'nullable|array',
        ]);

        $record = CaiJournalCaisse::updateOrCreate(
            [
                'user_id'    => $request->user()->id,
                'commune_id' => $validated['commune_id'] ?? null,
            ],
            ['donnees' => $validated['donnees'] ?? []]
        );

        return response()->json($record, 200);
    }
}
