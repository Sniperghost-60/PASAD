import { useCallback, useEffect, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

/* ── Icônes ──────────────────────────────────────────────────────────── */
const IconMap    = () => <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
const IconPlus   = () => <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>;
const IconTrash  = () => <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;
const IconClose  = () => <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;
const IconUser   = () => <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;
const IconImport = () => <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>;

/* ── Catégorie âge ───────────────────────────────────────────────────── */
const anneeEnCours = new Date().getFullYear();
const getCategorie = (annee) => {
    if (!annee) return null;
    const age = anneeEnCours - Number(annee);
    if (age <= 35) return { code: 'J', label: 'Jeune',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (age <= 59) return { code: 'A', label: 'Adulte', cls: 'bg-amber-50  text-amber-700  border-amber-200'   };
    return                 { code: 'V', label: 'Vieux',  cls: 'bg-slate-100 text-slate-600  border-slate-200'   };
};

/* ── Modal : ajouter un membre ───────────────────────────────────────── */
function AjouterMembreModal({ cep, onAdded, onClose }) {
    const [disponibles, setDisponibles] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [selected, setSelected]       = useState(null);
    const [responsabilite, setRespo]    = useState('');
    const [saving, setSaving]           = useState(false);
    const [error, setError]             = useState('');

    const RESPONSABILITES = [
        'Président(e)', 'Vice-Président(e)', 'Secrétaire Général(e)',
        'Trésorier/Trésorière', 'Chargé(e) de communication', 'Membre',
    ];

    useEffect(() => {
        api.get(`/api/cep/${cep.id}/membres-disponibles`)
            .then(res => setDisponibles(Array.isArray(res.data) ? res.data : []))
            .catch(() => setDisponibles([]))
            .finally(() => setLoading(false));
    }, [cep.id]);

    const handleSubmit = async () => {
        if (!selected) { setError('Sélectionnez un participant.'); return; }
        setSaving(true); setError('');
        try {
            const res = await api.post(`/api/cep/${cep.id}/membres`, {
                identification_participant_cep_id: selected.id,
                responsabilite: responsabilite || null,
            });
            onAdded(res.data);
        } catch (e) {
            setError(e.response?.data?.message || 'Erreur lors de l\'ajout.');
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6">
                {/* Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-cyan-300"><IconUser /></span>
                        <div>
                            <h2 className="text-base font-bold text-white">Ajouter un membre</h2>
                            <p className="text-xs text-cyan-200/70 mt-0.5">{cep.nom_cep}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose}
                        className="flex size-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all">
                        <IconClose />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Responsabilité */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                            Responsabilité dans le CEP
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {RESPONSABILITES.map(r => (
                                <button key={r} type="button"
                                    onClick={() => setRespo(r === responsabilite ? '' : r)}
                                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                                        responsabilite === r
                                            ? 'border-teal-500 bg-teal-500 text-white'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50'
                                    }`}>
                                    {r}
                                </button>
                            ))}
                        </div>
                        <input
                            value={RESPONSABILITES.includes(responsabilite) ? '' : responsabilite}
                            onChange={e => setRespo(e.target.value)}
                            placeholder="Ou saisir une responsabilité personnalisée…"
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Liste participants disponibles */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                            Sélectionner un participant
                        </label>

                        {loading ? (
                            <div className="flex items-center justify-center py-8 text-sm text-slate-400">Chargement…</div>
                        ) : disponibles.length === 0 ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700 text-center">
                                Tous les participants identifiés sont déjà membres d'un CEP, ou aucun participant n'a encore été identifié.
                            </div>
                        ) : (
                            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200">
                                {disponibles.map(p => {
                                    const cat = getCategorie(p.annee_naissance);
                                    return (
                                        <button key={p.id} type="button"
                                            onClick={() => setSelected(selected?.id === p.id ? null : p)}
                                            className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors ${
                                                selected?.id === p.id
                                                    ? 'bg-teal-50 border-l-4 border-l-teal-500'
                                                    : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                                            }`}>
                                            {/* Avatar initiales */}
                                            <div className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                                                p.sexe === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                                            }`}>
                                                {p.nom_producteur.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-slate-800 truncate">
                                                    {p.nom_producteur} {p.prenoms_producteur}
                                                </p>
                                                <p className="text-xs text-slate-400 truncate">
                                                    {[p.village, p.arrondissement?.nom, p.commune?.nom].filter(Boolean).join(' · ')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                                                    p.sexe === 'M' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-pink-50 text-pink-600 border-pink-200'
                                                }`}>{p.sexe}</span>
                                                {cat && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${cat.cls}`}>{cat.code}</span>}
                                                {p.responsabilite_fonction && (
                                                    <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 max-w-[100px] truncate">
                                                        {p.responsabilite_fonction}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {error && <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">{error}</p>}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                    <span className="text-xs text-slate-400">
                        {selected ? `Sélectionné : ${selected.nom_producteur} ${selected.prenoms_producteur ?? ''}` : 'Aucune sélection'}
                    </span>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                            Annuler
                        </button>
                        <button type="button" onClick={handleSubmit} disabled={!selected || saving}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-600 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                            {saving
                                ? <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                : <IconPlus />}
                            Ajouter au CEP
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Formulaire création CEP ─────────────────────────────────────────── */
function FormCreerCep({ departements, onCreated, onCancel }) {
    const [communeCache, setCommuneCache] = useState({});
    const [arrCache, setArrCache]         = useState({});
    const [form, setForm] = useState({
        nom_cep: '', adresse: '',
        departement_id: '', commune_id: '', arrondissement_id: '', village: '',
        latitude: '', longitude: '',
    });
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState('');
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsError, setGpsError]     = useState('');

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const loadCommunes = async (deptId) => {
        if (!deptId || communeCache[deptId]) return;
        const res = await api.get(`/api/departements/${deptId}/communes`);
        setCommuneCache(c => ({ ...c, [deptId]: res.data }));
    };

    const loadArr = async (communeId) => {
        if (!communeId || arrCache[communeId]) return;
        const res = await api.get(`/api/communes/${communeId}/arrondissements`);
        setArrCache(c => ({ ...c, [communeId]: res.data }));
    };

    const handleGetGPS = () => {
        if (!navigator.geolocation) {
            setGpsError('La géolocalisation n\'est pas supportée par ce navigateur.');
            return;
        }
        setGpsLoading(true);
        setGpsError('');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                set('latitude',  pos.coords.latitude.toFixed(7));
                set('longitude', pos.coords.longitude.toFixed(7));
                setGpsLoading(false);
            },
            (err) => {
                const msgs = {
                    1: 'Permission refusée. Autorisez la localisation dans votre navigateur.',
                    2: 'Position indisponible. Vérifiez le GPS de l\'appareil.',
                    3: 'Délai d\'attente dépassé. Réessayez.',
                };
                setGpsError(msgs[err.code] ?? 'Erreur de géolocalisation.');
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nom_cep.trim()) { setError('Le nom du CEP est obligatoire.'); return; }
        setSaving(true); setError('');
        try {
            const res = await api.post('/api/cep', {
                nom_cep:          form.nom_cep.trim(),
                adresse:          form.adresse.trim() || null,
                departement_id:   form.departement_id   ? Number(form.departement_id)   : null,
                commune_id:       form.commune_id       ? Number(form.commune_id)       : null,
                arrondissement_id:form.arrondissement_id? Number(form.arrondissement_id): null,
                village:          form.village.trim()   || null,
                latitude:         form.latitude         ? Number(form.latitude)         : null,
                longitude:        form.longitude        ? Number(form.longitude)        : null,
            });
            onCreated(res.data);
        } catch (e) {
            setError(e.response?.data?.message || 'Erreur lors de la création.');
        } finally { setSaving(false); }
    };

    const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all';
    const selectCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all';
    const label = (txt) => <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{txt}</label>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-cyan-300"><IconMap /></span>
                <div>
                    <h2 className="text-base font-bold text-white">Créer un nouveau CEP</h2>
                    <p className="text-xs text-cyan-200/70 mt-0.5">Maximum 2 CEP par commune</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Nom + Adresse */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        {label('Nom du CEP *')}
                        <input value={form.nom_cep} onChange={e => set('nom_cep', e.target.value)}
                            placeholder="Ex : CEP Maïs-Toffo 2026" className={inputCls} />
                    </div>
                    <div>
                        {label('Adresse')}
                        <input value={form.adresse} onChange={e => set('adresse', e.target.value)}
                            placeholder="Adresse complète" className={inputCls} />
                    </div>
                </div>

                {/* Localisation */}
                <div>
                    <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Localisation</p>
                    <div className="grid grid-cols-4 gap-3">
                        <div>
                            {label('Département')}
                            <select value={form.departement_id}
                                onChange={e => { set('departement_id', e.target.value); set('commune_id', ''); set('arrondissement_id', ''); loadCommunes(e.target.value); }}
                                className={selectCls}>
                                <option value="">— Choisir —</option>
                                {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                            </select>
                        </div>
                        <div>
                            {label('Commune')}
                            <select value={form.commune_id}
                                onChange={e => { set('commune_id', e.target.value); set('arrondissement_id', ''); loadArr(e.target.value); }}
                                disabled={!form.departement_id}
                                className={selectCls}>
                                <option value="">— Choisir —</option>
                                {(communeCache[form.departement_id] ?? []).map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                            </select>
                        </div>
                        <div>
                            {label('Arrondissement')}
                            <select value={form.arrondissement_id}
                                onChange={e => set('arrondissement_id', e.target.value)}
                                disabled={!form.commune_id}
                                className={selectCls}>
                                <option value="">— Choisir —</option>
                                {(arrCache[form.commune_id] ?? []).map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                            </select>
                        </div>
                        <div>
                            {label('Village')}
                            <input value={form.village} onChange={e => set('village', e.target.value.toUpperCase())}
                                placeholder="Village" className={inputCls} style={{ textTransform: 'uppercase' }} />
                        </div>
                    </div>
                </div>

                {/* Coordonnées GPS — récupérées automatiquement */}
                <div>
                    <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Coordonnées GPS</p>

                    {form.latitude && form.longitude ? (
                        /* Coordonnées obtenues */
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                            </span>
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-emerald-700 mb-0.5">Position enregistrée</p>
                                <p className="font-mono text-sm text-emerald-900 font-bold">
                                    {form.latitude}, {form.longitude}
                                </p>
                            </div>
                            <button type="button"
                                onClick={() => { set('latitude', ''); set('longitude', ''); setGpsError(''); }}
                                className="flex size-7 items-center justify-center rounded-lg border border-emerald-300 bg-white text-emerald-500 hover:bg-emerald-100 transition-colors"
                                title="Effacer les coordonnées">
                                <IconClose />
                            </button>
                            <button type="button" onClick={handleGetGPS} disabled={gpsLoading}
                                className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50">
                                {gpsLoading
                                    ? <svg className="size-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                    : <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                }
                                Relocaliser
                            </button>
                        </div>
                    ) : (
                        /* Bouton de géolocalisation */
                        <div className="space-y-2">
                            <button type="button" onClick={handleGetGPS} disabled={gpsLoading}
                                className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/50 py-4 text-sm font-semibold text-teal-700 hover:border-teal-400 hover:bg-teal-50 disabled:opacity-60 transition-all">
                                {gpsLoading ? (
                                    <>
                                        <svg className="size-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                        </svg>
                                        Récupération de la position en cours…
                                    </>
                                ) : (
                                    <>
                                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        </svg>
                                        Récupérer ma position GPS automatiquement
                                    </>
                                )}
                            </button>
                            {gpsError && (
                                <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
                                    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                    </svg>
                                    {gpsError}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {error && <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">{error}</p>}

                <div className="flex items-center justify-end gap-3 pt-1">
                    <button type="button" onClick={onCancel}
                        className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                        Annuler
                    </button>
                    <button type="submit" disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition-all">
                        {saving
                            ? <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                            : <IconPlus />}
                        Créer le CEP
                    </button>
                </div>
            </form>
        </div>
    );
}

/* ── Carte CEP ───────────────────────────────────────────────────────── */
function CepCard({ cep, onDeleted, onMembreAdded, onMembreRemoved }) {
    const [showAddModal, setShowAddModal]   = useState(false);
    const [deletingId, setDeletingId]       = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const localisation = [cep.village, cep.arrondissement?.nom, cep.commune?.nom, cep.departement?.nom]
        .filter(Boolean).join(', ');

    const handleRemoveMembre = async (membre) => {
        setDeletingId(membre.id);
        try {
            await api.delete(`/api/cep/${cep.id}/membres/${membre.id}`);
            onMembreRemoved(cep.id, membre.id);
        } catch {}
        finally { setDeletingId(null); }
    };

    const handleDeleteCep = async () => {
        try {
            await api.delete(`/api/cep/${cep.id}`);
            onDeleted(cep.id);
        } catch {}
    };

    const nbH = cep.membres?.filter(m => m.participant?.sexe === 'M').length ?? 0;
    const nbF = cep.membres?.filter(m => m.participant?.sexe === 'F').length ?? 0;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* En-tête CEP */}
            <div className="bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white font-extrabold text-base">
                            {cep.nom_cep.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-white">{cep.nom_cep}</h3>
                            {cep.adresse && <p className="text-xs text-cyan-200/80 mt-0.5">{cep.adresse}</p>}
                        </div>
                    </div>
                    {/* Stats membres */}
                    <div className="flex items-center gap-2 shrink-0">
                        {nbH > 0 && <span className="rounded-full border border-blue-300/40 bg-blue-900/30 px-2.5 py-0.5 text-xs font-bold text-blue-200">{nbH}H</span>}
                        {nbF > 0 && <span className="rounded-full border border-pink-300/40 bg-pink-900/30 px-2.5 py-0.5 text-xs font-bold text-pink-200">{nbF}F</span>}
                        <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white">{(cep.membres?.length ?? 0)} membres</span>
                        {!confirmDelete ? (
                            <button type="button" onClick={() => setConfirmDelete(true)}
                                className="flex size-7 items-center justify-center rounded-lg border border-red-400/30 bg-red-900/20 text-red-300 hover:bg-red-900/40 transition-all"
                                title="Supprimer le CEP">
                                <IconTrash />
                            </button>
                        ) : (
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-red-300">Supprimer ?</span>
                                <button onClick={handleDeleteCep} className="rounded-lg bg-red-600 px-2 py-0.5 text-xs font-bold text-white hover:bg-red-700">Oui</button>
                                <button onClick={() => setConfirmDelete(false)} className="rounded-lg bg-white/10 px-2 py-0.5 text-xs text-white hover:bg-white/20">Non</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Localisation + Coordonnées */}
                {(localisation || cep.latitude) && (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        {localisation && (
                            <span className="flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/20 px-3 py-1 text-xs text-cyan-100">
                                <IconMap />{localisation}
                            </span>
                        )}
                        {cep.latitude && cep.longitude && (
                            <span className="rounded-xl bg-white/10 border border-white/20 px-3 py-1 text-xs text-cyan-100 font-mono">
                                {Number(cep.latitude).toFixed(4)}, {Number(cep.longitude).toFixed(4)}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Liste des membres */}
            <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Membres</h4>
                    <button type="button" onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors">
                        <IconImport /><span>Ajouter un membre</span>
                    </button>
                </div>

                {!cep.membres || cep.membres.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
                        <span className="text-2xl mb-2">👥</span>
                        <p className="text-sm font-semibold text-slate-500">Aucun membre dans ce CEP</p>
                        <p className="text-xs text-slate-400 mt-1">Cliquez sur "Ajouter un membre" pour commencer</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                        {cep.membres.map(m => {
                            const p   = m.participant;
                            const cat = getCategorie(p?.annee_naissance);
                            return (
                                <div key={m.id} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors">
                                    {/* Avatar */}
                                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                                        p?.sexe === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                                    }`}>
                                        {p?.nom_producteur?.charAt(0).toUpperCase() ?? '?'}
                                    </div>
                                    {/* Infos */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-slate-800 truncate">
                                            {p?.nom_producteur} {p?.prenoms_producteur}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {[p?.village, p?.arrondissement?.nom, p?.commune?.nom].filter(Boolean).join(' · ')}
                                        </p>
                                    </div>
                                    {/* Badges */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {p?.sexe && (
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                                                p.sexe === 'M' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-pink-50 text-pink-600 border-pink-200'
                                            }`}>{p.sexe}</span>
                                        )}
                                        {cat && (
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${cat.cls}`}>{cat.code}</span>
                                        )}
                                        {m.responsabilite && (
                                            <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[10px] font-semibold text-teal-700 max-w-[130px] truncate">
                                                {m.responsabilite}
                                            </span>
                                        )}
                                    </div>
                                    {/* Retirer */}
                                    <button type="button" onClick={() => handleRemoveMembre(m)}
                                        disabled={deletingId === m.id}
                                        className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 disabled:opacity-40 transition-colors"
                                        title="Retirer du CEP">
                                        <IconTrash />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {showAddModal && (
                <AjouterMembreModal
                    cep={cep}
                    onAdded={(membre) => { onMembreAdded(cep.id, membre); setShowAddModal(false); }}
                    onClose={() => setShowAddModal(false)}
                />
            )}
        </div>
    );
}

/* ── Page principale ─────────────────────────────────────────────────── */
export default function GestionCep() {
    const { activeCommune } = useAuth();
    const [ceps, setCeps]               = useState([]);
    const [departements, setDepts]      = useState([]);
    const [loading, setLoading]         = useState(true);
    const [showForm, setShowForm]       = useState(false);
    const [toast, setToast]             = useState({ show: false, message: '', type: 'success' });

    const notify = (message, type = 'success') =>
        setToast({ show: true, message, type });

    useEffect(() => {
        setLoading(true);
        const params = activeCommune ? { commune_id: activeCommune.id } : {};
        Promise.all([
            api.get('/api/cep', { params }),
            api.get('/api/departements'),
        ]).then(([cepRes, deptRes]) => {
            setCeps(Array.isArray(cepRes.data) ? cepRes.data : []);
            setDepts(Array.isArray(deptRes.data) ? deptRes.data : []);
        }).catch(() => {}).finally(() => setLoading(false));
    }, [activeCommune?.id]);

    const handleCreated = (newCep) => {
        setCeps(c => [{ ...newCep, membres: [] }, ...c]);
        setShowForm(false);
        notify(`CEP "${newCep.nom_cep}" créé avec succès !`);
    };

    const handleDeleted = (cepId) => {
        setCeps(c => c.filter(x => x.id !== cepId));
        notify('CEP supprimé.');
    };

    const handleMembreAdded = (cepId, membre) => {
        setCeps(c => c.map(x => x.id === cepId
            ? { ...x, membres: [...(x.membres ?? []), membre] }
            : x
        ));
        notify(`${membre.participant?.nom_producteur} ajouté au CEP.`);
    };

    const handleMembreRemoved = (cepId, membreId) => {
        setCeps(c => c.map(x => x.id === cepId
            ? { ...x, membres: x.membres.filter(m => m.id !== membreId) }
            : x
        ));
        notify('Membre retiré du CEP.');
    };

    const totalMembres = ceps.reduce((s, c) => s + (c.membres?.length ?? 0), 0);

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-60">
                <Header title="Gestion des CEP" />

                <div className="p-6 space-y-6">
                    {/* Barre d'actions + stats */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5">
                                <span className="text-xs font-semibold text-teal-600">CEP créés</span>
                                <span className="ml-2 text-lg font-extrabold text-teal-800">{ceps.length}</span>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                                <span className="text-xs font-semibold text-slate-500">Total membres</span>
                                <span className="ml-2 text-lg font-extrabold text-slate-700">{totalMembres}</span>
                            </div>
                        </div>
                        <button type="button" onClick={() => setShowForm(f => !f)}
                            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition-all ${
                                showForm
                                    ? 'border-2 border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                    : 'bg-gradient-to-r from-[#062824] to-teal-700 text-white hover:opacity-90'
                            }`}>
                            {showForm ? <><IconClose /><span>Annuler</span></> : <><IconPlus /><span>Nouveau CEP</span></>}
                        </button>
                    </div>

                    {/* Formulaire création */}
                    {showForm && (
                        <FormCreerCep
                            departements={departements}
                            onCreated={handleCreated}
                            onCancel={() => setShowForm(false)}
                        />
                    )}

                    {/* Contenu */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-slate-400">Chargement…</div>
                    ) : ceps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
                            <span className="text-5xl mb-4">🌾</span>
                            <h3 className="text-lg font-bold text-slate-600">Aucun CEP créé</h3>
                            <p className="mt-1 text-sm text-slate-400">Cliquez sur "Nouveau CEP" pour commencer</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {ceps.map(cep => (
                                <CepCard
                                    key={cep.id}
                                    cep={cep}
                                    onDeleted={handleDeleted}
                                    onMembreAdded={handleMembreAdded}
                                    onMembreRemoved={handleMembreRemoved}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <ModernNotification show={toast.show} message={toast.message} type={toast.type}
                    onClose={() => setToast(t => ({ ...t, show: false }))} />
            </main>
        </div>
    );
}
