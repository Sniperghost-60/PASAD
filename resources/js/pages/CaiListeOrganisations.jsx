import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import api from '../services/api';

/* ── Modal aperçu / impression ───────────────────────────────────────── */
function ApercuModal({ rows, dateSession, onClose }) {
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
            </style></head><body>${content}</body></html>
        `);
        win.document.close();
        win.print();
    };

    const filled = rows.filter(r => r.nom_op?.trim());

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
                            {dateSession && (
                                <p className="text-xs text-amber-200/70 mt-0.5">
                                    Session du {new Date(dateSession).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            )}
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
                                <th rowSpan={2} className="border border-black px-2 py-2 text-left align-middle font-bold text-[10px] uppercase" style={{ minWidth: 110 }}>Attente</th>
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
                                        <td className="border border-black px-2 py-2 align-top">{row.attente ?? ''}</td>
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
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 align-middle">{row.attente ?? ''}</td>
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
    attente: '',
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
                    <input
                        type="text"
                        placeholder="Type de produit"
                        value={p.type_produit}
                        onChange={e => updateProduit(i, 'type_produit', e.target.value)}
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

/* ── Page principale ─────────────────────────────────────────────────── */
export default function CaiListeOrganisations() {
    const [dateSession, setDateSession] = useState('');
    const [rows, setRows]               = useState([emptyRow()]);
    const [loadingRows, setLoadingRows] = useState(false);
    const [saving, setSaving]           = useState(false);
    const [errors, setErrors]           = useState({});
    const [showPreview, setShowPreview] = useState(false);
    const [toast, setToast]             = useState({ show: false, message: '', type: 'success' });

    const showToast = useCallback((message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
    }, []);

    useEffect(() => {
        if (!dateSession) { setRows([emptyRow()]); setErrors({}); return; }
        loadData(dateSession);
    }, [dateSession]);

    const loadData = async (date) => {
        setLoadingRows(true);
        setErrors({});
        try {
            const res  = await api.get(`/api/cai/liste-organisations?date_session=${date}`);
            const data = Array.isArray(res.data) ? res.data : [];
            setRows(data.length === 0 ? [emptyRow()] : data.map(r => ({
                _id:                    r.id ? `srv-${r.id}` : Math.random().toString(36).slice(2),
                nom_op:                 r.nom_op ?? '',
                siege_contact:          r.siege_contact ?? '',
                numero_groupement:      r.numero_groupement ?? '',
                effectif_h:             r.effectif_h != null ? String(r.effectif_h) : '',
                effectif_f:             r.effectif_f != null ? String(r.effectif_f) : '',
                produits_agricoles:     Array.isArray(r.produits_agricoles) && r.produits_agricoles.length
                                            ? r.produits_agricoles
                                            : [{ type_produit: '', quantite: '' }],
                mode_commercialisation: r.mode_commercialisation ?? '',
                marche_actuel:          r.marche_actuel ?? '',
                attente:                r.attente ?? '',
            })));
        } catch {
            setRows([emptyRow()]);
        } finally {
            setLoadingRows(false);
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
                date_session:  dateSession || null,
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
                        attente:                r.attente?.trim()                || null,
                    })),
            };
            await api.post('/api/cai/liste-organisations', payload);
            showToast(`${payload.organisations.length} organisation(s) enregistrée(s) avec succès !`);
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
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Date de la session
                            </label>
                            <input
                                type="date"
                                value={dateSession}
                                onChange={e => setDateSession(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                            />
                        </div>
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
                        </div>
                    </div>

                    {/* Tableau de saisie */}
                    {loadingRows ? (
                        <div className="flex items-center justify-center py-20">
                            <svg className="size-8 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                        </div>
                    ) : (
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
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 130 }}>Attente</th>
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
                                                <input
                                                    type="text"
                                                    value={row.attente}
                                                    onChange={e => updateRow(row._id, 'attente', e.target.value)}
                                                    placeholder="Attente"
                                                    className="w-full rounded-lg border border-slate-200 bg-amber-50/30 px-3 py-1.5 text-xs outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
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
                    )}
                </main>
            </div>

            {showPreview && (
                <ApercuModal
                    rows={rows}
                    dateSession={dateSession}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </div>
    );
}
