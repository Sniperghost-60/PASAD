import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import api from '../services/api';

export default function ProfilHistoriqueList() {
    const navigate = useNavigate();
    const [profils, setProfils] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmDelete, setConfirmDelete] = useState(null);

    useEffect(() => { loadProfils(); }, []);

    const loadProfils = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/profil-historique');
            setProfils(Array.isArray(res.data) ? res.data : []);
        } catch { setProfils([]); } finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/api/profil-historique/${id}`);
            setToast({ show: true, message: 'Entrée supprimée avec succès.', type: 'success' });
            setConfirmDelete(null);
            loadProfils();
        } catch {
            setToast({ show: true, message: 'Erreur lors de la suppression.', type: 'error' });
        }
    };

    // Grouper par village
    const profilsByVillage = profils.reduce((acc, p) => {
        const key = `${p.commune?.nom}||${p.arrondissement?.nom}||${p.village}`;
        if (!acc[key]) acc[key] = {
            commune: p.commune?.nom,
            arrondissement: p.arrondissement?.nom,
            departement: p.departement?.nom,
            village: p.village,
            profil_historique_id: p.id,
            events: [],
        };
        acc[key].events.push(p);
        return acc;
    }, {});

    // Filtrer par recherche
    const filtered = Object.values(profilsByVillage).filter(g =>
        !search.trim() ||
        g.village.toLowerCase().includes(search.toLowerCase()) ||
        g.commune?.toLowerCase().includes(search.toLowerCase()) ||
        g.arrondissement?.toLowerCase().includes(search.toLowerCase()) ||
        g.departement?.toLowerCase().includes(search.toLowerCase())
    );

    const totalEvents = profils.length;
    const totalVillages = Object.keys(profilsByVillage).length;

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-60">
                <Header title="Liste des profils historiques" />

                <div className="p-6 space-y-5">

                    {/* Barre d'actions */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Stats */}
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500">
                                <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                            </div>
                            <span className="text-sm font-bold text-slate-700">{totalVillages}</span>
                            <span className="text-xs text-slate-400">village(s)</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-teal-600">
                                <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <span className="text-sm font-bold text-slate-700">{totalEvents}</span>
                            <span className="text-xs text-slate-400">événement(s)</span>
                        </div>

                        {/* Recherche */}
                        <div className="flex-1 relative">
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" /></svg>
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Rechercher par village, commune, arrondissement..."
                                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 shadow-sm transition-all" />
                        </div>

                        {/* Bouton Nouveau */}
                        <button onClick={() => navigate('/profil-historique')}
                            className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700 transition-all">
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            Nouvelle saisie
                        </button>
                    </div>

                    {/* Contenu */}
                    {loading ? (
                        <div className="flex items-center justify-center gap-3 py-20 text-slate-400">
                            <svg className="size-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                            <span className="text-sm font-medium">Chargement...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
                                <svg className="size-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h12" /></svg>
                            </div>
                            <p className="text-base font-semibold text-slate-700">{search ? 'Aucun résultat trouvé' : 'Aucun profil historique'}</p>
                            <p className="text-sm text-slate-400 mt-1">{search ? 'Essayez un autre terme de recherche.' : 'Commencez par saisir des données de profil historique.'}</p>
                            {!search && (
                                <button onClick={() => navigate('/profil-historique')}
                                    className="mt-4 flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700 transition-all">
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                    Nouvelle saisie
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filtered.map((group, gi) => (
                                <div key={gi} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                    {/* En-tête village */}
                                    <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                                        <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-sm">
                                            <svg className="size-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-extrabold text-slate-800 truncate">{group.village}</p>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                <span className="text-xs text-slate-500">{group.arrondissement}</span>
                                                <span className="text-slate-300">·</span>
                                                <span className="text-xs text-slate-500">{group.commune}</span>
                                                <span className="text-slate-300">·</span>
                                                <span className="text-xs text-slate-400">{group.departement}</span>
                                            </div>
                                        </div>
                                        <span className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-bold text-teal-700">
                                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            {group.events.length} événement(s)
                                        </span>
                                        <button type="button"
                                            onClick={() => navigate(`/hierarchisation-domaines-activites?profil_historique_id=${group.profil_historique_id}`)}
                                            className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-extrabold text-slate-900 shadow-sm hover:bg-amber-300 transition-all">
                                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 14l3-3 3 3 5-6" /></svg>
                                            Créer la hiérarchisation
                                        </button>
                                        <button type="button"
                                            onClick={() => navigate(`/hierarchisation-speculations-agricoles?profil_historique_id=${group.profil_historique_id}`)}
                                            className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-teal-700 transition-all">
                                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M5 8c5 0 7 2 7 6M19 8c-5 0-7 2-7 6" /></svg>
                                            Spéculations agricoles
                                        </button>
                                        <button type="button"
                                            onClick={() => navigate(`/matrice-problemes-solutions?profil_historique_id=${group.profil_historique_id}`)}
                                            className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#062824] px-3.5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-teal-900 transition-all">
                                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
                                            Problèmes & solutions
                                        </button>
                                        <button type="button"
                                            onClick={() => navigate(`/curriculum-apprentissage-cep?profil_historique_id=${group.profil_historique_id}`)}
                                            className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-lime-500 px-3.5 py-2 text-xs font-extrabold text-slate-950 shadow-sm hover:bg-lime-400 transition-all">
                                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13M6.75 4.5A2.25 2.25 0 004.5 6.75v10.5A2.25 2.25 0 006.75 19.5H12M17.25 4.5A2.25 2.25 0 0119.5 6.75v10.5a2.25 2.25 0 01-2.25 2.25H12" /></svg>
                                            Curriculum CEP
                                        </button>
                                    </div>

                                    {/* Tableau des événements */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-100">
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-24">Année</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Événements</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Impact</th>
                                                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wide w-16">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {group.events.sort((a, b) => a.annee - b.annee).map(ev => (
                                                    <tr key={ev.id} className="hover:bg-teal-50/30 transition-colors group/row">
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 px-3 py-1 text-sm font-extrabold text-teal-700">
                                                                {ev.annee}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-700 max-w-sm">
                                                            <p className="line-clamp-3">{ev.evenements}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-600 max-w-sm">
                                                            <p className="line-clamp-3">{ev.impact}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button onClick={() => setConfirmDelete(ev.id)}
                                                                className="inline-flex size-8 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500 opacity-0 group-hover/row:opacity-100 hover:bg-red-100 transition-all">
                                                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal de confirmation de suppression */}
                {confirmDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-sm mx-4">
                            <div className="flex items-start gap-4 mb-5">
                                <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-100">
                                    <svg className="size-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">Supprimer cet événement ?</h3>
                                    <p className="text-sm text-slate-500 mt-1">Cette action est irréversible.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirmDelete(null)}
                                    className="flex-1 rounded-xl border-2 border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                                    Annuler
                                </button>
                                <button onClick={() => handleDelete(confirmDelete)}
                                    className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-all">
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <ModernNotification show={toast.show} message={toast.message} type={toast.type}
                    onClose={() => setToast(t => ({ ...t, show: false }))} />
            </main>
        </div>
    );
}
