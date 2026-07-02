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
            <html><head><title>Liste producteurs CAI</title>
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

    const filled = rows.filter(r => r.nom_prenom?.trim());

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-7xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6">
                {/* Header modal */}
                <div className="flex items-center justify-between bg-gradient-to-r from-amber-900 to-amber-700 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <svg className="size-5 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <div>
                            <h2 className="text-base font-bold text-white">Aperçu — Liste producteurs CAI</h2>
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

                {/* Tableau */}
                <div className="p-6 overflow-x-auto" ref={printRef}>
                    <table className="w-full border-collapse text-xs" style={{ borderColor: '#000' }}>
                        <thead>
                            <tr>
                                <td colSpan={11}
                                    className="border border-black bg-amber-500 py-2 text-center text-sm font-bold text-white">
                                    Phase 1 : Préliminaire — Étape 1 : Sensibilisation
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={11}
                                    className="border border-black bg-amber-100 py-1.5 text-center text-xs font-bold text-amber-900">
                                    Tableau 1 : Liste des producteurs prêts à s'engager dans le CAI
                                </td>
                            </tr>
                            <tr className="bg-amber-50">
                                <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle font-bold text-[10px] uppercase">N°</th>
                                <th rowSpan={2} className="border border-black px-2 py-2 text-left align-middle font-bold text-[10px] uppercase" style={{ minWidth: 120 }}>Nom et prénom</th>
                                <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle font-bold text-[10px] uppercase">Sexe</th>
                                <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle font-bold text-[10px] uppercase">Âge</th>
                                <th rowSpan={2} className="border border-black px-2 py-2 text-left align-middle font-bold text-[10px] uppercase" style={{ minWidth: 80 }}>Village</th>
                                <th rowSpan={2} className="border border-black px-2 py-2 text-left align-middle font-bold text-[10px] uppercase" style={{ minWidth: 90 }}>Contact</th>
                                <th rowSpan={2} className="border border-black px-2 py-2 text-left align-middle font-bold text-[10px] uppercase" style={{ minWidth: 100 }}>OP d'appar&shy;tenance</th>
                                <th colSpan={2} className="border border-black px-2 py-2 text-center font-bold text-[10px] uppercase">Produits agricoles</th>
                                <th rowSpan={2} className="border border-black px-2 py-2 text-left align-middle font-bold text-[10px] uppercase" style={{ minWidth: 100 }}>Mode de commer&shy;cialisation</th>
                                <th rowSpan={2} className="border border-black px-2 py-2 text-left align-middle font-bold text-[10px] uppercase" style={{ minWidth: 90 }}>Marché actuel</th>
                                <th rowSpan={2} className="border border-black px-2 py-2 text-left align-middle font-bold text-[10px] uppercase" style={{ minWidth: 120 }}>Attentes</th>
                            </tr>
                            <tr className="bg-amber-50">
                                <th className="border border-black px-2 py-1.5 text-left font-bold text-[10px] uppercase" style={{ minWidth: 90 }}>Type de produit</th>
                                <th className="border border-black px-2 py-1.5 text-center font-bold text-[10px] uppercase" style={{ minWidth: 55 }}>Qté</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filled.length > 0 ? filled.map((row, i) => {
                                const produits = Array.isArray(row.produits_agricoles) ? row.produits_agricoles.filter(p => p.type_produit?.trim()) : [];
                                const rowSpan = Math.max(produits.length, 1);
                                return produits.length <= 1 ? (
                                    <tr key={row._id ?? i} className="hover:bg-amber-50/40">
                                        <td className="border border-black px-2 py-2 text-center align-top font-bold">{i + 1}</td>
                                        <td className="border border-black px-2 py-2 align-top font-medium">{row.nom_prenom}</td>
                                        <td className="border border-black px-2 py-2 text-center align-top font-bold">
                                            <span className={row.sexe === 'M' ? 'text-blue-700' : 'text-pink-700'}>{row.sexe}</span>
                                        </td>
                                        <td className="border border-black px-2 py-2 text-center align-top">{row.age ?? ''}</td>
                                        <td className="border border-black px-2 py-2 align-top">{row.village ?? ''}</td>
                                        <td className="border border-black px-2 py-2 align-top">{row.contact ?? ''}</td>
                                        <td className="border border-black px-2 py-2 align-top">{row.op_appartenance ?? ''}</td>
                                        <td className="border border-black px-2 py-2 align-top">{produits[0]?.type_produit ?? ''}</td>
                                        <td className="border border-black px-2 py-2 text-center align-top">{produits[0]?.quantite ?? ''}</td>
                                        <td className="border border-black px-2 py-2 align-top">{row.mode_commercialisation ?? ''}</td>
                                        <td className="border border-black px-2 py-2 align-top">{row.marche_actuel ?? ''}</td>
                                        <td className="border border-black px-2 py-2 align-top">{row.attentes ?? ''}</td>
                                    </tr>
                                ) : (
                                    produits.map((prod, pi) => (
                                        <tr key={`${row._id ?? i}-${pi}`} className="hover:bg-amber-50/40">
                                            {pi === 0 && <>
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 text-center align-middle font-bold">{i + 1}</td>
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 align-middle font-medium">{row.nom_prenom}</td>
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 text-center align-middle font-bold">
                                                    <span className={row.sexe === 'M' ? 'text-blue-700' : 'text-pink-700'}>{row.sexe}</span>
                                                </td>
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 text-center align-middle">{row.age ?? ''}</td>
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 align-middle">{row.village ?? ''}</td>
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 align-middle">{row.contact ?? ''}</td>
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 align-middle">{row.op_appartenance ?? ''}</td>
                                            </>}
                                            <td className="border border-black px-2 py-2 align-top">{prod.type_produit}</td>
                                            <td className="border border-black px-2 py-2 text-center align-top">{prod.quantite ?? ''}</td>
                                            {pi === 0 && <>
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 align-middle">{row.mode_commercialisation ?? ''}</td>
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 align-middle">{row.marche_actuel ?? ''}</td>
                                                <td rowSpan={rowSpan} className="border border-black px-2 py-2 align-middle">{row.attentes ?? ''}</td>
                                            </>}
                                        </tr>
                                    ))
                                );
                            }) : (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="border border-black px-2 py-4 text-center text-slate-400 text-[10px]">{i + 1}</td>
                                        {Array.from({ length: 11 }).map((_, j) => (
                                            <td key={j} className="border border-black px-2 py-4" />
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Résumé */}
                {filled.length > 0 && (
                    <div className="flex items-center gap-4 border-t border-slate-100 px-6 pb-6 pt-3">
                        <span className="text-xs text-slate-500">Résumé :</span>
                        <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            Hommes : {filled.filter(r => r.sexe === 'M').length}
                        </span>
                        <span className="rounded-lg border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-bold text-pink-700">
                            Femmes : {filled.filter(r => r.sexe === 'F').length}
                        </span>
                        <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            Total : {filled.length}
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
    nom_prenom: '',
    sexe: 'M',
    age: '',
    village: '',
    contact: '',
    op_appartenance: '',
    produits_agricoles: [{ type_produit: '', quantite: '' }],
    mode_commercialisation: '',
    marche_actuel: '',
    attentes: '',
});

/* ── Composant cellule produits (type + qté en tableau interne) ──────── */
function ProduitsCell({ produits, onChange }) {
    const updateProduit = (i, key, val) => {
        const updated = produits.map((p, idx) => idx === i ? { ...p, [key]: val } : p);
        onChange(updated);
    };
    const addProduit = () => onChange([...produits, { type_produit: '', quantite: '' }]);
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
export default function CaiListeProducteurs() {
    const [dateSession, setDateSession]   = useState('');
    const [rows, setRows]                 = useState([emptyRow()]);
    const [loadingRows, setLoadingRows]   = useState(false);
    const [saving, setSaving]             = useState(false);
    const [errors, setErrors]             = useState({});
    const [showPreview, setShowPreview]   = useState(false);
    const [toast, setToast]               = useState({ show: false, message: '', type: 'success' });

    const showToast = useCallback((message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
    }, []);

    /* Chargement par date */
    useEffect(() => {
        if (!dateSession) { setRows([emptyRow()]); setErrors({}); return; }
        loadData(dateSession);
    }, [dateSession]);

    const loadData = async (date) => {
        setLoadingRows(true);
        setErrors({});
        try {
            const res  = await api.get(`/api/cai/liste-producteurs?date_session=${date}`);
            const data = Array.isArray(res.data) ? res.data : [];
            if (data.length === 0) {
                setRows([emptyRow()]);
            } else {
                setRows(data.map(r => ({
                    _id:                    r.id ? `srv-${r.id}` : Math.random().toString(36).slice(2),
                    nom_prenom:             r.nom_prenom ?? '',
                    sexe:                   r.sexe ?? 'M',
                    age:                    r.age != null ? String(r.age) : '',
                    village:                r.village ?? '',
                    contact:                r.contact ?? '',
                    op_appartenance:        r.op_appartenance ?? '',
                    produits_agricoles:     Array.isArray(r.produits_agricoles) && r.produits_agricoles.length
                                                ? r.produits_agricoles
                                                : [{ type_produit: '', quantite: '' }],
                    mode_commercialisation: r.mode_commercialisation ?? '',
                    marche_actuel:          r.marche_actuel ?? '',
                    attentes:               r.attentes ?? '',
                })));
            }
        } catch {
            setRows([emptyRow()]);
        } finally {
            setLoadingRows(false);
        }
    };

    /* Helpers pour mettre à jour les lignes */
    const updateRow = (id, field, value) =>
        setRows(prev => prev.map(r => r._id === id ? { ...r, [field]: value } : r));

    const addRow = () => setRows(prev => [...prev, emptyRow()]);

    const removeRow = (id) =>
        setRows(prev => prev.length > 1 ? prev.filter(r => r._id !== id) : [emptyRow()]);

    /* Sauvegarde */
    const handleSave = async () => {
        const errs = {};
        rows.forEach(r => { if (!r.nom_prenom?.trim()) errs[r._id] = true; });
        setErrors(errs);
        if (Object.keys(errs).length > 0) {
            showToast('Renseignez le nom et prénom pour chaque ligne.', 'error');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                date_session: dateSession || null,
                producteurs: rows
                    .filter(r => r.nom_prenom?.trim())
                    .map(r => ({
                        nom_prenom:             r.nom_prenom.trim(),
                        sexe:                   r.sexe,
                        age:                    r.age ? Number(r.age) : null,
                        village:                r.village?.trim() || null,
                        contact:                r.contact?.trim() || null,
                        op_appartenance:        r.op_appartenance?.trim() || null,
                        produits_agricoles:     r.produits_agricoles.filter(p => p.type_produit?.trim()).map(p => ({
                                                    type_produit: p.type_produit.trim(),
                                                    quantite:     p.quantite?.trim() || null,
                                                })),
                        mode_commercialisation: r.mode_commercialisation?.trim() || null,
                        marche_actuel:          r.marche_actuel?.trim() || null,
                        attentes:               r.attentes?.trim() || null,
                    })),
            };
            await api.post('/api/cai/liste-producteurs', payload);
            showToast(`${payload.producteurs.length} producteur(s) enregistré(s) avec succès !`);
        } catch (err) {
            const msg = err?.response?.data?.message ?? 'Erreur lors de l\'enregistrement.';
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const filled = rows.filter(r => r.nom_prenom?.trim());

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden ml-60">
                <Header title="CAI — Liste des producteurs" />

                <main className="flex-1 overflow-y-auto p-6">
                    {/* Notification */}
                    <ModernNotification
                        show={toast.show}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(t => ({ ...t, show: false }))}
                    />

                    {/* Titre de la fiche */}
                    <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-900 to-amber-700 p-5 text-white shadow">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="mb-1 flex items-center gap-2">
                                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-amber-100">Phase 1 · Étape 1</span>
                                    <span className="text-amber-200/60 text-xs">Sensibilisation</span>
                                </div>
                                <h1 className="text-xl font-black">Tableau 1 : Liste des producteurs</h1>
                                <p className="mt-1 text-sm text-amber-200/80">Producteurs prêts à s'engager dans le Conseil Agricole Intégré</p>
                            </div>
                            {filled.length > 0 && (
                                <div className="flex gap-3 text-center">
                                    <div className="rounded-xl bg-white/10 px-4 py-2">
                                        <div className="text-2xl font-black">{filled.filter(r => r.sexe === 'M').length}</div>
                                        <div className="text-xs text-amber-200/70">Hommes</div>
                                    </div>
                                    <div className="rounded-xl bg-white/10 px-4 py-2">
                                        <div className="text-2xl font-black">{filled.filter(r => r.sexe === 'F').length}</div>
                                        <div className="text-xs text-amber-200/70">Femmes</div>
                                    </div>
                                    <div className="rounded-xl bg-white/10 px-4 py-2">
                                        <div className="text-2xl font-black">{filled.length}</div>
                                        <div className="text-xs text-amber-200/70">Total</div>
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
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 160 }}>Nom et prénom *</th>
                                        <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">Sexe</th>
                                        <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-20">Âge</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 100 }}>Village</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 110 }}>Contact</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 120 }}>OP d'appartenance</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 180 }}>Produits agricoles</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 130 }}>Mode commercialisation</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 110 }}>Marché actuel</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 160 }}>Attentes</th>
                                        <th className="px-3 py-3 w-10" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {rows.map((row, i) => (
                                        <tr key={row._id}
                                            className={`group transition-colors hover:bg-amber-50/30 ${errors[row._id] ? 'bg-red-50' : ''}`}>
                                            {/* N° */}
                                            <td className="px-3 py-2 text-center text-xs font-bold text-slate-400">{i + 1}</td>

                                            {/* Nom et prénom */}
                                            <td className="px-3 py-2">
                                                <input type="text" value={row.nom_prenom}
                                                    onChange={e => updateRow(row._id, 'nom_prenom', e.target.value)}
                                                    placeholder="Nom et prénom"
                                                    className={`w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none transition-all focus:ring-1 ${
                                                        errors[row._id]
                                                            ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                                                            : 'border-slate-200 bg-slate-50 focus:border-amber-400 focus:ring-amber-100 focus:bg-white'
                                                    }`}
                                                />
                                            </td>

                                            {/* Sexe */}
                                            <td className="px-3 py-2">
                                                <div className="flex gap-1 justify-center">
                                                    {['M', 'F'].map(s => (
                                                        <button key={s} type="button"
                                                            onClick={() => updateRow(row._id, 'sexe', s)}
                                                            className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                                                                row.sexe === s
                                                                    ? s === 'M'
                                                                        ? 'border-blue-300 bg-blue-100 text-blue-700'
                                                                        : 'border-pink-300 bg-pink-100 text-pink-700'
                                                                    : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                                                            }`}>
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Âge */}
                                            <td className="px-3 py-2">
                                                <input type="number" min="1" max="120" value={row.age}
                                                    onChange={e => updateRow(row._id, 'age', e.target.value)}
                                                    placeholder="—"
                                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-center outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 focus:bg-white transition-all"
                                                />
                                            </td>

                                            {/* Village */}
                                            <td className="px-3 py-2">
                                                <input type="text" value={row.village}
                                                    onChange={e => updateRow(row._id, 'village', e.target.value.toUpperCase())}
                                                    placeholder="Village"
                                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 focus:bg-white transition-all"
                                                />
                                            </td>

                                            {/* Contact */}
                                            <td className="px-3 py-2">
                                                <input type="tel" value={row.contact}
                                                    onChange={e => updateRow(row._id, 'contact', e.target.value)}
                                                    placeholder="Téléphone"
                                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 focus:bg-white transition-all"
                                                />
                                            </td>

                                            {/* OP d'appartenance */}
                                            <td className="px-3 py-2">
                                                <input type="text" value={row.op_appartenance}
                                                    onChange={e => updateRow(row._id, 'op_appartenance', e.target.value)}
                                                    placeholder="OP / coopérative"
                                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 focus:bg-white transition-all"
                                                />
                                            </td>

                                            {/* Produits agricoles */}
                                            <td className="px-3 py-2">
                                                <ProduitsCell
                                                    produits={row.produits_agricoles}
                                                    onChange={val => updateRow(row._id, 'produits_agricoles', val)}
                                                />
                                            </td>

                                            {/* Mode de commercialisation */}
                                            <td className="px-3 py-2">
                                                <input type="text" value={row.mode_commercialisation}
                                                    onChange={e => updateRow(row._id, 'mode_commercialisation', e.target.value)}
                                                    placeholder="Ex: Marché local"
                                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 focus:bg-white transition-all"
                                                />
                                            </td>

                                            {/* Marché actuel */}
                                            <td className="px-3 py-2">
                                                <input type="text" value={row.marche_actuel}
                                                    onChange={e => updateRow(row._id, 'marche_actuel', e.target.value)}
                                                    placeholder="Marché principal"
                                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 focus:bg-white transition-all"
                                                />
                                            </td>

                                            {/* Attentes */}
                                            <td className="px-3 py-2">
                                                <textarea value={row.attentes}
                                                    onChange={e => updateRow(row._id, 'attentes', e.target.value)}
                                                    placeholder="Attentes vis-à-vis du CAI…"
                                                    rows={2}
                                                    className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 focus:bg-white transition-all"
                                                />
                                            </td>

                                            {/* Supprimer */}
                                            <td className="px-3 py-2">
                                                <button type="button" onClick={() => removeRow(row._id)}
                                                    className="flex size-7 items-center justify-center rounded-lg text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all">
                                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pied de tableau — ajouter une ligne */}
                            <div className="border-t border-slate-100 p-3">
                                <button type="button" onClick={addRow}
                                    className="flex items-center gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100 transition-all w-full justify-center">
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Ajouter un producteur
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
