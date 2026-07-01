import React, { useEffect, useRef, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import { useAuth }          from '../contexts/AuthContext';
import ModernNotification   from '../components/ModernNotification';

// ── Couleurs ──────────────────────────────────────────────────────────────────
const INDIGO       = '#4338ca';
const INDIGO_LIGHT = '#e0e7ff';
const INDIGO_DARK  = '#312e81';
const INDIGO_MID   = '#6366f1';
const INDIGO_PALE  = '#f5f3ff';

// ── Référentiel ───────────────────────────────────────────────────────────────
const CV_ITEMS = [
    { key: 'pre_transformation',         label: 'Pré-transformation (égrenage, décorticage, Déspatbage, etc.)' },
    { key: 'transport',                  label: 'Transport' },
    { key: 'emballage',                  label: 'Emballage (nbre × PU)' },
    { key: 'entreposage',                label: 'Entreposage' },
    { key: 'produits_conservation',      label: 'Produits de conservation' },
    { key: 'interets_commercialisation', label: 'Intérêts financiers (crédit de commercialisation)' },
];
const CF_ITEMS = [
    { key: 'amortissement',           label: 'Amortissement (équipements et infrastructures)' },
    { key: 'interets_investissement', label: "Intérêts financiers (crédit d'investissement)" },
];
const AC_ITEMS = [
    { key: 'inspection_conseil',  label: 'Inspection des produits/conseil' },
    { key: 'taxes_marche',        label: 'Taxes de marché' },
    { key: 'intermediaires',      label: 'Intermédiaires' },
    { key: 'promotion_publicite', label: 'Promotion/publicité' },
    { key: 'pertes',              label: 'Pertes' },
];

const MKS = ['m1', 'm2', 'm3'];
const MK_LABELS = { m1: 'Marché 1', m2: 'Marché 2', m3: 'Marché 3' };

const ALL_KEYS = [
    ...CV_ITEMS.map(i => i.key),
    ...CF_ITEMS.map(i => i.key),
    ...AC_ITEMS.map(i => i.key),
    'prix_kg', 'cout_transaction', 'produit_brut',
];

const emptyM    = () => Object.fromEntries(ALL_KEYS.map(k => [k, '']));
const emptyData = () => ({ marches: { m1: emptyM(), m2: emptyM(), m3: emptyM() } });

const n = v => parseFloat(String(v ?? '').replace(/\s/g, '').replace(',', '.')) || 0;
const fmtN = v => v === 0 ? '—' : Math.round(v).toLocaleString('fr-FR');

const calc = d => {
    const cv = CV_ITEMS.reduce((s, i) => s + n(d?.[i.key]), 0);
    const cf = CF_ITEMS.reduce((s, i) => s + n(d?.[i.key]), 0);
    const ac = AC_ITEMS.reduce((s, i) => s + n(d?.[i.key]), 0);
    const ct = cv + cf + ac;
    const pb = n(d?.produit_brut);
    const mb = pb > 0 ? pb - (cv + ac) : 0;
    const mn = pb > 0 ? mb - cf : 0;
    return { cv, cf, ac, ct, mb, mn };
};

const PRINT_STYLES = [
    '@page{size:A4 landscape;margin:8mm}',
    'body{font-family:Arial,sans-serif;font-size:9pt;margin:0}',
    'table{border-collapse:collapse;width:100%}',
    'th,td{border:1px solid #999;padding:3px 5px;font-size:8pt}',
    'th{background:#312e81;color:#fff}',
    '.sec-hdr{background:#e0e7ff;font-weight:700;color:#312e81}',
    '.total-row{background:#c7d2fe;font-weight:700}',
    '.ct-row{background:#fef9c3}',
    '.mb-row{background:#dcfce7;font-weight:700}',
    '.mn-row{background:#d1fae5;font-weight:700}',
    '.moy{background:#ddd6fe}',
    '.pos{color:#166534}.neg{color:#dc2626}',
].join('');

export default function CaiCoutTransaction() {
    const { user, communeId } = useAuth();
    const printRef = useRef(null);

    const today = new Date().toISOString().slice(0, 10);
    const [dateSession, setDateSession] = useState(today);
    const [marches, setMarches]         = useState(emptyData().marches);
    const [loading, setLoading]         = useState(false);
    const [saving, setSaving]           = useState(false);
    const [showApercu, setShowApercu]   = useState(false);
    const [notif, setNotif]             = useState({ show: false, type: 'success', message: '' });

    const showNotif = (type, message) => {
        setNotif({ show: true, type, message });
        setTimeout(() => setNotif(p => ({ ...p, show: false })), 3500);
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                let qs = '?date_session=' + dateSession;
                if (communeId) qs += '&commune_id=' + communeId;
                const res = await fetch('/api/cai/cout-transaction' + qs, {
                    credentials: 'include',
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                });
                const data = await res.json();
                if (data?.donnees?.marches) {
                    const m = data.donnees.marches;
                    setMarches({
                        m1: { ...emptyM(), ...(m.m1 || {}) },
                        m2: { ...emptyM(), ...(m.m2 || {}) },
                        m3: { ...emptyM(), ...(m.m3 || {}) },
                    });
                } else {
                    setMarches(emptyData().marches);
                }
            } catch {
                setMarches(emptyData().marches);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [dateSession, communeId]);

    const update = (mk, key, val) =>
        setMarches(prev => ({ ...prev, [mk]: { ...prev[mk], [key]: val } }));

    const handleSave = async () => {
        if (!dateSession) { showNotif('error', 'Date de session requise'); return; }
        setSaving(true);
        try {
            const payload = { date_session: dateSession, donnees: { marches } };
            if (communeId) payload.commune_id = communeId;
            const res = await fetch('/api/cai/cout-transaction', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error();
            showNotif('success', 'Données enregistrées avec succès');
        } catch {
            showNotif('error', "Impossible d'enregistrer les données");
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        const w = window.open('', '_blank');
        w.document.write(`<html><head><style>${PRINT_STYLES}</style></head><body>${printRef.current.innerHTML}</body></html>`);
        w.document.close();
        w.print();
    };

    // ── Computed ─────────────────────────────────────────────────────────────
    const c = { m1: calc(marches.m1), m2: calc(marches.m2), m3: calc(marches.m3) };
    const moy = {
        cv: (c.m1.cv + c.m2.cv + c.m3.cv) / 3,
        cf: (c.m1.cf + c.m2.cf + c.m3.cf) / 3,
        ac: (c.m1.ac + c.m2.ac + c.m3.ac) / 3,
        ct: (c.m1.ct + c.m2.ct + c.m3.ct) / 3,
        mb: (c.m1.mb + c.m2.mb + c.m3.mb) / 3,
        mn: (c.m1.mn + c.m2.mn + c.m3.mn) / 3,
    };
    const avgInput = key => (n(marches.m1?.[key]) + n(marches.m2?.[key]) + n(marches.m3?.[key])) / 3;

    // ── Styles inline ─────────────────────────────────────────────────────────
    const thBase = (extra = {}) => ({
        padding: '6px 8px', border: '1px solid #a5b4fc',
        backgroundColor: INDIGO_DARK, color: '#fff', fontSize: 11,
        textAlign: 'center', fontWeight: 700, ...extra,
    });
    const thMid = (extra = {}) => ({ ...thBase(), backgroundColor: INDIGO, ...extra });
    const thMoy = (extra = {}) => ({ ...thBase(), backgroundColor: INDIGO_MID, ...extra });
    const tdBase = (extra = {}) => ({
        padding: '4px 6px', border: '1px solid #c7d2fe',
        fontSize: 11, verticalAlign: 'middle', ...extra,
    });
    const tdMoy  = (extra = {}) => ({ ...tdBase(), backgroundColor: INDIGO_PALE, textAlign: 'right', ...extra });
    const tdComp = (extra = {}) => ({ ...tdBase(), fontWeight: 700, textAlign: 'right', ...extra });

    const inputCell = (mk, key) => (
        <td key={mk} style={{ padding: '1px 2px', border: '1px solid #c7d2fe', verticalAlign: 'middle' }}>
            <input
                type="number"
                value={marches[mk]?.[key] ?? ''}
                onChange={e => update(mk, key, e.target.value)}
                style={{
                    width: '100%', border: 'none', outline: 'none', textAlign: 'right',
                    fontSize: 11, padding: '3px 5px', backgroundColor: 'transparent',
                    color: '#111827',
                }}
            />
        </td>
    );

    const printInputCell = (mk, key) => (
        <td key={mk} style={{ ...tdBase(), textAlign: 'right' }}>
            {n(marches[mk]?.[key]) ? fmtN(n(marches[mk]?.[key])) : ''}
        </td>
    );

    const signColor = v => v >= 0 ? '#166534' : '#dc2626';

    const renderGroup = (items, sectionLabel, totalLabel, cKey, secBg, forPrint) => {
        const rows = items.map((item, idx) => (
            <tr key={item.key} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : INDIGO_PALE }}>
                {idx === 0 && (
                    <td rowSpan={items.length + 1} style={{
                        ...tdBase(), width: 72, backgroundColor: secBg, fontWeight: 700,
                        fontSize: 10, color: INDIGO_DARK, textAlign: 'center', borderRight: `2px solid ${INDIGO}`,
                    }}>
                        {sectionLabel}
                    </td>
                )}
                <td style={tdBase()}>{item.label}</td>
                {forPrint
                    ? MKS.map(mk => printInputCell(mk, item.key))
                    : MKS.map(mk => inputCell(mk, item.key))
                }
                <td style={tdMoy()}>
                    {avgInput(item.key) > 0 ? fmtN(avgInput(item.key)) : '—'}
                </td>
            </tr>
        ));

        rows.push(
            <tr key={`total-${cKey}`} style={{ backgroundColor: INDIGO_LIGHT }}>
                <td style={tdBase({ fontWeight: 700 })}>{totalLabel}</td>
                {MKS.map(mk => <td key={mk} style={tdComp({ backgroundColor: INDIGO_LIGHT })}>{fmtN(c[mk][cKey])}</td>)}
                <td style={tdComp({ backgroundColor: '#ddd6fe' })}>{fmtN(moy[cKey])}</td>
            </tr>
        );
        return rows;
    };

    // ── Table ─────────────────────────────────────────────────────────────────
    const renderTable = (forPrint = false) => (
        <div style={{ overflowX: forPrint ? 'visible' : 'auto' }}>
            <table style={{ borderCollapse: 'collapse', minWidth: forPrint ? '100%' : 860, width: '100%', fontSize: 11 }}>
                <thead>
                    <tr>
                        <th style={thBase({ width: 72 })}>Types de charges</th>
                        <th style={thBase({ textAlign: 'left' })}>Intitulés</th>
                        <th colSpan={3} style={thMid()}>
                            Montants dans les marchés où le produit est vendu (FCFA)
                        </th>
                        <th style={thMoy({ width: 100 })}>Moyenne</th>
                    </tr>
                    <tr>
                        <th style={thBase({ width: 72, fontSize: 10 })}></th>
                        <th style={thBase({ textAlign: 'left' })}></th>
                        {MKS.map(mk => <th key={mk} style={thMid({ width: 120 })}>{MK_LABELS[mk]}</th>)}
                        <th style={thMoy({ width: 100 })}>Moyenne</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Charges variables */}
                    {renderGroup(CV_ITEMS, 'Charges variables', 'Total charges variables', 'cv', '#ede9fe', forPrint)}
                    {/* Charges fixes */}
                    {renderGroup(CF_ITEMS, 'Charges fixes', 'Total charges fixes', 'cf', '#ddd6fe', forPrint)}
                    {/* Autres charges */}
                    {renderGroup(AC_ITEMS, 'Autres charges', 'Total autres charges', 'ac', INDIGO_LIGHT, forPrint)}

                    {/* Charges totales */}
                    <tr style={{ backgroundColor: '#c7d2fe' }}>
                        <td colSpan={2} style={tdBase({ fontWeight: 700, fontSize: 12, color: INDIGO_DARK })}>
                            Charges totales
                        </td>
                        {MKS.map(mk => <td key={mk} style={tdComp({ backgroundColor: '#c7d2fe', color: INDIGO_DARK })}>{fmtN(c[mk].ct)}</td>)}
                        <td style={tdComp({ backgroundColor: '#a5b4fc', color: INDIGO_DARK })}>{fmtN(moy.ct)}</td>
                    </tr>

                    {/* Prix du Kg */}
                    <tr>
                        <td colSpan={2} style={tdBase()}>Prix du Kg de produit vendu (FCFA/Kg)</td>
                        {forPrint
                            ? MKS.map(mk => printInputCell(mk, 'prix_kg'))
                            : MKS.map(mk => inputCell(mk, 'prix_kg'))
                        }
                        <td style={tdMoy()}>{avgInput('prix_kg') > 0 ? fmtN(avgInput('prix_kg')) : '—'}</td>
                    </tr>

                    {/* Coût de transaction */}
                    <tr style={{ backgroundColor: '#fef9c3' }}>
                        <td colSpan={2} style={tdBase({ backgroundColor: '#fef9c3' })}>
                            <strong>Coût de transaction</strong>{' '}
                            <em style={{ fontSize: 10, color: '#6b7280' }}>(charges de la mise en marché / Kg vendu)</em>
                        </td>
                        {forPrint
                            ? MKS.map(mk => <td key={mk} style={{ ...tdBase(), backgroundColor: '#fef9c3', textAlign: 'right' }}>
                                {n(marches[mk]?.cout_transaction) ? fmtN(n(marches[mk].cout_transaction)) : ''}
                              </td>)
                            : MKS.map(mk => (
                                <td key={mk} style={{ padding: '1px 2px', border: '1px solid #c7d2fe', backgroundColor: '#fef9c3' }}>
                                    <input
                                        type="number"
                                        value={marches[mk]?.cout_transaction ?? ''}
                                        onChange={e => update(mk, 'cout_transaction', e.target.value)}
                                        style={{ width: '100%', border: 'none', outline: 'none', textAlign: 'right', fontSize: 11, padding: '3px 5px', backgroundColor: 'transparent' }}
                                    />
                                </td>
                            ))
                        }
                        <td style={tdMoy({ backgroundColor: '#fef9c3' })}>
                            {avgInput('cout_transaction') > 0 ? fmtN(avgInput('cout_transaction')) : '—'}
                        </td>
                    </tr>

                    {/* Produit brut */}
                    <tr>
                        <td colSpan={2} style={tdBase()}>Produit brut (FCFA)</td>
                        {forPrint
                            ? MKS.map(mk => printInputCell(mk, 'produit_brut'))
                            : MKS.map(mk => inputCell(mk, 'produit_brut'))
                        }
                        <td style={tdMoy()}>{avgInput('produit_brut') > 0 ? fmtN(avgInput('produit_brut')) : '—'}</td>
                    </tr>

                    {/* Marge brute */}
                    <tr style={{ backgroundColor: '#dcfce7' }}>
                        <td colSpan={2} style={tdBase({ backgroundColor: '#dcfce7' })}>
                            <strong>Marge brute</strong>{' '}
                            <em style={{ fontSize: 10, color: '#6b7280' }}>(Produit brut – charges opérationnelles de la mise en marché)</em>
                        </td>
                        {MKS.map(mk => (
                            <td key={mk} style={tdComp({ backgroundColor: '#dcfce7', color: signColor(c[mk].mb) })}>
                                {n(marches[mk]?.produit_brut) > 0 ? fmtN(c[mk].mb) : '—'}
                            </td>
                        ))}
                        <td style={tdComp({ backgroundColor: '#bbf7d0', color: signColor(moy.mb) })}>
                            {avgInput('produit_brut') > 0 ? fmtN(moy.mb) : '—'}
                        </td>
                    </tr>

                    {/* Marge nette */}
                    <tr style={{ backgroundColor: '#d1fae5' }}>
                        <td colSpan={2} style={tdBase({ backgroundColor: '#d1fae5' })}>
                            <strong>Marge nette</strong>{' '}
                            <em style={{ fontSize: 10, color: '#6b7280' }}>(MB – charges fixes)</em>
                        </td>
                        {MKS.map(mk => (
                            <td key={mk} style={tdComp({ backgroundColor: '#d1fae5', color: signColor(c[mk].mn) })}>
                                {n(marches[mk]?.produit_brut) > 0 ? fmtN(c[mk].mn) : '—'}
                            </td>
                        ))}
                        <td style={tdComp({ backgroundColor: '#a7f3d0', color: signColor(moy.mn) })}>
                            {avgInput('produit_brut') > 0 ? fmtN(moy.mn) : '—'}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );

    // ── Contenu imprimable ────────────────────────────────────────────────────
    const renderContent = (forPrint = false) => (
        <div>
            {forPrint && (
                <div style={{ marginBottom: 10 }}>
                    <h2 style={{ fontSize: 13, fontWeight: 700, color: INDIGO_DARK, margin: 0 }}>
                        Tableau 23 — Coût de transaction, Marge brute et Marge nette
                    </h2>
                    <p style={{ fontSize: 10, margin: '2px 0 0', color: '#6b7280' }}>
                        Date de session : {dateSession}
                    </p>
                </div>
            )}
            {renderTable(forPrint)}
        </div>
    );

    // ── Rendu ─────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Header title="Coût de transaction · Marge brute et nette" subtitle="Phase 5 — Évaluation | Étape 22" />

                <ModernNotification show={notif.show} type={notif.type} message={notif.message} />

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                    {/* Titre */}
                    <div style={{ background: `linear-gradient(135deg,${INDIGO_DARK},${INDIGO})`, borderRadius: 10, padding: '12px 18px', marginBottom: 14, color: '#fff' }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>
                            Tableau 23 — Coût de transaction, Marge brute et Marge nette
                        </div>
                        <div style={{ fontSize: 11, color: '#c7d2fe', marginTop: 2 }}>
                            Calcul par marché de commercialisation
                        </div>
                    </div>

                    {/* Date */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Date de session :</label>
                        <input
                            type="date"
                            value={dateSession}
                            onChange={e => setDateSession(e.target.value)}
                            style={{ border: '1px solid #c7d2fe', borderRadius: 6, padding: '5px 10px', fontSize: 13, color: '#111827' }}
                        />
                        {loading && <span style={{ fontSize: 12, color: '#9ca3af' }}>Chargement…</span>}
                    </div>

                    {/* Tableau */}
                    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: 16, marginBottom: 14 }}>
                        {renderTable(false)}
                    </div>

                    {/* Barre d'actions */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={handleSave} disabled={saving} style={{
                            backgroundColor: saving ? '#a5b4fc' : INDIGO, color: '#fff', border: 'none',
                            borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        }}>
                            {saving ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                        <button onClick={() => setShowApercu(true)} style={{
                            backgroundColor: '#fff', color: INDIGO, border: `1px solid ${INDIGO}`,
                            borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        }}>
                            Aperçu
                        </button>
                        <button onClick={handlePrint} style={{
                            backgroundColor: '#fff', color: '#374151', border: '1px solid #d1d5db',
                            borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        }}>
                            Imprimer
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Aperçu */}
            {showApercu && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div style={{ background: '#fff', borderRadius: 12, width: '95vw', maxWidth: 1000, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: INDIGO_DARK }}>Aperçu — Tableau 23</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={handlePrint} style={{ backgroundColor: INDIGO, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>Imprimer</button>
                                <button onClick={() => setShowApercu(false)} style={{ backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>Fermer</button>
                            </div>
                        </div>
                        <div ref={printRef} style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                            {renderContent(true)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
