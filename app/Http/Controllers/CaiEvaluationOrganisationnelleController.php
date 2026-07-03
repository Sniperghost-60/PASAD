<?php

namespace App\Http\Controllers;

use App\Models\CaiEvaluationOrganisationnelle;
use Illuminate\Http\Request;

class CaiEvaluationOrganisationnelleController extends Controller
{
    public function index(Request $request)
    {
        $query = CaiEvaluationOrganisationnelle::where('user_id', $request->user()->id);
        if ($request->commune_id) $query->where('commune_id', $request->commune_id);
        return response()->json($query->first() ?? (object)[]);
    }

    public function store(Request $request)
    {
        $row = CaiEvaluationOrganisationnelle::updateOrCreate(
            [
                'user_id'    => $request->user()->id,
                'commune_id' => $request->commune_id,
            ],
            ['donnees' => $request->donnees]
        );
        return response()->json($row);
    }
}
