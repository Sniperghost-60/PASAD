import { useEffect, useRef, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import api from '../services/api';

const emptyRow = () => ({
    _id:                Math.random().toString(36).slice(2),
    difficulte:         '',
    solution_utilisee:  '',
    suggestion:         '',
});

/* ── Modal aperçu ────────────────────────────────────────────────────── */
function ApercuModal({ rows, onClose }) {
    const printRef = useRef(null);

    const handlePrint = () => {
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>Difficultés et suggestions</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 9px; margin: 10px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
                .title td { background: #f4b942; font-weight: bold; font-size: 12px; padding: 7px; text-align: center; }
                thead th { background: #f1f5f9; font-weight: bold; font-size: 9px; text-transform: uppercase; }
            </style></head><body>${printRef.current.innerHTML}</body></html>`);
        win.document.close();
        win.print();
    };

    const filled = rows.filter(r => r.difficulte || r.solution_utilisee || r.suggestion);

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6">
                <div className="flex items-center justify-between bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <h2 className="text-base font-bold text-white">Aperçu — Difficultés et suggestions</h2>
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
                            <tr className="title"><td colSpan={3}>Difficultés et suggestions</td></tr>
                            <tr>
                                {['Difficultés', 'Solutions utilisées', 'Suggestions'].map((h, i) => (
                                    <th key={i} className="border border-black px-3 py-2 text-left" style={{width: '33%'}}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(filled.length > 0 ? filled : Array.from({length: 5}).map(() => ({}))).map((r, i) => (
                                <tr key={r._id ?? i}>
                                    <td className="border border-black px-3 py-4">{r.difficulte ?? ''}</td>
                                    <td className="border border-black px-3 py-4">{r.solution_utilisee ?? ''}</td>
                                    <td className="border border-black px-3 py-4">{r.suggestion ?? ''}</td>
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
export default function DifficulteSuggestions() {
    const [rows, setRows]               = useState([emptyRow()]);
    const [saving, setSaving]           = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [toast, setToast]             = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        api.get('/api/difficultes-suggestions')
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                if (data.length > 0) {
                    setRows(data.map(r => ({
                        _id:               String(r.id),
                        difficulte:        r.difficulte        ?? '',
                        solution_utilisee: r.solution_utilisee ?? '',
                        suggestion:        r.suggestion        ?? '',
                    })));
                }
            })
            .catch(() => {});
    }, []);

    const update    = (idx, field, val) =>
        setRows(cur => cur.map((r, i) => i === idx ? { ...r, [field]: val } : r));
    const addRow    = () => setRows(c => [...c, emptyRow()]);
    const removeRow = (idx) => setRows(c => c.length > 1 ? c.filter((_, i) => i !== idx) : [emptyRow()]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const lignes = rows.filter(r => r.difficulte || r.solution_utilisee || r.suggestion);
        if (lignes.length === 0) {
            setToast({ show: true, message: 'Veuillez remplir au moins une ligne.', type: 'error' });
            return;
        }
        setSaving(true);
        try {
            const res = await api.post('/api/difficultes-suggestions', {
                lignes: lignes.map(r => ({
                    difficulte:        r.difficulte.trim()        || null,
                    solution_utilisee: r.solution_utilisee.trim() || null,
                    suggestion:        r.suggestion.trim()        || null,
                })),
            });
            setToast({ show: true, message: res.data.message, type: 'success' });
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.message || 'Erreur.', type: 'error' });
        } finally { setSaving(false); }
    };

    const taCls = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all resize-none';

    const COLS = [
        { field: 'difficulte',        label: 'Difficultés',       placeholder: 'Décrivez la difficulté…',      color: 'text-red-500',    bg: 'bg-red-50/50'   },
        { field: 'solution_utilisee', label: 'Solutions utilisées', placeholder: 'Solution mise en œuvre…',    color: 'text-blue-500',   bg: 'bg-blue-50/50'  },
        { field: 'suggestion',        label: 'Suggestions',         placeholder: 'Suggestion ou recommandation…', color: 'text-teal-500', bg: 'bg-teal-50/50'  },
    ];

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-60">
                <Header title="Difficultés et suggestions" />

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                            {/* En-tête */}
                            <div className="flex items-center gap-3 bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                                <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <div>
                                    <h2 className="text-base font-bold text-white">Difficultés et suggestions</h2>
                                    <p className="text-xs text-cyan-200/70 mt-0.5">{rows.filter(r => r.difficulte || r.solution_utilisee || r.suggestion).length} ligne(s)</p>
                                </div>
                            </div>

                            {/* Tableau 3 colonnes */}
                            <div className="p-4 bg-slate-50/50">

                                {/* En-têtes colonnes */}
                                <div className="grid grid-cols-3 gap-3 mb-2 px-8">
                                    {COLS.map(col => (
                                        <div key={col.field} className={`rounded-lg px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider ${col.color} ${col.bg} border border-current/20`}>
                                            {col.label}
                                        </div>
                                    ))}
                                </div>

                                {/* Lignes */}
                                <div className="space-y-2">
                                    {rows.map((row, idx) => (
                                        <div key={row._id} className="group flex items-start gap-2">
                                            {/* Numéro */}
                                            <span className="mt-2 flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500">
                                                {idx + 1}
                                            </span>

                                            {/* 3 cellules */}
                                            <div className="grid flex-1 grid-cols-3 gap-3">
                                                {COLS.map(col => (
                                                    <textarea
                                                        key={col.field}
                                                        value={row[col.field]}
                                                        onChange={e => update(idx, col.field, e.target.value)}
                                                        placeholder={col.placeholder}
                                                        rows={3}
                                                        className={taCls}
                                                    />
                                                ))}
                                            </div>

                                            {/* Supprimer */}
                                            <button type="button" onClick={() => removeRow(idx)}
                                                className="mt-1.5 flex size-7 flex-shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-400 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100">
                                                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button type="button" onClick={addRow}
                                    className="mt-4 flex items-center gap-2 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/50 px-4 py-2.5 text-xs font-semibold text-teal-700 hover:border-teal-400 hover:bg-teal-50 transition-all">
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

            {showPreview && <ApercuModal rows={rows} onClose={() => setShowPreview(false)} />}
        </div>
    );
}
