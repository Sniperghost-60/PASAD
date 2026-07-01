import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification  from '../components/ModernNotification';
import { useAuth } from '../contexts/AuthContext';

const AMBER_DARK = '#78350F';

const GROUPES = [
    {
        label: 'Charges variables',
        color: '#166534',
        items: [
            { slug: 'pretransformation',          label: 'Pré-transformation (égrenage, décorticage, triage, battage, vannage, dépathage etc)' },
            { slug: 'transport',                  label: 'Transport' },
            { slug: 'emballage',                  label: 'Emballage approprié selon le type de produit' },
            { slug: 'entreposage',                label: 'Entreposage' },
            { slug: 'produits_conservation',      label: 'Produits de conservation' },
            { slug: 'interets_commercialisation', label: 'Intérêts financiers (crédit de commercialisation)' },
        ],
    },
    {
        label: 'Charges fixes',
        color: '#1d4ed8',
        items: [
            { slug: 'amortissement',           label: 'Amortissement (équipements et infrastructures)' },
            { slug: 'interets_investissement', label: "Intérêts financiers (crédit d'investissement)" },
        ],
    },
    {
        label: 'Autres charges',
        color: '#7e22ce',
        items: [
            { slug: 'inspection_conseil',  label: 'Inspection des produits/conseil' },
            { slug: 'taxes_marche',        label: 'Taxes de marché' },
            { slug: 'intermediaires',      label: 'Intermédiaires' },
            { slug: 'promotion_publicite', label: 'Promotion/publicité' },
            { slug: 'pertes',              label: 'Pertes' },
        ],
    },
];

const ALL_SLUGS = GROUPES.flatMap(g => g.items.map(i => i.slug));
const MARCHES   = ['marche1', 'marche2', 'marche3'];

const emptyMarche  = () => Object.fromEntries([...ALL_SLUGS, 'produit_brut'].map(s => [s, '']));
const emptyDonnees = () => ({ marche1: emptyMarche(), marche2: emptyMarche(), marche3: emptyMarche() });

const num = v => parseFloat(v) || 0;
const fmtNum = v => {
    const n = num(v);
    return n ? n.toLocaleString('fr-FR') : '';
};

const PRINT_STYLES = [
    'body{font-family:Arial,sans-serif;font-size:9pt;margin:0;padding:8mm}',
    'h2{font-size:12pt;color:#78350F;margin-bottom:4px}',
    'h3{font-size:10pt;color:#92400E;margin-bottom:10px}',
    'table{border-collapse:collapse;width:100%}',
    'th,td{border:1px solid #ccc;padding:4px 8px;font-size:8.5pt;vertical-align:top}',
    '.groupe-hdr{color:#fff;font-weight:bold;padding:4px 8px}',
    '.total-row td{font-weight:bold;background:#fef3c7}',
    '.brut-row td{font-weight:bold;background:#f0fdf4}',
    '.marge-row td{font-weight:bold;background:#e0f2fe}',
    '.pos{color:#166534}',
    '.neg{color:#991b1b}',
    '@page{size:A4 landscape;margin:8mm}',
].join('');

export default function CaiAppuiMarche() {
    const { user, communeId } = useAuth();
    const today = new Date().toISOString().slice(0, 10);
    const [dateSession, setDateSession] = useState(today);
    const [donnees, setDonnees]         = useState(emptyDonnees());
    const [loading, setLoading]         = useState(false);
    const [saving, setSaving]           = useState(false);
    const [showApercu, setShowApercu]   = useState(false);
    const [notif, setNotif]             = useState({ show: false, type: 'success', message: '' });
    const printRef = useRef(null);

    const showNotif = (type, message) => {
        setNotif({ show: true, type, message });
        setTimeout(() => setNotif(n => ({ ...n, show: false })), 3500);
    };

    const loadData = useCallback(async () => {
        if (!dateSession) return;
        setLoading(true);
        try {
            let url = '/api/cai/appui-marche?date_session=' + dateSession;
            if (communeId) url += '&commune_id=' + communeId;
            const res = await fetch(url, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.donnees) {
                    const base = emptyDonnees();
                    MARCHES.forEach(mk => {
                        if (data.donnees[mk]) Object.assign(base[mk], data.donnees[mk]);
                    });
                    setDonnees(base);
                } else {
                    setDonnees(emptyDonnees());
                }
            }
        } catch {
            showNotif('error', 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [dateSession, communeId]);

    useEffect(() => { loadData(); }, [loadData]);

    const setValue = (mk, slug, val) => {
        setDonnees(prev => ({ ...prev, [mk]: { ...prev[mk], [slug]: val } }));
    };

    const chargesTotal = mk => ALL_SLUGS.reduce((s, slug) => s + num(donnees[mk][slug]), 0);
    const margeBrute   = mk => num(donnees[mk].produit_brut) - chargesTotal(mk);

    const handleSave = async () => {
        if (!dateSession) { showNotif('error', 'Date de session requise'); return; }
        setSaving(true);
        try {
            const payload = { date_session: dateSession, donnees };
            if (communeId) payload.commune_id = communeId;
            const res = await fetch('/api/cai/appui-marche', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                showNotif('success', 'Données enregistrées avec succès');
            } else {
                showNotif('error', "Erreur lors de l'enregistrement");
            }
        } catch {
            showNotif('error', 'Erreur réseau');
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        if (!printRef.current) return;
        const content = printRef.current.innerHTML;
        const w = window.open('', '_blank');
        w.document.write('<html><head><style>' + PRINT_STYLES + '</style></head><body>' + content + '</body></html>');
        w.document.close();
        w.print();
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="ml-60 flex flex-1 flex-col">
                <Header />
                <main className="flex-1 overflow-auto p-6">
                    <ModernNotification show={notif.show} type={notif.type} message={notif.message} />

                    {/* En-tête */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: AMBER_DARK }}>
                                Étape 9
                            </span>
                            <h1 className="text-2xl font-bold" style={{ color: AMBER_DARK }}>
                                Appui au Choix des marchés
                            </h1>
                        </div>
                        <p className="text-gray-600 text-sm">Modèle de compte Prévisionnel de Mise en marché</p>
                    </div>

                    {/* Filtre date */}
                    <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-4 mb-6">
                        <div className="flex flex-wrap items-end gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Date de session</label>
                                <input
                                    type="date"
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    value={dateSession}
                                    onChange={e => setDateSession(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={loadData}
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                                style={{ background: AMBER_DARK }}
                            >
                                Charger
                            </button>
                        </div>
                    </div>

                    {/* Table principale */}
                    <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-4 mb-6">
                        {loading ? (
                            <div className="text-center py-8 text-gray-400">Chargement...</div>
                        ) : (
                            <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                                <colgroup>
                                    <col style={{ width: '46%' }} />
                                    <col style={{ width: '18%' }} />
                                    <col style={{ width: '18%' }} />
                                    <col style={{ width: '18%' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th style={{ background: AMBER_DARK, color: '#fff', padding: '8px', textAlign: 'left', borderRadius: '6px 0 0 0' }}>
                                            Intitulés
                                        </th>
                                        {MARCHES.map((mk, i) => (
                                            <th key={mk} style={{ background: '#92400E', color: '#fff', padding: '8px', textAlign: 'center' }}>
                                                Marché {i + 1}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {GROUPES.map(groupe => (
                                        <React.Fragment key={groupe.label}>
                                            <tr>
                                                <td colSpan={4} style={{ background: groupe.color, color: '#fff', fontWeight: '700', padding: '5px 10px', fontSize: '0.85rem' }}>
                                                    {groupe.label}
                                                </td>
                                            </tr>
                                            {groupe.items.map(item => (
                                                <tr key={item.slug} className="hover:bg-amber-50">
                                                    <td style={{ paddingLeft: '20px', fontSize: '0.85rem', borderBottom: '1px solid #f3f4f6', paddingTop: '4px', paddingBottom: '4px', color: '#374151' }}>
                                                        {item.label}
                                                    </td>
                                                    {MARCHES.map(mk => (
                                                        <td key={mk} style={{ borderBottom: '1px solid #f3f4f6', padding: '3px 6px' }}>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="any"
                                                                className="w-full border border-gray-200 rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 bg-gray-50"
                                                                value={donnees[mk][item.slug]}
                                                                onChange={e => setValue(mk, item.slug, e.target.value)}
                                                                placeholder="0"
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}

                                    {/* Charges totales */}
                                    <tr style={{ background: '#fef3c7', borderTop: '2px solid #d97706' }}>
                                        <td style={{ fontWeight: '700', padding: '7px 10px', color: '#92400E' }}>
                                            Charges totales
                                        </td>
                                        {MARCHES.map(mk => (
                                            <td key={mk} style={{ fontWeight: '700', textAlign: 'right', padding: '7px 10px', color: '#92400E' }}>
                                                {chargesTotal(mk).toLocaleString('fr-FR')}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Produit brut */}
                                    <tr style={{ background: '#f0fdf4' }}>
                                        <td style={{ fontWeight: '700', padding: '5px 10px', color: '#166534', fontSize: '0.875rem' }}>
                                            Produit brut
                                        </td>
                                        {MARCHES.map(mk => (
                                            <td key={mk} style={{ padding: '3px 6px' }}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    className="w-full border border-green-200 rounded px-2 py-1 text-right text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                                                    value={donnees[mk].produit_brut}
                                                    onChange={e => setValue(mk, 'produit_brut', e.target.value)}
                                                    placeholder="0"
                                                />
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Marge brute */}
                                    <tr style={{ background: '#e0f2fe', borderTop: '2px solid #0284c7' }}>
                                        <td style={{ fontWeight: '700', padding: '7px 10px', color: '#0c4a6e' }}>
                                            Marge brute
                                        </td>
                                        {MARCHES.map(mk => {
                                            const mb = margeBrute(mk);
                                            return (
                                                <td key={mk} style={{ fontWeight: '700', textAlign: 'right', padding: '7px 10px', color: mb >= 0 ? '#166534' : '#991b1b' }}>
                                                    {mb.toLocaleString('fr-FR')}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setShowApercu(true)}
                            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Aperçu / Imprimer
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                            style={{ background: AMBER_DARK }}
                        >
                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </main>
            </div>

            {/* Modal Aperçu */}
            {showApercu && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="font-bold text-lg" style={{ color: AMBER_DARK }}>
                                Aperçu — Compte Prévisionnel de Mise en marché
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    Imprimer
                                </button>
                                <button
                                    onClick={() => setShowApercu(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                        <div className="overflow-auto flex-1 p-6" ref={printRef}>
                            <h2 style={{ color: AMBER_DARK, marginBottom: '2px', fontSize: '15px', fontWeight: '700' }}>
                                Étape 9 — Appui au Choix des marchés
                            </h2>
                            <h3 style={{ color: '#92400E', marginBottom: '12px', fontSize: '13px', fontWeight: '600' }}>
                                Compte Prévisionnel de Mise en marché — Session : {dateSession}
                            </h3>
                            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th style={{ border: '1px solid #ccc', padding: '6px 10px', background: AMBER_DARK, color: '#fff', textAlign: 'left', width: '46%' }}>
                                            Intitulés
                                        </th>
                                        {MARCHES.map((mk, i) => (
                                            <th key={mk} style={{ border: '1px solid #ccc', padding: '6px 10px', background: '#92400E', color: '#fff', textAlign: 'center' }}>
                                                Marché {i + 1}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {GROUPES.map(groupe => (
                                        <React.Fragment key={groupe.label}>
                                            <tr>
                                                <td colSpan={4} className="groupe-hdr" style={{ background: groupe.color, color: '#fff', fontWeight: '700', padding: '4px 10px', border: '1px solid #ccc', fontSize: '0.875rem' }}>
                                                    {groupe.label}
                                                </td>
                                            </tr>
                                            {groupe.items.map(item => (
                                                <tr key={item.slug}>
                                                    <td style={{ border: '1px solid #e5e7eb', padding: '4px 10px 4px 22px', fontSize: '0.85rem', color: '#374151' }}>
                                                        {item.label}
                                                    </td>
                                                    {MARCHES.map(mk => (
                                                        <td key={mk} style={{ border: '1px solid #e5e7eb', padding: '4px 10px', textAlign: 'right', fontSize: '0.85rem' }}>
                                                            {fmtNum(donnees[mk][item.slug])}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                    <tr className="total-row" style={{ background: '#fef3c7' }}>
                                        <td style={{ fontWeight: '700', padding: '6px 10px', border: '2px solid #d97706', color: '#92400E' }}>
                                            Charges totales
                                        </td>
                                        {MARCHES.map(mk => (
                                            <td key={mk} style={{ fontWeight: '700', textAlign: 'right', padding: '6px 10px', border: '2px solid #d97706', color: '#92400E' }}>
                                                {chargesTotal(mk).toLocaleString('fr-FR')}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="brut-row" style={{ background: '#f0fdf4' }}>
                                        <td style={{ fontWeight: '700', padding: '6px 10px', border: '1px solid #ccc', color: '#166534' }}>
                                            Produit brut
                                        </td>
                                        {MARCHES.map(mk => (
                                            <td key={mk} style={{ fontWeight: '700', textAlign: 'right', padding: '6px 10px', border: '1px solid #ccc', color: '#166534' }}>
                                                {fmtNum(donnees[mk].produit_brut)}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="marge-row" style={{ background: '#e0f2fe' }}>
                                        <td style={{ fontWeight: '700', padding: '6px 10px', border: '2px solid #0284c7', color: '#0c4a6e' }}>
                                            Marge brute
                                        </td>
                                        {MARCHES.map(mk => {
                                            const mb = margeBrute(mk);
                                            return (
                                                <td key={mk} className={mb >= 0 ? 'pos' : 'neg'} style={{ fontWeight: '700', textAlign: 'right', padding: '6px 10px', border: '2px solid #0284c7', color: mb >= 0 ? '#166534' : '#991b1b' }}>
                                                    {mb.toLocaleString('fr-FR')}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
