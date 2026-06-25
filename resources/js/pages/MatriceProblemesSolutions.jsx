import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const emptyProblem = (suffix = Date.now()) => ({
    id: `new-${suffix}`,
    probleme: '',
    causes: '',
    solutions_habituelles: [''],
    solutions_proposees: [''],
});

const statusLabel = {
    en_attente: 'En attente',
    validee: 'Validée',
    rejetee: 'Rejetée',
};

function SolutionInputs({ label, values, onChange, onAdd, onRemove, placeholder }) {
    return (
        <div className="space-y-2">
            {values.map((value, index) => (
                <div key={index} className="flex gap-2">
                    <textarea value={value}
                        onChange={e => onChange(index, e.target.value)}
                        rows={2}
                        placeholder={placeholder}
                        className="min-h-[56px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none resize-y focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
                    <button type="button" onClick={() => onRemove(index)}
                        className="mt-1 inline-flex size-8 flex-shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
            <button type="button" onClick={onAdd}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-teal-300 bg-white px-3 py-2 text-xs font-semibold text-teal-600 hover:bg-teal-50 transition-all">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Ajouter {label}
            </button>
        </div>
    );
}

export default function MatriceProblemesSolutions() {
    const [searchParams] = useSearchParams();
    const initialProfilId = searchParams.get('profil_historique_id') || '';
    const { activeCommune } = useAuth();
    const [villages, setVillages] = useState([]);
    const [selectedProfilId, setSelectedProfilId] = useState(initialProfilId);
    const [problems, setProblems] = useState([emptyProblem()]);
    const [savedProblems, setSavedProblems] = useState([]);
    const [loadingVillages, setLoadingVillages] = useState(true);
    const [loadingRows, setLoadingRows] = useState(false);
    const [saving, setSaving] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(null);
    const [updatingPertinence, setUpdatingPertinence] = useState(null);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => { setSelectedProfilId(''); setProblems([emptyProblem()]); setSavedProblems([]); loadVillages(); }, [activeCommune]);

    useEffect(() => {
        if (selectedProfilId) loadExistingRows(selectedProfilId);
        else {
            setProblems([emptyProblem()]);
            setSavedProblems([]);
        }
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
            const res = await api.get(`/api/matrice-problemes-solutions?profil_historique_id=${profilId}`);
            const data = Array.isArray(res.data) ? res.data : [];
            setSavedProblems(data);
            setProblems(data.length ? data.map(item => ({
                id: item.id,
                probleme: item.probleme ?? '',
                causes: item.causes ?? '',
                solutions_habituelles: item.solutions?.filter(s => s.type === 'habituelle').map(s => s.solution) ?? [''],
                solutions_proposees: item.solutions?.filter(s => s.type === 'proposee').map(s => s.solution) ?? [''],
            })) : [emptyProblem()]);
        } catch {
            setSavedProblems([]);
            setProblems([emptyProblem()]);
        } finally {
            setLoadingRows(false);
        }
    };

    const updateProblem = (index, field, value) => {
        setProblems(current => current.map((problem, i) => (
            i === index ? { ...problem, [field]: value } : problem
        )));
    };

    const updateSolution = (problemIndex, field, solutionIndex, value) => {
        setProblems(current => current.map((problem, i) => {
            if (i !== problemIndex) return problem;
            return {
                ...problem,
                [field]: problem[field].map((solution, idx) => idx === solutionIndex ? value : solution),
            };
        }));
    };

    const addSolution = (problemIndex, field) => {
        setProblems(current => current.map((problem, i) => (
            i === problemIndex ? { ...problem, [field]: [...problem[field], ''] } : problem
        )));
    };

    const removeSolution = (problemIndex, field, solutionIndex) => {
        setProblems(current => current.map((problem, i) => {
            if (i !== problemIndex) return problem;
            const next = problem[field].filter((_, idx) => idx !== solutionIndex);
            return { ...problem, [field]: next.length ? next : [''] };
        }));
    };

    const addProblem = () => {
        setProblems(current => [...current, emptyProblem(`${Date.now()}-${current.length}`)]);
    };

    const removeProblem = (index) => {
        setProblems(current => current.length > 1 ? current.filter((_, i) => i !== index) : [emptyProblem()]);
    };

    const validate = () => {
        const nextErrors = {};
        if (!selectedProfilId) nextErrors.profil_historique_id = 'Champ requis';
        problems.forEach((problem, index) => {
            if (!problem.probleme.trim()) nextErrors[`probleme_${index}`] = 'Champ requis';
        });

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSaving(true);
        try {
            await api.post('/api/matrice-problemes-solutions', {
                profil_historique_id: selectedProfilId,
                problemes: problems.map(problem => ({
                    probleme: problem.probleme.trim(),
                    causes: problem.causes.trim() || null,
                    solutions_habituelles: problem.solutions_habituelles.map(s => s.trim()).filter(Boolean),
                    solutions_proposees: problem.solutions_proposees.map(s => s.trim()).filter(Boolean),
                })),
            });
            setToast({ show: true, message: 'Matrice enregistrée. Les solutions proposées peuvent maintenant être validées ou rejetées.', type: 'success' });
            loadExistingRows(selectedProfilId);
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.message || 'Une erreur est survenue.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const updateSolutionStatus = async (solutionId, statut) => {
        setUpdatingStatus(solutionId);
        try {
            await api.patch(`/api/matrice-problemes-solutions/solutions/${solutionId}/status`, { statut });
            setToast({ show: true, message: statut === 'validee' ? 'Solution validée.' : 'Solution rejetée.', type: 'success' });
            loadExistingRows(selectedProfilId);
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.message || 'Impossible de modifier le statut.', type: 'error' });
        } finally {
            setUpdatingStatus(null);
        }
    };

    const updateProblemPertinence = async (problemId, estPertinent) => {
        setUpdatingPertinence(problemId);
        try {
            await api.patch(`/api/matrice-problemes-solutions/problemes/${problemId}/pertinence`, { est_pertinent: estPertinent });
            setToast({ show: true, message: estPertinent ? 'Problème marqué pertinent.' : 'Problème retiré des pertinents.', type: 'success' });
            loadExistingRows(selectedProfilId);
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.message || 'Impossible de modifier la pertinence.', type: 'error' });
        } finally {
            setUpdatingPertinence(null);
        }
    };

    const proposedSolutions = savedProblems.flatMap(problem =>
        (problem.solutions ?? [])
            .filter(solution => solution.type === 'proposee')
            .map(solution => ({ ...solution, probleme: problem.probleme }))
    );

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-60">
                <Header title="Matrice des problèmes et solutions" />

                <div className="p-6 space-y-5">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="flex items-center gap-3 bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-400 text-slate-900">
                                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white">Problèmes, causes et solutions du village</h2>
                                <p className="text-xs text-cyan-200/70 mt-0.5">Les validations des solutions proposées se font après enregistrement</p>
                            </div>
                        </div>

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
                                    <p className="mt-1 text-xs text-amber-700">Créez d'abord un profil historique pour pouvoir saisir cette matrice.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {problems.map((problem, index) => (
                                        <div key={problem.id} className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                                            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-100 px-4 py-3">
                                                <span className="text-sm font-extrabold text-slate-700">Problème #{index + 1}</span>
                                                <button type="button" onClick={() => removeProblem(index)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
                                                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Retirer
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 p-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                                                        <span className="text-red-400">*</span> Problèmes
                                                    </label>
                                                    <textarea value={problem.probleme}
                                                        onChange={e => updateProblem(index, 'probleme', e.target.value)}
                                                        rows={4}
                                                        className={`w-full min-h-[112px] rounded-lg border bg-white px-3 py-2 text-sm outline-none resize-y focus:ring-2 focus:ring-teal-100 ${errors[`probleme_${index}`] ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-teal-400'}`} />
                                                    {errors[`probleme_${index}`] && <p className="mt-1 text-xs text-red-500">{errors[`probleme_${index}`]}</p>}
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Causes</label>
                                                    <textarea value={problem.causes}
                                                        onChange={e => updateProblem(index, 'causes', e.target.value)}
                                                        rows={4}
                                                        className="w-full min-h-[112px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none resize-y focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Solutions habituelles</label>
                                                    <SolutionInputs label="une solution habituelle"
                                                        values={problem.solutions_habituelles}
                                                        onChange={(solutionIndex, value) => updateSolution(index, 'solutions_habituelles', solutionIndex, value)}
                                                        onAdd={() => addSolution(index, 'solutions_habituelles')}
                                                        onRemove={(solutionIndex) => removeSolution(index, 'solutions_habituelles', solutionIndex)}
                                                        placeholder="Solution habituelle" />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Solutions proposées</label>
                                                    <SolutionInputs label="une solution proposée"
                                                        values={problem.solutions_proposees}
                                                        onChange={(solutionIndex, value) => updateSolution(index, 'solutions_proposees', solutionIndex, value)}
                                                        onAdd={() => addSolution(index, 'solutions_proposees')}
                                                        onRemove={(solutionIndex) => removeSolution(index, 'solutions_proposees', solutionIndex)}
                                                        placeholder="Solution proposée" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button type="button" onClick={addProblem}
                                        className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-teal-300 bg-white px-4 py-2.5 text-sm font-semibold text-teal-600 hover:bg-teal-50 transition-all">
                                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Ajouter un problème
                                    </button>
                                </div>
                            )}

                            {proposedSolutions.length > 0 && (
                                <div className="rounded-xl border border-slate-200 overflow-hidden">
                                    <div className="border-b border-slate-200 bg-slate-100 px-4 py-3">
                                        <h3 className="text-sm font-extrabold text-slate-700">Validation des solutions proposées</h3>
                                    </div>
                                    <div className="divide-y divide-slate-100 bg-white">
                                        {proposedSolutions.map(solution => (
                                            <div key={solution.id}
                                                className={`grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3 ${solution.statut === 'rejetee' ? 'bg-slate-100 opacity-60' : ''}`}>
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-400">Problème: {solution.probleme}</p>
                                                    <p className={`mt-1 text-sm font-semibold ${solution.statut === 'rejetee' ? 'line-through text-slate-500' : 'text-slate-800'}`}>{solution.solution}</p>
                                                    <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                                                        solution.statut === 'validee'
                                                            ? 'bg-teal-100 text-teal-700'
                                                            : solution.statut === 'rejetee'
                                                                ? 'bg-slate-200 text-slate-500'
                                                                : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {statusLabel[solution.statut] ?? solution.statut}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button type="button"
                                                        onClick={() => updateSolutionStatus(solution.id, 'validee')}
                                                        disabled={updatingStatus === solution.id || solution.statut === 'validee'}
                                                        className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                                        Valider
                                                    </button>
                                                    <button type="button"
                                                        onClick={() => updateSolutionStatus(solution.id, 'rejetee')}
                                                        disabled={updatingStatus === solution.id || solution.statut === 'rejetee'}
                                                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                                        Rejeter
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {savedProblems.length > 0 && (
                                <div className="rounded-xl border border-slate-200 overflow-hidden">
                                    <div className="border-b border-slate-200 bg-slate-100 px-4 py-3">
                                        <h3 className="text-sm font-extrabold text-slate-700">Problèmes pertinents pour le curriculum</h3>
                                    </div>
                                    <div className="divide-y divide-slate-100 bg-white">
                                        {savedProblems.map(problem => (
                                            <div key={problem.id} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{problem.probleme}</p>
                                                    {problem.causes && <p className="mt-1 text-xs text-slate-500">Cause: {problem.causes}</p>}
                                                    <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                                                        problem.est_pertinent ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {problem.est_pertinent ? 'Pertinent' : 'Non pertinent'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button type="button"
                                                        onClick={() => updateProblemPertinence(problem.id, true)}
                                                        disabled={updatingPertinence === problem.id || problem.est_pertinent}
                                                        className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                                        Marquer pertinent
                                                    </button>
                                                    <button type="button"
                                                        onClick={() => updateProblemPertinence(problem.id, false)}
                                                        disabled={updatingPertinence === problem.id || !problem.est_pertinent}
                                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                                        Retirer
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                            <button type="button" onClick={() => setProblems([emptyProblem()])}
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
                        </div>
                    </form>
                </div>

                <ModernNotification show={toast.show} message={toast.message} type={toast.type}
                    onClose={() => setToast(t => ({ ...t, show: false }))} />
            </main>
        </div>
    );
}
