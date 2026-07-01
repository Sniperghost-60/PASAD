import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification   from '../components/ModernNotification';
import { useAuth }          from '../contexts/AuthContext';

const AMBER_DARK = '#78350F';
const AMBER_MID  = '#92400E';
const AMBER_BG   = '#FEF3C7';
const AMBER_HDR  = '#f59e0b';

const COLS = [
    { key: 'commune',           label: 'Commune',                   w: 110 },
    { key: 'arrondissement',    label: 'Arrondissement',            w: 120 },
    { key: 'village',           label: 'Village',                   w: 100 },
    { key: 'type_experimentation', label: "Type d'expérimentation CEP", w: 160 },
    { key: 'culture',           label: 'Culture',                   w: 100 },
    { key: 'rendement_d1',      label: 'Rendement Dispositif 1',    w: 130 },
    { key: 'rendement_d2',      label: 'Rendement Dispositif 2',    w: 130 },
    { key: 'rendement_d3',      label: 'Rendement Dispositif 3',    w: 130 },
    { key: 'rendement_d4',      label: 'Rendement Dispositif 4',    w: 130 },
];

const emptyLigne = () => ({
    commune: '', arrondissement: '', village: '', type_experimentation: '',
    culture: '', rendement_d1: '', rendement_d2: '', rendement_d3: '', rendement_d4: '',
});

const emptyDonnees = () => ({ lignes: Array.from({ length: 5 }, emptyLigne) });

const PRINT_STYLES = [
    '@page{size:A4 landscape;margin:8mm}',
    'body{font-family:Arial,sans-serif;font-size:9px;color:#111}',
    'table{border-collapse:collapse;width:100%}',
    'th,td{border:1px solid #999;padding:3px 5px;text-align:left}',
    'thead th{background:#78350F;color:#fff;font-weight:700}',
    '.title-box{text-align:center;margin-bottom:6px}',
    '.main-title{font-size:14px;font-weight:700}',
    '.sub-title{font-size:10px;color:#444}',
    '@media print{button{display:none}}',
].join('');

export default function CaiEvolutionRendementsCep() {
    const { user, communeId } = useAuth();
    const today = new Date().toISOString().slice(0, 10);
    const [dateSession, setDateSession] = useState(today);
    const [donnees, setDonnees]         = useState(emptyDonnees());
    const [editMode, setEditMode]       = useState(true);
    const [saving, setSaving]           = useState(false);
    const [loading, setLoading]         = useState(false);
    const [showApercu, setShowApercu]   = useState(false);
    const [notif, setNotif]             = useState({ show: false, message: '', type: 'success' });
    const printRef = useRef(null);

    const notify = (message, type = 'success') => setNotif({ show: true, message, type });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            let url = `/api/cai/evolution-rendements-cep?date_session=${dateSession}`;
            if (communeId) url += `&commune_id=${communeId}`;
            const res  = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
            const data = await res.json();
            if (data?.donnees?.lignes) {
                setDonnees({ lignes: data.donnees.lignes });
            } else {
                setDonnees(emptyDonnees());
            }
        } catch {
            setDonnees(emptyDonnees());
        } finally {
            setLoading(false);
        }
    }, [dateSession, communeId]);

    useEffect(() => { load(); }, [load]);

    const setCell = (idx, key, val) =>
        setDonnees(prev => ({
            ...prev,
            lignes: prev.lignes.map((l, i) => i === idx ? { ...l, [key]: val } : l),
        }));

    const addLigne = () =>
        setDonnees(prev => ({ ...prev, lignes: [...prev.lignes, emptyLigne()] }));

    const removeLigne = idx => {
        if (donnees.lignes.length <= 1) return;
        setDonnees(prev => ({ ...prev, lignes: prev.lignes.filter((_, i) => i !== idx) }));
    };

    const handleSave = async () => {
        if (!dateSession) { notify('Date de session requise', 'error'); return; }
        setSaving(true);
        try {
            const payload = { date_session: dateSession, donnees };
            if (communeId) payload.commune_id = communeId;
            const res = await fetch('/api/cai/evolution-rendements-cep', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error();
            notify('Données enregistrées avec succès');
            setEditMode(false);
        } catch {
            notify("Impossible d'enregistrer les données", 'error');
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        const w = window.open('', '_blank');
        w.document.write('<html><head><meta charset="utf-8"><title>Évolution des rendements CEP</title><style>' + PRINT_STYLES + '</style></head><body>');
        w.document.write('<div class="title-box">');
        w.document.write('<div class="main-title">Modèle de tableau d\'évolution des rendements des CEP</div>');
        w.document.write('<div class="sub-title">Phase 5 — Évaluation | Étape 16 | Session : ' + dateSession + '</div>');
        w.document.write('</div>');
        w.document.write(printRef.current.innerHTML);
        w.document.write('</body></html>');
        w.document.close();
        w.print();
    };

    const renderTable = (forPrint = false) => (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', minWidth: '1180px', width: '100%', fontSize: '13px' }} ref={forPrint ? null : undefined}>
                <thead>
                    <tr>
                        {COLS.map(c => (
                            <th key={c.key} style={{
                                background: AMBER_DARK, color: '#fff', fontWeight: 700,
                                padding: '7px 8px', border: '1px solid #92400e',
                                textAlign: 'center', minWidth: c.w, whiteSpace: 'nowrap',
                            }}>{c.label}</th>
                        ))}
                        {!forPrint && editMode && (
                            <th style={{ background: AMBER_DARK, color: '#fff', fontWeight: 700, padding: '7px 8px', border: '1px solid #92400e', textAlign: 'center', width: 50 }}>
                                #
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {donnees.lignes.map((l, idx) => (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fffbeb' }}>
                            {COLS.map(c => (
                                <td key={c.key} style={{ border: '1px solid #d1d5db', padding: forPrint ? '4px 6px' : '2px 4px' }}>
                                    {forPrint || !editMode ? (
                                        <span>{l[c.key]}</span>
                                    ) : (
                                        <input
                                            type="text"
                                            value={l[c.key]}
                                            onChange={e => setCell(idx, c.key, e.target.value)}
                                            style={{
                                                width: '100%', border: 'none', background: 'transparent',
                                                outline: 'none', fontSize: '13px', color: '#111827', padding: '2px 4px',
                                            }}
                                        />
                                    )}
                                </td>
                            ))}
                            {!forPrint && editMode && (
                                <td style={{ border: '1px solid #d1d5db', textAlign: 'center', padding: '2px' }}>
                                    <button
                                        onClick={() => removeLigne(idx)}
                                        disabled={donnees.lignes.length <= 1}
                                        style={{
                                            background: 'none', border: 'none', cursor: donnees.lignes.length <= 1 ? 'not-allowed' : 'pointer',
                                            color: '#ef4444', fontSize: '16px', opacity: donnees.lignes.length <= 1 ? 0.3 : 1,
                                        }}
                                        title="Supprimer"
                                    >✕</button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Header />
                <main style={{ flex: 1, padding: '24px', overflowX: 'auto' }}>

                    <ModernNotification
                        show={notif.show}
                        message={notif.message}
                        type={notif.type}
                        onClose={() => setNotif(p => ({ ...p, show: false }))}
                    />

                    {/* En-tête */}
                    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', padding: '20px 24px', marginBottom: 20, borderLeft: `5px solid ${AMBER_DARK}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: AMBER_DARK }}>
                                    Modèle de tableau d'évolution des rendements des CEP
                                </div>
                                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                                    Phase 5 — Évaluation et actualisation du diagnostic | Étape 16
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <button onClick={() => setEditMode(e => !e)} style={{ background: editMode ? AMBER_MID : '#6b7280', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                                    {editMode ? 'Aperçu' : 'Modifier'}
                                </button>
                                <button onClick={() => setShowApercu(true)} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                                    Aperçu impression
                                </button>
                                <button onClick={handlePrint} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                                    Imprimer
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Date + actions */}
                    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', padding: '16px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Date de session</label>
                            <input
                                type="date"
                                value={dateSession}
                                onChange={e => setDateSession(e.target.value)}
                                style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '7px 12px', fontSize: 14, color: '#111827', outline: 'none' }}
                            />
                        </div>
                        {loading && <span style={{ color: '#9ca3af', fontSize: 13 }}>Chargement...</span>}
                        {editMode && (
                            <>
                                <button onClick={addLigne} style={{ background: AMBER_BG, color: AMBER_DARK, border: `1px solid ${AMBER_HDR}`, borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13, marginTop: 18 }}>
                                    + Ajouter une ligne
                                </button>
                                <button onClick={handleSave} disabled={saving} style={{ background: AMBER_DARK, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 20px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, opacity: saving ? 0.7 : 1, marginTop: 18 }}>
                                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </>
                        )}
                    </div>

                    {/* Tableau */}
                    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', padding: '16px 20px', marginBottom: 20 }}>
                        {renderTable(false)}
                    </div>

                    {/* Aperçu modal */}
                    {showApercu && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                            <div style={{ background: '#fff', borderRadius: 12, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto', padding: 24, position: 'relative', minWidth: 700 }}>
                                <button onClick={() => setShowApercu(false)} style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>✕</button>
                                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                                    <div style={{ fontWeight: 700, fontSize: 16, color: AMBER_DARK }}>Modèle de tableau d'évolution des rendements des CEP</div>
                                    <div style={{ fontSize: 12, color: '#6b7280' }}>Phase 5 — Évaluation | Étape 16 | Session : {dateSession}</div>
                                </div>
                                <div ref={printRef}>
                                    {renderTable(true)}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
                                    <button onClick={handlePrint} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Imprimer</button>
                                    <button onClick={() => setShowApercu(false)} style={{ background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 8, padding: '9px 22px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Fermer</button>
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}
