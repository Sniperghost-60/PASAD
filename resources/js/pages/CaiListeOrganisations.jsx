import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CultureSelect from '../components/CultureSelect';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import api from '../services/api';

/* ── Modal aperçu / impression ───────────────────────────────────────── */
function ApercuModal({ rows, onClose }) {
    const printRef = useRef(null);

    const handlePrint = () => {
        const content = printRef.current.innerHTML;
        const win = window.open('', '_blank');
        win.document.write(`
            <html><head><title>Liste organisations CAI</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 10px; margin: 16px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 4px 5px; vertical-align: top; }
                .title-row td { background: #F59E0B; font-weight: bold; text-align: center; font-size: 12px; color: #fff; }
                .subtitle-row td { background: #FEF3C7; font-weight: bold; font-size: 10px; }
                th { font-weight: bold; font-size: 9px; text-transform: uppercase; background: #FEF3C7; }
                .center { text-align: center; }
                .dash-line { margin-bottom: 2px; }
                .dash-line:last-child { margin-bottom: 0; }
            </style></head><body>${content}</body></html>
        `);
        win.document.close();
        win.print();
    };

    const filled = rows.filter(r => r.nom_op?.trim());

    const renderList = (arr) => {
        const items = (Array.isArray(arr) ? arr : [arr]).filter(v => v?.trim());
        if (!items.length) return '';
        return items.map(v => `<div class="dash-line">– ${v}</div>`).join('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-7xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6">
                <div className="flex items-center justify-between bg-gradient-to-r from-amber-900 to-amber-700 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <svg className="size-5 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <div>
                            <h2 className="text-base font-bold text-white">Aperçu — Liste des organisations CAI</h2>
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
                    <table className="w-full border-collapse text-xs" style={{ borderColor: '#000' }}>
                        <thead>
                            <tr>
                                <td colSpan={10}
                                    className="border border-black bg-amber-500 py-2 text-center text-sm font-bold text-white">
                                    Phase 1 : Préliminaire — Étape 1 : Sensibilisation
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={10}
                                    className="border border-black bg-amber-100 py-1.5 text-center text-xs font-bold text-amber-900">
                                    Tableau 2 : Liste des organisations, coopératives, groupes de producteurs
                                </td>
                            </tr>
                            <tr className="bg-amber-50">
                                <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle font-bold text-[10px] uppercase w-8">N°</th>
                                <th rowSpan={2} className="border border-black px-2 py-2 text-left align-middle font-bold text-[10px] uppercase" style={{ minWidth: 130 }}>Nom de l'OP</th>
                                <th rowSpan={2} className="border border-black px-2 py-2 text-left align-middle font-bold text-[10px] uppercase" style={{ minWidth: 110 }}>Siège/Contact</th>
                                <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle font-bold text-[10px] uppercase" style={{ minWidth: 70 }}>N° groupe&shy;ment</th>
                                <th colSpan={2} className="border border-black px-2 py-2 text-center font-bold text-[10px] uppercase">Effectifs membres</th>
                                <th colSpan={2} className="border border-black px-2 py-2 text-center font-bold text-[10px] uppercase">Produits agricoles</th>
                                <th rowSpan={2} className="border border-black px-2 py-2 text-left align-middle font-bold text-[10px] uppercase" style={{ minWidth: 100 }}>Mode de commer&shy;cialisation</th>
                                <th rowSpan={2} className="border border-black px-2 py-2 text-left align-middle font-bold text-[10px] uppercase" style={{ minWidth: 90 }}>Marché actuel</th>
                                <th rowSpan={2} className="border border-black px-2 py-2 text-left align-middle font-bold text-[10px] uppercase" style={{ minWidth: 120 }}>Attente</th>
                            </tr>
                            <tr className="bg-amber-50">
                                <th className="border border-black px-2 py-1.5 text-center font-bold text-[10px] uppercase w-12">H</th>
                                <th className="border border-black px-2 py-1.5 text-center font-bold text-[10px] uppercase w-12">F</th>
                                <th className="border border-black px-2 py-1.5 text-left font-bold text-[10px] uppercase" style={{ minWidth: 90 }}>Type produits</th>
                                <th className="border border-black px-2 py-1.5 text-center font-bold text-[10px] uppercase w-14">Quantité</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filled.length > 0 ? filled.map((row, i) => {
                                const produits = Array.isArray(row.produits_agricoles) ? row.produits_agricoles.filter(p => p.type_produit?.trim()) : [];
                                const rowSpan = Math.max(produits.length, 1);
                                return produits.length <= 1 ? (
                                    <tr key={row._id ?? i} className="hover:bg-amber-50/40">
                                        <td className="border border-black px-2 py-2 text-center align-top font-bold">{i + 1}</td>
                                        <td className="border border-black px-2 py-2 align-top font-medium">{row.nom_op}</td>
                                        <td className="border border-black px-2 py-2 align-top">{row.siege_contact ?? ''}</td>
                                        <td className="border border-black px-2 py-2 text-center align-top">{row.numero_groupement ?? ''}</td>
                                        <td className="border border-black px-2 py-2 text-center align-top">{row.effectif_h ?? ''}</td>
                                        <td className="border border-black px-2 py-2 text-center align-top">{row.effectif_f ?? ''}</td>
                                        <td className="border border-black px-2 py-2 align-top">{produits[0]?.type_produit ?? ''}</td>
                                        <td className="border border-black px-2 py-2 text-center align-top">{produits[0]?.quantite ?? ''}</td>
                                        <td className="border border-black px-2 py-2 align-top">{row.mode_commercialisation ?? ''}</td>
                                        <td className="border border-black px-2 py-2 align-top">{row.marche_actuel ?? ''}</td>
                                        <td className="border border-black px-2 py-2 align-top"
                                            dangerouslySetInnerHTML={{ __html: renderList(row.attente) }} />
                                    </tr>
                                ) : (
                                    produits.map((prod, pi) => (
                                        <tr key={`${row._id ?? i}-${pi}`} className="hover:bg-amber-50/40">
                                            {pi === 0 && <>
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 text-center align-middle font-bold">{i + 1}</td>
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 align-middle font-medium">{row.nom_op}</td>
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 align-middle">{row.siege_contact ?? ''}</td>
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 text-center align-middle">{row.numero_groupement ?? ''}</td>
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 text-center align-middle">{row.effectif_h ?? ''}</td>
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 text-center align-middle">{row.effectif_f ?? ''}</td>
                                            </>}
                                            <td className="border border-black px-2 py-2 align-top">{prod.type_produit}</td>
                                            <td className="border border-black px-2 py-2 text-center align-top">{prod.quantite ?? ''}</td>
                                            {pi === 0 && <>
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 align-middle">{row.mode_commercialisation ?? ''}</td>
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 align-middle">{row.marche_actuel ?? ''}</td>
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 align-middle"
                                                    dangerouslySetInnerHTML={{ __html: renderList(row.attente) }} />
                                            </>}
                                        </tr>
                                    ))
                                );
                            }) : (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="border border-black px-2 py-4 text-center text-slate-400 text-[10px]">{i + 1}</td>
                                        {Array.from({ length: 10 }).map((_, j) => (
                                            <td key={j} className="border border-black px-2 py-4" />
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {filled.length > 0 && (
                    <div className="flex items-center gap-4 border-t border-slate-100 px-6 pb-6 pt-3">
                        <span className="text-xs text-slate-500">Résumé :</span>
                        <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            Total H : {filled.reduce((s, r) => s + (Number(r.effectif_h) || 0), 0)}
                        </span>
                        <span className="rounded-lg border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-bold text-pink-700">
                            Total F : {filled.reduce((s, r) => s + (Number(r.effectif_f) || 0), 0)}
                        </span>
                        <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            Organisations : {filled.length}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Composant saisie multiple ──────────────────────────────────────── */
function MultiInput({ values, onChange, placeholder }) {
    const add    = () => onChange([...values, '']);
    const remove = (i) => onChange(values.length > 1 ? values.filter((_, idx) => idx !== i) : ['']);
    const update = (i, v) => onChange(values.map((val, idx) => idx === i ? v : val));

    return (
        <div className="space-y-1">
            {values.map((val, i) => (
                <div key={i} className="flex items-start gap-1">
                    <textarea value={val} onChange={e => update(i, e.target.value)}
                        placeholder={i === 0 ? placeholder : '…'}
                        rows={2}
                        className="flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 focus:bg-white transition-all" />
                    <button type="button" onClick={() => remove(i)}
                        className="mt-0.5 flex size-6 flex-shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-400 hover:bg-red-100 transition-colors">
                        <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
            <button type="button" onClick={add}
                className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 hover:text-amber-900 transition-colors mt-0.5">
                <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Ajouter
            </button>
        </div>
    );
}

/* ── Ligne vide ──────────────────────────────────────────────────────── */
const emptyRow = () => ({
    _id: Math.random().toString(36).slice(2),
    nom_op: '',
    siege_contact: '',
    numero_groupement: '',
    effectif_h: '',
    effectif_f: '',
    produits_agricoles: [{ type_produit: '', quantite: '' }],
    mode_commercialisation: '',
    marche_actuel: '',
    attente: [''],
});

/* ── Cellule produits ────────────────────────────────────────────────── */
function ProduitsCell({ produits, onChange }) {
    const updateProduit = (i, key, val) => {
        const updated = produits.map((p, idx) => idx === i ? { ...p, [key]: val } : p);
        onChange(updated);
    };
    const addProduit    = () => onChange([...produits, { type_produit: '', quantite: '' }]);
    const removeProduit = (i) => onChange(produits.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-1">
            {produits.map((p, i) => (
                <div key={i} className="flex items-center gap-1">
                    <CultureSelect
                        value={p.type_produit}
                        onChange={v => updateProduit(i, 'type_produit', v)}
                        className="flex-[2] rounded border border-slate-200 bg-amber-50/30 px-2 py-1 text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
                    />
                    <input
                        type="text"
                        placeholder="Qté"
                        value={p.quantite}
                        onChange={e => updateProduit(i, 'quantite', e.target.value)}
                        className="w-16 rounded border border-slate-200 bg-amber-50/30 px-2 py-1 text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
                    />
                    {produits.length > 1 && (
                        <button type="button" onClick={() => removeProduit(i)}
                            className="flex size-5 items-center justify-center rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0">
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            ))}
            <button type="button" onClick={addProduit}
                className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 hover:text-amber-900 transition-colors mt-0.5">
                <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Ajouter
            </button>
        </div>
    );
}

/* ── Modal édition organisation enregistrée ───────────────────────────── */
function EditOrganisationModal({ row, onChange, onSave, onClose, saving }) {
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6">
                <div className="flex items-center justify-between bg-gradient-to-r from-emerald-800 to-emerald-600 px-6 py-4">
                    <h2 className="text-base font-bold text-white">Modifier l'organisation</h2>
                    <button type="button" onClick={onClose}
                        className="flex size-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Nom de l'OP *</label>
                        <input type="text" value={row.nom_op} onChange={e => onChange('nom_op', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:bg-white transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Siège / Contact</label>
                            <input type="text" value={row.siege_contact} onChange={e => onChange('siege_contact', e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:bg-white transition-all" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">N° groupement</label>
                            <input type="text" value={row.numero_groupement} onChange={e => onChange('numero_groupement', e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:bg-white transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Effectif hommes</label>
                            <input type="number" min="0" value={row.effectif_h} onChange={e => onChange('effectif_h', e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:bg-white transition-all" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Effectif femmes</label>
                            <input type="number" min="0" value={row.effectif_f} onChange={e => onChange('effectif_f', e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:bg-white transition-all" />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Produits agricoles</label>
                        <ProduitsCell produits={row.produits_agricoles} onChange={val => onChange('produits_agricoles', val)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Mode de commercialisation</label>
                            <input type="text" value={row.mode_commercialisation} onChange={e => onChange('mode_commercialisation', e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:bg-white transition-all" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Marché actuel</label>
                            <input type="text" value={row.marche_actuel} onChange={e => onChange('marche_actuel', e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:bg-white transition-all" />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Attente</label>
                        <MultiInput values={row.attente} onChange={val => onChange('attente', val)} placeholder="Attentes de l'organisation vis-à-vis du CAI…" />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
                    <button type="button" onClick={onClose}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                        Annuler
                    </button>
                    <button type="button" onClick={onSave} disabled={saving}
                        className="flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60 transition-all shadow">
                        {saving && <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                        {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Page principale ─────────────────────────────────────────────────── */
export default function CaiListeOrganisations() {
    const navigate = useNavigate();
    const [rows, setRows]                 = useState([emptyRow()]);
    const [savedRows, setSavedRows]       = useState([]);
    const [loadingSaved, setLoadingSaved] = useState(true);
    const [saving, setSaving]             = useState(false);
    const [errors, setErrors]             = useState({});
    const [showPreview, setShowPreview]   = useState(false);
    const [toast, setToast]               = useState({ show: false, message: '', type: 'success' });
    const [editingRow, setEditingRow]     = useState(null);
    const [savingEdit, setSavingEdit]     = useState(false);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
    }, []);

    const loadSaved = useCallback(async () => {
        try {
            const res = await api.get('/api/cai/liste-organisations');
            setSavedRows(Array.isArray(res.data) ? res.data : []);
        } catch {
            setSavedRows([]);
        } finally {
            setLoadingSaved(false);
        }
    }, []);

    useEffect(() => { loadSaved(); }, [loadSaved]);

    /* Édition d'une organisation déjà enregistrée */
    const startEdit = (row) => setEditingRow({
        id:                     row.id,
        nom_op:                 row.nom_op ?? '',
        siege_contact:          row.siege_contact ?? '',
        numero_groupement:      row.numero_groupement ?? '',
        effectif_h:             row.effectif_h ?? '',
        effectif_f:             row.effectif_f ?? '',
        produits_agricoles:     row.produits_agricoles?.length ? row.produits_agricoles : [{ type_produit: '', quantite: '' }],
        mode_commercialisation: row.mode_commercialisation ?? '',
        marche_actuel:          row.marche_actuel ?? '',
        attente:                row.attente?.length ? row.attente : [''],
    });

    const updateEditingRow = (field, value) => setEditingRow(r => ({ ...r, [field]: value }));

    const handleUpdate = async () => {
        if (!editingRow.nom_op?.trim()) {
            showToast("Le nom de l'OP est obligatoire.", 'error');
            return;
        }
        setSavingEdit(true);
        try {
            const payload = {
                nom_op:                 editingRow.nom_op.trim(),
                siege_contact:          editingRow.siege_contact?.trim()          || null,
                numero_groupement:      editingRow.numero_groupement?.trim()      || null,
                effectif_h:             editingRow.effectif_h !== '' ? Number(editingRow.effectif_h) : null,
                effectif_f:             editingRow.effectif_f !== '' ? Number(editingRow.effectif_f) : null,
                produits_agricoles:     editingRow.produits_agricoles.filter(p => p.type_produit?.trim()).map(p => ({
                                            type_produit: p.type_produit.trim(),
                                            quantite:     p.quantite?.trim() || null,
                                        })),
                mode_commercialisation: editingRow.mode_commercialisation?.trim() || null,
                marche_actuel:          editingRow.marche_actuel?.trim()          || null,
                attente:                editingRow.attente.map(v => v.trim()).filter(Boolean),
            };
            const res = await api.put(`/api/cai/liste-organisations/${editingRow.id}`, payload);
            setSavedRows(prev => prev.map(r => r.id === editingRow.id ? res.data.data : r));
            showToast('Organisation mise à jour avec succès !');
            setEditingRow(null);
        } catch (err) {
            const msg = err?.response?.data?.message ?? 'Erreur lors de la mise à jour.';
            showToast(msg, 'error');
        } finally {
            setSavingEdit(false);
        }
    };

    const updateRow = (id, field, value) =>
        setRows(prev => prev.map(r => r._id === id ? { ...r, [field]: value } : r));

    const addRow = () => setRows(prev => [...prev, emptyRow()]);

    const removeRow = (id) =>
        setRows(prev => prev.length > 1 ? prev.filter(r => r._id !== id) : [emptyRow()]);

    const handleSave = async () => {
        const errs = {};
        rows.forEach(r => { if (!r.nom_op?.trim()) errs[r._id] = true; });
        setErrors(errs);
        if (Object.keys(errs).length > 0) {
            showToast('Renseignez le nom de l\'OP pour chaque ligne.', 'error');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                organisations: rows
                    .filter(r => r.nom_op?.trim())
                    .map(r => ({
                        nom_op:                 r.nom_op.trim(),
                        siege_contact:          r.siege_contact?.trim()          || null,
                        numero_groupement:      r.numero_groupement?.trim()      || null,
                        effectif_h:             r.effectif_h !== '' ? Number(r.effectif_h) : null,
                        effectif_f:             r.effectif_f !== '' ? Number(r.effectif_f) : null,
                        produits_agricoles:     r.produits_agricoles.filter(p => p.type_produit?.trim()).map(p => ({
                                                    type_produit: p.type_produit.trim(),
                                                    quantite:     p.quantite?.trim() || null,
                                                })),
                        mode_commercialisation: r.mode_commercialisation?.trim() || null,
                        marche_actuel:          r.marche_actuel?.trim()          || null,
                        attente:                r.attente.map(v => v.trim()).filter(Boolean),
                    })),
            };
            await api.post('/api/cai/liste-organisations', payload);
            showToast(`${payload.organisations.length} organisation(s) enregistrée(s) avec succès !`);
            setRows([emptyRow()]);
            loadSaved();
        } catch (err) {
            const msg = err?.response?.data?.message ?? 'Erreur lors de l\'enregistrement.';
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const filled = rows.filter(r => r.nom_op?.trim());
    const totalH = filled.reduce((s, r) => s + (Number(r.effectif_h) || 0), 0);
    const totalF = filled.reduce((s, r) => s + (Number(r.effectif_f) || 0), 0);

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden ml-60">
                <Header title="CAI — Liste des organisations" />

                <main className="flex-1 overflow-y-auto p-6">
                    <ModernNotification
                        show={toast.show}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(t => ({ ...t, show: false }))}
                    />

                    {/* En-tête */}
                    <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-900 to-amber-700 p-5 text-white shadow">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="mb-1 flex items-center gap-2">
                                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-amber-100">Phase 1 · Étape 1</span>
                                    <span className="text-amber-200/60 text-xs">Sensibilisation</span>
                                </div>
                                <h1 className="text-xl font-black">Tableau 2 : Liste des organisations</h1>
                                <p className="mt-1 text-sm text-amber-200/80">Coopératives, groupements et groupes de producteurs</p>
                            </div>
                            {filled.length > 0 && (
                                <div className="flex gap-3 text-center">
                                    <div className="rounded-xl bg-white/10 px-4 py-2">
                                        <div className="text-2xl font-black">{totalH}</div>
                                        <div className="text-xs text-amber-200/70">Total H</div>
                                    </div>
                                    <div className="rounded-xl bg-white/10 px-4 py-2">
                                        <div className="text-2xl font-black">{totalF}</div>
                                        <div className="text-xs text-amber-200/70">Total F</div>
                                    </div>
                                    <div className="rounded-xl bg-white/10 px-4 py-2">
                                        <div className="text-2xl font-black">{filled.length}</div>
                                        <div className="text-xs text-amber-200/70">Organisations</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Barre d'actions */}
                    <div className="mb-4 flex flex-wrap items-end gap-4">
                        <div className="flex gap-2 ml-auto">
                            <button type="button" onClick={() => setShowPreview(true)}
                                disabled={filled.length === 0}
                                className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-40 transition-all">
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Aperçu / Imprimer
                            </button>
                            <button type="button" onClick={handleSave} disabled={saving}
                                className="flex items-center gap-2 rounded-xl bg-amber-800 px-5 py-2 text-sm font-bold text-white hover:bg-amber-900 disabled:opacity-60 transition-all shadow">
                                {saving
                                    ? <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                    : <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                }
                                {saving ? 'Enregistrement…' : 'Enregistrer'}
                            </button>
                            <button type="button" onClick={() => navigate('/cai/negociation-accord')}
                                className="flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2 text-sm font-bold text-white hover:bg-slate-900 transition-all shadow">
                                Suivant →
                            </button>
                        </div>
                    </div>

                    {/* Tableau de saisie */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-amber-50">
                                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">N°</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 150 }}>Nom de l'OP *</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 120 }}>Siège / Contact</th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">N° groupement</th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-20">Effectif H</th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-20">Effectif F</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 180 }}>Produits agricoles</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 130 }}>Mode commercialisation</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 110 }}>Marché actuel</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 160 }}>Attente</th>
                                    <th className="px-3 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((row, idx) => (
                                    <tr key={row._id} className={`group hover:bg-amber-50/30 transition-colors ${errors[row._id] ? 'bg-red-50/40' : ''}`}>
                                        <td className="px-3 py-2 text-center text-xs font-bold text-slate-400">{idx + 1}</td>

                                        {/* Nom de l'OP */}
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={row.nom_op}
                                                onChange={e => updateRow(row._id, 'nom_op', e.target.value)}
                                                placeholder="Nom de l'OP"
                                                className={`w-full rounded-lg border px-3 py-1.5 text-xs outline-none transition-all focus:ring-2 focus:ring-amber-100 ${errors[row._id] ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-slate-200 bg-amber-50/30 focus:border-amber-400'}`}
                                            />
                                        </td>

                                        {/* Siège/Contact */}
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={row.siege_contact}
                                                onChange={e => updateRow(row._id, 'siege_contact', e.target.value)}
                                                placeholder="Siège / Contact"
                                                className="w-full rounded-lg border border-slate-200 bg-amber-50/30 px-3 py-1.5 text-xs outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                                            />
                                        </td>

                                        {/* N° groupement */}
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={row.numero_groupement}
                                                onChange={e => updateRow(row._id, 'numero_groupement', e.target.value)}
                                                placeholder="N°"
                                                className="w-full rounded-lg border border-slate-200 bg-amber-50/30 px-3 py-1.5 text-xs text-center outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                                            />
                                        </td>

                                        {/* Effectif H */}
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={row.effectif_h}
                                                onChange={e => updateRow(row._id, 'effectif_h', e.target.value)}
                                                placeholder="0"
                                                className="w-full rounded-lg border border-slate-200 bg-blue-50/40 px-3 py-1.5 text-xs text-center outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                                            />
                                        </td>

                                        {/* Effectif F */}
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={row.effectif_f}
                                                onChange={e => updateRow(row._id, 'effectif_f', e.target.value)}
                                                placeholder="0"
                                                className="w-full rounded-lg border border-slate-200 bg-pink-50/40 px-3 py-1.5 text-xs text-center outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                                            />
                                        </td>

                                        {/* Produits agricoles */}
                                        <td className="px-2 py-2">
                                            <ProduitsCell
                                                produits={row.produits_agricoles}
                                                onChange={val => updateRow(row._id, 'produits_agricoles', val)}
                                            />
                                        </td>

                                        {/* Mode commercialisation */}
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={row.mode_commercialisation}
                                                onChange={e => updateRow(row._id, 'mode_commercialisation', e.target.value)}
                                                placeholder="Mode"
                                                className="w-full rounded-lg border border-slate-200 bg-amber-50/30 px-3 py-1.5 text-xs outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                                            />
                                        </td>

                                        {/* Marché actuel */}
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={row.marche_actuel}
                                                onChange={e => updateRow(row._id, 'marche_actuel', e.target.value)}
                                                placeholder="Marché"
                                                className="w-full rounded-lg border border-slate-200 bg-amber-50/30 px-3 py-1.5 text-xs outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                                            />
                                        </td>

                                        {/* Attente */}
                                        <td className="px-2 py-2">
                                            <MultiInput
                                                values={row.attente}
                                                onChange={val => updateRow(row._id, 'attente', val)}
                                                placeholder="Attentes de l'organisation…"
                                            />
                                        </td>

                                        {/* Supprimer */}
                                        <td className="px-2 py-2 text-center">
                                            <button type="button" onClick={() => removeRow(row._id)}
                                                className="flex size-7 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Ajouter une ligne */}
                        <div className="border-t border-slate-100 p-3">
                            <button type="button" onClick={addRow}
                                className="flex items-center gap-2 rounded-xl border border-dashed border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 hover:border-amber-400 hover:bg-amber-50 transition-all">
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Ajouter une organisation
                            </button>
                        </div>
                    </div>

                    {/* Organisations déjà enregistrées */}
                    {loadingSaved ? (
                        <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
                            <svg className="size-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                            Chargement des organisations déjà enregistrées…
                        </div>
                    ) : savedRows.length > 0 && (
                        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-white px-5 py-3.5 border-b border-slate-100">
                                <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                    <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-800">Organisations déjà enregistrées</h2>
                                    <p className="text-xs text-slate-400">{savedRows.length} enregistrement{savedRows.length > 1 ? 's' : ''} au total</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-slate-50/80">
                                            <th className="px-4 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-10">N°</th>
                                            <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Organisation</th>
                                            <th className="px-4 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Effectifs</th>
                                            <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Produits agricoles</th>
                                            <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attente</th>
                                            <th className="px-4 py-2.5 w-10" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {savedRows.map((row, i) => {
                                            const initials = (row.nom_op ?? '')
                                                .split(/\s+/).filter(Boolean).slice(0, 2)
                                                .map(w => w[0]?.toUpperCase()).join('') || '?';
                                            const produits = (row.produits_agricoles ?? []).filter(p => p?.type_produit?.trim());
                                            const attente = Array.isArray(row.attente) ? row.attente.filter(Boolean) : [];
                                            return (
                                                <tr key={row.id ?? i} className="odd:bg-white even:bg-slate-50/40 hover:bg-emerald-50/40 transition-colors">
                                                    <td className="px-4 py-3 text-center text-xs font-bold text-slate-300">{i + 1}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                                                                {initials}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-slate-700">{row.nom_op}</div>
                                                                {(row.siege_contact || row.numero_groupement) && (
                                                                    <div className="text-[11px] text-slate-400">
                                                                        {[row.siege_contact, row.numero_groupement].filter(Boolean).join(' · ')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[11px] font-bold text-blue-600">H {row.effectif_h ?? 0}</span>
                                                            <span className="rounded-full bg-pink-50 px-1.5 py-0.5 text-[11px] font-bold text-pink-600">F {row.effectif_f ?? 0}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {produits.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {produits.map((p, pi) => (
                                                                    <span key={pi} className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                                                                        {p.type_produit}{p.quantite ? ` · ${p.quantite}` : ''}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : <span className="text-slate-300">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {attente.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {attente.map((a, ai) => (
                                                                    <span key={ai} className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                                                                        {a}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : <span className="text-slate-300">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button type="button" onClick={() => startEdit(row)}
                                                            title="Modifier"
                                                            className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                                                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {showPreview && (
                <ApercuModal
                    rows={[...savedRows, ...rows]}
                    onClose={() => setShowPreview(false)}
                />
            )}

            {editingRow && (
                <EditOrganisationModal
                    row={editingRow}
                    onChange={updateEditingRow}
                    onSave={handleUpdate}
                    onClose={() => setEditingRow(null)}
                    saving={savingEdit}
                />
            )}
        </div>
    );
}
