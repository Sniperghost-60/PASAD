import { useEffect, useState } from 'react';
import {
    BarChart, Bar, LineChart, Line, ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Cell, PieChart, Pie,
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { Sidebar, Header } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

/* ── Palette ──────────────────────────────────────────────────────── */
const C = {
    teal:   '#0d9488', emerald:'#059669', sky:'#0284c7',
    violet: '#7c3aed', amber:  '#d97706', rose:  '#e11d48',
    indigo: '#4f46e5', orange: '#ea580c', cyan:  '#0891b2',
    slate:  '#475569',
};
const PIE_COLORS = [C.teal, C.rose, C.amber, C.violet, C.sky, C.orange];

/* ── Tooltip personnalisé ─────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
            <p className="font-bold text-slate-800 mb-2">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2 py-0.5">
                    <span className="size-2 rounded-full flex-shrink-0" style={{ background: p.color || p.fill }} />
                    <span className="text-slate-600">{p.name} :</span>
                    <span className="font-bold text-slate-800">
                        {typeof p.value === 'number' ? p.value.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : p.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

/* ── Carte de graphe ──────────────────────────────────────────────── */
function ChartCard({ title, subtitle, icon, accent, children, loading }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className={`px-5 py-4 border-b border-slate-100 bg-gradient-to-r ${accent}`}>
                <div className="flex items-center gap-2.5">
                    <span className="text-white/80 text-lg">{icon}</span>
                    <div>
                        <h3 className="text-white font-bold text-sm">{title}</h3>
                        {subtitle && <p className="text-white/60 text-xs mt-0.5">{subtitle}</p>}
                    </div>
                </div>
            </div>
            <div className="p-5">
                {loading
                    ? <div className="h-64 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="size-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
                            <p className="text-xs text-slate-400">Chargement des données…</p>
                        </div>
                      </div>
                    : children
                }
            </div>
        </div>
    );
}

/* ── Message "pas de données" ─────────────────────────────────────── */
function NoData({ message = 'Aucune donnée disponible' }) {
    return (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
            <svg className="size-12 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 12l4-4 4 4 5-5" />
            </svg>
            <p className="text-sm font-medium">{message}</p>
            <p className="text-xs text-slate-300">Saisissez des données pour voir les graphes</p>
        </div>
    );
}

/* ── Onglets ──────────────────────────────────────────────────────── */
const TABS = [
    { key: 'participants', label: 'Participants',         icon: '👥' },
    { key: 'rendements',   label: 'Rendements',           icon: '🌾' },
    { key: 'sessions',     label: 'Sessions & visites',   icon: '📅' },
    { key: 'terrain',      label: 'Terrain',              icon: '🌱' },
    { key: 'impact',       label: 'Impact & innovations', icon: '📊' },
    { key: 'avancement',   label: 'Avancement modules',   icon: '✅' },
];

/* ── Formatage mois ───────────────────────────────────────────────── */
const fmtMois = (m) => {
    if (!m) return '';
    const [y, mo] = m.split('-');
    const noms = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    return `${noms[parseInt(mo,10)-1]} ${y}`;
};

/* ── Formatage nombre ─────────────────────────────────────────────── */
const fmtNum = (v) => typeof v === 'number' ? v.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : (v ?? 0);

/* ══════════════════════════════════════════════════════════════════ */
export default function StatistiquesCep() {
    const { hasRole } = useAuth();
    const isAdmin = hasRole(['Super-Admin', 'Administrateur', 'Superviseur']);

    const [tab,     setTab]     = useState('participants');
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);

    useEffect(() => {
        setLoading(true);
        api.get('/api/stats/cep')
            .then(r => setData(r.data))
            .catch(() => setError('Impossible de charger les statistiques.'))
            .finally(() => setLoading(false));
    }, []);

    /* ── Données graphe 1 : participants ── */
    const dataParticipants = (data?.participants ?? []).map(r => ({
        commune: r.commune,
        'Hommes':  parseInt(r.hommes  ?? 0),
        'Femmes':  parseInt(r.femmes  ?? 0),
        'Total':   parseInt(r.total   ?? 0),
    }));
    const dataHF = [
        { name: 'Hommes', value: data?.repartition_hf?.hommes ?? 0, fill: C.sky   },
        { name: 'Femmes', value: data?.repartition_hf?.femmes ?? 0, fill: C.rose  },
    ];

    /* ── Données graphe 2 : rendements ── */
    const dataRendements = (data?.rendements ?? []).map(r => ({
        culture:      r.culture,
        'Année n-1':  parseFloat(r.moy_n1   ?? 0),
        'Avec techno':parseFloat(r.moy_tech ?? 0),
        'Témoin':     parseFloat(r.moy_temoin ?? 0),
        'Producteurs':parseInt(r.nb_producteurs ?? 0),
    }));

    const dataEvolution = (data?.evolution_rendements ?? []).map(r => ({
        label:          `${r.culture} — ${r.commune}`,
        'Dispositif 1': parseFloat(r.d1 ?? 0),
        'Dispositif 2': parseFloat(r.d2 ?? 0),
        'Dispositif 3': parseFloat(r.d3 ?? 0),
        'Dispositif 4': parseFloat(r.d4 ?? 0),
    }));

    /* ── Données graphe 3 : sessions & visites ── */
    const dataSessions = (data?.sessions_visites ?? []).map(r => ({
        mois:          fmtMois(r.mois),
        'Sessions':    r.nb_sessions  ?? 0,
        'Participants':r.participants  ?? 0,
        'Visites':     r.nb_visites   ?? 0,
        'Visiteurs':   r.visiteurs    ?? 0,
    }));

    /* ── Données graphe 4 : avancement ── */
    const dataAvancement = (data?.avancement ?? []).map(r => ({
        label:     r.label,
        valeur:    r.valeur,
        renseigne: r.renseigne,
    }));
    const nbRenseignes = dataAvancement.filter(r => r.renseigne).length;
    const pctGlobal    = dataAvancement.length > 0
        ? Math.round((nbRenseignes / dataAvancement.length) * 100)
        : 0;

    /* ── Données graphe 5 : terrain ── */
    const dataSpeculations = (data?.top_speculations ?? []).map(r => ({
        name: r.speculation,
        value: parseInt(r.nb ?? 0),
    }));
    const dataCategoriesAge = (data?.categories_age ?? []).map(r => ({
        name: r.categorie_age,
        value: parseInt(r.nb ?? 0),
    }));
    const dataPratiques = (data?.top_pratiques ?? []).map(r => ({
        name: r.pratique,
        value: parseInt(r.nb ?? 0),
    }));
    const dataTypesProducteur = (data?.types_producteur ?? []).map(r => ({
        name: r.type_producteur,
        value: parseInt(r.nb ?? 0),
    }));

    /* ── Données graphe 6 : impact ── */
    const dataDifficultes = (data?.top_difficultes ?? []).map(r => ({
        name: r.difficulte,
        value: parseInt(r.nb ?? 0),
    }));
    const pipeline   = data?.pipeline ?? null;
    const gainRendem = (data?.gain_rendement ?? []).map(r => ({
        culture:  r.culture,
        'Gain %': parseFloat(r.gain_pct ?? 0),
        'Producteurs': parseInt(r.nb_producteurs ?? 0),
    }));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex">
            <Sidebar />
            <div className="flex-1 ml-60 flex flex-col min-h-screen">
                <Header title="Statistiques CEP" />

                <main className="flex-1 px-6 py-6 space-y-6">

                    {/* ── En-tête ── */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#062824] to-teal-800 px-6 py-5 shadow-lg">
                        <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/5" />
                        <div className="relative flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-extrabold text-white">Statistiques des Champs Écoles Paysans</h2>
                                <p className="text-cyan-200/70 text-sm mt-1">
                                    {isAdmin ? 'Vue globale — toutes données confondues' : 'Vos données personnelles'}
                                </p>
                            </div>
                            {data && (
                                <div className="flex flex-wrap gap-3">
                                    {[
                                        { label:'Participants', value: (data.repartition_hf?.hommes ?? 0) + (data.repartition_hf?.femmes ?? 0), color:'text-teal-300' },
                                        { label:'Modules actifs', value: `${nbRenseignes}/${dataAvancement.length}`, color:'text-amber-300' },
                                        { label:'Avancement', value: `${pctGlobal}%`, color:'text-emerald-300' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-center">
                                            <p className={`text-lg font-black ${color}`}>{value}</p>
                                            <p className="text-white/50 text-xs">{label}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
                    )}

                    {/* ── Onglets ── */}
                    <div className="flex gap-1 bg-white rounded-xl border border-slate-100 shadow-sm p-1 w-fit">
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                                    tab === t.key
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}>
                                <span>{t.icon}</span>
                                <span>{t.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* ════════════════════════════════════════════════
                        ONGLET 1 : PARTICIPANTS
                    ════════════════════════════════════════════════ */}
                    {tab === 'participants' && (
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                            {/* Barres par commune */}
                            <div className="xl:col-span-2">
                                <ChartCard
                                    title="Participants par commune"
                                    subtitle="Répartition Hommes / Femmes par zone géographique"
                                    icon="👥" accent="from-teal-600 to-emerald-700"
                                    loading={loading}>
                                    {dataParticipants.length === 0
                                        ? <NoData />
                                        : <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={dataParticipants} margin={{ top:5, right:10, left:0, bottom:40 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis dataKey="commune" tick={{ fontSize:11, fill:'#64748b' }} angle={-30} textAnchor="end" interval={0} />
                                                <YAxis tick={{ fontSize:11, fill:'#64748b' }} allowDecimals={false} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend wrapperStyle={{ fontSize:11, paddingTop:8 }} />
                                                <Bar dataKey="Hommes"  fill={C.sky}     radius={[4,4,0,0]} maxBarSize={40} />
                                                <Bar dataKey="Femmes"  fill={C.rose}    radius={[4,4,0,0]} maxBarSize={40} />
                                                <Bar dataKey="Total"   fill={C.teal}    radius={[4,4,0,0]} maxBarSize={40} />
                                            </BarChart>
                                          </ResponsiveContainer>
                                    }
                                </ChartCard>
                            </div>

                            {/* Camembert H/F */}
                            <ChartCard
                                title="Répartition H / F"
                                subtitle="Global tous CEP confondus"
                                icon="⚖️" accent="from-indigo-600 to-violet-700"
                                loading={loading}>
                                {(dataHF[0].value + dataHF[1].value) === 0
                                    ? <NoData />
                                    : <div className="flex flex-col items-center">
                                        <ResponsiveContainer width="100%" height={220}>
                                            <PieChart>
                                                <Pie data={dataHF} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                                                    dataKey="value" paddingAngle={3}>
                                                    {dataHF.map((e, i) => (
                                                        <Cell key={i} fill={e.fill} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="flex gap-6 mt-2">
                                            {dataHF.map(d => (
                                                <div key={d.name} className="flex items-center gap-2">
                                                    <span className="size-3 rounded-full" style={{ background:d.fill }} />
                                                    <span className="text-xs font-semibold text-slate-700">
                                                        {d.name} : <strong>{d.value}</strong>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                      </div>
                                }
                            </ChartCard>
                        </div>
                    )}

                    {/* ════════════════════════════════════════════════
                        ONGLET 2 : RENDEMENTS
                    ════════════════════════════════════════════════ */}
                    {tab === 'rendements' && (
                        <div className="space-y-5">
                            {/* Comparaison n-1 / technologie / témoin */}
                            <ChartCard
                                title="Comparaison des rendements par culture"
                                subtitle="Rendement moyen (kg/ha) : Année n-1 · Avec technologie · Parcelle témoin"
                                icon="🌾" accent="from-amber-500 to-orange-600"
                                loading={loading}>
                                {dataRendements.length === 0
                                    ? <NoData />
                                    : <ResponsiveContainer width="100%" height={320}>
                                        <BarChart data={dataRendements} margin={{ top:5, right:10, left:0, bottom:50 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="culture" tick={{ fontSize:11, fill:'#64748b' }} angle={-30} textAnchor="end" interval={0} />
                                            <YAxis tick={{ fontSize:11, fill:'#64748b' }} unit=" kg" />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ fontSize:11, paddingTop:12 }} />
                                            <Bar dataKey="Année n-1"   fill={C.slate}   radius={[4,4,0,0]} maxBarSize={35} />
                                            <Bar dataKey="Avec techno" fill={C.emerald} radius={[4,4,0,0]} maxBarSize={35} />
                                            <Bar dataKey="Témoin"      fill={C.amber}   radius={[4,4,0,0]} maxBarSize={35} />
                                        </BarChart>
                                      </ResponsiveContainer>
                                }
                            </ChartCard>

                            {/* Évolution par dispositif */}
                            <ChartCard
                                title="Rendements par dispositif CEP"
                                subtitle="Dispositifs 1 à 4 — comparaison par culture et commune"
                                icon="📈" accent="from-emerald-600 to-teal-700"
                                loading={loading}>
                                {dataEvolution.length === 0
                                    ? <NoData />
                                    : <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={dataEvolution} margin={{ top:5, right:10, left:0, bottom:60 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="label" tick={{ fontSize:10, fill:'#64748b' }} angle={-35} textAnchor="end" interval={0} />
                                            <YAxis tick={{ fontSize:11, fill:'#64748b' }} unit=" kg" />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ fontSize:11, paddingTop:12 }} />
                                            <Bar dataKey="Dispositif 1" fill={C.teal}   radius={[4,4,0,0]} maxBarSize={30} />
                                            <Bar dataKey="Dispositif 2" fill={C.sky}    radius={[4,4,0,0]} maxBarSize={30} />
                                            <Bar dataKey="Dispositif 3" fill={C.violet} radius={[4,4,0,0]} maxBarSize={30} />
                                            <Bar dataKey="Dispositif 4" fill={C.amber}  radius={[4,4,0,0]} maxBarSize={30} />
                                        </BarChart>
                                      </ResponsiveContainer>
                                }
                            </ChartCard>
                        </div>
                    )}

                    {/* ════════════════════════════════════════════════
                        ONGLET 3 : SESSIONS & VISITES
                    ════════════════════════════════════════════════ */}
                    {tab === 'sessions' && (
                        <div className="space-y-5">
                            <ChartCard
                                title="Sessions d'animation & visites d'échanges"
                                subtitle="Évolution mensuelle — barres : sessions · courbes : visites"
                                icon="📅" accent="from-sky-600 to-cyan-700"
                                loading={loading}>
                                {dataSessions.length === 0
                                    ? <NoData message="Aucune session ou visite enregistrée" />
                                    : <ResponsiveContainer width="100%" height={320}>
                                        <ComposedChart data={dataSessions} margin={{ top:5, right:20, left:0, bottom:20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="mois" tick={{ fontSize:11, fill:'#64748b' }} />
                                            <YAxis yAxisId="left"  tick={{ fontSize:11, fill:'#64748b' }} allowDecimals={false} />
                                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fill:'#64748b' }} allowDecimals={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ fontSize:11, paddingTop:8 }} />
                                            <Bar    yAxisId="left"  dataKey="Sessions"     fill={C.teal}   radius={[4,4,0,0]} maxBarSize={40} />
                                            <Bar    yAxisId="left"  dataKey="Visites"      fill={C.violet} radius={[4,4,0,0]} maxBarSize={40} />
                                            <Line   yAxisId="right" dataKey="Participants" stroke={C.amber}   strokeWidth={2.5} dot={{ r:4, fill:C.amber }}   type="monotone" />
                                            <Line   yAxisId="right" dataKey="Visiteurs"    stroke={C.rose}    strokeWidth={2.5} dot={{ r:4, fill:C.rose }}    type="monotone" />
                                        </ComposedChart>
                                      </ResponsiveContainer>
                                }
                            </ChartCard>

                            {/* Résumé chiffré */}
                            {dataSessions.length > 0 && (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label:'Total sessions',    value: dataSessions.reduce((s,r)=>s+(r.Sessions||0),0),    color:'bg-teal-500'   },
                                        { label:'Total participants', value: dataSessions.reduce((s,r)=>s+(r.Participants||0),0), color:'bg-amber-500'  },
                                        { label:'Total visites',     value: dataSessions.reduce((s,r)=>s+(r.Visites||0),0),      color:'bg-violet-500' },
                                        { label:'Total visiteurs',   value: dataSessions.reduce((s,r)=>s+(r.Visiteurs||0),0),    color:'bg-rose-500'   },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                                            <div className={`size-3 rounded-full ${color} flex-shrink-0`} />
                                            <div>
                                                <p className="text-2xl font-black text-slate-800">{fmtNum(value)}</p>
                                                <p className="text-xs text-slate-500">{label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ════════════════════════════════════════════════
                        ONGLET 5 : TERRAIN
                    ════════════════════════════════════════════════ */}
                    {tab === 'terrain' && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            {/* Top spéculations */}
                            <ChartCard
                                title="Top spéculations pratiquées"
                                subtitle="Principales cultures des participants CEP"
                                icon="🌿" accent="from-emerald-600 to-teal-700"
                                loading={loading}>
                                {dataSpeculations.length === 0
                                    ? <NoData message="Aucune spéculation enregistrée" />
                                    : <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={dataSpeculations} layout="vertical" margin={{ top:5, right:50, left:10, bottom:5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                            <XAxis type="number" tick={{ fontSize:11, fill:'#64748b' }} allowDecimals={false} />
                                            <YAxis type="category" dataKey="name" width={130} tick={{ fontSize:11, fill:'#64748b' }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="value" name="Participants" fill={C.emerald} radius={[0,6,6,0]} maxBarSize={24} />
                                        </BarChart>
                                      </ResponsiveContainer>
                                }
                            </ChartCard>

                            {/* Catégories d'âge */}
                            <ChartCard
                                title="Répartition par catégorie d'âge"
                                subtitle="Jeunes, adultes, seniors"
                                icon="👶" accent="from-violet-600 to-indigo-700"
                                loading={loading}>
                                {dataCategoriesAge.length === 0
                                    ? <NoData message="Aucune catégorie d'âge enregistrée" />
                                    : <div className="flex flex-col items-center">
                                        <ResponsiveContainer width="100%" height={220}>
                                            <PieChart>
                                                <Pie data={dataCategoriesAge} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                                                    dataKey="value" nameKey="name" paddingAngle={3}>
                                                    {dataCategoriesAge.map((_, i) => (
                                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend wrapperStyle={{ fontSize:11 }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                      </div>
                                }
                            </ChartCard>

                            {/* Top pratiques agroécologiques */}
                            <ChartCard
                                title="Pratiques agroécologiques adoptées"
                                subtitle="Top pratiques — cumul des 3 champs de saisie"
                                icon="🌱" accent="from-teal-600 to-cyan-700"
                                loading={loading}>
                                {dataPratiques.length === 0
                                    ? <NoData message="Aucune pratique enregistrée" />
                                    : <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={dataPratiques} layout="vertical" margin={{ top:5, right:50, left:10, bottom:5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                            <XAxis type="number" tick={{ fontSize:11, fill:'#64748b' }} allowDecimals={false} />
                                            <YAxis type="category" dataKey="name" width={160} tick={{ fontSize:10, fill:'#64748b' }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="value" name="Adoptions" fill={C.teal} radius={[0,6,6,0]} maxBarSize={22} />
                                        </BarChart>
                                      </ResponsiveContainer>
                                }
                            </ChartCard>

                            {/* Type de producteur */}
                            <ChartCard
                                title="Type de producteur"
                                subtitle="Répartition petit / moyen / grand producteur"
                                icon="👨‍🌾" accent="from-amber-500 to-orange-600"
                                loading={loading}>
                                {dataTypesProducteur.length === 0
                                    ? <NoData message="Aucun type de producteur enregistré" />
                                    : <div className="flex flex-col items-center">
                                        <ResponsiveContainer width="100%" height={220}>
                                            <PieChart>
                                                <Pie data={dataTypesProducteur} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                                                    dataKey="value" nameKey="name" paddingAngle={3}>
                                                    {dataTypesProducteur.map((_, i) => (
                                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend wrapperStyle={{ fontSize:11 }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                      </div>
                                }
                            </ChartCard>
                        </div>
                    )}

                    {/* ════════════════════════════════════════════════
                        ONGLET 6 : IMPACT & INNOVATIONS
                    ════════════════════════════════════════════════ */}
                    {tab === 'impact' && (
                        <div className="space-y-5">
                            {/* Pipeline problèmes → solutions (admin uniquement) */}
                            {isAdmin && pipeline && (
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-indigo-700">
                                        <h3 className="text-white font-bold text-sm">Pipeline Innovation — Problèmes → Solutions → Expérimentations</h3>
                                        <p className="text-white/60 text-xs mt-0.5">Taux de transformation des problèmes en solutions testées</p>
                                    </div>
                                    <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            { label:'Problèmes identifiés', value:pipeline.total,     color:'text-slate-800',   bg:'bg-slate-50',   icon:'🔍' },
                                            { label:'Jugés pertinents',     value:pipeline.pertinents, color:'text-violet-700',  bg:'bg-violet-50',  icon:'✔️' },
                                            { label:'Dans curriculum',      value:pipeline.curriculum, color:'text-teal-700',    bg:'bg-teal-50',    icon:'📋' },
                                            { label:'Protocoles testés',    value:pipeline.protocoles, color:'text-emerald-700', bg:'bg-emerald-50', icon:'🧪' },
                                        ].map(({ label, value, color, bg, icon }) => (
                                            <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
                                                <p className="text-xl mb-1">{icon}</p>
                                                <p className={`text-3xl font-black ${color}`}>{fmtNum(value)}</p>
                                                <p className="text-xs text-slate-500 mt-1 leading-tight">{label}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Barre de progression pipeline */}
                                    <div className="px-5 pb-5">
                                        <div className="flex items-center gap-3">
                                            {[
                                                { label:'Identifiés', val:pipeline.total,     color:'bg-slate-400' },
                                                { label:'Pertinents', val:pipeline.pertinents, color:'bg-violet-500' },
                                                { label:'Curriculum', val:pipeline.curriculum, color:'bg-teal-500' },
                                                { label:'Testés',     val:pipeline.protocoles, color:'bg-emerald-500' },
                                            ].map(({ label, val, color }, i, arr) => {
                                                const pct = pipeline.total > 0 ? Math.round(val / pipeline.total * 100) : 0;
                                                return (
                                                    <div key={label} className="flex-1 text-center">
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                                                            <div className={`h-full rounded-full ${color}`} style={{ width:`${pct}%` }} />
                                                        </div>
                                                        <p className="text-[10px] text-slate-500">{label} <span className="font-bold">({pct}%)</span></p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Gain rendement technologie vs témoin (admin) */}
                            {isAdmin && gainRendem.length > 0 && (
                                <ChartCard
                                    title="Gain de rendement — Technologie vs Témoin"
                                    subtitle="Gain moyen en % par culture (positif = technologie supérieure au témoin)"
                                    icon="📈" accent="from-emerald-600 to-teal-700"
                                    loading={loading}>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={gainRendem} layout="vertical" margin={{ top:5, right:80, left:10, bottom:5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                            <XAxis type="number" tick={{ fontSize:11, fill:'#64748b' }} unit=" %" />
                                            <YAxis type="category" dataKey="culture" width={130} tick={{ fontSize:11, fill:'#64748b' }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="Gain %" fill={C.emerald} radius={[0,6,6,0]} maxBarSize={24} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            )}

                            {/* Top difficultés signalées */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                <ChartCard
                                    title="Difficultés les plus signalées"
                                    subtitle="Remontées terrain — top 5"
                                    icon="⚠️" accent="from-orange-500 to-amber-600"
                                    loading={loading}>
                                    {dataDifficultes.length === 0
                                        ? <NoData message="Aucune difficulté enregistrée" />
                                        : <div className="space-y-3 p-2">
                                            {dataDifficultes.map((d, i) => {
                                                const max = dataDifficultes[0]?.value ?? 1;
                                                const pct = Math.round(d.value / max * 100);
                                                return (
                                                    <div key={i}>
                                                        <div className="flex justify-between mb-1">
                                                            <span className="text-xs font-semibold text-slate-600 pr-2 truncate">{d.name}</span>
                                                            <span className="text-xs font-black text-orange-700 flex-shrink-0">{d.value}</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full bg-orange-400 transition-all duration-700" style={{ width:`${pct}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                          </div>
                                    }
                                </ChartCard>

                                {/* Radar des spéculations (si données) */}
                                {dataSpeculations.length > 0 && (
                                    <ChartCard
                                        title="Couverture des spéculations"
                                        subtitle="Vue radar des cultures couvertes"
                                        icon="🎯" accent="from-sky-600 to-cyan-700"
                                        loading={loading}>
                                        <ResponsiveContainer width="100%" height={280}>
                                            <RadarChart data={dataSpeculations} margin={{ top:10, right:30, bottom:10, left:30 }}>
                                                <PolarGrid stroke="#e2e8f0" />
                                                <PolarAngleAxis dataKey="name" tick={{ fontSize:10, fill:'#64748b' }} />
                                                <Radar name="Participants" dataKey="value" stroke={C.sky} fill={C.sky} fillOpacity={0.3} strokeWidth={2} />
                                                <Tooltip content={<CustomTooltip />} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </ChartCard>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ════════════════════════════════════════════════
                        ONGLET 4 (ex-4) : AVANCEMENT MODULES
                    ════════════════════════════════════════════════ */}
                    {tab === 'avancement' && (
                        <div className="space-y-5">
                            {/* Compteur global */}
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label:'Modules renseignés',  value:nbRenseignes,                        color:'text-emerald-600', bg:'bg-emerald-50',  border:'border-emerald-100' },
                                    { label:'Modules manquants',   value:dataAvancement.length-nbRenseignes,  color:'text-rose-600',    bg:'bg-rose-50',     border:'border-rose-100'    },
                                    { label:'Taux de complétion',  value:`${pctGlobal} %`,                    color:'text-teal-700',    bg:'bg-teal-50',     border:'border-teal-100'    },
                                ].map(({ label, value, color, bg, border }) => (
                                    <div key={label} className={`${bg} border ${border} rounded-2xl p-4 text-center`}>
                                        <p className={`text-3xl font-black ${color}`}>{loading ? '…' : value}</p>
                                        <p className="text-xs text-slate-600 mt-1">{label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Graphe barres horizontales */}
                            <ChartCard
                                title="Enregistrements par module"
                                subtitle="Nombre de lignes saisies par rubrique"
                                icon="📊" accent="from-violet-600 to-indigo-700"
                                loading={loading}>
                                {dataAvancement.length === 0
                                    ? <NoData />
                                    : <ResponsiveContainer width="100%" height={420}>
                                        <BarChart
                                            data={dataAvancement}
                                            layout="vertical"
                                            margin={{ top:5, right:40, left:5, bottom:5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                            <XAxis type="number" tick={{ fontSize:11, fill:'#64748b' }} allowDecimals={false} />
                                            <YAxis type="category" dataKey="label"
                                                tick={{ fontSize:10, fill:'#64748b' }} width={130} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="valeur" name="Enregistrements" radius={[0,6,6,0]} maxBarSize={22}>
                                                {dataAvancement.map((entry, i) => (
                                                    <Cell key={i}
                                                        fill={entry.renseigne ? C.teal : '#e2e8f0'}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                      </ResponsiveContainer>
                                }
                            </ChartCard>

                            {/* Liste détaillée */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-800">Détail par module</h3>
                                    <span className="text-xs text-slate-500">{nbRenseignes} / {dataAvancement.length} actifs</span>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {loading
                                        ? Array.from({ length: 8 }).map((_, i) => (
                                            <div key={i} className="flex items-center gap-3 px-5 py-3">
                                                <div className="size-2 rounded-full bg-slate-100 flex-shrink-0" />
                                                <div className="flex-1 h-3 bg-slate-100 rounded animate-pulse" />
                                                <div className="w-8 h-4 bg-slate-100 rounded animate-pulse" />
                                            </div>
                                          ))
                                        : dataAvancement.map((m, i) => (
                                            <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition">
                                                <span className={`size-2 rounded-full flex-shrink-0 ${m.renseigne ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                                <span className="flex-1 text-xs font-medium text-slate-700">{m.label}</span>
                                                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                                                    m.renseigne
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                    {m.valeur} enreg.
                                                </span>
                                            </div>
                                          ))
                                    }
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
