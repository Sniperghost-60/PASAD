import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification  from '../components/ModernNotification';
import { useAuth } from '../contexts/AuthContext';

const AMBER_DARK = '#78350F';

const COLUMNS = [
    { key: 'periode',       label: 'Période de réalisation',                       width: '110px' },
    { key: 'activites',     label: 'Activités réalisées dans la zone',              width: '180px' },
    { key: 'zone',          label: 'Zone concernée',                                width: '110px' },
    { key: 'groupe_cible',  label: 'Groupe cible et lieu',                          width: '140px' },
    { key: 'acteurs',       label: 'Acteurs Responsables',                          width: '140px' },
    { key: 'appuis',        label: 'Appuis sollicités (Types de mise en œuvre)',    width: '155px' },
    { key: 'moyens',        label: 'Moyens de mise en œuvre',                       width: '140px' },
    { key: 'indicateurs',   label: 'Indicateurs de suivi de l\'appui',             width: '155px' },
];

const emptyRow = () => Object.fromEntries(COLUMNS.map(c => [c.key, '']));
const emptyDonnees = () => Array.from({ length: 5 }, emptyRow);

const PRINT_STYLES = [
    'body{font-family:Arial,sans-serif;font-size:7.5pt;margin:0;padding:8mm}',
    'h2{font-size:11pt;color:#78350F;margin-bottom:3px}',
    'h3{font-size:9pt;color:#92400E;margin-bottom:8px}',
    'table{border-collapse:collapse;width:100%}',
    'th,td{border:1px solid #ccc;padding:3px 5px;font-size:7pt;vertical-align:top;word-break:break-word}',
    'th{background:#f5f5f5;font-weight:bold;text-align:center}',
    'td{text-align:left}',
    '.num{color:#78350F;font-weight:700;text-align:center;width:20px}',
    '@page{size:A4 landscape;margin:8mm}',
].join('');

export default function CaiProgrammeQuinzaine() {
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
            let url = '/api/cai/programme-quinzaine?date_session=' + dateSession;
            if (communeId) url += '&commune_id=' + communeId;
            const res = await fetch(url, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.donnees) && data.donnees.length > 0) {
                    setDonnees(data.donnees);
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

    const setCell = (rowIdx, key, val) => {
        setDonnees(prev => prev.map((r, i) => i === rowIdx ? { ...r, [key]: val } : r));
    };

    const addRow = () => setDonnees(prev => [...prev, emptyRow()]);

    const removeRow = (idx) => {
        if (donnees.length <= 1) return;
        setDonnees(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSave = async () => {
        if (!dateSession) { showNotif('error', 'Date de session requise'); return; }
        setSaving(true);
        try {
            const payload = { date_session: dateSession, donnees };
            if (communeId) payload.commune_id = communeId;
            const res = await fetch('/api/cai/programme-quinzaine', {
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
        const thStyle = (col) => ({
            border: '1px solid #ccc',
            padding: forPrint ? '3px 4px' : '6px 8px',
            background: '#78350F',
            color: '#fff',
            fontWeight: '700',
            fontSize: forPrint ? '7pt' : '0.7rem',
            textAlign: 'center',
            verticalAlign: 'middle',
            minWidth: forPrint ? undefined : col.width,
        });

        return (
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: forPrint ? undefined : '1150px' }}>
                <thead>
                    <tr>
                        <th style={{
                            border: '1px solid #ccc', padding: forPrint ? '3px 4px' : '6px 8px',
                            background: '#62280a', color: '#fff', fontWeight: '700',
                            fontSize: forPrint ? '7pt' : '0.7rem', textAlign: 'center',
                            width: forPrint ? '16px' : '32px',
                        }}>
                            N°
                        </th>
                        {COLUMNS.map(col => (
                            <th key={col.key} style={thStyle(col)}>{col.label}</th>
                        ))}
                        {!forPrint && (
                            <th style={{ border: '1px solid #ccc', background: '#62280a', width: '36px' }} />
                        )}
                    </tr>
                </thead>
                <tbody>
                    {donnees.map((row, idx) => (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fffbeb' }}>
                            <td style={{
                                border: '1px solid #e5e7eb', textAlign: 'center', fontSize: forPrint ? '7pt' : '0.75rem',
                                fontWeight: '700', color: AMBER_DARK, padding: forPrint ? '2px' : '4px',
                            }}>
                                {idx + 1}
                            </td>
                            {COLUMNS.map(col => (
                                <td key={col.key} style={{
                                    border: '1px solid #e5e7eb',
                                    padding: forPrint ? '2px 3px' : '2px 4px',
                                    verticalAlign: 'top',
                                }}>
                                    {forPrint ? (
                                        <span style={{ fontSize: '7pt', display: 'block', minHeight: '12px' }}>
                                            {row[col.key]}
                                        </span>
                                    ) : (
                                        <textarea
                                            rows={2}
                                            className="w-full border-0 bg-transparent resize-none text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-400 rounded p-0.5"
                                            value={row[col.key]}
                                            onChange={e => setCell(idx, col.key, e.target.value)}
                                            placeholder="—"
                                            style={{ minWidth: col.width, fontSize: '0.72rem' }}
                                        />
                                    )}
                                </td>
                            ))}
                            {!forPrint && (
                                <td style={{ border: '1px solid #e5e7eb', textAlign: 'center', padding: '2px' }}>
                                    <button
                                        onClick={() => removeRow(idx)}
                                        disabled={donnees.length <= 1}
                                        className="text-red-400 hover:text-red-600 disabled:opacity-30 text-xs font-bold px-1"
                                        title="Supprimer la ligne"
                                    >
                                        ✕
                                    </button>
                                </td>
                            )}
                        </tr>
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
                                Étape 13
                            </span>
                            <h1 className="text-2xl font-bold" style={{ color: AMBER_DARK }}>
                                Accompagnement technique dans la production agroécologique
                            </h1>
                        </div>
                        <p className="text-gray-600 text-sm">Modèle de programme de quinzaine</p>
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
                    <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-4 mb-4 overflow-x-auto">
                        {loading ? (
                            <div className="text-center py-8 text-gray-400">Chargement...</div>
                        ) : renderTable(false)}
                    </div>

                    {/* Bouton ajouter ligne */}
                    <div className="mb-6">
                        <button
                            onClick={addRow}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border-2 border-dashed border-amber-400 text-amber-700 hover:bg-amber-50"
                        >
                            + Ajouter une ligne
                        </button>
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="font-bold text-lg" style={{ color: AMBER_DARK }}>
                                Aperçu — Programme de quinzaine
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
                                Phase 4 — Mise en œuvre et suivi
                            </h2>
                            <h3 style={{ color: '#92400E', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>
                                Étape 13 — Accompagnement technique dans la production agroécologique
                            </h3>
                            <p style={{ color: '#6b7280', fontSize: '11px', marginBottom: '10px' }}>
                                Modèle de programme de quinzaine — Session : {dateSession}
                            </p>
                            <div style={{ overflowX: 'auto' }}>
                                {renderTable(true)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
