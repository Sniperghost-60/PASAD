import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const YEAR = new Date().getFullYear();
const emptyEvent = () => ({ annee: YEAR, evenements: '', impact: '' });

function EventRow({ index, event, onChange, onRemove, canRemove, errors }) {
    return (
        <div className="relative bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-xs font-bold text-teal-700">
                    Événement #{index + 1}
                </span>
                {canRemove && (
                    <button type="button" onClick={onRemove}
                        className="flex size-7 items-center justify-center rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors">
                        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
            <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5"><span className="text-red-400">*</span> Année</label>
                <input type="number" value={event.annee}
                    onChange={e => onChange('annee', parseInt(e.target.value) || YEAR)}
                    min="1900" max="2100"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all"
                    required />
            </div>
            <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5"><span className="text-red-400">*</span> Événements</label>
                <textarea value={event.evenements}
                    onChange={e => onChange('evenements', e.target.value)}
                    rows={3} placeholder="Décrire les événements marquants survenus cette année..."
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all resize-none ${errors[`ev_${index}_evenements`] ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-400'}`}
                    required />
                {errors[`ev_${index}_evenements`] && <p className="mt-1 text-xs text-red-500">Champ requis</p>}
            </div>
            <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5"><span className="text-red-400">*</span> Impact (changements induits)</label>
                <textarea value={event.impact}
                    onChange={e => onChange('impact', e.target.value)}
                    rows={3} placeholder="Décrire l'impact et les changements induits sur la communauté..."
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all resize-none ${errors[`ev_${index}_impact`] ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-400'}`}
                    required />
                {errors[`ev_${index}_impact`] && <p className="mt-1 text-xs text-red-500">Champ requis</p>}
            </div>
        </div>
    );
}

export default function ProfilHistorique() {
    const navigate = useNavigate();
    const { activeCommune: contextCommune, conseillerCommunes } = useAuth();
    const [communes, setCommunes] = useState([]);
    const [arrondissements, setArrondissements] = useState([]);
    const [loadingCommunes, setLoadingCommunes] = useState(true);
    const [loadingArr, setLoadingArr] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [selectedCommune, setSelectedCommune] = useState(null);
    const [form, setForm] = useState({ arrondissement_id: '', village: '', events: [emptyEvent()] });
    const [errors, setErrors] = useState({});

    useEffect(() => { loadCommunes(); }, []);

    // Pré-sélectionner la commune active du contexte
    useEffect(() => {
        if (contextCommune && communes.length > 0) {
            const found = communes.find(c => c.id === contextCommune.id);
            if (found && !selectedCommune) selectCommune(found);
        }
    }, [contextCommune, communes]);

    const loadCommunes = async () => {
        setLoadingCommunes(true);
        try {
            const res = await api.get('/api/user/communes');
            setCommunes(Array.isArray(res.data) ? res.data : []);
        } catch { setCommunes([]); } finally { setLoadingCommunes(false); }
    };

    const selectCommune = async (commune) => {
        setSelectedCommune(commune);
        setForm({ arrondissement_id: '', village: '', events: [emptyEvent()] });
        setErrors({});
        setLoadingArr(true);
        try {
            const res = await api.get(`/api/communes/${commune.id}/arrondissements`);
            setArrondissements(Array.isArray(res.data) ? res.data : []);
        } catch { setArrondissements([]); } finally { setLoadingArr(false); }
    };

    const updateEvent = (i, field, value) => {
        const events = [...form.events];
        events[i] = { ...events[i], [field]: value };
        setForm(f => ({ ...f, events }));
    };

    const addEvent = () => setForm(f => ({ ...f, events: [...f.events, emptyEvent()] }));
    const removeEvent = (i) => setForm(f => ({ ...f, events: f.events.filter((_, idx) => idx !== i) }));

    const validate = () => {
        const errs = {};
        if (!form.arrondissement_id) errs.arrondissement_id = 'Champ requis';
        if (!form.village.trim()) errs.village = 'Champ requis';
        form.events.forEach((ev, i) => {
            if (!ev.evenements.trim()) errs[`ev_${i}_evenements`] = 'Requis';
            if (!ev.impact.trim()) errs[`ev_${i}_impact`] = 'Requis';
        });
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            await api.post('/api/profil-historique', {
                commune_id: selectedCommune.id,
                arrondissement_id: form.arrondissement_id,
                village: form.village,
                events: form.events,
            });
            setToast({ show: true, message: `${form.events.length} événement(s) enregistré(s) !`, type: 'success' });
            setForm({ arrondissement_id: '', village: '', events: [emptyEvent()] });
            setErrors({});
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.message || 'Une erreur est survenue.', type: 'error' });
        } finally { setLoading(false); }
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-60">
                <Header title="Profil historique" />
                <div className="p-6 space-y-6">

                    {/* ÉTAPE 1 — Sélection commune (seulement si pas encore sélectionnée) */}
                    {!selectedCommune && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="flex items-center gap-3 bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                                <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div>
                                    <h2 className="text-base font-bold text-white">Commune d'intervention</h2>
                                    <p className="text-xs text-cyan-200/70 mt-0.5">Sélectionnez la commune pour laquelle vous saisissez les données</p>
                                </div>
                            </div>
                            <div className="p-5">
                                {loadingCommunes ? (
                                    <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
                                        <svg className="size-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                        <span className="text-sm">Chargement des communes...</span>
                                    </div>
                                ) : communes.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-amber-50 border border-amber-200">
                                            <svg className="size-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700">Aucune commune affectée</p>
                                        <p className="mt-1 text-xs text-slate-400">Contactez votre administrateur pour affecter des communes à votre compte.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                        {communes.map(c => (
                                            <button key={c.id} type="button" onClick={() => selectCommune(c)}
                                                className="group relative flex flex-col items-start gap-1 rounded-xl border-2 border-slate-200 bg-white p-4 text-left transition-all hover:border-teal-400 hover:bg-teal-50 hover:shadow-md">
                                                <svg className="size-5 text-slate-400 group-hover:text-teal-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                <p className="text-sm font-bold text-slate-700 group-hover:text-teal-800 leading-tight transition-colors">{c.nom}</p>
                                                <p className="text-xs text-slate-400 group-hover:text-teal-600 transition-colors">{c.departement?.nom}</p>
                                                <span className="mt-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 group-hover:bg-teal-100 group-hover:text-teal-700 transition-colors">
                                                    {c.arrondissements_count} arrond.
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* FORMULAIRE (visible après sélection commune) */}
                    {selectedCommune && (
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Carte localisation avec champs pré-remplis */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="flex items-center gap-3 bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                                    <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <div className="flex-1">
                                        <h2 className="text-base font-bold text-white">Localisation du village</h2>
                                        <p className="text-xs text-cyan-200/70 mt-0.5">Département et commune pré-remplis · complétez l'arrondissement et le village</p>
                                    </div>
                                    {/* Bouton changer commune (si plusieurs communes disponibles) */}
                                    {communes.length > 1 && (
                                        <button type="button"
                                            onClick={() => { setSelectedCommune(null); setForm({ arrondissement_id:'', village:'', events:[emptyEvent()] }); }}
                                            className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-all">
                                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                            Changer de commune
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 p-6">
                                    {/* Département — lecture seule */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Département</label>
                                        <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5">
                                            <svg className="size-4 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                            <span className="text-sm font-bold text-teal-800 truncate">{selectedCommune.departement?.nom}</span>
                                        </div>
                                    </div>

                                    {/* Commune — lecture seule */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Commune</label>
                                        <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5">
                                            <svg className="size-4 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            <span className="text-sm font-bold text-teal-800 truncate">{selectedCommune.nom}</span>
                                        </div>
                                    </div>

                                    {/* Arrondissement — sélection */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                                            <span className="text-red-400">*</span> Arrondissement
                                        </label>
                                        {loadingArr ? (
                                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400">
                                                <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                                Chargement...
                                            </div>
                                        ) : (
                                            <select value={form.arrondissement_id}
                                                onChange={e => setForm(f => ({ ...f, arrondissement_id: e.target.value }))}
                                                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-100 transition-all ${errors.arrondissement_id ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-400 focus:bg-white'}`}
                                                required>
                                                <option value="">— Sélectionner —</option>
                                                {arrondissements.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                                            </select>
                                        )}
                                        {errors.arrondissement_id && <p className="mt-1 text-xs text-red-500">{errors.arrondissement_id}</p>}
                                    </div>

                                    {/* Village — saisie */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                                            <span className="text-red-400">*</span> Village
                                        </label>
                                        <input type="text" value={form.village}
                                            onChange={e => setForm(f => ({ ...f, village: e.target.value.toUpperCase() }))}
                                            placeholder="Nom du village"
                                            style={{ textTransform: 'uppercase' }}
                                            className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-100 transition-all ${errors.village ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-400 focus:bg-white'}`}
                                            required />
                                        {errors.village && <p className="mt-1 text-xs text-red-500">{errors.village}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Événements multiples */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="flex items-center gap-3 bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                                    <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <div className="flex-1">
                                        <h2 className="text-base font-bold text-white">Événements historiques</h2>
                                        <p className="text-xs text-cyan-200/70 mt-0.5">Ajoutez autant d'événements que nécessaire pour ce village</p>
                                    </div>
                                    <span className="rounded-full bg-teal-500/30 border border-teal-400/40 px-3 py-0.5 text-xs font-bold text-cyan-200">
                                        {form.events.length} événement(s)
                                    </span>
                                </div>

                                <div className="p-5 space-y-4 bg-slate-50/50">
                                    {form.events.map((ev, i) => (
                                        <EventRow key={i} index={i} event={ev}
                                            onChange={(field, val) => updateEvent(i, field, val)}
                                            onRemove={() => removeEvent(i)}
                                            canRemove={form.events.length > 1}
                                            errors={errors} />
                                    ))}
                                    <button type="button" onClick={addEvent}
                                        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-teal-300 py-3 text-sm font-semibold text-teal-600 hover:border-teal-400 hover:bg-teal-50 transition-all">
                                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                        Ajouter un événement
                                    </button>
                                </div>

                                <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
                                    <button type="button" onClick={() => setForm({ arrondissement_id:'', village:'', events:[emptyEvent()] })}
                                        className="px-5 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                                        Réinitialiser
                                    </button>
                                    <button type="submit" disabled={loading}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 text-sm font-bold text-white shadow-sm hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                        {loading && <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        Enregistrer {form.events.length > 1 ? `(${form.events.length} événements)` : ''}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* Bouton voir la liste */}
                    <div className="flex justify-end">
                        <button type="button" onClick={() => navigate('/profil-historique/liste')}
                            className="flex items-center gap-2 rounded-xl bg-[#062824] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-900 transition-all">
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h12" />
                            </svg>
                            Voir la liste des profils historiques
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                </div>
                <ModernNotification show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(t => ({ ...t, show: false }))} />
            </main>
        </div>
    );
}
