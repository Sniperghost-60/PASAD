import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const filledValues = (values) => values.map(value => value.trim()).filter(Boolean);
const valuesFromRows = (rows, field) => {
    const values = rows.map(row => row[field] ?? '').filter(value => String(value).trim() !== '');
    return values.length ? values : [''];
};

const emptyProblemGroup = (suffix = Date.now()) => ({
    id: `problem-${suffix}`,
    matrice_probleme_id: '',
    periode_debut: '',
    periode_fin: '',
    options: [''],
    actions: [''],
    moyens: [''],
    responsables: [''],
});

function MultiTextInputs({ label, addLabel, values, onChange, onAdd, onRemove, placeholder, required, errors }) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {required && <span className="text-red-400">*</span>} {label}
            </label>
            {values.map((value, index) => (
                <div key={index} className="flex gap-2">
                    <textarea value={value}
                        onChange={e => onChange(index, e.target.value)}
                        rows={2}
                        placeholder={placeholder}
                        className={`min-h-[56px] flex-1 rounded-lg border bg-white px-3 py-2 text-sm outline-none resize-y focus:ring-2 focus:ring-teal-100 ${errors?.[index] ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-teal-400'}`} />
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

export default function CurriculumApprentissageCep() {
    const [searchParams] = useSearchParams();
    const initialProfilId = searchParams.get('profil_historique_id') || '';
    const { activeCommune } = useAuth();
    const [villages, setVillages] = useState([]);
    const [selectedProfilId, setSelectedProfilId] = useState(initialProfilId);
    const [pertinentProblems, setPertinentProblems] = useState([]);
    const [problemGroups, setProblemGroups] = useState([emptyProblemGroup()]);
    const [loadingVillages, setLoadingVillages] = useState(true);
    const [loadingRows, setLoadingRows] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => { setSelectedProfilId(''); resetForm(); loadVillages(); }, [activeCommune]);

    useEffect(() => {
        if (selectedProfilId) loadCurriculumData(selectedProfilId);
        else resetForm();
    }, [selectedProfilId]);

    const selectedVillage = useMemo(
        () => villages.find(v => String(v.profil_historique_id) === String(selectedProfilId)),
        [villages, selectedProfilId],
    );

    const resetForm = () => {
        setPertinentProblems([]);
        setProblemGroups([emptyProblemGroup()]);
        setErrors({});
    };

    const updateProblemGroup = (groupIndex, field, value) => {
        setProblemGroups(current => current.map((group, index) => (
            index === groupIndex ? { ...group, [field]: value } : group
        )));
    };

    const updateGroupListValue = (groupIndex, field, valueIndex, value) => {
        setProblemGroups(current => current.map((group, index) => {
            if (index !== groupIndex) return group;
            return {
                ...group,
                [field]: group[field].map((item, i) => i === valueIndex ? value : item),
            };
        }));
    };

    const addGroupListValue = (groupIndex, field) => {
        setProblemGroups(current => current.map((group, index) => (
            index === groupIndex ? { ...group, [field]: [...group[field], ''] } : group
        )));
    };

    const removeGroupListValue = (groupIndex, field, valueIndex) => {
        setProblemGroups(current => current.map((group, index) => {
            if (index !== groupIndex) return group;
            const next = group[field].filter((_, i) => i !== valueIndex);
            return { ...group, [field]: next.length ? next : [''] };
        }));
    };

    const addProblemGroup = () => {
        setProblemGroups(current => [...current, emptyProblemGroup(`${Date.now()}-${current.length}`)]);
    };

    const removeProblemGroup = (groupIndex) => {
        setProblemGroups(current => current.length > 1 ? current.filter((_, index) => index !== groupIndex) : [emptyProblemGroup()]);
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

    const loadCurriculumData = async (profilId) => {
        setLoadingRows(true);
        setErrors({});
        try {
            const [problemRes, curriculumRes] = await Promise.all([
                api.get(`/api/curriculum-apprentissage-cep/problemes-pertinents?profil_historique_id=${profilId}`),
                api.get(`/api/curriculum-apprentissage-cep?profil_historique_id=${profilId}`),
            ]);
            const problems = Array.isArray(problemRes.data) ? problemRes.data : [];
            const rows = Array.isArray(curriculumRes.data) ? curriculumRes.data : [];
            const groupedRows = rows.reduce((acc, row) => {
                const key = String(row.matrice_probleme_id ?? '');
                if (!key) return acc;
                acc[key] = [...(acc[key] ?? []), row];
                return acc;
            }, {});

            setPertinentProblems(problems);
            setProblemGroups(Object.keys(groupedRows).length ? Object.entries(groupedRows).map(([problemId, problemRows]) => ({
                id: `problem-${problemId}`,
                matrice_probleme_id: problemId,
                periode_debut: problemRows[0]?.periode_debut ?? '',
                periode_fin: problemRows[0]?.periode_fin ?? '',
                options: valuesFromRows(problemRows, 'option_solution_tester'),
                actions: valuesFromRows(problemRows, 'quoi_faire_activite'),
                moyens: valuesFromRows(problemRows, 'moyens'),
                responsables: valuesFromRows(problemRows, 'responsable'),
            })) : [emptyProblemGroup()]);
        } catch {
            resetForm();
        } finally {
            setLoadingRows(false);
        }
    };

    const validate = () => {
        const nextErrors = {};
        if (!selectedProfilId) nextErrors.profil_historique_id = 'Champ requis';
        problemGroups.forEach((group, index) => {
            if (!group.matrice_probleme_id) nextErrors[`matrice_probleme_id_${index}`] = 'Champ requis';
            if (group.periode_debut && group.periode_fin && group.periode_fin < group.periode_debut) nextErrors[`periode_${index}`] = 'Période invalide';
            if (filledValues(group.options).length === 0) nextErrors[`options_${index}`] = { general: 'Ajoutez au moins une option à tester.' };
            if (filledValues(group.actions).length === 0) nextErrors[`actions_${index}`] = { general: 'Ajoutez au moins une activité.' };
        });

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const activites = problemGroups.flatMap(group => {
            const optionValues = group.options.map(value => value.trim());
            const actionValues = group.actions.map(value => value.trim());
            const moyenValues = group.moyens.map(value => value.trim());
            const responsableValues = group.responsables.map(value => value.trim());
            const rowCount = Math.max(optionValues.length, actionValues.length, moyenValues.length, responsableValues.length);

            return Array.from({ length: rowCount }, (_, index) => ({
                matrice_probleme_id: Number(group.matrice_probleme_id),
                option_solution_tester: optionValues[index] || '',
                quoi_faire_activite: actionValues[index] || '',
                moyens: moyenValues[index] || null,
                periode_debut: group.periode_debut || null,
                periode_fin: group.periode_fin || null,
                responsable: responsableValues[index] || null,
            })).filter(row => row.option_solution_tester || row.quoi_faire_activite || row.moyens || row.responsable);
        });

        setSaving(true);
        try {
            await api.post('/api/curriculum-apprentissage-cep', {
                profil_historique_id: selectedProfilId,
                activites,
            });
            setToast({ show: true, message: "Curriculum d'apprentissage enregistré.", type: 'success' });
            loadCurriculumData(selectedProfilId);
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
                <Header title="Curriculum d'apprentissage du CEP" />

                <div className="p-6 space-y-5">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="flex items-center gap-3 bg-[#8BCF45] px-6 py-4">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-white/90 text-slate-900">
                                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13M6.75 4.5A2.25 2.25 0 004.5 6.75v10.5A2.25 2.25 0 006.75 19.5H12M17.25 4.5A2.25 2.25 0 0119.5 6.75v10.5a2.25 2.25 0 01-2.25 2.25H12" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-base font-black italic text-slate-950">Curriculum d'apprentissage du CEP</h2>
                                <p className="text-xs font-semibold text-slate-800/80 mt-0.5">Ajoutez plusieurs problèmes pertinents, chacun avec ses entrées multiples.</p>
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
                                    <p className="mt-1 text-xs text-amber-700">Créez d'abord un profil historique pour pouvoir saisir ce curriculum.</p>
                                </div>
                            ) : selectedProfilId && pertinentProblems.length === 0 && !loadingRows ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 text-center">
                                    <p className="text-sm font-bold text-amber-800">Aucun problème pertinent</p>
                                    <p className="mt-1 text-xs text-amber-700">Marquez d'abord les problèmes pertinents dans la matrice des problèmes et solutions.</p>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="space-y-4">
                                        {problemGroups.map((group, groupIndex) => (
                                            <div key={group.id} className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-100 px-4 py-3">
                                                    <span className="text-sm font-extrabold text-slate-700">Problème à résoudre #{groupIndex + 1}</span>
                                                    <button type="button" onClick={() => removeProblemGroup(groupIndex)}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
                                                        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Retirer
                                                    </button>
                                                </div>

                                                <div className="p-4 space-y-4">
                                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                                                                <span className="text-red-400">*</span> Problème à résoudre
                                                            </label>
                                                            <select value={group.matrice_probleme_id}
                                                                onChange={e => updateProblemGroup(groupIndex, 'matrice_probleme_id', e.target.value)}
                                                                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-100 ${errors[`matrice_probleme_id_${groupIndex}`] ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-teal-400'}`}>
                                                                <option value="">Sélectionner un problème pertinent</option>
                                                                {pertinentProblems.map(problem => (
                                                                    <option key={problem.id} value={problem.id}>{problem.probleme}</option>
                                                                ))}
                                                            </select>
                                                            {errors[`matrice_probleme_id_${groupIndex}`] && <p className="mt-1 text-xs text-red-500">{errors[`matrice_probleme_id_${groupIndex}`]}</p>}
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Période</label>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                <input type="date" value={group.periode_debut}
                                                                    onChange={e => updateProblemGroup(groupIndex, 'periode_debut', e.target.value)}
                                                                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-100 ${errors[`periode_${groupIndex}`] ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-teal-400'}`} />
                                                                <input type="date" value={group.periode_fin}
                                                                    onChange={e => updateProblemGroup(groupIndex, 'periode_fin', e.target.value)}
                                                                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-100 ${errors[`periode_${groupIndex}`] ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-teal-400'}`} />
                                                            </div>
                                                            {errors[`periode_${groupIndex}`] && <p className="mt-1 text-xs text-red-500">{errors[`periode_${groupIndex}`]}</p>}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                                                        <MultiTextInputs label="Option (solution) à tester"
                                                            addLabel="une option"
                                                            values={group.options}
                                                            onChange={(index, value) => updateGroupListValue(groupIndex, 'options', index, value)}
                                                            onAdd={() => addGroupListValue(groupIndex, 'options')}
                                                            onRemove={(index) => removeGroupListValue(groupIndex, 'options', index)}
                                                            placeholder="Option à tester"
                                                            required
                                                            errors={errors[`options_${groupIndex}`]} />

                                                        <MultiTextInputs label="Quoi faire (activité)"
                                                            addLabel="une activité"
                                                            values={group.actions}
                                                            onChange={(index, value) => updateGroupListValue(groupIndex, 'actions', index, value)}
                                                            onAdd={() => addGroupListValue(groupIndex, 'actions')}
                                                            onRemove={(index) => removeGroupListValue(groupIndex, 'actions', index)}
                                                            placeholder="Quoi faire"
                                                            required
                                                            errors={errors[`actions_${groupIndex}`]} />

                                                        <MultiTextInputs label="Moyens"
                                                            addLabel="un moyen"
                                                            values={group.moyens}
                                                            onChange={(index, value) => updateGroupListValue(groupIndex, 'moyens', index, value)}
                                                            onAdd={() => addGroupListValue(groupIndex, 'moyens')}
                                                            onRemove={(index) => removeGroupListValue(groupIndex, 'moyens', index)}
                                                            placeholder="Moyen" />

                                                        <MultiTextInputs label="Responsable"
                                                            addLabel="un responsable"
                                                            values={group.responsables}
                                                            onChange={(index, value) => updateGroupListValue(groupIndex, 'responsables', index, value)}
                                                            onAdd={() => addGroupListValue(groupIndex, 'responsables')}
                                                            onRemove={(index) => removeGroupListValue(groupIndex, 'responsables', index)}
                                                            placeholder="Responsable" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <button type="button" onClick={addProblemGroup}
                                            disabled={!selectedProfilId || pertinentProblems.length === 0}
                                            className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-teal-300 bg-white px-4 py-2.5 text-sm font-semibold text-teal-600 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50 transition-all">
                                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                            Ajouter un problème à résoudre
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                            <button type="button" onClick={() => {
                                setProblemGroups([emptyProblemGroup()]);
                                setErrors({});
                            }}
                                disabled={saving || loadingRows}
                                className="rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                                Réinitialiser
                            </button>
                            <button type="submit" disabled={saving || loadingRows || villages.length === 0 || pertinentProblems.length === 0}
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
