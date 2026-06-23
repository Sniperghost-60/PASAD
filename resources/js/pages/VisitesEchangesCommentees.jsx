import { useEffect, useRef, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import api from '../services/api';

/* ── Composant saisie multiple ───────────────────────────────────────── */
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
                        className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all resize-none" />
                    <button type="button" onClick={() => remove(i)}
                        className="mt-0.5 flex size-6 flex-shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-400 hover:bg-red-100 transition-colors">
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

const emptyRow = () => ({
    _id:                        Math.random().toString(36).slice(2),
    date:                       '',
    experimentations_tests:     [''],
    visiteurs_total:            '',
    visiteurs_hommes:           '',
    visiteurs_femmes:           '',
    qui_sont_visiteurs:         [''],
    ce_qui_a_marche:            [''],
    ce_qui_doit_etre_ameliore:  [''],
});

const toArr = (v) => Array.isArray(v) && v.length ? v : [''];

/* ── Modal aperçu ────────────────────────────────────────────────────── */
function ApercuModal({ rows, onClose }) {
    const printRef = useRef(null);

    const handlePrint = () => {
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>Visites d'échanges commentées</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 9px; margin: 10px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 3px 5px; vertical-align: top; text-align: center; }
                td.left { text-align: left; }
                .title td { background: #f4b942; font-weight: bold; font-size: 12px; padding: 6px; }
                thead th { background: #f1f5f9; font-weight: bold; font-size: 8px; text-transform: uppercase; }
                ul { margin: 2px 0; padding-left: 12px; text-align: left; }
                li { margin-bottom: 1px; }
            </style></head><body>${printRef.current.innerHTML}</body></html>`);
        win.document.close();
        win.print();
    };

    const filled = rows.filter(r => r.date || r.experimentations_tests?.some(v => v.trim()));

    const renderList = (arr) => {
        const items = (Array.isArray(arr) ? arr : []).filter(v => v?.trim());
        if (!items.length) return '';
        return items.length === 1
            ? items[0]
            : `<ul>${items.map(v => `<li>${v}</li>`).join('')}</ul>`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-[96vw] bg-white rounded-2xl shadow-2xl overflow-hidden my-6">
                <div className="flex items-center justify-between bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <h2 className="text-base font-bold text-white">Aperçu — Visites d'échanges commentées</h2>
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
                    <table className="w-full border-collapse text-[10px]">
                        <thead>
                            <tr className="title"><td colSpan={9}>Organisation de visites d'échanges commentées</td></tr>
                            <tr>
                                <th rowSpan={2} className="border border-black px-2 py-1" style={{minWidth:75}}>Date</th>
                                <th rowSpan={2} className="border border-black px-2 py-1" style={{minWidth:130}}>Expérimentations (tests)</th>
                                <th colSpan={3} className="border border-black px-2 py-1">Visiteurs</th>
                                <th rowSpan={2} className="border border-black px-2 py-1" style={{minWidth:120}}>Qui sont les visiteurs</th>
                                <th rowSpan={2} className="border border-black px-2 py-1" style={{minWidth:120}}>Ce qui a marché</th>
                                <th rowSpan={2} className="border border-black px-2 py-1" style={{minWidth:130}}>Ce qui doit être amélioré</th>
                            </tr>
                            <tr>
                                <th className="border border-black px-2 py-1">Total</th>
                                <th className="border border-black px-2 py-1">Hommes</th>
                                <th className="border border-black px-2 py-1">Femmes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(filled.length > 0 ? filled : Array.from({length: 5}).map(() => ({}))).map((r, i) => (
                                <tr key={r._id ?? i}>
                                    <td className="border border-black px-2 py-3">{r.date ?? ''}</td>
                                    <td className="border border-black px-2 py-3 left"
                                        dangerouslySetInnerHTML={{__html: renderList(r.experimentations_tests)}} />
                                    <td className="border border-black px-2 py-3">{r.visiteurs_total ?? ''}</td>
                                    <td className="border border-black px-2 py-3">{r.visiteurs_hommes ?? ''}</td>
                                    <td className="border border-black px-2 py-3">{r.visiteurs_femmes ?? ''}</td>
                                    <td className="border border-black px-2 py-3 left"
                                        dangerouslySetInnerHTML={{__html: renderList(r.qui_sont_visiteurs)}} />
                                    <td className="border border-black px-2 py-3 left"
                                        dangerouslySetInnerHTML={{__html: renderList(r.ce_qui_a_marche)}} />
                                    <td className="border border-black px-2 py-3 left"
                                        dangerouslySetInnerHTML={{__html: renderList(r.ce_qui_doit_etre_ameliore)}} />
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
export default function VisitesEchangesCommentees() {
    const [rows, setRows]               = useState([emptyRow()]);
    const [saving, setSaving]           = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [toast, setToast]             = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        api.get('/api/visites-echanges-commentees')
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                if (data.length > 0) {
                    setRows(data.map(r => ({
                        _id:                       String(r.id),
                        date:                      r.date              ?? '',
                        experimentations_tests:    toArr(r.experimentations_tests),
                        visiteurs_total:            r.visiteurs_total   != null ? String(r.visiteurs_total)  : '',
                        visiteurs_hommes:           r.visiteurs_hommes  != null ? String(r.visiteurs_hommes) : '',
                        visiteurs_femmes:           r.visiteurs_femmes  != null ? String(r.visiteurs_femmes) : '',
                        qui_sont_visiteurs:         toArr(r.qui_sont_visiteurs),
                        ce_qui_a_marche:            toArr(r.ce_qui_a_marche),
                        ce_qui_doit_etre_ameliore:  toArr(r.ce_qui_doit_etre_ameliore),
                    })));
                }
            })
            .catch(() => {});
    }, []);

    const update    = (idx, field, val) =>
        setRows(cur => cur.map((r, i) => i === idx ? { ...r, [field]: val } : r));
    const addRow    = () => setRows(c => [...c, emptyRow()]);
    const removeRow = (idx) => setRows(c => c.length > 1 ? c.filter((_, i) => i !== idx) : [emptyRow()]);

    const hasContent = (r) =>
        r.date || r.experimentations_tests.some(v => v.trim()) ||
        r.visiteurs_total || r.qui_sont_visiteurs.some(v => v.trim()) ||
        r.ce_qui_a_marche.some(v => v.trim());

    const handleSubmit = async (e) => {
        e.preventDefault();
        const lignes = rows.filter(hasContent);
        if (lignes.length === 0) {
            setToast({ show: true, message: 'Veuillez remplir au moins une ligne.', type: 'error' });
            return;
        }
        setSaving(true);
        try {
            const res = await api.post('/api/visites-echanges-commentees', {
                lignes: lignes.map(r => ({
                    date:                      r.date || null,
                    experimentations_tests:    r.experimentations_tests.map(v => v.trim()).filter(Boolean),
                    visiteurs_total:            r.visiteurs_total   !== '' ? Number(r.visiteurs_total)  : null,
                    visiteurs_hommes:           r.visiteurs_hommes  !== '' ? Number(r.visiteurs_hommes) : null,
                    visiteurs_femmes:           r.visiteurs_femmes  !== '' ? Number(r.visiteurs_femmes) : null,
                    qui_sont_visiteurs:         r.qui_sont_visiteurs.map(v => v.trim()).filter(Boolean),
                    ce_qui_a_marche:            r.ce_qui_a_marche.map(v => v.trim()).filter(Boolean),
                    ce_qui_doit_etre_ameliore:  r.ce_qui_doit_etre_ameliore.map(v => v.trim()).filter(Boolean),
                })),
            });
            setToast({ show: true, message: res.data.message, type: 'success' });
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.message || 'Erreur.', type: 'error' });
        } finally { setSaving(false); }
    };

    const iCls = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all';
    const nCls = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-center outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all';

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-60">
                <Header title="Visites d'échanges commentées" />

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                            {/* En-tête */}
                            <div className="flex items-center gap-3 bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                                <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <div>
                                    <h2 className="text-base font-bold text-white">Organisation de visites d'échanges commentées</h2>
                                    <p className="text-xs text-cyan-200/70 mt-0.5">{rows.filter(hasContent).length} visite(s)</p>
                                </div>
                            </div>

                            {/* Tableau */}
                            <div className="p-4 bg-slate-50/50 overflow-x-auto">
                                <table className="text-xs border-separate border-spacing-y-2" style={{minWidth: 1200}}>
                                    <thead>
                                        {/* Ligne 1 : groupes */}
                                        <tr>
                                            <th className="w-7"></th>
                                            <th className="px-1.5 pb-0.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide" style={{minWidth:120}}></th>
                                            <th className="px-1.5 pb-0.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide" style={{minWidth:190}}></th>
                                            <th colSpan={3} className="px-1.5 pb-0.5 text-center text-[10px] font-semibold text-blue-500 uppercase tracking-wide bg-blue-50/60 rounded-t-lg border-b border-blue-100">
                                                Visiteurs
                                            </th>
                                            <th className="px-1.5 pb-0.5" style={{minWidth:190}}></th>
                                            <th className="px-1.5 pb-0.5" style={{minWidth:190}}></th>
                                            <th className="px-1.5 pb-0.5" style={{minWidth:190}}></th>
                                            <th className="w-8"></th>
                                        </tr>
                                        {/* Ligne 2 : colonnes */}
                                        <tr>
                                            <th className="w-7"></th>
                                            <th className="px-1.5 pb-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide" style={{minWidth:120}}>Date</th>
                                            <th className="px-1.5 pb-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide" style={{minWidth:190}}>Expérimentations (tests)</th>
                                            <th className="px-1.5 pb-2 text-center text-[10px] font-semibold text-blue-400 uppercase tracking-wide bg-blue-50/60" style={{minWidth:60}}>Total</th>
                                            <th className="px-1.5 pb-2 text-center text-[10px] font-semibold text-blue-400 uppercase tracking-wide bg-blue-50/60" style={{minWidth:55}}>H</th>
                                            <th className="px-1.5 pb-2 text-center text-[10px] font-semibold text-pink-400 uppercase tracking-wide bg-blue-50/60" style={{minWidth:55}}>F</th>
                                            <th className="px-1.5 pb-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide" style={{minWidth:190}}>Qui sont les visiteurs</th>
                                            <th className="px-1.5 pb-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide" style={{minWidth:190}}>Ce qui a marché</th>
                                            <th className="px-1.5 pb-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide" style={{minWidth:190}}>Ce qui doit être amélioré</th>
                                            <th className="w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, idx) => (
                                            <tr key={row._id} className="group align-top">
                                                <td className="pt-1.5 pr-1 text-center">
                                                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500">{idx + 1}</span>
                                                </td>

                                                {/* Date */}
                                                <td className="px-0.5">
                                                    <input type="date" value={row.date}
                                                        onChange={e => update(idx, 'date', e.target.value)}
                                                        className={iCls} />
                                                </td>

                                                {/* Expérimentations — multiple */}
                                                <td className="px-0.5">
                                                    <MultiInput
                                                        values={row.experimentations_tests}
                                                        onChange={v => update(idx, 'experimentations_tests', v)}
                                                        placeholder="Expérimentation / test…" />
                                                </td>

                                                {/* Visiteurs */}
                                                <td className="px-0.5">
                                                    <input type="number" min="0" value={row.visiteurs_total}
                                                        onChange={e => update(idx, 'visiteurs_total', e.target.value)}
                                                        placeholder="0" className={nCls} />
                                                </td>
                                                <td className="px-0.5">
                                                    <input type="number" min="0" value={row.visiteurs_hommes}
                                                        onChange={e => update(idx, 'visiteurs_hommes', e.target.value)}
                                                        placeholder="0" className={nCls} />
                                                </td>
                                                <td className="px-0.5">
                                                    <input type="number" min="0" value={row.visiteurs_femmes}
                                                        onChange={e => update(idx, 'visiteurs_femmes', e.target.value)}
                                                        placeholder="0" className={nCls} />
                                                </td>

                                                {/* Qui sont les visiteurs — multiple */}
                                                <td className="px-0.5">
                                                    <MultiInput
                                                        values={row.qui_sont_visiteurs}
                                                        onChange={v => update(idx, 'qui_sont_visiteurs', v)}
                                                        placeholder="Qui sont les visiteurs…" />
                                                </td>

                                                {/* Ce qui a marché — multiple */}
                                                <td className="px-0.5">
                                                    <MultiInput
                                                        values={row.ce_qui_a_marche}
                                                        onChange={v => update(idx, 'ce_qui_a_marche', v)}
                                                        placeholder="Point positif…" />
                                                </td>

                                                {/* Ce qui doit être amélioré — multiple */}
                                                <td className="px-0.5">
                                                    <MultiInput
                                                        values={row.ce_qui_doit_etre_ameliore}
                                                        onChange={v => update(idx, 'ce_qui_doit_etre_ameliore', v)}
                                                        placeholder="Point à améliorer…" />
                                                </td>

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
                                    Ajouter une visite commentée
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

            {showPreview && <ApercuModal rows={rows} onClose={() => setShowPreview(false)} />}
        </div>
    );
}
