import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, RoleBadge, Icon, ICONS } from '../components/Layout';
import api from '../services/api';

/* ══════════════════════════════════════════════════════════════════════
   UTILITAIRES PARTAGÉS
══════════════════════════════════════════════════════════════════════ */

const IC = {
    doc:    'M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414A1 1 0 0 1 19 9.414V19a2 2 0 0 1-2 2Z',
    chart:  'M3 3v18h18M7 12l4-4 4 4 5-5',
    group:  'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    pin:    'M17.657 16.657L13.414 20.9a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0ZM15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    seed:   'M12 22V12M20.6 14.4A8 8 0 0 0 12 6a8 8 0 0 0-8.6 8.4',
    shield: 'M12 3 4 7v6c0 5 8 8 8 8s8-3 8-8V7l-8-4Zm-2 9 1.5 1.5L15 10',
    check:  'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    map:    'M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z',
    crown:  'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z',
    users2: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
    cog:    'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
};

const svgIcon = (d, cls = 'size-4') => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

const sum = (keys, stats) => keys.reduce((a, k) => a + (stats[k] || 0), 0);
const PIE_COLORS = ['#0d9488', '#7c3aed', '#f59e0b', '#0284c7', '#e11d48', '#4f46e5'];

const fmtNum = (v) => Number(v || 0).toLocaleString('fr-FR');

function DashboardTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
            <p className="mb-1 font-bold text-slate-800">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey || p.name} className="font-semibold" style={{ color: p.color || p.fill }}>
                    {p.name || p.dataKey} : {fmtNum(p.value)}
                </p>
            ))}
        </div>
    );
}

function ChartPanel({ title, subtitle, children, loading }) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
            </div>
            <div className="h-72 p-4">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                    </div>
                ) : children}
            </div>
        </div>
    );
}

function EmptyChart() {
    return (
        <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
            {svgIcon(IC.chart, 'size-10 text-slate-200')}
            <p className="mt-2 text-sm font-semibold">Aucune donnée à afficher</p>
        </div>
    );
}

const rubriqueData = (stats) => [
    { name: 'Fiches CEP', value: sum(FICHES.map(m => m.key), stats), fill: '#7c3aed' },
    { name: 'Sensibilisation', value: sum(SENSIB.map(m => m.key), stats), fill: '#0d9488' },
    { name: 'Activités CEP', value: sum(ACTIVITES.map(m => m.key), stats), fill: '#f59e0b' },
];

const moduleData = (stats) => ALL_MODULES
    .map(m => ({ name: m.label, value: stats[m.key] || 0 }))
    .filter(m => m.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

const roleData = (roles = {}) => Object.entries(roles)
    .map(([name, value]) => ({ name, value: value || 0 }))
    .filter(r => r.value > 0);

function DashboardGraphs({ stats, loading, showAdminGraphs = false }) {
    const rubriques = rubriqueData(stats);
    const modules = moduleData(stats);
    const roles = roleData(stats.users_par_role);
    const topConseillers = (stats.top_conseillers ?? []).map(c => ({
        name: c.name,
        CEP: Number(c.nb_cep || 0),
    }));

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <ChartPanel title="Répartition par rubrique" subtitle="Volume total des saisies CEP" loading={loading}>
                {rubriques.every(r => r.value === 0) ? <EmptyChart /> : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rubriques} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                            <Tooltip content={<DashboardTooltip />} />
                            <Bar dataKey="value" name="Saisies" radius={[8, 8, 0, 0]}>
                                {rubriques.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </ChartPanel>

            <ChartPanel
                title={showAdminGraphs ? 'Utilisateurs par rôle' : 'Modules les plus renseignés'}
                subtitle={showAdminGraphs ? 'Répartition des comptes plateforme' : 'Top modules avec données'}
                loading={loading}>
                {(showAdminGraphs ? roles : modules).length === 0 ? <EmptyChart /> : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={showAdminGraphs ? roles : modules}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={54}
                                outerRadius={86}
                                paddingAngle={3}>
                                {(showAdminGraphs ? roles : modules).map((entry, i) => (
                                    <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<DashboardTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </ChartPanel>

            {showAdminGraphs && (
                <div className="xl:col-span-2">
                    <ChartPanel title="Top conseillers" subtitle="Nombre de CEP créés par conseiller" loading={loading}>
                        {topConseillers.length === 0 ? <EmptyChart /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topConseillers} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <Tooltip content={<DashboardTooltip />} />
                                    <Bar dataKey="CEP" fill="#0d9488" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </ChartPanel>
                </div>
            )}
        </div>
    );
}

/* ── Anneau SVG ── */
function Ring({ pct, color = '#34d399', size = 80, label }) {
    const r = 30, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox="0 0 80 80" className="-rotate-90">
                <circle cx="40" cy="40" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle cx="40" cy="40" r={r} fill="none" stroke={color}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`}
                    style={{ transition: 'stroke-dasharray 0.8s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-black text-slate-800">{pct}%</span>
                {label && <span className="text-[9px] text-slate-400 leading-tight text-center">{label}</span>}
            </div>
        </div>
    );
}

/* ── KPI card ── */
function KpiCard({ label, value, icon, from, to, loading, path, sub }) {
    const content = (
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${from} ${to} p-5 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all`}>
            <div className="pointer-events-none absolute -right-4 -top-4 size-20 rounded-full bg-white/10" />
            <div className="mb-4">{svgIcon(icon, 'size-5 text-white/80')}</div>
            {loading
                ? <div className="h-8 w-12 rounded-xl bg-white/20 animate-pulse mb-1" />
                : <p className="text-3xl font-black tracking-tight">{value ?? 0}</p>
            }
            <p className="text-sm font-semibold text-white/80 mt-0.5">{label}</p>
            {sub && <p className="text-xs text-white/50 mt-0.5">{sub}</p>}
        </div>
    );
    return path ? <Link to={path}>{content}</Link> : content;
}

/* ── Barre avec label ── */
function BarRow({ label, value, max, color, path, loading }) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <Link to={path} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition group">
            <div className={`size-2 rounded-full flex-shrink-0 ${color}`} />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate group-hover:text-teal-700 transition">{label}</p>
                <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
                </div>
            </div>
            <span className="text-sm font-black flex-shrink-0 text-slate-800">{loading ? '…' : (value ?? 0)}</span>
        </Link>
    );
}

/* ── Section de modules (carte) ── */
function ModuleCard({ title, icon, accent, modules, stats, loading }) {
    const maxVal = Math.max(...modules.map(m => stats[m.key] || 0), 1);
    const total  = sum(modules.map(m => m.key), stats);
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className={`px-4 py-3.5 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r ${accent}`}>
                <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-white/20 p-1.5">{svgIcon(icon, 'size-4 text-white')}</div>
                    <h3 className="text-white font-bold text-sm">{title}</h3>
                </div>
                <span className="text-white/80 text-xs font-semibold bg-white/15 rounded-full px-2.5 py-0.5">
                    {loading ? '…' : total}
                </span>
            </div>
            <div className="px-1 py-1 divide-y divide-slate-50">
                {modules.map(m => (
                    <BarRow key={m.key} label={m.label} value={stats[m.key] || 0}
                        max={maxVal} color={m.color} path={m.path} loading={loading} />
                ))}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════════
   DONNÉES DES MODULES CEP
══════════════════════════════════════════════════════════════════════ */
const FICHES = [
    { key:'profil_historique',                     label:'Profil historique',         path:'/profil-historique',                      color:'bg-violet-500' },
    { key:'hierarchisation_domaines_activites',    label:"Domaines d'activités",      path:'/hierarchisation-domaines-activites',      color:'bg-indigo-500' },
    { key:'hierarchisation_speculations_agricoles',label:'Spéculations agricoles',    path:'/hierarchisation-speculations-agricoles',  color:'bg-sky-500'    },
    { key:'matrice_problemes',                     label:'Problèmes & solutions',     path:'/matrice-problemes-solutions',             color:'bg-rose-500'   },
    { key:'curriculum_apprentissage_cep',          label:'Curriculum CEP',            path:'/curriculum-apprentissage-cep',            color:'bg-amber-500'  },
    { key:'resume_protocoles_experimentations',    label:'Protocoles expér.',         path:'/resume-protocoles-experimentations',      color:'bg-orange-500' },
];
const SENSIB = [
    { key:'liste_presence_sensibilisation', label:'Listes de présence', path:'/liste-presence-sensibilisation',  color:'bg-teal-500'    },
    { key:'identification_participants_cep',label:'Participants CEP',    path:'/identification-participants-cep', color:'bg-emerald-500' },
];
const ACTIVITES = [
    { key:'cep',                           label:'Champs-écoles créés',     path:'/gestion-cep',                    color:'bg-teal-600'   },
    { key:'animation_sessions_cep',        label:"Sessions d'animation",    path:'/animation-sessions-cep',         color:'bg-cyan-500'   },
    { key:'base_beneficiaires_intervention',label:'Base bénéficiaires',     path:'/base-beneficiaires-intervention',color:'bg-sky-600'    },
    { key:'bilan_sessions_animation_cep',  label:'Bilans sessions',         path:'/bilan-sessions-animation-cep',   color:'bg-blue-500'   },
    { key:'organisation_visites_echanges', label:"Visites d'échanges",      path:'/organisation-visites-echanges',  color:'bg-indigo-400' },
    { key:'visites_echanges_commentees',   label:'Visites commentées',      path:'/visites-echanges-commentees',    color:'bg-violet-400' },
    { key:'difficultes_suggestions',       label:'Difficultés & suggestions',path:'/difficultes-suggestions',       color:'bg-rose-400'   },
    { key:'evolution_rendements_cep',      label:'Rendements CEP',          path:'/evolution-rendements-cep',       color:'bg-amber-500'  },
    { key:'rendement_dispositif',          label:'Rendement dispositif',    path:'/rendement-dispositif',           color:'bg-orange-500' },
    { key:'rapport_demarrage_cep',         label:'Rapport démarrage',       path:'/rapport-demarrage-cep',          color:'bg-emerald-600'},
];
const ALL_MODULES = [...FICHES, ...SENSIB, ...ACTIVITES];

/* ══════════════════════════════════════════════════════════════════════
   VUE CONSEILLER
══════════════════════════════════════════════════════════════════════ */
function DashboardConseiller({ user, stats, loading }) {
    const totalFiches  = sum(FICHES.map(m => m.key), stats);
    const totalSensib  = sum(SENSIB.map(m => m.key), stats);
    const totalCep     = sum(ACTIVITES.map(m => m.key), stats);
    const totalAll     = totalFiches + totalSensib + totalCep;
    const filledCount  = ALL_MODULES.filter(m => (stats[m.key] || 0) > 0).length;
    const firstName    = user?.name?.split(' ')[0] ?? '';
    const hour         = new Date().getHours();
    const greeting     = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

    return (
        <div className="space-y-6">
            {/* Bannière */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#062824] via-teal-900 to-emerald-900 p-6 shadow-xl">
                <div className="pointer-events-none absolute -right-10 -top-10 size-52 rounded-full bg-white/5" />
                <div className="pointer-events-none absolute right-20 bottom-0 size-32 rounded-full bg-teal-400/10" />
                <div className="relative flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-cyan-300/80 text-sm mb-1">{greeting} 👋</p>
                        <h2 className="text-2xl font-extrabold text-white">{firstName || user?.name}</h2>
                        <p className="text-cyan-200/60 text-sm mt-1">Vos données CEP — Champs Écoles Paysans</p>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                            <RoleBadge roles={user?.roles} />
                            {!loading && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/20">
                                    <span className="size-1.5 rounded-full bg-amber-400" />
                                    {totalAll} enregistrements
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
                        <Ring pct={Math.round((filledCount / ALL_MODULES.length) * 100)} color="#34d399" size={80} />
                        <div>
                            <p className="text-white/60 text-xs">Modules actifs</p>
                            <p className="text-white font-black text-xl">
                                {loading ? '…' : filledCount}
                                <span className="text-white/40 text-sm font-normal"> / {ALL_MODULES.length}</span>
                            </p>
                            <p className="text-emerald-300 text-xs mt-0.5">modules renseignés</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Fiches CEP"    value={loading ? null : totalFiches} icon={IC.doc}   from="from-violet-500" to="to-indigo-600" loading={loading} path="/profil-historique" />
                <KpiCard label="Sensibilisation" value={loading ? null : totalSensib} icon={IC.group} from="from-teal-500"   to="to-emerald-600" loading={loading} path="/liste-presence-sensibilisation" />
                <KpiCard label="Activités CEP" value={loading ? null : totalCep}    icon={IC.seed}  from="from-amber-500"  to="to-orange-600"  loading={loading} path="/gestion-cep" />
                <KpiCard label="Total saisies" value={loading ? null : totalAll}    icon={IC.chart} from="from-slate-600"  to="to-slate-800"   loading={loading} />
            </div>

            {/* KPI terrain */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Taux féminisation" value={loading ? null : `${stats.taux_feminisation ?? 0} %`} icon={IC.group} from="from-rose-500" to="to-pink-600" loading={loading} sub="des participants CEP" />
                <KpiCard label="Superficie couverte" value={loading ? null : `${Number(stats.superficie_couverte_total ?? 0).toLocaleString('fr-FR')} ha`} icon={IC.map} from="from-emerald-500" to="to-teal-600" loading={loading} sub="sessions d'animation" />
                <KpiCard label="AAES formés" value={loading ? null : (stats.nb_aaes_total ?? 0)} icon={IC.check} from="from-sky-500" to="to-cyan-600" loading={loading} sub="total cumulé" />
                <KpiCard label="Difficultés signalées" value={loading ? null : (stats.difficultes_suggestions ?? 0)} icon={IC.shield} from="from-orange-500" to="to-amber-600" loading={loading} path="/difficultes-suggestions" sub="remontées terrain" />
            </div>

            <DashboardGraphs stats={stats} loading={loading} />

            {/* Corps */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <div className="xl:col-span-2 space-y-5">
                    <ModuleCard title="Fiches CEP — Étapes préparatoires" icon={IC.doc}   accent="from-violet-600 to-indigo-700" modules={FICHES}    stats={stats} loading={loading} />
                    <ModuleCard title="Sensibilisation communautaire"      icon={IC.group} accent="from-teal-600 to-emerald-700"  modules={SENSIB}    stats={stats} loading={loading} />
                    <ModuleCard title="Animation & suivi du CEP"           icon={IC.seed}  accent="from-amber-500 to-orange-600"  modules={ACTIVITES} stats={stats} loading={loading} />

                    {/* Top spéculations */}
                    {(stats.top_speculations?.length > 0) && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-700 flex items-center justify-between">
                                <h3 className="text-white font-bold text-sm">Top spéculations pratiquées</h3>
                                <span className="text-white/60 text-xs">dans ma zone</span>
                            </div>
                            <div className="px-1 py-1">
                                {stats.top_speculations.map((s, i) => {
                                    const max = stats.top_speculations[0].nb;
                                    const pct = Math.round(s.nb / max * 100);
                                    const colors = ['bg-teal-500','bg-emerald-500','bg-sky-500','bg-indigo-500','bg-violet-500'];
                                    return (
                                        <div key={i} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition">
                                            <div className={`size-2 rounded-full flex-shrink-0 ${colors[i % colors.length]}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-slate-700 truncate">{s.speculation}</p>
                                                <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-700 ${colors[i % colors.length]}`} style={{ width:`${pct}%` }} />
                                                </div>
                                            </div>
                                            <span className="text-sm font-black text-slate-800 flex-shrink-0">{s.nb}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Top difficultés */}
                    {(stats.top_difficultes?.length > 0) && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-orange-500 to-amber-600">
                                <h3 className="text-white font-bold text-sm">Difficultés les plus signalées</h3>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {stats.top_difficultes.map((d, i) => (
                                    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition">
                                        <span className="mt-0.5 size-5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black flex items-center justify-center flex-shrink-0">{i+1}</span>
                                        <p className="flex-1 text-xs text-slate-600 leading-relaxed">{d.difficulte}</p>
                                        <span className="text-xs font-black text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-full flex-shrink-0">{d.nb}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-5">
                    {/* Bilan participants */}
                    {stats.bilan_participation && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-teal-600 to-emerald-700">
                                <h3 className="text-white font-bold text-sm">Bilan participation sessions</h3>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-3">
                                {[
                                    { label:'Total', value:stats.bilan_participation.total, color:'text-slate-800', bg:'bg-slate-50' },
                                    { label:'Hommes', value:stats.bilan_participation.hommes, color:'text-sky-700', bg:'bg-sky-50' },
                                    { label:'Femmes', value:stats.bilan_participation.femmes, color:'text-rose-700', bg:'bg-rose-50' },
                                    { label:'Jeunes', value:stats.bilan_participation.jeunes, color:'text-violet-700', bg:'bg-violet-50' },
                                ].map(({ label, value, color, bg }) => (
                                    <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                                        <p className={`text-xl font-black ${color}`}>{loading ? '…' : (value ?? 0)}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Catégories d'âge */}
                    {(stats.categories_age?.length > 0) && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3.5 border-b border-slate-100">
                                <h3 className="text-sm font-bold text-slate-800">Catégories d'âge</h3>
                            </div>
                            <div className="p-4 space-y-2.5">
                                {stats.categories_age.map((c, i) => {
                                    const max = Math.max(...stats.categories_age.map(x => x.nb), 1);
                                    const pct = Math.round(c.nb / max * 100);
                                    const colors = ['bg-violet-500','bg-sky-500','bg-emerald-500'];
                                    return (
                                        <div key={i}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs font-semibold text-slate-600">{c.categorie_age}</span>
                                                <span className="text-xs font-black text-slate-800">{c.nb}</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width:`${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Synthèse */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-3.5 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-800">Synthèse par rubrique</h3>
                        </div>
                        <div className="p-4 space-y-3">
                            {[
                                { label:'Fiches CEP',     value:totalFiches, max:100, color:'#7c3aed' },
                                { label:'Sensibilisation',value:totalSensib, max:50,  color:'#0d9488' },
                                { label:'Activités CEP',  value:totalCep,    max:200, color:'#f59e0b' },
                            ].map(({ label, value, max, color }) => (
                                <div key={label}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs font-semibold text-slate-600">{label}</span>
                                        <span className="text-xs font-black text-slate-800">{loading ? '…' : value}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{ width:`${Math.min(100,Math.round(value/max*100))}%`, background:color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Accès rapides */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-3.5 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-800">Accès rapides</h3>
                        </div>
                        <div className="p-3 space-y-1.5">
                            {[
                                { label:'Profil historique',  path:'/profil-historique',        icon:IC.doc,   bg:'bg-violet-50', text:'text-violet-700',  border:'border-violet-100' },
                                { label:'Gestion des CEP',    path:'/gestion-cep',              icon:IC.pin,   bg:'bg-teal-50',   text:'text-teal-700',    border:'border-teal-100'   },
                                { label:'Rapport démarrage',  path:'/rapport-demarrage-cep',    icon:IC.doc,   bg:'bg-emerald-50',text:'text-emerald-700', border:'border-emerald-100'},
                                { label:'Rendements CEP',     path:'/evolution-rendements-cep', icon:IC.chart, bg:'bg-sky-50',    text:'text-sky-700',     border:'border-sky-100'    },
                                { label:'Mon profil',         path:'/mon-profil',               icon:IC.cog,   bg:'bg-slate-50',  text:'text-slate-700',   border:'border-slate-200'  },
                            ].map(({ label, path, icon, bg, text, border }) => (
                                <Link key={path} to={path}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${border} ${bg} hover:opacity-80 transition`}>
                                    <div className="size-7 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                                        {svgIcon(icon, `size-4 ${text}`)}
                                    </div>
                                    <span className={`text-xs font-semibold ${text}`}>{label}</span>
                                    <svg className={`size-3.5 ml-auto ${text} opacity-40`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════════
   VUE SUPERVISEUR
══════════════════════════════════════════════════════════════════════ */
function DashboardSuperviseur({ user, stats, loading }) {
    const totalAll = sum(ALL_MODULES.map(m => m.key), stats);
    const hour     = new Date().getHours();
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

    return (
        <div className="space-y-6">
            {/* Bannière */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-6 shadow-xl">
                <div className="pointer-events-none absolute -right-10 -top-10 size-52 rounded-full bg-white/5" />
                <div className="relative flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-blue-300/80 text-sm mb-1">{greeting} 👋</p>
                        <h2 className="text-2xl font-extrabold text-white">{user?.name?.split(' ')[0]}</h2>
                        <p className="text-blue-200/60 text-sm mt-1">Vue de supervision — Toutes les activités CEP</p>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                            <RoleBadge roles={user?.roles} />
                            {!loading && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-blue-200 border border-white/10">
                                    {totalAll} enregistrements sur la plateforme
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label:'Conseillers',  value:stats.users_par_role?.Conseiller, color:'text-blue-300'   },
                            { label:'CEP actifs',   value:stats.cep,                         color:'text-emerald-300'},
                            { label:'Communes',     value:stats.communes,                    color:'text-amber-300'  },
                            { label:'Total saisies',value:totalAll,                          color:'text-white'      },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-center">
                                <p className={`text-lg font-black ${color}`}>{loading ? '…' : (value ?? 0)}</p>
                                <p className="text-white/50 text-xs">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Fiches CEP (total)"    value={loading ? null : sum(FICHES.map(m=>m.key), stats)}    icon={IC.doc}    from="from-violet-500" to="to-indigo-600"  loading={loading} path="/profil-historique" />
                <KpiCard label="Participants identifiés" value={loading ? null : stats.identification_participants_cep} icon={IC.group}  from="from-teal-500"   to="to-emerald-600" loading={loading} path="/identification-participants-cep" />
                <KpiCard label="CEP créés"              value={loading ? null : stats.cep}                           icon={IC.seed}   from="from-amber-500"  to="to-orange-600"  loading={loading} path="/gestion-cep" />
                <KpiCard label="Utilisateurs"           value={loading ? null : stats.utilisateurs}                  icon={IC.users2} from="from-blue-600"   to="to-indigo-700"  loading={loading} path="/dashboard/users" />
            </div>

            {/* KPI supervision */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Taux CEP avec rapport" value={loading ? null : `${stats.taux_cep_avec_rapport ?? 0} %`} icon={IC.doc} from="from-emerald-500" to="to-teal-700" loading={loading} sub={`${stats.nb_avec_rapport ?? 0} rapports déposés`} />
                <KpiCard label="Féminisation" value={loading ? null : `${stats.taux_feminisation ?? 0} %`} icon={IC.group} from="from-rose-500" to="to-pink-600" loading={loading} sub="des participants CEP" />
                <KpiCard label="Zones sans CEP" value={loading ? null : (stats.arrondissements_sans_cep ?? 0)} icon={IC.map} from="from-orange-500" to="to-red-600" loading={loading} sub={`sur ${stats.arrondissements_total ?? 0} arrondissements`} />
                <KpiCard label="Conseillers inactifs" value={loading ? null : (stats.conseillers_inactifs_mois ?? 0)} icon={IC.shield} from="from-slate-600" to="to-slate-800" loading={loading} sub="ce mois-ci" />
            </div>

            <DashboardGraphs stats={stats} loading={loading} showAdminGraphs />

            {/* Corps */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <div className="xl:col-span-2 space-y-5">
                    <ModuleCard title="Fiches CEP — Totaux plateforme"  icon={IC.doc}   accent="from-violet-600 to-indigo-700" modules={FICHES}    stats={stats} loading={loading} />
                    <ModuleCard title="Animation & suivi du CEP"         icon={IC.seed}  accent="from-amber-500 to-orange-600"  modules={ACTIVITES} stats={stats} loading={loading} />

                    {/* Classement conseillers (activité totale toutes tables) */}
                    {(stats.classement_conseillers?.length > 0) && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-blue-700 to-indigo-800">
                                <h3 className="text-white font-bold text-sm">Classement conseillers — activité totale</h3>
                            </div>
                            <div className="px-1 py-1">
                                {stats.classement_conseillers.map((c, i) => {
                                    const max = Math.max(...stats.classement_conseillers.map(x => Number(x.total_activite)), 1);
                                    const pct = Math.round(Number(c.total_activite) / max * 100);
                                    return (
                                        <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition">
                                            <span className={`size-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${
                                                i===0?'bg-amber-400':i===1?'bg-slate-400':i===2?'bg-orange-400':'bg-slate-200 text-slate-600'
                                            }`}>{i+1}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-slate-700 truncate">{c.name}</p>
                                                <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{ width:`${pct}%` }} />
                                                </div>
                                            </div>
                                            <span className="text-xs font-black text-slate-800 flex-shrink-0">{Number(c.total_activite)} saisies</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Top difficultés remontées terrain */}
                    {(stats.top_difficultes?.length > 0) && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-orange-500 to-amber-600">
                                <h3 className="text-white font-bold text-sm">Top difficultés terrain</h3>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {stats.top_difficultes.map((d, i) => (
                                    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition">
                                        <span className="mt-0.5 size-5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black flex items-center justify-center flex-shrink-0">{i+1}</span>
                                        <p className="flex-1 text-xs text-slate-600 leading-relaxed">{d.difficulte}</p>
                                        <span className="text-xs font-black text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-full flex-shrink-0">{d.nb}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-5">
                    {/* Bilan participation global */}
                    {stats.bilan_participation && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-teal-600 to-emerald-700">
                                <h3 className="text-white font-bold text-sm">Bilan participation sessions</h3>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-3">
                                {[
                                    { label:'Total', value:stats.bilan_participation.total, color:'text-slate-800', bg:'bg-slate-50' },
                                    { label:'Hommes', value:stats.bilan_participation.hommes, color:'text-sky-700', bg:'bg-sky-50' },
                                    { label:'Femmes', value:stats.bilan_participation.femmes, color:'text-rose-700', bg:'bg-rose-50' },
                                    { label:'Jeunes', value:stats.bilan_participation.jeunes, color:'text-violet-700', bg:'bg-violet-50' },
                                ].map(({ label, value, color, bg }) => (
                                    <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                                        <p className={`text-xl font-black ${color}`}>{loading ? '…' : (value ?? 0)}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CEP avec/sans comité */}
                    {(stats.cep_avec_comite !== undefined) && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3.5 border-b border-slate-100">
                                <h3 className="text-sm font-bold text-slate-800">CEP structurés</h3>
                            </div>
                            <div className="p-4 space-y-3">
                                {[
                                    { label:'Avec comité en place', value:stats.cep_avec_comite, color:'#0d9488', bg:'#0d9488' },
                                    { label:'Sans comité', value:stats.cep_sans_comite, color:'#e11d48', bg:'#e11d48' },
                                ].map(({ label, value, color, bg }) => {
                                    const total = (stats.cep_avec_comite ?? 0) + (stats.cep_sans_comite ?? 0);
                                    const pct = total > 0 ? Math.round(value / total * 100) : 0;
                                    return (
                                        <div key={label}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs font-semibold text-slate-600">{label}</span>
                                                <span className="text-xs font-black text-slate-800">{loading ? '…' : value}</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-700" style={{ width:`${pct}%`, background:bg }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Top conseillers */}
                    {stats.top_conseillers?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-700">
                                <h3 className="text-white font-bold text-sm">Conseillers les + actifs</h3>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {stats.top_conseillers.map((c, i) => (
                                    <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                                        <span className={`size-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${
                                            i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : 'bg-orange-400'
                                        }`}>{i+1}</span>
                                        <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{c.name}</span>
                                        <span className="text-xs font-black text-teal-700">{c.nb_cep} CEP</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Accès rapides superviseur */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-3.5 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-800">Navigation rapide</h3>
                        </div>
                        <div className="p-3 space-y-1.5">
                            {[
                                { label:'Utilisateurs',      path:'/dashboard/users',         icon:IC.group, bg:'bg-blue-50',   text:'text-blue-700',    border:'border-blue-100'   },
                                { label:'Gestion des CEP',   path:'/gestion-cep',             icon:IC.pin,   bg:'bg-teal-50',   text:'text-teal-700',    border:'border-teal-100'   },
                                { label:'Rendements CEP',    path:'/evolution-rendements-cep',icon:IC.chart, bg:'bg-amber-50',  text:'text-amber-700',   border:'border-amber-100'  },
                                { label:'Rapports démarrage',path:'/rapport-demarrage-cep',   icon:IC.doc,   bg:'bg-violet-50', text:'text-violet-700',  border:'border-violet-100' },
                                { label:'Mon profil',        path:'/mon-profil',              icon:IC.cog,   bg:'bg-slate-50',  text:'text-slate-700',   border:'border-slate-200'  },
                            ].map(({ label, path, icon, bg, text, border }) => (
                                <Link key={path} to={path}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${border} ${bg} hover:opacity-80 transition`}>
                                    <div className="size-7 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                                        {svgIcon(icon, `size-4 ${text}`)}
                                    </div>
                                    <span className={`text-xs font-semibold ${text}`}>{label}</span>
                                    <svg className={`size-3.5 ml-auto ${text} opacity-40`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════════
   VUE SUPER-ADMIN / ADMINISTRATEUR
══════════════════════════════════════════════════════════════════════ */
function DashboardAdmin({ user, stats, loading }) {
    const totalAll = sum(ALL_MODULES.map(m => m.key), stats);
    const hour     = new Date().getHours();
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    const isSA     = user?.roles?.includes('Super-Admin');
    const roles    = stats.users_par_role ?? {};

    const roleColors = {
        'Super-Admin':    { bg:'bg-purple-500',  ring:'ring-purple-200', text:'text-purple-700', light:'bg-purple-50'  },
        'Administrateur': { bg:'bg-blue-500',    ring:'ring-blue-200',   text:'text-blue-700',   light:'bg-blue-50'    },
        'Superviseur':    { bg:'bg-amber-500',   ring:'ring-amber-200',  text:'text-amber-700',  light:'bg-amber-50'   },
        'Conseiller':     { bg:'bg-teal-500',    ring:'ring-teal-200',   text:'text-teal-700',   light:'bg-teal-50'    },
    };

    return (
        <div className="space-y-6">
            {/* Bannière admin */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 shadow-xl">
                <div className="pointer-events-none absolute -right-10 -top-10 size-52 rounded-full bg-purple-500/10" />
                <div className="pointer-events-none absolute left-1/2 bottom-0 size-40 rounded-full bg-white/3" />
                <div className="relative flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {svgIcon(IC.crown, 'size-4 text-amber-400')}
                            <p className="text-purple-300/80 text-sm">{greeting}</p>
                        </div>
                        <h2 className="text-2xl font-extrabold text-white">{user?.name?.split(' ')[0]}</h2>
                        <p className="text-purple-200/50 text-sm mt-1">Administration de la plateforme PARSAD</p>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                            <RoleBadge roles={user?.roles} />
                            {!loading && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/10">
                                    {totalAll} enregistrements · {stats.utilisateurs} utilisateurs
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Mini-stats rôles */}
                    <div className="flex flex-wrap gap-2">
                        {['Super-Admin','Administrateur','Superviseur','Conseiller'].map(rn => {
                            const c = roleColors[rn];
                            return (
                                <div key={rn} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-center min-w-[72px]">
                                    <p className="text-xl font-black text-white">{loading ? '…' : (roles[rn] ?? 0)}</p>
                                    <p className="text-white/40 text-[10px] mt-0.5">{rn}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* KPI plateforme */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Utilisateurs" value={loading?null:stats.utilisateurs}  icon={IC.users2} from="from-purple-600" to="to-indigo-700"   loading={loading} path="/dashboard/users" sub="comptes actifs" />
                <KpiCard label="CEP créés"    value={loading?null:stats.cep}           icon={IC.seed}   from="from-teal-500"   to="to-emerald-600"  loading={loading} path="/gestion-cep"     sub="champs-écoles" />
                <KpiCard label="Communes"     value={loading?null:stats.communes}      icon={IC.map}    from="from-amber-500"  to="to-orange-600"   loading={loading}                         sub="zones couvertes" />
                <KpiCard label="Total données" value={loading?null:totalAll}           icon={IC.chart}  from="from-slate-700"  to="to-slate-900"    loading={loading}                         sub="enregistrements" />
            </div>

            {/* KPI impact programme */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Producteurs uniques" value={loading?null:(stats.producteurs_uniques??0)} icon={IC.group} from="from-emerald-500" to="to-teal-700" loading={loading} sub="bénéficiaires réels" />
                <KpiCard label="Taux CEP structurés" value={loading?null:`${stats.taux_cep_avec_rapport??0} %`} icon={IC.doc} from="from-sky-500" to="to-blue-700" loading={loading} sub="avec rapport démarrage" />
                <KpiCard label="Zones blanches" value={loading?null:(stats.arrondissements_sans_cep??0)} icon={IC.map} from="from-orange-500" to="to-red-600" loading={loading} sub="arrondissements sans CEP" />
                <KpiCard label="Conseillers inactifs" value={loading?null:(stats.conseillers_inactifs_mois??0)} icon={IC.shield} from="from-slate-600" to="to-slate-800" loading={loading} sub="ce mois-ci" />
            </div>

            <DashboardGraphs stats={stats} loading={loading} showAdminGraphs />

            {/* Corps admin */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <div className="xl:col-span-2 space-y-5">
                    {/* Répartition modules */}
                    <ModuleCard title="Fiches CEP — Vue plateforme"  icon={IC.doc}   accent="from-violet-600 to-indigo-700" modules={FICHES}    stats={stats} loading={loading} />
                    <ModuleCard title="Animation & suivi du CEP"     icon={IC.seed}  accent="from-amber-500 to-orange-600"  modules={ACTIVITES} stats={stats} loading={loading} />

                    {/* Pipeline problèmes → solutions → expérimentations */}
                    {(stats.nb_problemes_total !== undefined) && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-indigo-700">
                                <h3 className="text-white font-bold text-sm">Pipeline Innovation — Problèmes → Solutions → Expérimentations</h3>
                            </div>
                            <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label:'Problèmes identifiés', value:stats.nb_problemes_total,     color:'text-slate-800',   bg:'bg-slate-50',   border:'border-slate-200' },
                                    { label:'Jugés pertinents',     value:stats.nb_problemes_pertinents, color:'text-violet-700',  bg:'bg-violet-50',  border:'border-violet-100' },
                                    { label:'Avec curriculum',      value:stats.nb_avec_curriculum,      color:'text-teal-700',    bg:'bg-teal-50',    border:'border-teal-100' },
                                    { label:'Protocoles testés',    value:stats.nb_experimentations,     color:'text-emerald-700', bg:'bg-emerald-50', border:'border-emerald-100' },
                                ].map(({ label, value, color, bg, border }) => (
                                    <div key={label} className={`${bg} border ${border} rounded-xl p-4 text-center`}>
                                        <p className={`text-2xl font-black ${color}`}>{loading ? '…' : (value ?? 0)}</p>
                                        <p className="text-xs text-slate-500 mt-1 leading-tight">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Gain rendement moyen par culture */}
                    {(stats.gain_rendement?.length > 0) && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-700">
                                <h3 className="text-white font-bold text-sm">Gain de rendement — Technologie vs Témoin (%)</h3>
                            </div>
                            <div className="px-1 py-1">
                                {stats.gain_rendement.map((r, i) => {
                                    const maxGain = Math.max(...stats.gain_rendement.map(x => Math.abs(Number(x.gain_pct))), 1);
                                    const pct = Math.round(Math.abs(Number(r.gain_pct)) / maxGain * 100);
                                    const positive = Number(r.gain_pct) >= 0;
                                    return (
                                        <div key={i} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between mb-1">
                                                    <p className="text-xs font-semibold text-slate-700 truncate">{r.culture}</p>
                                                    <span className={`text-xs font-black flex-shrink-0 ml-2 ${positive ? 'text-emerald-700' : 'text-red-600'}`}>
                                                        {positive ? '+' : ''}{r.gain_pct} %
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-700 ${positive ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width:`${pct}%` }} />
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-slate-400 flex-shrink-0">{r.nb_producteurs} prod.</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Évolution annuelle des profils CEP */}
                    {(stats.evolution_annuelle_cep?.length > 0) && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-sky-600 to-cyan-700">
                                <h3 className="text-white font-bold text-sm">Évolution annuelle des profils CEP</h3>
                            </div>
                            <div className="p-4 flex items-end gap-3">
                                {(() => {
                                    const max = Math.max(...stats.evolution_annuelle_cep.map(x => Number(x.nb)), 1);
                                    return stats.evolution_annuelle_cep.map((r, i) => {
                                        const h = Math.max(Math.round(Number(r.nb) / max * 120), 8);
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                <span className="text-xs font-black text-sky-700">{r.nb}</span>
                                                <div className="w-full rounded-t-md bg-sky-500 transition-all duration-700" style={{ height:`${h}px` }} />
                                                <span className="text-[10px] text-slate-500">{r.annee}</span>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Activité conseillers */}
                    {(stats.activite_conseillers?.length > 0) && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-700 to-slate-800">
                                <h3 className="text-white font-bold text-sm">Activité par conseiller (profil historique)</h3>
                            </div>
                            <div className="px-1 py-1">
                                {stats.activite_conseillers.map(c => {
                                    const maxNb = Math.max(...stats.activite_conseillers.map(x => x.nb), 1);
                                    const pct   = Math.round((c.nb / maxNb) * 100);
                                    return (
                                        <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition">
                                            <div className="size-7 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-[10px] font-extrabold flex-shrink-0">
                                                {c.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-slate-700 truncate">{c.name}</p>
                                                <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full bg-teal-500 transition-all duration-700"
                                                        style={{ width:`${pct}%` }} />
                                                </div>
                                            </div>
                                            <span className="text-xs font-black text-slate-800 flex-shrink-0">{c.nb}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-5">
                    {/* Statuts des comptes */}
                    {(stats.comptes_par_statut) && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-purple-600 to-indigo-700">
                                <h3 className="text-white font-bold text-sm">Statut des comptes</h3>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-3">
                                {[
                                    { label:'Actifs',     value:stats.comptes_par_statut.actifs,    color:'text-emerald-700', bg:'bg-emerald-50' },
                                    { label:'Bloqués',    value:stats.comptes_par_statut.bloques,   color:'text-red-700',     bg:'bg-red-50'     },
                                    { label:'Suspendus',  value:stats.comptes_par_statut.suspendus, color:'text-amber-700',   bg:'bg-amber-50'   },
                                    { label:'Gelés',      value:stats.comptes_par_statut.geles,     color:'text-slate-700',   bg:'bg-slate-50'   },
                                ].map(({ label, value, color, bg }) => (
                                    <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                                        <p className={`text-2xl font-black ${color}`}>{loading ? '…' : (value ?? 0)}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Top difficultés terrain */}
                    {(stats.top_difficultes?.length > 0) && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-orange-500 to-amber-600">
                                <h3 className="text-white font-bold text-sm">Top difficultés terrain</h3>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {stats.top_difficultes.map((d, i) => (
                                    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition">
                                        <span className="mt-0.5 size-5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black flex items-center justify-center flex-shrink-0">{i+1}</span>
                                        <p className="flex-1 text-xs text-slate-600 leading-relaxed">{d.difficulte}</p>
                                        <span className="text-xs font-black text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-full flex-shrink-0">{d.nb}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Top pratiques agroécologiques */}
                    {(stats.top_pratiques_agroeco?.length > 0) && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3.5 border-b border-slate-100">
                                <h3 className="text-sm font-bold text-slate-800">Pratiques agroécologiques adoptées</h3>
                            </div>
                            <div className="p-4 space-y-2.5">
                                {stats.top_pratiques_agroeco.map((p, i) => {
                                    const max = stats.top_pratiques_agroeco[0]?.nb ?? 1;
                                    return (
                                        <div key={i}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs font-semibold text-slate-600 truncate pr-2">{p.pratique}</span>
                                                <span className="text-xs font-black text-slate-800 flex-shrink-0">{p.nb}</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width:`${Math.round(p.nb/max*100)}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Répartition par rôle — carte visuelle */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-purple-600 to-indigo-700">
                            <h3 className="text-white font-bold text-sm">Utilisateurs par rôle</h3>
                        </div>
                        <div className="p-4 space-y-3">
                            {['Super-Admin','Administrateur','Superviseur','Conseiller'].map(rn => {
                                const c   = roleColors[rn];
                                const val = roles[rn] ?? 0;
                                const max = Math.max(...Object.values(roles), 1);
                                return (
                                    <div key={rn}>
                                        <div className="flex justify-between mb-1">
                                            <span className={`text-xs font-semibold ${c.text}`}>{rn}</span>
                                            <span className="text-xs font-black text-slate-800">{loading ? '…' : val}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-700 ${c.bg}`}
                                                style={{ width:`${Math.round(val/max*100)}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Top conseillers */}
                    {stats.top_conseillers?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-amber-500 to-orange-600">
                                <h3 className="text-white font-bold text-sm">Top conseillers (CEP créés)</h3>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {stats.top_conseillers.map((c, i) => (
                                    <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                                        <span className={`size-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${
                                            i===0?'bg-amber-400':i===1?'bg-slate-400':i===2?'bg-orange-400':'bg-slate-200 text-slate-600'
                                        }`}>{i+1}</span>
                                        <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{c.name}</span>
                                        <span className="text-xs font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">{c.nb_cep}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions admin */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-3.5 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-800">Actions d'administration</h3>
                        </div>
                        <div className="p-3 space-y-1.5">
                            {[
                                { label:'Gérer les utilisateurs', path:'/dashboard/users',  icon:IC.users2, bg:'bg-purple-50',  text:'text-purple-700', border:'border-purple-100' },
                                isSA && { label:'Gérer les rôles', path:'/roles',           icon:IC.shield, bg:'bg-blue-50',    text:'text-blue-700',   border:'border-blue-100'   },
                                isSA && { label:'Géographie',      path:'/geographie',      icon:IC.map,    bg:'bg-teal-50',    text:'text-teal-700',   border:'border-teal-100'   },
                                { label:'Voir les CEP',            path:'/gestion-cep',     icon:IC.seed,   bg:'bg-amber-50',   text:'text-amber-700',  border:'border-amber-100'  },
                                { label:'Mon profil',              path:'/mon-profil',      icon:IC.cog,    bg:'bg-slate-50',   text:'text-slate-700',  border:'border-slate-200'  },
                            ].filter(Boolean).map(({ label, path, icon, bg, text, border }) => (
                                <Link key={path} to={path}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${border} ${bg} hover:opacity-80 transition`}>
                                    <div className="size-7 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                                        {svgIcon(icon, `size-4 ${text}`)}
                                    </div>
                                    <span className={`text-xs font-semibold ${text}`}>{label}</span>
                                    <svg className={`size-3.5 ml-auto ${text} opacity-40`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
    const { user, hasRole } = useAuth();
    const [stats,          setStats]          = useState({});
    const [loading,        setLoading]        = useState(true);
    const [communes,       setCommunes]       = useState([]);
    const [selectedCommune, setSelectedCommune] = useState('');

    const isAdmin       = hasRole(['Super-Admin', 'Administrateur']);
    const isSuperviseur = hasRole('Superviseur');

    // Charger les communes accessibles (conseillers uniquement)
    useEffect(() => {
        if (!isAdmin && !isSuperviseur) {
            api.get('/api/user/communes')
                .then(r => setCommunes(r.data))
                .catch(() => {});
        }
    }, [isAdmin, isSuperviseur]);

    // Recharger les stats quand la commune change
    useEffect(() => {
        setLoading(true);
        const params = selectedCommune ? `?commune_id=${selectedCommune}` : '';
        api.get(`/api/dashboard/stats${params}`)
            .then(r => setStats(r.data))
            .catch(() => setStats({}))
            .finally(() => setLoading(false));
    }, [selectedCommune]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/50 to-white flex">
            <Sidebar />
            <div className="flex-1 ml-60 flex flex-col min-h-screen">
                <Header title="Tableau de bord" />

                {/* Sélecteur de commune (Conseillers uniquement) */}
                {!isAdmin && !isSuperviseur && communes.length > 1 && (
                    <div className="px-6 pt-4">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-white px-3 py-2 shadow-sm">
                            <svg className="size-4 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                            </svg>
                            <select
                                value={selectedCommune}
                                onChange={e => setSelectedCommune(e.target.value)}
                                className="border-none bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
                            >
                                <option value="">Toutes mes communes</option>
                                {communes.map(c => (
                                    <option key={c.id} value={c.id}>{c.nom}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                <main className="flex-1 px-6 py-6">
                    {isAdmin
                        ? <DashboardAdmin       user={user} stats={stats} loading={loading} />
                        : isSuperviseur
                        ? <DashboardSuperviseur user={user} stats={stats} loading={loading} />
                        : <DashboardConseiller  user={user} stats={stats} loading={loading} />
                    }
                </main>
            </div>
        </div>
    );
}
