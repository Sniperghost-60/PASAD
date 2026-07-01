import React, { useEffect, useRef, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification   from '../components/ModernNotification';
import { useAuth }          from '../contexts/AuthContext';

// ── Couleurs ─────────────────────────────────────────────────────────────────
const BROWN      = '#92400e';
const BROWN_LIGHT = '#fef3c7';
const BROWN_DARK  = '#78350f';
const GREEN_HDR   = '#4d7c0f';

// ── Données fixes du référentiel ──────────────────────────────────────────────
const INDICATEURS = [
    {
        key: 'structure',
        label: 'Structure',
        niveaux: [
            { valeur: 1, caracteristique: 'Sol meuble et poudreux sans agrégats visibles' },
            { valeur: 3, caracteristique: "Peu d'agrégats qui se cassent avec peu de pression" },
            { valeur: 5, caracteristique: 'Agrégats bien formés – difficiles à casser' },
        ],
    },
    {
        key: 'compactage',
        label: 'Compactage',
        niveaux: [
            { valeur: 1, caracteristique: 'Sol compacté, le témoin se pile facilement' },
            { valeur: 3, caracteristique: 'Couche mince compactée, résistance à un fil de fer pénétrant' },
            { valeur: 5, caracteristique: 'Pas de compactage, le témoin peut pénétrer complètement dans le sol' },
        ],
    },
    {
        key: 'profondeur_sol',
        label: 'Profondeur du sol superficiel',
        niveaux: [
            { valeur: 1, caracteristique: 'Couches inférieures du sol exposées' },
            { valeur: 3, caracteristique: 'Sol superficiel mince' },
            { valeur: 5, caracteristique: 'Sol superficiel supérieur à 10cm' },
        ],
    },
    {
        key: 'statut_residus',
        label: 'Statut des résidus',
        niveaux: [
            { valeur: 1, caracteristique: 'Décomposition lente des résidus organiques' },
            { valeur: 3, caracteristique: "Présence de résidus en décomposition datant de l'année dernière" },
            { valeur: 5, caracteristique: 'Résidus à divers stades de décomposition, la plupart des résidus bien décomposés' },
        ],
    },
    {
        key: 'couleur_odeur_mo',
        label: 'Couleur, odeur et matière organique',
        niveaux: [
            { valeur: 1, caracteristique: "Couleur pâle, odeur chimique et pas d'humus" },
            { valeur: 3, caracteristique: "Marron clair, inodore et présence d'humus" },
            { valeur: 5, caracteristique: "Brun foncé, odeur fruitée et humus abondant" },
        ],
    },
    {
        key: 'retention_eau',
        label: "Rétention d'eau (niveau d'humidité après irrigation ou pluie)",
        niveaux: [
            { valeur: 1, caracteristique: "Sol sec, ne retient pas l'eau" },
            { valeur: 3, caracteristique: "Niveau d'humidité limité disponible pour une courte durée" },
            { valeur: 5, caracteristique: "Niveau d'humidité raisonnable pendant une période de temps raisonnable" },
        ],
    },
];

const emptyScores = () =>
    Object.fromEntries(INDICATEURS.map(i => [i.key, '']));

const PRINT_STYLES = [
    '@page{size:A4 portrait;margin:12mm}',
    'body{font-family:Arial,sans-serif;font-size:9px;color:#111}',
    'h2{font-size:12px;text-align:center;margin:0 0 8px;color:' + GREEN_HDR + ';background:#f0fdf4;padding:6px;border-radius:4px}',
    'table{border-collapse:collapse;width:100%}',
    'th{background:#fef3c7;color:' + BROWN_DARK + ';border:1px solid #d97706;padding:4px 6px;font-size:8px;font-weight:700}',
    'td{border:1px solid #e5e7eb;padding:4px 6px;vertical-align:top}',
    '.ind-label{font-weight:700;color:' + BROWN_DARK + ';background:#fffbeb}',
    '.val-cell{text-align:center;font-weight:700;color:#b45309;background:#fef9ee}',
    '.cara{color:#166534;font-size:8px}',
    '.score-cell{text-align:center;font-weight:700;color:' + BROWN_DARK + ';font-size:11px;background:#fffbeb}',
    '@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}',
].join('');

// ── Composant ─────────────────────────────────────────────────────────────────
export default function CaiAnalyseQualiteSols() {
    const { user, communeId } = useAuth();

    const today = new Date().toISOString().slice(0, 10);
    const [dateSession, setDateSession] = useState(today);
    const [scores, setScores]           = useState(emptyScores());
    const [loading, setLoading]         = useState(false);
    const [saving,  setSaving]          = useState(false);
    const [apercu,  setApercu]          = useState(false);
    const [notif,   setNotif]           = useState({ show: false, type: 'success', message: '' });
    const printRef = useRef(null);

    const scoreTotal = Object.values(scores).reduce((s, v) => s + (parseFloat(v) || 0), 0);
    const scoreMoyen = scores ? (scoreTotal / INDICATEURS.length).toFixed(1) : 0;

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                let url = '/api/cai/analyse-qualite-sols?date_session=' + dateSession;
                if (communeId) url += '&commune_id=' + communeId;
                const res = await fetch(url, {
                    credentials: 'include',
                    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data?.donnees?.scores) {
                        setScores({ ...emptyScores(), ...data.donnees.scores });
                    } else {
                        setScores(emptyScores());
                    }
                }
            } catch {
                setScores(emptyScores());
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [dateSession, communeId]);

    const handleSave = async () => {
        if (!dateSession) {
            setNotif({ show: true, type: 'error', message: 'Veuillez renseigner la date de session.' });
            return;
        }
        setSaving(true);
        try {
            const payload = { date_session: dateSession, donnees: { scores } };
            if (communeId) payload.commune_id = communeId;
            const res = await fetch('/api/cai/analyse-qualite-sols', {
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
        w.document.write('<html><head><meta charset="utf-8"><title>Qualité des sols</title><style>' + PRINT_STYLES + '</style></head><body>');
        w.document.write(printRef.current.innerHTML);
        w.document.write('</body></html>');
        w.document.close();
        w.focus();
        w.print();
    };

    const renderTable = (forPrint = false) => {
        const rows = [];
        INDICATEURS.forEach((ind, iIdx) => {
            ind.niveaux.forEach((niv, nIdx) => {
                const isFirst = nIdx === 0;
                rows.push(
                    <tr key={ind.key + '-' + niv.valeur}
                        style={{ backgroundColor: iIdx % 2 === 0 ? '#fff' : '#fffbeb' }}>
                        {isFirst && (
                            <td
                                rowSpan={ind.niveaux.length}
                                style={{
                                    border: '1px solid #e5e7eb', padding: forPrint ? '4px 6px' : '8px 12px',
                                    fontWeight: 700, color: BROWN_DARK, verticalAlign: 'middle',
                                    fontSize: forPrint ? 8 : 13, backgroundColor: '#fffbeb',
                                    width: forPrint ? undefined : 200,
                                }}
                            >
                                {ind.label}
                            </td>
                        )}
                        <td style={{
                            border: '1px solid #e5e7eb', padding: forPrint ? '4px 6px' : '6px 12px',
                            textAlign: 'center', fontWeight: 700, color: '#b45309',
                            fontSize: forPrint ? 9 : 14, width: forPrint ? undefined : 60,
                            backgroundColor: '#fef9ee',
                        }}>
                            {niv.valeur}
                        </td>
                        <td style={{
                            border: '1px solid #e5e7eb', padding: forPrint ? '4px 6px' : '6px 12px',
                            color: '#166534', fontSize: forPrint ? 8 : 13,
                        }}>
                            {niv.caracteristique}
                        </td>
                        {isFirst && (
                            <td
                                rowSpan={ind.niveaux.length}
                                style={{
                                    border: '1px solid #e5e7eb', padding: forPrint ? '4px 6px' : '6px 10px',
                                    textAlign: 'center', verticalAlign: 'middle',
                                    width: forPrint ? undefined : 110,
                                    backgroundColor: '#fffbeb',
                                }}
                            >
                                {forPrint
                                    ? <span style={{ fontWeight: 700, fontSize: 13, color: BROWN_DARK }}>{scores[ind.key] || '—'}</span>
                                    : <input
                                        type="number"
                                        min={1} max={10}
                                        value={scores[ind.key]}
                                        onChange={e => setScores(prev => ({ ...prev, [ind.key]: e.target.value }))}
                                        placeholder="1–10"
                                        style={{
                                            width: 70, textAlign: 'center', border: '1px solid #d1d5db',
                                            borderRadius: 6, padding: '6px 4px', fontSize: 16,
                                            fontWeight: 700, color: BROWN_DARK, background: '#fff',
                                        }}
                                    />
                                }
                            </td>
                        )}
                    </tr>
                );
            });
        });

        const tableEl = (
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                    <tr style={{ backgroundColor: BROWN_LIGHT }}>
                        <th style={{ border: '1px solid #d97706', padding: forPrint ? '4px 6px' : '8px 12px', color: BROWN_DARK, fontSize: forPrint ? 8 : 12, textAlign: 'left' }}>Indicateurs</th>
                        <th style={{ border: '1px solid #d97706', padding: forPrint ? '4px 6px' : '8px 12px', color: BROWN_DARK, fontSize: forPrint ? 8 : 12, width: forPrint ? undefined : 60 }}>Valeurs</th>
                        <th style={{ border: '1px solid #d97706', padding: forPrint ? '4px 6px' : '8px 12px', color: BROWN_DARK, fontSize: forPrint ? 8 : 12, textAlign: 'left' }}>Caractéristiques</th>
                        <th style={{ border: '1px solid #d97706', padding: forPrint ? '4px 6px' : '8px 12px', color: BROWN_DARK, fontSize: forPrint ? 8 : 12, width: forPrint ? undefined : 110 }}>Score (de 1 à 10)</th>
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
        );

        if (forPrint) {
            return (
                <div>
                    <h2>Modèle de tableau d'analyse de la qualité des sols</h2>
                    {tableEl}
                    <p style={{ marginTop: 10, fontSize: 9, fontWeight: 700, color: BROWN_DARK }}>
                        Score total : {scoreTotal} / 60 &nbsp;|&nbsp; Score moyen : {scoreMoyen} / 10
                    </p>
                </div>
            );
        }
        return tableEl;
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
                            <div style={{ width: 4, height: 28, borderRadius: 2, background: BROWN }} />
                            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
                                Analyse de la qualité des sols
                            </h1>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: '#6b7280', paddingLeft: 14 }}>
                            Phase 5 — Évaluation | Étape 21
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
                        {/* Score résumé */}
                        <div style={{
                            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16,
                        }}>
                            <div style={{ background: BROWN_LIGHT, borderRadius: 8, padding: '6px 16px', border: '1px solid #d97706' }}>
                                <span style={{ fontSize: 12, color: BROWN, fontWeight: 600 }}>Total : </span>
                                <span style={{ fontSize: 16, fontWeight: 800, color: BROWN_DARK }}>{scoreTotal}</span>
                                <span style={{ fontSize: 12, color: BROWN }}> / 60</span>
                                <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 10 }}>Moy. : </span>
                                <span style={{ fontSize: 16, fontWeight: 800, color: BROWN_DARK }}>{scoreMoyen}</span>
                                <span style={{ fontSize: 12, color: BROWN }}> / 10</span>
                            </div>
                            <button onClick={() => setApercu(true)} style={{
                                background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8,
                                padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151',
                            }}>
                                Aperçu / Imprimer
                            </button>
                            <button onClick={handleSave} disabled={saving} style={{
                                background: BROWN, color: '#fff', border: 'none', borderRadius: 8,
                                padding: '8px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                opacity: saving ? 0.6 : 1,
                            }}>
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>

                    {/* Tableau */}
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                        <div style={{ background: GREEN_HDR, color: '#fff', padding: '10px 16px', fontWeight: 700, fontSize: 14, textAlign: 'center' }}>
                            Modèle de tableau d'analyse de la qualité des sols
                        </div>
                        <div style={{ padding: 0 }}>
                            {renderTable(false)}
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
                        width: '700px', maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                            <h3 style={{ margin: 0, color: BROWN_DARK }}>Aperçu — Qualité des sols</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={handlePrint} style={{
                                    background: BROWN, color: '#fff', border: 'none',
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
