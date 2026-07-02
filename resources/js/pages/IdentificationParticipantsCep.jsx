import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import api from '../services/api';

/* ── Modal import depuis sensibilisation ─────────────────────────────── */
function ImportSensibilisationModal({ departements, communeCache, arrCache, onImport, onClose }) {
    const [dateFilter, setDateFilter]   = useState('');
    const [loading, setLoading]         = useState(false);
    const [list, setList]               = useState([]);
    const [searched, setSearched]       = useState(false);
    const [selected, setSelected]       = useState(new Set());

    const getName = (arr, id) => arr?.find(i => String(i.id) === String(id))?.nom ?? '—';

    const handleSearch = async () => {
        setLoading(true);
        setSearched(false);
        setSelected(new Set());
        try {
            const params = dateFilter ? { date_session: dateFilter } : {};
            const res = await api.get('/api/liste-presence-sensibilisation', { params });
            setList(Array.isArray(res.data) ? res.data : []);
        } catch {
            setList([]);
        } finally {
            setLoading(false);
            setSearched(true);
        }
    };

    const toggle = (id) => setSelected(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const toggleAll = () =>
        setSelected(selected.size === list.length ? new Set() : new Set(list.map(r => r.id)));

    const handleImport = () => {
        const rows = list
            .filter(r => selected.has(r.id))
            .map(r => ({
                _id:                  Math.random().toString(36).slice(2),
                departement_id:       r.departement_id   ? String(r.departement_id)   : '',
                commune_id:           r.commune_id       ? String(r.commune_id)       : '',
                arrondissement_id:    r.arrondissement_id? String(r.arrondissement_id): '',
                village:              r.village          ?? '',
                nom_producteur:       r.nom_producteur   ?? '',
                prenoms_producteur:   r.prenoms_producteur ?? '',
                contact1_producteur:  r.contact1_producteur ?? '',
                contact2_producteur:  r.contact2_producteur ?? '',
                sexe:                 r.sexe ?? 'M',
                annee_naissance:      '',
                speculation:          '',
                responsabilite_fonction: '',
            }));
        onImport(rows);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6">
                {/* Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <div>
                            <h2 className="text-base font-bold text-white">Importer depuis la sensibilisation</h2>
                            <p className="text-xs text-cyan-200/70 mt-0.5">Sélectionnez une date puis cochez les participants à importer</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose}
                        className="flex size-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Filtre date */}
                <div className="flex items-end gap-4 border-b border-slate-100 px-6 py-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Date de la session</label>
                        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all" />
                    </div>
                    <button type="button" onClick={handleSearch} disabled={loading}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-600 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-all">
                        {loading
                            ? <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                            : <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/></svg>
                        }
                        Rechercher
                    </button>
                    {searched && list.length === 0 && (
                        <span className="text-sm text-slate-400">Aucun participant trouvé pour cette date.</span>
                    )}
                </div>

                {/* Liste */}
                {list.length > 0 && (
                    <div className="overflow-x-auto max-h-72 overflow-y-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead className="sticky top-0 bg-slate-100 z-10">
                                <tr>
                                    <th className="px-3 py-2 text-left">
                                        <input type="checkbox"
                                            checked={selected.size === list.length}
                                            onChange={toggleAll}
                                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                                    </th>
                                    {['Département','Commune','Village','Nom','Prénoms','Sexe'].map(h => (
                                        <th key={h} className="px-3 py-2 text-left font-semibold text-slate-600 uppercase tracking-wide text-[10px]">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {list.map(r => (
                                    <tr key={r.id} onClick={() => toggle(r.id)}
                                        className={`cursor-pointer border-t border-slate-100 transition-colors ${selected.has(r.id) ? 'bg-teal-50' : 'hover:bg-slate-50'}`}>
                                        <td className="px-3 py-2">
                                            <input type="checkbox" readOnly checked={selected.has(r.id)}
                                                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 pointer-events-none" />
                                        </td>
                                        <td className="px-3 py-2">{r.departement?.nom ?? '—'}</td>
                                        <td className="px-3 py-2">{r.commune?.nom ?? '—'}</td>
                                        <td className="px-3 py-2">{r.village ?? '—'}</td>
                                        <td className="px-3 py-2 font-medium">{r.nom_producteur}</td>
                                        <td className="px-3 py-2">{r.prenoms_producteur ?? '—'}</td>
                                        <td className="px-3 py-2">
                                            <span className={`font-bold ${r.sexe === 'M' ? 'text-blue-600' : 'text-pink-600'}`}>{r.sexe}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                    <span className="text-xs text-slate-400">
                        {selected.size > 0 ? `${selected.size} participant(s) sélectionné(s)` : 'Aucune sélection'}
                    </span>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                            Annuler
                        </button>
                        <button type="button" onClick={handleImport} disabled={selected.size === 0}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#062824] text-sm font-bold text-white hover:bg-teal-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Importer la sélection
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Modal aperçu ────────────────────────────────────────────────────── */
function ApercuModal({ rows, departements, communeCache, arrCache, dateSession, onClose }) {
    const printRef = useRef(null);

    const getName = (list, id) => list?.find(i => String(i.id) === String(id))?.nom ?? '';
    const anneeEnCours = new Date().getFullYear();
    const age = (annee) => (annee && annee > 0) ? anneeEnCours - annee : '';

    const handlePrint = () => {
        const content = printRef.current.innerHTML;
        const win = window.open('', '_blank');
        win.document.write(`
            <html><head><title>Identification participants CEP</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 10px; margin: 15px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 3px 5px; vertical-align: top; }
                .title-row td { background: #8BCF45; font-weight: bold; text-align: center; font-size: 11px; }
                .header-row th { font-weight: bold; font-size: 9px; text-transform: uppercase; }
            </style></head><body>${content}</body></html>
        `);
        win.document.close();
        win.print();
    };

    const anneeModal = new Date().getFullYear();
    const getCategorieModal = (annee) => {
        if (!annee) return null;
        const age = anneeModal - Number(annee);
        if (age <= 35) return 'J';
        if (age <= 59) return 'A';
        return 'V';
    };
    const JAV_LABEL = { J: 'Jeune', A: 'Adulte', V: 'Vieux' };
    const JAV_COLOR = { J: '#059669', A: '#d97706', V: '#64748b' };

    const filled = rows.filter(r => r.nom_producteur?.trim());
    const COLS = [
        'DÉPARTEMENT','COMMUNE','ARRONDISSEMENT','VILLAGE',
        'NOM DU\nPRODUCTEUR','PRÉNOMS DU\nPRODUCTEUR',
        'CONTACT 1\nDU PRODUCTEUR','CONTACT 2\nDU PRODUCTEUR',
        'SEXE\nM/F','AGE\n(Année de\nnaissance)','J\nA\nV','Spéculation',
        'Responsabilité/\nfonction dans\nle groupe CEP',
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-7xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6">
                <div className="flex items-center justify-between bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <div>
                            <h2 className="text-base font-bold text-white">Aperçu — Identification participants CEP</h2>
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

                <div className="p-6 overflow-x-auto" ref={printRef}>
                    <table className="w-full border-collapse text-xs">
                        <thead>
                            <tr>
                                <td colSpan={13} className="border border-black bg-[#8BCF45] py-2 text-center text-sm font-bold text-slate-900">
                                    Identification participants CEP
                                </td>
                            </tr>
                            <tr>
                                {COLS.map((col, i) => (
                                    <th key={i} className="border border-black px-2 py-2 text-left align-top text-[10px] font-bold uppercase leading-tight" style={{ minWidth: 72 }}>
                                        {col.split('\n').map((l, j) => <span key={j} className="block">{l}</span>)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filled.length > 0 ? filled.map((row, i) => (
                                <tr key={row._id ?? i}>
                                    <td className="border border-black px-2 py-2">{row.departement_id ? getName(departements, row.departement_id) : ''}</td>
                                    <td className="border border-black px-2 py-2">{row.commune_id ? getName(communeCache[row.departement_id] ?? [], row.commune_id) : ''}</td>
                                    <td className="border border-black px-2 py-2">{row.arrondissement_id ? getName(arrCache[row.commune_id] ?? [], row.arrondissement_id) : ''}</td>
                                    <td className="border border-black px-2 py-2">{row.village}</td>
                                    <td className="border border-black px-2 py-2 font-medium">{row.nom_producteur}</td>
                                    <td className="border border-black px-2 py-2">{row.prenoms_producteur}</td>
                                    <td className="border border-black px-2 py-2">{row.contact1_producteur}</td>
                                    <td className="border border-black px-2 py-2">{row.contact2_producteur}</td>
                                    <td className="border border-black px-2 py-2 text-center font-bold">
                                        <span className={row.sexe === 'M' ? 'text-blue-700' : 'text-pink-700'}>{row.sexe}</span>
                                    </td>
                                    <td className="border border-black px-2 py-2 text-center">
                                        {row.annee_naissance ? `${row.annee_naissance} (${age(row.annee_naissance)} ans)` : ''}
                                    </td>
                                    <td className="border border-black px-2 py-2 text-center font-bold" style={{ color: getCategorieModal(row.annee_naissance) ? JAV_COLOR[getCategorieModal(row.annee_naissance)] : undefined }}>
                                        {getCategorieModal(row.annee_naissance) ? `${getCategorieModal(row.annee_naissance)} (${JAV_LABEL[getCategorieModal(row.annee_naissance)]})` : ''}
                                    </td>
                                    <td className="border border-black px-2 py-2">{row.speculation}</td>
                                    <td className="border border-black px-2 py-2">{row.responsabilite_fonction}</td>
                                </tr>
                            )) : (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <td key={j} className="border border-black px-2 py-4" />
                                        ))}
                                        <td className="border border-black px-2 py-1 text-center text-[10px] font-bold leading-5 text-slate-400">
                                            <div>M</div><div>F</div>
                                        </td>
                                        <td className="border border-black px-2 py-4" />
                                        <td className="border border-black px-2 py-1 text-center text-[10px] font-bold leading-5 text-slate-400">
                                            <div>J</div><div>A</div><div>V</div>
                                        </td>
                                        <td className="border border-black px-2 py-4" />
                                        <td className="border border-black px-2 py-4" />
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {filled.length > 0 && (
                    <div className="flex items-center gap-4 border-t border-slate-100 px-6 pb-5 pt-3">
                        <span className="text-xs text-slate-500">Résumé :</span>
                        <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Hommes : {filled.filter(r => r.sexe === 'M').length}</span>
                        <span className="rounded-lg border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-bold text-pink-700">Femmes : {filled.filter(r => r.sexe === 'F').length}</span>
                        <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Total : {filled.length}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Ligne vide ──────────────────────────────────────────────────────── */
const emptyRow = () => ({
    _id: Math.random().toString(36).slice(2),
    departement_id: '', commune_id: '', arrondissement_id: '', village: '',
    nom_producteur: '', prenoms_producteur: '',
    contact1_producteur: '', contact2_producteur: '',
    sexe: 'M', annee_naissance: '', categorie_age: '', speculation: '', responsabilite_fonction: '',
});

/* ── Composant principal ─────────────────────────────────────────────── */
export default function IdentificationParticipantsCep() {
    const [dateSession, setDateSession]   = useState('');
    const [departements, setDepartements] = useState([]);
    const [communeCache, setCommuneCache] = useState({});
    const [arrCache, setArrCache]         = useState({});
    const [rows, setRows]                 = useState([emptyRow()]);
    const [loadingDepts, setLoadingDepts] = useState(true);
    const [saving, setSaving]             = useState(false);
    const [errors, setErrors]             = useState({});
    const [showImport, setShowImport]     = useState(false);
    const [showPreview, setShowPreview]   = useState(false);
    const [toast, setToast]               = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        api.get('/api/departements')
            .then(res => setDepartements(Array.isArray(res.data) ? res.data : []))
            .catch(() => {})
            .finally(() => setLoadingDepts(false));
    }, []);

    const loadData = useCallback(async (date) => {
        try {
            const res = await api.get('/api/identification-participants-cep', {
                params: { date_session: date },
            });
            const data = Array.isArray(res.data) ? res.data : [];
            if (data.length > 0) {
                const mapped = data.map(r => ({
                    _id:                  String(r.id),
                    departement_id:       r.departement_id    ? String(r.departement_id)    : '',
                    commune_id:           r.commune_id        ? String(r.commune_id)        : '',
                    arrondissement_id:    r.arrondissement_id ? String(r.arrondissement_id) : '',
                    village:              r.village           ?? '',
                    nom_producteur:       r.nom_producteur    ?? '',
                    prenoms_producteur:   r.prenoms_producteur  ?? '',
                    contact1_producteur:  r.contact1_producteur ?? '',
                    contact2_producteur:  r.contact2_producteur ?? '',
                    sexe:                 r.sexe ?? 'M',
                    annee_naissance:      r.annee_naissance   ? String(r.annee_naissance) : '',
                    categorie_age:        r.categorie_age      ?? '',
                    speculation:          r.speculation        ?? '',
                    responsabilite_fonction: r.responsabilite_fonction ?? '',
                }));
                setRows(mapped);
                for (const r of mapped) {
                    if (r.departement_id) handleLoadCommunes(r.departement_id);
                    if (r.commune_id) handleLoadArr(r.commune_id);
                }
            } else {
                setRows([emptyRow()]);
            }
        } catch {}
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { if (dateSession) loadData(dateSession); }, [dateSession, loadData]);

    const handleLoadCommunes = useCallback(async (deptId) => {
        if (!deptId || communeCache[deptId]) return;
        try {
            const res = await api.get(`/api/departements/${deptId}/communes`);
            setCommuneCache(prev => ({ ...prev, [deptId]: Array.isArray(res.data) ? res.data : [] }));
        } catch {}
    }, [communeCache]);

    const handleLoadArr = useCallback(async (communeId) => {
        if (!communeId || arrCache[communeId]) return;
        try {
            const res = await api.get(`/api/communes/${communeId}/arrondissements`);
            setArrCache(prev => ({ ...prev, [communeId]: Array.isArray(res.data) ? res.data : [] }));
        } catch {}
    }, [arrCache]);

    const updateRow = (index, field, value) =>
        setRows(cur => cur.map((r, i) => i === index ? { ...r, [field]: value } : r));

    const addRow    = () => setRows(c => [...c, emptyRow()]);
    const removeRow = (index) => setRows(c => c.length > 1 ? c.filter((_, i) => i !== index) : [emptyRow()]);

    const handleImport = (importedRows) => {
        setRows(cur => {
            const base = cur.filter(r => r.nom_producteur.trim());
            return base.length > 0 ? [...base, ...importedRows] : importedRows;
        });
        for (const r of importedRows) {
            if (r.departement_id) handleLoadCommunes(r.departement_id);
            if (r.commune_id) handleLoadArr(r.commune_id);
        }
        setShowImport(false);
    };

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
            departement_id:         r.departement_id    ? Number(r.departement_id)    : null,
            commune_id:             r.commune_id        ? Number(r.commune_id)        : null,
            arrondissement_id:      r.arrondissement_id ? Number(r.arrondissement_id) : null,
            village:                r.village.trim()    || null,
            nom_producteur:         r.nom_producteur.trim(),
            prenoms_producteur:     r.prenoms_producteur.trim()   || null,
            contact1_producteur:    r.contact1_producteur.trim()  || null,
            contact2_producteur:    r.contact2_producteur.trim()  || null,
            sexe:                   r.sexe,
            annee_naissance:        r.annee_naissance ? Number(r.annee_naissance) : null,
            categorie_age:          getCategorie(r.annee_naissance),
            speculation:            r.speculation.trim() || null,
            responsabilite_fonction:r.responsabilite_fonction.trim() || null,
        }));

        setSaving(true);
        try {
            await api.post('/api/identification-participants-cep', {
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

    const anneeEnCours = new Date().getFullYear();

    const getCategorie = (annee) => {
        if (!annee) return null;
        const age = anneeEnCours - Number(annee);
        if (age <= 35) return 'J';
        if (age <= 59) return 'A';
        return 'V';
    };
    const JAV_META = { J: { label: 'Jeune',  color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                       A: { label: 'Adulte', color: 'text-amber-700',   bg: 'bg-amber-50  border-amber-200'   },
                       V: { label: 'Vieux',  color: 'text-slate-600',   bg: 'bg-slate-100 border-slate-200'   } };

    const nbH = rows.filter(r => r.sexe === 'M' && r.nom_producteur.trim()).length;
    const nbF = rows.filter(r => r.sexe === 'F' && r.nom_producteur.trim()).length;

    const selectCls = (err = false) =>
        `w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-teal-100 transition-all ${err ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-400 focus:bg-white'}`;
    const inputCls = (err = false) =>
        `w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-teal-100 transition-all ${err ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-400 focus:bg-white'}`;

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-60">
                <Header title="Identification participants CEP" />

                <div className="p-6 space-y-5">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Carte session */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="flex items-center gap-3 bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                                <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <div>
                                    <h2 className="text-base font-bold text-white">Session CEP</h2>
                                    <p className="text-xs text-cyan-200/70 mt-0.5">Indiquez la date de la session pour retrouver ou créer une liste</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-end gap-6 p-6">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Date de la session</label>
                                    <input type="date" value={dateSession} onChange={e => setDateSession(e.target.value)}
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

                        {/* Carte tableau participants */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="flex items-center justify-between bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <div>
                                        <h2 className="text-base font-bold text-white">Liste des participants</h2>
                                        <p className="text-xs text-cyan-200/70 mt-0.5">
                                            Ajoutez des participants manuellement ou importez depuis la liste de sensibilisation
                                        </p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowImport(true)}
                                    className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-all">
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    Importer depuis sensibilisation
                                </button>
                            </div>

                            <div className="p-5 bg-slate-50/50">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs border-separate border-spacing-y-1.5" style={{ minWidth: 1200 }}>
                                        <thead>
                                            <tr>
                                                {[
                                                    'Département','Commune','Arrondissement','Village',
                                                    'Nom *','Prénoms',
                                                    'Contact 1','Contact 2',
                                                    'Sexe','Année naiss.','J A V','Spéculation','Responsabilité/Fonction',
                                                    '',
                                                ].map((h, i) => (
                                                    <th key={i} className="px-2 pb-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row, idx) => (
                                                <tr key={row._id}>
                                                    {/* Département */}
                                                    <td className="px-1">
                                                        <select value={row.departement_id}
                                                            onChange={e => {
                                                                updateRow(idx, 'departement_id', e.target.value);
                                                                updateRow(idx, 'commune_id', '');
                                                                updateRow(idx, 'arrondissement_id', '');
                                                                if (e.target.value) handleLoadCommunes(e.target.value);
                                                            }}
                                                            className={selectCls()} style={{ minWidth: 100 }}>
                                                            <option value="">—</option>
                                                            {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                                                        </select>
                                                    </td>
                                                    {/* Commune */}
                                                    <td className="px-1">
                                                        <select value={row.commune_id}
                                                            onChange={e => {
                                                                updateRow(idx, 'commune_id', e.target.value);
                                                                updateRow(idx, 'arrondissement_id', '');
                                                                if (e.target.value) handleLoadArr(e.target.value);
                                                            }}
                                                            disabled={!row.departement_id}
                                                            className={selectCls()} style={{ minWidth: 100 }}>
                                                            <option value="">—</option>
                                                            {(communeCache[row.departement_id] ?? []).map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                                                        </select>
                                                    </td>
                                                    {/* Arrondissement */}
                                                    <td className="px-1">
                                                        <select value={row.arrondissement_id}
                                                            onChange={e => updateRow(idx, 'arrondissement_id', e.target.value)}
                                                            disabled={!row.commune_id}
                                                            className={selectCls()} style={{ minWidth: 110 }}>
                                                            <option value="">—</option>
                                                            {(arrCache[row.commune_id] ?? []).map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                                                        </select>
                                                    </td>
                                                    {/* Village */}
                                                    <td className="px-1">
                                                        <input value={row.village} onChange={e => updateRow(idx, 'village', e.target.value.toUpperCase())}
                                                            placeholder="Village" className={inputCls()} style={{ minWidth: 90 }} />
                                                    </td>
                                                    {/* Nom */}
                                                    <td className="px-1">
                                                        <input value={row.nom_producteur} onChange={e => updateRow(idx, 'nom_producteur', e.target.value)}
                                                            placeholder="Nom *" className={inputCls(!!errors[`nom_${idx}`])} style={{ minWidth: 100 }} />
                                                    </td>
                                                    {/* Prénoms */}
                                                    <td className="px-1">
                                                        <input value={row.prenoms_producteur} onChange={e => updateRow(idx, 'prenoms_producteur', e.target.value)}
                                                            placeholder="Prénoms" className={inputCls()} style={{ minWidth: 100 }} />
                                                    </td>
                                                    {/* Contact 1 */}
                                                    <td className="px-1">
                                                        <input value={row.contact1_producteur} onChange={e => updateRow(idx, 'contact1_producteur', e.target.value)}
                                                            placeholder="Contact 1" type="tel" className={inputCls()} style={{ minWidth: 90 }} />
                                                    </td>
                                                    {/* Contact 2 */}
                                                    <td className="px-1">
                                                        <input value={row.contact2_producteur} onChange={e => updateRow(idx, 'contact2_producteur', e.target.value)}
                                                            placeholder="Contact 2" type="tel" className={inputCls()} style={{ minWidth: 90 }} />
                                                    </td>
                                                    {/* Sexe */}
                                                    <td className="px-1">
                                                        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-1 py-1" style={{ minWidth: 62 }}>
                                                            {['M', 'F'].map(s => (
                                                                <button key={s} type="button"
                                                                    onClick={() => updateRow(idx, 'sexe', s)}
                                                                    className={`flex-1 rounded-md py-0.5 text-xs font-bold transition-all ${
                                                                        row.sexe === s
                                                                            ? s === 'M' ? 'bg-blue-600 text-white' : 'bg-pink-500 text-white'
                                                                            : 'text-slate-400 hover:text-slate-700'
                                                                    }`}>
                                                                    {s}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    {/* Année naissance */}
                                                    <td className="px-1">
                                                        <input value={row.annee_naissance}
                                                            onChange={e => updateRow(idx, 'annee_naissance', e.target.value)}
                                                            placeholder="Ex: 1985" type="number" min="1900" max={anneeEnCours}
                                                            className={inputCls()} style={{ minWidth: 80 }} />
                                                    </td>
                                                    {/* Catégorie âge J/A/V — calculée automatiquement */}
                                                    <td className="px-1" style={{ minWidth: 72 }}>
                                                        {(() => {
                                                            const cat = getCategorie(row.annee_naissance);
                                                            if (!cat) return <span className="block text-center text-[10px] text-slate-300">—</span>;
                                                            const m = JAV_META[cat];
                                                            return (
                                                                <span className={`flex items-center justify-center rounded-lg border px-2 py-1 text-xs font-bold ${m.bg} ${m.color}`}>
                                                                    {cat} <span className="ml-1 font-normal text-[10px]">({m.label})</span>
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    {/* Spéculation */}
                                                    <td className="px-1">
                                                        <input value={row.speculation} onChange={e => updateRow(idx, 'speculation', e.target.value)}
                                                            placeholder="Spéculation" className={inputCls()} style={{ minWidth: 100 }} />
                                                    </td>
                                                    {/* Responsabilité */}
                                                    <td className="px-1">
                                                        <input value={row.responsabilite_fonction} onChange={e => updateRow(idx, 'responsabilite_fonction', e.target.value)}
                                                            placeholder="Responsabilité/Fonction" className={inputCls()} style={{ minWidth: 140 }} />
                                                    </td>
                                                    {/* Supprimer */}
                                                    <td className="px-1">
                                                        <button type="button" onClick={() => removeRow(idx)}
                                                            className="flex size-7 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors">
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
                                    className="mt-3 flex items-center gap-2 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/50 px-4 py-2.5 text-xs font-semibold text-teal-700 hover:border-teal-400 hover:bg-teal-50 transition-all">
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Ajouter un participant
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4">
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

            {showImport && (
                <ImportSensibilisationModal
                    departements={departements}
                    communeCache={communeCache}
                    arrCache={arrCache}
                    onImport={handleImport}
                    onClose={() => setShowImport(false)}
                />
            )}

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
