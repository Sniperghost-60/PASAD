import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, Icon, ICONS } from '../components/Layout';
import Toast from '../components/Toast';
import api from '../services/api';

const FORMATS = [
    { value: 'csv',  label: 'CSV',  hint: 'Compatible tableur, léger' },
    { value: 'xlsx', label: 'Excel (XLSX)', hint: 'Mise en forme tableur' },
    { value: 'pdf',  label: 'PDF',  hint: 'Tableau prêt à imprimer' },
];

export default function ExportDonnees() {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [groups, setGroups]   = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch]   = useState('');
    const [selected, setSelected] = useState(null);
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

    const handleExport = async () => {
        if (!selected) {
            setToast({ show: true, message: 'Choisissez un jeu de données à exporter.', type: 'error' });
            return;
        }
        setExporting(true);
        try {
            const res = await api.get('/api/exports/download', {
                params: {
                    type: selected.key,
                    format,
                    date_from: dateFrom || undefined,
                    date_to: dateTo || undefined,
                },
                responseType: 'blob',
            });

            const disposition = res.headers['content-disposition'] || '';
            const match = disposition.match(/filename="?([^";]+)"?/);
            const filename = match ? match[1] : `${selected.key}.${format}`;

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setToast({ show: true, message: `Export "${selected.label}" généré avec succès.`, type: 'success' });
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
                <Header title="Exporter les données" subtitle="CSV, Excel ou PDF pour n'importe quel jeu de données" />
                <div className="space-y-6 px-4 py-6 sm:px-6">

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* ── Sélection du jeu de données ── */}
                        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                                <Icon d={ICONS.rapports} className="size-4 text-teal-600" />
                                <h2 className="text-sm font-bold text-slate-900">1. Choisir les données</h2>
                            </div>
                            <div className="px-5 py-4">
                                <div className="relative mb-4 max-w-sm">
                                    <Icon d={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="Rechercher un formulaire…"
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition" />
                                </div>

                                {loading ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
                                        ))}
                                    </div>
                                ) : Object.keys(filteredGroups).length === 0 ? (
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
                                                title={f.hint}
                                                className={`rounded-lg border px-2 py-2 text-xs font-bold transition-colors ${
                                                    format === f.value
                                                        ? 'border-teal-500 bg-teal-600 text-white shadow-sm'
                                                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}>
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
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

                                {selected && (
                                    <div className="rounded-lg bg-teal-50 px-3 py-2.5 text-xs font-semibold text-teal-800 ring-1 ring-teal-100">
                                        {selected.label}
                                    </div>
                                )}

                                <button type="button" onClick={handleExport} disabled={exporting || !selected}
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
