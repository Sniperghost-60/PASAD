<?php

namespace App\Http\Controllers;

use App\Models\CaiAppuiMarche;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CaiAppuiMarcheController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId      = $request->user()->id;
        $communeId   = $request->query('commune_id') ?: null;
        $dateSession = $request->query('date_session');

        $query = CaiAppuiMarche::where('user_id', $userId);
        if ($communeId)   $query->where('commune_id', $communeId);
        if ($dateSession) $query->where('date_session', $dateSession);

        return response()->json($query->first() ?? (object)[]);
    }

    public function store(Request $request): JsonResponse
    {
        $userId      = $request->user()->id;
        $communeId   = $request->input('commune_id') ?: null;
        $dateSession = $request->input('date_session');
        $donnees     = $request->input('donnees', []);

        $record = CaiAppuiMarche::updateOrCreate(
            [
                'user_id'      => $userId,
                'commune_id'   => $communeId,
                'date_session' => $dateSession,
            ],
            ['donnees' => $donnees]
        );

        return response()->json(['success' => true, 'id' => $record->id]);
    }
}
