import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, RoleBadge, Icon, ICONS } from '../components/Layout';
import Toast from '../components/Toast';
import api from '../services/api';

const ROLE_S = {
    'Super-Admin':    { dot:'bg-purple-500', border:'border-purple-300', bg:'bg-purple-50', text:'text-purple-700', btn:'bg-purple-600' },
    'Administrateur': { dot:'bg-indigo-500', border:'border-indigo-300', bg:'bg-indigo-50', text:'text-indigo-700', btn:'bg-indigo-600' },
    'Superviseur':    { dot:'bg-amber-500',  border:'border-amber-300',  bg:'bg-amber-50',  text:'text-amber-700',  btn:'bg-amber-600'  },
    'Conseiller':     { dot:'bg-teal-500',   border:'border-teal-300',   bg:'bg-teal-50',   text:'text-teal-700',   btn:'bg-teal-600'   },
};

const PERM_GROUPS = [
    { label:'Producteurs',    f: p => p.startsWith('producteurs.') },
    { label:'Parcelles',      f: p => p.startsWith('parcelles.')   },
    { label:'Suivis CEP',     f: p => p.startsWith('suivis.')      },
    { label:'Rapports',       f: p => p.startsWith('rapports.')    },
    { label:'Caisse & Stock', f: p => p.startsWith('caisse.')      },
    { label:'Utilisateurs',   f: p => p.startsWith('utilisateurs.')},
    { label:'Rôles',          f: p => p.startsWith('roles.')       },
    { label:'Configuration',  f: p => p.startsWith('config.')      },
];

const LABELS = { voir:'Consulter', créer:'Créer', modifier:'Modifier', supprimer:'Supprimer', générer:'Générer', exporter:'Exporter', gérer:'Gérer' };
const pl = p => LABELS[p.split('.')[1]] ?? p.split('.')[1];

function IC({ checked, indeterminate, onChange }) {
    const ref = useRef(null);
    useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
    return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} className="size-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer" />;
}

export default function RolesManagement() {
    const navigate = useNavigate();
    const { hasRole } = useAuth();
    const [roles, setRoles]       = useState([]);
    const [allPerms, setAllPerms] = useState([]);
    const [sel, setSel]           = useState(null);
    const [edit, setEdit]         = useState([]);
    const [saving, setSaving]     = useState(false);
    const [loading, setLoading]   = useState(true);
    const [toast, setToast]       = useState({ show:false, message:'', type:'error' });

    useEffect(() => {
        if (!hasRole('Super-Admin')) { navigate('/dashboard'); return; }
        Promise.all([api.get('/api/roles'), api.get('/api/permissions')])
            .then(([rr, pr]) => { setRoles(Array.isArray(rr.data) ? rr.data : []); setAllPerms(Array.isArray(pr.data) ? pr.data : []); })
            .catch(() => setToast({ show:true, message:'Erreur de chargement.', type:'error' }))
            .finally(() => setLoading(false));
    }, [hasRole, navigate]);

    const open = r => { setSel(r); setEdit([...r.permissions]); };
    const tog  = p => setEdit(e => e.includes(p) ? e.filter(x => x !== p) : [...e, p]);

    const save = async () => {
        setSaving(true);
        try {
            await api.put('/api/roles/'+sel.id+'/permissions', { permissions: edit });
            setRoles(prev => prev.map(r => r.id === sel.id ? {...r, permissions: edit} : r));
            setSel(prev => ({...prev, permissions: edit}));
            setToast({ show:true, message:'Permissions mises à jour.', type:'success' });
        } catch { setToast({ show:true, message:'Erreur lors de la sauvegarde.', type:'error' }); }
        finally { setSaving(false); }
    };

    const s = sel ? (ROLE_S[sel.name] ?? ROLE_S.Conseiller) : null;

    return (
        <div className="min-h-screen bg-slate-100 font-sans antialiased lg:flex">
            <Sidebar />
            <main className="min-w-0 flex-1 lg:ml-60">
                <Header title="Rôles & Permissions" subtitle="Configurer les droits par rôle" />
                <div className="px-4 py-6 sm:px-6">
                    <section className="mb-6">
                        <h2 className="text-3xl font-extrabold text-slate-900">Gestion des rôles</h2>
                        <p className="mt-1 text-sm text-slate-500">Sélectionnez un rôle pour modifier ses permissions.</p>
                    </section>

                    {loading ? (
                        <div className="flex items-center justify-center py-32">
                            <div className="size-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
                        </div>
                    ) : (
                        <div className="flex gap-6 items-start">

                            {/* Liste rôles */}
                            <div className="w-72 flex-shrink-0 space-y-2">
                                {roles.map(role => {
                                    const rs = ROLE_S[role.name] ?? { dot:'bg-slate-400', border:'border-slate-200', bg:'bg-slate-50', text:'text-slate-600' };
                                    const active = sel?.id === role.id;
                                    return (
                                        <button key={role.id} onClick={() => open(role)}
                                            className={"w-full text-left rounded-2xl border-2 p-4 transition-all " + (active ? rs.bg + " " + rs.border + " shadow-sm" : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm")}>
                                            <div className="flex items-center gap-2.5 mb-2">
                                                <span className={"size-3 rounded-full flex-shrink-0 " + rs.dot} />
                                                <span className={"font-bold text-sm " + (active ? rs.text : 'text-slate-800')}>{role.name}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400">{role.permissions.length} permissions</span>
                                                <span className="text-slate-500 font-semibold">{role.users_count} user{role.users_count !== 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={"h-full rounded-full transition-all " + rs.dot}
                                                    style={{width: allPerms.length ? (role.permissions.length/allPerms.length*100)+'%' : '0'}} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Éditeur */}
                            <div className="flex-1 min-w-0">
                                {!sel ? (
                                    <div className="flex flex-col items-center justify-center h-64 rounded-2xl border border-slate-200 bg-white">
                                        <Icon d={ICONS.shield} className="size-12 text-slate-300 mb-3" />
                                        <p className="font-semibold text-slate-500">Sélectionnez un rôle</p>
                                        <p className="text-sm text-slate-400 mt-1">pour modifier ses permissions</p>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                        <div className={"flex items-center justify-between px-6 py-4 border-b border-slate-100 " + s.bg}>
                                            <div className="flex items-center gap-3">
                                                <span className={"size-3 rounded-full " + s.dot} />
                                                <span className={"font-extrabold text-base " + s.text}>{sel.name}</span>
                                                <span className={"text-xs font-semibold px-2.5 py-1 rounded-full bg-white/70 " + s.text}>{edit.length}/{allPerms.length} permissions</span>
                                            </div>
                                            <button onClick={save} disabled={saving}
                                                className={"inline-flex items-center gap-2 rounded-xl px-5 py-2 text-white text-sm font-bold active:scale-95 transition disabled:opacity-50 shadow-sm " + s.btn}>
                                                {saving ? (<><svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Sauvegarde...</>) : '✓ Enregistrer'}
                                            </button>
                                        </div>

                                        <div className="p-6 space-y-4">
                                            {PERM_GROUPS.map(({ label, f }) => {
                                                const gp = allPerms.filter(f);
                                                if (!gp.length) return null;
                                                const all  = gp.every(p => edit.includes(p));
                                                const some = gp.some(p => edit.includes(p));
                                                return (
                                                    <div key={label} className="rounded-xl border border-slate-100 overflow-hidden">
                                                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                                                            <IC checked={all} indeterminate={some && !all}
                                                                onChange={() => {
                                                                    if (all) setEdit(e => e.filter(x => !f(x)));
                                                                    else setEdit(e => [...new Set([...e, ...gp])]);
                                                                }} />
                                                            <span className="text-sm font-bold text-slate-700">{label}</span>
                                                            <span className="ml-auto text-xs text-slate-400">{gp.filter(p => edit.includes(p)).length}/{gp.length}</span>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-px bg-slate-100">
                                                            {gp.map(perm => (
                                                                <label key={perm} className={"flex items-center gap-2.5 px-4 py-3 cursor-pointer transition-colors " + (edit.includes(perm) ? 'bg-teal-50' : 'bg-white hover:bg-slate-50')}>
                                                                    <input type="checkbox" checked={edit.includes(perm)} onChange={() => tog(perm)}
                                                                        className="size-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer" />
                                                                    <span className={"text-sm font-medium " + (edit.includes(perm) ? 'text-teal-700' : 'text-slate-600')}>{pl(perm)}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Toast show={toast.show} message={toast.message} type={toast.type}
                title={toast.type === 'error' ? 'Erreur' : 'Succès'}
                onClose={() => setToast({ ...toast, show:false })} />
        </div>
    );
}
