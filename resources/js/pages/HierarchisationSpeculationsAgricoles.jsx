import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const SPECULATIONS_FIXES = [
    'Soja',
    'Maïs',
    'Riz',
    'Manioc',
    'Niébé',
    "Pois d'angole",
    'Mucuna',
    'Igname',
];

const makeOtherRow = (suffix = 'initial') => ({
    id: `autre-${suffix}`,
    speculation_agricole: 'Autre à préciser',
    score: '',
    autre_precision: '',
});

const emptyRows = () => [
    ...SPECULATIONS_FIXES.map(speculation => ({
        id: speculation,
        speculation_agricole: speculation,
        score: '',
        autre_precision: '',
    })),
    makeOtherRow(),
];

const calculateRanks = (rows) => {
    const scored = rows
        .map((row, index) => ({ ...row, index, scoreNumber: row.score === '' ? null : Number(row.score) }))
        .filter(row => row.scoreNumber !== null && !Number.isNaN(row.scoreNumber))
        .sort((a, b) => b.scoreNumber - a.scoreNumber || a.index - b.index);

    const ranks = {};
    scored.forEach((row, index) => { ranks[row.id] = index + 1; });
    return ranks;
};

export default function HierarchisationSpeculationsAgricoles() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialProfilId = searchParams.get('profil_historique_id') || '';
    const { activeCommune } = useAuth();
    const [villages, setVillages] = useState([]);
    const [selectedProfilId, setSelectedProfilId] = useState(initialProfilId);
    const [rows, setRows] = useState(emptyRows());
    const [loadingVillages, setLoadingVillages] = useState(true);
    const [loadingRows, setLoadingRows] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const calculatedRanks = useMemo(() => calculateRanks(rows), [rows]);
    const totalScore = useMemo(
        () => rows.reduce((sum, row) => sum + (row.score !== '' ? Number(row.score) || 0 : 0), 0),
        [rows],
    );

    useEffect(() => { setSelectedProfilId(''); setRows(emptyRows()); loadVillages(); }, [activeCommune]);

    useEffect(() => {
        if (selectedProfilId) loadExistingRows(selectedProfilId);
        else setRows(emptyRows());
    }, [selectedProfilId]);

    const selectedVillage = useMemo(
        () => villages.find(v => String(v.profil_historique_id) === String(selectedProfilId)),
        [villages, selectedProfilId],
    );

    const loadVillages = async () => {
        setLoadingVillages(true);
        try {
            const params = activeCommune ? `?commune_id=${activeCommune.id}` : '';
            const res = await api.get(`/api/hierarchisation-domaines-activites/villages${params}`);
            const data = Array.isArray(res.data) ? res.data : [];
            setVillages(data);
            if (!selectedProfilId && data.length === 1) {
                setSelectedProfilId(String(data[0].profil_historique_id));
            }
        } catch {
            setVillages([]);
        } finally {
            setLoadingVillages(false);
        }
    };

    const loadExistingRows = async (profilId) => {
        setLoadingRows(true);
        setErrors({});
        try {
            const res = await api.get(`/api/hierarchisation-speculations-agricoles?profil_historique_id=${profilId}`);
            const existing = Array.isArray(res.data) ? res.data : [];
            const fixedRows = emptyRows().slice(0, SPECULATIONS_FIXES.length).map(row => {
                const found = existing.find(item => item.speculation_agricole === row.speculation_agricole);
                if (!found) return row;

                return {
                    ...row,
                    score: found.score ?? '',
                    autre_precision: found.autre_precision ?? '',
                };
            });
            const otherRows = existing
                .filter(item => item.speculation_agricole === 'Autre à préciser')
                .map((item, index) => ({
                    id: `autre-existing-${item.id ?? index}`,
                    speculation_agricole: 'Autre à préciser',
                    score: item.score ?? '',
                    autre_precision: item.autre_precision ?? '',
                }));

            setRows([...fixedRows, ...(otherRows.length ? otherRows : [makeOtherRow()])]);
        } catch {
            setRows(emptyRows());
        } finally {
            setLoadingRows(false);
        }
    };

    const updateRow = (index, field, value) => {
        if (field === 'score' && value !== '') {
            const newScore = Number(value);
            if (!Number.isNaN(newScore)) {
                const othersTotal = rows.reduce((sum, row, i) => i === index ? sum : sum + (row.score !== '' ? Number(row.score) || 0 : 0), 0);
                if (othersTotal + newScore > 20) {
                    setErrors(prev => ({ ...prev, total: `Le total des scores ne peut pas dépasser 20 (déjà ${othersTotal} attribué${othersTotal > 1 ? 's' : ''}).` }));
                    return;
                }
            }
        }
        setErrors(prev => {
            if (!prev.total) return prev;
            const { total, ...rest } = prev;
            return rest;
        });
        setRows(current => current.map((row, i) => (
            i === index ? { ...row, [field]: value } : row
        )));
    };

    const addOtherRow = () => {
        setRows(current => [...current, makeOtherRow(`${Date.now()}-${current.length}`)]);
    };

    const removeOtherRow = (id) => {
        setRows(current => {
            const otherRows = current.filter(row => row.speculation_agricole === 'Autre à préciser');
            if (otherRows.length <= 1) {
                return current.map(row => row.id === id ? makeOtherRow(`${Date.now()}-reset`) : row);
            }

            return current.filter(row => row.id !== id);
        });
    };

    const validate = () => {
        const nextErrors = {};
        if (!selectedProfilId) nextErrors.profil_historique_id = 'Champ requis';

        rows.forEach((row, index) => {
            if (row.score !== '' && Number(row.score) < 0) nextErrors[`score_${index}`] = 'Score invalide';
            if (row.speculation_agricole === 'Autre à préciser' && row.score !== '' && !row.autre_precision.trim()) {
                nextErrors[`autre_${index}`] = 'Précision requise';
            }
        });

        const total = rows.reduce((sum, row) => sum + (row.score !== '' ? Number(row.score) || 0 : 0), 0);
        if (total > 20) nextErrors.total = 'Le total des scores ne peut pas dépasser 20';

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSaving(true);
        try {
            await api.post('/api/hierarchisation-speculations-agricoles', {
                profil_historique_id: selectedProfilId,
                speculations: rows.map(row => ({
                    speculation_agricole: row.speculation_agricole,
                    score: row.score === '' ? null : Number(row.score),
                    autre_precision: row.autre_precision.trim() || null,
                })),
            });
            setToast({ show: true, message: 'Hiérarchisation des spéculations enregistrée avec succès.', type: 'success' });
            loadExistingRows(selectedProfilId);
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.message || 'Une erreur est survenue.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-60">
                <Header title="Hiérarchisation des spéculations agricoles" />

                <div className="p-6 space-y-5">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="flex items-center gap-3 bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-400 text-slate-900">
                                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M5 8c5 0 7 2 7 6M19 8c-5 0-7 2-7 6" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-base font-bold text-white">Spéculations agricoles du village</h2>
                                <p className="text-xs text-cyan-200/70 mt-0.5">Domaine Agriculture · renseignez les scores, les rangs sont calculés automatiquement</p>
                            </div>
                            <div className={`flex flex-col items-center rounded-xl px-4 py-2 ${totalScore > 20 ? 'bg-red-500/20 border border-red-400' : 'bg-white/10'}`}>
                                <span className={`text-lg font-extrabold ${totalScore > 20 ? 'text-red-300' : 'text-white'}`}>{totalScore} / 20</span>
                                <span className="text-[10px] uppercase tracking-wide text-cyan-200/70">Total des scores</span>
                            </div>
                        </div>
                        {errors.total && (
                            <div className="mx-6 mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
                                {errors.total}
                            </div>
                        )}

                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                                        <span className="text-red-400">*</span> Village du profil historique
                                    </label>
                                    {loadingVillages ? (
                                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400">
                                            <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                            Chargement des villages...
                                        </div>
                                    ) : (
                                        <select value={selectedProfilId}
                                            onChange={e => setSelectedProfilId(e.target.value)}
                                            className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-100 transition-all ${errors.profil_historique_id ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-400 focus:bg-white'}`}
                                            required>
                                            <option value="">Sélectionner un village</option>
                                            {villages.map(village => (
                                                <option key={village.profil_historique_id} value={village.profil_historique_id}>
                                                    {village.village} - {village.arrondissement?.nom} / {village.commune?.nom}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {errors.profil_historique_id && <p className="mt-1 text-xs text-red-500">{errors.profil_historique_id}</p>}
                                </div>

                                {selectedVillage && (
                                    <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5">
                                        <p className="text-xs font-semibold text-teal-700">{selectedVillage.events_count} événement(s) historique(s)</p>
                                        <p className="text-xs text-teal-600">{selectedVillage.departement?.nom}</p>
                                    </div>
                                )}
                            </div>

                            {villages.length === 0 && !loadingVillages ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 text-center">
                                    <p className="text-sm font-bold text-amber-800">Aucun village disponible</p>
                                    <p className="mt-1 text-xs text-amber-700">Créez d'abord un profil historique pour pouvoir saisir cette hiérarchisation.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full min-w-[820px]">
                                        <thead>
                                            <tr className="bg-slate-100 border-b border-slate-200">
                                                <th className="px-4 py-3 text-left text-sm font-extrabold text-slate-700 w-[20%]">Domaine d'activités</th>
                                                <th className="px-4 py-3 text-left text-sm font-extrabold text-slate-700 w-[30%]">Spéculations agricoles</th>
                                                <th className="px-4 py-3 text-left text-sm font-extrabold text-slate-700 w-[16%]">Score</th>
                                                <th className="px-4 py-3 text-left text-sm font-extrabold text-slate-700 w-[16%]">Rang</th>
                                                <th className="px-4 py-3 text-left text-sm font-extrabold text-slate-700">Précision</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {rows.map((row, index) => (
                                                <tr key={row.id} className="hover:bg-teal-50/30 transition-colors">
                                                    <td className="px-4 py-3">
                                                        {index === 0 && (
                                                            <span className="inline-flex rounded-xl bg-teal-50 border border-teal-200 px-3 py-1 text-sm font-extrabold text-teal-800">
                                                                Agriculture
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-slate-800">{row.speculation_agricole}</span>
                                                            {row.speculation_agricole === 'Autre à préciser' && (
                                                                <button type="button" onClick={() => removeOtherRow(row.id)}
                                                                    disabled={loadingRows || !selectedProfilId}
                                                                    className="inline-flex size-7 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40 transition-colors">
                                                                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input type="number" min="0" max="20" value={row.score}
                                                            onChange={e => updateRow(index, 'score', e.target.value)}
                                                            disabled={loadingRows || !selectedProfilId}
                                                            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 disabled:text-slate-400 ${errors[`score_${index}`] ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white focus:border-teal-400'}`} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex min-h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-extrabold text-teal-700">
                                                            {calculatedRanks[row.id] ?? '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {row.speculation_agricole === 'Autre à préciser' ? (
                                                            <div>
                                                                <input type="text" value={row.autre_precision}
                                                                    onChange={e => updateRow(index, 'autre_precision', e.target.value)}
                                                                    disabled={loadingRows || !selectedProfilId}
                                                                    placeholder="Nom de la spéculation"
                                                                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 disabled:text-slate-400 ${errors[`autre_${index}`] ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white focus:border-teal-400'}`} />
                                                                {errors[`autre_${index}`] && <p className="mt-1 text-xs text-red-500">{errors[`autre_${index}`]}</p>}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                                        <button type="button" onClick={addOtherRow}
                                            disabled={loadingRows || !selectedProfilId}
                                            className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-teal-300 bg-white px-4 py-2 text-sm font-semibold text-teal-600 hover:bg-teal-50 disabled:opacity-50 transition-all">
                                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                            Ajouter une autre spéculation
                                        </button>
                                    </div>
                                    {loadingRows && (
                                        <div className="flex items-center justify-center gap-2 border-t border-slate-100 py-3 text-sm text-slate-400">
                                            <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                            Chargement de la saisie existante...
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                            <button type="button" onClick={() => setRows(emptyRows())}
                                disabled={saving || loadingRows}
                                className="rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                                Réinitialiser
                            </button>
                            <button type="submit" disabled={saving || loadingRows || villages.length === 0}
                                className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 transition-all">
                                {saving && <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                Enregistrer
                            </button>
                            <button type="button" onClick={() => navigate('/matrice-problemes-solutions')}
                                className="flex items-center gap-2 rounded-xl bg-slate-800 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-900 transition-all">
                                Suivant →
                            </button>
                        </div>
                    </form>
                </div>

                <ModernNotification show={toast.show} message={toast.message} type={toast.type}
                    onClose={() => setToast(t => ({ ...t, show: false }))} />
            </main>
        </div>
    );
}
