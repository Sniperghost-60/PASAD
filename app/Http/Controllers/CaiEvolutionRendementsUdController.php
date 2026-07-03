<?php

namespace App\Http\Controllers;

use App\Models\CaiEvolutionRendementsUd;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CaiEvolutionRendementsUdController extends Controller
{
    public function index(Request $request)
    {
        $query = CaiEvolutionRendementsUd::where('user_id', Auth::id());

        if ($request->filled('commune_id')) {
            $query->where('commune_id', $request->commune_id);
        }

        $record = $query->first();
        return response()->json($record ?? (object)[]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'commune_id' => 'nullable|integer|exists:communes,id',
            'donnees'    => 'nullable|array',
        ]);

        $record = CaiEvolutionRendementsUd::updateOrCreate(
            [
                'user_id'    => Auth::id(),
                'commune_id' => $validated['commune_id']   ?? null,
            ],
            ['donnees' => $validated['donnees'] ?? []]
        );

        return response()->json($record, 200);
    }
}
