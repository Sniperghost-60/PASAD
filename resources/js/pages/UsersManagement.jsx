import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, RoleBadge, Icon, ICONS } from '../components/Layout';
import Toast from '../components/Toast';
import api from '../services/api';

const AVATAR = [
    ['#0D9488','#5EEAD4'],['#6366F1','#A5B4FC'],['#F59E0B','#FDE68A'],
    ['#EF4444','#FCA5A5'],['#8B5CF6','#C4B5FD'],['#EC4899','#F9A8D4'],
    ['#14B8A6','#99F6E4'],['#3B82F6','#93C5FD'],
];
const av = name => AVATAR[(name?.charCodeAt(0) ?? 0) % AVATAR.length];

function SkeletonRow() {
    return (
        <tr>
            {[1,2,3,4,5].map(i => (
                <td key={i} className="px-5 py-4">
                    <div className="h-3.5 rounded-full bg-slate-100 animate-pulse" style={{width: i===1?'140px':i===2?'180px':i===3?'80px':i===4?'90px':'60px'}} />
                </td>
            ))}
        </tr>
    );
}

export default function UsersManagement() {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [users, setUsers]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [toast, setToast]   = useState({ show:false, message:'', type:'error' });

    useEffect(() => {
        if (!hasPermission('utilisateurs.voir')) { navigate('/dashboard'); return; }
        api.get('/api/users')
            .then(r => setUsers(Array.isArray(r.data) ? r.data : []))
            .catch(() => { setUsers([]); setToast({ show:true, message:'Erreur de chargement.', type:'error' }); })
            .finally(() => setLoading(false));
    }, [hasPermission, navigate]);

    const filtered = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-100 font-sans antialiased lg:flex">
            <Sidebar />
            <main className="min-w-0 flex-1 lg:ml-60">
                <Header title="Utilisateurs" subtitle="Gestion des comptes et rôles" />
                <div className="space-y-6 px-4 py-6 sm:px-6">

                    {/* En-tête */}
                    <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900">Comptes utilisateurs</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {loading ? '…' : `${users.length} utilisateur${users.length !== 1 ? 's' : ''} enregistré${users.length !== 1 ? 's' : ''}`}
                            </p>
                        </div>
                        {hasPermission('utilisateurs.créer') && (
                            <button onClick={() => navigate('/dashboard/users/create')}
                                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700 active:scale-95 transition-all">
                                <Icon d={ICONS.plus} className="size-4" />
                                Nouveau compte
                            </button>
                        )}
                    </section>

                    {/* Barre recherche */}
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="relative flex-1 max-w-xs">
                            <Icon d={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Nom, email…"
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition" />
                        </div>
                        {search && (
                            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 ring-1 ring-teal-100">
                                {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {/* Tableau */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-[#062824] text-left text-xs font-semibold uppercase tracking-wide text-white">
                                    <tr>
                                        <th className="px-5 py-3.5">Utilisateur</th>
                                        <th className="px-5 py-3.5">Email</th>
                                        <th className="px-5 py-3.5">Rôle</th>
                                        <th className="px-5 py-3.5">Créé le</th>
                                        <th className="px-5 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        [1,2,3,4].map(i => <SkeletonRow key={i} />)
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-14 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                                                        <Icon d={ICONS.users} className="size-7 text-slate-400" />
                                                    </div>
                                                    <p className="font-semibold text-slate-600">{search ? "Aucun résultat" : "Aucun utilisateur"}</p>
                                                    <p className="text-sm text-slate-400">{search ? "Essayez un autre terme de recherche" : "Commencez par créer un compte."}</p>
                                                    {!search && hasPermission("utilisateurs.créer") && (
                                                        <button onClick={() => navigate("/dashboard/users/create")}
                                                            className="mt-1 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 transition">
                                                            Créer un utilisateur
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filtered.map((u, i) => {
                                        const [c1, c2] = av(u.name);
                                        return (
                                            <tr key={u.id} className={"transition-colors hover:bg-teal-50/40 " + (i % 2 !== 0 ? "bg-slate-50/60" : "bg-white")}>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-extrabold shadow-sm"
                                                            style={{background: "linear-gradient(135deg," + c1 + "," + c2 + ")"}}>
                                                            {u.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-800 leading-tight">{u.name}</p>
                                                            <p className="text-xs text-slate-400">#{u.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-slate-600">{u.email}</td>
                                                <td className="px-5 py-3.5"><RoleBadge roles={u.roles} /></td>
                                                <td className="px-5 py-3.5 text-slate-500 text-xs">
                                                    {new Date(u.created_at).toLocaleDateString("fr-FR", {day:"2-digit",month:"short",year:"numeric"})}
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    {hasPermission("utilisateurs.modifier") && (
                                                        <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                                                            <Icon d={ICONS.edit} className="size-3.5" />
                                                            Modifier
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
            <Toast show={toast.show} message={toast.message} type={toast.type}
                title={toast.type === "error" ? "Erreur" : "Succès"}
                onClose={() => setToast({ ...toast, show:false })} />
        </div>
    );
}
