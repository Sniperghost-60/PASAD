import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const filledValues = (values) => values.map(v => v.trim()).filter(Boolean);
const valuesFromRows = (rows, field) => {
    const values = rows.map(row => row[field] ?? '').filter(v => String(v).trim() !== '');
    return values.length ? values : [''];
};

const emptyGroup = (suffix = Date.now()) => ({
    id: `group-${suffix}`,
    matrice_probleme_id: '',
    titres: [''],
    dispositifs: [''],
    sujets: [''],
});

function MultiTextInputs({ label, addLabel, values, onChange, onAdd, onRemove, placeholder, required, errors }) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {required && <span className="text-red-400">*</span>} {label}
            </label>
            {values.map((value, index) => (
                <div key={index} className="flex gap-2">
                    <textarea
                        value={value}
                        onChange={e => onChange(index, e.target.value)}
                        rows={2}
                        placeholder={placeholder}
                        className={`min-h-[56px] flex-1 rounded-lg border bg-white px-3 py-2 text-sm outline-none resize-y focus:ring-2 focus:ring-teal-100 ${errors?.[index] ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-teal-400'}`}
                    />
                    <button type="button" onClick={() => onRemove(index)}
                        className="mt-1 inline-flex size-8 flex-shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
            {errors?.general && <p className="text-xs text-red-500">{errors.general}</p>}
            <button type="button" onClick={onAdd}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-teal-300 bg-white px-3 py-2 text-xs font-semibold text-teal-600 hover:bg-teal-50 transition-all">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Ajouter {addLabel}
            </button>
        </div>
    );
}

export default function ResumeProtocolesExperimentations() {
    const [searchParams] = useSearchParams();
    const initialProfilId = searchParams.get('profil_historique_id') || '';
    const { activeCommune } = useAuth();

    const [villages, setVillages] = useState([]);
    const [selectedProfilId, setSelectedProfilId] = useState(initialProfilId);
    const [pertinentProblems, setPertinentProblems] = useState([]);
    const [groups, setGroups] = useState([emptyGroup()]);
    const [loadingVillages, setLoadingVillages] = useState(true);
    const [loadingRows, setLoadingRows] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => { setSelectedProfilId(''); resetForm(); loadVillages(); }, [activeCommune]);

    useEffect(() => {
        if (selectedProfilId) loadData(selectedProfilId);
        else resetForm();
    }, [selectedProfilId]);

    const selectedVillage = useMemo(
        () => villages.find(v => String(v.profil_historique_id) === String(selectedProfilId)),
        [villages, selectedProfilId],
    );

    const resetForm = () => {
        setPertinentProblems([]);
        setGroups([emptyGroup()]);
        setErrors({});
    };

    const updateGroup = (groupIndex, field, value) => {
        setGroups(current => current.map((g, i) => i === groupIndex ? { ...g, [field]: value } : g));
    };

    const updateListValue = (groupIndex, field, valueIndex, value) => {
        setGroups(current => current.map((g, i) => {
            if (i !== groupIndex) return g;
            return { ...g, [field]: g[field].map((item, j) => j === valueIndex ? value : item) };
        }));
    };

    const addListValue = (groupIndex, field) => {
        setGroups(current => current.map((g, i) => (
            i === groupIndex ? { ...g, [field]: [...g[field], ''] } : g
        )));
    };

    const removeListValue = (groupIndex, field, valueIndex) => {
        setGroups(current => current.map((g, i) => {
            if (i !== groupIndex) return g;
            const next = g[field].filter((_, j) => j !== valueIndex);
            return { ...g, [field]: next.length ? next : [''] };
        }));
    };

    const addGroup = () => {
        setGroups(current => [...current, emptyGroup(`${Date.now()}-${current.length}`)]);
    };

    const removeGroup = (groupIndex) => {
        setGroups(current => current.length > 1
            ? current.filter((_, i) => i !== groupIndex)
            : [emptyGroup()]);
    };

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

    const loadData = async (profilId) => {
        setLoadingRows(true);
        setErrors({});
        try {
            const [problemRes, dataRes] = await Promise.all([
                api.get(`/api/resume-protocoles-experimentations/problemes?profil_historique_id=${profilId}`),
                api.get(`/api/resume-protocoles-experimentations?profil_historique_id=${profilId}`),
            ]);

            const problems = Array.isArray(problemRes.data) ? problemRes.data : [];
            const rows = Array.isArray(dataRes.data) ? dataRes.data : [];

            const grouped = rows.reduce((acc, row) => {
                const key = String(row.matrice_probleme_id ?? '');
                if (!key) return acc;
                acc[key] = [...(acc[key] ?? []), row];
                return acc;
            }, {});

            setPertinentProblems(problems);
            setGroups(Object.keys(grouped).length
                ? Object.entries(grouped).map(([problemId, problemRows]) => ({
                    id: `group-${problemId}`,
                    matrice_probleme_id: problemId,
                    titres: valuesFromRows(problemRows, 'titre_experimentation'),
                    dispositifs: valuesFromRows(problemRows, 'dispositif_experimental'),
                    sujets: valuesFromRows(problemRows, 'sujet_special'),
                }))
                : [emptyGroup()]);
        } catch {
            resetForm();
        } finally {
            setLoadingRows(false);
        }
    };

    const validate = () => {
        const nextErrors = {};
        if (!selectedProfilId) nextErrors.profil_historique_id = 'Champ requis';
        groups.forEach((group, index) => {
            if (!group.matrice_probleme_id) nextErrors[`matrice_probleme_id_${index}`] = 'Champ requis';
            if (filledValues(group.titres).length === 0) {
                nextErrors[`titres_${index}`] = { general: 'Ajoutez au moins un titre d\'expérimentation.' };
            }
        });
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const experimentations = groups.flatMap(group => {
            const titreValues = group.titres.map(v => v.trim());
            const dispositifValues = group.dispositifs.map(v => v.trim());
            const sujetValues = group.sujets.map(v => v.trim());
            const rowCount = Math.max(titreValues.length, dispositifValues.length, sujetValues.length);

            return Array.from({ length: rowCount }, (_, i) => ({
                matrice_probleme_id: Number(group.matrice_probleme_id),
                titre_experimentation: titreValues[i] || '',
                dispositif_experimental: dispositifValues[i] || null,
                sujet_special: sujetValues[i] || null,
            })).filter(row => row.titre_experimentation || row.dispositif_experimental || row.sujet_special);
        });

        setSaving(true);
        try {
            await api.post('/api/resume-protocoles-experimentations', {
                profil_historique_id: selectedProfilId,
                experimentations,
            });
            setToast({ show: true, message: 'Résumé des protocoles enregistré.', type: 'success' });
            loadData(selectedProfilId);
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
                <Header title="Résumé des protocoles d'expérimentations" />

                <div className="p-6 space-y-5">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="flex items-center gap-3 bg-[#8BCF45] px-6 py-4">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-white/90 text-slate-900">
                                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-base font-black italic text-slate-950">Résumé des protocoles d'expérimentations</h2>
                                <p className="text-xs font-semibold text-slate-800/80 mt-0.5">Pour chaque problème, saisissez les titres, dispositifs et sujets spéciaux.</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Sélection du village */}
                            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                                        <span className="text-red-400">*</span> Village du profil historique
                                    </label>
                                    {loadingVillages ? (
                                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400">
                                            <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                            Chargement des villages...
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedProfilId}
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
                                    <p className="mt-1 text-xs text-amber-700">Créez d'abord un profil historique.</p>
                                </div>
                            ) : selectedProfilId && pertinentProblems.length === 0 && !loadingRows ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 text-center">
                                    <p className="text-sm font-bold text-amber-800">Aucun problème disponible</p>
                                    <p className="mt-1 text-xs text-amber-700">Remplissez d'abord le Curriculum d'apprentissage du CEP pour ce village.</p>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {loadingRows ? (
                                        <div className="flex items-center justify-center py-10 text-slate-400">
                                            <svg className="size-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                            Chargement...
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {groups.map((group, groupIndex) => (
                                                <div key={group.id} className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                                                    {/* En-tête du groupe */}
                                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-100 px-4 py-3">
                                                        <span className="text-sm font-extrabold text-slate-700">
                                                            Problème #{groupIndex + 1}
                                                        </span>
                                                        <button type="button" onClick={() => removeGroup(groupIndex)}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
                                                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            Retirer
                                                        </button>
                                                    </div>

                                                    <div className="p-4 space-y-4">
                                                        {/* Sélection du problème */}
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                                                                <span className="text-red-400">*</span> Problème (issu du Curriculum CEP)
                                                            </label>
                                                            <select
                                                                value={group.matrice_probleme_id}
                                                                onChange={e => updateGroup(groupIndex, 'matrice_probleme_id', e.target.value)}
                                                                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-100 ${errors[`matrice_probleme_id_${groupIndex}`] ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-teal-400'}`}>
                                                                <option value="">Sélectionner un problème pertinent</option>
                                                                {pertinentProblems.map(problem => (
                                                                    <option key={problem.id} value={problem.id}>{problem.probleme}</option>
                                                                ))}
                                                            </select>
                                                            {errors[`matrice_probleme_id_${groupIndex}`] && (
                                                                <p className="mt-1 text-xs text-red-500">{errors[`matrice_probleme_id_${groupIndex}`]}</p>
                                                            )}
                                                        </div>

                                                        {/* Les 3 colonnes multiples */}
                                                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                                            <MultiTextInputs
                                                                label="Titres des expérimentations (tests)"
                                                                addLabel="un titre"
                                                                values={group.titres}
                                                                onChange={(i, v) => updateListValue(groupIndex, 'titres', i, v)}
                                                                onAdd={() => addListValue(groupIndex, 'titres')}
                                                                onRemove={i => removeListValue(groupIndex, 'titres', i)}
                                                                placeholder="Titre de l'expérimentation"
                                                                required
                                                                errors={errors[`titres_${groupIndex}`]}
                                                            />

                                                            <MultiTextInputs
                                                                label="Dispositifs expérimentaux"
                                                                addLabel="un dispositif"
                                                                values={group.dispositifs}
                                                                onChange={(i, v) => updateListValue(groupIndex, 'dispositifs', i, v)}
                                                                onAdd={() => addListValue(groupIndex, 'dispositifs')}
                                                                onRemove={i => removeListValue(groupIndex, 'dispositifs', i)}
                                                                placeholder="Dispositif expérimental"
                                                            />

                                                            <MultiTextInputs
                                                                label="Sujets spéciaux"
                                                                addLabel="un sujet"
                                                                values={group.sujets}
                                                                onChange={(i, v) => updateListValue(groupIndex, 'sujets', i, v)}
                                                                onAdd={() => addListValue(groupIndex, 'sujets')}
                                                                onRemove={i => removeListValue(groupIndex, 'sujets', i)}
                                                                placeholder="Sujet spécial"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <button type="button" onClick={addGroup}
                                                disabled={!selectedProfilId || pertinentProblems.length === 0}
                                                className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-teal-300 bg-white px-4 py-2.5 text-sm font-semibold text-teal-600 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50 transition-all">
                                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                </svg>
                                                Ajouter un problème
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                            <button type="button"
                                onClick={() => { setGroups([emptyGroup()]); setErrors({}); }}
                                disabled={saving || loadingRows}
                                className="rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                                Réinitialiser
                            </button>
                            <button type="submit"
                                disabled={saving || loadingRows || villages.length === 0 || pertinentProblems.length === 0}
                                className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 transition-all">
                                {saving && (
                                    <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                )}
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Enregistrer
                            </button>
                        </div>
                    </form>
                </div>

                <ModernNotification
                    show={toast.show}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(t => ({ ...t, show: false }))}
                />
            </main>
        </div>
    );
}
