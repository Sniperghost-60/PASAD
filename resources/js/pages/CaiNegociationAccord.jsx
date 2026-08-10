import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

/* ── Composant saisie multiple ──────────────────────────────────────── */
function MultiInput({ values, onChange, placeholder }) {
    const add    = () => onChange([...values, '']);
    const remove = (i) => onChange(values.length > 1 ? values.filter((_, idx) => idx !== i) : ['']);
    const update = (i, v) => onChange(values.map((val, idx) => idx === i ? v : val));

    return (
        <div className="space-y-1">
            {values.map((val, i) => (
                <div key={i} className="flex items-start gap-1">
                    <input type="text" value={val} onChange={e => update(i, e.target.value)}
                        placeholder={i === 0 ? placeholder : '…'}
                        className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-100" />
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

/* ── Modal aperçu / impression ───────────────────────────────────────── */
function ApercuModal({ rows, onClose }) {
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
                .dash-line { margin-bottom: 2px; }
                .dash-line:last-child { margin-bottom: 0; }
            </style></head><body>${content}</body></html>
        `);
        win.document.close();
        win.print();
    };

    const filled = rows.filter(r => r.contraintes_a_lever?.trim() || r.activites?.trim());

    const renderList = (arr) => {
        const items = (Array.isArray(arr) ? arr : [arr]).filter(v => v?.trim());
        if (!items.length) return '';
        return items.map(v => `<div class="dash-line">– ${v}</div>`).join('');
    };

    const formatPeriode = (r) => {
        const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
        if (r.periode_debut && r.periode_fin) return `Du ${fmt(r.periode_debut)} au ${fmt(r.periode_fin)}`;
        if (r.periode_debut) return `À partir du ${fmt(r.periode_debut)}`;
        if (r.periode_fin) return `Jusqu'au ${fmt(r.periode_fin)}`;
        return '';
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
                            <h2 className="text-base font-bold text-white">Aperçu — Négociation accord CAI</h2>
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
                                    <td className="border border-gray-300 px-2 py-1.5"
                                        dangerouslySetInnerHTML={{ __html: renderList(r.responsables) }} />
                                    <td className="border border-gray-300 px-2 py-1.5">{formatPeriode(r)}</td>
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
        responsables: [''],
        periode_debut: '',
        periode_fin: '',
        moyens_conseiller: '',
        moyens_op_exploitation: '',
    };
}

/* ── Modal édition ligne enregistrée ──────────────────────────────────── */
function EditLigneModal({ row, onChange, onSave, onClose, saving }) {
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6">
                <div className="flex items-center justify-between bg-gradient-to-r from-emerald-800 to-emerald-600 px-6 py-4">
                    <h2 className="text-base font-bold text-white">Modifier la ligne</h2>
                    <button type="button" onClick={onClose}
                        className="flex size-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">N°</label>
                        <input type="number" min="1" value={row.numero} onChange={e => onChange('numero', e.target.value)}
                            className="w-20 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:bg-white transition-all" />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Contraintes à lever</label>
                        <textarea value={row.contraintes_a_lever} onChange={e => onChange('contraintes_a_lever', e.target.value)}
                            rows={2}
                            className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:bg-white transition-all" />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Activités</label>
                        <textarea value={row.activites} onChange={e => onChange('activites', e.target.value)}
                            rows={2}
                            className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:bg-white transition-all" />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Responsables</label>
                        <MultiInput values={row.responsables} onChange={val => onChange('responsables', val)} placeholder="Responsable(s)" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Début</label>
                            <input type="date" value={row.periode_debut} onChange={e => onChange('periode_debut', e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:bg-white transition-all" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Fin</label>
                            <input type="date" value={row.periode_fin} onChange={e => onChange('periode_fin', e.target.value)}
                                min={row.periode_debut || undefined}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:bg-white transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Moyens — Conseiller</label>
                            <input type="text" value={row.moyens_conseiller} onChange={e => onChange('moyens_conseiller', e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:bg-white transition-all" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Moyens — OP/Exploitation</label>
                            <input type="text" value={row.moyens_op_exploitation} onChange={e => onChange('moyens_op_exploitation', e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:bg-white transition-all" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
                    <button type="button" onClick={onClose}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
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
export default function CaiNegociationAccord() {
    const { communeId } = useAuth();
    const [rows, setRows]                 = useState([emptyRow()]);
    const [savedRows, setSavedRows]       = useState([]);
    const [loadingSaved, setLoadingSaved] = useState(true);
    const [saving, setSaving]             = useState(false);
    const [showApercu, setShowApercu]     = useState(false);
    const [toast, setToast]               = useState({ show: false, message: '', type: 'success' });
    const [editingRow, setEditingRow]     = useState(null);
    const [savingEdit, setSavingEdit]     = useState(false);

    const notify = (message, type = 'success') => setToast({ show: true, message, type });

    const loadSaved = useCallback(async () => {
        try {
            const res = await api.get('/api/cai/negociation-accord', { params: communeId ? { commune_id: communeId } : {} });
            setSavedRows(Array.isArray(res.data) ? res.data : []);
        } catch {
            setSavedRows([]);
        } finally {
            setLoadingSaved(false);
        }
    }, [communeId]);

    useEffect(() => { loadSaved(); }, [loadSaved]);

    const startEdit = (row) => setEditingRow({
        id:                     row.id,
        numero:                 row.numero ?? '',
        contraintes_a_lever:    row.contraintes_a_lever ?? '',
        activites:              row.activites ?? '',
        responsables:           row.responsables?.length ? row.responsables : [''],
        periode_debut:          row.periode_debut ?? '',
        periode_fin:            row.periode_fin ?? '',
        moyens_conseiller:      row.moyens_conseiller ?? '',
        moyens_op_exploitation: row.moyens_op_exploitation ?? '',
    });

    const updateEditingRow = (field, value) => setEditingRow(r => ({ ...r, [field]: value }));

    const handleUpdate = async () => {
        setSavingEdit(true);
        try {
            const payload = {
                numero:                 editingRow.numero !== '' ? Number(editingRow.numero) : null,
                contraintes_a_lever:    editingRow.contraintes_a_lever.trim()    || null,
                activites:              editingRow.activites.trim()              || null,
                responsables:           editingRow.responsables.map(v => v.trim()).filter(Boolean),
                periode_debut:          editingRow.periode_debut || null,
                periode_fin:            editingRow.periode_fin   || null,
                moyens_conseiller:      editingRow.moyens_conseiller.trim()      || null,
                moyens_op_exploitation: editingRow.moyens_op_exploitation.trim() || null,
            };
            const res = await api.put(`/api/cai/negociation-accord/${editingRow.id}`, payload);
            setSavedRows(prev => prev.map(r => r.id === editingRow.id ? res.data.data : r));
            notify('Ligne mise à jour avec succès !');
            setEditingRow(null);
        } catch (err) {
            const msg = err.response?.data?.message ?? err.message ?? 'Erreur lors de la mise à jour.';
            notify(msg, 'error');
        } finally {
            setSavingEdit(false);
        }
    };

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
                    responsables:           r.responsables.map(v => v.trim()).filter(Boolean),
                    periode_debut:          r.periode_debut || null,
                    periode_fin:            r.periode_fin   || null,
                    moyens_conseiller:      r.moyens_conseiller.trim()      || null,
                    moyens_op_exploitation: r.moyens_op_exploitation.trim() || null,
                }));

            if (lignes.length === 0) {
                notify('Aucune ligne à enregistrer. Renseignez au moins une contrainte ou activité.', 'warning');
                return;
            }

            await api.post('/api/cai/negociation-accord', {
                lignes: lignes.map(ligne => ({ ...ligne, commune_id: communeId })),
            });
            notify(`${lignes.length} ligne(s) enregistrée(s) avec succès.`);
            setRows([emptyRow()]);
            loadSaved();
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
                    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-amber-50 border-b border-amber-100">
                                        <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-amber-800 w-14">N°</th>
                                        <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-amber-800 min-w-[180px]">Contraintes à lever</th>
                                        <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-amber-800 min-w-[180px]">Activités</th>
                                        <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-amber-800 min-w-[150px]">Responsables</th>
                                        <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-amber-800 min-w-[190px]">Période d'exécution</th>
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
                                                <MultiInput
                                                    values={row.responsables}
                                                    onChange={val => updateRow(row._id, 'responsables', val)}
                                                    placeholder="Responsable(s)"
                                                />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1">
                                                        <span className="w-9 text-[10px] font-semibold uppercase text-gray-400">Début</span>
                                                        <input
                                                            type="date"
                                                            value={row.periode_debut}
                                                            onChange={e => updateRow(row._id, 'periode_debut', e.target.value)}
                                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-700 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-100"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="w-9 text-[10px] font-semibold uppercase text-gray-400">Fin</span>
                                                        <input
                                                            type="date"
                                                            value={row.periode_fin}
                                                            onChange={e => updateRow(row._id, 'periode_fin', e.target.value)}
                                                            min={row.periode_debut || undefined}
                                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-700 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-100"
                                                        />
                                                    </div>
                                                </div>
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

                    {/* Lignes déjà enregistrées */}
                    {loadingSaved ? (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <svg className="size-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                            Chargement des lignes déjà enregistrées…
                        </div>
                    ) : savedRows.length > 0 && (
                        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                            <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-white px-5 py-3.5 border-b border-gray-100">
                                <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                    <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800">Lignes déjà enregistrées</h2>
                                    <p className="text-xs text-gray-400">{savedRows.length} ligne{savedRows.length > 1 ? 's' : ''} au total</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-50/80">
                                            <th className="px-4 py-2.5 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider w-10">N°</th>
                                            <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contraintes / Activités</th>
                                            <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Responsables</th>
                                            <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Période</th>
                                            <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Moyens</th>
                                            <th className="px-4 py-2.5 w-10" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {savedRows.map((row, i) => {
                                            const responsables = Array.isArray(row.responsables) ? row.responsables.filter(Boolean) : [];
                                            const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
                                            let periode = '—';
                                            if (row.periode_debut && row.periode_fin) periode = `Du ${fmt(row.periode_debut)} au ${fmt(row.periode_fin)}`;
                                            else if (row.periode_debut) periode = `À partir du ${fmt(row.periode_debut)}`;
                                            else if (row.periode_fin) periode = `Jusqu'au ${fmt(row.periode_fin)}`;
                                            return (
                                                <tr key={row.id ?? i} className="odd:bg-white even:bg-gray-50/40 hover:bg-emerald-50/40 transition-colors">
                                                    <td className="px-4 py-3 text-center text-xs font-bold text-gray-300">{row.numero ?? i + 1}</td>
                                                    <td className="px-4 py-3">
                                                        {row.contraintes_a_lever && <div className="font-medium text-gray-700">{row.contraintes_a_lever}</div>}
                                                        {row.activites && <div className="text-xs text-gray-400 mt-0.5">{row.activites}</div>}
                                                        {!row.contraintes_a_lever && !row.activites && <span className="text-gray-300">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {responsables.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {responsables.map((r, ri) => (
                                                                    <span key={ri} className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                                                                        {r}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : <span className="text-gray-300">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">{periode}</td>
                                                    <td className="px-4 py-3 text-gray-600">
                                                        {[row.moyens_conseiller, row.moyens_op_exploitation].filter(Boolean).join(' · ') || <span className="text-gray-300">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button type="button" onClick={() => startEdit(row)}
                                                            title="Modifier"
                                                            className="flex size-7 items-center justify-center rounded-lg text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
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
                <ApercuModal rows={rows} onClose={() => setShowApercu(false)} />
            )}
            {editingRow && (
                <EditLigneModal
                    row={editingRow}
                    onChange={updateEditingRow}
                    onSave={handleUpdate}
                    onClose={() => setEditingRow(null)}
                    saving={savingEdit}
                />
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
