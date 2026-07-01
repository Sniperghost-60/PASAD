import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification  from '../components/ModernNotification';
import { useAuth }         from '../contexts/AuthContext';

// ── Paramètres fixes ────────────────────────────────────────────────────

const CATEGORIES = [
    {
        key:   'produit',
        label: 'Produit',
        color: 'bg-teal-700',
        params: [
            { slug: 'nature_produit',                   label: 'Nature du produit' },
            { slug: 'normes_production',                label: 'Normes de production' },
            { slug: 'caracteristiques_organoleptiques', label: 'Caractéristiques organoleptiques' },
            { slug: 'qualite_usage',                    label: "Qualité d'usage" },
        ],
    },
    {
        key:   'promotion_commercialisation',
        label: 'Promotion et commercialisation',
        color: 'bg-blue-700',
        params: [
            { slug: 'presentation_produit',      label: 'Présentation du produit' },
            { slug: 'prix',                      label: 'Prix (mini, maxi, médian)' },
            { slug: 'clientele',                 label: 'Clientèle' },
            { slug: 'quantite',                  label: 'Quantité' },
            { slug: 'mode_commercialisation',    label: 'Mode de commercialisation' },
            { slug: 'marketing',                 label: 'Marketing' },
            { slug: 'tracabilite_certification', label: 'Traçabilité et/ou certification' },
        ],
    },
    {
        key:   'liens_affaire',
        label: "Liens d'affaire",
        color: 'bg-purple-700',
        params: [
            { slug: 'partenariats_fournisseurs', label: "Partenariats avec fournisseurs d'intrants et services" },
            { slug: 'services_appui',            label: "Services d'appui (conseil, contrôle, certification, etc.)" },
            { slug: 'autres_facilites',          label: 'Autres facilités' },
        ],
    },
];

const ALL_SLUGS = CATEGORIES.flatMap(c => c.params.map(p => ({ ...p, categorie: c.key })));

const emptyData = () => Object.fromEntries(
    ALL_SLUGS.map(p => [p.slug, { tendances_marches: '', situation_exploitation: '', ecarts_combler: '' }])
);

// ── Styles impression ────────────────────────────────────────────────────

const PRINT_STYLES = [
    'body{font-family:Arial,sans-serif;font-size:11px;color:#111;margin:16px}',
    'h2{font-size:14px;font-weight:bold;color:#78350F;margin-bottom:6px}',
    '.meta{font-size:11px;color:#555;margin-bottom:12px}',
    'table{width:100%;border-collapse:collapse}',
    'th,td{border:1px solid #ccc;padding:5px 7px;vertical-align:top}',
    'th{background:#f3f4f6;font-weight:bold;font-size:11px}',
    '.cat-cell{font-weight:bold;text-align:center;color:#fff;font-size:11px}',
    '.cat-produit{background:#0f766e}.cat-promotion{background:#1d4ed8}.cat-liens{background:#7e22ce}',
    '.param-label{font-weight:600;font-size:11px}',
].join('');

/* ── Page principale ────────────────────────────────────────────────── */

export default function CaiEtudeMarche() {
    const { user, communeId } = useAuth();

    const [dateSession, setDateSession] = useState('');
    const [data, setData]               = useState(emptyData);
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
            const res = await fetch('/api/cai/etude-marche?' + params, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Erreur serveur');
            const rows = await res.json();
            const next = emptyData();
            (rows || []).forEach(r => {
                if (next[r.parametre]) {
                    next[r.parametre] = {
                        tendances_marches:      r.tendances_marches      ?? '',
                        situation_exploitation: r.situation_exploitation ?? '',
                        ecarts_combler:         r.ecarts_combler         ?? '',
                    };
                }
            });
            setData(next);
        } catch (e) {
            showToast('error', e.message);
        } finally {
            setLoading(false);
        }
    }, [dateSession, communeId]);

    useEffect(() => { load(); }, [load]);

    const setCell = (slug, field, value) =>
        setData(d => ({ ...d, [slug]: { ...d[slug], [field]: value } }));

    const handleSave = async () => {
        if (!dateSession) { showToast('error', 'Veuillez saisir une date de session'); return; }
        setSaving(true);
        try {
            const rows = ALL_SLUGS.map(p => ({
                categorie:              p.categorie,
                parametre:              p.slug,
                tendances_marches:      data[p.slug].tendances_marches,
                situation_exploitation: data[p.slug].situation_exploitation,
                ecarts_combler:         data[p.slug].ecarts_combler,
            }));
            const payload = { date_session: dateSession, rows };
            if (communeId) payload.commune_id = communeId;

            const res = await fetch('/api/cai/etude-marche', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Erreur lors de l'enregistrement");
            showToast('success', 'Fiche enregistrée avec succès');
        } catch (e) {
            showToast('error', e.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        const content = printRef.current.innerHTML;
        const win = window.open('', '_blank');
        win.document.write('<html><head><title>Étude de marché</title><style>' + PRINT_STYLES + '</style></head><body>' + content + '</body></html>');
        win.document.close();
        win.focus();
        win.print();
    };

    const commune = user?.commune?.nom_commune ?? '';

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="ml-60 flex flex-1 flex-col">
                <Header />
                <div className="flex-1 bg-amber-50/30">
                    {/* Sous-entête */}
                    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-amber-200 px-6 py-3 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-semibold tracking-widest text-amber-600 uppercase">CAI · Phase 2 · Étape 5</p>
                            <h1 className="text-lg font-bold text-amber-900">Fiche de synthèse d'une étude de marché</h1>
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
                            <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-amber-800 text-white">
                                            <th className="border border-amber-700 px-3 py-3 text-left font-semibold w-28">Catégorie</th>
                                            <th className="border border-amber-700 px-3 py-3 text-left font-semibold w-48">Facteurs et paramètres de mise en marchés</th>
                                            <th className="border border-amber-700 px-3 py-3 text-left font-semibold">Tendances des marchés</th>
                                            <th className="border border-amber-700 px-3 py-3 text-left font-semibold">Situation de l'exploitation</th>
                                            <th className="border border-amber-700 px-3 py-3 text-left font-semibold">Écarts à combler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {CATEGORIES.map(cat =>
                                            cat.params.map((param, pi) => (
                                                <tr key={param.slug} className="hover:bg-amber-50/40">
                                                    {pi === 0 && (
                                                        <td
                                                            rowSpan={cat.params.length}
                                                            className={'border border-gray-200 px-2 py-2 text-center text-white text-xs font-bold align-middle ' + cat.color}
                                                        >
                                                            {cat.label}
                                                        </td>
                                                    )}
                                                    <td className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50">
                                                        {param.label}
                                                    </td>
                                                    {['tendances_marches', 'situation_exploitation', 'ecarts_combler'].map(field => (
                                                        <td key={field} className="border border-gray-200 p-1">
                                                            <textarea
                                                                rows={2}
                                                                value={data[param.slug][field]}
                                                                onChange={e => setCell(param.slug, field, e.target.value)}
                                                                className="w-full resize-none rounded border-0 bg-transparent px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-300 focus:bg-amber-50/50 transition min-h-[52px]"
                                                                placeholder="…"
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal aperçu */}
                {showApercu && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-bold text-amber-900">Aperçu — Étude de marché</h2>
                                <div className="flex gap-2">
                                    <button onClick={handlePrint} className="bg-amber-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-amber-800 transition">
                                        Imprimer
                                    </button>
                                    <button onClick={() => setShowApercu(false)} className="text-gray-500 hover:text-gray-700 px-3 py-1.5 text-sm">
                                        Fermer
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-auto flex-1 p-6" ref={printRef}>
                                <h2>Fiche de synthèse — Étude de marché</h2>
                                <p className="meta">
                                    {commune && ('Commune : ' + commune + ' · ')}
                                    {dateSession && ('Session : ' + dateSession)}
                                    {user && (' · Agent : ' + user.name)}
                                </p>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Catégorie</th>
                                            <th>Facteurs et paramètres</th>
                                            <th>Tendances des marchés</th>
                                            <th>Situation de l'exploitation</th>
                                            <th>Écarts à combler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {CATEGORIES.map(cat =>
                                            cat.params.map((param, pi) => (
                                                <tr key={param.slug}>
                                                    {pi === 0 && (
                                                        <td
                                                            rowSpan={cat.params.length}
                                                            className={'cat-cell cat-' + (cat.key === 'produit' ? 'produit' : cat.key === 'promotion_commercialisation' ? 'promotion' : 'liens')}
                                                        >
                                                            {cat.label}
                                                        </td>
                                                    )}
                                                    <td className="param-label">{param.label}</td>
                                                    <td>{data[param.slug].tendances_marches}</td>
                                                    <td>{data[param.slug].situation_exploitation}</td>
                                                    <td>{data[param.slug].ecarts_combler}</td>
                                                </tr>
                                            ))
                                        )}
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
