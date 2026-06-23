import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import api from '../services/api';

const emptyRow = () => ({
    _id:                        Math.random().toString(36).slice(2),
    commune_id:                 '',
    arrondissement_id:          '',
    village:                    '',
    type_experimentation_cep:   '',
    culture:                    '',
    technologies_dispositif_1:  '',
    technologies_dispositif_2:  '',
    technologies_dispositif_3:  '',
    technologies_dispositif_4:  '',
    rendement_dispositif_1:     '',
    rendement_dispositif_2:     '',
    rendement_dispositif_3:     '',
    rendement_dispositif_4:     '',
});

/* ── Modal aperçu ────────────────────────────────────────────────────── */
function ApercuModal({ rows, communeCache, arrCache, onClose }) {
    const printRef = useRef(null);

    const handlePrint = () => {
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>Évolution des rendements CEP</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 8px; margin: 8px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 2px 4px; vertical-align: top; text-align: center; }
                .title td { background: #f4b942; font-weight: bold; font-size: 11px; padding: 5px; }
                .grp th { background: #e2f0e2; font-weight: bold; }
                thead th { background: #f1f5f9; font-weight: bold; font-size: 7px; text-transform: uppercase; }
            </style></head><body>${printRef.current.innerHTML}</body></html>`);
        win.document.close();
        win.print();
    };

    const getName = (list, id) => list?.find(i => String(i.id) === String(id))?.nom ?? '';
    const filled  = rows.filter(r => r.commune_id || r.culture || r.type_experimentation_cep);

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-[98vw] bg-white rounded-2xl shadow-2xl overflow-hidden my-6">
                <div className="flex items-center justify-between bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <h2 className="text-base font-bold text-white">Aperçu — Évolution des rendements des CEP</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={handlePrint}
                            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-all">
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            Imprimer
                        </button>
                        <button type="button" onClick={onClose}
                            className="flex size-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20">
                            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                <div className="p-4 overflow-x-auto" ref={printRef}>
                    <table className="w-full border-collapse text-[9px]">
                        <thead>
                            <tr className="title"><td colSpan={13}>Modèle de tableau d'évolution des rendements des CEP</td></tr>
                            <tr>
                                <th rowSpan={2} className="border border-black px-1 py-1" style={{minWidth:70}}>Commune</th>
                                <th rowSpan={2} className="border border-black px-1 py-1" style={{minWidth:80}}>Arrondissement</th>
                                <th rowSpan={2} className="border border-black px-1 py-1" style={{minWidth:70}}>Village</th>
                                <th rowSpan={2} className="border border-black px-1 py-1" style={{minWidth:90}}>Type d'expérimentation CEP</th>
                                <th rowSpan={2} className="border border-black px-1 py-1" style={{minWidth:60}}>Culture</th>
                                <th colSpan={4} className="border border-black px-1 py-1 bg-green-50">Technologies dispositif</th>
                                <th colSpan={4} className="border border-black px-1 py-1 bg-amber-50">Rendement dispositif</th>
                            </tr>
                            <tr>
                                {[1,2,3,4].map(n => <th key={n} className="border border-black px-1 py-1 bg-green-50/70" style={{minWidth:70}}>{n}</th>)}
                                {[1,2,3,4].map(n => <th key={n} className="border border-black px-1 py-1 bg-amber-50/70" style={{minWidth:60}}>{n}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {(filled.length > 0 ? filled : Array.from({length: 4}).map(() => ({}))).map((r, i) => (
                                <tr key={r._id ?? i}>
                                    <td className="border border-black px-1 py-3 text-left">{r.commune_id ? getName(communeCache._all ?? [], r.commune_id) : ''}</td>
                                    <td className="border border-black px-1 py-3 text-left">{r.arrondissement_id ? getName(arrCache._all ?? [], r.arrondissement_id) : ''}</td>
                                    <td className="border border-black px-1 py-3 text-left">{r.village ?? ''}</td>
                                    <td className="border border-black px-1 py-3 text-left">{r.type_experimentation_cep ?? ''}</td>
                                    <td className="border border-black px-1 py-3 text-left">{r.culture ?? ''}</td>
                                    {[1,2,3,4].map(n => <td key={n} className="border border-black px-1 py-3 text-left">{r[`technologies_dispositif_${n}`] ?? ''}</td>)}
                                    {[1,2,3,4].map(n => <td key={n} className="border border-black px-1 py-3">{r[`rendement_dispositif_${n}`] ?? ''}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/* ── Page principale ─────────────────────────────────────────────────── */
export default function EvolutionRendementsCep() {
    const [rows, setRows]               = useState([emptyRow()]);
    const [communeCache, setCommuneCache] = useState({});
    const [arrCache, setArrCache]       = useState({});
    const [saving, setSaving]           = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [toast, setToast]             = useState({ show: false, message: '', type: 'success' });

    /* Charger les communes de l'utilisateur */
    useEffect(() => {
        api.get('/api/user/communes')
            .then(res => {
                const list = Array.isArray(res.data) ? res.data : [];
                const cache = {};
                list.forEach(c => { cache[c.id] = c; });
                setCommuneCache({ _list: list, ...cache });
            })
            .catch(() => {});
    }, []);

    /* Charger les données existantes */
    useEffect(() => {
        api.get('/api/evolution-rendements-cep')
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                if (data.length > 0) {
                    const rows = data.map(r => ({
                        _id:                       String(r.id),
                        commune_id:                r.commune_id         ? String(r.commune_id)        : '',
                        arrondissement_id:         r.arrondissement_id  ? String(r.arrondissement_id) : '',
                        village:                   r.village            ?? '',
                        type_experimentation_cep:  r.type_experimentation_cep ?? '',
                        culture:                   r.culture            ?? '',
                        technologies_dispositif_1: r.technologies_dispositif_1 ?? '',
                        technologies_dispositif_2: r.technologies_dispositif_2 ?? '',
                        technologies_dispositif_3: r.technologies_dispositif_3 ?? '',
                        technologies_dispositif_4: r.technologies_dispositif_4 ?? '',
                        rendement_dispositif_1:    r.rendement_dispositif_1 != null ? String(r.rendement_dispositif_1) : '',
                        rendement_dispositif_2:    r.rendement_dispositif_2 != null ? String(r.rendement_dispositif_2) : '',
                        rendement_dispositif_3:    r.rendement_dispositif_3 != null ? String(r.rendement_dispositif_3) : '',
                        rendement_dispositif_4:    r.rendement_dispositif_4 != null ? String(r.rendement_dispositif_4) : '',
                    }));
                    setRows(rows);
                    rows.forEach(r => { if (r.commune_id) loadArr(r.commune_id); });
                }
            })
            .catch(() => {});
    }, []);

    const loadArr = useCallback(async (cId) => {
        if (!cId || arrCache[cId]) return;
        try {
            const res = await api.get(`/api/communes/${cId}/arrondissements`);
            setArrCache(p => ({ ...p, [cId]: Array.isArray(res.data) ? res.data : [] }));
        } catch {}
    }, [arrCache]);

    const update    = (idx, field, val) =>
        setRows(cur => cur.map((r, i) => i === idx ? { ...r, [field]: val } : r));
    const addRow    = () => setRows(c => [...c, emptyRow()]);
    const removeRow = (idx) => setRows(c => c.length > 1 ? c.filter((_, i) => i !== idx) : [emptyRow()]);

    const hasContent = (r) => r.commune_id || r.culture || r.type_experimentation_cep || r.technologies_dispositif_1 || r.rendement_dispositif_1;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const lignes = rows.filter(hasContent);
        if (lignes.length === 0) {
            setToast({ show: true, message: 'Veuillez remplir au moins une ligne.', type: 'error' });
            return;
        }
        setSaving(true);
        try {
            const res = await api.post('/api/evolution-rendements-cep', {
                lignes: lignes.map(r => ({
                    commune_id:                r.commune_id        ? Number(r.commune_id)        : null,
                    arrondissement_id:         r.arrondissement_id ? Number(r.arrondissement_id) : null,
                    village:                   r.village.trim()    || null,
                    type_experimentation_cep:  r.type_experimentation_cep.trim() || null,
                    culture:                   r.culture.trim()    || null,
                    technologies_dispositif_1: r.technologies_dispositif_1.trim() || null,
                    technologies_dispositif_2: r.technologies_dispositif_2.trim() || null,
                    technologies_dispositif_3: r.technologies_dispositif_3.trim() || null,
                    technologies_dispositif_4: r.technologies_dispositif_4.trim() || null,
                    rendement_dispositif_1:    r.rendement_dispositif_1 !== '' ? Number(r.rendement_dispositif_1) : null,
                    rendement_dispositif_2:    r.rendement_dispositif_2 !== '' ? Number(r.rendement_dispositif_2) : null,
                    rendement_dispositif_3:    r.rendement_dispositif_3 !== '' ? Number(r.rendement_dispositif_3) : null,
                    rendement_dispositif_4:    r.rendement_dispositif_4 !== '' ? Number(r.rendement_dispositif_4) : null,
                })),
            });
            setToast({ show: true, message: res.data.message, type: 'success' });
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.message || 'Erreur.', type: 'error' });
        } finally { setSaving(false); }
    };

    const iCls = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all';
    const nCls = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-center outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all';
    const sCls = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all';

    const communes = communeCache._list ?? [];

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-60">
                <Header title="Évolution des rendements des CEP" />

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                            {/* En-tête */}
                            <div className="flex items-center gap-3 bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                                <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <div>
                                    <h2 className="text-base font-bold text-white">Modèle de tableau d'évolution des rendements des CEP</h2>
                                    <p className="text-xs text-cyan-200/70 mt-0.5">{rows.filter(hasContent).length} ligne(s)</p>
                                </div>
                            </div>

                            {/* Tableau */}
                            <div className="p-4 bg-slate-50/50 overflow-x-auto">
                                <table className="text-xs border-separate border-spacing-y-1.5" style={{minWidth: 1400}}>
                                    <thead>
                                        {/* Ligne groupes */}
                                        <tr>
                                            <th className="w-7"></th>
                                            <th colSpan={5} className="px-1.5 pb-0.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide"></th>
                                            <th colSpan={4} className="px-2 pb-0.5 text-center text-[10px] font-bold text-emerald-600 uppercase tracking-wide bg-emerald-50/60 rounded-t-lg border-b border-emerald-100">
                                                Technologies dispositif
                                            </th>
                                            <th colSpan={4} className="px-2 pb-0.5 text-center text-[10px] font-bold text-amber-600 uppercase tracking-wide bg-amber-50/60 rounded-t-lg border-b border-amber-100">
                                                Rendement dispositif
                                            </th>
                                            <th className="w-8"></th>
                                        </tr>
                                        {/* Ligne colonnes */}
                                        <tr>
                                            <th className="w-7"></th>
                                            {[
                                                {label:'Commune',              w:100},
                                                {label:'Arrondissement',       w:110},
                                                {label:'Village',              w:90},
                                                {label:"Type expérimentation", w:130},
                                                {label:'Culture',              w:80},
                                            ].map(({label,w},i) => (
                                                <th key={i} className="px-1.5 pb-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide" style={{minWidth:w}}>{label}</th>
                                            ))}
                                            {[1,2,3,4].map(n => (
                                                <th key={n} className="px-1.5 pb-2 text-center text-[10px] font-semibold text-emerald-500 uppercase tracking-wide bg-emerald-50/40" style={{minWidth:100}}>
                                                    Dispositif {n}
                                                </th>
                                            ))}
                                            {[1,2,3,4].map(n => (
                                                <th key={n} className="px-1.5 pb-2 text-center text-[10px] font-semibold text-amber-500 uppercase tracking-wide bg-amber-50/40" style={{minWidth:80}}>
                                                    Dispositif {n}
                                                </th>
                                            ))}
                                            <th className="w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, idx) => (
                                            <tr key={row._id} className="group align-top">
                                                <td className="pt-1.5 pr-1 text-center">
                                                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500">{idx + 1}</span>
                                                </td>

                                                {/* Commune */}
                                                <td className="px-0.5">
                                                    <select value={row.commune_id}
                                                        onChange={e => {
                                                            update(idx, 'commune_id', e.target.value);
                                                            update(idx, 'arrondissement_id', '');
                                                            if (e.target.value) loadArr(e.target.value);
                                                        }}
                                                        className={sCls} style={{minWidth:100}}>
                                                        <option value="">—</option>
                                                        {communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                                                    </select>
                                                </td>

                                                {/* Arrondissement */}
                                                <td className="px-0.5">
                                                    <select value={row.arrondissement_id}
                                                        onChange={e => update(idx, 'arrondissement_id', e.target.value)}
                                                        disabled={!row.commune_id}
                                                        className={sCls} style={{minWidth:110}}>
                                                        <option value="">—</option>
                                                        {(arrCache[row.commune_id] ?? []).map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                                                    </select>
                                                </td>

                                                {/* Village */}
                                                <td className="px-0.5">
                                                    <input value={row.village} onChange={e => update(idx,'village',e.target.value)} placeholder="Village…" className={iCls} style={{minWidth:90}} />
                                                </td>

                                                {/* Type expérimentation */}
                                                <td className="px-0.5">
                                                    <input value={row.type_experimentation_cep} onChange={e => update(idx,'type_experimentation_cep',e.target.value)} placeholder="Type…" className={iCls} style={{minWidth:130}} />
                                                </td>

                                                {/* Culture */}
                                                <td className="px-0.5">
                                                    <input value={row.culture} onChange={e => update(idx,'culture',e.target.value)} placeholder="Culture…" className={iCls} style={{minWidth:80}} />
                                                </td>

                                                {/* Technologies dispositif 1-4 */}
                                                {[1,2,3,4].map(n => (
                                                    <td key={n} className="px-0.5">
                                                        <input value={row[`technologies_dispositif_${n}`]}
                                                            onChange={e => update(idx, `technologies_dispositif_${n}`, e.target.value)}
                                                            placeholder={`Tech. D${n}…`}
                                                            className={`${iCls} bg-emerald-50/30 focus:bg-emerald-50`}
                                                            style={{minWidth:100}} />
                                                    </td>
                                                ))}

                                                {/* Rendement dispositif 1-4 */}
                                                {[1,2,3,4].map(n => (
                                                    <td key={n} className="px-0.5">
                                                        <input type="number" min="0" step="0.01"
                                                            value={row[`rendement_dispositif_${n}`]}
                                                            onChange={e => update(idx, `rendement_dispositif_${n}`, e.target.value)}
                                                            placeholder="0"
                                                            className={`${nCls} bg-amber-50/30 focus:bg-amber-50`}
                                                            style={{minWidth:80}} />
                                                    </td>
                                                ))}

                                                {/* Supprimer */}
                                                <td className="px-0.5 pt-1">
                                                    <button type="button" onClick={() => removeRow(idx)}
                                                        className="flex size-7 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-400 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100">
                                                        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <button type="button" onClick={addRow}
                                    className="mt-3 flex items-center gap-2 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/50 px-4 py-2.5 text-xs font-semibold text-teal-700 hover:border-teal-400 hover:bg-teal-50 transition-all">
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                    Ajouter une ligne
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
                                <button type="button" onClick={() => setShowPreview(true)}
                                    className="flex items-center gap-2 rounded-xl border-2 border-[#062824] bg-white px-5 py-2.5 text-sm font-semibold text-[#062824] hover:bg-[#062824]/5 transition-colors">
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    Aperçu
                                </button>
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => setRows([emptyRow()])}
                                        className="px-5 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                                        Réinitialiser
                                    </button>
                                    <button type="submit" disabled={saving}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition-all">
                                        {saving && <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        Enregistrer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <ModernNotification show={toast.show} message={toast.message} type={toast.type}
                    onClose={() => setToast(t => ({ ...t, show: false }))} />
            </main>

            {showPreview && (
                <ApercuModal rows={rows} communeCache={communeCache} arrCache={arrCache}
                    onClose={() => setShowPreview(false)} />
            )}
        </div>
    );
}
