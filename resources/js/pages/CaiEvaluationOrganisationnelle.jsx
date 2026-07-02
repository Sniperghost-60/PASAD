import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, Header } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import ModernNotification from '../components/ModernNotification';

const AMBER       = '#d97706';
const AMBER_DARK  = '#92400e';
const AMBER_LIGHT = '#fef3c7';

const PARAMS = [
    { key: 'quantite_prevue',     label: 'Quantité prévue de produit' },
    { key: 'qualite_prevue',      label: 'Qualité prévue de produit' },
    { key: 'periode_livraison',   label: 'Période de livraison de produit' },
    { key: 'marches_vises',       label: 'Marchés visés pour le produit' },
    { key: 'mobilisation_mo',     label: "Mobilisation de la main d'œuvre" },
    { key: 'prix_vente_planifie', label: 'Prix de vente planifié' },
    { key: 'mode_remboursement',  label: 'Mode de remboursement' },
    { key: 'organisation_interne', label: 'Organisation interne' },
];

const SCORES    = [1, 2, 3, 4, 5];
const emptyData = () => Object.fromEntries(PARAMS.map(p => [p.key, { score: '', observation: '' }]));

const PRINT_STYLES = [
    '@page{size:A4 portrait;margin:10mm}',
    'body{font-family:Arial,sans-serif;font-size:10px}',
    'table{width:100%;border-collapse:collapse}',
    'th,td{border:1px solid #999;padding:4px 6px;vertical-align:middle}',
    'th{background:#92400e;color:#fff;text-align:center;font-size:10px}',
    '.dot-fill{width:13px;height:13px;border-radius:50%;background:#d97706;display:inline-block}',
    '.dot-empty{width:13px;height:13px;border-radius:50%;border:1px solid #aaa;display:inline-block}',
    'h2{font-size:14px;text-align:center;margin:0 0 6px;color:#92400e}',
    '.meta{text-align:center;font-size:9px;color:#555;margin-bottom:6px}',
].join('');

export default function CaiEvaluationOrganisationnelle() {
    const { user, communeId } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dateSession, setDateSession]  = useState('');
    const [items, setItems]              = useState(emptyData());
    const [loading, setLoading]          = useState(false);
    const [saving,  setSaving]           = useState(false);
    const [showApercu, setShowApercu]    = useState(false);
    const [notif, setNotif]              = useState({ show: false, message: '', type: 'success' });
    const printRef = useRef(null);

    const notify = (message, type = 'success') => setNotif({ show: true, message, type });

    useEffect(() => {
        if (!communeId || !dateSession) return;
        setLoading(true);
        fetch(`/api/cai/evaluation-organisationnelle?commune_id=${communeId}&date_session=${dateSession}`, {
            credentials: 'include',
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(r => r.json())
            .then(d => { if (d?.donnees?.items) setItems({ ...emptyData(), ...d.donnees.items }); })
            .finally(() => setLoading(false));
    }, [communeId, dateSession]);

    const update = (key, field, val) =>
        setItems(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));

    const handleSave = async () => {
        if (!dateSession) { notify('Veuillez sélectionner une date de session.', 'error'); return; }
        setSaving(true);
        try {
            const r = await fetch('/api/cai/evaluation-organisationnelle', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ commune_id: communeId, date_session: dateSession, donnees: { items } }),
            });
            if (!r.ok) throw new Error();
            notify('Données enregistrées avec succès.');
        } catch {
            notify("Erreur lors de l'enregistrement.", 'error');
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        const w = window.open('', '_blank');
        w.document.write(`<html><head><meta charset="utf-8"><title>Évaluation organisationnelle</title><style>${PRINT_STYLES}</style></head><body>${printRef.current.innerHTML}</body></html>`);
        w.document.close();
        w.print();
    };

    const renderContent = (forPrint = false) => (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <h2 style={{ textAlign: 'center', color: forPrint ? '#92400e' : AMBER_DARK, fontSize: forPrint ? 14 : 17, margin: '0 0 8px' }}>
                Modèle de fiche d'évaluation organisationnelle
            </h2>
            {forPrint && dateSession && (
                <p className="meta" style={{ textAlign: 'center', fontSize: 9, color: '#555', margin: '0 0 6px' }}>
                    Date de session : {dateSession} — Score : 1 mauvais à 5 : Très bon
                </p>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: forPrint ? 9 : 13 }}>
                <thead>
                    <tr style={{ background: AMBER_DARK, color: '#fff' }}>
                        <th style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'left' }}>Paramètres</th>
                        {SCORES.map(s => (
                            <th key={s} style={{ border: '1px solid #999', padding: '6px 4px', width: forPrint ? 28 : 44, textAlign: 'center' }}>{s}</th>
                        ))}
                        <th style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'left' }}>Observation</th>
                    </tr>
                </thead>
                <tbody>
                    {PARAMS.map((param, idx) => (
                        <tr key={param.key} style={{ background: idx % 2 === 0 ? '#fffbeb' : '#fff' }}>
                            <td style={{ border: '1px solid #999', padding: '6px 8px', fontSize: forPrint ? 9 : 12, fontWeight: 500 }}>
                                {param.label}
                            </td>
                            {SCORES.map(s => (
                                <td key={s} style={{ border: '1px solid #999', textAlign: 'center', padding: 4, width: forPrint ? 28 : 44 }}>
                                    {forPrint ? (
                                        items[param.key]?.score === String(s)
                                            ? <span className="dot-fill" style={{ display: 'inline-block', width: 13, height: 13, borderRadius: '50%', background: AMBER }} />
                                            : <span className="dot-empty" style={{ display: 'inline-block', width: 13, height: 13, borderRadius: '50%', border: '1px solid #aaa' }} />
                                    ) : (
                                        <input
                                            type="radio"
                                            name={`score_${param.key}`}
                                            value={s}
                                            checked={items[param.key]?.score === String(s)}
                                            onChange={() => update(param.key, 'score', String(s))}
                                            style={{ accentColor: AMBER, width: 17, height: 17, cursor: 'pointer' }}
                                        />
                                    )}
                                </td>
                            ))}
                            <td style={{ border: '1px solid #999', padding: '4px 6px' }}>
                                {forPrint ? (
                                    <span style={{ fontSize: 9 }}>{items[param.key]?.observation || ''}</span>
                                ) : (
                                    <input
                                        type="text"
                                        value={items[param.key]?.observation || ''}
                                        onChange={e => update(param.key, 'observation', e.target.value)}
                                        placeholder="Observations..."
                                        style={{ width: '100%', border: 'none', outline: 'none', fontSize: 12, background: 'transparent', color: '#374151' }}
                                    />
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header onMenuClick={() => setSidebarOpen(true)} title="Évaluation organisationnelle" />
                <main style={{ flex: 1, padding: 24, maxWidth: 960, margin: '0 auto', width: '100%' }}>
                    <ModernNotification
                        show={notif.show}
                        message={notif.message}
                        type={notif.type}
                        onClose={() => setNotif(p => ({ ...p, show: false }))}
                    />

                    {/* En-tête */}
                    <div style={{ background: `linear-gradient(135deg, ${AMBER_DARK}, ${AMBER})`, borderRadius: 12, padding: '16px 22px', marginBottom: 20, color: '#fff' }}>
                        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Tableau 35 — Évaluation organisationnelle</h1>
                        <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.85 }}>Score : 1 mauvais à 5 : Très bon</p>
                    </div>

                    {/* Date de session */}
                    <div style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', marginBottom: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Date de session</label>
                        <input
                            type="date"
                            value={dateSession}
                            onChange={e => setDateSession(e.target.value)}
                            style={{ display: 'block', marginTop: 6, padding: '8px 12px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13, outline: 'none' }}
                        />
                    </div>

                    {/* Tableau */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 50, color: '#6b7280', fontSize: 14 }}>Chargement...</div>
                    ) : (
                        <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflowX: 'auto' }}>
                            {renderContent(false)}
                        </div>
                    )}

                    {/* Boutons */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{ padding: '10px 26px', background: AMBER, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                        >
                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        <button
                            onClick={() => setShowApercu(true)}
                            style={{ padding: '10px 26px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                        >
                            Aperçu / Imprimer
                        </button>
                    </div>

                    {/* Modal Aperçu */}
                    {showApercu && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ background: '#fff', borderRadius: 12, width: '90vw', maxWidth: 820, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <span style={{ fontWeight: 700, fontSize: 15 }}>Aperçu</span>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button
                                            onClick={handlePrint}
                                            style={{ padding: '7px 18px', background: AMBER, color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            Imprimer
                                        </button>
                                        <button
                                            onClick={() => setShowApercu(false)}
                                            style={{ padding: '7px 18px', background: '#e5e7eb', border: 'none', borderRadius: 7, fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            Fermer
                                        </button>
                                    </div>
                                </div>
                                <div ref={printRef}>
                                    {renderContent(true)}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
