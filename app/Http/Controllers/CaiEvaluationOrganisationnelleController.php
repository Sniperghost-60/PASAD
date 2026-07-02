<?php

namespace App\Http\Controllers;

use App\Models\CaiEvaluationOrganisationnelle;
use Illuminate\Http\Request;

class CaiEvaluationOrganisationnelleController extends Controller
{
    public function index(Request $request)
    {
        $query = CaiEvaluationOrganisationnelle::where('user_id', $request->user()->id);
        if ($request->commune_id)   $query->where('commune_id',   $request->commune_id);
        if ($request->date_session) $query->where('date_session', $request->date_session);
        return response()->json($query->first() ?? (object)[]);
    }

    public function store(Request $request)
    {
        $row = CaiEvaluationOrganisationnelle::updateOrCreate(
            [
                'user_id'      => $request->user()->id,
                'commune_id'   => $request->commune_id,
                'date_session' => $request->date_session,
            ],
            ['donnees' => $request->donnees]
        );
        return response()->json($row);
    }
}
