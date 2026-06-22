import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/* ─── Données statiques de démonstration ─── */
const STATS = [
    { label: 'Parcelles actives',    value: '12', unit: 'ha',    icon: '🌍', bg: '#D8F3DC', color: '#1B4332', trend: '+2 ce mois' },
    { label: 'Cultures en cours',    value: '8',  unit: 'types', icon: '🌱', bg: '#B7E4C7', color: '#2D6A4F', trend: '3 en floraison' },
    { label: 'Rendement moyen',      value: '42', unit: 'q/ha',  icon: '📈', bg: '#95D5B2', color: '#40916C', trend: '+5 % vs N‑1' },
    { label: 'Zones à irriguer',     value: '3',  unit: 'zones', icon: '💧', bg: '#74C69D', color: '#52B788', trend: 'Demain 06h00' },
];

const ACTIVITY = [
    { time: 'Il y a 2h',  action: 'Traitement phytosanitaire appliqué', parcelle: 'Parcelle B3', icon: '💊' },
    { time: 'Hier',       action: 'Semis blé tendre effectué',           parcelle: 'Parcelle A1', icon: '🌾' },
    { time: 'Il y a 3j',  action: 'Analyse de sol reçue',               parcelle: 'Parcelle C7', icon: '🔬' },
    { time: 'Il y a 5j',  action: 'Récolte maïs terminée',              parcelle: 'Parcelle D2', icon: '🌽' },
];

const NAV = [
    { icon: '📊', label: 'Tableau de bord', path: '/dashboard',  active: true  },
    { icon: '🌍', label: 'Mes Parcelles',   path: '/parcelles'              },
    { icon: '🌱', label: 'Cultures',        path: '/cultures'               },
    { icon: '💧', label: 'Irrigation',      path: '/irrigation'             },
    { icon: '🔬', label: 'Analyses',        path: '/analyses'               },
    { icon: '📈', label: 'Rapports',        path: '/rapports'               },
    { icon: '⚙️', label: 'Paramètres',      path: '/parametres'             },
];

/* ─── Sidebar ─── */
function Sidebar({ open, user, onLogout }) {
    return (
        <aside
            className={`${open ? 'w-64' : 'w-16'} flex-shrink-0 flex flex-col transition-all duration-300`}
            style={{ background: 'linear-gradient(180deg,#1B4332 0%,#2D6A4F 100%)' }}
        >
            {/* Logo */}
            <div className="p-5 flex items-center gap-3 border-b border-white/10">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow"
                    style={{ background: 'linear-gradient(135deg,#D4A017,#F59E0B)' }}>
                    <span className="text-base">🌾</span>
                </div>
                {open && (
                    <div>
                        <p className="text-white font-bold text-lg tracking-wide leading-none">AgriSuivi CEP</p>
                        <p className="text-green-300 text-xs mt-0.5">Champs Écoles Paysans</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 space-y-0.5 px-2">
                {NAV.map(({ icon, label, path, active }) => (
                    <Link key={path} to={path}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                            ${active ? 'bg-white/15 text-white font-semibold' : 'text-green-200 hover:bg-white/10 hover:text-white'}`}>
                        <span className="text-lg flex-shrink-0">{icon}</span>
                        {open && <span className="text-sm truncate">{label}</span>}
                    </Link>
                ))}
            </nav>

            {/* Profil */}
            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                    text-white text-sm font-bold"
                        style={{ background: '#40916C' }}>
                        {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
                    </div>
                    {open && (
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">{user?.name}</p>
                            <p className="text-green-300 text-xs truncate">{user?.email}</p>
                        </div>
                    )}
                </div>
                {open && (
                    <button onClick={onLogout}
                        className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-xl
                                   text-green-200 hover:bg-white/10 hover:text-white transition text-xs">
                        <span>🚪</span><span>Se déconnecter</span>
                    </button>
                )}
            </div>
        </aside>
    );
}

/* ─── Dashboard principal ─── */
export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = async () => { await logout(); navigate('/login'); };

    return (
        <div className="min-h-screen flex" style={{ background: '#EEF6F1' }}>
            <Sidebar open={sidebarOpen} user={user} onLogout={handleLogout}/>

            <main className="flex-1 flex flex-col overflow-hidden">

                {/* Header */}
                <header className="bg-white border-b border-green-100 px-6 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(o => !o)}
                            className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-700 transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg font-bold" style={{ color: '#1B4332' }}>Tableau de bord</h1>
                        <p className="text-xs text-gray-400">Bonjour, {user?.name} · AgriSuivi CEP</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-xl">
                            <span className="text-sm">🌤️</span>
                            <span className="text-xs font-medium" style={{ color: '#2D6A4F' }}>24°C · Ensoleillé</span>
                        </div>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                            style={{ background: 'linear-gradient(135deg,#1B4332,#40916C)' }}>
                            {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
                        </div>
                    </div>
                </header>

                {/* Contenu */}
                <div className="flex-1 overflow-auto p-6 space-y-5">

                    {/* Statistiques */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                        {STATS.map(({ label, value, unit, icon, bg, color, trend }) => (
                            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-green-50">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                                        style={{ background: bg }}>
                                        {icon}
                                    </div>
                                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">actif</span>
                                </div>
                                <div className="flex items-end gap-1.5">
                                    <span className="text-3xl font-bold" style={{ color }}>{value}</span>
                                    <span className="text-sm text-gray-400 mb-1">{unit}</span>
                                </div>
                                <p className="text-gray-500 text-xs mt-0.5">{label}</p>
                                <p className="text-xs mt-1 font-medium" style={{ color: '#40916C' }}>{trend}</p>
                            </div>
                        ))}
                    </div>

                    {/* Activité + Actions */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                        {/* Activité récente */}
                        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-green-50 p-5">
                            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1B4332' }}>
                                <span>📋</span> Activité récente
                            </h3>
                            <div className="space-y-2">
                                {ACTIVITY.map(({ time, action, parcelle, icon }) => (
                                    <div key={action}
                                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-green-50 transition cursor-pointer">
                                        <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-base flex-shrink-0">
                                            {icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-800 font-medium">{action}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{parcelle} · {time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions rapides */}
                        <div className="bg-white rounded-2xl shadow-sm border border-green-50 p-5">
                            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1B4332' }}>
                                <span>⚡</span> Actions rapides
                            </h3>
                            <div className="space-y-2">
                                {[
                                    { label: 'Nouvelle parcelle',      icon: '➕', bg: '#D8F3DC' },
                                    { label: 'Enregistrer récolte',    icon: '🌾', bg: '#FEF3C7' },
                                    { label: 'Planifier irrigation',   icon: '💧', bg: '#DBEAFE' },
                                    { label: 'Demander analyse sol',   icon: '🔬', bg: '#EDE9FE' },
                                    { label: 'Générer rapport',        icon: '📊', bg: '#FCE7F3' },
                                ].map(({ label, icon, bg }) => (
                                    <button key={label}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl
                                                   hover:opacity-80 transition text-left"
                                        style={{ background: bg }}>
                                        <span className="text-base">{icon}</span>
                                        <span className="text-sm font-medium text-gray-700">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Planning de la semaine */}
                    <div className="bg-white rounded-2xl shadow-sm border border-green-50 p-5">
                        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1B4332' }}>
                            <span>📅</span> Planning de la semaine
                        </h3>
                        <div className="grid grid-cols-7 gap-2">
                            {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((day, i) => (
                                <div key={day}
                                    className={`text-center rounded-xl p-3 transition ${i === 0 ? '' : 'hover:bg-green-50'}`}
                                    style={i === 0 ? { background: 'linear-gradient(135deg,#1B4332,#40916C)' } : {}}>
                                    <p className={`text-xs font-medium ${i === 0 ? 'text-green-200' : 'text-gray-400'}`}>{day}</p>
                                    <p className={`text-base font-bold mt-1 ${i === 0 ? 'text-white' : 'text-gray-700'}`}>{22 + i}</p>
                                    {[1, 3, 5].includes(i) && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mx-auto mt-1.5"/>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
