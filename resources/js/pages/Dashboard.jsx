import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, RoleBadge, Icon, ICONS } from '../components/Layout';
import api from '../services/api';

const KPI = [
    { key:'producteurs', label:'Producteurs',       icon:ICONS.users,     gradient:'from-teal-500 to-teal-700',    perm:'producteurs.voir', path:'/producteurs' },
    { key:'parcelles',   label:'Parcelles actives', icon:ICONS.parcelles, gradient:'from-indigo-500 to-indigo-700',perm:'parcelles.voir',   path:'/parcelles'   },
    { key:'suivis',      label:'Suivis CEP',         icon:ICONS.suivis,    gradient:'from-amber-500 to-amber-600',  perm:'suivis.voir',      path:'/suivis'      },
    { key:'rapports',    label:'Rapports générés',  icon:ICONS.rapports,  gradient:'from-rose-500 to-rose-700',    perm:'rapports.voir',    path:'/rapports'    },
];

const ACTIONS = [
    { label:'Nouveau producteur', icon:ICONS.users,    color:'text-teal-700',  bg:'bg-teal-50',  border:'border-teal-200', perm:'producteurs.créer', path:'/producteurs/create' },
    { label:'Saisir un suivi',   icon:ICONS.suivis,   color:'text-amber-700', bg:'bg-amber-50', border:'border-amber-200',perm:'suivis.créer',      path:'/suivis/create'      },
    { label:'Ajouter parcelle',  icon:ICONS.parcelles,color:'text-indigo-700',bg:'bg-indigo-50',border:'border-indigo-200',perm:'parcelles.créer',   path:'/parcelles/create'   },
    { label:'Générer rapport',   icon:ICONS.rapports, color:'text-rose-700',  bg:'bg-rose-50',  border:'border-rose-200', perm:'rapports.générer',  path:'/rapports'           },
    { label:'Utilisateurs',      icon:ICONS.users,    color:'text-purple-700',bg:'bg-purple-50',border:'border-purple-200',perm:'utilisateurs.voir', path:'/dashboard/users'   },
];

function KpiCard({ label, value, icon, gradient, loading, path, navigate }) {
    return (
        <div onClick={() => navigate(path)}
            className={"relative overflow-hidden rounded-2xl bg-gradient-to-br " + gradient + " p-5 text-white shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all"}>
            <div className="pointer-events-none absolute -right-5 -top-5 size-24 rounded-full bg-white/10" />
            <div className="flex items-start justify-between mb-4">
                <div className="rounded-xl bg-white/20 p-2.5"><Icon d={icon} className="size-5 text-white" /></div>
            </div>
            {loading
                ? <div className="h-9 w-16 rounded-xl bg-white/20 animate-pulse mb-1" />
                : <p className="text-3xl font-black tracking-tight">{value ?? 0}</p>
            }
            <p className="text-sm font-semibold text-white/80 mt-0.5">{label}</p>
        </div>
    );
}

export default function Dashboard() {
    const { user, hasPermission } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({});
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        api.get('/api/dashboard/stats').then(r => setStats(r.data)).catch(() => setStats({})).finally(() => setLoadingStats(false));
    }, []);

    const visibleKpi     = KPI.filter(k => hasPermission(k.perm));
    const visibleActions = ACTIONS.filter(a => hasPermission(a.perm));

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

    return (
        <div className="min-h-screen bg-slate-100 font-sans antialiased lg:flex">
            <Sidebar />
            <main className="min-w-0 flex-1 lg:ml-60">
                <Header title="Tableau de bord" subtitle={greeting + ", " + (user?.name?.split(' ')[0] ?? '') + " — bienvenue sur la plateforme"} />
                <div className="space-y-6 px-4 py-6 sm:px-6">

                    {/* Bannière */}
                    <div className="relative overflow-hidden rounded-2xl bg-[#062824] p-6 text-white shadow-lg">
                        <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/5" />
                        <div className="relative flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-extrabold mb-1">{greeting}, {user?.name} 👋</h2>
                                <p className="text-cyan-200/80 text-sm mb-3">Plateforme de Suivi CEP — Champs Écoles Paysans</p>
                                <RoleBadge roles={user?.roles} />
                            </div>
                            <div className="hidden sm:block rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-right">
                                <p className="text-cyan-300 text-xs">Saison en cours</p>
                                <p className="text-white font-bold text-sm">Hivernage 2026</p>
                            </div>
                        </div>
                    </div>

                    {/* KPI */}
                    {visibleKpi.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Vue d ensemble</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                {visibleKpi.map(k => <KpiCard key={k.key} {...k} value={stats[k.key]} loading={loadingStats} navigate={navigate} />)}
                            </div>
                        </div>
                    )}

                    {/* Corps */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                <h3 className="text-sm font-extrabold text-slate-800">Activité récente</h3>
                            </div>
                            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                                <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                    <Icon d={ICONS.suivis} className="size-8 text-slate-400" />
                                </div>
                                <p className="font-semibold text-slate-600">Aucune activité pour le moment</p>
                                <p className="text-sm text-slate-400 mt-1">Les actions enregistrées apparaîtront ici</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {visibleActions.length > 0 && (
                                <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-slate-100">
                                        <h3 className="text-sm font-extrabold text-slate-800">Actions rapides</h3>
                                    </div>
                                    <div className="p-3 space-y-1">
                                        {visibleActions.map(({ label, icon, color, bg, border, path }) => (
                                            <button key={label} onClick={() => navigate(path)}
                                                className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border " + border + " " + bg + " hover:opacity-80 transition text-left"}>
                                                <div className="size-7 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                                                    <Icon d={icon} className={"size-4 " + color} />
                                                </div>
                                                <span className={"text-sm font-semibold " + color}>{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100">
                                    <h3 className="text-sm font-extrabold text-slate-800">Système</h3>
                                </div>
                                <div className="p-4 divide-y divide-slate-50">
                                    {[
                                        { label:'Utilisateurs inscrits', value: loadingStats ? '…' : (stats.utilisateurs ?? 0) },
                                        { label:'Saison', value:'Hivernage 2026' },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex items-center justify-between py-2.5 text-sm">
                                            <span className="text-slate-500">{label}</span>
                                            <span className="font-semibold text-slate-800">{value}</span>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between py-2.5 text-sm">
                                        <span className="text-slate-500">Votre rôle</span>
                                        <RoleBadge roles={user?.roles} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
