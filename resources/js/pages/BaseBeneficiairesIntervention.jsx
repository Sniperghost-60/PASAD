import { useCallback, useEffect, useRef, useState } from 'react';
import CepSelector from '../components/CepSelector';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import api from '../services/api';

const TYPES_PRODUCTEUR = [
    'Formé en 2025',
    'Formé en 2026',
    'Relais Expérimenté 2025',
    'Relais simple',
    'Apprenant',
];

const anneeEnCours = new Date().getFullYear();
const getCategorie = (annee) => {
    if (!annee) return null;
    const age = anneeEnCours - Number(annee);
    if (age <= 35) return { code: 'J', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (age <= 59) return { code: 'A', cls: 'bg-amber-50  text-amber-700  border-amber-200' };
    return               { code: 'V', cls: 'bg-slate-100 text-slate-600  border-slate-200' };
};

/* ── Ligne vide ──────────────────────────────────────────────────────── */
const emptyRow = (source = 'manuel') => ({
    _id: Math.random().toString(36).slice(2),
    source,                              // 'identification' | 'manuel'
    identification_participant_cep_id: null,
    departement_id: '', commune_id: '', arrondissement_id: '', village: '',
    nom_producteur: '', prenoms_producteur: '',
    contact1_producteur: '', contact2_producteur: '',
    sexe: 'M', annee_naissance: '',
    type_producteur: '',
    type_parcelle: '',
    superficie_totale: '',
    pratique_agroecologique_1: '', pratique_agroecologique_2: '', pratique_agroecologique_3: '',
    coordonnee_x: '', coordonnee_y: '',
    culture_principale: '', culture_associee: '',
});

/* ── Modal import depuis Identification CEP ──────────────────────────── */
function ImportIdentificationModal({ onImport, onClose }) {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [selected, setSelected]         = useState(new Set());
    const [search, setSearch]             = useState('');

    useEffect(() => {
        api.get('/api/base-beneficiaires-intervention/participants')
            .then(res => setParticipants(Array.isArray(res.data) ? res.data : []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const filtered = participants.filter(p =>
        `${p.nom_producteur} ${p.prenoms_producteur ?? ''}`.toLowerCase().includes(search.toLowerCase())
    );

    const toggle = (id) => setSelected(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const toggleAll = () =>
        setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));

    const handleImport = () => {
        const rows = participants
            .filter(p => selected.has(p.id))
            .map(p => ({
                ...emptyRow('identification'),
                identification_participant_cep_id: p.id,
                departement_id:     p.departement_id    ? String(p.departement_id)    : '',
                commune_id:         p.commune_id        ? String(p.commune_id)        : '',
                arrondissement_id:  p.arrondissement_id ? String(p.arrondissement_id) : '',
                village:            p.village ?? '',
                nom_producteur:     p.nom_producteur ?? '',
                prenoms_producteur: p.prenoms_producteur ?? '',
                contact1_producteur: p.contact1_producteur ?? '',
                contact2_producteur: p.contact2_producteur ?? '',
                sexe:               p.sexe ?? 'M',
                annee_naissance:    p.annee_naissance ? String(p.annee_naissance) : '',
                // Coordonnées du CEP auquel appartient le participant
                coordonnee_x: p.cep_coordonnee_x != null ? String(p.cep_coordonnee_x) : '',
                coordonnee_y: p.cep_coordonnee_y != null ? String(p.cep_coordonnee_y) : '',
                _cep_nom: p.cep_nom ?? null,
            }));
        onImport(rows);
    };

    const cat = (p) => getCategorie(p.annee_naissance);

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6">
                <div className="flex items-center justify-between bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <div>
                            <h2 className="text-base font-bold text-white">Importer depuis Identification CEP</h2>
                            <p className="text-xs text-cyan-200/70 mt-0.5">Les coordonnées X/Y seront auto-remplies depuis le CEP du participant</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose}
                        className="flex size-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Recherche */}
                <div className="border-b border-slate-100 px-6 py-3">
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher par nom…"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all" />
                </div>

                {/* Liste */}
                {loading ? (
                    <div className="py-12 text-center text-sm text-slate-400">Chargement…</div>
                ) : filtered.length === 0 ? (
                    <div className="py-10 text-center text-sm text-slate-400">Aucun participant trouvé.</div>
                ) : (
                    <div className="overflow-x-auto max-h-80 overflow-y-auto">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-slate-100 z-10">
                                <tr>
                                    <th className="px-3 py-2 text-left">
                                        <input type="checkbox"
                                            checked={selected.size === filtered.length && filtered.length > 0}
                                            onChange={toggleAll}
                                            className="rounded border-slate-300 text-teal-600" />
                                    </th>
                                    {['Nom','Prénoms','Village','Sexe','J/A/V','CEP'].map(h => (
                                        <th key={h} className="px-3 py-2 text-left font-semibold text-slate-600 uppercase tracking-wide text-[10px]">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(p => {
                                    const c = cat(p);
                                    return (
                                        <tr key={p.id} onClick={() => toggle(p.id)}
                                            className={`cursor-pointer border-t border-slate-100 transition-colors ${selected.has(p.id) ? 'bg-teal-50' : 'hover:bg-slate-50'}`}>
                                            <td className="px-3 py-2">
                                                <input type="checkbox" readOnly checked={selected.has(p.id)}
                                                    className="rounded border-slate-300 text-teal-600 pointer-events-none" />
                                            </td>
                                            <td className="px-3 py-2 font-medium">{p.nom_producteur}</td>
                                            <td className="px-3 py-2">{p.prenoms_producteur ?? '—'}</td>
                                            <td className="px-3 py-2">{p.village ?? '—'}</td>
                                            <td className="px-3 py-2">
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${p.sexe === 'M' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-pink-50 text-pink-600 border-pink-200'}`}>{p.sexe}</span>
                                            </td>
                                            <td className="px-3 py-2">
                                                {c && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${c.cls}`}>{c.code}</span>}
                                            </td>
                                            <td className="px-3 py-2">
                                                {p.cep_nom
                                                    ? <span className="rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] text-teal-700">{p.cep_nom}</span>
                                                    : <span className="text-slate-300 text-[10px]">—</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                    <span className="text-xs text-slate-400">{selected.size} sélectionné(s)</span>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                            Annuler
                        </button>
                        <button type="button" onClick={handleImport} disabled={selected.size === 0}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#062824] text-sm font-bold text-white hover:bg-teal-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Importer ({selected.size})
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
    const handlePrint = () => {
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>Base bénéficiaires</title>
            <style>body{font-family:Arial,sans-serif;font-size:9px;margin:10px}
            table{border-collapse:collapse;width:100%}
            th,td{border:1px solid #000;padding:2px 4px;vertical-align:top}
            .title-row td{background:#8BCF45;font-weight:bold;text-align:center;font-size:11px;padding:6px}
            .header-row th{background:#f1f5f9;font-weight:bold;font-size:8px;text-transform:uppercase}
            </style></head><body>${printRef.current.innerHTML}</body></html>`);
        win.document.close(); win.print();
    };
    const filled = rows.filter(r => r.nom_producteur?.trim());
    const HEADERS = ['DEPT','COMMUNE','ARR.','VILLAGE','NOM','PRÉNOMS','CONTACT 1','CONTACT 2','SEXE','AGE (naiss.)','TYPE PRODUCTEUR','TYPE PARCELLE','SUPERFICIE','PRATIQUE 1','PRATIQUE 2','PRATIQUE 3','COORD. X','COORD. Y','CULTURE PRINC.','CULTURE ASSOC.'];

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-[98vw] bg-white rounded-2xl shadow-2xl overflow-hidden my-6">
                <div className="flex items-center justify-between bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        <h2 className="text-base font-bold text-white">Aperçu — Base globale des bénéficiaires</h2>
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
                            <tr><td colSpan={20} className="border border-black bg-[#8BCF45] py-2 text-center text-sm font-extrabold">Base globale des bénéficiaires de l'intervention</td></tr>
                            <tr>{HEADERS.map((h, i) => <th key={i} className="border border-black px-1.5 py-1.5 text-left text-[9px] font-bold uppercase bg-slate-50" style={{ minWidth: 60 }}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {filled.length > 0 ? filled.map((r, i) => (
                                <tr key={r._id ?? i}>
                                    <td className="border border-black px-1.5 py-1">{r.departement_id ? getName(departements, r.departement_id) : ''}</td>
                                    <td className="border border-black px-1.5 py-1">{r.commune_id ? getName(communeCache[r.departement_id] ?? [], r.commune_id) : ''}</td>
                                    <td className="border border-black px-1.5 py-1">{r.arrondissement_id ? getName(arrCache[r.commune_id] ?? [], r.arrondissement_id) : ''}</td>
                                    <td className="border border-black px-1.5 py-1">{r.village}</td>
                                    <td className="border border-black px-1.5 py-1 font-medium">{r.nom_producteur}</td>
                                    <td className="border border-black px-1.5 py-1">{r.prenoms_producteur}</td>
                                    <td className="border border-black px-1.5 py-1">{r.contact1_producteur}</td>
                                    <td className="border border-black px-1.5 py-1">{r.contact2_producteur}</td>
                                    <td className="border border-black px-1.5 py-1 text-center font-bold">{r.sexe}</td>
                                    <td className="border border-black px-1.5 py-1 text-center">{r.annee_naissance || ''}</td>
                                    <td className="border border-black px-1.5 py-1">{r.type_producteur}</td>
                                    <td className="border border-black px-1.5 py-1">{r.type_parcelle}</td>
                                    <td className="border border-black px-1.5 py-1 text-center">{r.superficie_totale}</td>
                                    <td className="border border-black px-1.5 py-1">{r.pratique_agroecologique_1}</td>
                                    <td className="border border-black px-1.5 py-1">{r.pratique_agroecologique_2}</td>
                                    <td className="border border-black px-1.5 py-1">{r.pratique_agroecologique_3}</td>
                                    <td className="border border-black px-1.5 py-1 font-mono">{r.coordonnee_x}</td>
                                    <td className="border border-black px-1.5 py-1 font-mono">{r.coordonnee_y}</td>
                                    <td className="border border-black px-1.5 py-1">{r.culture_principale}</td>
                                    <td className="border border-black px-1.5 py-1">{r.culture_associee}</td>
                                </tr>
                            )) : Array.from({length: 4}).map((_, i) => (
                                <tr key={i}>{Array.from({length: 20}).map((_, j) => <td key={j} className="border border-black px-1.5 py-4" />)}</tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/* ── Page principale ─────────────────────────────────────────────────── */
export default function BaseBeneficiairesIntervention() {
    const [selectedCep, setSelectedCep]   = useState('');
    const [dateSession, setDateSession]   = useState('');
    const [departements, setDepartements] = useState([]);
    const [communeCache, setCommuneCache] = useState({});
    const [arrCache, setArrCache]         = useState({});
    const [rows, setRows]                 = useState([emptyRow('manuel')]);
    const [saving, setSaving]             = useState(false);
    const [errors, setErrors]             = useState({});
    const [showImport, setShowImport]     = useState(false);
    const [showPreview, setShowPreview]   = useState(false);
    const [toast, setToast]               = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        api.get('/api/departements')
            .then(res => setDepartements(Array.isArray(res.data) ? res.data : []))
            .catch(() => {});
    }, []);

    const loadData = useCallback(async (date, cepId) => {
        try {
            const params = {};
            if (date)  params.date_session = date;
            if (cepId) params.cep_id = cepId;
            const res = await api.get('/api/base-beneficiaires-intervention', { params });
            const data = Array.isArray(res.data) ? res.data : [];
            if (data.length > 0) {
                const mapped = data.map(r => ({
                    _id:                                String(r.id),
                    source:                             r.identification_participant_cep_id ? 'identification' : 'manuel',
                    identification_participant_cep_id:  r.identification_participant_cep_id ?? null,
                    departement_id:                     r.departement_id    ? String(r.departement_id)    : '',
                    commune_id:                         r.commune_id        ? String(r.commune_id)        : '',
                    arrondissement_id:                  r.arrondissement_id ? String(r.arrondissement_id) : '',
                    village:                            r.village           ?? '',
                    nom_producteur:                     r.nom_producteur    ?? '',
                    prenoms_producteur:                 r.prenoms_producteur  ?? '',
                    contact1_producteur:                r.contact1_producteur ?? '',
                    contact2_producteur:                r.contact2_producteur ?? '',
                    sexe:                               r.sexe ?? 'M',
                    annee_naissance:                    r.annee_naissance   ? String(r.annee_naissance) : '',
                    type_producteur:                    r.type_producteur   ?? '',
                    type_parcelle:                      r.type_parcelle     ?? '',
                    superficie_totale:                  r.superficie_totale != null ? String(r.superficie_totale) : '',
                    pratique_agroecologique_1:          r.pratique_agroecologique_1 ?? '',
                    pratique_agroecologique_2:          r.pratique_agroecologique_2 ?? '',
                    pratique_agroecologique_3:          r.pratique_agroecologique_3 ?? '',
                    coordonnee_x:                       r.coordonnee_x != null ? String(r.coordonnee_x) : '',
                    coordonnee_y:                       r.coordonnee_y != null ? String(r.coordonnee_y) : '',
                    culture_principale:                 r.culture_principale ?? '',
                    culture_associee:                   r.culture_associee   ?? '',
                }));
                setRows(mapped);
                for (const r of mapped) {
                    if (r.departement_id) loadCommunes(r.departement_id);
                    if (r.commune_id) loadArr(r.commune_id);
                }
            }
        } catch {}
    }, []);

    useEffect(() => { loadData(dateSession, selectedCep); }, [dateSession, selectedCep, loadData]);

    const loadCommunes = useCallback(async (deptId) => {
        if (!deptId || communeCache[deptId]) return;
        try {
            const res = await api.get(`/api/departements/${deptId}/communes`);
            setCommuneCache(p => ({ ...p, [deptId]: Array.isArray(res.data) ? res.data : [] }));
        } catch {}
    }, [communeCache]);

    const loadArr = useCallback(async (cId) => {
        if (!cId || arrCache[cId]) return;
        try {
            const res = await api.get(`/api/communes/${cId}/arrondissements`);
            setArrCache(p => ({ ...p, [cId]: Array.isArray(res.data) ? res.data : [] }));
        } catch {}
    }, [arrCache]);

    const updateRow = (idx, field, value) =>
        setRows(cur => cur.map((r, i) => i === idx ? { ...r, [field]: value } : r));

    const addRow    = () => setRows(c => [...c, emptyRow('manuel')]);
    const removeRow = (idx) => setRows(c => c.length > 1 ? c.filter((_, i) => i !== idx) : [emptyRow('manuel')]);

    const handleImport = (imported) => {
        setRows(cur => {
            const base = cur.filter(r => r.nom_producteur.trim());
            return base.length > 0 ? [...base, ...imported] : imported;
        });
        for (const r of imported) {
            if (r.departement_id) loadCommunes(r.departement_id);
            if (r.commune_id) loadArr(r.commune_id);
        }
        setShowImport(false);
    };

    const validate = () => {
        // Only validate rows that have at least some content (non-empty rows)
        const next = {};
        const filled = rows.filter(r => r.nom_producteur.trim());
        if (filled.length === 0) {
            setToast({ show: true, message: 'Veuillez saisir au moins un bénéficiaire.', type: 'error' });
            return false;
        }
        setErrors(next);
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        const beneficiaires = rows.filter(r => r.nom_producteur.trim()).map(r => ({
            identification_participant_cep_id: r.identification_participant_cep_id ?? null,
            departement_id:          r.departement_id    ? Number(r.departement_id)    : null,
            commune_id:              r.commune_id        ? Number(r.commune_id)        : null,
            arrondissement_id:       r.arrondissement_id ? Number(r.arrondissement_id) : null,
            village:                 r.village.trim()    || null,
            nom_producteur:          r.nom_producteur.trim(),
            prenoms_producteur:      r.prenoms_producteur.trim()  || null,
            contact1_producteur:     r.contact1_producteur.trim() || null,
            contact2_producteur:     r.contact2_producteur.trim() || null,
            sexe:                    r.sexe,
            annee_naissance:         r.annee_naissance   ? Number(r.annee_naissance)   : null,
            type_producteur:         r.type_producteur   || null,
            type_parcelle:           r.type_parcelle.trim()           || null,
            superficie_totale:       r.superficie_totale !== ''       ? Number(r.superficie_totale) : null,
            pratique_agroecologique_1: r.pratique_agroecologique_1.trim() || null,
            pratique_agroecologique_2: r.pratique_agroecologique_2.trim() || null,
            pratique_agroecologique_3: r.pratique_agroecologique_3.trim() || null,
            coordonnee_x:            r.coordonnee_x !== '' ? Number(r.coordonnee_x) : null,
            coordonnee_y:            r.coordonnee_y !== '' ? Number(r.coordonnee_y) : null,
            culture_principale:      r.culture_principale.trim() || null,
            culture_associee:        r.culture_associee.trim()   || null,
        }));
        setSaving(true);
        try {
            const res = await api.post('/api/base-beneficiaires-intervention', {
                cep_id: selectedCep ? Number(selectedCep) : null,
                date_session: dateSession || null,
                beneficiaires,
            });
            setToast({ show: true, message: res.data.message, type: 'success' });
            if (dateSession) loadData(dateSession);
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.message || 'Erreur.', type: 'error' });
        } finally { setSaving(false); }
    };

    const iCls = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all';
    const sCls = (err) => `w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-teal-100 transition-all ${err ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-400 focus:bg-white'}`;

    const COLS = [
        'Département','Commune','Arrondissement','Village',
        'Nom *','Prénoms','Contact 1','Contact 2',
        'Sexe','Année naiss.','Type producteur','Type parcelle',
        'Superficie (ha)','Pratique 1','Pratique 2','Pratique 3',
        'Coord. X','Coord. Y','Culture princ.','Culture assoc.','',
    ];

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-60">
                <Header title="Base globale des bénéficiaires" />

                <div className="p-6 space-y-5">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Sélecteur CEP */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                            <CepSelector value={selectedCep} onChange={setSelectedCep} required />
                        </div>

                        {/* Carte session */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="flex items-center gap-3 bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                                <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <div>
                                    <h2 className="text-base font-bold text-white">Session d'animation</h2>
                                    <p className="text-xs text-cyan-200/70 mt-0.5">Date de la session (optionnel)</p>
                                </div>
                            </div>
                            <div className="flex items-end gap-6 p-6">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Date de la session</label>
                                    <input type="date" value={dateSession} onChange={e => setDateSession(e.target.value)}
                                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all" />
                                </div>
                            </div>
                        </div>

                        {/* Carte tableau */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="flex items-center justify-between bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <svg className="size-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <div>
                                        <h2 className="text-base font-bold text-white">Base globale des bénéficiaires de l'intervention</h2>
                                        <p className="text-xs text-cyan-200/70 mt-0.5">{rows.filter(r => r.nom_producteur.trim()).length} bénéficiaire(s)</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowImport(true)}
                                    className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-all">
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    Importer depuis Identification CEP
                                </button>
                            </div>

                            <div className="p-4 bg-slate-50/50">
                                <div className="overflow-x-auto">
                                    <table className="text-xs border-separate border-spacing-y-1" style={{ minWidth: 2000 }}>
                                        <thead>
                                            <tr>
                                                {COLS.map((h, i) => (
                                                    <th key={i} className="px-1.5 pb-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row, idx) => (
                                                <tr key={row._id}>
                                                    {/* Département */}
                                                    <td className="px-0.5">
                                                        <select value={row.departement_id} disabled={row.source === 'identification'}
                                                            onChange={e => { updateRow(idx,'departement_id',e.target.value); updateRow(idx,'commune_id',''); updateRow(idx,'arrondissement_id',''); if(e.target.value) loadCommunes(e.target.value); }}
                                                            className={sCls(false)} style={{minWidth:90}}>
                                                            <option value="">—</option>
                                                            {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                                                        </select>
                                                    </td>
                                                    {/* Commune */}
                                                    <td className="px-0.5">
                                                        <select value={row.commune_id} disabled={!row.departement_id || row.source === 'identification'}
                                                            onChange={e => { updateRow(idx,'commune_id',e.target.value); updateRow(idx,'arrondissement_id',''); if(e.target.value) loadArr(e.target.value); }}
                                                            className={sCls(false)} style={{minWidth:90}}>
                                                            <option value="">—</option>
                                                            {(communeCache[row.departement_id]??[]).map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                                                        </select>
                                                    </td>
                                                    {/* Arrondissement */}
                                                    <td className="px-0.5">
                                                        <select value={row.arrondissement_id} disabled={!row.commune_id || row.source === 'identification'}
                                                            onChange={e => updateRow(idx,'arrondissement_id',e.target.value)}
                                                            className={sCls(false)} style={{minWidth:100}}>
                                                            <option value="">—</option>
                                                            {(arrCache[row.commune_id]??[]).map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                                                        </select>
                                                    </td>
                                                    {/* Village */}
                                                    <td className="px-0.5"><input value={row.village} onChange={e=>updateRow(idx,'village',e.target.value.toUpperCase())} disabled={row.source==='identification'} placeholder="Village" className={iCls} style={{minWidth:80}} /></td>
                                                    {/* Nom */}
                                                    <td className="px-0.5"><input value={row.nom_producteur} onChange={e=>updateRow(idx,'nom_producteur',e.target.value)} disabled={row.source==='identification'} placeholder="Nom *" className={sCls(!!errors[`nom_${idx}`])} style={{minWidth:90}} /></td>
                                                    {/* Prénoms */}
                                                    <td className="px-0.5"><input value={row.prenoms_producteur} onChange={e=>updateRow(idx,'prenoms_producteur',e.target.value)} disabled={row.source==='identification'} placeholder="Prénoms" className={iCls} style={{minWidth:90}} /></td>
                                                    {/* Contacts */}
                                                    <td className="px-0.5"><input value={row.contact1_producteur} onChange={e=>updateRow(idx,'contact1_producteur',e.target.value)} disabled={row.source==='identification'} type="tel" placeholder="Contact 1" className={iCls} style={{minWidth:85}} /></td>
                                                    <td className="px-0.5"><input value={row.contact2_producteur} onChange={e=>updateRow(idx,'contact2_producteur',e.target.value)} disabled={row.source==='identification'} type="tel" placeholder="Contact 2" className={iCls} style={{minWidth:85}} /></td>
                                                    {/* Sexe */}
                                                    <td className="px-0.5">
                                                        <div className="flex gap-0.5 rounded-lg border border-slate-200 bg-slate-50 px-1 py-1" style={{minWidth:52}}>
                                                            {['M','F'].map(s => (
                                                                <button key={s} type="button" disabled={row.source==='identification'}
                                                                    onClick={() => updateRow(idx,'sexe',s)}
                                                                    className={`flex-1 rounded-md py-0.5 text-xs font-bold transition-all ${row.sexe===s ? (s==='M'?'bg-blue-600 text-white':'bg-pink-500 text-white') : 'text-slate-400 hover:text-slate-700'}`}>
                                                                    {s}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    {/* Année naissance */}
                                                    <td className="px-0.5"><input value={row.annee_naissance} onChange={e=>updateRow(idx,'annee_naissance',e.target.value)} disabled={row.source==='identification'} type="number" min="1900" max={anneeEnCours} placeholder="Ex: 1985" className={iCls} style={{minWidth:80}} /></td>
                                                    {/* Type producteur */}
                                                    <td className="px-0.5">
                                                        <select value={row.type_producteur} onChange={e=>updateRow(idx,'type_producteur',e.target.value)} className={sCls(false)} style={{minWidth:140}}>
                                                            <option value="">— Type —</option>
                                                            {TYPES_PRODUCTEUR.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    </td>
                                                    {/* Type parcelle */}
                                                    <td className="px-0.5"><input value={row.type_parcelle} onChange={e=>updateRow(idx,'type_parcelle',e.target.value)} placeholder="Type parcelle" className={iCls} style={{minWidth:90}} /></td>
                                                    {/* Superficie */}
                                                    <td className="px-0.5"><input value={row.superficie_totale} onChange={e=>updateRow(idx,'superficie_totale',e.target.value)} type="number" min="0" step="0.01" placeholder="ha" className={iCls} style={{minWidth:70}} /></td>
                                                    {/* Pratiques */}
                                                    <td className="px-0.5"><input value={row.pratique_agroecologique_1} onChange={e=>updateRow(idx,'pratique_agroecologique_1',e.target.value)} placeholder="Pratique 1" className={iCls} style={{minWidth:100}} /></td>
                                                    <td className="px-0.5"><input value={row.pratique_agroecologique_2} onChange={e=>updateRow(idx,'pratique_agroecologique_2',e.target.value)} placeholder="Pratique 2" className={iCls} style={{minWidth:100}} /></td>
                                                    <td className="px-0.5"><input value={row.pratique_agroecologique_3} onChange={e=>updateRow(idx,'pratique_agroecologique_3',e.target.value)} placeholder="Pratique 3" className={iCls} style={{minWidth:100}} /></td>
                                                    {/* Coordonnées — auto (identification) ou manuel */}
                                                    <td className="px-0.5">
                                                        <div className="relative">
                                                            <input value={row.coordonnee_x} onChange={e=>updateRow(idx,'coordonnee_x',e.target.value)}
                                                                readOnly={row.source==='identification'} type="number" step="any" placeholder="X (Long.)"
                                                                className={`${iCls} ${row.source==='identification' ? 'text-teal-700 font-semibold bg-teal-50 border-teal-200' : ''}`}
                                                                style={{minWidth:90}} />
                                                            {row.source==='identification' && <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-teal-500 font-bold">CEP</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-0.5">
                                                        <div className="relative">
                                                            <input value={row.coordonnee_y} onChange={e=>updateRow(idx,'coordonnee_y',e.target.value)}
                                                                readOnly={row.source==='identification'} type="number" step="any" placeholder="Y (Lat.)"
                                                                className={`${iCls} ${row.source==='identification' ? 'text-teal-700 font-semibold bg-teal-50 border-teal-200' : ''}`}
                                                                style={{minWidth:90}} />
                                                            {row.source==='identification' && <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-teal-500 font-bold">CEP</span>}
                                                        </div>
                                                    </td>
                                                    {/* Cultures */}
                                                    <td className="px-0.5"><input value={row.culture_principale} onChange={e=>updateRow(idx,'culture_principale',e.target.value)} placeholder="Principale" className={iCls} style={{minWidth:90}} /></td>
                                                    <td className="px-0.5"><input value={row.culture_associee} onChange={e=>updateRow(idx,'culture_associee',e.target.value)} placeholder="Associée" className={iCls} style={{minWidth:90}} /></td>
                                                    {/* Supprimer */}
                                                    <td className="px-0.5">
                                                        <button type="button" onClick={()=>removeRow(idx)}
                                                            className="flex size-7 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-400 hover:bg-red-100 transition-colors">
                                                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <button type="button" onClick={addRow}
                                    className="mt-3 flex items-center gap-2 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/50 px-4 py-2.5 text-xs font-semibold text-teal-700 hover:border-teal-400 hover:bg-teal-50 transition-all">
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                    Ajouter un bénéficiaire manuellement
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4">
                                <button type="button" onClick={() => setShowPreview(true)}
                                    className="flex items-center gap-2 rounded-xl border-2 border-[#062824] bg-white px-5 py-2.5 text-sm font-semibold text-[#062824] hover:bg-[#062824]/5 transition-colors">
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    Aperçu
                                </button>
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => { setRows([emptyRow('manuel')]); setErrors({}); }} disabled={saving}
                                        className="px-5 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
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

            {showImport && <ImportIdentificationModal onImport={handleImport} onClose={() => setShowImport(false)} />}

            {showPreview && (
                <ApercuModal rows={rows} departements={departements}
                    communeCache={communeCache} arrCache={arrCache}
                    dateSession={dateSession} onClose={() => setShowPreview(false)} />
            )}
        </div>
    );
}
