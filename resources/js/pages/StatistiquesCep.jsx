import { useEffect, useMemo, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import {
    C, fmt, AGE_ORDER, AGE_LABEL,
    StatTile, Panel, BarList, GroupedBars, SplitBar, TrendChart,
    DivergingBars, PipelineFunnel, RankedList,
} from '../components/charts';
import api from '../services/api';

/* ── Onglets ──────────────────────────────────────────────────────────── */
const TABS = [
    { key: 'participants', label: 'Participants' },
    { key: 'rendements',   label: 'Rendements & impact' },
    { key: 'sessions',     label: 'Sessions & visites' },
    { key: 'terrain',      label: 'Terrain' },
    { key: 'avancement',   label: 'Avancement modules' },
];

/* ── Séries (couleur suit l'entité, jamais le rang) ───────────────────── */
const SERIES_HF = [
    { key: 'hommes', label: 'Hommes', color: C.hommes },
    { key: 'femmes', label: 'Femmes', color: C.femmes },
];
const SERIES_RENDEMENT = [
    { key: 'moy_n1',     label: 'Année n-1',        color: C.neutral },
    { key: 'moy_temoin', label: 'Parcelle témoin',  color: C.alt },
    { key: 'moy_tech',   label: 'Avec technologie', color: C.brand },
];
const SERIES_DISPOSITIFS = [
    { key: 'd1', label: 'Dispositif 1', color: C.ramp[0] },
    { key: 'd2', label: 'Dispositif 2', color: C.ramp[1] },
    { key: 'd3', label: 'Dispositif 3', color: C.ramp[2] },
    { key: 'd4', label: 'Dispositif 4', color: C.ramp[3] },
];
const SERIES_EVENEMENTS = [
    { key: 'sessions', label: "Sessions d'animation", color: C.brand },
    { key: 'visites',  label: "Visites d'échanges",   color: C.alt },
];
const SERIES_FREQUENTATION = [
    { key: 'participants', label: 'Participants aux sessions', color: C.brand },
    { key: 'visiteurs',    label: 'Visiteurs des échanges',    color: C.alt },
];

const fmtKg = (v) => `${Number(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}`;

function Skeleton({ h = 'h-40' }) {
    return <div className={`${h} animate-pulse rounded-xl bg-slate-50`} />;
}

/* ══════════════════════════════════════════════════════════════════════ */
export default function StatistiquesCep() {
    const { hasRole } = useAuth();
    const isAdmin = hasRole(['Super-Admin', 'Administrateur', 'Superviseur']);

    const [tab, setTab]         = useState(() => {
        const q = new URLSearchParams(window.location.search).get('tab');
        return TABS.some(t => t.key === q) ? q : 'participants';
    });
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    useEffect(() => {
        api.get('/api/stats/cep')
            .then(r => setData(r.data))
            .catch(() => setError('Impossible de charger les statistiques.'))
            .finally(() => setLoading(false));
    }, []);

    const s = data ?? {};

    const totalParticipants = (Number(s.repartition_hf?.hommes) || 0) + (Number(s.repartition_hf?.femmes) || 0);
    const avancement = useMemo(
        () => [...(s.avancement ?? [])].sort((a, b) => b.valeur - a.valeur),
        [s.avancement],
    );
    const nbRenseignes = avancement.filter(m => m.valeur > 0).length;
    const pctRenseignes = avancement.length > 0 ? Math.round(nbRenseignes / avancement.length * 100) : 0;

    const categoriesAge = useMemo(
        () => [...(s.categories_age ?? [])]
            .sort((a, b) => (AGE_ORDER[a.categorie_age] ?? 9) - (AGE_ORDER[b.categorie_age] ?? 9))
            .map(c => ({ ...c, label: AGE_LABEL[c.categorie_age] ?? c.categorie_age })),
        [s.categories_age],
    );

    return (
        <div className="min-h-screen bg-slate-100 font-sans antialiased lg:flex">
            <Sidebar />
            <main className="min-w-0 flex-1 lg:ml-60">
                <Header title="Statistiques CEP" />

                <div className="space-y-6 px-4 py-6 sm:px-6">

                    {/* ── Bannière ── */}
                    <div className="relative overflow-hidden rounded-2xl bg-[#062824] p-6">
                        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-teal-400/10" />
                        <div className="relative flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-extrabold text-white">Statistiques des Champs Écoles Paysans</h2>
                                <p className="mt-1 text-sm text-cyan-100/50">
                                    {isAdmin ? 'Vue plateforme — toutes données confondues' : 'Vos données CEP'}
                                </p>
                            </div>
                            {!loading && !error && (
                                <div className="flex flex-wrap gap-2">
                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-cyan-100/80">
                                        {fmt(totalParticipants)} participants
                                    </span>
                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-cyan-100/80">
                                        {nbRenseignes}/{avancement.length} modules renseignés
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                    )}

                    {/* ── Onglets (un seul filtre, au-dessus de tout ce qu'il pilote) ── */}
                    <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                                    tab === t.key
                                        ? 'bg-teal-600 text-white'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                }`}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* ════════════ PARTICIPANTS ════════════ */}
                    {tab === 'participants' && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                                <Panel title="Participants par commune" subtitle="Hommes / Femmes — 10 premières communes" className="xl:col-span-2">
                                    {loading ? <Skeleton h="h-64" />
                                        : <GroupedBars items={s.participants_commune} labelKey="commune" series={SERIES_HF} />}
                                </Panel>
                                <Panel title="Répartition Hommes / Femmes" subtitle="Ensemble des participants identifiés">
                                    {loading ? <Skeleton h="h-32" />
                                        : <SplitBar
                                            headline={totalParticipants}
                                            headlineNote="participants identifiés"
                                            a={{ label: 'Hommes', value: s.repartition_hf?.hommes, color: C.hommes }}
                                            b={{ label: 'Femmes', value: s.repartition_hf?.femmes, color: C.femmes }} />}
                                </Panel>
                            </div>
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <Panel title="Catégories d'âge" subtitle="Participants CEP identifiés">
                                    {loading ? <Skeleton /> : <BarList ordinal items={categoriesAge} labelKey="label" valueKey="nb" />}
                                </Panel>
                                <Panel title="Types de producteur" subtitle="Base des bénéficiaires de l'intervention">
                                    {loading ? <Skeleton /> : <BarList items={s.types_producteur} labelKey="type_producteur" valueKey="nb" />}
                                </Panel>
                            </div>
                        </div>
                    )}

                    {/* ════════════ RENDEMENTS & IMPACT ════════════ */}
                    {tab === 'rendements' && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                                <Panel title="Rendement moyen par culture" subtitle="kg/ha — unités de démonstration">
                                    {loading ? <Skeleton h="h-64" />
                                        : <GroupedBars items={s.rendements} labelKey="culture" series={SERIES_RENDEMENT} format={fmtKg} />}
                                </Panel>
                                <Panel title="Gain de rendement" subtitle="Technologie vs parcelle témoin (moyenne, %)">
                                    {loading ? <Skeleton h="h-64" /> : <DivergingBars items={s.gain_rendement} />}
                                </Panel>
                            </div>
                            <Panel title="Rendements par dispositif CEP" subtitle="kg/ha — moyenne des dispositifs 1 à 4, par culture et commune">
                                {loading ? <Skeleton h="h-64" />
                                    : <GroupedBars items={s.dispositifs} labelKey="label" series={SERIES_DISPOSITIFS} format={fmtKg} />}
                            </Panel>
                            {isAdmin && (
                                <Panel title="Pipeline innovation" subtitle="Du problème identifié à l'expérimentation">
                                    {loading ? <Skeleton /> : <PipelineFunnel pipeline={s.pipeline} />}
                                </Panel>
                            )}
                        </div>
                    )}

                    {/* ════════════ SESSIONS & VISITES ════════════ */}
                    {tab === 'sessions' && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                                <StatTile label="Sessions d'animation" value={fmt(s.totaux_activite?.sessions)} loading={loading}
                                    sub="bilans enregistrés" path="/bilan-sessions-animation-cep" />
                                <StatTile label="Participations aux sessions" value={fmt(s.totaux_activite?.participants)} loading={loading}
                                    sub="cumul toutes sessions" />
                                <StatTile label="Visites d'échanges" value={fmt(s.totaux_activite?.visites)} loading={loading}
                                    sub="visites commentées" path="/visites-echanges-commentees" />
                                <StatTile label="Visiteurs accueillis" value={fmt(s.totaux_activite?.visiteurs)} loading={loading}
                                    sub="cumul toutes visites" />
                            </div>
                            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                                <Panel title="Événements par mois" subtitle="Sessions d'animation et visites d'échanges — 12 derniers mois">
                                    <TrendChart data={s.activite_mensuelle} series={SERIES_EVENEMENTS} loading={loading} />
                                </Panel>
                                <Panel title="Fréquentation par mois" subtitle="Personnes touchées — 12 derniers mois">
                                    <TrendChart data={s.activite_mensuelle} series={SERIES_FREQUENTATION} loading={loading} />
                                </Panel>
                            </div>
                        </div>
                    )}

                    {/* ════════════ TERRAIN ════════════ */}
                    {tab === 'terrain' && (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            <Panel title="Spéculations les plus pratiquées" subtitle="Participants CEP identifiés">
                                {loading ? <Skeleton /> : <BarList items={s.top_speculations} labelKey="speculation" valueKey="nb" />}
                            </Panel>
                            <Panel title="Pratiques agroécologiques" subtitle="Adoptées par les bénéficiaires">
                                {loading ? <Skeleton /> : <BarList items={s.top_pratiques} labelKey="pratique" valueKey="nb" />}
                            </Panel>
                            <Panel title="Difficultés les plus signalées" subtitle="Remontées des champs-écoles">
                                {loading ? <Skeleton /> : <RankedList items={s.top_difficultes} labelKey="difficulte" valueKey="nb" />}
                            </Panel>
                        </div>
                    )}

                    {/* ════════════ AVANCEMENT MODULES ════════════ */}
                    {tab === 'avancement' && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-3 gap-4">
                                <StatTile label="Modules renseignés" value={fmt(nbRenseignes)} loading={loading}
                                    sub={`sur ${avancement.length} modules`} />
                                <StatTile label="Modules sans saisie" value={fmt(avancement.length - nbRenseignes)} loading={loading}
                                    sub="aucun enregistrement" />
                                <StatTile label="Taux de complétion" value={`${pctRenseignes} %`} loading={loading}
                                    sub="modules avec au moins une saisie" />
                            </div>
                            <Panel title="Enregistrements par module" subtitle="Nombre de lignes saisies, du plus renseigné au moins renseigné">
                                {loading ? <Skeleton h="h-96" /> : <BarList items={avancement} labelKey="label" valueKey="valeur" />}
                            </Panel>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
