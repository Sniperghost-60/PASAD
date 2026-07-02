import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, Icon, ICONS, RoleBadge } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import api from '../services/api';

const ROLES = [
    { value:'Conseiller',    label:'Conseiller',    dot:'bg-teal-500',   active:'border-teal-500 bg-teal-50/80 text-teal-800',   desc:'Saisie terrain, suivi CEP' },
    { value:'Superviseur',   label:'Superviseur',   dot:'bg-amber-500',  active:'border-amber-500 bg-amber-50/80 text-amber-800', desc:'Supervision multi-zones'   },
    { value:'Administrateur',label:'Administrateur',dot:'bg-indigo-500', active:'border-indigo-500 bg-indigo-50/80 text-indigo-800',desc:'Gestion complète'        },
    { value:'Super-Admin',   label:'Super‑Admin',   dot:'bg-purple-500', active:'border-purple-500 bg-purple-50/80 text-purple-800',desc:'Contrôle total'          },
];

function Field({ label, hint, error, icon, children }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    {icon && <Icon d={ICONS[icon]} className="size-3.5 text-slate-400" />}
                    {label}
                </label>
                {hint && <span className="text-xs text-slate-400">{hint}</span>}
            </div>
            {children}
            {error && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                    <svg className="size-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
}

const inp = (err) =>
    `w-full rounded-xl border px-4 py-2.5 text-sm bg-white outline-none transition-all placeholder:text-slate-300 ${err
        ? 'border-red-300 ring-2 ring-red-100 focus:border-red-400'
        : 'border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100'}`;

export default function EditUser() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { hasPermission } = useAuth();
    const [user, setUser] = useState(null);
    const [form, setForm] = useState({ name:'', email:'', role:'' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState('');
    const [toast, setToast] = useState({ show:false, message:'', type:'error' });
    const [showReasonModal, setShowReasonModal] = useState({ show:false, action:'', reason:'' });
    const [showConfirmModal, setShowConfirmModal] = useState({ show:false, action:'', message:'' });

    useEffect(() => {
        if (!hasPermission('utilisateurs.modifier')) { navigate('/dashboard/users'); return; }
        api.get(`/api/users/${id}`)
            .then(r => {
                setUser(r.data);
                setForm({ name: r.data.name, email: r.data.email, role: r.data.roles?.[0] || '' });
            })
            .catch(() => {
                setToast({ show:true, message:'Utilisateur introuvable.', type:'error' });
                setTimeout(() => navigate('/dashboard/users'), 1500);
            });
    }, [id, hasPermission, navigate]);

    const set = (k, v) => { setForm(p => ({...p,[k]:v})); setErrors(p => ({...p,[k]:undefined})); };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Le nom complet est requis';
        if (!form.email.trim()) e.email = "L'adresse email est requise";
        if (!form.role) e.role = 'Veuillez sélectionner un rôle';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const submit = async e => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            await api.put(`/api/users/${id}`, form);
            setToast({ show:true, message:'Utilisateur modifié avec succès !', type:'success' });
            setTimeout(() => navigate('/dashboard/users'), 1500);
        } catch (err) {
            const msg = err.response?.data?.message
                || Object.values(err.response?.data?.errors ?? {})?.[0]?.[0]
                || 'Une erreur est survenue.';
            setToast({ show:true, message:msg, type:'error' });
        } finally { setLoading(false); }
    };

    const handleAction = async (action) => {
        if (['block', 'suspend', 'freeze'].includes(action)) {
            setShowReasonModal({ show:true, action, reason:'' });
            return;
        }

        const confirmMessages = {
            reset: 'Réinitialiser le mot de passe ?\n\nUn nouveau mot de passe sera généré et envoyé par email à l\'utilisateur.',
            unblock: 'Débloquer ce compte ?',
            unsuspend: 'Réactiver ce compte ?',
            unfreeze: 'Dégeler ce compte ?'
        };

        setShowConfirmModal({ show:true, action, message: confirmMessages[action] || 'Confirmer cette action ?' });
    };

    const confirmAction = async () => {
        const action = showConfirmModal.action;
        setShowConfirmModal({ show:false, action:'', message:'' });

        setLoadingAction(action);
        try {
            const endpoint = action === 'reset' ? `/api/users/${id}/reset-password` : `/api/users/${id}/${action}`;
            const res = await api.post(endpoint);
            setToast({ show:true, message: res.data.message || 'Action effectuée avec succès !', type:'success' });
            // Recharger les données
            const r = await api.get(`/api/users/${id}`);
            setUser(r.data);
        } catch (err) {
            const msg = err.response?.data?.message || 'Une erreur est survenue.';
            setToast({ show:true, message:msg, type:'error' });
        } finally { setLoadingAction(''); }
    };

    const handleReasonSubmit = async () => {
        const { action, reason } = showReasonModal;
        if (!reason.trim()) {
            setToast({ show:true, message:'Veuillez indiquer une raison.', type:'error' });
            return;
        }

        setLoadingAction(action);
        setShowReasonModal({ show:false, action:'', reason:'' });
        try {
            await api.post(`/api/users/${id}/${action}`, { reason });
            setToast({ show:true, message:'Action effectuée avec succès !', type:'success' });
            const r = await api.get(`/api/users/${id}`);
            setUser(r.data);
        } catch (err) {
            const msg = err.response?.data?.message || 'Une erreur est survenue.';
            setToast({ show:true, message:msg, type:'error' });
        } finally { setLoadingAction(''); }
    };

    if (!user) return (
        <div className="min-h-screen bg-slate-100 font-sans antialiased lg:flex">
            <Sidebar />
            <main className="min-w-0 flex-1 lg:ml-60">
                <Header title="Chargement..." subtitle="Veuillez patienter" />
                <div className="flex items-center justify-center h-96">
                    <svg className="animate-spin size-8 text-teal-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                </div>
            </main>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 font-sans antialiased lg:flex">
            <Sidebar />
            <main className="min-w-0 flex-1 lg:ml-60">
                <Header title="Modifier utilisateur" subtitle={`Édition du profil de ${user.name}`} />

                <div className="px-4 py-6 sm:px-8 max-w-none w-full">
                    <button onClick={() => navigate('/dashboard/users')}
                        className="mb-5 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors group">
                        <Icon d="M15 19l-7-7 7-7" className="size-4 group-hover:-translate-x-0.5 transition-transform" />
                        Retour à la liste des utilisateurs
                    </button>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Colonne gauche : Informations */}
                        <div className="xl:col-span-2 space-y-6">
                            {/* Bloc 1 : Identité */}
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#062824]">
                                        <Icon d={ICONS.users} className="size-4 text-cyan-300" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-extrabold text-slate-800">Informations personnelles</p>
                                        <p className="text-xs text-slate-400">Nom et email</p>
                                    </div>
                                </div>
                                <form onSubmit={submit} className="p-6 space-y-5">
                                    <Field label="Nom complet" error={errors.name} icon="users">
                                        <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                                            placeholder="ex. Jean Dupont" className={inp(errors.name)} />
                                    </Field>
                                    <Field label="Adresse email" error={errors.email} icon="search">
                                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                                            placeholder="jean.dupont@parsad.bj" className={inp(errors.email)} />
                                    </Field>

                                    {/* Rôle */}
                                    <div>
                                        <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-3">
                                            <Icon d={ICONS.shield} className="size-3.5 text-slate-400" />
                                            Rôle & permissions
                                        </label>
                                        {errors.role && (
                                            <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">
                                                <svg className="size-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                {errors.role}
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {ROLES.map(r => (
                                                <label key={r.value} className={`group relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                                                    form.role === r.value ? r.active + ' shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'
                                                }`}>
                                                    <input type="radio" name="role" value={r.value} checked={form.role === r.value}
                                                        onChange={e => set('role', e.target.value)} className="sr-only" />
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-0.5 size-2 rounded-full ${r.dot} ${form.role === r.value ? 'ring-2 ring-offset-2' : ''}`} style={{ ringColor: r.dot.replace('bg-', '#') }} />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold">{r.label}</p>
                                                            <p className={`text-xs mt-0.5 ${form.role === r.value ? 'opacity-90' : 'text-slate-400'}`}>{r.desc}</p>
                                                        </div>
                                                        {form.role === r.value && (
                                                            <svg className="size-5 text-current" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Boutons d'action */}
                                    <div className="flex items-center gap-3 pt-4">
                                        <button type="button" onClick={() => navigate('/dashboard/users')}
                                            className="px-5 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                                            Annuler
                                        </button>
                                        <button type="submit" disabled={loading}
                                            className="flex-1 px-5 py-2.5 rounded-xl bg-teal-600 text-sm font-bold text-white shadow-sm hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                            {loading ? 'Enregistrement...' : '💾 Enregistrer les modifications'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Colonne droite : Actions de gestion */}
                        <div className="space-y-6">
                            {/* Statut du compte */}
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#062824]">
                                        <Icon d={ICONS.shield} className="size-4 text-cyan-300" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-extrabold text-slate-800">Statut du compte</p>
                                        <p className="text-xs text-slate-400">État actuel</p>
                                    </div>
                                </div>
                                <div className="p-6 space-y-3">
                                    {user.is_blocked && (
                                        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
                                            <svg className="size-5 flex-shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                            </svg>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-red-900">Compte bloqué</p>
                                                {user.blocked_reason && <p className="text-xs text-red-700 mt-1">{user.blocked_reason}</p>}
                                            </div>
                                        </div>
                                    )}
                                    {user.is_suspended && (
                                        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                                            <svg className="size-5 flex-shrink-0 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-amber-900">Compte suspendu</p>
                                                {user.suspended_reason && <p className="text-xs text-amber-700 mt-1">{user.suspended_reason}</p>}
                                            </div>
                                        </div>
                                    )}
                                    {user.is_frozen && (
                                        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                                            <svg className="size-5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-blue-900">Compte gelé</p>
                                                {user.frozen_reason && <p className="text-xs text-blue-700 mt-1">{user.frozen_reason}</p>}
                                            </div>
                                        </div>
                                    )}
                                    {!user.is_blocked && !user.is_suspended && !user.is_frozen && (
                                        <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 p-3">
                                            <svg className="size-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <p className="text-xs font-bold text-teal-900">Compte actif</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions de gestion */}
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#062824]">
                                        <Icon d={ICONS.settings} className="size-4 text-cyan-300" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-extrabold text-slate-800">Actions de gestion</p>
                                        <p className="text-xs text-slate-400">Sécurité et contrôle</p>
                                    </div>
                                </div>
                                <div className="p-6 space-y-3">
                                    {/* Reset password */}
                                    <button type="button" onClick={() => handleAction('reset')} disabled={loadingAction === 'reset'}
                                        className="w-full flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-3 text-left hover:border-teal-300 hover:bg-teal-50/50 transition-all disabled:opacity-50">
                                        <svg className="size-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-800">Réinitialiser le mot de passe</p>
                                            <p className="text-xs text-slate-400">Génère et envoie par email</p>
                                        </div>
                                    </button>

                                    {/* Block/Unblock */}
                                    {user.is_blocked ? (
                                        <button type="button" onClick={() => handleAction('unblock')} disabled={loadingAction === 'unblock'}
                                            className="w-full flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-3 text-left hover:border-teal-300 hover:bg-teal-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                            {loadingAction === 'unblock' ? (
                                                <svg className="size-5 text-teal-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                                </svg>
                                            ) : (
                                                <svg className="size-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-slate-800">Débloquer le compte</p>
                                                <p className="text-xs text-slate-400">{loadingAction === 'unblock' ? 'Déblocage...' : 'Restaurer l\'accès'}</p>
                                            </div>
                                        </button>
                                    ) : (
                                        <button type="button" onClick={() => handleAction('block')} disabled={loadingAction === 'block'}
                                            className="w-full flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-3 text-left hover:border-red-300 hover:bg-red-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                            {loadingAction === 'block' ? (
                                                <svg className="size-5 text-red-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                                </svg>
                                            ) : (
                                                <svg className="size-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-slate-800">Bloquer le compte</p>
                                                <p className="text-xs text-slate-400">{loadingAction === 'block' ? 'Blocage...' : 'Interdire toute connexion'}</p>
                                            </div>
                                        </button>
                                    )}

                                    {/* Suspend/Unsuspend */}
                                    {user.is_suspended ? (
                                        <button type="button" onClick={() => handleAction('unsuspend')} disabled={loadingAction === 'unsuspend'}
                                            className="w-full flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-3 text-left hover:border-teal-300 hover:bg-teal-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                            {loadingAction === 'unsuspend' ? (
                                                <svg className="size-5 text-teal-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                                </svg>
                                            ) : (
                                                <svg className="size-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-slate-800">Réactiver le compte</p>
                                                <p className="text-xs text-slate-400">{loadingAction === 'unsuspend' ? 'Réactivation...' : 'Lever la suspension'}</p>
                                            </div>
                                        </button>
                                    ) : (
                                        <button type="button" onClick={() => handleAction('suspend')} disabled={loadingAction === 'suspend'}
                                            className="w-full flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-3 text-left hover:border-amber-300 hover:bg-amber-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                            {loadingAction === 'suspend' ? (
                                                <svg className="size-5 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                                </svg>
                                            ) : (
                                                <svg className="size-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-slate-800">Suspendre le compte</p>
                                                <p className="text-xs text-slate-400">{loadingAction === 'suspend' ? 'Suspension...' : 'Suspension temporaire'}</p>
                                            </div>
                                        </button>
                                    )}

                                    {/* Freeze/Unfreeze */}
                                    {user.is_frozen ? (
                                        <button type="button" onClick={() => handleAction('unfreeze')} disabled={loadingAction === 'unfreeze'}
                                            className="w-full flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-3 text-left hover:border-teal-300 hover:bg-teal-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                            {loadingAction === 'unfreeze' ? (
                                                <svg className="size-5 text-teal-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                                </svg>
                                            ) : (
                                                <svg className="size-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-slate-800">Dégeler le compte</p>
                                                <p className="text-xs text-slate-400">{loadingAction === 'unfreeze' ? 'Dégel...' : 'Lever le gel'}</p>
                                            </div>
                                        </button>
                                    ) : (
                                        <button type="button" onClick={() => handleAction('freeze')} disabled={loadingAction === 'freeze'}
                                            className="w-full flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-3 text-left hover:border-blue-300 hover:bg-blue-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                            {loadingAction === 'freeze' ? (
                                                <svg className="size-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                                </svg>
                                            ) : (
                                                <svg className="size-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-slate-800">Geler le compte</p>
                                                <p className="text-xs text-slate-400">{loadingAction === 'freeze' ? 'Gel...' : 'Gel administratif'}</p>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <ModernNotification show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({...toast, show:false})} />

                {/* Modal de confirmation */}
                {showConfirmModal.show && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-md mx-4">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600">
                                    <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">Confirmation</h3>
                                    <p className="text-sm text-slate-600 whitespace-pre-line">{showConfirmModal.message}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={() => setShowConfirmModal({ show:false, action:'', message:'' })}
                                    className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                                    Annuler
                                </button>
                                <button type="button" onClick={confirmAction}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 text-sm font-bold text-white shadow-sm hover:bg-teal-700 transition-all">
                                    Confirmer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal pour demander la raison */}
                {showReasonModal.show && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-extrabold text-slate-800 mb-4">
                                {showReasonModal.action === 'block' ? 'Bloquer le compte' : showReasonModal.action === 'suspend' ? 'Suspendre le compte' : 'Geler le compte'}
                            </h3>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Raison :</label>
                            <textarea value={showReasonModal.reason}
                                onChange={e => setShowReasonModal(p => ({...p, reason: e.target.value}))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                                rows={3}
                                placeholder="Indiquez la raison de cette action..."
                            />
                            <div className="flex items-center gap-3 mt-4">
                                <button type="button" onClick={() => setShowReasonModal({ show:false, action:'', reason:'' })}
                                    className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                                    Annuler
                                </button>
                                <button type="button" onClick={handleReasonSubmit}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 text-sm font-bold text-white shadow-sm hover:bg-teal-700 transition-all">
                                    Confirmer
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
