import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/* ── Icônes ──────────────────────────────────────────────────────────── */
export const Icon = ({ d, className = 'size-5' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

export const ICONS = {
    dashboard: 'M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5ZM4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4Zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4Z',
    users:     'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    parcelles: 'M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16',
    cultures:  'M12 22V12M20.6 14.4A8 8 0 0 0 12 6a8 8 0 0 0-8.6 8.4',
    suivis:    'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
    rapports:  'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
    caisse:    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2',
    stats:     'M3 3v18h18M7 12l4-4 4 4 5-5',
    settings:  'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
    logout:    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    bell:      'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
    search:    'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
    shield:    'M12 3 4 7v6c0 5 8 8 8 8s8-3 8-8V7l-8-4Zm-2 9 1.5 1.5L15 10',
    chevron:   'M19 9l-7 7-7-7',
    plus:      'M12 5v14M5 12h14',
    edit:      'M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    trash:     'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6',
    check:     'M20 6 9 17l-5-5',
    x:         'M18 6 6 18M6 6l12 12',
    map:       'M17.657 16.657L13.414 20.9a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
};

/* ── Badge rôle ─────────────────────────────────────────────────────── */
const ROLE_BADGE = {
    'Super-Admin':    { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
    'Administrateur': { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
    'Superviseur':    { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
    'Conseiller':     { bg: 'bg-teal-100',   text: 'text-teal-700',   dot: 'bg-teal-500'   },
};

export function RoleBadge({ roles }) {
    const role = roles?.[0];
    if (!role) return null;
    const s = ROLE_BADGE[role] ?? { bg:'bg-slate-100', text:'text-slate-600', dot:'bg-slate-400' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {role}
        </span>
    );
}

/* ── Navigation ─────────────────────────────────────────────────────── */
const CEP_FORMS = [
    { label: 'Profil historique',       path: '/profil-historique',                      icon: 'rapports', step: '1' },
    { label: "Domaines d'activités",    path: '/hierarchisation-domaines-activites',      icon: 'stats',    step: '2' },
    { label: 'Spéculations agricoles',  path: '/hierarchisation-speculations-agricoles',  icon: 'cultures', step: '3' },
    { label: 'Problèmes & solutions',   path: '/matrice-problemes-solutions',             icon: 'suivis',   step: '4' },
    { label: 'Curriculum CEP',          path: '/curriculum-apprentissage-cep',            icon: 'rapports', step: '5' },
    { label: 'Protocoles expér.',       path: '/resume-protocoles-experimentations',      icon: 'suivis',   step: '6' },
];

const buildNav = (hasPermission) => [
    {
        title: 'Formulaires',
        items: [
            { type: 'group', label: 'Fiches CEP', icon: 'rapports', children: CEP_FORMS },
        ],
    },
    {
        title: 'Sensibilisation',
        items: [
            { label: 'Liste de présence',    path: '/liste-presence-sensibilisation',   icon: 'users' },
            { label: 'Identification CEP',   path: '/identification-participants-cep',  icon: 'rapports' },
        ],
    },
    {
        title: 'CEP',
        items: [
            { label: 'Gestion des CEP',          path: '/gestion-cep',            icon: 'cultures' },
            { label: 'Animation des sessions',    path: '/animation-sessions-cep',         icon: 'suivis'   },
            { label: 'Base bénéficiaires',        path: '/base-beneficiaires-intervention', icon: 'users'    },
            { label: 'Bilan sessions',            path: '/bilan-sessions-animation-cep',    icon: 'rapports' },
            { label: 'Visites d\'échanges',       path: '/organisation-visites-echanges',   icon: 'map'      },
            { label: 'Visites commentées',        path: '/visites-echanges-commentees',     icon: 'map'      },
            { label: 'Difficultés & suggestions', path: '/difficultes-suggestions',         icon: 'suivis'   },
            { label: 'Rendements CEP',            path: '/evolution-rendements-cep',        icon: 'stats'    },
            { label: 'Rendement dispositif',      path: '/rendement-dispositif',            icon: 'stats'    },
            { label: 'Rapport démarrage CEP',     path: '/rapport-demarrage-cep',           icon: 'rapports' },
        ],
    },
    {
        title: 'Administration',
        items: [
            hasPermission('utilisateurs.voir') && { label: 'Utilisateurs', path: '/dashboard/users', icon: 'users'    },
            hasPermission('roles.gérer')       && { label: 'Rôles',        path: '/roles',           icon: 'shield'   },
            hasPermission('config.gérer')      && { label: 'Géographie',   path: '/geographie',      icon: 'map'      },
            hasPermission('config.gérer')      && { label: 'Configuration', path: '/config',          icon: 'settings' },
        ].filter(Boolean),
    },
].filter(s => s.items.length > 0);

/* ── Groupe collapsible ──────────────────────────────────────────────── */
function NavGroupItem({ label, icon, children, isActive }) {
    const { pathname } = useLocation();
    const [open, setOpen] = useState(isActive);

    useEffect(() => { if (isActive) setOpen(true); }, [isActive]);

    return (
        <div>
            <button type="button" onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                        ? 'border border-cyan-400/40 bg-teal-500/20 text-white'
                        : 'text-cyan-50/80 hover:bg-white/10 hover:text-white'
                }`}>
                <Icon d={ICONS[icon]} className={`size-4 flex-shrink-0 ${isActive ? 'text-cyan-300' : 'text-cyan-300/60'}`} />
                <span className="flex-1 truncate text-left">{label}</span>
                <svg className={`size-3.5 flex-shrink-0 text-cyan-300/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="ml-4 mt-0.5 border-l border-white/10 pl-2.5 space-y-0.5">
                    {children.map(({ label: childLabel, path, icon: childIcon, step }) => (
                        <Link key={path} to={path}
                            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                                pathname.startsWith(path)
                                    ? 'bg-teal-500/25 text-white'
                                    : 'text-cyan-100/65 hover:bg-white/10 hover:text-white'
                            }`}>
                            {step && (
                                <span className={`inline-flex size-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                    pathname.startsWith(path)
                                        ? 'bg-cyan-400 text-slate-900'
                                        : 'bg-white/10 text-cyan-300/70'
                                }`}>{step}</span>
                            )}
                            <span className="truncate">{childLabel}</span>
                            {pathname.startsWith(path) && (
                                <span className="ml-auto size-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Sidebar ─────────────────────────────────────────────────────────── */
export function Sidebar() {
    const { user, hasPermission, logout, activeCommune, setActiveCommune, conseillerCommunes } = useAuth();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const sections = buildNav(hasPermission);
    const [showCommunePicker, setShowCommunePicker] = useState(false);

    const isActive = (path) =>
        path === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(path);

    const isConseiller = user?.roles?.includes('Conseiller');

    return (
        <aside className="fixed inset-y-0 left-0 z-40 w-60 flex flex-col bg-[#062824] overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 flex-shrink-0">
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-400 shadow-md flex-shrink-0">
                    <svg className="size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                </div>
                <div>
                    <p className="text-white font-extrabold text-sm leading-tight">PASAD</p>
                    <p className="text-cyan-300/70 text-[10px] leading-tight">AgriSuivi CEP</p>
                </div>
            </div>

            {/* Sélecteur de commune (Conseiller multi-communes) */}
            {isConseiller && conseillerCommunes.length > 1 && activeCommune && (
                <div className="border-b border-white/10 px-3 py-3 flex-shrink-0">
                    <p className="text-[10px] font-semibold text-cyan-300/60 uppercase tracking-wider mb-1.5 px-1">Commune active</p>
                    <button type="button" onClick={() => setShowCommunePicker(!showCommunePicker)}
                        className="w-full flex items-center gap-2 rounded-lg border border-teal-500/40 bg-teal-500/15 px-3 py-2 text-left hover:bg-teal-500/25 transition-all">
                        <svg className="size-3.5 text-teal-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="flex-1 text-xs font-semibold text-white truncate">{activeCommune.nom}</span>
                        <svg className={`size-3.5 text-cyan-300/60 transition-transform ${showCommunePicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown */}
                    {showCommunePicker && (
                        <div className="mt-1.5 space-y-0.5">
                            {conseillerCommunes.map(c => (
                                <button key={c.id} type="button"
                                    onClick={() => { setActiveCommune(c); setShowCommunePicker(false); }}
                                    className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-all ${
                                        activeCommune?.id === c.id
                                            ? 'bg-teal-500/30 text-white font-semibold'
                                            : 'text-cyan-100/70 hover:bg-white/10 hover:text-white'
                                    }`}>
                                    {activeCommune?.id === c.id && (
                                        <svg className="size-3 text-teal-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                    {activeCommune?.id !== c.id && <span className="size-3 flex-shrink-0" />}
                                    <span className="truncate">{c.nom}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 space-y-6 px-3 py-5">
                {sections.map(section => (
                    <div key={section.title}>
                        <p className="mb-2 px-2 text-xs font-medium text-cyan-100/70 uppercase tracking-wider">{section.title}</p>
                        <div className="space-y-0.5">
                            {section.items.map((item) => {
                                if (item.type === 'group') {
                                    const groupActive = item.children.some(c => isActive(c.path));
                                    return (
                                        <NavGroupItem key={item.label}
                                            label={item.label}
                                            icon={item.icon}
                                            children={item.children}
                                            isActive={groupActive}
                                        />
                                    );
                                }
                                const active = isActive(item.path);
                                return (
                                    <Link key={item.path} to={item.path}
                                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                            active
                                                ? 'border border-cyan-400/40 bg-teal-500/20 text-white'
                                                : 'text-cyan-50/80 hover:bg-white/10 hover:text-white'
                                        }`}>
                                        <Icon d={ICONS[item.icon]} className={`size-4 flex-shrink-0 ${active ? 'text-cyan-300' : 'text-cyan-300/60'}`} />
                                        <span className="truncate">{item.label}</span>
                                        {active && <span className="ml-auto size-1.5 rounded-full bg-cyan-400 flex-shrink-0" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Profil bas */}
            <div className="border-t border-white/10 p-3 flex-shrink-0">
                <div className="flex items-center gap-3 rounded-lg px-2 py-2 mb-1">
                    <div className="size-8 rounded-full bg-amber-400 flex items-center justify-center text-slate-900 text-sm font-extrabold flex-shrink-0">
                        {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
                        <RoleBadge roles={user?.roles} />
                    </div>
                </div>
                <button onClick={() => { logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-cyan-100/70 hover:text-red-300 hover:bg-red-500/10 transition text-xs font-medium">
                    <Icon d={ICONS.logout} className="size-4" />
                    <span>Se déconnecter</span>
                </button>
            </div>
        </aside>
    );
}

/* ── Header ──────────────────────────────────────────────────────────── */
export function Header({ title = 'Tableau de bord', subtitle }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

    useEffect(() => {
        const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-slate-200 bg-white/95 backdrop-blur px-6">
            <div className="mr-auto">
                <h1 className="text-lg font-extrabold text-slate-900 leading-tight">{title}</h1>
                {(subtitle || today) && <p className="text-xs text-slate-400 leading-tight capitalize">{subtitle || today}</p>}
            </div>

            {/* Notifications */}
            <button className="relative grid size-9 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition">
                <Icon d={ICONS.bell} className="size-4" />
                <span className="absolute top-1 right-1 size-2 rounded-full bg-red-500 border border-white" />
            </button>

            {/* Profil */}
            <div className="relative" ref={ref}>
                <button onClick={() => setOpen(o => !o)}
                    className="flex items-center gap-2 rounded-full hover:bg-slate-100 pl-1 pr-3 py-1 transition">
                    <div className="size-8 rounded-full bg-amber-400 flex items-center justify-center text-slate-900 text-sm font-extrabold">
                        {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="hidden sm:block text-left">
                        <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</p>
                        <RoleBadge roles={user?.roles} />
                    </div>
                    <Icon d={ICONS.chevron} className="size-3.5 text-slate-400" />
                </button>

                {open && (
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100">
                            <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                        <button onClick={() => { setOpen(false); logout(); navigate('/login'); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
                            <Icon d={ICONS.logout} className="size-4" />
                            Se déconnecter
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
