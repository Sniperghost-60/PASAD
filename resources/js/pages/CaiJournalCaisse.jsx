import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification  from '../components/ModernNotification';
import { useAuth } from '../contexts/AuthContext';

const AMBER_DARK  = '#78350F';
const AMBER_MID   = '#92400E';
const ENTREE_BG   = '#dcfce7';
const ENTREE_HDR  = '#16a34a';
const SORTIE_BG   = '#fee2e2';
const SORTIE_HDR  = '#dc2626';
const SOLDE_BG    = '#dbeafe';
const SOLDE_HDR   = '#1d4ed8';

const emptyLigne = () => ({
    date: '', produit: '', operations: '',
    encaissements: '', encaissements_excep: '',
    decaissements: '', decaissements_excep: '',
});

const emptyDonnees = () => ({ report: '', lignes: Array.from({ length: 5 }, emptyLigne) });

const num = v => parseFloat(String(v).replace(/\s/g, '').replace(',', '.')) || 0;

const fmtNum = v => {
    const n = num(v);
    if (n === 0 && v === '') return '';
    return n.toLocaleString('fr-FR');
};

const PRINT_STYLES = [
    'body{font-family:Arial,sans-serif;font-size:7pt;margin:0;padding:8mm}',
    'h2{font-size:11pt;color:#78350F;margin-bottom:3px}',
    'h3{font-size:9pt;color:#92400E;margin-bottom:8px}',
    'table{border-collapse:collapse;width:100%}',
    'th,td{border:1px solid #ccc;padding:2px 4px;font-size:7pt;vertical-align:middle;text-align:center}',
    'th{font-weight:bold}',
    'td.left{text-align:left}',
    '.hdr-tresor{background:#92400E;color:#fff}',
    '.hdr-entree{background:#16a34a;color:#fff}',
    '.hdr-sortie{background:#dc2626;color:#fff}',
    '.hdr-solde{background:#1d4ed8;color:#fff}',
    '.hdr-base{background:#78350F;color:#fff}',
    '.report-row td{background:#fef9c3;font-weight:700}',
    '.total-row td{background:#e0f2fe;font-weight:700}',
    '.neg{color:#dc2626}',
    '@page{size:A4 landscape;margin:8mm}',
].join('');

export default function CaiJournalCaisse() {
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
            let url = '/api/cai/journal-caisse?date_session=' + dateSession;
            if (communeId) url += '&commune_id=' + communeId;
            const res = await fetch(url, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.donnees && data.donnees.lignes) {
                    setDonnees({ report: data.donnees.report ?? '', lignes: data.donnees.lignes });
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

    const setCell = (idx, key, val) =>
        setDonnees(prev => ({
            ...prev,
            lignes: prev.lignes.map((r, i) => i === idx ? { ...r, [key]: val } : r),
        }));

    const addLigne = () => setDonnees(prev => ({ ...prev, lignes: [...prev.lignes, emptyLigne()] }));

    const removeLigne = (idx) => {
        if (donnees.lignes.length <= 1) return;
        setDonnees(prev => ({ ...prev, lignes: prev.lignes.filter((_, i) => i !== idx) }));
    };

    // Calcul du Reste en cascade
    const computeRestes = () => {
        let reste = num(donnees.report);
        return donnees.lignes.map(l => {
            reste = reste + num(l.encaissements) + num(l.encaissements_excep)
                         - num(l.decaissements) - num(l.decaissements_excep);
            return reste;
        });
    };

    const computeTotaux = () => ({
        encaissements:      donnees.lignes.reduce((s, l) => s + num(l.encaissements), 0),
        encaissements_excep: donnees.lignes.reduce((s, l) => s + num(l.encaissements_excep), 0),
        decaissements:      donnees.lignes.reduce((s, l) => s + num(l.decaissements), 0),
        decaissements_excep: donnees.lignes.reduce((s, l) => s + num(l.decaissements_excep), 0),
    });

    const handleSave = async () => {
        if (!dateSession) { showNotif('error', 'Date de session requise'); return; }
        setSaving(true);
        try {
            const payload = { date_session: dateSession, donnees };
            if (communeId) payload.commune_id = communeId;
            const res = await fetch('/api/cai/journal-caisse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (res.ok) showNotif('success', 'Données enregistrées avec succès');
            else         showNotif('error', "Erreur lors de l'enregistrement");
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
        const restes  = computeRestes();
        const totaux  = computeTotaux();
        const resteTotal = restes.length > 0 ? restes[restes.length - 1] : num(donnees.report);

        const thBase = (extra = {}) => ({
            border: '1px solid #ccc',
            padding: forPrint ? '2px 3px' : '5px 6px',
            background: AMBER_DARK,
            color: '#fff',
            fontWeight: '700',
            fontSize: forPrint ? '7pt' : '0.7rem',
            textAlign: 'center',
            verticalAlign: 'middle',
            ...extra,
        });

        const tdStyle = (bg = '#fff') => ({
            border: '1px solid #e5e7eb',
            padding: forPrint ? '2px 3px' : '2px 4px',
            background: bg,
            verticalAlign: 'middle',
            fontSize: forPrint ? '7pt' : '0.75rem',
        });

        const inputStyle = {
            width: '100%', border: '0', background: 'transparent',
            fontSize: '0.72rem', textAlign: 'center', outline: 'none',
        };

        const inputTextStyle = { ...inputStyle, textAlign: 'left' };

        const numTd = (val, bg, isNeg = false) => (
            <td style={{ ...tdStyle(bg), textAlign: 'right', color: isNeg ? '#dc2626' : '#111827', fontWeight: isNeg ? '700' : '400', paddingRight: forPrint ? '4px' : '6px' }}>
                {forPrint ? <span>{val !== '' ? fmtNum(val) : ''}</span> : fmtNum(val)}
            </td>
        );

        return (
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: forPrint ? undefined : '960px' }}>
                <thead>
                    {/* Ligne 1 */}
                    <tr>
                        <th rowSpan={3} style={thBase({ minWidth: forPrint ? undefined : '80px' })}>Date</th>
                        <th rowSpan={3} style={thBase({ minWidth: forPrint ? undefined : '100px' })}>Produit</th>
                        <th rowSpan={3} style={thBase({ minWidth: forPrint ? undefined : '140px' })}>
                            Opérations<br />(Ventes, achats<br />et autres)
                        </th>
                        <th colSpan={4} style={thBase({ background: AMBER_MID })}>Trésorerie</th>
                        <th rowSpan={3} style={thBase({ background: SOLDE_HDR, minWidth: forPrint ? undefined : '90px' })}>
                            Soldes<br />Reste
                        </th>
                        {!forPrint && <th rowSpan={3} style={{ ...thBase({ background: '#4b5563', width: '32px' }) }} />}
                    </tr>
                    {/* Ligne 2 */}
                    <tr>
                        <th colSpan={2} style={thBase({ background: ENTREE_HDR })}>Entrées</th>
                        <th colSpan={2} style={thBase({ background: SORTIE_HDR })}>Sorties</th>
                    </tr>
                    {/* Ligne 3 */}
                    <tr>
                        <th style={thBase({ background: ENTREE_HDR, minWidth: forPrint ? undefined : '100px' })}>Encaissements</th>
                        <th style={thBase({ background: ENTREE_HDR, minWidth: forPrint ? undefined : '120px' })}>Encaissements exceptionnels</th>
                        <th style={thBase({ background: SORTIE_HDR, minWidth: forPrint ? undefined : '100px' })}>Décaissements</th>
                        <th style={thBase({ background: SORTIE_HDR, minWidth: forPrint ? undefined : '120px' })}>Décaissements exceptionnels</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Ligne Report */}
                    <tr style={{ background: '#fef9c3' }}>
                        <td colSpan={3} style={{ ...tdStyle('#fef9c3'), fontWeight: '700', color: AMBER_DARK, textAlign: 'left', paddingLeft: '8px' }}>
                            Report
                        </td>
                        <td colSpan={4} style={tdStyle('#fef9c3')} />
                        <td style={{ ...tdStyle('#fef9c3'), textAlign: 'right', fontWeight: '700', color: AMBER_DARK, paddingRight: forPrint ? '4px' : '6px' }}>
                            {forPrint ? (
                                <span>{fmtNum(donnees.report)}</span>
                            ) : (
                                <input
                                    type="text"
                                    style={{ ...inputStyle, fontWeight: '700', color: AMBER_DARK }}
                                    value={donnees.report}
                                    onChange={e => setDonnees(prev => ({ ...prev, report: e.target.value }))}
                                    placeholder="0"
                                />
                            )}
                        </td>
                        {!forPrint && <td style={tdStyle('#fef9c3')} />}
                    </tr>

                    {/* Lignes de données */}
                    {donnees.lignes.map((l, idx) => (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fffbeb' }}>
                            <td style={tdStyle()}>
                                {forPrint ? <span>{l.date}</span> : (
                                    <input type="text" style={inputTextStyle} value={l.date}
                                        onChange={e => setCell(idx, 'date', e.target.value)} placeholder="—" />
                                )}
                            </td>
                            <td style={tdStyle()}>
                                {forPrint ? <span>{l.produit}</span> : (
                                    <input type="text" style={inputTextStyle} value={l.produit}
                                        onChange={e => setCell(idx, 'produit', e.target.value)} placeholder="—" />
                                )}
                            </td>
                            <td style={tdStyle()}>
                                {forPrint ? <span>{l.operations}</span> : (
                                    <input type="text" style={inputTextStyle} value={l.operations}
                                        onChange={e => setCell(idx, 'operations', e.target.value)} placeholder="—" />
                                )}
                            </td>
                            <td style={{ ...tdStyle(ENTREE_BG), textAlign: 'right', paddingRight: forPrint ? '4px' : '6px' }}>
                                {forPrint ? <span>{fmtNum(l.encaissements)}</span> : (
                                    <input type="text" style={{ ...inputStyle, color: ENTREE_HDR }} value={l.encaissements}
                                        onChange={e => setCell(idx, 'encaissements', e.target.value)} placeholder="0" />
                                )}
                            </td>
                            <td style={{ ...tdStyle(ENTREE_BG), textAlign: 'right', paddingRight: forPrint ? '4px' : '6px' }}>
                                {forPrint ? <span>{fmtNum(l.encaissements_excep)}</span> : (
                                    <input type="text" style={{ ...inputStyle, color: ENTREE_HDR }} value={l.encaissements_excep}
                                        onChange={e => setCell(idx, 'encaissements_excep', e.target.value)} placeholder="0" />
                                )}
                            </td>
                            <td style={{ ...tdStyle(SORTIE_BG), textAlign: 'right', paddingRight: forPrint ? '4px' : '6px' }}>
                                {forPrint ? <span>{fmtNum(l.decaissements)}</span> : (
                                    <input type="text" style={{ ...inputStyle, color: SORTIE_HDR }} value={l.decaissements}
                                        onChange={e => setCell(idx, 'decaissements', e.target.value)} placeholder="0" />
                                )}
                            </td>
                            <td style={{ ...tdStyle(SORTIE_BG), textAlign: 'right', paddingRight: forPrint ? '4px' : '6px' }}>
                                {forPrint ? <span>{fmtNum(l.decaissements_excep)}</span> : (
                                    <input type="text" style={{ ...inputStyle, color: SORTIE_HDR }} value={l.decaissements_excep}
                                        onChange={e => setCell(idx, 'decaissements_excep', e.target.value)} placeholder="0" />
                                )}
                            </td>
                            <td style={{ ...tdStyle(SOLDE_BG), textAlign: 'right', fontWeight: '700', paddingRight: forPrint ? '4px' : '6px', color: restes[idx] < 0 ? '#dc2626' : SOLDE_HDR }}>
                                {forPrint ? <span>{fmtNum(restes[idx])}</span> : fmtNum(restes[idx])}
                            </td>
                            {!forPrint && (
                                <td style={{ ...tdStyle(), textAlign: 'center', padding: '2px' }}>
                                    <button onClick={() => removeLigne(idx)} disabled={donnees.lignes.length <= 1}
                                        className="text-red-400 hover:text-red-600 disabled:opacity-30 text-xs font-bold px-1"
                                        title="Supprimer">✕</button>
                                </td>
                            )}
                        </tr>
                    ))}

                    {/* Ligne Total à reporter */}
                    <tr style={{ background: '#e0f2fe' }}>
                        <td colSpan={3} style={{ ...tdStyle('#e0f2fe'), fontWeight: '700', color: SOLDE_HDR, textAlign: 'left', paddingLeft: '8px' }}>
                            Total à reporter
                        </td>
                        {numTd(totaux.encaissements, '#bbf7d0')}
                        {numTd(totaux.encaissements_excep, '#bbf7d0')}
                        {numTd(totaux.decaissements, '#fecaca')}
                        {numTd(totaux.decaissements_excep, '#fecaca')}
                        <td style={{ ...tdStyle('#bfdbfe'), textAlign: 'right', fontWeight: '800', paddingRight: forPrint ? '4px' : '6px', color: resteTotal < 0 ? '#dc2626' : SOLDE_HDR, fontSize: forPrint ? '7pt' : '0.8rem' }}>
                            {forPrint ? <span>{fmtNum(resteTotal)}</span> : fmtNum(resteTotal)}
                        </td>
                        {!forPrint && <td style={tdStyle('#e0f2fe')} />}
                    </tr>
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
                                Étape 14
                            </span>
                            <h1 className="text-2xl font-bold" style={{ color: AMBER_DARK }}>
                                Suivi des mouvements d'argent dans la caisse
                            </h1>
                        </div>
                        <p className="text-gray-600 text-sm">Modèle de journal de caisse</p>
                    </div>

                    {/* Filtre date */}
                    <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-4 mb-6">
                        <div className="flex flex-wrap items-end gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Date de session</label>
                                <input type="date"
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    value={dateSession}
                                    onChange={e => setDateSession(e.target.value)} />
                            </div>
                            <button onClick={loadData}
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                                style={{ background: AMBER_DARK }}>
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
                        <button onClick={addLigne}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border-2 border-dashed border-amber-400 text-amber-700 hover:bg-amber-50">
                            + Ajouter une ligne
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setShowApercu(true)}
                            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700">
                            Aperçu / Imprimer
                        </button>
                        <button onClick={handleSave} disabled={saving}
                            className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                            style={{ background: AMBER_DARK }}>
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
                                Aperçu — Journal de caisse
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={handlePrint}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700">
                                    Imprimer
                                </button>
                                <button onClick={() => setShowApercu(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200">
                                    Fermer
                                </button>
                            </div>
                        </div>
                        <div className="overflow-auto flex-1 p-6" ref={printRef}>
                            <h2 style={{ color: AMBER_DARK, marginBottom: '2px', fontSize: '14px', fontWeight: '700' }}>
                                Phase 4 — Mise en œuvre et suivi
                            </h2>
                            <h3 style={{ color: AMBER_MID, marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>
                                Étape 14 — Suivi des mouvements d'argent dans la caisse
                            </h3>
                            <p style={{ color: '#6b7280', fontSize: '11px', marginBottom: '10px' }}>
                                Journal de caisse — Session : {dateSession}
                            </p>
                            {renderTable(true)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
