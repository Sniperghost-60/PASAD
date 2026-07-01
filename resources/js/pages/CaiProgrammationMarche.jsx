import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification  from '../components/ModernNotification';
import { useAuth } from '../contexts/AuthContext';

const AMBER_DARK = '#78350F';
const MOIS    = ['m1', 'm2', 'm3'];
const DECADES = ['d1', 'd2', 'd3'];

const GROUPES = [
    {
        label: 'Partenariats et Négociation de partenariat',
        color: '#1d4ed8',
        items: [
            { slug: 'negocier_transport',  label: 'Négocier le transport' },
            { slug: 'negocier_entrepots',  label: 'Négocier les entrepôts' },
            { slug: 'negocier_acheteurs',  label: 'Négocier les acheteurs' },
        ],
    },
    {
        label: "Services d'appui pour la qualité, traçabilité et la promotion",
        color: '#0f766e',
        items: [
            { slug: 'faire_inspecter',    label: 'Faire inspecter' },
            { slug: 'faire_certifier',    label: 'Faire certifier ou labeliser' },
            { slug: 'solliciter_conseil', label: 'Solliciter du conseil' },
        ],
    },
    {
        label: 'Mise en marché',
        color: '#92400E',
        items: [
            { slug: 'conditionnement',      label: 'Conditionnement' },
            { slug: 'transport_produits',   label: 'Transport des produits' },
            { slug: 'exposition_livraison', label: 'Exposition ou livraison' },
        ],
    },
];

const ALL_SLUGS = GROUPES.flatMap(g => g.items.map(i => i.slug));
const ck = (slug, m, d) => slug + '_' + m + '_' + d;

const emptyDonnees = () => {
    const obj = {};
    ALL_SLUGS.forEach(slug =>
        MOIS.forEach(m =>
            DECADES.forEach(d => { obj[ck(slug, m, d)] = ''; })
        )
    );
    return obj;
};

const PRINT_STYLES = [
    'body{font-family:Arial,sans-serif;font-size:8pt;margin:0;padding:8mm}',
    'h2{font-size:11pt;color:#78350F;margin-bottom:3px}',
    'h3{font-size:9pt;color:#92400E;margin-bottom:8px}',
    'table{border-collapse:collapse;width:100%}',
    'th,td{border:1px solid #ccc;padding:3px 5px;font-size:7.5pt;text-align:center;vertical-align:middle}',
    'th{background:#f5f5f5;font-weight:bold}',
    '.op-col{text-align:left}',
    '.grp{color:#fff;font-weight:bold;text-align:left;padding:3px 6px}',
    '@page{size:A4 landscape;margin:8mm}',
].join('');

export default function CaiProgrammationMarche() {
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
            let url = '/api/cai/programmation-marche?date_session=' + dateSession;
            if (communeId) url += '&commune_id=' + communeId;
            const res = await fetch(url, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.donnees) {
                    setDonnees({ ...emptyDonnees(), ...data.donnees });
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

    const setValue = (key, val) => setDonnees(prev => ({ ...prev, [key]: val }));

    const handleSave = async () => {
        if (!dateSession) { showNotif('error', 'Date de session requise'); return; }
        setSaving(true);
        try {
            const payload = { date_session: dateSession, donnees };
            if (communeId) payload.commune_id = communeId;
            const res = await fetch('/api/cai/programmation-marche', {
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

    const renderTable = (forPrint = false) => {
        const cellStyle = forPrint
            ? { border: '1px solid #ccc', padding: '3px 4px', fontSize: '7.5pt', textAlign: 'center', minWidth: '60px' }
            : { padding: '2px 3px', borderBottom: '1px solid #f3f4f6' };

        return (
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: forPrint ? undefined : '1050px' }}>
                <thead>
                    <tr>
                        <th rowSpan={2} style={{
                            border: '1px solid #ccc', padding: '6px 10px', background: AMBER_DARK,
                            color: '#fff', textAlign: 'left', minWidth: '180px', verticalAlign: 'middle',
                        }}>
                            Opérations
                        </th>
                        {MOIS.map((m, i) => (
                            <th key={m} colSpan={3} style={{
                                border: '1px solid #ccc', padding: '5px', background: '#92400E',
                                color: '#fff', textAlign: 'center',
                            }}>
                                Mois {i + 1}
                            </th>
                        ))}
                    </tr>
                    <tr>
                        {MOIS.flatMap((m, mi) =>
                            DECADES.map((d, di) => (
                                <th key={m + d} style={{
                                    border: '1px solid #ccc', padding: '4px 6px',
                                    background: mi % 2 === 0 ? '#fef3c7' : '#fde68a',
                                    color: AMBER_DARK, fontSize: '0.8rem', minWidth: '80px',
                                }}>
                                    D{di + 1}
                                </th>
                            ))
                        )}
                    </tr>
                </thead>
                <tbody>
                    {GROUPES.map(groupe => (
                        <React.Fragment key={groupe.label}>
                            <tr>
                                <td colSpan={10} style={{
                                    background: groupe.color, color: '#fff', fontWeight: '700',
                                    padding: '4px 10px', fontSize: '0.85rem',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                }}>
                                    {groupe.label}
                                </td>
                            </tr>
                            {groupe.items.map(item => (
                                <tr key={item.slug} className={forPrint ? '' : 'hover:bg-amber-50'}>
                                    <td style={{
                                        paddingLeft: '18px', fontSize: '0.85rem', color: '#374151',
                                        borderBottom: '1px solid #f3f4f6', paddingTop: '4px', paddingBottom: '4px',
                                        borderRight: '1px solid #e5e7eb',
                                    }}>
                                        {item.label}
                                    </td>
                                    {MOIS.flatMap(m =>
                                        DECADES.map(d => {
                                            const key = ck(item.slug, m, d);
                                            return (
                                                <td key={key} style={cellStyle}>
                                                    {forPrint ? (
                                                        <span>{donnees[key]}</span>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            maxLength={20}
                                                            className="w-full border border-gray-200 rounded px-1 py-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 bg-gray-50"
                                                            value={donnees[key]}
                                                            onChange={e => setValue(key, e.target.value)}
                                                            placeholder="—"
                                                        />
                                                    )}
                                                </td>
                                            );
                                        })
                                    )}
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        );
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
                                Étape 10
                            </span>
                            <h1 className="text-2xl font-bold" style={{ color: AMBER_DARK }}>
                                Appui à la programmation de la mise en marché
                            </h1>
                        </div>
                        <p className="text-gray-600 text-sm">Tableau de planification de la mise en marché des produits</p>
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

                    {/* Tableau */}
                    <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-4 mb-6 overflow-x-auto">
                        {loading ? (
                            <div className="text-center py-8 text-gray-400">Chargement...</div>
                        ) : renderTable(false)}
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="font-bold text-lg" style={{ color: AMBER_DARK }}>
                                Aperçu — Programmation de la mise en marché
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
                            <h2 style={{ color: AMBER_DARK, marginBottom: '2px', fontSize: '14px', fontWeight: '700' }}>
                                Étape 10 — Appui à la programmation de la mise en marché
                            </h2>
                            <h3 style={{ color: '#92400E', marginBottom: '12px', fontSize: '12px', fontWeight: '600' }}>
                                Tableau de planification — Session : {dateSession}
                            </h3>
                            {renderTable(true)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
