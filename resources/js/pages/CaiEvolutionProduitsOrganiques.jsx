import React, { useEffect, useRef, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification   from '../components/ModernNotification';
import { useAuth }          from '../contexts/AuthContext';

// ── Couleurs ─────────────────────────────────────────────────────────────────
const GREEN      = '#15803d';
const GREEN_LIGHT = '#dcfce7';
const GREEN_DARK  = '#14532d';
const AMBER_DARK  = '#78350F';

// ── Helpers ───────────────────────────────────────────────────────────────────
const num = v => parseFloat(String(v).replace(/\s/g, '').replace(',', '.')) || 0;

const fmt = n => n === 0 ? '' : n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

const emptyLigne = (categorie = '') => ({
    commune: '', arrondissement: '', village: '',
    nom_producteur: '', categorie_intrant: categorie,
    qte_n1: '', montant_n1: '',
    qte_n: '',  montant_n: '',
    qte_n_plus1: '', montant_n_plus1: '',
    observations: '',
});

const emptyDonnees = () => ({
    lignes: [
        emptyLigne('Insecticide biologique'),
        emptyLigne(),
        emptyLigne(),
    ],
});

const NUM_KEYS = ['qte_n1', 'montant_n1', 'qte_n', 'montant_n', 'qte_n_plus1', 'montant_n_plus1'];

const PRINT_STYLES = [
    '@page{size:A4 landscape;margin:8mm}',
    'body{font-family:Arial,sans-serif;font-size:8px;color:#111}',
    'h2{font-size:11px;text-align:center;margin:0 0 6px;color:' + GREEN_DARK + '}',
    'table{border-collapse:collapse;width:100%}',
    'th,td{border:1px solid #d1d5db;padding:2px 4px;text-align:left}',
    'th{background:#dcfce7;color:' + GREEN_DARK + ';font-size:7px;text-align:center}',
    'td.num{text-align:right;color:#166534}',
    '.total-row td{background:#bbf7d0;font-weight:700;color:' + GREEN_DARK + '}',
    '@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}',
].join('');

// ── Composant ─────────────────────────────────────────────────────────────────
export default function CaiEvolutionProduitsOrganiques() {
    const { user, communeId } = useAuth();

    const today = new Date().toISOString().slice(0, 10);
    const [dateSession, setDateSession] = useState(today);
    const [donnees, setDonnees]         = useState(emptyDonnees());
    const [loading, setLoading]         = useState(false);
    const [saving,  setSaving]          = useState(false);
    const [apercu,  setApercu]          = useState(false);
    const [notif,   setNotif]           = useState({ show: false, type: 'success', message: '' });
    const printRef = useRef(null);

    // Totaux
    const totaux = NUM_KEYS.reduce((acc, k) => {
        acc[k] = donnees.lignes.reduce((s, l) => s + num(l[k]), 0);
        return acc;
    }, {});

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                let url = '/api/cai/evolution-produits-organiques?date_session=' + dateSession;
                if (communeId) url += '&commune_id=' + communeId;
                const res = await fetch(url, {
                    credentials: 'include',
                    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data?.donnees?.lignes?.length) {
                        setDonnees({ lignes: data.donnees.lignes });
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
        if (!dateSession) {
            setNotif({ show: true, type: 'error', message: 'Veuillez renseigner la date de session.' });
            return;
        }
        setSaving(true);
        try {
            const payload = { date_session: dateSession, donnees };
            if (communeId) payload.commune_id = communeId;
            const res = await fetch('/api/cai/evolution-produits-organiques', {
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
        w.document.write('<html><head><meta charset="utf-8"><title>Produits organiques</title><style>' + PRINT_STYLES + '</style></head><body>');
        w.document.write(printRef.current.innerHTML);
        w.document.write('</body></html>');
        w.document.close();
        w.focus();
        w.print();
    };

    const renderTable = (forPrint = false) => {
        const Cell = ({ val, num: isNum }) =>
            forPrint
                ? <td className={isNum ? 'num' : ''}>{val}</td>
                : <span style={{ display: 'block', minHeight: 20, fontSize: 13, color: isNum ? GREEN : '#111827' }}>{val}</span>;

        const cols = [
            { key: 'commune',          label: 'Commune',               width: 80  },
            { key: 'arrondissement',   label: 'Arrondissement',         width: 90  },
            { key: 'village',          label: 'Village',                width: 80  },
            { key: 'nom_producteur',   label: 'Nom et prénoms',         width: 110 },
            { key: 'categorie_intrant',label: "Catégories d'intrants",  width: 110 },
            { key: 'qte_n1',           label: 'Qté n-1 (L)',           width: 70,  num: true },
            { key: 'montant_n1',       label: 'Montant n-1 (FCFA)',    width: 90,  num: true },
            { key: 'qte_n',            label: 'Qté n (L)',             width: 70,  num: true },
            { key: 'montant_n',        label: 'Montant n (FCFA)',      width: 90,  num: true },
            { key: 'qte_n_plus1',      label: 'Qté n+1 (L)',          width: 70,  num: true },
            { key: 'montant_n_plus1',  label: 'Montant n+1 (FCFA)',   width: 90,  num: true },
            { key: 'observations',     label: 'Observation',            width: 100 },
        ];

        const tableContent = (
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: forPrint ? undefined : 1260 }}>
                <thead>
                    <tr style={{ backgroundColor: GREEN_LIGHT }}>
                        {!forPrint && <th style={{ border: '1px solid #d1d5db', padding: '6px 8px', fontSize: 11, color: GREEN_DARK, textAlign: 'center', width: 36 }}>#</th>}
                        {cols.map(c => (
                            <th key={c.key} style={{
                                border: '1px solid #d1d5db', padding: '6px 8px',
                                fontSize: 11, color: GREEN_DARK, textAlign: 'center',
                                width: forPrint ? undefined : c.width,
                            }}>
                                {c.label}
                            </th>
                        ))}
                        {!forPrint && <th style={{ border: '1px solid #d1d5db', padding: '6px 8px', width: 36 }}></th>}
                    </tr>
                    {/* Sous-titre groupé pour les années */}
                    {forPrint && (
                        <tr style={{ backgroundColor: '#f0fdf4' }}>
                            <td colSpan={5} style={{ border: '1px solid #d1d5db' }}></td>
                            <td colSpan={2} style={{ border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 700, color: GREEN_DARK, fontSize: 7 }}>Année n-1</td>
                            <td colSpan={2} style={{ border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 700, color: GREEN_DARK, fontSize: 7 }}>Année n</td>
                            <td colSpan={2} style={{ border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 700, color: GREEN_DARK, fontSize: 7 }}>Année n+1</td>
                            <td style={{ border: '1px solid #d1d5db' }}></td>
                        </tr>
                    )}
                </thead>
                <tbody>
                    {donnees.lignes.map((l, idx) => (
                        <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                            {!forPrint && (
                                <td style={{ border: '1px solid #e5e7eb', padding: '4px 6px', textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
                                    {idx + 1}
                                </td>
                            )}
                            {cols.map(c => (
                                <td key={c.key} style={{ border: '1px solid #e5e7eb', padding: '3px 6px', verticalAlign: 'top' }}>
                                    {forPrint
                                        ? <span style={{ fontSize: 8, color: c.num ? '#166534' : '#111', display: 'block', textAlign: c.num ? 'right' : 'left' }}>{l[c.key]}</span>
                                        : <input
                                            type={c.num ? 'number' : 'text'}
                                            value={l[c.key]}
                                            onChange={e => setCell(idx, c.key, e.target.value)}
                                            style={{
                                                width: '100%', border: 'none', outline: 'none', background: 'transparent',
                                                fontSize: 13, color: c.num ? GREEN : '#111827', textAlign: c.num ? 'right' : 'left',
                                                padding: '2px 0',
                                            }}
                                        />
                                    }
                                </td>
                            ))}
                            {!forPrint && (
                                <td style={{ border: '1px solid #e5e7eb', padding: '3px 4px', textAlign: 'center' }}>
                                    <button
                                        onClick={() => removeLigne(idx)}
                                        disabled={donnees.lignes.length <= 1}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: donnees.lignes.length <= 1 ? 0.3 : 1, fontSize: 15 }}
                                        title="Supprimer"
                                    >✕</button>
                                </td>
                            )}
                        </tr>
                    ))}
                    {/* Ligne Total */}
                    <tr className="total-row" style={{ backgroundColor: '#bbf7d0' }}>
                        {!forPrint && <td style={{ border: '1px solid #d1d5db', padding: '5px 6px' }}></td>}
                        <td colSpan={4} style={{ border: '1px solid #d1d5db', padding: '5px 8px', fontWeight: 700, color: GREEN_DARK, fontSize: 12 }}>Total</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '5px 6px' }}></td>
                        {NUM_KEYS.map(k => (
                            <td key={k} style={{ border: '1px solid #d1d5db', padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: GREEN_DARK, fontSize: 12 }}>
                                {fmt(totaux[k])}
                            </td>
                        ))}
                        <td style={{ border: '1px solid #d1d5db' }}></td>
                        {!forPrint && <td style={{ border: '1px solid #d1d5db' }}></td>}
                    </tr>
                </tbody>
            </table>
        );

        if (forPrint) {
            return (
                <div>
                    <h2>Modèle de tableau d'évolution des quantités de produits organiques utilisés</h2>
                    {tableContent}
                </div>
            );
        }
        return tableContent;
    };

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
                            <div style={{ width: 4, height: 28, borderRadius: 2, background: GREEN }} />
                            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
                                Évolution des quantités de produits organiques utilisés
                            </h1>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: '#6b7280', paddingLeft: 14 }}>
                            Phase 5 — Évaluation | Étape 19
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
                                background: GREEN, color: '#fff', border: 'none', borderRadius: 8,
                                padding: '8px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                opacity: saving ? 0.6 : 1,
                            }}>
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>

                    {/* Tableau */}
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 0, overflow: 'hidden' }}>
                        {/* En-têtes groupés par année */}
                        <div style={{ background: GREEN_LIGHT, borderBottom: '2px solid #86efac', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: GREEN_DARK }}>
                                Modèle de tableau d'évolution des quantités de produits organiques utilisés
                            </span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            {renderTable(false)}
                        </div>
                    </div>

                    {/* Ajouter ligne */}
                    <button onClick={addLigne} style={{
                        marginTop: 12, background: 'none', border: '2px dashed #86efac',
                        borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600,
                        color: GREEN, cursor: 'pointer', width: '100%',
                    }}>
                        + Ajouter une ligne
                    </button>
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
                            <h3 style={{ margin: 0, color: GREEN_DARK }}>Aperçu — Produits organiques</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={handlePrint} style={{
                                    background: GREEN, color: '#fff', border: 'none',
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
                            {renderTable(true)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
