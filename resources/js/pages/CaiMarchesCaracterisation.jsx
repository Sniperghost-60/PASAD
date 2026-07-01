import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import api from '../services/api';

/* ── Constantes (variables fixes du tableau) ─────────────────────────── */
const VARS_MARCHE = [
    { key: 'distance',            label: 'Distance (km)' },
    { key: 'type_marche',         label: 'Type (physique, virtuel, institutionnel, etc.)' },
    { key: 'localisation',        label: 'Localisation (local, urbain, régional, international)' },
    { key: 'frequence_animation', label: "Fréquence d'animation / d'achat" },
    { key: 'etat_route',          label: 'État de la route' },
    { key: 'facilite_transport',  label: 'Facilité de transport des produits' },
    { key: 'cout_transport',      label: 'Coût du transport (FCFA)' },
    { key: 'securite',            label: 'Sécurité (risques de braquage, accident)' },
];

const VARS_PRODUIT = [
    { key: 'couleur',                        label: 'Couleur' },
    { key: 'forme',                          label: 'Forme' },
    { key: 'duree_conservation',             label: 'Durée de conservation' },
    { key: 'variete_type',                   label: 'Variété / type' },
    { key: 'mesure_equivalence',             label: 'Mesure et équivalence en kg' },
    { key: 'duree_cycle',                    label: 'Durée du cycle' },
    { key: 'prix_minimum',                   label: 'Prix minimum' },
    { key: 'prix_maximum',                   label: 'Prix maximum' },
    { key: 'prix_median',                    label: 'Prix médian' },
    { key: 'type_emballage',                 label: "Type d'emballage" },
    { key: 'caracteristiques_organoleptiques', label: 'Caractéristiques organoleptiques' },
    { key: 'certification_label',            label: 'Certification / Label' },
];

/* ── Helpers ─────────────────────────────────────────────────────────── */
function emptyProduit() {
    return Object.fromEntries([
        ['nom_produit', ''],
        ...VARS_PRODUIT.map(v => [v.key, '']),
    ]);
}

function emptyMarche() {
    return {
        _id: Math.random().toString(36).slice(2),
        nom_marche: '',
        ...Object.fromEntries(VARS_MARCHE.map(v => [v.key, ''])),
        produits: [emptyProduit()],
    };
}

function marcheFromApi(r) {
    return {
        _id: String(r.id),
        nom_marche: r.nom_marche ?? '',
        ...Object.fromEntries(VARS_MARCHE.map(v => [v.key, r[v.key] ?? ''])),
        produits: r.produits?.length
            ? r.produits.map(p => ({
                nom_produit: p.nom_produit ?? '',
                ...Object.fromEntries(VARS_PRODUIT.map(v => [v.key, p[v.key] ?? ''])),
            }))
            : [emptyProduit()],
    };
}

/* ── Modal aperçu / impression ───────────────────────────────────────── */
function ApercuModal({ marches, dateSession, onClose }) {
    const printRef = useRef(null);

    const handlePrint = () => {
        const content = printRef.current.innerHTML;
        const win = window.open('', '_blank');
        win.document.write(`
            <html><head><title>Marchés agroécologiques CAI</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 9px; margin: 12px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 3px 4px; vertical-align: top; }
                .title-row td { background: #F59E0B; font-weight: bold; text-align: center; font-size: 11px; color: #fff; padding: 5px; }
                .var-label { background: #FEF3C7; font-weight: bold; font-size: 9px; }
                .section-header td { background: #92400E; color: #fff; font-weight: bold; font-size: 9px; text-align: center; }
                .col-header { background: #FDE68A; font-weight: bold; text-align: center; font-size: 9px; }
            </style></head><body>${content}</body></html>
        `);
        win.document.close();
        win.print();
    };

    const filled = marches.filter(m => m.nom_marche.trim());

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-7xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6">
                <div className="flex items-center justify-between bg-gradient-to-r from-amber-900 to-amber-700 px-6 py-4">
                    <div>
                        <h2 className="text-base font-bold text-white">Aperçu — Caractérisation des marchés</h2>
                        {dateSession && (
                            <p className="text-xs text-amber-200/70 mt-0.5">
                                Session du {new Date(dateSession).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={handlePrint}
                            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-all">
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Imprimer
                        </button>
                        <button type="button" onClick={onClose}
                            className="rounded-xl border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20 transition-all">
                            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-x-auto" ref={printRef}>
                    {filled.length === 0 ? (
                        <p className="text-center text-gray-400 italic py-8">Aucun marché renseigné</p>
                    ) : (
                        <table className="w-full border-collapse text-xs">
                            <tbody>
                                <tr className="title-row">
                                    <td colSpan={filled.length + 1} className="border border-gray-400 bg-amber-400 font-bold text-center py-2 text-sm">
                                        Étape 3 : Caractérisation des marchés de produits agroécologiques
                                    </td>
                                </tr>
                                {/* En-têtes marchés */}
                                <tr>
                                    <th className="border border-gray-400 bg-amber-100 px-3 py-2 font-bold text-left">Variables marché</th>
                                    {filled.map((m, i) => (
                                        <th key={m._id} className="col-header border border-gray-400 px-3 py-2 min-w-[140px]">
                                            Marché {i + 1}{m.nom_marche ? ` : ${m.nom_marche}` : ''}
                                        </th>
                                    ))}
                                </tr>
                                {/* Variables marché */}
                                {VARS_MARCHE.map(v => (
                                    <tr key={v.key}>
                                        <td className="var-label border border-gray-300 px-3 py-1.5">{v.label}</td>
                                        {filled.map(m => (
                                            <td key={m._id} className="border border-gray-300 px-3 py-1.5">{m[v.key]}</td>
                                        ))}
                                    </tr>
                                ))}
                                {/* Section produits */}
                                <tr className="section-header">
                                    <td colSpan={filled.length + 1} className="border border-gray-400 bg-amber-800 text-white font-bold text-center py-1.5">
                                        Produits végétaux agroécologiques
                                    </td>
                                </tr>
                                {/* Pour chaque produit (max des marchés) */}
                                {Array.from({ length: Math.max(...filled.map(m => m.produits.length)) }).map((_, pi) => (
                                    <>
                                        <tr key={`ph-${pi}`}>
                                            <td className="col-header border border-gray-400 px-3 py-1.5 font-bold">Produit {pi + 1}</td>
                                            {filled.map(m => (
                                                <td key={m._id} className="col-header border border-gray-400 px-3 py-1.5 text-center font-bold">
                                                    {m.produits[pi]?.nom_produit || `P${pi + 1}`}
                                                </td>
                                            ))}
                                        </tr>
                                        {VARS_PRODUIT.map(v => (
                                            <tr key={`${pi}-${v.key}`}>
                                                <td className="var-label border border-gray-300 px-3 py-1.5 pl-5">{v.label}</td>
                                                {filled.map(m => (
                                                    <td key={m._id} className="border border-gray-300 px-3 py-1.5">
                                                        {m.produits[pi]?.[v.key] ?? ''}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Composant carte marché ───────────────────────────────────────────── */
function MarcheCard({ marche, index, total, onChange, onRemove }) {
    const [expanded, setExpanded] = useState(true);
    const [prodExpanded, setProdExpanded] = useState([true]);

    const setField = (key, val) => onChange({ ...marche, [key]: val });

    const setProduit = (pi, key, val) => {
        const updated = marche.produits.map((p, i) => i === pi ? { ...p, [key]: val } : p);
        onChange({ ...marche, produits: updated });
    };

    const addProduit = () => {
        onChange({ ...marche, produits: [...marche.produits, emptyProduit()] });
        setProdExpanded(prev => [...prev, true]);
    };

    const removeProduit = (pi) => {
        if (marche.produits.length <= 1) return;
        onChange({ ...marche, produits: marche.produits.filter((_, i) => i !== pi) });
        setProdExpanded(prev => prev.filter((_, i) => i !== pi));
    };

    const toggleProd = (pi) => setProdExpanded(prev => prev.map((v, i) => i === pi ? !v : v));

    return (
        <div className="rounded-2xl border border-amber-100 bg-white shadow-sm overflow-hidden">
            {/* En-tête marché */}
            <button
                type="button"
                onClick={() => setExpanded(v => !v)}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-amber-50/50 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-amber-100">
                        <svg className="size-4 text-amber-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">Marché {index + 1}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {marche.nom_marche || <span className="italic">Nom non renseigné</span>}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {total > 1 && (
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); onRemove(); }}
                            className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                    <svg className={`size-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {expanded && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-5">
                    {/* Nom du marché */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                            Nom du marché <span className="text-red-500">*</span>
                        </label>
                        <input type="text" value={marche.nom_marche}
                            onChange={e => setField('nom_marche', e.target.value)}
                            placeholder="Nom du marché"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100" />
                    </div>

                    {/* Section variables marché */}
                    <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-800">Variables marché</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {VARS_MARCHE.map(v => (
                                <div key={v.key}>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">{v.label}</label>
                                    <input type="text" value={marche[v.key]}
                                        onChange={e => setField(v.key, e.target.value)}
                                        placeholder="—"
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-100" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section produits */}
                    <div>
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-800">
                            Produits végétaux agroécologiques
                        </p>
                        <div className="space-y-2">
                            {marche.produits.map((prod, pi) => (
                                <div key={pi} className="rounded-xl border border-amber-100 bg-amber-50/40 overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => toggleProd(pi)}
                                        className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-amber-50 transition-colors">
                                        <span className="text-xs font-bold text-amber-900">
                                            Produit {pi + 1}{prod.nom_produit ? ` — ${prod.nom_produit}` : ''}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {marche.produits.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={e => { e.stopPropagation(); removeProduit(pi); }}
                                                    className="rounded p-1 text-red-400 hover:text-red-600 transition-colors">
                                                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                            <svg className={`size-4 text-amber-700 transition-transform ${prodExpanded[pi] ? 'rotate-180' : ''}`}
                                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>

                                    {prodExpanded[pi] && (
                                        <div className="border-t border-amber-100 px-4 pb-4 pt-3 space-y-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Nom du produit</label>
                                                <input type="text" value={prod.nom_produit}
                                                    onChange={e => setProduit(pi, 'nom_produit', e.target.value)}
                                                    placeholder="Nom du produit végétal"
                                                    className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-amber-400 focus:outline-none" />
                                            </div>
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                {VARS_PRODUIT.map(v => (
                                                    <div key={v.key}>
                                                        <label className="block text-xs font-semibold text-gray-500 mb-1">{v.label}</label>
                                                        <input type="text" value={prod[v.key]}
                                                            onChange={e => setProduit(pi, v.key, e.target.value)}
                                                            placeholder="—"
                                                            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-amber-400 focus:outline-none" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <button type="button" onClick={addProduit}
                                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-amber-300 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors">
                                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                                </svg>
                                Ajouter un produit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Page principale ─────────────────────────────────────────────────── */
export default function CaiMarchesCaracterisation() {
    const [dateSession, setDateSession] = useState('');
    const [marches, setMarches]         = useState([emptyMarche()]);
    const [loading, setLoading]         = useState(false);
    const [saving, setSaving]           = useState(false);
    const [showApercu, setShowApercu]   = useState(false);
    const [toast, setToast]             = useState({ show: false, message: '', type: 'success' });

    const notify = (message, type = 'success') => setToast({ show: true, message, type });

    const loadSession = useCallback(async (date) => {
        setLoading(true);
        try {
            const res = await api.get(`/cai/marches-caracterisation?date_session=${date}`);
            setMarches(res.data.length ? res.data.map(marcheFromApi) : [emptyMarche()]);
        } catch {
            setMarches([emptyMarche()]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (dateSession) loadSession(dateSession);
        else setMarches([emptyMarche()]);
    }, [dateSession, loadSession]);

    const updateMarche = (id, updated) =>
        setMarches(prev => prev.map(m => m._id === id ? updated : m));

    const addMarche = () => setMarches(prev => [...prev, emptyMarche()]);

    const removeMarche = (id) =>
        setMarches(prev => prev.length > 1 ? prev.filter(m => m._id !== id) : [emptyMarche()]);

    const handleSave = async () => {
        const filled = marches.filter(m => m.nom_marche.trim());
        if (filled.length === 0) {
            notify('Renseignez le nom d\'au moins un marché avant d\'enregistrer.', 'warning');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                date_session: dateSession || null,
                marches: filled.map(m => ({
                    nom_marche:           m.nom_marche.trim(),
                    distance:             m.distance.trim()             || null,
                    type_marche:          m.type_marche.trim()          || null,
                    localisation:         m.localisation.trim()         || null,
                    frequence_animation:  m.frequence_animation.trim()  || null,
                    etat_route:           m.etat_route.trim()           || null,
                    facilite_transport:   m.facilite_transport.trim()   || null,
                    cout_transport:       m.cout_transport.trim()        || null,
                    securite:             m.securite.trim()             || null,
                    produits: m.produits
                        .filter(p => p.nom_produit.trim() || VARS_PRODUIT.some(v => p[v.key].trim()))
                        .map(p => ({
                            nom_produit: p.nom_produit.trim() || null,
                            ...Object.fromEntries(VARS_PRODUIT.map(v => [v.key, p[v.key].trim() || null])),
                        })),
                })),
            };
            await api.post('/cai/marches-caracterisation', payload);
            notify(`${payload.marches.length} marché(s) enregistré(s) avec succès.`);
        } catch (err) {
            notify(err.response?.data?.message ?? err.message ?? 'Erreur inconnue', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="ml-60 flex flex-1 flex-col">
                <Header />
                <main className="flex-1 p-6 space-y-5">

                    {/* En-tête */}
                    <div className="rounded-2xl bg-gradient-to-r from-amber-900 to-amber-700 px-6 py-5 shadow-lg">
                        <p className="text-xs font-semibold uppercase tracking-widest text-amber-200/70">
                            CAI · Phase 2 · Étape 3
                        </p>
                        <h1 className="mt-1 text-xl font-black text-white">
                            Caractérisation des marchés
                        </h1>
                        <p className="mt-0.5 text-sm text-amber-200/80">
                            Matrice de caractérisation des marchés de produits agroécologiques
                        </p>
                    </div>

                    {/* Date */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                            Date de la session
                        </label>
                        <input type="date" value={dateSession}
                            onChange={e => setDateSession(e.target.value)}
                            className="w-full max-w-xs rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100" />
                    </div>

                    {/* Badge */}
                    <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5">
                        <svg className="size-4 text-amber-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-xs font-bold text-amber-900">
                            Étape 3 : Caractérisation des marchés de produits agroécologiques
                        </span>
                    </div>

                    {/* Contenu */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
                            <svg className="size-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                            </svg>
                            Chargement…
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {marches.map((m, i) => (
                                <MarcheCard
                                    key={m._id}
                                    marche={m}
                                    index={i}
                                    total={marches.length}
                                    onChange={updated => updateMarche(m._id, updated)}
                                    onRemove={() => removeMarche(m._id)}
                                />
                            ))}

                            <button type="button" onClick={addMarche}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-200 py-4 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition-colors">
                                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                                </svg>
                                Ajouter un marché
                            </button>
                        </div>
                    )}

                    {/* Boutons */}
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setShowApercu(true)}
                            className="flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-5 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-50 transition-all shadow-sm">
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Aperçu
                        </button>
                        <button type="button" onClick={handleSave} disabled={saving}
                            className="flex items-center gap-2 rounded-xl bg-amber-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60 transition-all shadow-sm">
                            {saving ? (
                                <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                </svg>
                            ) : (
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            {saving ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                    </div>
                </main>
            </div>

            {showApercu && (
                <ApercuModal marches={marches} dateSession={dateSession} onClose={() => setShowApercu(false)} />
            )}
            <ModernNotification
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(t => ({ ...t, show: false }))}
            />
        </div>
    );
}
