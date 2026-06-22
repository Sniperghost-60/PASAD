import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, Icon, ICONS, RoleBadge } from '../components/Layout';
import api from '../services/api';

const STAT_CONFIG = [
    { key: 'producteurs', label: 'Producteurs',       icon: 'users',     from: '#DBEAFE', to: '#93C5FD', color: '#1E40AF', perm: 'producteurs.voir', path: '/producteurs' },
    { key: 'parcelles',   label: 'Parcelles actives', icon: 'parcelles', from: '#D1FAE5', to: '#6EE7B7', color: '#065F46', perm: 'parcelles.voir',   path: '/parcelles'   },
    { key: 'suivis',      label: 'Suivis CEP',         icon: 'suivis',    from: '#FEF3C7', to: '#FCD34D', color: '#92400E', perm: 'suivis.voir',      path: '/suivis'      },
    { key: 'rapports',    label: 'Rapports générés',  icon: 'rapports',  from: '#FCE7F3', to: '#F9A8D4', color: '#9D174D', perm: 'rapports.voir',    path: '/rapports'    },
];

const QUICK_ACTIONS = [
    { label: 'Nouveau producteur', icon: 'users',     bg: '#DBEAFE', color: '#1E40AF', perm: 'producteurs.créer', path: '/producteurs/create' },
    { label: 'Saisir un suivi',    icon: 'suivis',    bg: '#D1FAE5', color: '#065F46', perm: 'suivis.créer',      path: '/suivis/create'      },
    { label: 'Ajouter parcelle',   icon: 'parcelles', bg: '#FEF3C7', color: '#92400E', perm: 'parcelles.créer',   path: '/parcelles/create'   },
    { label: 'Générer rapport',    icon: 'rapports',  bg: '#FCE7F3', color: '#9D174D', perm: 'rapports.générer',  path: '/rapports'           },
    { label: 'Gérer utilisateurs', icon: 'roles',     bg: '#F3E8FF', color: '#6B21A8', perm: 'utilisateurs.voir', path: '/dashboard/users'    },
];

function StatCard({ label, value, icon, from, to, color, loading, path, navigate }) {
    return (
        <div
            onClick={() => navigate(path)}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `linear-gradient(135deg,${from},${to})` }}>
                    <Icon d={ICONS[icon]} className="w-5 h-5" style={{ color }} />
                </div>
            </div>
            {loading ? (
                <div className="h-8 w-16 bg-gray-100 animate-pulse rounded-lg mb-1" />
            ) : (
                <p className="text-2xl font-black text-gray-900">{value}</p>
            )}
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        </div>
    );
}

export default function Dashboard() {
    const { user, hasPermission } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [stats, setStats] = useState({});
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        api.get('/dashboard/stats')
            .then(res => setStats(res.data))
            .catch(() => setStats({}))
            .finally(() => setLoadingStats(false));
    }, []);

    const visibleStats   = STAT_CONFIG.filter(s => hasPermission(s.perm));
    const visibleActions = QUICK_ACTIONS.filter(a => hasPermission(a.perm));

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Bonjour';
        if (h < 18) return 'Bon après-midi';
        return 'Bonsoir';
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(o => !o)} />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header
                    collapsed={collapsed}
                    onToggle={() => setCollapsed(o => !o)}
                    title="Tableau de bord"
                    subtitle={`${greeting()}, ${user?.name?.split(' ')[0]} — résumé de l'activité`}
                />
                <main className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Bannière d'accueil */}
                    <div className="rounded-2xl p-6 flex items-center justify-between overflow-hidden relative"
                        style={{ background: 'linear-gradient(135deg,#1B4332 0%,#40916C 100%)' }}>
                        <div className="relative z-10">
                            <h2 className="text-white text-xl font-black mb-1">{greeting()}, {user?.name} 👋</h2>
                            <p className="text-green-200 text-sm mb-3">Plateforme de suivi CEP — Champs Écoles Paysans</p>
                            <RoleBadge roles={user?.roles} />
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-48 opacity-10 pointer-events-none overflow-hidden">
                            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" />
                            <div className="absolute -right-4 bottom-0 w-56 h-28 rounded-full bg-white" />
                        </div>
                        <div className="hidden md:flex relative z-10 flex-col items-end gap-2">
                            <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2 text-right">
                                <p className="text-green-200 text-xs">Saison en cours</p>
                                <p className="text-white font-bold text-sm">Hivernage 2026</p>
                            </div>
                        </div>
                    </div>

                    {/* Statistiques réelles */}
                    {visibleStats.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Vue d'ensemble</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                {visibleStats.map(s => (
                                    <StatCard
                                        key={s.key}
                                        {...s}
                                        value={stats[s.key] ?? 0}
                                        loading={loadingStats}
                                        navigate={navigate}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Activité récente - état vide */}
                        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100">
                                <h3 className="font-bold text-gray-800">Activité récente</h3>
                            </div>
                            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                                    <Icon d={ICONS.suivis} className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium">Aucune activité pour le moment</p>
                                <p className="text-gray-400 text-sm mt-1">Les actions enregistrées apparaîtront ici</p>
                            </div>
                        </div>

                        {/* Actions rapides */}
                        <div className="flex flex-col gap-4">
                            {visibleActions.length > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-gray-100">
                                        <h3 className="font-bold text-gray-800">Actions rapides</h3>
                                    </div>
                                    <div className="p-3 grid grid-cols-2 gap-2">
                                        {visibleActions.map(({ label, icon, bg, color, path }) => (
                                            <button
                                                key={label}
                                                onClick={() => navigate(path)}
                                                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:opacity-80 transition text-center"
                                                style={{ background: bg }}
                                            >
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                    style={{ background: color + '22' }}>
                                                    <Icon d={ICONS[icon]} className="w-4 h-4" style={{ color }} />
                                                </div>
                                                <span className="text-xs font-semibold leading-tight" style={{ color }}>{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Informations système */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100">
                                    <h3 className="font-bold text-gray-800">Informations</h3>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Utilisateurs enregistrés</span>
                                        <span className="font-semibold text-gray-900">
                                            {loadingStats ? '…' : (stats.utilisateurs ?? 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Votre rôle</span>
                                        <RoleBadge roles={user?.roles} />
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Saison</span>
                                        <span className="font-semibold text-gray-900">Hivernage 2026</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
