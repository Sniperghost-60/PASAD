import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function CommuneSelection() {
    const navigate = useNavigate();
    const { user, conseillerCommunes, setActiveCommune, logout } = useAuth();

    const handleSelect = (commune) => {
        setActiveCommune(commune);
        navigate('/dashboard', { replace: true });
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const colors = [
        { from: 'from-teal-500', to: 'to-emerald-600', light: 'bg-teal-50', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-700', hover: 'hover:border-teal-400 hover:shadow-teal-100' },
        { from: 'from-cyan-500', to: 'to-teal-600', light: 'bg-cyan-50', border: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-700', hover: 'hover:border-cyan-400 hover:shadow-cyan-100' },
        { from: 'from-emerald-500', to: 'to-green-600', light: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', hover: 'hover:border-emerald-400 hover:shadow-emerald-100' },
        { from: 'from-teal-600', to: 'to-cyan-500', light: 'bg-teal-50', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-700', hover: 'hover:border-teal-400 hover:shadow-teal-100' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#062824] to-teal-900 flex flex-col overflow-hidden relative">

            {/* Cercles décoratifs fond */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 size-96 rounded-full bg-teal-500/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 size-96 rounded-full bg-cyan-500/10 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-teal-900/20 blur-3xl" />
            </div>

            {/* Grille motif subtil */}
            <div className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-8 py-5">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-400 shadow-lg shadow-amber-900/30">
                        <svg className="size-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                    </div>
                    <div>
                        <p className="text-white font-extrabold text-base leading-tight tracking-tight">PASAD</p>
                        <p className="text-teal-300/60 text-[11px] leading-tight">AgriSuivi CEP</p>
                    </div>
                </div>

                <button onClick={handleLogout}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white backdrop-blur transition-all">
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Se déconnecter
                </button>
            </header>

            {/* Corps principal */}
            <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-8">

                {/* Icône centrale */}
                <div className="mb-8 relative">
                    <div className="flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-2xl shadow-teal-900/50">
                        <svg className="size-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                    </div>
                    {/* Anneaux décoratifs */}
                    <div className="absolute inset-0 rounded-3xl border-2 border-teal-400/20 scale-110 animate-pulse" />
                    <div className="absolute inset-0 rounded-3xl border border-teal-400/10 scale-125" />
                </div>

                {/* Texte */}
                <div className="mb-2 text-center">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-3">
                        Choisissez votre commune
                    </h1>
                    <p className="text-slate-300 text-sm">
                        Bonjour <span className="font-bold text-teal-300">{user?.name}</span> 👋 — vous intervenez dans <span className="font-bold text-white">{conseillerCommunes.length} communes</span>.
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                        Sélectionnez la commune pour cette session. Vous pourrez changer à tout moment.
                    </p>
                </div>

                {/* Séparateur */}
                <div className="flex items-center gap-3 w-full max-w-xl my-6">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">Communes disponibles</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Grille de communes */}
                <div className={`grid gap-4 w-full max-w-3xl ${
                    conseillerCommunes.length === 1 ? 'grid-cols-1 max-w-xs' :
                    conseillerCommunes.length === 2 ? 'grid-cols-2 max-w-lg' :
                    conseillerCommunes.length <= 4 ? 'grid-cols-2 sm:grid-cols-2' :
                    'grid-cols-2 sm:grid-cols-3'
                }`}>
                    {conseillerCommunes.map((c, i) => {
                        const color = colors[i % colors.length];
                        return (
                            <button key={c.id} type="button" onClick={() => handleSelect(c)}
                                className={`group relative flex flex-col rounded-2xl border bg-white/95 backdrop-blur p-5 text-left shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl ${color.hover} ${color.border}`}>

                                {/* Accent haut */}
                                <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r ${color.from} ${color.to}`} />

                                {/* Icône */}
                                <div className={`flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${color.from} ${color.to} mb-4 shadow-md`}>
                                    <svg className="size-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                    </svg>
                                </div>

                                {/* Nom */}
                                <p className="text-base font-extrabold text-slate-800 leading-tight group-hover:text-teal-800 transition-colors mb-1">{c.nom}</p>
                                <p className="text-xs text-slate-400 mb-4">{c.departement?.nom}</p>

                                {/* Footer */}
                                <div className="flex items-center justify-between mt-auto">
                                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${color.badge}`}>
                                        <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h12" />
                                        </svg>
                                        {c.arrondissements_count} arrond.
                                    </span>
                                    <div className={`flex size-7 items-center justify-center rounded-lg bg-gradient-to-br ${color.from} ${color.to} shadow opacity-0 group-hover:opacity-100 transition-opacity`}>
                                        <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Note bas */}
                <p className="mt-8 text-center text-xs text-white/25">
                    La commune sélectionnée sera mémorisée pour vos prochaines connexions
                </p>
            </main>
        </div>
    );
}
