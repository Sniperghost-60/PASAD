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
            <html><head><title>Négociation accord CAI</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 10px; margin: 16px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 4px 5px; vertical-align: top; }
                .title-row td { background: #F59E0B; font-weight: bold; text-align: center; font-size: 12px; color: #fff; }
                .header-group td { background: #FEF3C7; font-weight: bold; text-align: center; font-size: 10px; }
                th { font-weight: bold; font-size: 9px; text-transform: uppercase; background: #FEF3C7; }
                .center { text-align: center; }
            </style></head><body>${content}</body></html>
        `);
        win.document.close();
        win.print();
    };

    const filled = rows.filter(r => r.contraintes_a_lever?.trim() || r.activites?.trim());

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-7xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6">
                <div className="flex items-center justify-between bg-gradient-to-r from-amber-900 to-amber-700 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <svg className="size-5 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <div>
                            <h2 className="text-base font-bold text-white">Aperçu — Négociation accord CAI</h2>
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
                            className="rounded-xl border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20 transition-all">
                            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-x-auto" ref={printRef}>
                    <table className="w-full border-collapse text-xs">
                        <tbody>
                            <tr className="title-row">
                                <td colSpan={7} className="border border-gray-400 bg-amber-400 font-bold text-center py-2 text-sm">
                                    Étape 2 : Négociation de l'accord CAI (CTS-PV/AE et CAM)
                                </td>
                            </tr>
                            <tr className="header-group">
                                <th className="border border-gray-400 py-2 px-2 w-10">N°</th>
                                <th className="border border-gray-400 py-2 px-2">Contraintes à lever</th>
                                <th className="border border-gray-400 py-2 px-2">Activités</th>
                                <th className="border border-gray-400 py-2 px-2">Responsables</th>
                                <th className="border border-gray-400 py-2 px-2">Période d'exécution</th>
                                <th className="border border-gray-400 py-2 px-2">Moyens — Conseiller</th>
                                <th className="border border-gray-400 py-2 px-2">Moyens — OP/Exploitation</th>
                            </tr>
                            {filled.map((r, i) => (
                                <tr key={i}>
                                    <td className="border border-gray-300 px-2 py-1.5 text-center">{r.numero ?? i + 1}</td>
                                    <td className="border border-gray-300 px-2 py-1.5">{r.contraintes_a_lever}</td>
                                    <td className="border border-gray-300 px-2 py-1.5">{r.activites}</td>
                                    <td className="border border-gray-300 px-2 py-1.5">{r.responsables}</td>
                                    <td className="border border-gray-300 px-2 py-1.5">{r.periode_execution}</td>
                                    <td className="border border-gray-300 px-2 py-1.5">{r.moyens_conseiller}</td>
                                    <td className="border border-gray-300 px-2 py-1.5">{r.moyens_op_exploitation}</td>
                                </tr>
                            ))}
                            {filled.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="border border-gray-300 px-4 py-6 text-center text-gray-400 italic">
                                        Aucune ligne renseignée
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/* ── Helpers ─────────────────────────────────────────────────────────── */
function emptyRow() {
    return {
        _id: Math.random().toString(36).slice(2),
        numero: '',
        contraintes_a_lever: '',
        activites: '',
        responsables: '',
        periode_execution: '',
        moyens_conseiller: '',
        moyens_op_exploitation: '',
    };
}

/* ── Page principale ─────────────────────────────────────────────────── */
export default function CaiNegociationAccord() {
    const [dateSession, setDateSession]   = useState('');
    const [rows, setRows]                 = useState([emptyRow()]);
    const [loading, setLoading]           = useState(false);
    const [saving, setSaving]             = useState(false);
    const [showApercu, setShowApercu]     = useState(false);
    const [toast, setToast]               = useState({ show: false, message: '', type: 'success' });

    const notify = (message, type = 'success') => setToast({ show: true, message, type });

    const loadSession = useCallback(async (date) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ date_session: date });
            const res = await api.get(`/cai/negociation-accord?${params}`);
            if (res.data.length > 0) {
                setRows(res.data.map(r => ({
                    _id: String(r.id),
                    numero: r.numero ?? '',
                    contraintes_a_lever: r.contraintes_a_lever ?? '',
                    activites: r.activites ?? '',
                    responsables: r.responsables ?? '',
                    periode_execution: r.periode_execution ?? '',
                    moyens_conseiller: r.moyens_conseiller ?? '',
                    moyens_op_exploitation: r.moyens_op_exploitation ?? '',
                })));
            } else {
                setRows([emptyRow()]);
            }
        } catch {
            setRows([emptyRow()]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (dateSession) loadSession(dateSession);
        else setRows([emptyRow()]);
    }, [dateSession, loadSession]);

    const updateRow = (id, field, val) =>
        setRows(prev => prev.map(r => r._id === id ? { ...r, [field]: val } : r));

    const addRow = () =>
        setRows(prev => [...prev, { ...emptyRow(), numero: String(prev.length + 1) }]);

    const removeRow = (id) =>
        setRows(prev => prev.length > 1 ? prev.filter(r => r._id !== id) : [emptyRow()]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const lignes = rows
                .filter(r => r.contraintes_a_lever.trim() || r.activites.trim())
                .map((r, i) => ({
                    numero: r.numero !== '' ? Number(r.numero) : i + 1,
                    contraintes_a_lever:    r.contraintes_a_lever.trim()    || null,
                    activites:              r.activites.trim()              || null,
                    responsables:           r.responsables.trim()           || null,
                    periode_execution:      r.periode_execution.trim()      || null,
                    moyens_conseiller:      r.moyens_conseiller.trim()      || null,
                    moyens_op_exploitation: r.moyens_op_exploitation.trim() || null,
                }));

            if (lignes.length === 0) {
                notify('Aucune ligne à enregistrer. Renseignez au moins une contrainte ou activité.', 'warning');
                return;
            }

            await api.post('/cai/negociation-accord', { date_session: dateSession || null, lignes });
            notify(`${lignes.length} ligne(s) enregistrée(s) avec succès.`);
        } catch (err) {
            const msg = err.response?.data?.message ?? err.message ?? 'Erreur inconnue';
            notify(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const filledCount = rows.filter(r => r.contraintes_a_lever.trim() || r.activites.trim()).length;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="ml-60 flex flex-1 flex-col">
                <Header />
                <main className="flex-1 p-6 space-y-5">

                    {/* En-tête amber */}
                    <div className="rounded-2xl bg-gradient-to-r from-amber-900 to-amber-700 px-6 py-5 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-amber-200/70">
                                    CAI · Phase 1 · Étape 2
                                </p>
                                <h1 className="mt-1 text-xl font-black text-white">
                                    Négociation de l'accord CAI
                                </h1>
                                <p className="mt-0.5 text-sm text-amber-200/80">
                                    CTS-PV/AE et CAM
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {filledCount > 0 && (
                                    <div className="rounded-xl bg-white/10 px-4 py-2 text-center">
                                        <p className="text-2xl font-black text-white">{filledCount}</p>
                                        <p className="text-xs font-semibold text-amber-200/80">ligne{filledCount > 1 ? 's' : ''}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Date de session */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                            Date de la session
                        </label>
                        <input
                            type="date"
                            value={dateSession}
                            onChange={e => setDateSession(e.target.value)}
                            className="w-full max-w-xs rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                        />
                    </div>

                    {/* Badge Tableau */}
                    <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5">
                        <svg className="size-4 text-amber-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
                        </svg>
                        <span className="text-xs font-bold text-amber-900">
                            Étape 2 : Négociation de l'accord CAI (CTS-PV/AE et CAM)
                        </span>
                    </div>

                    {/* Tableau */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
                            <svg className="size-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                            </svg>
                            Chargement…
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-amber-50 border-b border-amber-100">
                                            <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-amber-800 w-14">N°</th>
                                            <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-amber-800 min-w-[180px]">Contraintes à lever</th>
                                            <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-amber-800 min-w-[180px]">Activités</th>
                                            <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-amber-800 min-w-[130px]">Responsables</th>
                                            <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-amber-800 min-w-[130px]">Période d'exécution</th>
                                            <th colSpan={2} className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-amber-800">Moyens</th>
                                            <th className="px-2 py-3 w-10"></th>
                                        </tr>
                                        <tr className="bg-amber-50/50 border-b border-amber-100">
                                            <th colSpan={5}></th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-amber-700 min-w-[130px] border-l border-amber-100">Conseiller</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-amber-700 min-w-[130px] border-l border-amber-100">OP/Exploitation</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {rows.map((row, idx) => (
                                            <tr key={row._id} className="group hover:bg-amber-50/30 transition-colors">
                                                <td className="px-2 py-1.5">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={row.numero}
                                                        onChange={e => updateRow(row._id, 'numero', e.target.value)}
                                                        placeholder={idx + 1}
                                                        className="w-12 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-center text-sm font-bold text-amber-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-100"
                                                    />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <textarea
                                                        value={row.contraintes_a_lever}
                                                        onChange={e => updateRow(row._id, 'contraintes_a_lever', e.target.value)}
                                                        placeholder="Contrainte…"
                                                        rows={2}
                                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-100 resize-none"
                                                    />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <textarea
                                                        value={row.activites}
                                                        onChange={e => updateRow(row._id, 'activites', e.target.value)}
                                                        placeholder="Activité…"
                                                        rows={2}
                                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-100 resize-none"
                                                    />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <input
                                                        type="text"
                                                        value={row.responsables}
                                                        onChange={e => updateRow(row._id, 'responsables', e.target.value)}
                                                        placeholder="Responsable(s)"
                                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-100"
                                                    />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <input
                                                        type="text"
                                                        value={row.periode_execution}
                                                        onChange={e => updateRow(row._id, 'periode_execution', e.target.value)}
                                                        placeholder="Ex: Jan–Mar 2026"
                                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-100"
                                                    />
                                                </td>
                                                <td className="px-2 py-1.5 border-l border-gray-50">
                                                    <input
                                                        type="text"
                                                        value={row.moyens_conseiller}
                                                        onChange={e => updateRow(row._id, 'moyens_conseiller', e.target.value)}
                                                        placeholder="Moyens conseiller"
                                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-100"
                                                    />
                                                </td>
                                                <td className="px-2 py-1.5 border-l border-gray-50">
                                                    <input
                                                        type="text"
                                                        value={row.moyens_op_exploitation}
                                                        onChange={e => updateRow(row._id, 'moyens_op_exploitation', e.target.value)}
                                                        placeholder="Moyens OP/Exploit."
                                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-100"
                                                    />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRow(row._id)}
                                                        disabled={rows.length === 1}
                                                        className="invisible group-hover:visible rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:invisible transition-all">
                                                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Ajouter ligne */}
                            <div className="border-t border-dashed border-amber-200 p-3">
                                <button
                                    type="button"
                                    onClick={addRow}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition-colors">
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                                    </svg>
                                    Ajouter une ligne
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Boutons action */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowApercu(true)}
                            className="flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-5 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-50 transition-all shadow-sm">
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Aperçu
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
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
                <ApercuModal rows={rows} dateSession={dateSession} onClose={() => setShowApercu(false)} />
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
