import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

/* ══════════════════════════════════════════════════════════════════════
   PALETTE (validée dataviz — scripts/validate_palette.js)
   - Séquentiel / marque : rampe teal (un seul hue, clair → foncé)
   - Paire catégorielle : teal / bleu (ΔE CVD 53 — PASS)
   - Paire H/F : bleu / magenta (étiquettes visibles obligatoires)
   - Divergent : teal (gain) ↔ rouge (perte), base neutre
══════════════════════════════════════════════════════════════════════ */
export const C = {
    brand:   '#0d9488',                                     // teal-600 — série unique
    alt:     '#2a78d6',                                     // 2ᵉ série catégorielle (bleu)
    neutral: '#94a3b8',                                     // référence / dé-emphase
    ramp:    ['#14b8a6', '#0d9488', '#0f766e', '#115e59'],  // rampe ordinale validée
    track:   '#f0fdfa',                                     // piste = pas clair de la rampe
    hommes:  '#2a78d6',
    femmes:  '#e87ba4',
    pos:     '#0d9488',
    neg:     '#d03b3b',
    grid:    '#e2e8f0',
    axis:    '#94a3b8',
};

export const fmt = (v) => Number(v || 0).toLocaleString('fr-FR');
export const fmtCompact = (v) => v >= 1000
    ? `${(v / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k`
    : String(v);

/* Codes J/A/V de l'identification des participants → libellés + ordre d'âge */
export const AGE_ORDER = { J: 0, A: 1, V: 2 };
export const AGE_LABEL = { J: 'Jeunes (≤ 35 ans)', A: 'Adultes (36–59 ans)', V: 'Vieux (60 ans et +)' };

const MOIS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export const moisLabel = (ym) => {
    const [y, m] = (ym || '').split('-');
    return `${MOIS_FR[Number(m) - 1] ?? ym} ${String(y).slice(2)}`;
};

/* Les 12 derniers mois (clés YYYY-MM), pour combler les mois sans saisie */
export const last12Months = () => {
    const out = [];
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 11);
    for (let i = 0; i < 12; i++) {
        out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        d.setMonth(d.getMonth() + 1);
    }
    return out;
};

/* ══════════════════════════════════════════════════════════════════════
   BRIQUES UI
══════════════════════════════════════════════════════════════════════ */

export function StatTile({ label, value, sub, path, loading }) {
    const body = (
        <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            {loading
                ? <div className="mt-2 h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
                : <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>}
            {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
    );
    return path ? <Link to={path} className="block h-full">{body}</Link> : body;
}

export function Panel({ title, subtitle, children, className = '' }) {
    return (
        <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
            <div className="border-b border-slate-100 px-5 py-3.5">
                <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
            </div>
            <div className="p-5">{children}</div>
        </section>
    );
}

export function EmptyNote() {
    return <p className="py-6 text-center text-sm text-slate-400">Aucune donnée pour le moment.</p>;
}

export function Legend({ series }) {
    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {series.map(s => (
                <span key={s.key ?? s.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                    {s.label}
                </span>
            ))}
        </div>
    );
}

/* Liste de barres horizontales — une seule teinte (catégories nominales),
   ou rampe ordinale si `ordinal`. Marques fines, extrémité arrondie 4px. */
export function BarList({ items, labelKey, valueKey, ordinal = false, format = fmt }) {
    if (!items?.length) return <EmptyNote />;
    const max = Math.max(...items.map(i => Number(i[valueKey]) || 0), 1);
    return (
        <ul className="space-y-3">
            {items.map((it, i) => {
                const v = Number(it[valueKey]) || 0;
                const color = ordinal ? C.ramp[Math.min(i, C.ramp.length - 1)] : C.brand;
                return (
                    <li key={i}>
                        <div className="mb-1 flex items-baseline justify-between gap-3">
                            <span className="truncate text-xs font-medium text-slate-600">{it[labelKey]}</span>
                            <span className="flex-shrink-0 text-xs font-semibold text-slate-800">{format(v)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-r" style={{ background: C.track }}>
                            <div className="h-full rounded-r transition-all duration-500"
                                style={{ width: `${Math.max((v / max) * 100, 1.5)}%`, background: color }} />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

/* Barres groupées multi-séries par catégorie — légende obligatoire,
   valeur à l'extrémité de chaque barre, échelle partagée. */
export function GroupedBars({ items, labelKey, series, format = fmt }) {
    if (!items?.length) return <EmptyNote />;
    const max = Math.max(
        ...items.flatMap(it => series.map(s => Number(it[s.key]) || 0)), 1,
    );
    return (
        <div>
            <Legend series={series} />
            <ul className="mt-4 space-y-4">
                {items.map((it, i) => (
                    <li key={i}>
                        <p className="mb-1.5 truncate text-xs font-semibold text-slate-700">{it[labelKey]}</p>
                        <div className="space-y-[2px]">
                            {series.map(s => {
                                // null = non mesuré : la ligne reste (identité par position),
                                // mais sans barre ni  faux zéro.
                                const absent = it[s.key] == null;
                                const v = Number(it[s.key]) || 0;
                                return (
                                    <div key={s.key} className="flex items-center gap-2">
                                        <div className="h-2 flex-1 overflow-hidden rounded-r" style={{ background: '#f8fafc' }}>
                                            {!absent && (
                                                <div className="h-full rounded-r transition-all duration-500"
                                                    style={{ width: `${Math.max(v / max * 100, 0.8)}%`, background: s.color }} />
                                            )}
                                        </div>
                                        <span className="w-16 flex-shrink-0 text-right text-[11px] font-medium text-slate-600"
                                            style={{ fontVariantNumeric: 'tabular-nums' }}>{absent ? '—' : format(v)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/* Barre empilée part-à-tout à deux segments (écart 2px surface),
   valeurs toujours visibles à côté — jamais la couleur seule. */
export function SplitBar({ a, b, headline, headlineNote }) {
    const va = Number(a.value) || 0;
    const vb = Number(b.value) || 0;
    const total = va + vb;
    if (total === 0) return <EmptyNote />;
    const pctA = Math.round(va / total * 100);
    const pctB = 100 - pctA;
    return (
        <div>
            {headline != null && (
                <>
                    <p className="text-3xl font-semibold tracking-tight text-slate-900">{fmt(headline)}</p>
                    {headlineNote && <p className="mt-0.5 text-xs text-slate-400">{headlineNote}</p>}
                </>
            )}
            <div className={`flex h-4 gap-[2px] overflow-hidden rounded-md ${headline != null ? 'mt-4' : ''}`}>
                <div style={{ width: `${pctA}%`, background: a.color }} title={`${a.label} ${fmt(va)}`} />
                <div style={{ width: `${pctB}%`, background: b.color }} title={`${b.label} ${fmt(vb)}`} />
            </div>
            <div className="mt-3 space-y-1.5 text-xs">
                {[{ ...a, pct: pctA }, { ...b, pct: pctB }].map(s => (
                    <div key={s.label} className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                        <span className="text-slate-600">{s.label}</span>
                        <span className="ml-auto font-semibold text-slate-800">
                            {fmt(s.value)} <span className="font-normal text-slate-400">({s.pct} %)</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* Courbe mensuelle 1 à 2 séries — grille hairline pleine, tooltip + vue
   tableau (le tooltip ne doit jamais être le seul accès aux valeurs).
   Série unique : étiquette au dernier point. Deux séries : légende. */
function TrendTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-md">
            <p className="font-medium text-slate-500">{moisLabel(label)}</p>
            {payload.map(p => (
                <p key={p.dataKey} className="mt-0.5 flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: p.stroke }} />
                    <span className="text-slate-600">{p.name}</span>
                    <span className="ml-1 font-semibold text-slate-900">{fmt(p.value)}</span>
                </p>
            ))}
        </div>
    );
}

export function TrendChart({ data, series, loading, height = 224 }) {
    const rows = useMemo(() => {
        const byMonth = Object.fromEntries((data ?? []).map(r => [r.mois, r]));
        return last12Months().map(m => {
            const src = byMonth[m] ?? {};
            const row = { mois: m };
            series.forEach(s => { row[s.key] = Number(src[s.key]) || 0; });
            return row;
        });
    }, [data, series]);

    if (loading) return <div className="animate-pulse rounded-xl bg-slate-50" style={{ height }} />;
    const single = series.length === 1;
    const lastIdx = rows.length - 1;

    return (
        <div>
            {!single && <div className="mb-2"><Legend series={series} /></div>}
            <div style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={rows} margin={{ top: 16, right: 34, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke={C.grid} strokeWidth={1} vertical={false} />
                        <XAxis dataKey="mois" tickFormatter={moisLabel} interval="preserveStartEnd"
                            tick={{ fontSize: 11, fill: C.axis }} tickLine={false}
                            axisLine={{ stroke: C.grid }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: C.axis }}
                            tickLine={false} axisLine={false} width={44}
                            tickFormatter={fmtCompact} />
                        <Tooltip content={<TrendTooltip />} cursor={{ stroke: C.grid, strokeWidth: 1 }} />
                        {series.map(s => (
                            <Area key={s.key} type="monotone" dataKey={s.key} name={s.label}
                                isAnimationActive={false}
                                stroke={s.color} strokeWidth={2}
                                fill={s.color} fillOpacity={single ? 0.1 : 0}
                                activeDot={{ r: 4, fill: s.color, stroke: '#ffffff', strokeWidth: 2 }}
                                dot={(props) => props.index === lastIdx
                                    ? (
                                        <g key={`${s.key}-last`}>
                                            <circle cx={props.cx} cy={props.cy} r={4} fill={s.color} stroke="#ffffff" strokeWidth={2} />
                                            {single && (
                                                <text x={props.cx + 8} y={props.cy + 4} fontSize={11} fontWeight={600} fill="#334155">
                                                    {fmt(props.payload[s.key])}
                                                </text>
                                            )}
                                        </g>
                                    )
                                    : null} />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <details className="mt-2">
                <summary className="cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-600">Voir les données</summary>
                <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        <tbody>
                            <tr className="text-slate-500">
                                <td className="px-1 py-0.5" />
                                {rows.map(r => <td key={r.mois} className="px-1 py-0.5">{moisLabel(r.mois)}</td>)}
                            </tr>
                            {series.map(s => (
                                <tr key={s.key} className="font-semibold text-slate-800">
                                    <td className="px-1 py-0.5 font-medium text-slate-500">{s.label}</td>
                                    {rows.map(r => <td key={r.mois} className="px-1 py-0.5">{fmt(r[s.key])}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </div>
    );
}

/* Barres divergentes — gain/perte autour d'une base zéro. */
export function DivergingBars({ items, labelKey = 'culture', valueKey = 'gain_pct', countKey = 'nb' }) {
    if (!items?.length) return <EmptyNote />;
    const maxAbs = Math.max(...items.map(r => Math.abs(Number(r[valueKey]))), 1);
    return (
        <ul className="space-y-3">
            {items.map((r, i) => {
                const v = Number(r[valueKey]) || 0;
                const positive = v >= 0;
                const w = Math.abs(v) / maxAbs * 50; // % d'un demi-axe
                return (
                    <li key={i} className="flex items-center gap-3">
                        <span className="w-28 flex-shrink-0 truncate text-xs font-medium text-slate-600" title={r[labelKey]}>{r[labelKey]}</span>
                        <div className="relative h-3.5 flex-1">
                            <div className="absolute inset-y-0 left-1/2 w-px bg-slate-300" />
                            <div className="absolute inset-y-0 rounded-r"
                                style={positive
                                    ? { left: '50%', width: `${w}%`, background: C.pos, borderRadius: '0 4px 4px 0' }
                                    : { right: '50%', width: `${w}%`, background: C.neg, borderRadius: '4px 0 0 4px' }} />
                        </div>
                        <span className="w-16 flex-shrink-0 text-right text-xs font-semibold text-slate-800">
                            {positive ? '+' : '−'}{Math.abs(v).toLocaleString('fr-FR')} %
                        </span>
                        {countKey && <span className="w-12 flex-shrink-0 text-right text-[10px] text-slate-400">{r[countKey]} obs.</span>}
                    </li>
                );
            })}
        </ul>
    );
}

/* Entonnoir ordinal — pipeline innovation (rampe une teinte, clair → foncé). */
export function PipelineFunnel({ pipeline }) {
    if (!pipeline) return <EmptyNote />;
    const steps = [
        { label: 'Problèmes identifiés',   value: pipeline.problemes },
        { label: 'Jugés pertinents',       value: pipeline.pertinents },
        { label: 'Intégrés au curriculum', value: pipeline.curriculum },
        { label: 'Expérimentations',       value: pipeline.experimentations },
    ];
    const max = Math.max(...steps.map(s => Number(s.value) || 0), 1);
    return (
        <ul className="space-y-3">
            {steps.map((s, i) => {
                const v = Number(s.value) || 0;
                const pctOfFirst = steps[0].value > 0 ? Math.round(v / steps[0].value * 100) : 0;
                return (
                    <li key={s.label}>
                        <div className="mb-1 flex items-baseline justify-between gap-3">
                            <span className="text-xs font-medium text-slate-600">{s.label}</span>
                            <span className="text-xs font-semibold text-slate-800">
                                {fmt(v)}{i > 0 && <span className="ml-1 font-normal text-slate-400">({pctOfFirst} %)</span>}
                            </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-r" style={{ background: C.track }}>
                            <div className="h-full rounded-r transition-all duration-500"
                                style={{ width: `${Math.max(v / max * 100, 1.5)}%`, background: C.ramp[i] }} />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

/* Liste classée (texte) — difficultés terrain, etc. */
export function RankedList({ items, labelKey, valueKey }) {
    if (!items?.length) return <EmptyNote />;
    return (
        <ol className="divide-y divide-slate-100">
            {items.map((d, i) => (
                <li key={i} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="mt-0.5 flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">{i + 1}</span>
                    <p className="flex-1 text-xs leading-relaxed text-slate-600">{d[labelKey]}</p>
                    <span className="flex-shrink-0 text-xs font-semibold text-slate-800">{fmt(d[valueKey])}</span>
                </li>
            ))}
        </ol>
    );
}
