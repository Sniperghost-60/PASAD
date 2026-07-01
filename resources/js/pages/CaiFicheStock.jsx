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
const STOCK_BG    = '#dbeafe';
const STOCK_HDR   = '#1d4ed8';

const emptyLigne = () => ({
    date_mvt: '', entree_qte: '', entree_pu: '', entree_montant: '',
    entree_provenance: '', sortie_qte: '', sortie_montant: '',
    sortie_destination: '', observations: '',
});

const emptyDonnees = () => ({ report: { stock_qte: '' }, lignes: Array.from({ length: 5 }, emptyLigne) });

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
    'p{font-size:8pt;color:#6b7280;margin-bottom:6px}',
    'table{border-collapse:collapse;width:100%}',
    'th,td{border:1px solid #ccc;padding:2px 4px;font-size:7pt;vertical-align:middle;text-align:center}',
    'th{font-weight:bold}',
    'td.left{text-align:left}',
    '.hdr-base{background:#78350F;color:#fff}',
    '.hdr-entree{background:#16a34a;color:#fff}',
    '.hdr-sortie{background:#dc2626;color:#fff}',
    '.hdr-stock{background:#1d4ed8;color:#fff}',
    '.entree{background:#dcfce7}',
    '.sortie{background:#fee2e2}',
    '.stock{background:#dbeafe;font-weight:700}',
    '.report-row td{background:#fef9c3;font-weight:700}',
    '.total-row td{background:#e0f2fe;font-weight:700}',
    '.neg{color:#dc2626}',
    '@page{size:A4 landscape;margin:8mm}',
].join('');

export default function CaiFicheStock() {
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
            let url = '/api/cai/fiche-stock?date_session=' + dateSession;
            if (communeId) url += '&commune_id=' + communeId;
            const res = await fetch(url, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.donnees && data.donnees.lignes) {
                    setDonnees({
                        report: data.donnees.report ?? { stock_qte: '' },
                        lignes: data.donnees.lignes,
                    });
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

    // Stock en cascade : report.stock_qte + entrées - sorties par ligne
    const computeStocks = () => {
        let stock = num(donnees.report?.stock_qte ?? '');
        return donnees.lignes.map(l => {
            stock = stock + num(l.entree_qte) - num(l.sortie_qte);
            return stock;
        });
    };

    const handleSave = async () => {
        if (!dateSession) { showNotif('error', 'Date de session requise'); return; }
        setSaving(true);
        try {
            const payload = { date_session: dateSession, donnees };
            if (communeId) payload.commune_id = communeId;
            const res = await fetch('/api/cai/fiche-stock', {
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
        const stocks     = computeStocks();
        const finalStock = stocks.length > 0 ? stocks[stocks.length - 1] : num(donnees.report?.stock_qte ?? '');

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

        return (
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: forPrint ? undefined : '1150px' }}>
                <thead>
                    <tr>
                        <th rowSpan={2} style={thBase({ minWidth: forPrint ? undefined : '80px' })}>Date des mvts</th>
                        <th colSpan={4} style={thBase({ background: ENTREE_HDR })}>Entrées</th>
                        <th colSpan={3} style={thBase({ background: SORTIE_HDR })}>Sorties</th>
                        <th rowSpan={2} style={thBase({ background: STOCK_HDR, minWidth: forPrint ? undefined : '80px' })}>
                            Stocks<br />Qté
                        </th>
                        <th rowSpan={2} style={thBase({ minWidth: forPrint ? undefined : '120px' })}>Observations</th>
                        {!forPrint && <th rowSpan={2} style={{ ...thBase({ background: '#4b5563', width: '32px' }) }} />}
                    </tr>
                    <tr>
                        <th style={thBase({ background: ENTREE_HDR, minWidth: forPrint ? undefined : '70px' })}>Qté</th>
                        <th style={thBase({ background: ENTREE_HDR, minWidth: forPrint ? undefined : '80px' })}>P.U</th>
                        <th style={thBase({ background: ENTREE_HDR, minWidth: forPrint ? undefined : '100px' })}>Montant FCFA</th>
                        <th style={thBase({ background: ENTREE_HDR, minWidth: forPrint ? undefined : '130px' })}>Provenance (parcelles)</th>
                        <th style={thBase({ background: SORTIE_HDR, minWidth: forPrint ? undefined : '70px' })}>Qté</th>
                        <th style={thBase({ background: SORTIE_HDR, minWidth: forPrint ? undefined : '100px' })}>Montant FCFA</th>
                        <th style={thBase({ background: SORTIE_HDR, minWidth: forPrint ? undefined : '130px' })}>Client/destination</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Ligne Report */}
                    <tr style={{ background: '#fef9c3' }}>
                        <td style={{ ...tdStyle('#fef9c3'), fontWeight: '700', color: AMBER_DARK, textAlign: 'left', paddingLeft: '8px' }}>
                            Report
                        </td>
                        <td colSpan={4} style={tdStyle('#fef9c3')} />
                        <td colSpan={3} style={tdStyle('#fef9c3')} />
                        <td style={{ ...tdStyle('#fef9c3'), textAlign: 'right', fontWeight: '700', color: STOCK_HDR, paddingRight: forPrint ? '4px' : '6px' }}>
                            {forPrint ? (
                                <span>{fmtNum(donnees.report?.stock_qte ?? '')}</span>
                            ) : (
                                <input
                                    type="text"
                                    style={{ ...inputStyle, fontWeight: '700', color: STOCK_HDR }}
                                    value={donnees.report?.stock_qte ?? ''}
                                    onChange={e => setDonnees(prev => ({ ...prev, report: { ...prev.report, stock_qte: e.target.value } }))}
                                    placeholder="0"
                                />
                            )}
                        </td>
                        <td style={tdStyle('#fef9c3')} />
                        {!forPrint && <td style={tdStyle('#fef9c3')} />}
                    </tr>

                    {/* Lignes de données */}
                    {donnees.lignes.map((l, idx) => (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fffbeb' }}>
                            <td style={tdStyle()}>
                                {forPrint ? <span>{l.date_mvt}</span> : (
                                    <input type="text" style={inputTextStyle} value={l.date_mvt}
                                        onChange={e => setCell(idx, 'date_mvt', e.target.value)} placeholder="—" />
                                )}
                            </td>
                            <td style={{ ...tdStyle(ENTREE_BG), textAlign: 'right', paddingRight: forPrint ? '4px' : '6px' }}>
                                {forPrint ? <span>{l.entree_qte}</span> : (
                                    <input type="text" style={{ ...inputStyle, color: ENTREE_HDR }} value={l.entree_qte}
                                        onChange={e => setCell(idx, 'entree_qte', e.target.value)} placeholder="—" />
                                )}
                            </td>
                            <td style={{ ...tdStyle(ENTREE_BG), textAlign: 'right', paddingRight: forPrint ? '4px' : '6px' }}>
                                {forPrint ? <span>{l.entree_pu ? fmtNum(l.entree_pu) : ''}</span> : (
                                    <input type="text" style={{ ...inputStyle, color: ENTREE_HDR }} value={l.entree_pu}
                                        onChange={e => setCell(idx, 'entree_pu', e.target.value)} placeholder="0" />
                                )}
                            </td>
                            <td style={{ ...tdStyle(ENTREE_BG), textAlign: 'right', paddingRight: forPrint ? '4px' : '6px' }}>
                                {forPrint ? <span>{l.entree_montant ? fmtNum(l.entree_montant) : ''}</span> : (
                                    <input type="text" style={{ ...inputStyle, color: ENTREE_HDR }} value={l.entree_montant}
                                        onChange={e => setCell(idx, 'entree_montant', e.target.value)} placeholder="0" />
                                )}
                            </td>
                            <td style={tdStyle(ENTREE_BG)}>
                                {forPrint ? <span>{l.entree_provenance}</span> : (
                                    <input type="text" style={inputTextStyle} value={l.entree_provenance}
                                        onChange={e => setCell(idx, 'entree_provenance', e.target.value)} placeholder="—" />
                                )}
                            </td>
                            <td style={{ ...tdStyle(SORTIE_BG), textAlign: 'right', paddingRight: forPrint ? '4px' : '6px' }}>
                                {forPrint ? <span>{l.sortie_qte}</span> : (
                                    <input type="text" style={{ ...inputStyle, color: SORTIE_HDR }} value={l.sortie_qte}
                                        onChange={e => setCell(idx, 'sortie_qte', e.target.value)} placeholder="—" />
                                )}
                            </td>
                            <td style={{ ...tdStyle(SORTIE_BG), textAlign: 'right', paddingRight: forPrint ? '4px' : '6px' }}>
                                {forPrint ? <span>{l.sortie_montant ? fmtNum(l.sortie_montant) : ''}</span> : (
                                    <input type="text" style={{ ...inputStyle, color: SORTIE_HDR }} value={l.sortie_montant}
                                        onChange={e => setCell(idx, 'sortie_montant', e.target.value)} placeholder="0" />
                                )}
                            </td>
                            <td style={tdStyle(SORTIE_BG)}>
                                {forPrint ? <span>{l.sortie_destination}</span> : (
                                    <input type="text" style={inputTextStyle} value={l.sortie_destination}
                                        onChange={e => setCell(idx, 'sortie_destination', e.target.value)} placeholder="—" />
                                )}
                            </td>
                            <td style={{ ...tdStyle(STOCK_BG), textAlign: 'right', fontWeight: '700', paddingRight: forPrint ? '4px' : '6px', color: stocks[idx] < 0 ? '#dc2626' : STOCK_HDR }}>
                                {forPrint ? <span>{fmtNum(stocks[idx])}</span> : fmtNum(stocks[idx])}
                            </td>
                            <td style={tdStyle()}>
                                {forPrint ? <span>{l.observations}</span> : (
                                    <input type="text" style={inputTextStyle} value={l.observations}
                                        onChange={e => setCell(idx, 'observations', e.target.value)} placeholder="—" />
                                )}
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

                    {/* Ligne A reporter */}
                    <tr style={{ background: STOCK_BG }}>
                        <td colSpan={8} style={{ ...tdStyle(STOCK_BG), fontWeight: '700', color: STOCK_HDR, textAlign: 'left', paddingLeft: '8px' }}>
                            A reporter
                        </td>
                        <td style={{ ...tdStyle('#bfdbfe'), textAlign: 'right', fontWeight: '800', paddingRight: forPrint ? '4px' : '6px', color: finalStock < 0 ? '#dc2626' : STOCK_HDR, fontSize: forPrint ? '7pt' : '0.8rem' }}>
                            {forPrint ? <span>{fmtNum(finalStock)}</span> : fmtNum(finalStock)}
                        </td>
                        <td style={tdStyle(STOCK_BG)} />
                        {!forPrint && <td style={tdStyle(STOCK_BG)} />}
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
                                Étape 15
                            </span>
                            <h1 className="text-2xl font-bold" style={{ color: AMBER_DARK }}>
                                Suivi des mouvements de stock
                            </h1>
                        </div>
                        <p className="text-gray-600 text-sm">Modèle de fiche de stock — d'intrants et de produits agricoles</p>
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="font-bold text-lg" style={{ color: AMBER_DARK }}>
                                Aperçu — Fiche de stock
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
                                Étape 15 — Suivi des mouvements de stock d'intrants et de produits agricoles
                            </h3>
                            <p style={{ color: '#6b7280', fontSize: '11px', marginBottom: '10px' }}>
                                Fiche de stock — Session : {dateSession}
                            </p>
                            {renderTable(true)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
