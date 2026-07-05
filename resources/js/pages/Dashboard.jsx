import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, RoleBadge } from '../components/Layout';
import {
    C, fmt, AGE_ORDER, AGE_LABEL,
    StatTile, Panel, BarList, SplitBar, TrendChart,
    DivergingBars, PipelineFunnel, RankedList, EmptyNote,
} from '../components/charts';
import api from '../services/api';

/* Participation aux sessions : part-à-tout H/F + jeunes en sous-ensemble
   (les jeunes recoupent les deux sexes — jamais un 3ᵉ segment). */
function ParticipationSplit({ participation, loading }) {
    const h = Number(participation?.hommes) || 0;
    const f = Number(participation?.femmes) || 0;
    const jeunes = Number(participation?.jeunes) || 0;
    const total = Number(participation?.total) || (h + f);
    if (loading) return <div className="h-24 animate-pulse rounded-xl bg-slate-50" />;
    if (total === 0) return <EmptyNote />;
    return (
        <div>
            <SplitBar
                headline={total}
                headlineNote="participations cumulées aux sessions d'animation"
                a={{ label: 'Hommes', value: h, color: C.hommes }}
                b={{ label: 'Femmes', value: f, color: C.femmes }} />
            <div className="mt-2 border-t border-slate-100 pt-1.5 text-xs text-slate-500">
                dont <span className="font-semibold text-slate-800">{fmt(jeunes)}</span> jeunes
                {total > 0 && <span className="text-slate-400"> ({Math.round(jeunes / total * 100)} % des participations)</span>}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════════
   NAVIGATION PAR MODULE (compteurs + liens)
══════════════════════════════════════════════════════════════════════ */
const MODULE_GROUPS = [
    {
        title: 'Fiches CEP',
        items: [
            { key: 'profil_historique',                      label: 'Profil historique',        path: '/profil-historique' },
            { key: 'hierarchisation_domaines_activites',     label: "Domaines d'activités",     path: '/hierarchisation-domaines-activites' },
            { key: 'hierarchisation_speculations_agricoles', label: 'Spéculations agricoles',   path: '/hierarchisation-speculations-agricoles' },
            { key: 'matrice_problemes',                      label: 'Problèmes & solutions',    path: '/matrice-problemes-solutions' },
            { key: 'curriculum_apprentissage_cep',           label: 'Curriculum CEP',           path: '/curriculum-apprentissage-cep' },
            { key: 'resume_protocoles_experimentations',     label: 'Protocoles expér.',        path: '/resume-protocoles-experimentations' },
        ],
    },
    {
        title: 'Sensibilisation',
        items: [
            { key: 'liste_presence_sensibilisation',  label: 'Listes de présence', path: '/liste-presence-sensibilisation' },
            { key: 'identification_participants_cep', label: 'Participants CEP',   path: '/identification-participants-cep' },
        ],
    },
    {
        title: 'Activités CEP',
        items: [
            { key: 'cep',                             label: 'Champs-écoles',            path: '/gestion-cep' },
            { key: 'animation_sessions_cep',          label: "Sessions d'animation",     path: '/animation-sessions-cep' },
            { key: 'base_beneficiaires_intervention', label: 'Base bénéficiaires',       path: '/base-beneficiaires-intervention' },
            { key: 'bilan_sessions_animation_cep',    label: 'Bilans sessions',          path: '/bilan-sessions-animation-cep' },
            { key: 'organisation_visites_echanges',   label: "Visites d'échanges",       path: '/organisation-visites-echanges' },
            { key: 'visites_echanges_commentees',     label: 'Visites commentées',       path: '/visites-echanges-commentees' },
            { key: 'difficultes_suggestions',         label: 'Difficultés & suggestions', path: '/difficultes-suggestions' },
            { key: 'evolution_rendements_cep',        label: 'Rendements CEP',           path: '/evolution-rendements-cep' },
            { key: 'rendement_dispositif',            label: 'Rendement UD',             path: '/rendement-dispositif' },
            { key: 'rapport_demarrage_cep',           label: 'Rapport démarrage',        path: '/rapport-demarrage-cep' },
        ],
    },
];

function ModuleNav({ modules = {} }) {
    return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {MODULE_GROUPS.map(group => {
                const max = Math.max(...group.items.map(m => modules[m.key] || 0), 1);
                const total = group.items.reduce((a, m) => a + (modules[m.key] || 0), 0);
                return (
                    <section key={group.title} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <h4 className="text-sm font-semibold text-slate-800">{group.title}</h4>
                            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">{fmt(total)}</span>
                        </div>
                        <ul className="p-2">
                            {group.items.map(m => {
                                const v = modules[m.key] || 0;
                                return (
                                    <li key={m.key}>
                                        <Link to={m.path} className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-medium text-slate-600 group-hover:text-teal-700">{m.label}</p>
                                                <div className="mt-1 h-1.5 overflow-hidden rounded-r" style={{ background: C.track }}>
                                                    <div className="h-full rounded-r" style={{ width: `${Math.max(v / max * 100, 2)}%`, background: C.brand }} />
                                                </div>
                                            </div>
                                            <span className="flex-shrink-0 text-xs font-semibold text-slate-800">{fmt(v)}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                );
            })}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════════════════ */
const SAISIES_SERIES = [{ key: 'nb', label: 'Saisies', color: C.brand }];

export default function Dashboard() {
    const { user, hasRole } = useAuth();
    const [stats, setStats]     = useState(null);
    const [loading, setLoading] = useState(true);
    const [communes, setCommunes] = useState([]);
    const [selectedCommune, setSelectedCommune] = useState('');

    const isSupervision = hasRole(['Super-Admin', 'Administrateur', 'Superviseur']);
    const isConseiller  = !isSupervision;

    useEffect(() => {
        if (isConseiller) {
            api.get('/api/user/communes').then(r => setCommunes(Array.isArray(r.data) ? r.data : [])).catch(() => {});
        }
    }, [isConseiller]);

    useEffect(() => {
        setLoading(true);
        const params = selectedCommune ? `?commune_id=${selectedCommune}` : '';
        api.get(`/api/dashboard/stats${params}`)
            .then(r => setStats(r.data))
            .catch(() => setStats(s => s ?? {}))
            .finally(() => setLoading(false));
    }, [selectedCommune]);

    const s = stats ?? {};
    const kpi = s.kpi ?? {};
    const admin = s.admin;
    const totalSaisies = useMemo(
        () => Object.values(s.modules ?? {}).reduce((a, v) => a + (Number(v) || 0), 0),
        [s.modules],
    );

    const firstName = user?.name?.split(' ')[0] ?? '';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    const subtitle = isSupervision
        ? 'Pilotage du programme PARSAD — vue plateforme'
        : 'Vos données CEP — Champs Écoles Paysans';

    // Refetch (changement de commune) : on garde le rendu précédent atténué,
    // pas de flash de squelettes.
    const initialLoad = loading && stats === null;
    const dimmed = loading && stats !== null;

    return (
        <div className="min-h-screen bg-slate-100 font-sans antialiased lg:flex">
            <Sidebar />
            <main className="min-w-0 flex-1 lg:ml-60">
                <Header title="Tableau de bord" />

                <div className="space-y-6 px-4 py-6 sm:px-6">

                    {/* ── Bannière ── */}
                    <div className="relative overflow-hidden rounded-2xl bg-[#062824] p-6">
                        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-teal-400/10" />
                        <div className="relative flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p className="text-sm text-cyan-300/70">{greeting}</p>
                                <h2 className="text-2xl font-extrabold text-white">{firstName || user?.name}</h2>
                                <p className="mt-1 text-sm text-cyan-100/50">{subtitle}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <RoleBadge roles={user?.roles} />
                                {!initialLoad && (
                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-cyan-100/80">
                                        {fmt(totalSaisies)} saisies au total
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Filtre commune (conseiller multi-communes) ── */}
                    {isConseiller && communes.length > 1 && (
                        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                            <svg className="size-4 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                            </svg>
                            <select value={selectedCommune} onChange={e => setSelectedCommune(e.target.value)}
                                className="cursor-pointer border-none bg-transparent text-sm font-semibold text-slate-700 focus:outline-none">
                                <option value="">Toutes mes communes</option>
                                {communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                            </select>
                        </div>
                    )}

                    <div className={`space-y-6 transition-opacity ${dimmed ? 'opacity-50' : ''}`}>

                        {/* ── Indicateurs clés terrain ── */}
                        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                            <StatTile label="Champs-écoles (CEP)" value={fmt(kpi.cep)} loading={initialLoad}
                                sub={`${fmt(kpi.cep_membres)} membres inscrits`} path="/gestion-cep" />
                            <StatTile label="Producteurs bénéficiaires" value={fmt(kpi.beneficiaires)} loading={initialLoad}
                                sub="contacts uniques recensés" path="/base-beneficiaires-intervention" />
                            <StatTile label="Participants identifiés" value={fmt(kpi.participants)} loading={initialLoad}
                                sub={`${kpi.taux_feminisation ?? 0} % de femmes`} path="/identification-participants-cep" />
                            <StatTile label="Superficie couverte" value={`${fmt(kpi.superficie_ha)} ha`} loading={initialLoad}
                                sub={`${fmt(kpi.sessions)} sessions d'animation`} path="/animation-sessions-cep" />
                        </div>

                        {/* ── Activité & participation ── */}
                        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                            <Panel title="Saisies mensuelles" subtitle="Tous modules confondus — 12 derniers mois" className="xl:col-span-2">
                                <TrendChart data={s.saisies_mensuelles} series={SAISIES_SERIES} loading={initialLoad} />
                            </Panel>
                            <Panel title="Participation aux sessions" subtitle="Bilans des sessions d'animation">
                                <ParticipationSplit participation={s.participation} loading={initialLoad} />
                            </Panel>
                        </div>

                        {/* ── Répartitions terrain ── */}
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            <Panel title="Spéculations les plus pratiquées" subtitle="Participants CEP identifiés">
                                {initialLoad ? <div className="h-40 animate-pulse rounded-xl bg-slate-50" />
                                    : <BarList items={s.top_speculations} labelKey="speculation" valueKey="nb" />}
                            </Panel>
                            <Panel title="Catégories d'âge" subtitle="Participants CEP identifiés">
                                {initialLoad ? <div className="h-40 animate-pulse rounded-xl bg-slate-50" />
                                    : <BarList ordinal valueKey="nb" labelKey="label"
                                        items={[...(s.categories_age ?? [])]
                                            .sort((a, b) => (AGE_ORDER[a.categorie_age] ?? 9) - (AGE_ORDER[b.categorie_age] ?? 9))
                                            .map(c => ({ ...c, label: AGE_LABEL[c.categorie_age] ?? c.categorie_age }))} />}
                            </Panel>
                            <Panel title="Pratiques agroécologiques" subtitle="Adoptées par les bénéficiaires">
                                {initialLoad ? <div className="h-40 animate-pulse rounded-xl bg-slate-50" />
                                    : <BarList items={s.top_pratiques} labelKey="pratique" valueKey="nb" />}
                            </Panel>
                        </div>

                        {/* ── Difficultés terrain ── */}
                        <Panel title="Difficultés les plus signalées" subtitle="Remontées des champs-écoles">
                            {initialLoad ? <div className="h-32 animate-pulse rounded-xl bg-slate-50" />
                                : <RankedList items={s.top_difficultes} labelKey="difficulte" valueKey="nb" />}
                        </Panel>

                        {/* ── Pilotage du programme (Superviseur / Admin) ── */}
                        {admin && (
                            <>
                                <div className="flex items-center gap-3 pt-2">
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Pilotage du programme</h2>
                                    <div className="h-px flex-1 bg-slate-200" />
                                </div>

                                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                                    <StatTile label="Couverture communes"
                                        value={`${fmt(admin.couverture?.communes_couvertes)} / ${fmt(admin.couverture?.communes_total)}`}
                                        sub={`${fmt(admin.couverture?.arrondissements_couverts)} / ${fmt(admin.couverture?.arrondissements_total)} arrondissements`} />
                                    <StatTile label="CEP avec rapport de démarrage"
                                        value={`${admin.structuration?.taux_avec_rapport ?? 0} %`}
                                        sub={`${fmt(admin.structuration?.avec_comite)} comités en place`}
                                        path="/rapport-demarrage-cep" />
                                    <StatTile label="Conseillers inactifs ce mois"
                                        value={fmt(admin.conseillers_inactifs)}
                                        sub={`sur ${fmt(admin.users_par_role?.Conseiller)} conseillers`} />
                                    <StatTile label="Utilisateurs" value={fmt(admin.utilisateurs)}
                                        sub={Object.entries(admin.users_par_role ?? {}).map(([r, n]) => `${n} ${r}`).join(' · ')}
                                        path="/dashboard/users" />
                                </div>

                                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                                    <Panel title="Gain de rendement par culture" subtitle="Technologie vs témoin (moyenne, %)">
                                        <DivergingBars items={admin.gain_rendement} />
                                    </Panel>
                                    <Panel title="Pipeline innovation" subtitle="Du problème identifié à l'expérimentation">
                                        <PipelineFunnel pipeline={admin.pipeline} />
                                    </Panel>
                                </div>

                                <Panel title="Activité des conseillers" subtitle="Nombre total de saisies, tous modules confondus">
                                    <BarList items={admin.activite_conseillers} labelKey="name" valueKey="nb" />
                                </Panel>
                            </>
                        )}

                        {/* ── Détail par module (navigation) ── */}
                        <div className="flex items-center gap-3 pt-2">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Saisies par module</h2>
                            <div className="h-px flex-1 bg-slate-200" />
                        </div>
                        <ModuleNav modules={s.modules} />
                    </div>
                </div>
            </main>
        </div>
    );
}
