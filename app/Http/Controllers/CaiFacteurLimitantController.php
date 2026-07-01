<?php

namespace App\Http\Controllers;

use App\Models\CaiFacteurLimitant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CaiFacteurLimitantController extends Controller
{
    public function index(Request $request)
    {
        $query = CaiFacteurLimitant::where('user_id', Auth::id());

        if ($request->filled('commune_id')) {
            $query->where('commune_id', $request->commune_id);
        }
        if ($request->filled('date_session')) {
            $query->where('date_session', $request->date_session);
        }

        return response()->json($query->first());
    }

    public function store(Request $request)
    {
        $request->validate([
            'commune_id'   => 'nullable|exists:communes,id',
            'date_session' => 'nullable|date',
            'forces'       => 'nullable|string',
            'faiblesses'   => 'nullable|string',
            'opportunites' => 'nullable|string',
            'menaces'      => 'nullable|string',
        ]);

        $record = CaiFacteurLimitant::updateOrCreate(
            [
                'user_id'      => Auth::id(),
                'commune_id'   => $request->commune_id,
                'date_session' => $request->date_session,
            ],
            [
                'forces'       => $request->forces,
                'faiblesses'   => $request->faiblesses,
                'opportunites' => $request->opportunites,
                'menaces'      => $request->menaces,
            ]
        );

        return response()->json(['success' => true, 'data' => $record], 201);
    }
}
