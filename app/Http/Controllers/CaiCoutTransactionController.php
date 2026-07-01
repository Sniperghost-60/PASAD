<?php

namespace App\Http\Controllers;

use App\Models\CaiCoutTransaction;
use Illuminate\Http\Request;

class CaiCoutTransactionController extends Controller
{
    public function index(Request $request)
    {
        $q = CaiCoutTransaction::where('user_id', auth()->id());
        if ($request->commune_id)   $q->where('commune_id',   $request->commune_id);
        if ($request->date_session) $q->where('date_session', $request->date_session);
        return response()->json($q->first() ?? (object)[]);
    }

    public function store(Request $request)
    {
        $row = CaiCoutTransaction::updateOrCreate(
            [
                'user_id'      => auth()->id(),
                'commune_id'   => $request->commune_id,
                'date_session' => $request->date_session,
            ],
            ['donnees' => $request->donnees]
        );
        return response()->json($row);
    }
}
