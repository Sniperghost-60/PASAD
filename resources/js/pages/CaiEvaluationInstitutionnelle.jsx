import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, Header } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import ModernNotification from '../components/ModernNotification';

const TEAL       = '#0f766e';
const TEAL_DARK  = '#134e4a';
const TEAL_LIGHT = '#ccfbf1';

const CATEGORIES = [
    {
        key: 'partenariats',
        label: 'Partenariats et Négociation de partenariat',
        items: [
            { key: 'relations_transporteurs', label: 'Relations avec les transporteurs' },
            { key: 'relation_magasiniers',    label: 'Relation avec les magasiniers (entrepôts)' },
        ],
    },
    {
        key: 'services_appui',
        label: "Services d'appui pour assurer la qualité, traçabilité et la promotion",
        items: [
            { key: 'relation_acheteurs',     label: 'Relation avec les acheteurs' },
            { key: 'relation_inspecteurs',   label: 'Relation avec les inspecteurs' },
            { key: 'relation_certification', label: 'Relation avec les services de certification' },
            { key: 'relation_promotion',     label: 'Relation avec les services de promotion' },
            { key: 'relation_vulgarisation', label: 'Relation avec les services de vulgarisation et de conseil' },
        ],
    },
    {
        key: 'mise_en_marche',
        label: 'Mise en marché',
        items: [
            { key: 'conditionnement',      label: 'Conditionnement' },
            { key: 'transport_produits',   label: 'Transport des produits' },
            { key: 'exposition_livraison', label: 'Exposition ou livraison' },
        ],
    },
];

const ALL_KEYS   = CATEGORIES.flatMap(c => c.items.map(i => i.key));
const SCORES     = [1, 2, 3, 4, 5];
const emptyData  = () => Object.fromEntries(ALL_KEYS.map(k => [k, { score: '', observation: '' }]));

const PRINT_STYLES = [
    '@page{size:A4 portrait;margin:10mm}',
    'body{font-family:Arial,sans-serif;font-size:10px}',
    'table{width:100%;border-collapse:collapse}',
    'th,td{border:1px solid #999;padding:4px 6px;vertical-align:middle}',
    'th{background:#134e4a;color:#fff;text-align:center;font-size:10px}',
    '.cat-cell{background:#ccfbf1;font-weight:bold;vertical-align:middle}',
    '.score-wrap{display:flex;justify-content:center}',
    '.dot-fill{width:13px;height:13px;border-radius:50%;background:#0f766e;display:inline-block}',
    '.dot-empty{width:13px;height:13px;border-radius:50%;border:1px solid #aaa;display:inline-block}',
    'h2{font-size:14px;text-align:center;margin:0 0 6px;color:#134e4a}',
    '.meta{text-align:center;font-size:9px;color:#555;margin-bottom:6px}',
].join('');

export default function CaiEvaluationInstitutionnelle() {
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
        fetch(`/api/cai/evaluation-institutionnelle?commune_id=${communeId}&date_session=${dateSession}`, {
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
            const r = await fetch('/api/cai/evaluation-institutionnelle', {
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
        w.document.write(`<html><head><meta charset="utf-8"><title>Évaluation institutionnelle</title><style>${PRINT_STYLES}</style></head><body>${printRef.current.innerHTML}</body></html>`);
        w.document.close();
        w.print();
    };

    const renderContent = (forPrint = false) => (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <h2 style={{ textAlign: 'center', color: forPrint ? '#134e4a' : TEAL_DARK, fontSize: forPrint ? 14 : 17, margin: '0 0 8px' }}>
                Modèle de fiche d'évaluation institutionnelle
            </h2>
            {forPrint && dateSession && (
                <p className="meta" style={{ textAlign: 'center', fontSize: 9, color: '#555', margin: '0 0 6px' }}>
                    Date de session : {dateSession} — Score : 1 mauvais à 5 : Très bon
                </p>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: forPrint ? 9 : 13 }}>
                <thead>
                    <tr style={{ background: TEAL_DARK, color: '#fff' }}>
                        <th colSpan={2} style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'left' }}>Paramètres</th>
                        {SCORES.map(s => (
                            <th key={s} style={{ border: '1px solid #999', padding: '6px 4px', width: forPrint ? 28 : 44, textAlign: 'center' }}>{s}</th>
                        ))}
                        <th style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'left' }}>Observation</th>
                    </tr>
                </thead>
                <tbody>
                    {CATEGORIES.map(cat =>
                        cat.items.map((item, idx) => (
                            <tr key={item.key} style={{ background: idx % 2 === 0 ? '#f9fafb' : '#fff' }}>
                                {idx === 0 && (
                                    <td
                                        rowSpan={cat.items.length}
                                        className="cat-cell"
                                        style={{
                                            border: '1px solid #999',
                                            padding: '6px 8px',
                                            background: TEAL_LIGHT,
                                            fontWeight: 'bold',
                                            verticalAlign: 'middle',
                                            fontSize: forPrint ? 8 : 11,
                                            maxWidth: 160,
                                        }}
                                    >
                                        {cat.label}
                                    </td>
                                )}
                                <td style={{ border: '1px solid #999', padding: '6px 8px', fontSize: forPrint ? 9 : 12 }}>
                                    {item.label}
                                </td>
                                {SCORES.map(s => (
                                    <td key={s} style={{ border: '1px solid #999', textAlign: 'center', padding: 4, width: forPrint ? 28 : 44 }}>
                                        {forPrint ? (
                                            items[item.key]?.score === String(s)
                                                ? <span className="dot-fill" style={{ display: 'inline-block', width: 13, height: 13, borderRadius: '50%', background: TEAL }} />
                                                : <span className="dot-empty" style={{ display: 'inline-block', width: 13, height: 13, borderRadius: '50%', border: '1px solid #aaa' }} />
                                        ) : (
                                            <input
                                                type="radio"
                                                name={`score_${item.key}`}
                                                value={s}
                                                checked={items[item.key]?.score === String(s)}
                                                onChange={() => update(item.key, 'score', String(s))}
                                                style={{ accentColor: TEAL, width: 17, height: 17, cursor: 'pointer' }}
                                            />
                                        )}
                                    </td>
                                ))}
                                <td style={{ border: '1px solid #999', padding: '4px 6px' }}>
                                    {forPrint ? (
                                        <span style={{ fontSize: 9 }}>{items[item.key]?.observation || ''}</span>
                                    ) : (
                                        <input
                                            type="text"
                                            value={items[item.key]?.observation || ''}
                                            onChange={e => update(item.key, 'observation', e.target.value)}
                                            placeholder="Observations..."
                                            style={{ width: '100%', border: 'none', outline: 'none', fontSize: 12, background: 'transparent', color: '#374151' }}
                                        />
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header onMenuClick={() => setSidebarOpen(true)} title="Évaluation institutionnelle" />
                <main style={{ flex: 1, padding: 24, maxWidth: 960, margin: '0 auto', width: '100%' }}>
                    <ModernNotification
                        show={notif.show}
                        message={notif.message}
                        type={notif.type}
                        onClose={() => setNotif(p => ({ ...p, show: false }))}
                    />

                    {/* En-tête */}
                    <div style={{ background: `linear-gradient(135deg, ${TEAL_DARK}, ${TEAL})`, borderRadius: 12, padding: '16px 22px', marginBottom: 20, color: '#fff' }}>
                        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Tableau 34 — Évaluation institutionnelle</h1>
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
                            style={{ padding: '10px 26px', background: TEAL, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
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
                                            style={{ padding: '7px 18px', background: TEAL, color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, cursor: 'pointer' }}
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
