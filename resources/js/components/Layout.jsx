import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/* ─── Icônes SVG ─────────────────────────────────────────────────────── */
const Icon = ({ d, d2, className = 'w-5 h-5' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />{d2 && <path d={d2} />}
    </svg>
);

const ICONS = {
    dashboard:    'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    users:        'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    parcelles:    'M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16',
    cultures:     'M12 22V12M20.6 14.4A8 8 0 0 0 12 6a8 8 0 0 0-8.6 8.4',
    suivis:       'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
    rapports:     'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
    caisse:       'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2',
    stats:        'M18 20V10M12 20V4M6 20v-6',
    settings:     'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    logout:       'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    bell:         'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
    search:       'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
    menu:         'M4 6h16M4 12h16M4 18h7',
    chevronLeft:  'M15 18l-6-6 6-6',
    chevronRight: 'M9 18l6-6-6-6',
    user:         'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    shield:       'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    roles:        'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    sun:          'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
};

/* ─── Config navigation par rôle ─────────────────────────────────────── */
const buildNav = (hasRole, hasPermission) => {
    const sections = [
        {
            title: 'Principal',
            items: [
                { label: 'Tableau de bord', path: '/dashboard',  icon: 'dashboard' },
            ],
        },
        {
            title: 'Terrain',
            items: [
                hasPermission('producteurs.voir')  && { label: 'Producteurs',  path: '/producteurs', icon: 'users'     },
                hasPermission('parcelles.voir')    && { label: 'Parcelles',    path: '/parcelles',   icon: 'parcelles' },
                hasPermission('suivis.voir')       && { label: 'Suivis CEP',   path: '/suivis',      icon: 'suivis'    },
                hasPermission('parcelles.voir')    && { label: 'Cultures',     path: '/cultures',    icon: 'cultures'  },
            ].filter(Boolean),
        },
        {
            title: 'Gestion',
            items: [
                hasPermission('caisse.voir')       && { label: 'Caisse & Stock', path: '/caisse',    icon: 'caisse'  },
                hasPermission('rapports.voir')     && { label: 'Rapports',       path: '/rapports',  icon: 'rapports'},
                hasPermission('rapports.générer')  && { label: 'Statistiques',   path: '/stats',     icon: 'stats'   },
            ].filter(Boolean),
        },
        {
            title: 'Administration',
            items: [
                hasPermission('utilisateurs.voir') && { label: 'Utilisateurs',  path: '/dashboard/users', icon: 'users'   },
                hasPermission('roles.gérer')       && { label: 'Rôles',          path: '/roles',        icon: 'shield'  },
                hasPermission('config.gérer')      && { label: 'Configuration',  path: '/config',       icon: 'settings'},
            ].filter(Boolean),
        },
    ].filter(s => s.items.length > 0);

    return sections;
};

/* ─── Badge rôle ─────────────────────────────────────────────────────── */
const ROLE_BADGE = {
    'Super-Admin':   { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
    'Administrateur':{ bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
    'Superviseur':   { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
    'Conseiller':    { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
};

function RoleBadge({ roles }) {
    const role = roles?.[0];
    if (!role) return null;
    const style = ROLE_BADGE[role] ?? { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {role}
        </span>
    );
}

/* ─── Sidebar ─────────────────────────────────────────────────────────── */
export function Sidebar({ collapsed, onToggle }) {
    const { user, hasRole, hasPermission, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const navSections = buildNav(hasRole, hasPermission);

    const handleLogout = async () => { await logout(); navigate('/login'); };
    const isActive = (path) => location.pathname === path;

    return (
        <aside
            className={`${collapsed ? 'w-[68px]' : 'w-64'} flex-shrink-0 flex flex-col h-screen sticky top-0
                        transition-all duration-300 ease-in-out overflow-hidden`}
            style={{ background: 'linear-gradient(180deg,#0F2D1C 0%,#1B4332 60%,#2D6A4F 100%)' }}
        >
            {/* Logo */}
            <div className={`flex items-center h-16 border-b border-white/10 flex-shrink-0
                            ${collapsed ? 'justify-center px-0' : 'px-5 gap-3'}`}>
                <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg"
                    style={{ background: 'linear-gradient(135deg,#D4A017,#F59E0B)' }}>
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                    </svg>
                </div>
                {!collapsed && (
                    <div className="min-w-0">
                        <p className="text-white font-bold text-sm leading-tight tracking-wide">AgriSuivi CEP</p>
                        <p className="text-green-400 text-[10px] leading-tight">Champs Écoles Paysans</p>
                    </div>
                )}
                {!collapsed && (
                    <button onClick={onToggle}
                        className="ml-auto p-1.5 rounded-lg text-green-400 hover:text-white hover:bg-white/10 transition flex-shrink-0">
                        <Icon d={ICONS.chevronLeft} className="w-4 h-4" />
                    </button>
                )}
                {collapsed && (
                    <button onClick={onToggle} className="sr-only" />
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
                {navSections.map((section) => (
                    <div key={section.title} className="mb-1">
                        {!collapsed && (
                            <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-green-500/70 select-none">
                                {section.title}
                            </p>
                        )}
                        {collapsed && <div className="my-1 mx-3 border-t border-white/10" />}
                        {section.items.map(({ label, path, icon }) => (
                            <Link key={path} to={path}
                                className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl transition-all duration-150 group
                                    ${isActive(path)
                                        ? 'bg-white/15 text-white shadow-sm'
                                        : 'text-green-200/80 hover:bg-white/10 hover:text-white'
                                    } ${collapsed ? 'justify-center' : ''}`}
                                title={collapsed ? label : undefined}
                            >
                                <Icon d={ICONS[icon]} className={`w-[18px] h-[18px] flex-shrink-0 transition-transform group-hover:scale-110
                                    ${isActive(path) ? 'text-white' : 'text-green-300/80'}`} />
                                {!collapsed && (
                                    <span className="text-sm font-medium truncate">{label}</span>
                                )}
                                {!collapsed && isActive(path) && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                                )}
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>

            {/* Profil utilisateur */}
            <div className="flex-shrink-0 border-t border-white/10">
                {!collapsed ? (
                    <div className="p-3">
                        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition cursor-pointer">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                            text-white text-sm font-bold shadow"
                                style={{ background: 'linear-gradient(135deg,#40916C,#74C69D)' }}>
                                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
                                <RoleBadge roles={user?.roles} />
                            </div>
                        </div>
                        <button onClick={handleLogout}
                            className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-xl
                                       text-green-300/80 hover:text-red-300 hover:bg-red-500/10 transition text-xs font-medium">
                            <Icon d={ICONS.logout} className="w-4 h-4" />
                            <span>Se déconnecter</span>
                        </button>
                    </div>
                ) : (
                    <div className="p-2 flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center
                                        text-white text-sm font-bold"
                            style={{ background: 'linear-gradient(135deg,#40916C,#74C69D)' }}>
                            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                        </div>
                        <button onClick={handleLogout} title="Se déconnecter"
                            className="p-2 rounded-lg text-green-300/80 hover:text-red-300 hover:bg-red-500/10 transition">
                            <Icon d={ICONS.logout} className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}

/* ─── Header ──────────────────────────────────────────────────────────── */
export function Header({ collapsed, onToggle, title, subtitle }) {
    const { user } = useAuth();
    const [notifOpen, setNotifOpen]   = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const notifRef   = useRef(null);
    const profileRef = useRef(null);
    const navigate   = useNavigate();
    const { logout } = useAuth();

    // Fermer les dropdowns en cliquant hors
    useEffect(() => {
        const handler = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
            if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between
                           px-5 shadow-sm flex-shrink-0 z-10">
            {/* Gauche */}
            <div className="flex items-center gap-4">
                {collapsed && (
                    <button onClick={onToggle}
                        className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition">
                        <Icon d={ICONS.menu} className="w-5 h-5" />
                    </button>
                )}
                <div>
                    <h1 className="text-base font-bold text-gray-800 leading-tight">{title || 'Tableau de bord'}</h1>
                    <p className="text-xs text-gray-400 leading-tight">{subtitle || today}</p>
                </div>
            </div>

            {/* Droite */}
            <div className="flex items-center gap-2">
                {/* Recherche */}
                <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                    <Icon d={ICONS.search} className="w-4 h-4 text-gray-400" />
                    <input placeholder="Rechercher…" className="bg-transparent text-sm text-gray-600 outline-none w-40 placeholder-gray-400" />
                    <kbd className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
                </div>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button onClick={() => setNotifOpen(o => !o)}
                        className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition">
                        <Icon d={ICONS.bell} className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                    </button>
                    {notifOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-800">Notifications</span>
                                <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">3 nouvelles</span>
                            </div>
                            {[
                                { icon: '🌱', title: 'Semis planifié demain',          time: 'Il y a 30 min', color: 'bg-green-100' },
                                { icon: '📊', title: 'Rapport mensuel disponible',     time: 'Il y a 2h',    color: 'bg-blue-100'  },
                                { icon: '⚠️',  title: 'Parcelle B3 : alerte sécheresse', time: 'Hier',      color: 'bg-amber-100' },
                            ].map(({ icon, title, time, color }) => (
                                <div key={title}
                                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition cursor-pointer border-b border-gray-50 last:border-0">
                                    <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>
                                        {icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 leading-tight">{title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{time}</p>
                                    </div>
                                </div>
                            ))}
                            <div className="px-4 py-2.5 text-center">
                                <button className="text-xs text-green-600 font-semibold hover:underline">
                                    Voir toutes les notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profil */}
                <div className="relative" ref={profileRef}>
                    <button onClick={() => setProfileOpen(o => !o)}
                        className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow"
                            style={{ background: 'linear-gradient(135deg,#1B4332,#40916C)' }}>
                            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name}</p>
                            <RoleBadge roles={user?.roles} />
                        </div>
                        <Icon d={ICONS.chevronLeft} className="w-3.5 h-3.5 text-gray-400 -rotate-90" />
                    </button>
                    {profileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <p className="text-sm font-bold text-gray-800">{user?.name}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                            </div>
                            {[
                                { label: 'Mon profil',      icon: 'user',     path: '/profil'    },
                                { label: 'Paramètres',      icon: 'settings', path: '/parametres'},
                            ].map(({ label, icon, path }) => (
                                <button key={path} onClick={() => { setProfileOpen(false); navigate(path); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-sm text-gray-700">
                                    <Icon d={ICONS[icon]} className="w-4 h-4 text-gray-400" />
                                    {label}
                                </button>
                            ))}
                            <div className="border-t border-gray-100 mt-1">
                                <button onClick={() => { logout(); navigate('/login'); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition text-sm text-red-600">
                                    <Icon d={ICONS.logout} className="w-4 h-4" />
                                    Se déconnecter
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export { RoleBadge, ICONS, Icon };
