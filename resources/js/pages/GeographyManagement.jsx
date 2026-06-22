import { useEffect, useMemo, useState } from 'react';
import { Sidebar, Header, Icon, ICONS } from '../components/Layout';
import Toast from '../components/Toast';
import api from '../services/api';

const inputCls = (err) =>
    `w-full rounded-xl border ${err ? 'border-red-300' : 'border-slate-200'} bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100`;

function Field({ label, hint, error, children }) {
    return (
        <label className="block">
            <div className="mb-1.5 flex justify-between">
                <span className="text-sm font-bold text-slate-700">{label}</span>
                {hint && <span className="text-xs text-slate-400">{hint}</span>}
            </div>
            {children}
            {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
        </label>
    );
}

function EmptyState({ title, text }) {
    return (
        <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
            <div className="mb-3 grid size-12 place-items-center rounded-xl bg-white text-slate-400 shadow-sm">
                <Icon d={ICONS.map} className="size-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">{title}</p>
            <p className="mt-1 text-sm text-slate-400">{text}</p>
        </div>
    );
}

function LoadingList() {
    return (
        <div className="space-y-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
    );
}

function ActionButton({ title, icon, tone = 'slate', onClick, disabled }) {
    const styles = {
        slate: 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700',
        teal: 'border-teal-200 text-teal-600 hover:bg-teal-50',
        red: 'border-red-200 text-red-600 hover:bg-red-50',
    };

    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            disabled={disabled}
            className={'grid size-8 place-items-center rounded-lg border bg-white transition disabled:opacity-40 ' + styles[tone]}
        >
            <Icon d={icon} className="size-4" />
        </button>
    );
}

export default function GeographyManagement() {
    const [departements, setDepartements] = useState([]);
    const [communes, setCommunes] = useState([]);
    const [arrondissements, setArrondissements] = useState({});
    const [selectedDepartement, setSelectedDepartement] = useState(null);
    const [selectedCommune, setSelectedCommune] = useState(null);
    const [editing, setEditing] = useState({ type: null, item: null });
    const [depForm, setDepForm] = useState({ code: '', nom: '' });
    const [communeForm, setCommuneForm] = useState({ nom: '' });
    const [arrForm, setArrForm] = useState({ nom: '' });
    const [errors, setErrors] = useState({});
    const [search, setSearch] = useState('');
    const [loadingDeps, setLoadingDeps] = useState(true);
    const [loadingCommunes, setLoadingCommunes] = useState(false);
    const [loadingArrs, setLoadingArrs] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const notify = (message, type = 'success') => setToast({ show: true, message, type });
    const apiError = (err, fallback) =>
        err.response?.data?.message || Object.values(err.response?.data?.errors ?? {})?.[0]?.[0] || fallback;

    const loadDepartements = async (selectId = null) => {
        setLoadingDeps(true);
        try {
            const r = await api.get('/api/departements');
            const data = Array.isArray(r.data) ? r.data : [];
            setDepartements(data);
            const next = data.find(d => d.id === selectId) ?? data.find(d => d.id === selectedDepartement?.id) ?? data[0] ?? null;
            setSelectedDepartement(next);
        } catch {
            setDepartements([]);
            setSelectedDepartement(null);
        } finally {
            setLoadingDeps(false);
        }
    };

    useEffect(() => { loadDepartements(); }, []);

    const loadCommunes = async (departementId, selectId = null) => {
        if (!departementId) {
            setCommunes([]);
            setSelectedCommune(null);
            return;
        }

        setLoadingCommunes(true);
        setCommunes([]);
        setArrondissements({});
        try {
            const r = await api.get('/api/departements/' + departementId + '/communes');
            const data = Array.isArray(r.data) ? r.data : [];
            setCommunes(data);
            setSelectedCommune(data.find(c => c.id === selectId) ?? data[0] ?? null);
        } catch {
            setCommunes([]);
            setSelectedCommune(null);
        } finally {
            setLoadingCommunes(false);
        }
    };

    useEffect(() => {
        loadCommunes(selectedDepartement?.id);
        setEditing({ type: null, item: null });
        setCommuneForm({ nom: '' });
        setArrForm({ nom: '' });
    }, [selectedDepartement?.id]);

    const loadArrondissements = async (items = communes) => {
        if (items.length === 0) {
            setArrondissements({});
            return;
        }

        setLoadingArrs(true);
        try {
            const entries = await Promise.all(
                items.map(commune =>
                    api.get('/api/communes/' + commune.id + '/arrondissements')
                        .then(r => [commune.id, Array.isArray(r.data) ? r.data : []])
                        .catch(() => [commune.id, []])
                )
            );
            setArrondissements(Object.fromEntries(entries));
        } finally {
            setLoadingArrs(false);
        }
    };

    useEffect(() => { loadArrondissements(communes); }, [communes]);

    const filteredDepartements = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return departements;
        return departements.filter(dep => dep.nom?.toLowerCase().includes(q) || dep.code?.toLowerCase().includes(q));
    }, [departements, search]);

    const selectedArrondissements = selectedCommune ? (arrondissements[selectedCommune.id] ?? []) : [];
    const arrondissementsCount = Object.values(arrondissements).reduce((total, list) => total + list.length, 0);

    const resetForms = () => {
        setEditing({ type: null, item: null });
        setDepForm({ code: '', nom: '' });
        setCommuneForm({ nom: '' });
        setArrForm({ nom: '' });
        setErrors({});
    };

    const editDepartement = dep => {
        setEditing({ type: 'departement', item: dep });
        setDepForm({ code: dep.code ?? '', nom: dep.nom ?? '' });
        setErrors({});
    };

    const editCommune = commune => {
        setEditing({ type: 'commune', item: commune });
        setCommuneForm({ nom: commune.nom ?? '' });
        setErrors({});
    };

    const editArrondissement = arrondissement => {
        setEditing({ type: 'arrondissement', item: arrondissement });
        setArrForm({ nom: arrondissement.nom ?? '' });
        setErrors({});
    };

    const saveDepartement = async e => {
        e.preventDefault();
        const nextErrors = {};
        if (!depForm.code.trim()) nextErrors.depCode = 'Code requis';
        if (!depForm.nom.trim()) nextErrors.depNom = 'Nom requis';
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;

        setSaving(true);
        try {
            const payload = { code: depForm.code.trim().toUpperCase(), nom: depForm.nom.trim() };
            const r = editing.type === 'departement'
                ? await api.put('/api/departements/' + editing.item.id, payload)
                : await api.post('/api/departements', payload);
            resetForms();
            await loadDepartements(r.data.id);
            notify(editing.type === 'departement' ? 'Département modifié.' : 'Département ajouté.');
        } catch (err) {
            notify(apiError(err, 'Erreur lors de l enregistrement du département.'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const saveCommune = async e => {
        e.preventDefault();
        if (!selectedDepartement) return;
        if (!communeForm.nom.trim()) {
            setErrors({ communeNom: 'Nom requis' });
            return;
        }

        setSaving(true);
        try {
            const payload = { departement_id: selectedDepartement.id, nom: communeForm.nom.trim() };
            const r = editing.type === 'commune'
                ? await api.put('/api/communes/' + editing.item.id, payload)
                : await api.post('/api/communes', payload);
            resetForms();
            await loadCommunes(selectedDepartement.id, r.data.id);
            notify(editing.type === 'commune' ? 'Commune modifiée.' : 'Commune ajoutée.');
        } catch (err) {
            notify(apiError(err, 'Erreur lors de l enregistrement de la commune.'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const saveArrondissement = async e => {
        e.preventDefault();
        if (!selectedCommune) return;
        if (!arrForm.nom.trim()) {
            setErrors({ arrNom: 'Nom requis' });
            return;
        }

        setSaving(true);
        try {
            const payload = { commune_id: selectedCommune.id, nom: arrForm.nom.trim() };
            await (editing.type === 'arrondissement'
                ? api.put('/api/arrondissements/' + editing.item.id, payload)
                : api.post('/api/arrondissements', payload));
            resetForms();
            await loadArrondissements(communes);
            notify(editing.type === 'arrondissement' ? 'Arrondissement modifié.' : 'Arrondissement ajouté.');
        } catch (err) {
            notify(apiError(err, 'Erreur lors de l enregistrement de l arrondissement.'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const remove = async (type, item) => {
        const labels = { departement: 'ce département', commune: 'cette commune', arrondissement: 'cet arrondissement' };
        if (!window.confirm('Supprimer ' + labels[type] + ' ? Les éléments liés seront aussi supprimés.')) return;

        setSaving(true);
        try {
            const urls = {
                departement: '/api/departements/' + item.id,
                commune: '/api/communes/' + item.id,
                arrondissement: '/api/arrondissements/' + item.id,
            };
            await api.delete(urls[type]);
            resetForms();
            if (type === 'departement') await loadDepartements();
            if (type === 'commune') await loadCommunes(selectedDepartement.id);
            if (type === 'arrondissement') await loadArrondissements(communes);
            notify('Suppression effectuée.');
        } catch (err) {
            notify(apiError(err, 'Erreur lors de la suppression.'), 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 font-sans antialiased lg:flex">
            <Sidebar />
            <main className="min-w-0 flex-1 lg:ml-60">
                <Header title="Géographie" subtitle="Départements, communes et arrondissements" />

                <div className="space-y-6 px-4 py-6 sm:px-6">
                    <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900">Gestion géographique</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {departements.length} départements · {communes.length} communes · {loadingArrs ? '...' : arrondissementsCount} arrondissements
                            </p>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Icon d={ICONS.search} className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Rechercher un département..."
                                className={inputCls(false) + ' pl-9'}
                            />
                        </div>
                    </section>

                    <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr_1.15fr]">
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="bg-[#062824] px-5 py-4">
                                <p className="text-sm font-bold text-white">Départements</p>
                                <p className="text-xs text-cyan-300/70">Créer, modifier ou supprimer</p>
                            </div>
                            <form onSubmit={saveDepartement} className="space-y-4 border-b border-slate-100 p-5">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                    {editing.type === 'departement' ? 'Modifier le département' : 'Nouveau département'}
                                </p>
                                <div className="grid grid-cols-[0.5fr_1fr] gap-3">
                                    <Field label="Code" error={errors.depCode}>
                                        <input value={depForm.code} onChange={e => setDepForm(p => ({ ...p, code: e.target.value }))} className={inputCls(errors.depCode)} placeholder="ZOU" />
                                    </Field>
                                    <Field label="Nom" error={errors.depNom}>
                                        <input value={depForm.nom} onChange={e => setDepForm(p => ({ ...p, nom: e.target.value }))} className={inputCls(errors.depNom)} placeholder="Zou" />
                                    </Field>
                                </div>
                                <div className="flex justify-end gap-2">
                                    {editing.type === 'departement' && (
                                        <button type="button" onClick={resetForms} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Annuler</button>
                                    )}
                                    <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50">
                                        <Icon d={editing.type === 'departement' ? ICONS.check : ICONS.plus} className="size-4" />
                                        {editing.type === 'departement' ? 'Enregistrer' : 'Ajouter'}
                                    </button>
                                </div>
                            </form>
                            <div className="max-h-[34rem] overflow-y-auto p-3">
                                {loadingDeps ? <LoadingList /> : filteredDepartements.length === 0 ? (
                                    <EmptyState title="Aucun département" text="Essayez un autre terme de recherche." />
                                ) : (
                                    <div className="space-y-2">
                                        {filteredDepartements.map(dep => {
                                            const active = selectedDepartement?.id === dep.id;
                                            return (
                                                <div key={dep.id} className={'rounded-xl border p-2 transition ' + (active ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50')}>
                                                    <button type="button" onClick={() => setSelectedDepartement(dep)} className="w-full px-2 py-1.5 text-left">
                                                        <span className="flex items-center justify-between gap-3">
                                                            <span className={'font-bold ' + (active ? 'text-teal-800' : 'text-slate-700')}>{dep.nom}</span>
                                                            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200">{dep.code}</span>
                                                        </span>
                                                    </button>
                                                    <div className="mt-2 flex justify-end gap-2">
                                                        <ActionButton title="Modifier" icon={ICONS.edit} tone="teal" onClick={() => editDepartement(dep)} />
                                                        <ActionButton title="Supprimer" icon={ICONS.trash} tone="red" onClick={() => remove('departement', dep)} disabled={saving} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="bg-[#062824] px-5 py-4">
                                <p className="text-sm font-bold text-white">Communes</p>
                                <p className="text-xs text-cyan-300/70">{selectedDepartement?.nom ?? 'Sélectionnez un département'}</p>
                            </div>
                            <form onSubmit={saveCommune} className="space-y-4 border-b border-slate-100 p-5">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                    {editing.type === 'commune' ? 'Modifier la commune' : 'Nouvelle commune'}
                                </p>
                                <Field label="Nom de la commune" hint={selectedDepartement?.code} error={errors.communeNom}>
                                    <input disabled={!selectedDepartement} value={communeForm.nom} onChange={e => setCommuneForm({ nom: e.target.value })} className={inputCls(errors.communeNom)} placeholder="ex. Abomey-Calavi" />
                                </Field>
                                <div className="flex justify-end gap-2">
                                    {editing.type === 'commune' && (
                                        <button type="button" onClick={resetForms} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Annuler</button>
                                    )}
                                    <button disabled={saving || !selectedDepartement} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50">
                                        <Icon d={editing.type === 'commune' ? ICONS.check : ICONS.plus} className="size-4" />
                                        {editing.type === 'commune' ? 'Enregistrer' : 'Ajouter'}
                                    </button>
                                </div>
                            </form>
                            <div className="max-h-[34rem] overflow-y-auto p-3">
                                {loadingCommunes ? <LoadingList /> : communes.length === 0 ? (
                                    <EmptyState title="Aucune commune" text="Sélectionnez ou créez un département." />
                                ) : (
                                    <div className="space-y-2">
                                        {communes.map(commune => {
                                            const active = selectedCommune?.id === commune.id;
                                            const count = arrondissements[commune.id]?.length;
                                            return (
                                                <div key={commune.id} className={'rounded-xl border p-3 transition ' + (active ? 'border-teal-300 bg-teal-50' : 'border-slate-200 hover:bg-slate-50')}>
                                                    <button type="button" onClick={() => setSelectedCommune(commune)} className="w-full text-left">
                                                        <span className={'block truncate text-sm font-bold ' + (active ? 'text-teal-800' : 'text-slate-700')}>{commune.nom}</span>
                                                        <span className="mt-1 block text-xs text-slate-400">{count ?? '...'} arrondissement{count !== 1 ? 's' : ''}</span>
                                                    </button>
                                                    <div className="mt-3 flex justify-end gap-2">
                                                        <ActionButton title="Modifier" icon={ICONS.edit} tone="teal" onClick={() => editCommune(commune)} />
                                                        <ActionButton title="Supprimer" icon={ICONS.trash} tone="red" onClick={() => remove('commune', commune)} disabled={saving} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="bg-[#062824] px-5 py-4">
                                <p className="text-sm font-bold text-white">Arrondissements</p>
                                <p className="text-xs text-cyan-300/70">{selectedCommune?.nom ?? 'Sélectionnez une commune'}</p>
                            </div>
                            <form onSubmit={saveArrondissement} className="space-y-4 border-b border-slate-100 p-5">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                    {editing.type === 'arrondissement' ? 'Modifier l arrondissement' : 'Nouvel arrondissement'}
                                </p>
                                <Field label="Nom de l'arrondissement" error={errors.arrNom}>
                                    <input disabled={!selectedCommune} value={arrForm.nom} onChange={e => setArrForm({ nom: e.target.value })} className={inputCls(errors.arrNom)} placeholder="ex. Godomey" />
                                </Field>
                                <div className="flex justify-end gap-2">
                                    {editing.type === 'arrondissement' && (
                                        <button type="button" onClick={resetForms} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Annuler</button>
                                    )}
                                    <button disabled={saving || !selectedCommune} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50">
                                        <Icon d={editing.type === 'arrondissement' ? ICONS.check : ICONS.plus} className="size-4" />
                                        {editing.type === 'arrondissement' ? 'Enregistrer' : 'Ajouter'}
                                    </button>
                                </div>
                            </form>
                            <div className="max-h-[34rem] overflow-y-auto p-3">
                                {loadingArrs && selectedArrondissements.length === 0 ? <LoadingList /> : selectedArrondissements.length === 0 ? (
                                    <EmptyState title="Aucun arrondissement" text="Sélectionnez ou créez une commune." />
                                ) : (
                                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                                        {selectedArrondissements.map(arrondissement => (
                                            <div key={arrondissement.id} className="rounded-xl border border-slate-200 p-3">
                                                <p className="truncate text-sm font-bold text-slate-700">{arrondissement.nom}</p>
                                                <div className="mt-3 flex justify-end gap-2">
                                                    <ActionButton title="Modifier" icon={ICONS.edit} tone="teal" onClick={() => editArrondissement(arrondissement)} />
                                                    <ActionButton title="Supprimer" icon={ICONS.trash} tone="red" onClick={() => remove('arrondissement', arrondissement)} disabled={saving} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                title={toast.type === 'error' ? 'Erreur' : 'Succès'}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </div>
    );
}
