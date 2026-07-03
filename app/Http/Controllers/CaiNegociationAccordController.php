<?php

namespace App\Http\Controllers;

use App\Models\CaiNegociationAccord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CaiNegociationAccordController extends Controller
{
    public function index(Request $request)
    {
        $query = CaiNegociationAccord::where('user_id', $request->user()->id)
            ->when($request->filled('commune_id'), fn ($q) => $q->where('commune_id', $request->integer('commune_id')));

        return response()->json($query->orderBy('numero')->orderBy('id')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'lignes'                            => ['required', 'array', 'min:1'],
            'lignes.*.commune_id'                => ['nullable', 'integer', 'exists:communes,id'],
            'lignes.*.numero'                    => ['nullable', 'integer', 'min:1'],
            'lignes.*.contraintes_a_lever'        => ['nullable', 'string'],
            'lignes.*.activites'                  => ['nullable', 'string'],
            'lignes.*.responsables'               => ['nullable', 'array'],
            'lignes.*.responsables.*'             => ['string', 'max:255'],
            'lignes.*.periode_debut'              => ['nullable', 'date'],
            'lignes.*.periode_fin'                => ['nullable', 'date'],
            'lignes.*.moyens_conseiller'          => ['nullable', 'string', 'max:255'],
            'lignes.*.moyens_op_exploitation'     => ['nullable', 'string', 'max:255'],
        ]);

        $userId = $request->user()->id;

        $saved = DB::transaction(fn () =>
            collect($validated['lignes'])->map(fn ($ligne) =>
                CaiNegociationAccord::create([
                    'user_id'                => $userId,
                    'commune_id'             => $ligne['commune_id']             ?? null,
                    'numero'                 => $ligne['numero']                 ?? null,
                    'contraintes_a_lever'    => $ligne['contraintes_a_lever']    ?? null,
                    'activites'              => $ligne['activites']              ?? null,
                    'responsables'           => $ligne['responsables']           ?? [],
                    'periode_debut'          => $ligne['periode_debut']          ?? null,
                    'periode_fin'            => $ligne['periode_fin']            ?? null,
                    'moyens_conseiller'      => $ligne['moyens_conseiller']      ?? null,
                    'moyens_op_exploitation' => $ligne['moyens_op_exploitation'] ?? null,
                ])
            )->all()
        );

        return response()->json([
            'message' => 'Enregistré avec succès',
            'data'    => $saved,
        ], 201);
    }

    public function update(Request $request, CaiNegociationAccord $ligne)
    {
        abort_unless($ligne->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'numero'                 => ['nullable', 'integer', 'min:1'],
            'contraintes_a_lever'    => ['nullable', 'string'],
            'activites'              => ['nullable', 'string'],
            'responsables'           => ['nullable', 'array'],
            'responsables.*'         => ['string', 'max:255'],
            'periode_debut'          => ['nullable', 'date'],
            'periode_fin'            => ['nullable', 'date'],
            'moyens_conseiller'      => ['nullable', 'string', 'max:255'],
            'moyens_op_exploitation' => ['nullable', 'string', 'max:255'],
        ]);

        $ligne->update([
            'numero'                 => $validated['numero']                 ?? null,
            'contraintes_a_lever'    => $validated['contraintes_a_lever']    ?? null,
            'activites'              => $validated['activites']              ?? null,
            'responsables'           => $validated['responsables']           ?? [],
            'periode_debut'          => $validated['periode_debut']          ?? null,
            'periode_fin'            => $validated['periode_fin']            ?? null,
            'moyens_conseiller'      => $validated['moyens_conseiller']      ?? null,
            'moyens_op_exploitation' => $validated['moyens_op_exploitation'] ?? null,
        ]);

        return response()->json([
            'message' => 'Ligne mise à jour avec succès !',
            'data'    => $ligne,
        ]);
    }
}
