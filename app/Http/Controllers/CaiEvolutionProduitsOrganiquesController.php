<?php

namespace App\Http\Controllers;

use App\Models\CaiEvolutionProduitsOrganiques;
use Illuminate\Http\Request;

class CaiEvolutionProduitsOrganiquesController extends Controller
{
    public function index(Request $request)
    {
        $query = CaiEvolutionProduitsOrganiques::where('user_id', $request->user()->id);

        if ($request->filled('commune_id')) {
            $query->where('commune_id', $request->commune_id);
        }

        $record = $query->first();
        return response()->json($record ?? (object)[]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'commune_id' => 'nullable|integer',
            'donnees'    => 'nullable|array',
        ]);

        $record = CaiEvolutionProduitsOrganiques::updateOrCreate(
            [
                'user_id'    => $request->user()->id,
                'commune_id' => $data['commune_id'] ?? null,
            ],
            ['donnees' => $data['donnees'] ?? null]
        );

        return response()->json($record, 200);
    }
}
