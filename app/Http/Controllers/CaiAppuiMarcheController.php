<?php

namespace App\Http\Controllers;

use App\Models\CaiAppuiMarche;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CaiAppuiMarcheController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId    = $request->user()->id;
        $communeId = $request->query('commune_id') ?: null;

        $query = CaiAppuiMarche::where('user_id', $userId);
        if ($communeId) $query->where('commune_id', $communeId);

        return response()->json($query->first() ?? (object)[]);
    }

    public function store(Request $request): JsonResponse
    {
        $userId    = $request->user()->id;
        $communeId = $request->input('commune_id') ?: null;
        $donnees   = $request->input('donnees', []);

        $record = CaiAppuiMarche::updateOrCreate(
            [
                'user_id'    => $userId,
                'commune_id' => $communeId,
            ],
            ['donnees' => $donnees]
        );

        return response()->json(['success' => true, 'id' => $record->id]);
    }
}
