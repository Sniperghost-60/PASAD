import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';

const AMBER_DARK = '#78350F';

const QUADRANTS = [
    { key: 'forces',       label: 'Forces',       bg: 'bg-green-50',  border: 'border-green-400', header: 'bg-green-600',  hint: 'Atouts internes favorisant l\'accès aux marchés' },
    { key: 'faiblesses',   label: 'Faiblesses',   bg: 'bg-red-50',    border: 'border-red-400',   header: 'bg-red-600',    hint: 'Contraintes internes limitant l\'accès aux marchés' },
    { key: 'opportunites', label: 'Opportunités',  bg: 'bg-blue-50',   border: 'border-blue-400',  header: 'bg-blue-600',   hint: 'Facteurs externes favorables à saisir' },
    { key: 'menaces',      label: 'Menaces',       bg: 'bg-orange-50', border: 'border-orange-400',header: 'bg-orange-600', hint: 'Facteurs externes défavorables à surveiller' },
];

const PRINT_STYLES = [
    'body{font-family:Arial,sans-serif;font-size:12px;margin:20px;}',
    'h2{color:#78350F;border-bottom:2px solid #78350F;padding-bottom:6px;}',
    '.meta{color:#666;margin-bottom:8px;}',
    '.ffom-grid{display:grid;grid-template-columns:60px 1fr 1fr;gap:8px;}',
    '.axis-cell{background:#f0f0f0;border-radius:4px;text-align:center;font-weight:bold;color:#555;font-size:11px;display:flex;align-items:center;justify-content:center;padding:6px;}',
    '.q-card{border-radius:6px;overflow:hidden;border:2px solid #ccc;}',
    '.q-header{padding:8px 12px;font-weight:bold;color:white;font-size:13px;}',
    '.q-body{padding:10px 12px;min-height:100px;white-space:pre-wrap;font-size:11px;}',
    '.forces .q-header{background:#16a34a;}',
    '.faiblesses .q-header{background:#dc2626;}',
    '.opportunites .q-header{background:#2563eb;}',
    '.menaces .q-header{background:#ea580c;}',
].join('');

/* ── Aperçu ──────────────────────────────────────────────────────────── */
function ApercuModal({ data, commune, dateSession, onClose }) {
    const printRef = useRef();

    const handlePrint = () => {
        const content = printRef.current.innerHTML;
        const win = window.open('', '_blank');
        win.document.write('<html><head><title>FFOM</title><style>' + PRINT_STYLES + '</style></head><body>' + content + '</body></html>');
        win.document.close();
        win.focus();
        win.print();
    };

    const PRINT_COLORS = {
        forces:       { border: '#86efac', header: '#16a34a', bg: '#f0fdf4' },
        faiblesses:   { border: '#fca5a5', header: '#dc2626', bg: '#fef2f2' },
        opportunites: { border: '#93c5fd', header: '#2563eb', bg: '#eff6ff' },
        menaces:      { border: '#fdba74', header: '#ea580c', bg: '#fff7ed' },
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: AMBER_DARK }}>
                    <h3 className="font-bold text-lg" style={{ color: AMBER_DARK }}>Aperçu — Matrice FFOM</h3>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="px-4 py-1.5 rounded-lg text-sm font-medium text-white" style={{ background: AMBER_DARK }}>
                            Imprimer
                        </button>
                        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">
                            Fermer
                        </button>
                    </div>
                </div>
                <div className="overflow-auto p-6" ref={printRef}>
                    <h2 style={{ color: AMBER_DARK, fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
                        Étape 4 — Facteurs limitant l'accès aux marchés
                    </h2>
                    {commune && <p className="meta" style={{ color: '#666', marginBottom: 4, fontSize: 12 }}>Commune : <strong>{commune}</strong></p>}
                    {dateSession && <p className="meta" style={{ color: '#666', marginBottom: 12, fontSize: 12 }}>Date : <strong>{dateSession}</strong></p>}

                    <div className="ffom-grid" style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', gap: 8 }}>
                        <div />
                        <div className="axis-cell" style={{ background: '#f0fdf4', color: '#166534', fontWeight: 700, textAlign: 'center', borderRadius: 6, padding: '6px 4px', fontSize: 12 }}>Positif</div>
                        <div className="axis-cell" style={{ background: '#fef2f2', color: '#991b1b', fontWeight: 700, textAlign: 'center', borderRadius: 6, padding: '6px 4px', fontSize: 12 }}>Négatif</div>

                        <div className="axis-cell" style={{ background: '#f3f4f6', color: '#374151', fontWeight: 700, textAlign: 'center', borderRadius: 6, padding: '6px 4px', fontSize: 12 }}>Interne</div>
                        {['forces', 'faiblesses'].map(k => {
                            const q = QUADRANTS.find(x => x.key === k);
                            const c = PRINT_COLORS[k];
                            return (
                                <div key={k} className={'q-card ' + k} style={{ border: '2px solid ' + c.border, borderRadius: 8, overflow: 'hidden' }}>
                                    <div className="q-header" style={{ background: c.header, color: '#fff', padding: '8px 12px', fontWeight: 700, fontSize: 13 }}>{q.label}</div>
                                    <div className="q-body" style={{ background: c.bg, padding: '10px 12px', minHeight: 80, whiteSpace: 'pre-wrap', fontSize: 12, color: '#1c1917' }}>
                                        {data[k] || '—'}
                                    </div>
                                </div>
                            );
                        })}

                        <div className="axis-cell" style={{ background: '#f3f4f6', color: '#374151', fontWeight: 700, textAlign: 'center', borderRadius: 6, padding: '6px 4px', fontSize: 12 }}>Externe</div>
                        {['opportunites', 'menaces'].map(k => {
                            const q = QUADRANTS.find(x => x.key === k);
                            const c = PRINT_COLORS[k];
                            return (
                                <div key={k} className={'q-card ' + k} style={{ border: '2px solid ' + c.border, borderRadius: 8, overflow: 'hidden' }}>
                                    <div className="q-header" style={{ background: c.header, color: '#fff', padding: '8px 12px', fontWeight: 700, fontSize: 13 }}>{q.label}</div>
                                    <div className="q-body" style={{ background: c.bg, padding: '10px 12px', minHeight: 80, whiteSpace: 'pre-wrap', fontSize: 12, color: '#1c1917' }}>
                                        {data[k] || '—'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Page principale ─────────────────────────────────────────────────── */
export default function CaiFacteursLimitant() {
    const { user, communeId } = useAuth();

    const [dateSession, setDateSession]   = useState('');
    const [data, setData]                 = useState({ forces: '', faiblesses: '', opportunites: '', menaces: '' });
    const [loading, setLoading]           = useState(false);
    const [saving, setSaving]             = useState(false);
    const [notif, setNotif]               = useState({ show: false, type: 'success', message: '' });
    const [showApercu, setShowApercu]     = useState(false);

    const showToast = (type, msg) => {
        setNotif({ show: true, type, message: msg });
        setTimeout(() => setNotif(n => ({ ...n, show: false })), 4000);
    };

    const load = useCallback(async () => {
        if (!dateSession) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ date_session: dateSession });
            if (communeId) params.set('commune_id', communeId);
            const res = await fetch(`/api/cai/facteurs-limitant?${params}`, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Erreur serveur');
            const json = await res.json();
            if (json) {
                setData({
                    forces:       json.forces       ?? '',
                    faiblesses:   json.faiblesses   ?? '',
                    opportunites: json.opportunites ?? '',
                    menaces:      json.menaces       ?? '',
                });
            } else {
                setData({ forces: '', faiblesses: '', opportunites: '', menaces: '' });
            }
        } catch (e) {
            showToast('error', e.message);
        } finally {
            setLoading(false);
        }
    }, [dateSession, communeId]);

    useEffect(() => { load(); }, [load]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { ...data, date_session: dateSession || null };
            if (communeId) payload.commune_id = communeId;

            const res = await fetch('/api/cai/facteurs-limitant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Erreur lors de l\'enregistrement');
            showToast('success', 'Matrice FFOM enregistrée avec succès');
        } catch (e) {
            showToast('error', e.message);
        } finally {
            setSaving(false);
        }
    };

    const commune = user?.commune?.nom_commune ?? '';

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="ml-60 flex flex-1 flex-col">
            <Header />
            <div className="flex-1 bg-amber-50/30">
                {/* Sous-header */}
                <div className="sticky top-0 z-30 border-b border-amber-200 bg-white/95 backdrop-blur px-6 py-3 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs text-amber-700 font-medium uppercase tracking-wider">CAI · Phase 2 — Étape 4</p>
                        <h1 className="text-lg font-bold text-amber-900 leading-tight">Identification des facteurs limitant l'accès aux marchés</h1>
                        <p className="text-xs text-amber-600 mt-0.5">Modèle FFOM (Forces · Faiblesses · Opportunités · Menaces)</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setShowApercu(true)}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-amber-300 text-amber-800 hover:bg-amber-50">
                            Aperçu
                        </button>
                        <button onClick={handleSave} disabled={saving}
                            className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white shadow disabled:opacity-60"
                            style={{ background: AMBER_DARK }}>
                            {saving ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                    </div>
                </div>

                <div className="p-6 max-w-5xl mx-auto space-y-6">
                    <ModernNotification show={notif.show} type={notif.type} message={notif.message} />

                    {/* Contexte */}
                    <div className="bg-white rounded-xl border border-amber-200 p-5 flex flex-wrap gap-4">
                        {commune && (
                            <div>
                                <label className="block text-xs font-semibold text-amber-700 mb-1 uppercase tracking-wide">Commune</label>
                                <p className="text-sm font-medium text-gray-800">{commune}</p>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-semibold text-amber-700 mb-1 uppercase tracking-wide">Date de session</label>
                            <input type="date" value={dateSession} onChange={e => setDateSession(e.target.value)}
                                className="border border-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-10 text-amber-600 font-medium">Chargement…</div>
                    ) : (
                        <>
                            {/* Légende axes */}
                            <div className="grid gap-3" style={{ gridTemplateColumns: '52px 1fr 1fr' }}>
                                <div />
                                <div className="text-center text-sm font-semibold text-green-700 bg-green-100 rounded-lg py-1.5">Positif</div>
                                <div className="text-center text-sm font-semibold text-red-700 bg-red-100 rounded-lg py-1.5">Négatif</div>

                                {/* Ligne Interne */}
                                <div className="flex items-center justify-center bg-gray-100 rounded-lg text-xs font-semibold text-gray-600"
                                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', padding: '12px 6px' }}>
                                    Interne
                                </div>
                                {['forces', 'faiblesses'].map(k => {
                                    const q = QUADRANTS.find(x => x.key === k);
                                    return (
                                        <div key={k} className={`border-2 rounded-xl overflow-hidden shadow-sm ${q.border}`}>
                                            <div className={`${q.header} text-white px-4 py-2.5`}>
                                                <p className="font-bold text-sm">{q.label}</p>
                                                <p className="text-xs opacity-80 mt-0.5">{q.hint}</p>
                                            </div>
                                            <div className={`${q.bg} p-1`}>
                                                <textarea
                                                    rows={6}
                                                    placeholder={`Lister les ${q.label.toLowerCase()}…`}
                                                    value={data[k]}
                                                    onChange={e => setData(d => ({ ...d, [k]: e.target.value }))}
                                                    className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none p-3"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Ligne Externe */}
                                <div className="flex items-center justify-center bg-gray-100 rounded-lg text-xs font-semibold text-gray-600"
                                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', padding: '12px 6px' }}>
                                    Externe
                                </div>
                                {['opportunites', 'menaces'].map(k => {
                                    const q = QUADRANTS.find(x => x.key === k);
                                    return (
                                        <div key={k} className={`border-2 rounded-xl overflow-hidden shadow-sm ${q.border}`}>
                                            <div className={`${q.header} text-white px-4 py-2.5`}>
                                                <p className="font-bold text-sm">{q.label}</p>
                                                <p className="text-xs opacity-80 mt-0.5">{q.hint}</p>
                                            </div>
                                            <div className={`${q.bg} p-1`}>
                                                <textarea
                                                    rows={6}
                                                    placeholder={`Lister les ${q.label.toLowerCase()}…`}
                                                    value={data[k]}
                                                    onChange={e => setData(d => ({ ...d, [k]: e.target.value }))}
                                                    className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none p-3"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {showApercu && (
                <ApercuModal
                    data={data}
                    commune={commune}
                    dateSession={dateSession}
                    onClose={() => setShowApercu(false)}
                />
            )}
            </div>
        </div>
    );
}
