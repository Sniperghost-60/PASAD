<?php

namespace App\Http\Controllers;

use App\Models\CaiNegociationAccord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CaiNegociationAccordController extends Controller
{
    public function index(Request $request)
    {
        $query = CaiNegociationAccord::where('user_id', $request->user()->id);

        if ($request->filled('commune_id')) {
            $query->where('commune_id', $request->commune_id);
        }
        if ($request->filled('date_session')) {
            $query->where('date_session', $request->date_session);
        }

        return response()->json($query->orderBy('numero')->orderBy('id')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'date_session'              => 'nullable|date',
            'commune_id'                => 'nullable|exists:communes,id',
            'lignes'                    => 'required|array|min:1',
            'lignes.*.numero'           => 'nullable|integer|min:1',
            'lignes.*.contraintes_a_lever'     => 'nullable|string',
            'lignes.*.activites'               => 'nullable|string',
            'lignes.*.responsables'            => 'nullable|string|max:255',
            'lignes.*.periode_execution'       => 'nullable|string|max:255',
            'lignes.*.moyens_conseiller'       => 'nullable|string|max:255',
            'lignes.*.moyens_op_exploitation'  => 'nullable|string|max:255',
        ]);

        $userId    = $request->user()->id;
        $communeId = $request->input('commune_id');
        $date      = $request->input('date_session');

        DB::transaction(function () use ($request, $userId, $communeId, $date) {
            CaiNegociationAccord::where('user_id', $userId)
                ->where('commune_id', $communeId)
                ->where('date_session', $date)
                ->delete();

            foreach ($request->lignes as $ligne) {
                CaiNegociationAccord::create([
                    'user_id'                 => $userId,
                    'commune_id'              => $communeId,
                    'date_session'            => $date,
                    'numero'                  => $ligne['numero']                 ?? null,
                    'contraintes_a_lever'     => $ligne['contraintes_a_lever']    ?? null,
                    'activites'               => $ligne['activites']              ?? null,
                    'responsables'            => $ligne['responsables']           ?? null,
                    'periode_execution'       => $ligne['periode_execution']      ?? null,
                    'moyens_conseiller'       => $ligne['moyens_conseiller']      ?? null,
                    'moyens_op_exploitation'  => $ligne['moyens_op_exploitation'] ?? null,
                ]);
            }
        });

        return response()->json(['message' => 'Enregistré avec succès'], 201);
    }
}
