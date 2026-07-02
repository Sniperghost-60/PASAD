import { useNavigate } from 'react-router-dom';
import { Sidebar, Header, Icon, ICONS } from '../components/Layout';

const COLORS = {
    users:    { from:'#0D9488', to:'#14B8A6' },
    parcelles:{ from:'#6366F1', to:'#818CF8' },
    suivis:   { from:'#F59E0B', to:'#FCD34D' },
    rapports: { from:'#EF4444', to:'#F87171' },
    caisse:   { from:'#8B5CF6', to:'#A78BFA' },
    cultures: { from:'#14B8A6', to:'#2DD4BF' },
    stats:    { from:'#3B82F6', to:'#60A5FA' },
    shield:   { from:'#EC4899', to:'#F472B6' },
    settings: { from:'#64748B', to:'#94A3B8' },
};

export default function ComingSoon({ title, description, icon = 'settings' }) {
    const navigate = useNavigate();
    const { from, to } = COLORS[icon] ?? COLORS.settings;

    return (
        <div className="min-h-screen bg-slate-100 font-sans antialiased lg:flex">
            <Sidebar />
            <main className="min-w-0 flex-1 lg:ml-60">
                <Header title={title} />
                <div className="flex items-center justify-center min-h-[calc(100vh-56px)] px-6">
                    <div className="text-center max-w-md">
                        <div className="mx-auto mb-8 size-28 rounded-3xl flex items-center justify-center shadow-xl ring-8 ring-white"
                            style={{background: "linear-gradient(135deg," + from + "," + to + ")"}}>
                            <Icon d={ICONS[icon]} className="size-14 text-white" />
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 mb-4">
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            En développement
                        </span>
                        <h2 className="text-2xl font-extrabold text-slate-900 mb-3">{title}</h2>
                        <p className="text-slate-500 text-sm leading-relaxed mb-8">
                            {description || "Ce module est en cours de développement. Il sera disponible dans une prochaine version de la plateforme PARSAD."}
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <button onClick={() => navigate(-1)}
                                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm">
                                ← Retour
                            </button>
                            <button onClick={() => navigate("/dashboard")}
                                className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white hover:bg-teal-700 active:scale-95 transition shadow-sm shadow-teal-200">
                                <Icon d={ICONS.dashboard} className="size-4" />
                                Tableau de bord
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
