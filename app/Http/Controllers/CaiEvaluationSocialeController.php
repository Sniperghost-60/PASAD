<?php

namespace App\Http\Controllers;

use App\Models\CaiEvaluationSociale;
use Illuminate\Http\Request;

class CaiEvaluationSocialeController extends Controller
{
    public function index(Request $request)
    {
        $query = CaiEvaluationSociale::where('user_id', $request->user()->id);
        if ($request->commune_id)   $query->where('commune_id',   $request->commune_id);
        if ($request->date_session) $query->where('date_session', $request->date_session);
        return response()->json($query->first() ?? (object)[]);
    }

    public function store(Request $request)
    {
        $row = CaiEvaluationSociale::updateOrCreate(
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
