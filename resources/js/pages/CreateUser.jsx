import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header, Icon, ICONS } from '../components/Layout';
import Toast from '../components/Toast';
import api from '../services/api';

/* ── Config rôles ─────────────────────────────────────────────────── */
const ROLES = [
    { value:'Conseiller',    label:'Conseiller',    dot:'bg-teal-500',   active:'border-teal-500 bg-teal-50/80 text-teal-800',   desc:'Saisie terrain, suivi CEP' },
    { value:'Superviseur',   label:'Superviseur',   dot:'bg-amber-500',  active:'border-amber-500 bg-amber-50/80 text-amber-800', desc:'Supervision multi-zones'   },
    { value:'Administrateur',label:'Administrateur',dot:'bg-indigo-500', active:'border-indigo-500 bg-indigo-50/80 text-indigo-800',desc:'Gestion complète'        },
    { value:'Super-Admin',   label:'Super‑Admin',   dot:'bg-purple-500', active:'border-purple-500 bg-purple-50/80 text-purple-800',desc:'Contrôle total'          },
];

/* ── Composant champ de formulaire ────────────────────────────────── */
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

/* ── Section titre ────────────────────────────────────────────────── */
function SectionTitle({ step, title, subtitle }) {
    return (
        <div className="flex items-start gap-3 mb-5">
            <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-[#062824] text-white text-xs font-extrabold mt-0.5">
                {step}
            </span>
            <div>
                <p className="text-sm font-extrabold text-slate-800">{title}</p>
                {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

/* ── Ligne commune + arrondissements ──────────────────────────────── */
function CommuneRow({ commune, checked, arrondissements, loadingArr, selArr, onToggleCommune, onToggleArr }) {
    const comArr = arrondissements ?? [];
    const checkedCount = comArr.filter(a => selArr.includes(a.id)).length;

    return (
        <div className={`rounded-xl overflow-hidden border-2 transition-all ${checked ? 'border-teal-400 shadow-sm' : 'border-transparent'}`}>
            {/* Commune */}
            <label className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${checked ? 'bg-teal-50' : 'bg-slate-50 hover:bg-white'}`}>
                <div className={`flex size-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                    checked ? 'border-teal-500 bg-teal-500' : 'border-slate-300 bg-white'
                }`}>
                    {checked && (
                        <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
                <input type="checkbox" className="sr-only" checked={checked} onChange={() => onToggleCommune(commune.id)} />
                <span className={`flex-1 text-sm font-semibold ${checked ? 'text-teal-800' : 'text-slate-700'}`}>
                    {commune.nom}
                </span>
                {checked && comArr.length > 0 && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        checkedCount === comArr.length
                            ? 'bg-teal-600 text-white'
                            : checkedCount > 0
                                ? 'bg-teal-100 text-teal-700'
                                : 'bg-slate-200 text-slate-500'
                    }`}>
                        {checkedCount}/{comArr.length}
                    </span>
                )}
            </label>

            {/* Arrondissements */}
            {checked && (
                <div className="bg-white border-t border-teal-100 px-4 py-3">
                    {loadingArr ? (
                        <div className="flex items-center gap-2 py-1">
                            <svg className="animate-spin size-4 text-teal-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                            <span className="text-xs text-slate-400">Chargement des arrondissements…</span>
                        </div>
                    ) : comArr.length === 0 ? (
                        <p className="text-xs text-slate-400 py-1">Aucun arrondissement répertorié</p>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Arrondissements</span>
                                <button type="button" onClick={() => {
                                    const ids = comArr.map(a => a.id);
                                    const all = ids.every(id => selArr.includes(id));
                                    onToggleArr(ids, !all);
                                }} className="text-xs font-semibold text-teal-600 hover:text-teal-800 transition-colors">
                                    {comArr.every(a => selArr.includes(a.id)) ? 'Tout désélectionner' : 'Tout sélectionner'}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                {comArr.map(arr => {
                                    const on = selArr.includes(arr.id);
                                    return (
                                        <label key={arr.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-xs font-medium transition-all border ${
                                            on ? 'border-teal-300 bg-teal-50 text-teal-800' : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-white hover:border-slate-300'
                                        }`}>
                                            <div className={`size-3.5 rounded flex-shrink-0 flex items-center justify-center border ${on ? 'bg-teal-500 border-teal-500' : 'bg-white border-slate-300'}`}>
                                                {on && <svg className="size-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            <input type="checkbox" className="sr-only" checked={on} onChange={() => onToggleArr([arr.id], !on)} />
                                            {arr.nom}
                                        </label>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Page principale ──────────────────────────────────────────────── */
export default function CreateUser() {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    useEffect(() => { if (!hasPermission('utilisateurs.créer')) navigate('/dashboard'); }, [hasPermission, navigate]);

    const [form, setForm]         = useState({ name:'', email:'', password:'', confirm:'', role:'' });
    const [errors, setErrors]     = useState({});
    const [deps, setDeps]         = useState([]);
    const [selDep, setSelDep]     = useState('');
    const [communes, setCommunes] = useState([]);
    const [selCom, setSelCom]     = useState([]);
    const [arrByCommune, setArrByCommune] = useState({});
    const [selArr, setSelArr]     = useState([]);
    const [loading, setLoading]   = useState(false);
    const [loadingArr, setLoadingArr] = useState({});
    const [toast, setToast]       = useState({ show:false, message:'', type:'error' });

    useEffect(() => {
        api.get('/api/departements')
            .then(r => setDeps(Array.isArray(r.data) ? r.data : []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (selDep) {
            api.get('/api/departements/' + selDep + '/communes')
                .then(r => { setCommunes(Array.isArray(r.data) ? r.data : []); setSelCom([]); setArrByCommune({}); setSelArr([]); })
                .catch(() => {});
        } else {
            setCommunes([]); setSelCom([]); setArrByCommune({}); setSelArr([]);
        }
    }, [selDep]);

    useEffect(() => {
        if (form.role !== 'Conseiller') { setSelDep(''); setCommunes([]); setSelCom([]); setArrByCommune({}); setSelArr([]); }
    }, [form.role]);

    const handleToggleCommune = async (communeId) => {
        const isChecked = !selCom.includes(communeId);
        setSelCom(p => isChecked ? [...p, communeId] : p.filter(id => id !== communeId));
        if (isChecked && !arrByCommune[communeId]) {
            setLoadingArr(p => ({ ...p, [communeId]: true }));
            try {
                const r = await api.get('/api/communes/' + communeId + '/arrondissements');
                setArrByCommune(p => ({ ...p, [communeId]: Array.isArray(r.data) ? r.data : [] }));
            } catch {}
            finally { setLoadingArr(p => ({ ...p, [communeId]: false })); }
        }
        if (!isChecked) {
            const toRemove = (arrByCommune[communeId] ?? []).map(a => a.id);
            setSelArr(p => p.filter(id => !toRemove.includes(id)));
        }
    };

    const handleToggleArr = (ids, add) => {
        setSelArr(p => add ? [...new Set([...p, ...ids])] : p.filter(id => !ids.includes(id)));
    };

    const set = (k, v) => { setForm(p => ({...p,[k]:v})); setErrors(p => ({...p,[k]:undefined})); };

    const validate = () => {
        const e = {};
        if (!form.name.trim())  e.name    = 'Le nom complet est requis';
        if (!form.email.trim()) e.email   = "L'adresse email est requise";
        if (form.password.length < 8) e.password = 'Minimum 8 caractères requis';
        if (form.password !== form.confirm) e.confirm = 'Les mots de passe ne correspondent pas';
        if (!form.role) e.role = 'Veuillez sélectionner un rôle';
        if (form.role === 'Conseiller' && selCom.length === 0) e.communes = 'Sélectionnez au moins une commune';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const submit = async e => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const payload = { name:form.name, email:form.email, password:form.password, role:form.role };
            if (form.role === 'Conseiller') {
                payload.commune_ids = selCom;
                payload.arrondissement_ids = selArr;
            }
            await api.post('/api/users', payload);
            setToast({ show:true, message:'Compte créé avec succès !', type:'success' });
            setTimeout(() => navigate('/dashboard/users'), 1500);
        } catch (err) {
            const msg = err.response?.data?.message
                || Object.values(err.response?.data?.errors ?? {})?.[0]?.[0]
                || 'Une erreur est survenue lors de la création.';
            setToast({ show:true, message:msg, type:'error' });
        } finally { setLoading(false); }
    };

    const totalSelArr = selArr.length;
    const isConseiller = form.role === 'Conseiller';

    return (
        <div className="min-h-screen bg-slate-100 font-sans antialiased lg:flex">
            <Sidebar />
            <main className="min-w-0 flex-1 lg:ml-60">
                <Header title="Nouvel utilisateur" subtitle="Ajout d'un compte à la plateforme" />

                <div className="px-4 py-6 sm:px-8 max-w-none w-full">

                    {/* Fil d'ariane */}
                    <button onClick={() => navigate('/dashboard/users')}
                        className="mb-5 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors group">
                        <Icon d="M15 19l-7-7 7-7" className="size-4 group-hover:-translate-x-0.5 transition-transform" />
                        Retour à la liste des utilisateurs
                    </button>

                    {/* Titre */}
                    <div className="mb-7">
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Créer un utilisateur</h2>
                        <p className="mt-1 text-sm text-slate-500">Remplissez les informations ci-dessous pour ajouter un nouveau membre à l'équipe.</p>
                    </div>

                    <form onSubmit={submit} className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

                        {/* ── Colonne gauche : identité + rôle ── */}
                        <div className={isConseiller ? 'space-y-6' : 'xl:col-span-2 space-y-6'}>

                        {/* ══ BLOC 1 — Identité ══════════════════════════════════════════ */}
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-[#062824]">
                                    <Icon d={ICONS.users} className="size-4 text-cyan-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-extrabold text-slate-800">Informations personnelles</p>
                                    <p className="text-xs text-slate-400">Nom, email et accès sécurisé</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-5">
                                <Field label="Nom complet" error={errors.name} icon="users">
                                    <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                                        placeholder="ex. Jean Dupont" className={inp(errors.name)} autoComplete="name" />
                                </Field>
                                <Field label="Adresse email" error={errors.email} icon="search">
                                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                                        placeholder="jean.dupont@pasad.bj" className={inp(errors.email)} autoComplete="email" />
                                </Field>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <Field label="Mot de passe" hint="min. 8 car." error={errors.password}>
                                        <div className="relative">
                                            <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                                                placeholder="••••••••" className={inp(errors.password)} autoComplete="new-password" />
                                            {form.password.length >= 8 && (
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <svg className="size-4 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </span>
                                            )}
                                        </div>
                                    </Field>
                                    <Field label="Confirmer le mot de passe" error={errors.confirm}>
                                        <div className="relative">
                                            <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)}
                                                placeholder="••••••••" className={inp(errors.confirm)} autoComplete="new-password" />
                                            {form.confirm && form.confirm === form.password && (
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <svg className="size-4 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </span>
                                            )}
                                        </div>
                                    </Field>
                                </div>
                                {/* Indicateur force mot de passe */}
                                {form.password.length > 0 && (
                                    <div>
                                        <div className="flex gap-1 mb-1">
                                            {[1,2,3,4].map(i => (
                                                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                                                    form.password.length >= i*3
                                                        ? i <= 1 ? 'bg-red-400' : i === 2 ? 'bg-amber-400' : i === 3 ? 'bg-teal-400' : 'bg-teal-600'
                                                        : 'bg-slate-200'
                                                }`} />
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            {form.password.length < 4 ? 'Très faible' : form.password.length < 7 ? 'Faible' : form.password.length < 10 ? 'Moyen' : 'Fort'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ══ BLOC 2 — Rôle ══════════════════════════════════════════════ */}
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-[#062824]">
                                    <Icon d={ICONS.shield} className="size-4 text-cyan-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-extrabold text-slate-800">Rôle & permissions</p>
                                    <p className="text-xs text-slate-400">Définit les accès de l'utilisateur</p>
                                </div>
                            </div>
                            <div className="p-6">
                                {errors.role && (
                                    <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">
                                        <svg className="size-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                        {errors.role}
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    {ROLES.map(r => (
                                        <button type="button" key={r.value} onClick={() => set('role', r.value)}
                                            className={`group relative flex flex-col items-start gap-1.5 rounded-xl border-2 px-4 py-3.5 text-left transition-all ${
                                                form.role === r.value ? r.active + ' shadow-sm' : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
                                            }`}>
                                            <div className="flex w-full items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={`size-2.5 rounded-full flex-shrink-0 ${r.dot}`} />
                                                    <span className={`text-sm font-bold ${form.role === r.value ? '' : 'text-slate-800'}`}>{r.label}</span>
                                                </div>
                                                {form.role === r.value && (
                                                    <svg className="size-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            <p className={`text-xs ${form.role === r.value ? 'opacity-70' : 'text-slate-400'}`}>{r.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        </div> {/* fin colonne gauche */}

                        {/* ══ BLOC 3 — Affectation géographique (Conseiller) ════════════ */}
                        {isConseiller && (
                            <div className="rounded-2xl border-2 border-teal-300 bg-white shadow-sm overflow-hidden">
                                {/* En-tête style gest-stock */}
                                <div className="bg-[#062824] px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 items-center justify-center rounded-lg bg-teal-500/20">
                                                <Icon d={ICONS.map} className="size-4 text-cyan-300" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-extrabold text-white">Affectation géographique</p>
                                                <p className="text-xs text-cyan-300/70">Département → Communes → Arrondissements</p>
                                            </div>
                                        </div>
                                        {selCom.length > 0 && (
                                            <div className="text-right">
                                                <div className="flex items-center gap-2">
                                                    <span className="rounded-full bg-teal-500/20 px-2.5 py-1 text-xs font-bold text-teal-300">
                                                        {selCom.length} commune{selCom.length > 1 ? 's' : ''}
                                                    </span>
                                                    {totalSelArr > 0 && (
                                                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-white">
                                                            {totalSelArr} arr.
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">

                                    {/* Étape 1 — Département */}
                                    <div>
                                        <SectionTitle step="1" title="Département" subtitle="Choisissez le département d'intervention du conseiller" />
                                        <select value={selDep} onChange={e => setSelDep(e.target.value)}
                                            className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-white outline-none transition-all ${
                                                selDep ? 'border-teal-400 ring-2 ring-teal-100' : 'border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100'
                                            }`}>
                                            <option value="">— Choisir un département —</option>
                                            {deps.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                                        </select>
                                    </div>

                                    {/* Étape 2 — Communes & Arrondissements */}
                                    {selDep && communes.length > 0 && (
                                        <div>
                                            <SectionTitle
                                                step="2"
                                                title="Communes & Arrondissements"
                                                subtitle="Cochez les communes, puis sélectionnez les arrondissements pour chacune"
                                            />
                                            {errors.communes && (
                                                <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">
                                                    <svg className="size-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                    {errors.communes}
                                                </div>
                                            )}
                                            {/* Sélectionner tout */}
                                            {communes.length > 1 && (
                                                <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                                                    <span className="text-xs text-slate-500">{communes.length} communes disponibles</span>
                                                    <button type="button"
                                                        onClick={() => {
                                                            if (selCom.length === communes.length) {
                                                                setSelCom([]); setArrByCommune({}); setSelArr([]);
                                                            } else {
                                                                communes.forEach(c => { if (!selCom.includes(c.id)) handleToggleCommune(c.id); });
                                                            }
                                                        }}
                                                        className="text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors">
                                                        {selCom.length === communes.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                                                    </button>
                                                </div>
                                            )}
                                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                                {communes.map(c => (
                                                    <CommuneRow
                                                        key={c.id}
                                                        commune={c}
                                                        checked={selCom.includes(c.id)}
                                                        arrondissements={arrByCommune[c.id]}
                                                        loadingArr={loadingArr[c.id]}
                                                        selArr={selArr}
                                                        onToggleCommune={handleToggleCommune}
                                                        onToggleArr={handleToggleArr}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selDep && communes.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-8 text-center">
                                            <Icon d={ICONS.map} className="size-10 text-slate-300 mb-2" />
                                            <p className="text-sm text-slate-400">Aucune commune dans ce département</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ══ ACTIONS ══════════════════════════════════════════════════════ */}
                        <div className="xl:col-span-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
                            <button type="button" onClick={() => navigate('/dashboard/users')}
                                className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                                <Icon d="M6 18L18 6M6 6l12 12" className="size-4" />
                                Annuler
                            </button>
                            <button type="submit" disabled={loading}
                                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-7 py-2.5 text-sm font-bold text-white shadow-sm shadow-teal-200 hover:bg-teal-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                {loading ? (
                                    <>
                                        <svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                        </svg>
                                        Création en cours…
                                    </>
                                ) : (
                                    <>
                                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Créer le compte
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
            <Toast show={toast.show} message={toast.message} type={toast.type}
                title={toast.type === 'error' ? 'Erreur de création' : 'Compte créé !'}
                onClose={() => setToast({ ...toast, show:false })} />
        </div>
    );
}
