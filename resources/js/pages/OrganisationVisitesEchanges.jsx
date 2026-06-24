import { useEffect, useRef, useState } from 'react';
import CepSelector from '../components/CepSelector';
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
                    <textarea
                        value={val}
                        onChange={e => update(i, e.target.value)}
                        placeholder={i === 0 ? placeholder : `…`}
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
    lieu_visite:                '',
    nb_participants:            '',
    objectifs_visite:           [''],
    ce_qui_a_marche:            [''],
    ce_qui_doit_etre_ameliore:  [''],
});

/* ── Modal aperçu ────────────────────────────────────────────────────── */
function ApercuModal({ rows, onClose }) {
    const printRef = useRef(null);

    const handlePrint = () => {
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>Organisation de visites d'échanges</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 9px; margin: 10px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 3px 5px; vertical-align: top; }
                .title td { background: #f4b942; font-weight: bold; font-size: 12px; padding: 6px; text-align: center; }
                thead th { background: #f1f5f9; font-weight: bold; font-size: 8px; text-transform: uppercase; }
                ul { margin: 2px 0; padding-left: 12px; }
                li { margin-bottom: 1px; }
            </style></head><body>${printRef.current.innerHTML}</body></html>`);
        win.document.close();
        win.print();
    };

    const filled = rows.filter(r => r.date || r.lieu_visite || r.objectifs_visite?.some(v => v.trim()));
    const renderList = (arr) => {
        const items = (Array.isArray(arr) ? arr : []).filter(v => v?.trim());
        if (!items.length) return '';
        return items.length === 1
            ? items[0]
            : `<ul>${items.map(v => `<li>${v}</li>`).join('')}</ul>`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6">
                <div className="flex items-center justify-between bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <h2 className="text-base font-bold text-white">Aperçu — Organisation de visites d'échanges</h2>
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
                            <tr className="title"><td colSpan={6}>Organisation de visites d'échanges</td></tr>
                            <tr>
                                {['Date','Lieu visité','Nb. Participants','Objectifs de la visite','Ce qui a marché','Ce qui doit être amélioré'].map((h, i) => (
                                    <th key={i} className="border border-black px-2 py-2" style={{minWidth: i >= 3 ? 130 : 70}}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(filled.length > 0 ? filled : Array.from({length: 5}).map(() => ({}))).map((r, i) => (
                                <tr key={r._id ?? i}>
                                    <td className="border border-black px-2 py-3 text-center">{r.date ?? ''}</td>
                                    <td className="border border-black px-2 py-3">{r.lieu_visite ?? ''}</td>
                                    <td className="border border-black px-2 py-3 text-center">{r.nb_participants ?? ''}</td>
                                    <td className="border border-black px-2 py-3"
                                        dangerouslySetInnerHTML={{__html: renderList(r.objectifs_visite)}} />
                                    <td className="border border-black px-2 py-3"
                                        dangerouslySetInnerHTML={{__html: renderList(r.ce_qui_a_marche)}} />
                                    <td className="border border-black px-2 py-3"
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
export default function OrganisationVisitesEchanges() {
    const [selectedCep, setSelectedCep] = useState('');
    const [rows, setRows]               = useState([emptyRow()]);
    const [saving, setSaving]           = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [toast, setToast]             = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        const params = selectedCep ? { cep_id: selectedCep } : {};
        api.get('/api/organisation-visites-echanges', { params })
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                if (data.length === 0) { setRows([emptyRow()]); return; }
                setRows(data.map(r => ({
                    _id:                       String(r.id),
                    date:                      r.date             ?? '',
                    lieu_visite:               r.lieu_visite      ?? '',
                    nb_participants:            r.nb_participants != null ? String(r.nb_participants) : '',
                    objectifs_visite:           Array.isArray(r.objectifs_visite)          && r.objectifs_visite.length          ? r.objectifs_visite          : [''],
                    ce_qui_a_marche:            Array.isArray(r.ce_qui_a_marche)           && r.ce_qui_a_marche.length           ? r.ce_qui_a_marche           : [''],
                    ce_qui_doit_etre_ameliore:  Array.isArray(r.ce_qui_doit_etre_ameliore) && r.ce_qui_doit_etre_ameliore.length ? r.ce_qui_doit_etre_ameliore : [''],
                })));
            })
            .catch(() => {});
    }, [selectedCep]);

    const update = (idx, field, val) =>
        setRows(cur => cur.map((r, i) => i === idx ? { ...r, [field]: val } : r));
    const addRow    = () => setRows(c => [...c, emptyRow()]);
    const removeRow = (idx) => setRows(c => c.length > 1 ? c.filter((_, i) => i !== idx) : [emptyRow()]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const lignes = rows.filter(r =>
            r.date || r.lieu_visite ||
            r.objectifs_visite.some(v => v.trim()) ||
            r.ce_qui_a_marche.some(v => v.trim()) ||
            r.ce_qui_doit_etre_ameliore.some(v => v.trim())
        );
        if (lignes.length === 0) {
            setToast({ show: true, message: 'Veuillez remplir au moins une ligne.', type: 'error' });
            return;
        }
        setSaving(true);
        try {
            const res = await api.post('/api/organisation-visites-echanges', {
                cep_id: selectedCep ? Number(selectedCep) : null,
                lignes: lignes.map(r => ({
                    date:                      r.date || null,
                    lieu_visite:               r.lieu_visite.trim() || null,
                    nb_participants:            r.nb_participants !== '' ? Number(r.nb_participants) : null,
                    objectifs_visite:           r.objectifs_visite.map(v => v.trim()).filter(Boolean),
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
                <Header title="Organisation de visites d'échanges" />

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Sélecteur CEP */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                            <CepSelector value={selectedCep} onChange={setSelectedCep} required />
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                            {/* En-tête */}
                            <div className="flex items-center gap-3 bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                                <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div>
                                    <h2 className="text-base font-bold text-white">Organisation de visites d'échanges</h2>
                                    <p className="text-xs text-cyan-200/70 mt-0.5">{rows.filter(r => r.date || r.lieu_visite).length} visite(s)</p>
                                </div>
                            </div>

                            {/* Tableau */}
                            <div className="p-4 bg-slate-50/50 overflow-x-auto">
                                <table className="text-xs border-separate border-spacing-y-2" style={{minWidth: 1000}}>
                                    <thead>
                                        <tr>
                                            <th className="w-6"></th>
                                            {[
                                                {label:'Date',                       w: 120},
                                                {label:'Lieu visité',                w: 140},
                                                {label:'Nb. Participants',           w: 90},
                                                {label:'Objectifs de la visite',     w: 200},
                                                {label:'Ce qui a marché',            w: 200},
                                                {label:'Ce qui doit être amélioré',  w: 200},
                                            ].map(({label, w}, i) => (
                                                <th key={i} className="px-2 pb-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400" style={{minWidth: w}}>
                                                    {label}
                                                </th>
                                            ))}
                                            <th className="w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, idx) => (
                                            <tr key={row._id} className="group align-top">
                                                <td className="pt-2 pr-1 text-center">
                                                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500">{idx + 1}</span>
                                                </td>

                                                {/* Date */}
                                                <td className="px-0.5">
                                                    <input type="date" value={row.date}
                                                        onChange={e => update(idx, 'date', e.target.value)}
                                                        className={iCls} />
                                                </td>

                                                {/* Lieu visité */}
                                                <td className="px-0.5">
                                                    <input value={row.lieu_visite}
                                                        onChange={e => update(idx, 'lieu_visite', e.target.value)}
                                                        placeholder="Lieu…"
                                                        className={iCls} />
                                                </td>

                                                {/* Nb participants */}
                                                <td className="px-0.5">
                                                    <input type="number" min="0" value={row.nb_participants}
                                                        onChange={e => update(idx, 'nb_participants', e.target.value)}
                                                        placeholder="0"
                                                        className={nCls} />
                                                </td>

                                                {/* Objectifs — multiple */}
                                                <td className="px-0.5">
                                                    <MultiInput
                                                        values={row.objectifs_visite}
                                                        onChange={v => update(idx, 'objectifs_visite', v)}
                                                        placeholder="Objectif de la visite…" />
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
                                    Ajouter une visite
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
