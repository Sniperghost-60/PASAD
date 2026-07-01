<?php

namespace App\Http\Controllers;

use App\Models\CaiAgroecologieProducteur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CaiAgroecologieProducteursController extends Controller
{
    public function index(Request $request)
    {
        $userId      = Auth::id();
        $communeId   = $request->query('commune_id');
        $dateSession = $request->query('date_session');

        return CaiAgroecologieProducteur::where('user_id', $userId)
            ->when($communeId,   fn ($q) => $q->where('commune_id',   $communeId))
            ->when($dateSession, fn ($q) => $q->where('date_session', $dateSession))
            ->orderBy('id')
            ->get();
    }

    public function store(Request $request)
    {
        $userId      = Auth::id();
        $communeId   = $request->input('commune_id');
        $dateSession = $request->input('date_session');
        $producteurs = $request->input('producteurs', []);

        // Delete + reinsert (liste remplaçable intégralement)
        CaiAgroecologieProducteur::where('user_id', $userId)
            ->where('commune_id', $communeId)
            ->where('date_session', $dateSession)
            ->delete();

        foreach ($producteurs as $p) {
            CaiAgroecologieProducteur::create([
                'user_id'            => $userId,
                'commune_id'         => $communeId,
                'date_session'       => $dateSession,
                'departement'        => $p['departement']        ?? null,
                'commune_nom'        => $p['commune_nom']        ?? null,
                'arrondissement'     => $p['arrondissement']     ?? null,
                'village'            => $p['village']            ?? null,
                'nom_producteur'     => $p['nom_producteur']     ?? null,
                'prenoms_producteur' => $p['prenoms_producteur'] ?? null,
                'contact1'           => $p['contact1']           ?? null,
                'contact2'           => $p['contact2']           ?? null,
                'sexe'               => $p['sexe']               ?? null,
                'pratiques'          => $p['pratiques']          ?? [],
            ]);
        }

        return response()->json(['success' => true, 'count' => count($producteurs)]);
    }
}
