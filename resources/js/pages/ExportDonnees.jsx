import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, Icon, ICONS } from '../components/Layout';
import Toast from '../components/Toast';
import api from '../services/api';

const FORMATS = [
    { value: 'csv',  label: 'CSV',  hint: 'Compatible tableur, léger', groupHint: 'Archive ZIP — un CSV par fiche' },
    { value: 'xlsx', label: 'Excel (XLSX)', hint: 'Mise en forme tableur', groupHint: 'Un classeur — une feuille par fiche' },
    { value: 'pdf',  label: 'PDF',  hint: 'Tableau prêt à imprimer', groupHint: 'Un document — une section par fiche' },
];

const VOLETS = [
    { key: 'fiche',  label: 'Par fiche',  hint: 'Exporter un jeu de données précis' },
    { key: 'module', label: 'Par module', hint: 'Exporter un module complet en un fichier' },
];

export default function ExportDonnees() {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [groups, setGroups]   = useState({});
    const [loading, setLoading] = useState(true);
    const [volet, setVolet]     = useState(() =>
        new URLSearchParams(window.location.search).get('volet') === 'module' ? 'module' : 'fiche');
    const [search, setSearch]   = useState('');
    const [selected, setSelected] = useState(null);           // fiche sélectionnée
    const [selectedGroup, setSelectedGroup] = useState(null); // module sélectionné
    const [format, setFormat]   = useState('xlsx');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo]     = useState('');
    const [exporting, setExporting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

    useEffect(() => {
        if (!hasPermission('rapports.exporter')) { navigate('/dashboard'); return; }
        api.get('/api/exports/datasets')
            .then(r => setGroups(r.data || {}))
            .catch(() => setToast({ show: true, message: "Impossible de charger la liste des données.", type: 'error' }))
            .finally(() => setLoading(false));
    }, [hasPermission, navigate]);

    const filteredGroups = useMemo(() => {
        if (!search.trim()) return groups;
        const q = search.trim().toLowerCase();
        const out = {};
        Object.entries(groups).forEach(([group, items]) => {
            const matches = items.filter(i => i.label.toLowerCase().includes(q));
            if (matches.length) out[group] = matches;
        });
        return out;
    }, [groups, search]);

    const currentChoice = volet === 'fiche' ? selected?.label : selectedGroup;
    const canExport = volet === 'fiche' ? !!selected : !!selectedGroup;

    const downloadBlob = (res, fallbackName) => {
        const disposition = res.headers['content-disposition'] || '';
        const match = disposition.match(/filename="?([^";]+)"?/);
        const filename = match ? match[1] : fallbackName;

        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    };

    const handleExport = async () => {
        if (!canExport) {
            setToast({ show: true, message: volet === 'fiche'
                ? 'Choisissez un jeu de données à exporter.'
                : 'Choisissez un module à exporter.', type: 'error' });
            return;
        }
        setExporting(true);
        try {
            const common = { format, date_from: dateFrom || undefined, date_to: dateTo || undefined };
            const res = volet === 'fiche'
                ? await api.get('/api/exports/download', { params: { type: selected.key, ...common }, responseType: 'blob' })
                : await api.get('/api/exports/download-group', { params: { group: selectedGroup, ...common }, responseType: 'blob' });

            const ext = volet === 'module' && format === 'csv' ? 'zip' : format;
            downloadBlob(res, `${volet === 'fiche' ? selected.key : 'export'}.${ext}`);

            setToast({ show: true, message: `Export "${currentChoice}" généré avec succès.`, type: 'success' });
        } catch (err) {
            setToast({ show: true, message: "Échec de l'export. Réessayez.", type: 'error' });
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 font-sans antialiased lg:flex">
            <Sidebar />
            <main className="min-w-0 flex-1 lg:ml-60">
                <Header title="Exporter les données" subtitle="CSV, Excel ou PDF — par fiche ou par module complet" />
                <div className="space-y-6 px-4 py-6 sm:px-6">

                    {/* ── Choix du volet ── */}
                    <div className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                        {VOLETS.map(v => (
                            <button key={v.key} type="button" onClick={() => setVolet(v.key)} title={v.hint}
                                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                                    volet === v.key
                                        ? 'bg-teal-600 text-white'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                }`}>
                                {v.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* ── Sélection ── */}
                        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                                <Icon d={ICONS.rapports} className="size-4 text-teal-600" />
                                <h2 className="text-sm font-bold text-slate-900">
                                    1. {volet === 'fiche' ? 'Choisir les données' : 'Choisir le module'}
                                </h2>
                            </div>
                            <div className="px-5 py-4">
                                {loading ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
                                        ))}
                                    </div>
                                ) : volet === 'fiche' ? (
                                    <>
                                        <div className="relative mb-4 max-w-sm">
                                            <Icon d={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                                placeholder="Rechercher un formulaire…"
                                                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition" />
                                        </div>

                                        {Object.keys(filteredGroups).length === 0 ? (
                                            <p className="py-8 text-center text-sm text-slate-400">Aucun résultat.</p>
                                        ) : (
                                            <div className="max-h-[26rem] space-y-5 overflow-y-auto pr-1">
                                                {Object.entries(filteredGroups).map(([group, items]) => (
                                                    <div key={group}>
                                                        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{group}</p>
                                                        <div className="space-y-1">
                                                            {items.map(item => (
                                                                <button key={item.key} type="button"
                                                                    onClick={() => setSelected(item)}
                                                                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors ${
                                                                        selected?.key === item.key
                                                                            ? 'border-teal-400 bg-teal-50 text-teal-800'
                                                                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                                                    }`}>
                                                                    {item.label}
                                                                    {selected?.key === item.key && <Icon d={ICONS.check} className="size-4 text-teal-600" />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="grid max-h-[28rem] grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                                        {Object.entries(groups).map(([group, items]) => (
                                            <button key={group} type="button" onClick={() => setSelectedGroup(group)}
                                                className={`flex flex-col rounded-xl border p-4 text-left transition-colors ${
                                                    selectedGroup === group
                                                        ? 'border-teal-400 bg-teal-50'
                                                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                }`}>
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={`text-sm font-bold ${selectedGroup === group ? 'text-teal-800' : 'text-slate-800'}`}>{group}</p>
                                                    {selectedGroup === group
                                                        ? <Icon d={ICONS.check} className="size-4 flex-shrink-0 text-teal-600" />
                                                        : <span className="flex-shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{items.length} fiche{items.length > 1 ? 's' : ''}</span>}
                                                </div>
                                                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                                                    {items.slice(0, 4).map(i => i.label).join(' · ')}
                                                    {items.length > 4 && ` · +${items.length - 4} autres`}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Options d'export ── */}
                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm h-fit">
                            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                                <Icon d={ICONS.download} className="size-4 text-teal-600" />
                                <h2 className="text-sm font-bold text-slate-900">2. Format & options</h2>
                            </div>
                            <div className="space-y-5 px-5 py-4">
                                <div>
                                    <p className="mb-2 text-xs font-semibold text-slate-500">Format de fichier</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {FORMATS.map(f => (
                                            <button key={f.value} type="button" onClick={() => setFormat(f.value)}
                                                title={volet === 'module' ? f.groupHint : f.hint}
                                                className={`rounded-lg border px-2 py-2 text-xs font-bold transition-colors ${
                                                    format === f.value
                                                        ? 'border-teal-500 bg-teal-600 text-white shadow-sm'
                                                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}>
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-1.5 text-[11px] text-slate-400">
                                        {(FORMATS.find(f => f.value === format) ?? {})[volet === 'module' ? 'groupHint' : 'hint']}
                                    </p>
                                </div>

                                <div>
                                    <p className="mb-2 text-xs font-semibold text-slate-500">Période (optionnel)</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition" />
                                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition" />
                                    </div>
                                    <p className="mt-1.5 text-[11px] text-slate-400">Filtre sur la date de création des enregistrements.</p>
                                </div>

                                {currentChoice && (
                                    <div className="rounded-lg bg-teal-50 px-3 py-2.5 text-xs font-semibold text-teal-800 ring-1 ring-teal-100">
                                        {volet === 'module' ? 'Module complet : ' : ''}{currentChoice}
                                    </div>
                                )}

                                <button type="button" onClick={handleExport} disabled={exporting || !canExport}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-50">
                                    <Icon d={ICONS.download} className="size-4" />
                                    {exporting ? 'Génération…' : 'Exporter'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
        </div>
    );
}
