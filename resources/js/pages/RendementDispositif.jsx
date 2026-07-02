import { useCallback, useEffect, useRef, useState } from 'react';
import CepSelector from '../components/CepSelector';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import api from '../services/api';

const emptyRow = () => ({
    _id:                           Math.random().toString(36).slice(2),
    commune_id:                    '',
    arrondissement_id:             '',
    village:                       '',
    nom_producteur:                '',
    culture_technologie:           '',
    rendement_annee_n1:            '',
    rendement_annee_n_technologie: '',
    rendement_annee_n_temoin:      '',
});

/* ── Modal aperçu ────────────────────────────────────────────────────── */
function ApercuModal({ rows, communes, arrCache, onClose }) {
    const printRef = useRef(null);

    const handlePrint = () => {
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>Rendement Dispositif</title>
            <style>
                body{font-family:Arial,sans-serif;font-size:8px;margin:8px}
                table{border-collapse:collapse;width:100%}
                th,td{border:1px solid #000;padding:3px 5px;vertical-align:top}
                .title td{background:#f4b942;font-weight:bold;font-size:11px;padding:6px;text-align:center}
                .grph{background:#d4e8d4;font-weight:bold;text-align:center;font-size:8px}
                thead th{background:#f1f5f9;font-weight:bold;font-size:7.5px;text-transform:uppercase}
            </style></head><body>${printRef.current.innerHTML}</body></html>`);
        win.document.close();
        win.print();
    };

    const getCommuneName = (id) => communes.find(c => String(c.id) === String(id))?.nom ?? '';
    const getArrName     = (cId, aId) => (arrCache[cId] ?? []).find(a => String(a.id) === String(aId))?.nom ?? '';

    const filled = rows.filter(r => r.commune_id || r.nom_producteur || r.culture_technologie);

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6">
                <div className="flex items-center justify-between bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <h2 className="text-base font-bold text-white">Aperçu — Rendement Dispositif</h2>
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
                            <tr className="title"><td colSpan={8}>Rendement Dispositif</td></tr>
                            <tr>
                                <th rowSpan={2} className="border border-black px-1 py-1" style={{minWidth:70}}>Commune</th>
                                <th rowSpan={2} className="border border-black px-1 py-1" style={{minWidth:80}}>Arrondissement</th>
                                <th rowSpan={2} className="border border-black px-1 py-1" style={{minWidth:60}}>Village</th>
                                <th rowSpan={2} className="border border-black px-1 py-1" style={{minWidth:120}}>Nom et prénoms du Producteur porteur de l'UD</th>
                                <th rowSpan={2} className="border border-black px-1 py-1" style={{minWidth:90}}>Culture / Technologie</th>
                                <th colSpan={3} className="border border-black px-1 py-1 grph">Rendement Dispositif</th>
                            </tr>
                            <tr>
                                <th className="border border-black px-1 py-1 grph" style={{minWidth:70}}>Année n-1</th>
                                <th className="border border-black px-1 py-1 grph" style={{minWidth:90}}>Année n avec technologie</th>
                                <th className="border border-black px-1 py-1 grph" style={{minWidth:80}}>Année n parcelle témoin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(filled.length > 0 ? filled : Array.from({length: 5}).map(() => ({}))).map((r, i) => (
                                <tr key={r._id ?? i}>
                                    <td className="border border-black px-1 py-4 text-left">{r.commune_id ? getCommuneName(r.commune_id) : ''}</td>
                                    <td className="border border-black px-1 py-4 text-left">{r.arrondissement_id ? getArrName(r.commune_id, r.arrondissement_id) : ''}</td>
                                    <td className="border border-black px-1 py-4 text-left">{r.village ?? ''}</td>
                                    <td className="border border-black px-1 py-4 text-left">{r.nom_producteur ?? ''}</td>
                                    <td className="border border-black px-1 py-4 text-left">{r.culture_technologie ?? ''}</td>
                                    <td className="border border-black px-1 py-4 text-center">{r.rendement_annee_n1 ?? ''}</td>
                                    <td className="border border-black px-1 py-4 text-center">{r.rendement_annee_n_technologie ?? ''}</td>
                                    <td className="border border-black px-1 py-4 text-center">{r.rendement_annee_n_temoin ?? ''}</td>
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
export default function RendementDispositifPage() {
    const [selectedCep, setSelectedCep] = useState('');
    const [rows, setRows]           = useState([emptyRow()]);
    const [communes, setCommunes]   = useState([]);
    const [arrCache, setArrCache]   = useState({});
    const [saving, setSaving]       = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [toast, setToast]         = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        api.get('/api/user/communes')
            .then(res => setCommunes(Array.isArray(res.data) ? res.data : []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        const params = selectedCep ? { cep_id: selectedCep } : {};
        api.get('/api/rendement-dispositif', { params })
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                if (data.length === 0) { setRows([emptyRow()]); return; }
                const loaded = data.map(r => ({
                        _id:                           String(r.id),
                        commune_id:                    r.commune_id        ? String(r.commune_id)        : '',
                        arrondissement_id:             r.arrondissement_id ? String(r.arrondissement_id) : '',
                        village:                       r.village           ?? '',
                        nom_producteur:                r.nom_producteur    ?? '',
                        culture_technologie:           r.culture_technologie ?? '',
                        rendement_annee_n1:            r.rendement_annee_n1            != null ? String(r.rendement_annee_n1)            : '',
                        rendement_annee_n_technologie: r.rendement_annee_n_technologie != null ? String(r.rendement_annee_n_technologie) : '',
                        rendement_annee_n_temoin:      r.rendement_annee_n_temoin      != null ? String(r.rendement_annee_n_temoin)      : '',
                    }));
                setRows(loaded);
                loaded.forEach(r => { if (r.commune_id) loadArr(r.commune_id); });
            })
            .catch(() => {});
    }, [selectedCep]);

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

    const hasContent = (r) => r.commune_id || r.nom_producteur || r.culture_technologie || r.rendement_annee_n1;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const lignes = rows.filter(hasContent);
        if (lignes.length === 0) {
            setToast({ show: true, message: 'Veuillez remplir au moins une ligne.', type: 'error' });
            return;
        }
        setSaving(true);
        try {
            const res = await api.post('/api/rendement-dispositif', {
                cep_id: selectedCep ? Number(selectedCep) : null,
                lignes: lignes.map(r => ({
                    commune_id:                    r.commune_id        ? Number(r.commune_id)        : null,
                    arrondissement_id:             r.arrondissement_id ? Number(r.arrondissement_id) : null,
                    village:                       r.village.trim()    || null,
                    nom_producteur:                r.nom_producteur.trim()      || null,
                    culture_technologie:           r.culture_technologie.trim() || null,
                    rendement_annee_n1:            r.rendement_annee_n1            !== '' ? Number(r.rendement_annee_n1)            : null,
                    rendement_annee_n_technologie: r.rendement_annee_n_technologie !== '' ? Number(r.rendement_annee_n_technologie) : null,
                    rendement_annee_n_temoin:      r.rendement_annee_n_temoin      !== '' ? Number(r.rendement_annee_n_temoin)      : null,
                })),
            });
            setToast({ show: true, message: res.data.message, type: 'success' });
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.message || 'Erreur.', type: 'error' });
        } finally { setSaving(false); }
    };

    const iCls = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all';
    const nCls = 'w-full rounded-lg border border-slate-200 bg-amber-50/40 px-2 py-1.5 text-xs text-center outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 focus:bg-white transition-all';
    const sCls = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all';

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-60">
                <Header title="Rendement Dispositif" />

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
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <div>
                                    <h2 className="text-base font-bold text-white">Rendement Dispositif</h2>
                                    <p className="text-xs text-cyan-200/70 mt-0.5">{rows.filter(hasContent).length} ligne(s)</p>
                                </div>
                            </div>

                            {/* Tableau */}
                            <div className="p-4 bg-slate-50/50 overflow-x-auto">
                                <table className="text-xs border-separate border-spacing-y-1.5" style={{minWidth: 1100}}>
                                    <thead>
                                        {/* Ligne 1 : groupe */}
                                        <tr>
                                            <th className="w-7"></th>
                                            <th colSpan={5} className="pb-0.5"></th>
                                            <th colSpan={3} className="px-2 pb-0.5 text-center text-[10px] font-bold text-amber-600 uppercase tracking-wide bg-amber-50/70 rounded-t-lg border-b border-amber-200">
                                                Rendement Dispositif
                                            </th>
                                            <th className="w-8"></th>
                                        </tr>
                                        {/* Ligne 2 : colonnes */}
                                        <tr>
                                            <th className="w-7"></th>
                                            {[
                                                {label:'Commune',               w:100},
                                                {label:'Arrondissement',        w:110},
                                                {label:'Village',               w:80},
                                                {label:"Nom & prénoms producteur (UD)", w:160},
                                                {label:'Culture / Technologie', w:120},
                                            ].map(({label, w}, i) => (
                                                <th key={i} className="px-1.5 pb-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide" style={{minWidth:w}}>{label}</th>
                                            ))}
                                            <th className="px-1.5 pb-2 text-center text-[10px] font-semibold text-amber-500 uppercase tracking-wide bg-amber-50/40" style={{minWidth:90}}>Année n-1</th>
                                            <th className="px-1.5 pb-2 text-center text-[10px] font-semibold text-amber-500 uppercase tracking-wide bg-amber-50/40" style={{minWidth:110}}>Année n + technologie</th>
                                            <th className="px-1.5 pb-2 text-center text-[10px] font-semibold text-amber-500 uppercase tracking-wide bg-amber-50/40" style={{minWidth:100}}>Année n parcelle témoin</th>
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
                                                    <input value={row.village} onChange={e => update(idx,'village',e.target.value.toUpperCase())} placeholder="Village…" className={iCls} style={{minWidth:80}} />
                                                </td>

                                                {/* Nom producteur UD */}
                                                <td className="px-0.5">
                                                    <input value={row.nom_producteur} onChange={e => update(idx,'nom_producteur',e.target.value)} placeholder="Nom et prénoms…" className={iCls} style={{minWidth:160}} />
                                                </td>

                                                {/* Culture/Technologie */}
                                                <td className="px-0.5">
                                                    <input value={row.culture_technologie} onChange={e => update(idx,'culture_technologie',e.target.value)} placeholder="Culture / Tech…" className={iCls} style={{minWidth:120}} />
                                                </td>

                                                {/* Rendement n-1 */}
                                                <td className="px-0.5">
                                                    <input type="number" min="0" step="0.01"
                                                        value={row.rendement_annee_n1}
                                                        onChange={e => update(idx,'rendement_annee_n1',e.target.value)}
                                                        placeholder="0" className={nCls} style={{minWidth:90}} />
                                                </td>

                                                {/* Rendement n + tech */}
                                                <td className="px-0.5">
                                                    <input type="number" min="0" step="0.01"
                                                        value={row.rendement_annee_n_technologie}
                                                        onChange={e => update(idx,'rendement_annee_n_technologie',e.target.value)}
                                                        placeholder="0" className={nCls} style={{minWidth:110}} />
                                                </td>

                                                {/* Rendement n témoin */}
                                                <td className="px-0.5">
                                                    <input type="number" min="0" step="0.01"
                                                        value={row.rendement_annee_n_temoin}
                                                        onChange={e => update(idx,'rendement_annee_n_temoin',e.target.value)}
                                                        placeholder="0" className={nCls} style={{minWidth:100}} />
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
                <ApercuModal rows={rows} communes={communes} arrCache={arrCache}
                    onClose={() => setShowPreview(false)} />
            )}
        </div>
    );
}
