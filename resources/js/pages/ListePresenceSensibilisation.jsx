import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import api from '../services/api';

/* ── Modal aperçu ────────────────────────────────────────────────────── */
function ApercuModal({ rows, departements, communeCache, arrCache, dateSession, onClose }) {
    const printRef = useRef(null);

    const getName = (list, id) => list.find(i => String(i.id) === String(id))?.nom ?? '—';

    const handlePrint = () => {
        const content = printRef.current.innerHTML;
        const win = window.open('', '_blank');
        win.document.write(`
            <html><head><title>Liste de présence</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
                .title-row td { background: #8BCF45; font-weight: bold; text-align: center; font-size: 12px; }
                .header-row th { font-weight: bold; font-size: 10px; text-transform: uppercase; }
                .sexe-cell { text-align: center; }
            </style></head><body>${content}</body></html>
        `);
        win.document.close();
        win.print();
    };

    const filled = rows.filter(r => r.nom_producteur?.trim());

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6">

                {/* En-tête modal */}
                <div className="flex items-center justify-between bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <div>
                            <h2 className="text-base font-bold text-white">Aperçu de la liste</h2>
                            {dateSession && <p className="text-xs text-cyan-200/70 mt-0.5">Session du {new Date(dateSession).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>}
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

                {/* Tableau aperçu */}
                <div className="p-6 overflow-x-auto" ref={printRef}>
                    <table className="w-full border-collapse text-xs" style={{ borderColor: '#000' }}>
                        {/* Titre */}
                        <thead>
                            <tr>
                                <td colSpan={9}
                                    className="border border-black bg-[#8BCF45] py-2 text-center text-sm font-bold text-slate-900">
                                    Liste de présence des acteurs à la sensibilisation
                                </td>
                            </tr>
                            {/* En-têtes colonnes */}
                            <tr className="bg-white">
                                {[
                                    'DÉPARTEMENT',
                                    'COMMUNE',
                                    'ARRONDISSEMENT',
                                    'VILLAGE',
                                    'NOM DU\nPRODUCTEUR',
                                    'PRÉNOMS DU\nPRODUCTEUR',
                                    'CONTACT 1\nDU PRODUCTEUR',
                                    'CONTACT 2\nDU PRODUCTEUR',
                                    'SEXE',
                                ].map((col, i) => (
                                    <th key={i} className="border border-black px-2 py-2 text-left align-top text-[11px] font-bold uppercase leading-tight" style={{ minWidth: i >= 4 ? 90 : 80 }}>
                                        {col.split('\n').map((line, j) => <span key={j} className="block">{line}</span>)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filled.length > 0 ? filled.map((row, i) => (
                                <tr key={row._id ?? i} className="hover:bg-slate-50">
                                    <td className="border border-black px-2 py-2 align-top">{row.departement_id ? getName(departements, row.departement_id) : ''}</td>
                                    <td className="border border-black px-2 py-2 align-top">{row.commune_id ? getName(communeCache[row.departement_id] ?? [], row.commune_id) : ''}</td>
                                    <td className="border border-black px-2 py-2 align-top">{row.arrondissement_id ? getName(arrCache[row.commune_id] ?? [], row.arrondissement_id) : ''}</td>
                                    <td className="border border-black px-2 py-2 align-top">{row.village}</td>
                                    <td className="border border-black px-2 py-2 align-top font-medium">{row.nom_producteur}</td>
                                    <td className="border border-black px-2 py-2 align-top">{row.prenoms_producteur}</td>
                                    <td className="border border-black px-2 py-2 align-top">{row.contact1_producteur}</td>
                                    <td className="border border-black px-2 py-2 align-top">{row.contact2_producteur}</td>
                                    <td className="border border-black px-2 py-2 text-center align-top font-bold">
                                        <span className={row.sexe === 'M' ? 'text-blue-700' : 'text-pink-700'}>{row.sexe}</span>
                                    </td>
                                </tr>
                            )) : (
                                /* Lignes vides si aucun participant */
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <td key={j} className="border border-black px-2 py-4" />
                                        ))}
                                        <td className="border border-black px-2 py-1 text-center text-[10px] font-bold leading-5 text-slate-500">
                                            <div>M</div><div>F</div>
                                        </td>
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

const emptyRow = () => ({
    _id: Math.random().toString(36).slice(2),
    departement_id: '',
    commune_id: '',
    arrondissement_id: '',
    village: '',
    nom_producteur: '',
    prenoms_producteur: '',
    contact1_producteur: '',
    contact2_producteur: '',
    sexe: 'M',
});

export default function ListePresenceSensibilisation() {
    const [dateSession, setDateSession]   = useState('');
    const [departements, setDepartements] = useState([]);
    const [communeCache, setCommuneCache] = useState({});
    const [arrCache, setArrCache]         = useState({});
    const [rows, setRows]                 = useState([emptyRow()]);
    const [loadingDepts, setLoadingDepts] = useState(true);
    const [loadingRows, setLoadingRows]   = useState(false);
    const [saving, setSaving]             = useState(false);
    const [errors, setErrors]             = useState({});
    const [showPreview, setShowPreview]   = useState(false);
    const [toast, setToast]               = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        api.get('/api/departements')
            .then(res => setDepartements(Array.isArray(res.data) ? res.data : []))
            .catch(() => {})
            .finally(() => setLoadingDepts(false));
    }, []);

    useEffect(() => {
        if (!dateSession) { setRows([emptyRow()]); setErrors({}); return; }
        loadData(dateSession);
    }, [dateSession]);

    const loadData = async (date) => {
        setLoadingRows(true);
        setErrors({});
        try {
            const res  = await api.get(`/api/liste-presence-sensibilisation?date_session=${date}`);
            const data = Array.isArray(res.data) ? res.data : [];

            const deptIds    = [...new Set(data.map(r => r.departement_id).filter(Boolean))];
            const communeIds = [...new Set(data.map(r => r.commune_id).filter(Boolean))];

            const [comEntries, arrEntries] = await Promise.all([
                Promise.all(deptIds.filter(id => !communeCache[id]).map(id =>
                    api.get(`/api/departements/${id}/communes`).then(r => [id, r.data]).catch(() => [id, []])
                )),
                Promise.all(communeIds.filter(id => !arrCache[id]).map(id =>
                    api.get(`/api/communes/${id}/arrondissements`).then(r => [id, r.data]).catch(() => [id, []])
                )),
            ]);

            if (comEntries.length) setCommuneCache(prev => ({ ...prev, ...Object.fromEntries(comEntries) }));
            if (arrEntries.length) setArrCache(prev => ({ ...prev, ...Object.fromEntries(arrEntries) }));

            setRows(data.length
                ? data.map(r => ({
                    _id: String(r.id),
                    departement_id:     String(r.departement_id ?? ''),
                    commune_id:         String(r.commune_id ?? ''),
                    arrondissement_id:  String(r.arrondissement_id ?? ''),
                    village:            r.village ?? '',
                    nom_producteur:     r.nom_producteur ?? '',
                    prenoms_producteur:  r.prenoms_producteur ?? '',
                    contact1_producteur: r.contact1_producteur ?? '',
                    contact2_producteur: r.contact2_producteur ?? '',
                    sexe: r.sexe ?? 'M',
                }))
                : [emptyRow()]);
        } catch {
            setRows([emptyRow()]);
        } finally {
            setLoadingRows(false);
        }
    };

    const handleLoadCommunes = useCallback(async (deptId) => {
        if (communeCache[deptId]) return;
        try {
            const res = await api.get(`/api/departements/${deptId}/communes`);
            setCommuneCache(prev => ({ ...prev, [deptId]: Array.isArray(res.data) ? res.data : [] }));
        } catch {}
    }, [communeCache]);

    const handleLoadArr = useCallback(async (communeId) => {
        if (arrCache[communeId]) return;
        try {
            const res = await api.get(`/api/communes/${communeId}/arrondissements`);
            setArrCache(prev => ({ ...prev, [communeId]: Array.isArray(res.data) ? res.data : [] }));
        } catch {}
    }, [arrCache]);

    const updateRow = (index, field, value) =>
        setRows(current => current.map((r, i) => i === index ? { ...r, [field]: value } : r));

    const addRow    = () => setRows(c => [...c, emptyRow()]);
    const removeRow = (index) => setRows(c => c.length > 1 ? c.filter((_, i) => i !== index) : [emptyRow()]);

    const validate = () => {
        const next = {};
        rows.forEach((r, i) => { if (!r.nom_producteur.trim()) next[`nom_${i}`] = true; });
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const participants = rows.filter(r => r.nom_producteur.trim()).map(r => ({
            departement_id:      r.departement_id    ? Number(r.departement_id)    : null,
            commune_id:          r.commune_id        ? Number(r.commune_id)        : null,
            arrondissement_id:   r.arrondissement_id ? Number(r.arrondissement_id) : null,
            village:             r.village.trim()    || null,
            nom_producteur:      r.nom_producteur.trim(),
            prenoms_producteur:  r.prenoms_producteur.trim()   || null,
            contact1_producteur: r.contact1_producteur.trim()  || null,
            contact2_producteur: r.contact2_producteur.trim()  || null,
            sexe: r.sexe,
        }));

        setSaving(true);
        try {
            await api.post('/api/liste-presence-sensibilisation', {
                date_session: dateSession || null,
                participants,
            });
            setToast({ show: true, message: `${participants.length} participant(s) enregistré(s) !`, type: 'success' });
            if (dateSession) loadData(dateSession);
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.message || 'Une erreur est survenue.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const nbH = rows.filter(r => r.sexe === 'M' && r.nom_producteur.trim()).length;
    const nbF = rows.filter(r => r.sexe === 'F' && r.nom_producteur.trim()).length;

    const selectCls = (err = false) =>
        `w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-teal-100 transition-all ${err ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-400 focus:bg-white'}`;

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-60">
                <Header title="Liste de présence — Sensibilisation" />

                <div className="p-6 space-y-5">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* ── Carte session ───────────────────────────────── */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="flex items-center gap-3 bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                                <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <div>
                                    <h2 className="text-base font-bold text-white">Session de sensibilisation</h2>
                                    <p className="text-xs text-cyan-200/70 mt-0.5">Indiquez la date de la session pour retrouver ou créer une liste</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-end gap-6 p-6">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Date de la session</label>
                                    <input type="date" value={dateSession}
                                        onChange={e => setDateSession(e.target.value)}
                                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all" />
                                </div>

                                {(nbH + nbF) > 0 && (
                                    <div className="flex gap-2 pb-0.5">
                                        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5">
                                            <span className="text-xs font-semibold text-blue-600">Hommes</span>
                                            <span className="text-lg font-extrabold text-blue-800">{nbH}</span>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 px-4 py-2.5">
                                            <span className="text-xs font-semibold text-pink-600">Femmes</span>
                                            <span className="text-lg font-extrabold text-pink-800">{nbF}</span>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5">
                                            <span className="text-xs font-semibold text-slate-500">Total</span>
                                            <span className="text-lg font-extrabold text-slate-800">{nbH + nbF}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Carte participants (tableau) ─────────────────── */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="flex items-center gap-3 bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                                <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div className="flex-1">
                                    <h2 className="text-base font-bold text-white">Liste de présence des acteurs à la sensibilisation</h2>
                                    <p className="text-xs text-cyan-200/70 mt-0.5">Chaque participant peut provenir d'une localisation différente</p>
                                </div>
                                <span className="rounded-full bg-teal-500/30 border border-teal-400/40 px-3 py-0.5 text-xs font-bold text-cyan-200">
                                    {rows.filter(r => r.nom_producteur.trim()).length} participant(s)
                                </span>
                            </div>

                            <div className="p-5 bg-slate-50/50 space-y-4">
                                {loadingDepts || loadingRows ? (
                                    <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
                                        <svg className="size-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        <span className="text-sm">Chargement...</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                    <tr className="bg-[#062824]/8 border-b border-slate-200">
                                                        <th className="w-8 px-3 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wide">#</th>
                                                        <th className="px-3 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">Département</th>
                                                        <th className="px-3 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">Commune</th>
                                                        <th className="px-3 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">Arrondissement</th>
                                                        <th className="px-3 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">Village</th>
                                                        <th className="px-3 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                                            <span className="text-red-400">*</span> Nom du producteur
                                                        </th>
                                                        <th className="px-3 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">Prénoms du producteur</th>
                                                        <th className="px-3 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">Contact 1</th>
                                                        <th className="px-3 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">Contact 2</th>
                                                        <th className="w-20 px-3 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                                            <span className="text-red-400">*</span> Sexe
                                                        </th>
                                                        <th className="w-8 px-2 py-3" />
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white">
                                                    {rows.map((row, index) => (
                                                        <tr key={row._id} className="hover:bg-slate-50 transition-colors">
                                                            {/* # */}
                                                            <td className="px-3 py-2 text-center text-xs font-bold text-slate-400">{index + 1}</td>

                                                            {/* Département */}
                                                            <td className="px-2 py-2 min-w-[130px]">
                                                                <select value={row.departement_id}
                                                                    onChange={e => {
                                                                        const val = e.target.value;
                                                                        updateRow(index, 'departement_id', val);
                                                                        updateRow(index, 'commune_id', '');
                                                                        updateRow(index, 'arrondissement_id', '');
                                                                        if (val) handleLoadCommunes(val);
                                                                    }}
                                                                    className={selectCls()}>
                                                                    <option value="">—</option>
                                                                    {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                                                                </select>
                                                            </td>

                                                            {/* Commune */}
                                                            <td className="px-2 py-2 min-w-[130px]">
                                                                <select value={row.commune_id}
                                                                    disabled={!row.departement_id}
                                                                    onChange={e => {
                                                                        const val = e.target.value;
                                                                        updateRow(index, 'commune_id', val);
                                                                        updateRow(index, 'arrondissement_id', '');
                                                                        if (val) handleLoadArr(val);
                                                                    }}
                                                                    className={`${selectCls()} disabled:opacity-40 disabled:cursor-not-allowed`}>
                                                                    <option value="">—</option>
                                                                    {(communeCache[row.departement_id] ?? []).map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                                                                </select>
                                                            </td>

                                                            {/* Arrondissement */}
                                                            <td className="px-2 py-2 min-w-[130px]">
                                                                <select value={row.arrondissement_id}
                                                                    disabled={!row.commune_id}
                                                                    onChange={e => updateRow(index, 'arrondissement_id', e.target.value)}
                                                                    className={`${selectCls()} disabled:opacity-40 disabled:cursor-not-allowed`}>
                                                                    <option value="">—</option>
                                                                    {(arrCache[row.commune_id] ?? []).map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                                                                </select>
                                                            </td>

                                                            {/* Village */}
                                                            <td className="px-2 py-2 min-w-[110px]">
                                                                <input type="text" value={row.village}
                                                                    onChange={e => updateRow(index, 'village', e.target.value.toUpperCase())}
                                                                    placeholder="Village"
                                                                    className={selectCls()} />
                                                            </td>

                                                            {/* Nom */}
                                                            <td className="px-2 py-2 min-w-[140px]">
                                                                <input type="text" value={row.nom_producteur}
                                                                    onChange={e => updateRow(index, 'nom_producteur', e.target.value)}
                                                                    placeholder="Nom"
                                                                    className={selectCls(errors[`nom_${index}`])} />
                                                                {errors[`nom_${index}`] && <p className="mt-0.5 text-[10px] text-red-500">Requis</p>}
                                                            </td>

                                                            {/* Prénoms */}
                                                            <td className="px-2 py-2 min-w-[140px]">
                                                                <input type="text" value={row.prenoms_producteur}
                                                                    onChange={e => updateRow(index, 'prenoms_producteur', e.target.value)}
                                                                    placeholder="Prénoms"
                                                                    className={selectCls()} />
                                                            </td>

                                                            {/* Contact 1 */}
                                                            <td className="px-2 py-2 min-w-[110px]">
                                                                <input type="tel" value={row.contact1_producteur}
                                                                    onChange={e => updateRow(index, 'contact1_producteur', e.target.value)}
                                                                    placeholder="Contact 1"
                                                                    className={selectCls()} />
                                                            </td>

                                                            {/* Contact 2 */}
                                                            <td className="px-2 py-2 min-w-[110px]">
                                                                <input type="tel" value={row.contact2_producteur}
                                                                    onChange={e => updateRow(index, 'contact2_producteur', e.target.value)}
                                                                    placeholder="Contact 2"
                                                                    className={selectCls()} />
                                                            </td>

                                                            {/* Sexe */}
                                                            <td className="px-2 py-2">
                                                                <div className="flex items-center justify-center gap-1.5">
                                                                    {['M', 'F'].map(s => (
                                                                        <label key={s} className={`flex size-8 cursor-pointer items-center justify-center rounded-lg border-2 text-xs font-bold transition-all ${
                                                                            row.sexe === s
                                                                                ? s === 'M' ? 'border-blue-400 bg-blue-100 text-blue-700' : 'border-pink-400 bg-pink-100 text-pink-700'
                                                                                : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                                                                        }`}>
                                                                            <input type="radio" name={`sexe_${row._id}`} value={s}
                                                                                checked={row.sexe === s}
                                                                                onChange={() => updateRow(index, 'sexe', s)}
                                                                                className="sr-only" />
                                                                            {s}
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </td>

                                                            {/* Supprimer */}
                                                            <td className="px-2 py-2 text-center">
                                                                <button type="button" onClick={() => removeRow(index)}
                                                                    className="inline-flex size-7 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                                                                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Ajouter une ligne */}
                                        <button type="button" onClick={addRow}
                                            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-teal-300 py-3 text-sm font-semibold text-teal-600 hover:border-teal-400 hover:bg-teal-50 transition-all">
                                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                            Ajouter un participant
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4">
                                {/* Bouton aperçu à gauche */}
                                <button type="button" onClick={() => setShowPreview(true)}
                                    className="flex items-center gap-2 rounded-xl border-2 border-[#062824] bg-white px-5 py-2.5 text-sm font-semibold text-[#062824] hover:bg-[#062824]/5 transition-colors">
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Aperçu de la liste
                                </button>

                                <div className="flex items-center gap-3">
                                <button type="button"
                                    onClick={() => { setRows([emptyRow()]); setErrors({}); }}
                                    disabled={saving}
                                    className="px-5 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                                    Réinitialiser
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                    {saving && (
                                        <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                    )}
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Enregistrer {rows.filter(r => r.nom_producteur.trim()).length > 0
                                        ? `(${rows.filter(r => r.nom_producteur.trim()).length} participant(s))`
                                        : ''}
                                </button>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                <ModernNotification show={toast.show} message={toast.message} type={toast.type}
                    onClose={() => setToast(t => ({ ...t, show: false }))} />
            </main>

            {/* Modal aperçu */}
            {showPreview && (
                <ApercuModal
                    rows={rows}
                    departements={departements}
                    communeCache={communeCache}
                    arrCache={arrCache}
                    dateSession={dateSession}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </div>
    );
}
