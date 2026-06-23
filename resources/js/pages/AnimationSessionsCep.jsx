import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import api from '../services/api';

/* ── Inputs multiples inline pour les innovations ────────────────────── */
function InnovationsInput({ values, onChange }) {
    const add    = () => onChange([...values, '']);
    const remove = (i) => onChange(values.length > 1 ? values.filter((_, idx) => idx !== i) : ['']);
    const update = (i, v) => onChange(values.map((val, idx) => idx === i ? v : val));

    return (
        <div className="space-y-1.5">
            {values.map((val, i) => (
                <div key={i} className="flex items-center gap-1.5">
                    <input value={val} onChange={e => update(i, e.target.value)}
                        placeholder="Ex : Clôture, Parcellisation…"
                        className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all" />
                    <button type="button" onClick={() => remove(i)}
                        className="flex size-6 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-400 hover:bg-red-100 transition-colors">
                        <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
            <button type="button" onClick={add}
                className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-800 transition-colors">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Ajouter
            </button>
        </div>
    );
}

/* ── Modal aperçu ────────────────────────────────────────────────────── */
function ApercuModal({ lignes, experimentations, dateSession, onClose }) {
    const printRef = useRef(null);

    const getTitre = (id) => experimentations.find(e => String(e.id) === String(id))?.titre_experimentation ?? '—';
    const getDispositif = (id) => experimentations.find(e => String(e.id) === String(id))?.dispositif_experimental ?? '';

    const handlePrint = () => {
        const content = printRef.current.innerHTML;
        const win = window.open('', '_blank');
        win.document.write(`
            <html><head><title>Animation sessions CEP</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 10px; margin: 15px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 3px 5px; vertical-align: top; }
                .title-row td { background: #8BCF45; font-weight: bold; text-align: center; font-size: 13px; padding: 8px; }
                .section-row td { background: #f9c784; font-weight: bold; text-align: center; }
                .header-row th { font-weight: bold; font-size: 9px; text-transform: uppercase; background: #f1f5f9; }
                ul { margin: 0; padding-left: 14px; }
                li { margin-bottom: 2px; }
            </style></head><body>${content}</body></html>
        `);
        win.document.close();
        win.print();
    };

    const COLS = [
        'Titres\nexpérimentations',
        'Dispositifs\nexpérimentaux',
        'Période\n(durée)',
        'Superficie couverte\npar l\'expérimentation',
        'Grandes innovations\ninstallées',
        'Appréciation générale\nde l\'évolution des\nexpérimentations',
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-7xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6">
                <div className="flex items-center justify-between bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <div>
                            <h2 className="text-base font-bold text-white">Aperçu — Animation des sessions CEP</h2>
                            {dateSession && <p className="text-xs text-cyan-200/70 mt-0.5">Session du {new Date(dateSession + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={handlePrint}
                            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-all">
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Imprimer
                        </button>
                        <button type="button" onClick={onClose}
                            className="flex size-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all">
                            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-x-auto" ref={printRef}>
                    <table className="w-full border-collapse text-xs">
                        <thead>
                            <tr>
                                <td colSpan={6} className="border border-black bg-[#8BCF45] py-3 text-center text-base font-extrabold text-slate-900">
                                    Annimation des sessions CEP
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={6} className="border border-black bg-[#f9c784] py-1.5 text-center text-xs font-bold text-slate-800">
                                    Etat des expérimentations (tests) en cours
                                </td>
                            </tr>
                            <tr>
                                {COLS.map((col, i) => (
                                    <th key={i} className="border border-black px-2 py-2 text-left align-top text-[10px] font-bold uppercase leading-tight bg-slate-50" style={{ minWidth: 100 }}>
                                        {col.split('\n').map((l, j) => <span key={j} className="block">{l}</span>)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {lignes.filter(l => l.resume_protocole_experimentation_id).length > 0
                                ? lignes.filter(l => l.resume_protocole_experimentation_id).map((l, i) => (
                                    <tr key={l._id ?? i}>
                                        <td className="border border-black px-2 py-2 font-medium">{getTitre(l.resume_protocole_experimentation_id)}</td>
                                        <td className="border border-black px-2 py-2">{getDispositif(l.resume_protocole_experimentation_id)}</td>
                                        <td className="border border-black px-2 py-2">{l.periode_duree}</td>
                                        <td className="border border-black px-2 py-2 text-center">{l.superficie_couverte || ''}</td>
                                        <td className="border border-black px-2 py-2">
                                            {l.innovations?.filter(Boolean).length > 0 && (
                                                <ul className="list-disc pl-3 space-y-0.5">
                                                    {l.innovations.filter(Boolean).map((inn, j) => <li key={j}>{inn}</li>)}
                                                </ul>
                                            )}
                                        </td>
                                        <td className="border border-black px-2 py-2">{l.appreciation_generale}</td>
                                    </tr>
                                ))
                                : Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j} className="border border-black px-2 py-6" />
                                        ))}
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/* ── Ligne vide ──────────────────────────────────────────────────────── */
const emptyLigne = () => ({
    _id: Math.random().toString(36).slice(2),
    resume_protocole_experimentation_id: '',
    periode_duree: '',
    superficie_couverte: '',
    innovations: [''],
    appreciation_generale: '',
});

/* ── Page principale ─────────────────────────────────────────────────── */
export default function AnimationSessionsCep() {
    const [villages, setVillages]             = useState([]);
    const [selectedVillage, setSelectedVillage] = useState('');
    const [dateSession, setDateSession]       = useState('');
    const [experimentations, setExperimentations] = useState([]);
    const [loadingExp, setLoadingExp]         = useState(false);
    const [lignes, setLignes]                 = useState([emptyLigne()]);
    const [saving, setSaving]                 = useState(false);
    const [errors, setErrors]                 = useState({});
    const [showPreview, setShowPreview]       = useState(false);
    const [toast, setToast]                   = useState({ show: false, message: '', type: 'success' });

    /* Charger la liste des villages (profil_historique) */
    useEffect(() => {
        api.get('/api/profil-historique')
            .then(res => setVillages(Array.isArray(res.data) ? res.data : []))
            .catch(() => {});
    }, []);

    /* Charger les expérimentations quand le village change */
    useEffect(() => {
        if (!selectedVillage) { setExperimentations([]); return; }
        setLoadingExp(true);
        api.get('/api/animation-sessions-cep/experimentations', {
            params: { profil_historique_id: selectedVillage },
        })
            .then(res => setExperimentations(Array.isArray(res.data) ? res.data : []))
            .catch(() => setExperimentations([]))
            .finally(() => setLoadingExp(false));
    }, [selectedVillage]);

    /* Charger les données existantes si village + date sélectionnés */
    const loadData = useCallback(async (villageId, date) => {
        if (!villageId) return;
        try {
            const res = await api.get('/api/animation-sessions-cep', {
                params: { profil_historique_id: villageId, date_session: date || undefined },
            });
            const data = Array.isArray(res.data) ? res.data : [];
            if (data.length > 0) {
                setLignes(data.map(r => ({
                    _id:                                  String(r.id),
                    resume_protocole_experimentation_id:  r.resume_protocole_experimentation_id ? String(r.resume_protocole_experimentation_id) : '',
                    periode_duree:                        r.periode_duree ?? '',
                    superficie_couverte:                  r.superficie_couverte != null ? String(r.superficie_couverte) : '',
                    innovations:                          Array.isArray(r.innovations) && r.innovations.length > 0 ? r.innovations : [''],
                    appreciation_generale:                r.appreciation_generale ?? '',
                })));
            } else {
                setLignes([emptyLigne()]);
            }
        } catch {}
    }, []);

    useEffect(() => { loadData(selectedVillage, dateSession); }, [selectedVillage, dateSession, loadData]);

    const updateLigne = (idx, field, value) =>
        setLignes(cur => cur.map((l, i) => i === idx ? { ...l, [field]: value } : l));

    const addLigne    = () => setLignes(c => [...c, emptyLigne()]);
    const removeLigne = (idx) => setLignes(c => c.length > 1 ? c.filter((_, i) => i !== idx) : [emptyLigne()]);

    /* Quand on choisit un titre, on pré-remplit automatiquement le dispositif via l'id */
    const getExp = (id) => experimentations.find(e => String(e.id) === String(id));

    const validate = () => {
        const next = {};
        lignes.forEach((l, i) => {
            if (!l.resume_protocole_experimentation_id) next[`exp_${i}`] = true;
        });
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedVillage) {
            setToast({ show: true, message: 'Sélectionnez un village CEP.', type: 'error' });
            return;
        }
        if (!validate()) return;

        const payload = {
            profil_historique_id: Number(selectedVillage),
            date_session: dateSession || null,
            lignes: lignes
                .filter(l => l.resume_protocole_experimentation_id)
                .map(l => ({
                    resume_protocole_experimentation_id: Number(l.resume_protocole_experimentation_id),
                    periode_duree:       l.periode_duree.trim() || null,
                    superficie_couverte: l.superficie_couverte !== '' ? Number(l.superficie_couverte) : null,
                    innovations:         l.innovations.map(v => v.trim()).filter(Boolean),
                    appreciation_generale: l.appreciation_generale.trim() || null,
                })),
        };

        if (payload.lignes.length === 0) {
            setToast({ show: true, message: 'Ajoutez au moins une expérimentation.', type: 'error' });
            return;
        }

        setSaving(true);
        try {
            const res = await api.post('/api/animation-sessions-cep', payload);
            setToast({ show: true, message: res.data.message, type: 'success' });
            loadData(selectedVillage, dateSession);
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.message || 'Une erreur est survenue.', type: 'error' });
        } finally { setSaving(false); }
    };

    const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all';
    const selectCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all';

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-60">
                <Header title="Animation des sessions CEP" />

                <div className="p-6 space-y-5">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* ── Carte session ─────────────────────────────── */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="flex items-center gap-3 bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                                <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <div>
                                    <h2 className="text-base font-bold text-white">Session d'animation</h2>
                                    <p className="text-xs text-cyan-200/70 mt-0.5">Sélectionnez le village CEP et la date de la session</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-end gap-6 p-6">
                                <div className="min-w-[260px]">
                                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Village CEP *</label>
                                    <select value={selectedVillage} onChange={e => { setSelectedVillage(e.target.value); setLignes([emptyLigne()]); }}
                                        className={selectCls}>
                                        <option value="">— Sélectionner un village —</option>
                                        {villages.map(v => (
                                            <option key={v.id} value={v.id}>
                                                {v.village}{v.commune?.nom ? ` — ${v.commune.nom}` : ''}{v.annee ? ` (${v.annee})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Date de la session</label>
                                    <input type="date" value={dateSession} onChange={e => setDateSession(e.target.value)}
                                        className={inputCls} style={{ minWidth: 180 }} />
                                </div>
                            </div>

                            {selectedVillage && !loadingExp && experimentations.length === 0 && (
                                <div className="mx-6 mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                    Aucune expérimentation trouvée pour ce village. Remplissez d'abord le <strong>Résumé des protocoles d'expérimentations</strong>.
                                </div>
                            )}
                        </div>

                        {/* ── Carte expérimentations ────────────────────── */}
                        {selectedVillage && experimentations.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="flex items-center gap-3 bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                                    <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <div>
                                        <h2 className="text-base font-bold text-white">Etat des expérimentations (tests) en cours</h2>
                                        <p className="text-xs text-cyan-200/70 mt-0.5">{lignes.filter(l => l.resume_protocole_experimentation_id).length} expérimentation(s) renseignée(s)</p>
                                    </div>
                                </div>

                                <div className="p-5 space-y-4 bg-slate-50/50">
                                    {lignes.map((ligne, idx) => {
                                        const exp = getExp(ligne.resume_protocole_experimentation_id);
                                        return (
                                            <div key={ligne._id} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                                                {/* En-tête de la ligne */}
                                                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                                        Expérimentation {idx + 1}
                                                    </span>
                                                    <button type="button" onClick={() => removeLigne(idx)}
                                                        className="flex size-6 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-400 hover:bg-red-100 transition-colors">
                                                        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                <div className="p-4 space-y-4">
                                                    {/* Ligne 1 : Titre + Dispositif */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                                                                Titre de l'expérimentation *
                                                            </label>
                                                            <select
                                                                value={ligne.resume_protocole_experimentation_id}
                                                                onChange={e => updateLigne(idx, 'resume_protocole_experimentation_id', e.target.value)}
                                                                className={`${selectCls} ${errors[`exp_${idx}`] ? 'border-red-400 bg-red-50' : ''}`}>
                                                                <option value="">— Sélectionner —</option>
                                                                {experimentations.map(e => (
                                                                    <option key={e.id} value={e.id}>{e.titre_experimentation}</option>
                                                                ))}
                                                            </select>
                                                            {errors[`exp_${idx}`] && (
                                                                <p className="mt-1 text-xs text-red-500">Sélectionnez une expérimentation.</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                                                                Dispositif expérimental
                                                            </label>
                                                            <div className={`${inputCls} text-slate-500 ${exp?.dispositif_experimental ? 'text-slate-800' : 'italic text-slate-400'}`}>
                                                                {exp?.dispositif_experimental || 'Auto-rempli selon le titre sélectionné'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Ligne 2 : Période + Superficie */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                                                                Période (durée)
                                                            </label>
                                                            <input value={ligne.periode_duree}
                                                                onChange={e => updateLigne(idx, 'periode_duree', e.target.value)}
                                                                placeholder="Ex : 3 mois, Juin–Août 2026…"
                                                                className={inputCls} />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                                                                Superficie couverte (ha)
                                                            </label>
                                                            <input value={ligne.superficie_couverte}
                                                                onChange={e => updateLigne(idx, 'superficie_couverte', e.target.value)}
                                                                type="number" min="0" step="0.01"
                                                                placeholder="Ex : 0.5"
                                                                className={inputCls} />
                                                        </div>
                                                    </div>

                                                    {/* Ligne 3 : Innovations + Appréciation */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                                                                Grandes innovations installées
                                                            </label>
                                                            <InnovationsInput
                                                                values={ligne.innovations}
                                                                onChange={v => updateLigne(idx, 'innovations', v)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                                                                Appréciation générale de l'évolution
                                                            </label>
                                                            <textarea value={ligne.appreciation_generale}
                                                                onChange={e => updateLigne(idx, 'appreciation_generale', e.target.value)}
                                                                rows={4}
                                                                placeholder="Appréciation générale de l'évolution des expérimentations…"
                                                                className={`${inputCls} resize-y min-h-[80px]`} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Ajouter une expérimentation */}
                                    <button type="button" onClick={addLigne}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/50 py-3 text-sm font-semibold text-teal-700 hover:border-teal-400 hover:bg-teal-50 transition-all">
                                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Ajouter une expérimentation
                                    </button>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4">
                                    <button type="button" onClick={() => setShowPreview(true)}
                                        className="flex items-center gap-2 rounded-xl border-2 border-[#062824] bg-white px-5 py-2.5 text-sm font-semibold text-[#062824] hover:bg-[#062824]/5 transition-colors">
                                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Aperçu
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <button type="button"
                                            onClick={() => { setLignes([emptyLigne()]); setErrors({}); }}
                                            disabled={saving}
                                            className="px-5 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                                            Réinitialiser
                                        </button>
                                        <button type="submit" disabled={saving}
                                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition-all">
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
                                </div>
                            </div>
                        )}

                    </form>
                </div>

                <ModernNotification show={toast.show} message={toast.message} type={toast.type}
                    onClose={() => setToast(t => ({ ...t, show: false }))} />
            </main>

            {showPreview && (
                <ApercuModal
                    lignes={lignes}
                    experimentations={experimentations}
                    dateSession={dateSession}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </div>
    );
}
