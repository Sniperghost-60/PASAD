import React, { useEffect, useRef, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification   from '../components/ModernNotification';
import { useAuth }          from '../contexts/AuthContext';

// ── Couleurs ─────────────────────────────────────────────────────────────────
const TEAL      = '#0f766e';
const TEAL_LIGHT = '#ccfbf1';
const TEAL_DARK  = '#134e4a';
const AMBER_DARK = '#78350F';

// ── Helpers ───────────────────────────────────────────────────────────────────
const num = v => parseFloat(String(v).replace(/\s/g, '').replace(',', '.')) || 0;
const fmt = n => n === 0 ? '' : n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

const emptyLigne = () => ({
    commune: '', arrondissement: '', village: '',
    nom_producteur: '', especes: '', identite_espece: '',
    nb_n1: '', nb_n: '', nb_n_plus1: '', observations: '',
});

const emptyDonnees = () => ({
    lignes_animale:  [emptyLigne(), emptyLigne(), emptyLigne()],
    lignes_vegetale: [emptyLigne(), emptyLigne(), emptyLigne()],
});

const NUM_KEYS = ['nb_n1', 'nb_n', 'nb_n_plus1'];

const COLS = [
    { key: 'commune',        label: 'Commune',                width: 80  },
    { key: 'arrondissement', label: 'Arrondissement',          width: 90  },
    { key: 'village',        label: 'Village',                 width: 80  },
    { key: 'nom_producteur', label: 'Nom et prénoms',          width: 110 },
    { key: 'especes',        label: 'Espèces',                 width: 90  },
    { key: 'identite_espece',label: "Identité de l'espèce",   width: 100 },
    { key: 'nb_n1',          label: 'Nb individus n-1',        width: 80,  num: true },
    { key: 'nb_n',           label: 'Nb individus n',          width: 80,  num: true },
    { key: 'nb_n_plus1',     label: 'Nb individus n+1',        width: 80,  num: true },
    { key: 'observations',   label: 'Observation',             width: 100 },
];

const PRINT_STYLES = [
    '@page{size:A4 landscape;margin:8mm}',
    'body{font-family:Arial,sans-serif;font-size:8px;color:#111}',
    'h2{font-size:11px;text-align:center;margin:0 0 6px;color:' + TEAL_DARK + '}',
    'h3{font-size:9px;margin:8px 0 3px;color:' + TEAL_DARK + '}',
    'table{border-collapse:collapse;width:100%;margin-bottom:8px}',
    'th,td{border:1px solid #d1d5db;padding:2px 4px;text-align:left}',
    'th{background:' + TEAL_LIGHT + ';color:' + TEAL_DARK + ';font-size:7px;text-align:center}',
    'td.num{text-align:right;color:#0f766e}',
    '.total-row td{background:#99f6e4;font-weight:700;color:' + TEAL_DARK + '}',
    '@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}',
].join('');

// ── Composant ─────────────────────────────────────────────────────────────────
export default function CaiEvolutionEspeces() {
    const { user, communeId } = useAuth();

    const today = new Date().toISOString().slice(0, 10);
    const [dateSession, setDateSession] = useState(today);
    const [donnees, setDonnees]         = useState(emptyDonnees());
    const [loading, setLoading]         = useState(false);
    const [saving,  setSaving]          = useState(false);
    const [apercu,  setApercu]          = useState(false);
    const [notif,   setNotif]           = useState({ show: false, type: 'success', message: '' });
    const printRef = useRef(null);

    const totaux = section =>
        NUM_KEYS.reduce((acc, k) => {
            acc[k] = (donnees[section] || []).reduce((s, l) => s + num(l[k]), 0);
            return acc;
        }, {});

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                let url = '/api/cai/evolution-especes?date_session=' + dateSession;
                if (communeId) url += '&commune_id=' + communeId;
                const res = await fetch(url, {
                    credentials: 'include',
                    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data?.donnees) {
                        setDonnees({
                            lignes_animale:  data.donnees.lignes_animale  || emptyDonnees().lignes_animale,
                            lignes_vegetale: data.donnees.lignes_vegetale || emptyDonnees().lignes_vegetale,
                        });
                    } else {
                        setDonnees(emptyDonnees());
                    }
                }
            } catch {
                setDonnees(emptyDonnees());
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [dateSession, communeId]);

    const setCell = (section, idx, key, val) =>
        setDonnees(prev => ({
            ...prev,
            [section]: prev[section].map((l, i) => i === idx ? { ...l, [key]: val } : l),
        }));

    const addLigne = section =>
        setDonnees(prev => ({ ...prev, [section]: [...prev[section], emptyLigne()] }));

    const removeLigne = (section, idx) => {
        if (donnees[section].length <= 1) return;
        setDonnees(prev => ({ ...prev, [section]: prev[section].filter((_, i) => i !== idx) }));
    };

    const handleSave = async () => {
        if (!dateSession) {
            setNotif({ show: true, type: 'error', message: 'Veuillez renseigner la date de session.' });
            return;
        }
        setSaving(true);
        try {
            const payload = { date_session: dateSession, donnees };
            if (communeId) payload.commune_id = communeId;
            const res = await fetch('/api/cai/evolution-especes', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setNotif({ show: true, type: 'success', message: 'Données enregistrées avec succès.' });
            } else {
                throw new Error();
            }
        } catch {
            setNotif({ show: true, type: 'error', message: "Erreur lors de l'enregistrement." });
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        const w = window.open('', '_blank');
        w.document.write('<html><head><meta charset="utf-8"><title>Espèces cultivées</title><style>' + PRINT_STYLES + '</style></head><body>');
        w.document.write(printRef.current.innerHTML);
        w.document.write('</body></html>');
        w.document.close();
        w.focus();
        w.print();
    };

    const renderSection = (section, label, forPrint) => {
        const lignes = donnees[section] || [];
        const tot = totaux(section);

        return (
            <div key={section}>
                {forPrint
                    ? <h3>{label}</h3>
                    : (
                        <div style={{
                            background: TEAL_LIGHT, borderLeft: '4px solid ' + TEAL,
                            padding: '6px 14px', marginBottom: 8, borderRadius: '0 6px 6px 0',
                            fontWeight: 700, fontSize: 14, color: TEAL_DARK,
                        }}>
                            {label}
                        </div>
                    )
                }
                <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: forPrint ? undefined : 1100 }}>
                    <thead>
                        <tr style={{ backgroundColor: TEAL_LIGHT }}>
                            {!forPrint && (
                                <th style={{ border: '1px solid #d1d5db', padding: '6px 8px', width: 36, fontSize: 11, color: TEAL_DARK }}>#</th>
                            )}
                            {COLS.map(c => (
                                <th key={c.key} style={{
                                    border: '1px solid #d1d5db', padding: '6px 8px',
                                    fontSize: 11, color: TEAL_DARK, textAlign: 'center',
                                    width: forPrint ? undefined : c.width,
                                }}>
                                    {c.label}
                                </th>
                            ))}
                            {!forPrint && (
                                <th style={{ border: '1px solid #d1d5db', padding: '6px 8px', width: 36 }}></th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {lignes.map((l, idx) => (
                            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                                {!forPrint && (
                                    <td style={{ border: '1px solid #e5e7eb', padding: '4px 6px', textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
                                        {idx + 1}
                                    </td>
                                )}
                                {COLS.map(c => (
                                    <td key={c.key} style={{ border: '1px solid #e5e7eb', padding: '3px 6px', verticalAlign: 'top' }}>
                                        {forPrint
                                            ? <span style={{ fontSize: 8, color: c.num ? TEAL : '#111', display: 'block', textAlign: c.num ? 'right' : 'left' }}>{l[c.key]}</span>
                                            : <input
                                                type={c.num ? 'number' : 'text'}
                                                value={l[c.key]}
                                                onChange={e => setCell(section, idx, c.key, e.target.value)}
                                                style={{
                                                    width: '100%', border: 'none', outline: 'none', background: 'transparent',
                                                    fontSize: 13, color: c.num ? TEAL : '#111827',
                                                    textAlign: c.num ? 'right' : 'left', padding: '2px 0',
                                                }}
                                            />
                                        }
                                    </td>
                                ))}
                                {!forPrint && (
                                    <td style={{ border: '1px solid #e5e7eb', padding: '3px 4px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => removeLigne(section, idx)}
                                            disabled={lignes.length <= 1}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: lignes.length <= 1 ? 0.3 : 1, fontSize: 15 }}
                                            title="Supprimer"
                                        >✕</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {/* Ligne Total */}
                        <tr className="total-row" style={{ backgroundColor: '#99f6e4' }}>
                            {!forPrint && <td style={{ border: '1px solid #d1d5db', padding: '5px 6px' }}></td>}
                            <td colSpan={6} style={{ border: '1px solid #d1d5db', padding: '5px 8px', fontWeight: 700, color: TEAL_DARK, fontSize: 12 }}>Total</td>
                            {NUM_KEYS.map(k => (
                                <td key={k} style={{ border: '1px solid #d1d5db', padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: TEAL_DARK, fontSize: 12 }}>
                                    {fmt(tot[k])}
                                </td>
                            ))}
                            <td style={{ border: '1px solid #d1d5db' }}></td>
                            {!forPrint && <td style={{ border: '1px solid #d1d5db' }}></td>}
                        </tr>
                    </tbody>
                </table>
                {!forPrint && (
                    <button onClick={() => addLigne(section)} style={{
                        marginTop: 6, marginBottom: 20, background: 'none', border: '2px dashed #5eead4',
                        borderRadius: 10, padding: '8px 20px', fontSize: 13, fontWeight: 600,
                        color: TEAL, cursor: 'pointer', width: '100%',
                    }}>
                        + Ajouter une ligne ({label})
                    </button>
                )}
            </div>
        );
    };

    const renderContent = (forPrint = false) => (
        <div>
            {forPrint && (
                <h2>Modèle de tableau d'évolution du nombre d'espèces animales et végétales cultivées</h2>
            )}
            {renderSection('lignes_animale',  'Espèces animales',  forPrint)}
            {renderSection('lignes_vegetale', 'Espèces végétales', forPrint)}
        </div>
    );

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#f9fafb' }}>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Header />
                <ModernNotification
                    show={notif.show}
                    type={notif.type}
                    message={notif.message}
                    onClose={() => setNotif(n => ({ ...n, show: false }))}
                />

                <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                    {/* Titre */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <div style={{ width: 4, height: 28, borderRadius: 2, background: TEAL }} />
                            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
                                Évolution du nombre d'espèces animales et végétales cultivées
                            </h1>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: '#6b7280', paddingLeft: 14 }}>
                            Phase 5 — Évaluation | Étape 20
                        </p>
                    </div>

                    {/* Date + Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Date de session :</label>
                            <input
                                type="date"
                                value={dateSession}
                                onChange={e => setDateSession(e.target.value)}
                                style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '6px 10px', fontSize: 14, color: '#111827' }}
                            />
                        </div>
                        {loading && <span style={{ fontSize: 13, color: '#9ca3af' }}>Chargement...</span>}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                            <button onClick={() => setApercu(true)} style={{
                                background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8,
                                padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151',
                            }}>
                                Aperçu / Imprimer
                            </button>
                            <button onClick={handleSave} disabled={saving} style={{
                                background: TEAL, color: '#fff', border: 'none', borderRadius: 8,
                                padding: '8px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                opacity: saving ? 0.6 : 1,
                            }}>
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>

                    {/* Contenu */}
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 16, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            {renderContent(false)}
                        </div>
                    </div>
                </main>
            </div>

            {/* Aperçu modal */}
            {apercu && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}>
                    <div style={{
                        background: '#fff', borderRadius: 12, padding: 24,
                        width: '95vw', maxHeight: '90vh', overflow: 'auto',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                            <h3 style={{ margin: 0, color: TEAL_DARK }}>Aperçu — Espèces cultivées</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={handlePrint} style={{
                                    background: TEAL, color: '#fff', border: 'none',
                                    borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                }}>
                                    Imprimer
                                </button>
                                <button onClick={() => setApercu(false)} style={{
                                    background: '#f3f4f6', border: '1px solid #d1d5db',
                                    borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
                                }}>
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
        </div>
    );
}
