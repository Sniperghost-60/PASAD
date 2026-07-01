import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification  from '../components/ModernNotification';
import { useAuth }         from '../contexts/AuthContext';

// ── 8 principes agroécologiques, 24 pratiques au total ──────────────────

const PRINCIPES = [
    {
        key:   'biodiversite',
        label: 'Diversité biologique',
        color: '#166534',
        items: [
            { slug: 'cultures_diversifiees', short: 'Cult. diversif.',  label: 'Utilisation de cultures diversifiées (en rotation, polycultures)' },
            { slug: 'integration_animaux',   short: 'Intégr. animaux',  label: "Intégration d'animaux dans le système (si applicable)" },
            { slug: 'biodiversite_locale',   short: 'Biodiv. locale',   label: 'Conservation et protection de la biodiversité locale (haies, zones non cultivées)' },
        ],
    },
    {
        key:   'interactions',
        label: 'Interactions bénéfiques',
        color: '#065f46',
        items: [
            { slug: 'cultures_complementaires', short: 'Cult. complémt.',  label: 'Utilisation de cultures complémentaires et de plantes associées (ex : légumineuses, cultures intercalaires)' },
            { slug: 'agroforesterie',            short: 'Agroforesterie',   label: 'Mise en place de systèmes agroforestiers ou de haies pour favoriser les interactions biologiques' },
            { slug: 'gestion_nuisibles',         short: 'Gest. nuisibles',  label: 'Gestion des nuisibles par des méthodes biologiques' },
        ],
    },
    {
        key:   'intrants',
        label: 'Minimiser les intrants',
        color: '#0f766e',
        items: [
            { slug: 'fumier_compost',      short: 'Fumier/compost', label: 'Utilisation du fumier ou compost pour enrichir le sol' },
            { slug: 'reduction_chimiques', short: 'Réduct. chim.',  label: 'Réduction des intrants chimiques (fertilisant, pesticides)' },
            { slug: 'gestion_eau',         short: 'Gestion eau',    label: "Gestion de l'eau (récupération des eaux de pluie)" },
        ],
    },
    {
        key:   'processus_biologiques',
        label: 'Processus biologiques',
        color: '#0e7490',
        items: [
            { slug: 'fixation_azote',    short: 'Fixation azote', label: "Pratique durable de la fixation biologique de l'azote" },
            { slug: 'vegetaux_fixation', short: 'Végétaux fix.',  label: "Utilisation de végétaux pour la fixation de l'azote" },
            { slug: 'lombricompost',     short: 'Lombricompost',  label: 'Présence de lombricompost ou autres techniques pour favoriser la vie du sol' },
        ],
    },
    {
        key:   'specificites_locales',
        label: 'Spécificités locales',
        color: '#1d4ed8',
        items: [
            { slug: 'varietes_adaptees', short: 'Variétés adapt.', label: 'Choix de variétés agricoles adaptées au climat local (résistance à la sécheresse, maladies)' },
            { slug: 'pratiques_locales', short: 'Prat. locales',   label: 'Pratiques agricoles adaptées aux sols locaux et spécificités culturelles' },
            { slug: 'usage_local',       short: 'Usage local',     label: "Prise en compte de l'usage local (pollution, érosion des sols, perte de biodiversité)" },
        ],
    },
    {
        key:   'impacts_env',
        label: 'Impacts environnementaux',
        color: '#4338ca',
        items: [
            { slug: 'limitation_chimiques', short: 'Limit. chim.',  label: "Limitation de l'usage de produits chimiques (engrais, pesticides)" },
            { slug: 'lutte_erosion',        short: 'Lutte érosion', label: "Mise en place de techniques de lutte contre l'érosion (terrains en pente, haies, bandes enherbées)" },
            { slug: 'protection_eaux',      short: 'Prot. eaux',    label: "Protection des cours d'eau et des écosystèmes voisins" },
        ],
    },
    {
        key:   'autonomie',
        label: 'Autonomie et résilience',
        color: '#6d28d9',
        items: [
            { slug: 'semences_locales',   short: 'Sem. locales',  label: 'Production locale et variation des semences ou de plants pour faire face aux changements climatiques' },
            { slug: 'cooperation_locale', short: 'Coop. locale',  label: "Mise en place de stratégies locales de coopération pour renforcer l'autonomie, stockage, diversification des produits" },
        ],
    },
    {
        key:   'equite',
        label: 'Équité et bien-être',
        color: '#7e22ce',
        items: [
            { slug: 'circuits_courts',          short: 'Circuits courts', label: 'Favorisation des circuits courts et des échanges locaux' },
            { slug: 'conditions_travail',       short: 'Cond. travail',   label: 'Conditions de travail respectueuses des droits humains et sociaux' },
            { slug: 'prix_equitable',           short: 'Prix équit.',     label: 'Accessibilité des produits agroécologiques à un prix équitable pour les consommateurs' },
            { slug: 'partenariats_communautes', short: 'Partenariats',    label: 'Partenariats avec les communautés locales et partage des bénéfices équitable' },
        ],
    },
];

const ALL_ITEMS  = PRINCIPES.flatMap(p => p.items.map(i => ({ ...i, principeColor: p.color })));
const ALL_SLUGS  = ALL_ITEMS.map(i => i.slug);

const emptyPratiques = () => Object.fromEntries(ALL_SLUGS.map(s => [s, false]));

const emptyRow = () => ({
    _key:               String(Date.now() + Math.random()),
    departement:        '',
    commune_nom:        '',
    arrondissement:     '',
    village:            '',
    nom_producteur:     '',
    prenoms_producteur: '',
    contact1:           '',
    contact2:           '',
    sexe:               '',
    pratiques:          emptyPratiques(),
});

const ID_COLS = [
    { field: 'departement',        label: 'Dép.',    placeholder: 'Département' },
    { field: 'commune_nom',        label: 'Commune', placeholder: 'Commune' },
    { field: 'arrondissement',     label: 'Arrond.', placeholder: 'Arrondissement' },
    { field: 'village',            label: 'Village', placeholder: 'Village' },
    { field: 'nom_producteur',     label: 'Nom',     placeholder: 'Nom' },
    { field: 'prenoms_producteur', label: 'Prénoms', placeholder: 'Prénoms' },
    { field: 'contact1',           label: 'Tél. 1',  placeholder: 'Téléphone 1' },
    { field: 'contact2',           label: 'Tél. 2',  placeholder: 'Téléphone 2' },
];

// ── Styles impression (A3 paysage) ───────────────────────────────────────

const PRINT_STYLES = [
    '@page{size:A3 landscape;margin:8mm}',
    'body{font-family:Arial,sans-serif;font-size:7px;color:#111;margin:0}',
    'h2{font-size:10px;font-weight:bold;color:#78350F;margin-bottom:3px}',
    '.meta{font-size:7px;color:#555;margin-bottom:6px}',
    'table{width:100%;border-collapse:collapse;table-layout:auto}',
    'th,td{border:1px solid #ccc;padding:2px 3px;vertical-align:middle;font-size:7px}',
    'th{background:#f3f4f6;font-weight:bold;text-align:center}',
    '.grp{color:#fff;font-weight:bold;text-align:center}',
    '.oui{color:#16a34a;font-weight:bold;text-align:center}',
    '.non{color:#dc2626;text-align:center}',
].join('');

/* ── Composant principal ────────────────────────────────────────────── */

export default function CaiAgroecologieProducteurs() {
    const { user, communeId } = useAuth();

    const [dateSession, setDateSession] = useState('');
    const [rows, setRows]               = useState([]);
    const [loading, setLoading]         = useState(false);
    const [saving, setSaving]           = useState(false);
    const [showApercu, setShowApercu]   = useState(false);
    const [notif, setNotif]             = useState({ show: false, type: 'success', message: '' });
    const printRef                      = useRef(null);

    const showToast = (type, msg) => {
        setNotif({ show: true, type, message: msg });
        setTimeout(() => setNotif(n => ({ ...n, show: false })), 4000);
    };

    const load = useCallback(async () => {
        if (!dateSession) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ date_session: dateSession });
            if (communeId) params.set('commune_id', communeId);
            const res = await fetch('/api/cai/agroecologie-producteurs?' + params, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Erreur serveur');
            const data = await res.json();
            setRows((data || []).map(r => ({
                _key:               String(r.id),
                departement:        r.departement        ?? '',
                commune_nom:        r.commune_nom        ?? '',
                arrondissement:     r.arrondissement     ?? '',
                village:            r.village            ?? '',
                nom_producteur:     r.nom_producteur     ?? '',
                prenoms_producteur: r.prenoms_producteur ?? '',
                contact1:           r.contact1           ?? '',
                contact2:           r.contact2           ?? '',
                sexe:               r.sexe               ?? '',
                pratiques:          { ...emptyPratiques(), ...(r.pratiques || {}) },
            })));
        } catch (e) {
            showToast('error', e.message);
        } finally {
            setLoading(false);
        }
    }, [dateSession, communeId]);

    useEffect(() => { load(); }, [load]);

    const setField = (idx, field, val) =>
        setRows(rs => rs.map((r, i) => i === idx ? { ...r, [field]: val } : r));

    const setPratique = (idx, slug, val) =>
        setRows(rs => rs.map((r, i) =>
            i === idx ? { ...r, pratiques: { ...r.pratiques, [slug]: val } } : r
        ));

    const addRow    = ()    => setRows(rs => [...rs, emptyRow()]);
    const removeRow = (idx) => setRows(rs => rs.filter((_, i) => i !== idx));

    const handleSave = async () => {
        if (!dateSession) { showToast('error', 'Veuillez saisir une date de session'); return; }
        setSaving(true);
        try {
            const payload = {
                date_session: dateSession,
                producteurs:  rows.map(({ _key, ...r }) => r),
            };
            if (communeId) payload.commune_id = communeId;
            const res = await fetch('/api/cai/agroecologie-producteurs', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Erreur lors de l'enregistrement");
            showToast('success', rows.length + ' producteur(s) enregistré(s)');
        } catch (e) {
            showToast('error', e.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        const content = printRef.current.innerHTML;
        const win = window.open('', '_blank');
        win.document.write('<html><head><title>Agroécologie</title><style>' + PRINT_STYLES + '</style></head><body>' + content + '</body></html>');
        win.document.close();
        win.focus();
        win.print();
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="ml-60 flex flex-1 flex-col">
                <Header />
                <div className="flex-1 bg-amber-50/30">

                    {/* Sous-entête */}
                    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-amber-200 px-6 py-3 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-semibold tracking-widest text-amber-600 uppercase">CAI · Phase 2 · Étape 6</p>
                            <h1 className="text-lg font-bold text-amber-900">Principes de production agroécologique</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={dateSession}
                                onChange={e => setDateSession(e.target.value)}
                                className="border border-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                            />
                            <button
                                onClick={() => setShowApercu(true)}
                                className="flex items-center gap-1.5 bg-white border border-amber-300 text-amber-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-50 transition"
                            >
                                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                </svg>
                                Aperçu
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-1.5 bg-amber-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-amber-800 disabled:opacity-60 transition"
                            >
                                {saving ? (
                                    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                    </svg>
                                ) : (
                                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                                    </svg>
                                )}
                                {saving ? 'Enregistrement…' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <ModernNotification show={notif.show} type={notif.type} message={notif.message} />

                        {loading ? (
                            <div className="flex justify-center items-center h-48">
                                <svg className="size-8 animate-spin text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                </svg>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-amber-100">
                                <div className="overflow-x-auto">
                                    <table className="text-xs border-collapse" style={{ minWidth: '2200px' }}>
                                        <thead>
                                            {/* Ligne 1 : Identification + groupes */}
                                            <tr>
                                                <th
                                                    colSpan={ID_COLS.length}
                                                    className="border border-amber-700 px-2 py-2 text-center text-white font-bold bg-amber-800"
                                                >
                                                    Identification du producteur
                                                </th>
                                                <th className="border border-amber-700 px-1 py-2 text-center text-white font-bold bg-amber-800 w-10">
                                                    Sexe
                                                </th>
                                                {PRINCIPES.map(p => (
                                                    <th
                                                        key={p.key}
                                                        colSpan={p.items.length}
                                                        className="border border-gray-300 px-1 py-1.5 text-center text-white text-[10px] font-bold"
                                                        style={{ backgroundColor: p.color }}
                                                    >
                                                        {p.label}
                                                    </th>
                                                ))}
                                                <th className="border border-gray-300 w-8 bg-gray-100"></th>
                                            </tr>
                                            {/* Ligne 2 : Colonnes individuelles */}
                                            <tr className="bg-gray-50">
                                                {ID_COLS.map(c => (
                                                    <th key={c.field} className="border border-gray-200 px-2 py-1.5 text-center text-[10px] text-gray-700 font-semibold whitespace-nowrap">
                                                        {c.label}
                                                    </th>
                                                ))}
                                                <th className="border border-gray-200 px-1 py-1.5 text-center text-[10px] text-gray-700 font-semibold">Sexe</th>
                                                {ALL_ITEMS.map(item => (
                                                    <th
                                                        key={item.slug}
                                                        title={item.label}
                                                        className="border border-gray-200 px-1 py-1.5 text-center text-[9px] text-gray-600 font-medium"
                                                        style={{ minWidth: '62px', maxWidth: '70px' }}
                                                    >
                                                        {item.short}
                                                    </th>
                                                ))}
                                                <th className="border border-gray-200 w-8 bg-gray-50"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={ID_COLS.length + 1 + ALL_SLUGS.length + 1} className="text-center py-10 text-gray-400 text-xs italic">
                                                        Aucun producteur — cliquez sur «&nbsp;Ajouter un producteur&nbsp;»
                                                    </td>
                                                </tr>
                                            ) : rows.map((row, idx) => (
                                                <tr key={row._key} className="hover:bg-amber-50/30">
                                                    {ID_COLS.map(c => (
                                                        <td key={c.field} className="border border-gray-200 p-0.5">
                                                            <input
                                                                type="text"
                                                                value={row[c.field]}
                                                                onChange={e => setField(idx, c.field, e.target.value)}
                                                                placeholder={c.placeholder}
                                                                className="w-full px-1.5 py-1 text-xs bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-amber-300 rounded min-w-[72px]"
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="border border-gray-200 p-0.5">
                                                        <select
                                                            value={row.sexe}
                                                            onChange={e => setField(idx, 'sexe', e.target.value)}
                                                            className="w-full px-1 py-1 text-xs bg-transparent border-0 focus:outline-none cursor-pointer"
                                                        >
                                                            <option value="">-</option>
                                                            <option value="M">M</option>
                                                            <option value="F">F</option>
                                                        </select>
                                                    </td>
                                                    {ALL_ITEMS.map(item => (
                                                        <td key={item.slug} className="border border-gray-200 p-0 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!row.pratiques[item.slug]}
                                                                onChange={e => setPratique(idx, item.slug, e.target.checked)}
                                                                className="size-3.5 accent-green-600 cursor-pointer"
                                                                title={item.label}
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="border border-gray-200 p-0 text-center">
                                                        <button
                                                            onClick={() => removeRow(idx)}
                                                            className="text-red-400 hover:text-red-600 p-1.5 transition"
                                                            title="Supprimer cette ligne"
                                                        >
                                                            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Bouton ajouter */}
                                <div className="p-3 border-t border-gray-100">
                                    <button
                                        onClick={addRow}
                                        className="flex items-center gap-2 text-amber-700 border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                                    >
                                        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 5v14M5 12h14" />
                                        </svg>
                                        Ajouter un producteur
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal aperçu */}
                {showApercu && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-bold text-amber-900">Aperçu — Principes agroécologiques</h2>
                                <div className="flex gap-2">
                                    <button onClick={handlePrint} className="bg-amber-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-amber-800 transition">
                                        Imprimer
                                    </button>
                                    <button onClick={() => setShowApercu(false)} className="text-gray-500 hover:text-gray-700 px-3 py-1.5 text-sm">
                                        Fermer
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-auto flex-1 p-4 text-xs" ref={printRef}>
                                <h2>Fiches de respect des principes de production agroécologique</h2>
                                <p className="meta">
                                    {dateSession && ('Session : ' + dateSession)}
                                    {user && (' · Agent : ' + user.name)}
                                    {' · ' + rows.length + ' producteur(s)'}
                                </p>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                                    <thead>
                                        <tr>
                                            {ID_COLS.map(c => (
                                                <th key={c.field} style={{ border: '1px solid #ccc', padding: '3px 5px', background: '#78350F', color: '#fff' }}>
                                                    {c.label}
                                                </th>
                                            ))}
                                            <th style={{ border: '1px solid #ccc', padding: '3px 5px', background: '#78350F', color: '#fff' }}>Sexe</th>
                                            {PRINCIPES.map(p => (
                                                <th
                                                    key={p.key}
                                                    colSpan={p.items.length}
                                                    className="grp"
                                                    style={{ border: '1px solid #ccc', padding: '3px 5px', backgroundColor: p.color, color: '#fff', textAlign: 'center' }}
                                                >
                                                    {p.label}
                                                </th>
                                            ))}
                                        </tr>
                                        <tr>
                                            {ID_COLS.map(c => (
                                                <th key={'h2-' + c.field} style={{ border: '1px solid #ccc', padding: '2px', background: '#f3f4f6' }}></th>
                                            ))}
                                            <th style={{ border: '1px solid #ccc', padding: '2px', background: '#f3f4f6' }}></th>
                                            {ALL_ITEMS.map(item => (
                                                <th key={'h2-' + item.slug} title={item.label} style={{ border: '1px solid #ccc', padding: '2px 3px', background: '#f3f4f6', fontSize: '9px', textAlign: 'center' }}>
                                                    {item.short}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, idx) => (
                                            <tr key={idx}>
                                                {ID_COLS.map(c => (
                                                    <td key={c.field} style={{ border: '1px solid #ccc', padding: '2px 4px' }}>{row[c.field]}</td>
                                                ))}
                                                <td style={{ border: '1px solid #ccc', padding: '2px 4px', textAlign: 'center' }}>{row.sexe}</td>
                                                {ALL_ITEMS.map(item => (
                                                    <td key={item.slug} style={{ border: '1px solid #ccc', padding: '2px', textAlign: 'center' }}>
                                                        {row.pratiques[item.slug]
                                                            ? <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>
                                                            : <span style={{ color: '#dc2626' }}>✗</span>}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
