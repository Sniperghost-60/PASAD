import { useEffect, useRef, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import CepSelector from '../components/CepSelector';
import api from '../services/api';

const emptyRow = () => ({
    _id: Math.random().toString(36).slice(2),
    date_session:           '',
    participation_total:    '',
    participation_h:        '',
    participation_f:        '',
    participation_jeunes:   '',
    nb_aaes:                '',
    nb_test_urne:           '',
    sujets_speciaux:        '',
    visiteur_nom:           '',
    visiteur_structure:     '',
});

/* ── Modal aperçu ────────────────────────────────────────────────────── */
function ApercuModal({ rows, onClose }) {
    const printRef = useRef(null);

    const handlePrint = () => {
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>Bilan sessions CEP</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 9px; margin: 10px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 3px 5px; vertical-align: middle; text-align: center; }
                .title td { background: #8BCF45; font-weight: bold; font-size: 12px; padding: 6px; }
                .head th { background: #f1f5f9; font-weight: bold; font-size: 8px; }
            </style></head><body>${printRef.current.innerHTML}</body></html>`);
        win.document.close();
        win.print();
    };

    const filled = rows.filter(r => r.date_session || r.participation_total);

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6">
                <div className="flex items-center justify-between bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <h2 className="text-base font-bold text-white">Aperçu — Bilan mensuel des sessions</h2>
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
                            <tr className="title">
                                <td colSpan={9}>Bilan mensueelles des sessions d'animation du CEP</td>
                            </tr>
                            <tr>
                                <th rowSpan={3} className="border border-black px-2 py-1 bg-slate-50" style={{minWidth:80}}>Dates des sessions</th>
                                <th colSpan={4} className="border border-black px-2 py-1 bg-slate-50">Participation des apprenants</th>
                                <th rowSpan={2} className="border border-black px-2 py-1 bg-slate-50">Nb.<br/>AAES</th>
                                <th rowSpan={2} className="border border-black px-2 py-1 bg-slate-50">Nb. test<br/>d'urne</th>
                                <th rowSpan={2} className="border border-black px-2 py-1 bg-slate-50">Sujets<br/>spéciaux<br/>animés</th>
                                <th colSpan={2} className="border border-black px-2 py-1 bg-slate-50">Visiteurs ou personnes<br/>ressources</th>
                            </tr>
                            <tr>
                                <th className="border border-black px-2 py-1 bg-slate-50">Total</th>
                                <th className="border border-black px-2 py-1 bg-slate-50">H</th>
                                <th className="border border-black px-2 py-1 bg-slate-50">F</th>
                                <th className="border border-black px-2 py-1 bg-slate-50">Jeunes</th>
                                <th className="border border-black px-2 py-1 bg-slate-50">Nom</th>
                                <th className="border border-black px-2 py-1 bg-slate-50">Structure</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(filled.length > 0 ? filled : Array.from({length: 5}).map(() => ({}))).map((r, i) => (
                                <tr key={r._id ?? i}>
                                    <td className="border border-black px-2 py-2 text-center">{r.date_session ?? ''}</td>
                                    <td className="border border-black px-2 py-2 text-center">{r.participation_total ?? ''}</td>
                                    <td className="border border-black px-2 py-2 text-center">{r.participation_h ?? ''}</td>
                                    <td className="border border-black px-2 py-2 text-center">{r.participation_f ?? ''}</td>
                                    <td className="border border-black px-2 py-2 text-center">{r.participation_jeunes ?? ''}</td>
                                    <td className="border border-black px-2 py-2 text-center">{r.nb_aaes ?? ''}</td>
                                    <td className="border border-black px-2 py-2 text-center">{r.nb_test_urne ?? ''}</td>
                                    <td className="border border-black px-2 py-2">{r.sujets_speciaux ?? ''}</td>
                                    <td className="border border-black px-2 py-2">{r.visiteur_nom ?? ''}</td>
                                    <td className="border border-black px-2 py-2">{r.visiteur_structure ?? ''}</td>
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
export default function BilanSessionsAnimationCep() {
    const [selectedCep, setSelectedCep] = useState('');
    const [rows, setRows]       = useState([emptyRow()]);
    const [saving, setSaving]   = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [toast, setToast]     = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        const params = selectedCep ? { cep_id: selectedCep } : {};
        api.get('/api/bilan-sessions-animation-cep', { params })
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                if (data.length === 0) { setRows([emptyRow()]); return; }
                setRows(data.map(r => ({
                    _id:                    String(r.id),
                    date_session:           r.date_session           ?? '',
                    participation_total:    r.participation_total    != null ? String(r.participation_total)    : '',
                    participation_h:        r.participation_h        != null ? String(r.participation_h)        : '',
                    participation_f:        r.participation_f        != null ? String(r.participation_f)        : '',
                    participation_jeunes:   r.participation_jeunes   != null ? String(r.participation_jeunes)   : '',
                    nb_aaes:                r.nb_aaes                != null ? String(r.nb_aaes)                : '',
                    nb_test_urne:           r.nb_test_urne           != null ? String(r.nb_test_urne)           : '',
                    sujets_speciaux:        r.sujets_speciaux        ?? '',
                    visiteur_nom:           r.visiteur_nom           ?? '',
                    visiteur_structure:     r.visiteur_structure     ?? '',
                })));
            })
            .catch(() => {});
    }, [selectedCep]);

    const update    = (idx, field, val) =>
        setRows(cur => cur.map((r, i) => i === idx ? { ...r, [field]: val } : r));
    const addRow    = () => setRows(c => [...c, emptyRow()]);
    const removeRow = (idx) => setRows(c => c.length > 1 ? c.filter((_, i) => i !== idx) : [emptyRow()]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const lignes = rows.filter(r =>
            r.date_session || r.participation_total || r.participation_h ||
            r.nb_aaes || r.sujets_speciaux || r.visiteur_nom
        );
        if (lignes.length === 0) {
            setToast({ show: true, message: 'Veuillez remplir au moins une ligne.', type: 'error' });
            return;
        }
        setSaving(true);
        try {
            const res = await api.post('/api/bilan-sessions-animation-cep', {
                cep_id: selectedCep ? Number(selectedCep) : null,
                lignes: lignes.map(r => ({
                    date_session:           r.date_session           || null,
                    participation_total:    r.participation_total    !== '' ? Number(r.participation_total)    : null,
                    participation_h:        r.participation_h      !== '' ? Number(r.participation_h)      : null,
                    participation_f:        r.participation_f      !== '' ? Number(r.participation_f)      : null,
                    participation_jeunes:   r.participation_jeunes !== '' ? Number(r.participation_jeunes) : null,
                    nb_aaes:                r.nb_aaes                !== '' ? Number(r.nb_aaes)                : null,
                    nb_test_urne:           r.nb_test_urne           !== '' ? Number(r.nb_test_urne)           : null,
                    sujets_speciaux:        r.sujets_speciaux.trim() || null,
                    visiteur_nom:           r.visiteur_nom.trim()    || null,
                    visiteur_structure:     r.visiteur_structure.trim() || null,
                })),
            });
            setToast({ show: true, message: res.data.message, type: 'success' });
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.message || 'Erreur.', type: 'error' });
        } finally { setSaving(false); }
    };

    const nCls = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-center outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all';
    const iCls = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all';

    const COLS = [
        'Dates des sessions',
        'Total', 'H', 'F', 'Jeunes',
        'Nb. AAES', 'Nb. test d\'urne',
        'Sujets spéciaux animés',
        'Visiteur — Nom', 'Visiteur — Structure',
        '',
    ];

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-60">
                <Header title="Bilan des sessions d'animation" />

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Sélecteur CEP */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                            <CepSelector value={selectedCep} onChange={setSelectedCep} required />
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            {/* En-tête */}
                            <div className="flex items-center justify-between bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <div>
                                        <h2 className="text-base font-bold text-white">Bilan mensuel des sessions d'animation du CEP</h2>
                                        <p className="text-xs text-cyan-200/70 mt-0.5">{rows.filter(r => r.date_session || r.participation_total).length} session(s)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tableau */}
                            <div className="p-4 bg-slate-50/50 overflow-x-auto">
                                <table className="text-xs border-separate border-spacing-y-1" style={{minWidth: 980}}>
                                    <thead>
                                        {/* Groupe de colonnes */}
                                        <tr>
                                            <th className="px-1.5 pb-1 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400" rowSpan={2}></th>
                                            <th className="px-1.5 pb-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200" colSpan={1}>Date</th>
                                            <th className="px-1.5 pb-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-teal-600 border-b border-teal-200 bg-teal-50/50 rounded-t-lg" colSpan={4}>Participation apprenants</th>
                                            <th className="px-1.5 pb-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200" colSpan={2}></th>
                                            <th className="px-1.5 pb-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200" colSpan={1}></th>
                                            <th className="px-1.5 pb-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-amber-600 border-b border-amber-200 bg-amber-50/50 rounded-t-lg" colSpan={2}>Visiteurs / Personnes ressources</th>
                                            <th></th>
                                        </tr>
                                        <tr>
                                            {COLS.map((h, i) => (
                                                <th key={i} className="px-1.5 pb-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, idx) => (
                                            <tr key={row._id} className="group">
                                                <td className="px-0.5 text-center">
                                                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500">{idx + 1}</span>
                                                </td>
                                                {/* Date */}
                                                <td className="px-0.5">
                                                    <input type="date" value={row.date_session}
                                                        onChange={e => update(idx, 'date_session', e.target.value)}
                                                        className={iCls} style={{minWidth: 120}} />
                                                </td>
                                                {/* Participation */}
                                                <td className="px-0.5">
                                                    <input type="number" min="0" value={row.participation_total}
                                                        onChange={e => update(idx, 'participation_total', e.target.value)}
                                                        placeholder="0" className={nCls} style={{minWidth: 55}} />
                                                </td>
                                                <td className="px-0.5">
                                                    <input type="number" min="0" value={row.participation_h}
                                                        onChange={e => update(idx, 'participation_h', e.target.value)}
                                                        placeholder="0" className={nCls} style={{minWidth: 55}} />
                                                </td>
                                                <td className="px-0.5">
                                                    <input type="number" min="0" value={row.participation_f}
                                                        onChange={e => update(idx, 'participation_f', e.target.value)}
                                                        placeholder="0" className={nCls} style={{minWidth: 55}} />
                                                </td>
                                                <td className="px-0.5">
                                                    <input type="number" min="0" value={row.participation_jeunes}
                                                        onChange={e => update(idx, 'participation_jeunes', e.target.value)}
                                                        placeholder="0" className={nCls} style={{minWidth: 60}} />
                                                </td>
                                                {/* AAES + urne */}
                                                <td className="px-0.5">
                                                    <input type="number" min="0" value={row.nb_aaes}
                                                        onChange={e => update(idx, 'nb_aaes', e.target.value)}
                                                        placeholder="0" className={nCls} style={{minWidth: 60}} />
                                                </td>
                                                <td className="px-0.5">
                                                    <input type="number" min="0" value={row.nb_test_urne}
                                                        onChange={e => update(idx, 'nb_test_urne', e.target.value)}
                                                        placeholder="0" className={nCls} style={{minWidth: 70}} />
                                                </td>
                                                {/* Sujets */}
                                                <td className="px-0.5">
                                                    <input value={row.sujets_speciaux}
                                                        onChange={e => update(idx, 'sujets_speciaux', e.target.value)}
                                                        placeholder="Sujets spéciaux…"
                                                        className={iCls} style={{minWidth: 160}} />
                                                </td>
                                                {/* Visiteurs */}
                                                <td className="px-0.5">
                                                    <input value={row.visiteur_nom}
                                                        onChange={e => update(idx, 'visiteur_nom', e.target.value)}
                                                        placeholder="Nom du visiteur"
                                                        className={iCls} style={{minWidth: 130}} />
                                                </td>
                                                <td className="px-0.5">
                                                    <input value={row.visiteur_structure}
                                                        onChange={e => update(idx, 'visiteur_structure', e.target.value)}
                                                        placeholder="Structure"
                                                        className={iCls} style={{minWidth: 120}} />
                                                </td>
                                                {/* Supprimer */}
                                                <td className="px-0.5">
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
                                    Ajouter une session
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
                                    <button type="button" onClick={() => { setRows([emptyRow()]); }}
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
