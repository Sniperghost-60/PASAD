<?php

namespace App\Http\Controllers;

use App\Models\CaiFicheStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CaiFicheStockController extends Controller
{
    public function index(Request $request)
    {
        $user        = Auth::user();
        $communeId   = $request->query('commune_id');
        $dateSession = $request->query('date_session');

        $query = CaiFicheStock::where('user_id', $user->id);
        if ($communeId)   $query->where('commune_id',   $communeId);
        if ($dateSession) $query->where('date_session', $dateSession);

        return response()->json($query->first() ?? (object)[]);
    }

    public function store(Request $request)
    {
        $user      = Auth::user();
        $validated = $request->validate([
            'commune_id'   => 'nullable|integer',
            'date_session' => 'nullable|date',
            'donnees'      => 'nullable|array',
        ]);

        $record = CaiFicheStock::updateOrCreate(
            [
                'user_id'      => $user->id,
                'commune_id'   => $validated['commune_id']   ?? null,
                'date_session' => $validated['date_session'] ?? null,
            ],
            ['donnees' => $validated['donnees'] ?? []]
        );

        return response()->json(['success' => true, 'data' => $record]);
    }
}
