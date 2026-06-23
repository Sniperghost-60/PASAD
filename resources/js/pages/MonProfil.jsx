import { useEffect, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

/* ── Icônes inline ─────────────────────────────────────────────────────── */
const IconUser = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
);
const IconLock = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
);
const IconEye = ({ off }) => off ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

/* ── Champ texte réutilisable ──────────────────────────────────────────── */
function Field({ label, type = 'text', value, onChange, error, placeholder, autoComplete, right }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-800 bg-white
                        focus:outline-none focus:ring-2 focus:ring-teal-400 transition
                        ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
                {right && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">{right}</div>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

/* ── Champ mot de passe avec toggle visibilité ─────────────────────────── */
function PasswordField({ label, value, onChange, error, placeholder, autoComplete }) {
    const [show, setShow] = useState(false);
    return (
        <Field
            label={label}
            type={show ? 'text' : 'password'}
            value={value}
            onChange={onChange}
            error={error}
            placeholder={placeholder}
            autoComplete={autoComplete}
            right={
                <button type="button" onClick={() => setShow(s => !s)}
                    className="text-slate-400 hover:text-teal-600 transition p-0.5">
                    <IconEye off={show} />
                </button>
            }
        />
    );
}

/* ── Avatar initiales ──────────────────────────────────────────────────── */
function Avatar({ name }) {
    const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600
            flex items-center justify-center text-white text-2xl font-bold shadow-md select-none">
            {initials}
        </div>
    );
}

/* ════════════════════════════════════════════════════════════════════════ */
export default function MonProfil() {
    const { user, fetchUser } = useAuth();

    /* Infos personnelles */
    const [info, setInfo]       = useState({ name: '', email: '', telephone: '' });
    const [infoErr, setInfoErr] = useState({});
    const [savingInfo, setSavingInfo] = useState(false);

    /* Mot de passe */
    const [pwd, setPwd]         = useState({ current_password: '', password: '', password_confirmation: '' });
    const [pwdErr, setPwdErr]   = useState({});
    const [savingPwd, setSavingPwd] = useState(false);

    /* Toast */
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const notify = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
    };

    /* Remplir depuis l'utilisateur connecté */
    useEffect(() => {
        if (user) {
            setInfo({
                name:      user.name      ?? '',
                email:     user.email     ?? '',
                telephone: user.telephone ?? '',
            });
        }
    }, [user]);

    /* ── Sauvegarder les infos personnelles ── */
    const handleInfoSubmit = async (e) => {
        e.preventDefault();
        setInfoErr({});
        setSavingInfo(true);
        try {
            await api.put('/api/me', info);
            if (fetchUser) await fetchUser();
            notify('Informations mises à jour avec succès.');
        } catch (err) {
            const errors = err.response?.data?.errors ?? {};
            if (Object.keys(errors).length) {
                setInfoErr(errors);
            } else {
                notify(err.response?.data?.message ?? 'Erreur lors de la mise à jour.', 'error');
            }
        } finally { setSavingInfo(false); }
    };

    /* ── Changer le mot de passe ── */
    const handlePwdSubmit = async (e) => {
        e.preventDefault();
        setPwdErr({});
        setSavingPwd(true);
        try {
            await api.put('/api/me/password', pwd);
            setPwd({ current_password: '', password: '', password_confirmation: '' });
            notify('Mot de passe modifié avec succès.');
        } catch (err) {
            const errors = err.response?.data?.errors ?? {};
            if (Object.keys(errors).length) {
                setPwdErr(errors);
            } else {
                notify(err.response?.data?.message ?? 'Erreur lors du changement.', 'error');
            }
        } finally { setSavingPwd(false); }
    };

    /* Indicateur de force du mot de passe */
    const strength = (() => {
        const p = pwd.password;
        if (!p) return 0;
        let s = 0;
        if (p.length >= 8)  s++;
        if (/[A-Z]/.test(p)) s++;
        if (/[0-9]/.test(p)) s++;
        if (/[^A-Za-z0-9]/.test(p)) s++;
        return s;
    })();
    const strengthLabel = ['', 'Faible', 'Moyen', 'Bien', 'Fort'][strength];
    const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-500'][strength];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-emerald-50/20 flex">
            <Sidebar />
            <div className="flex-1 ml-60 flex flex-col min-h-screen">
                <Header title="Mon profil" />

                <main className="flex-1 px-6 py-6">
                    {/* En-tête profil */}
                    <div className="mb-6 flex items-center gap-4">
                        <Avatar name={user?.name} />
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">{user?.name}</h2>
                            <p className="text-sm text-slate-500">{user?.email}</p>
                            <div className="mt-1 flex gap-1.5 flex-wrap">
                                {(user?.roles ?? []).map(r => (
                                    <span key={r} className="px-2 py-0.5 rounded-full text-[10px] font-semibold
                                        bg-teal-100 text-teal-700 border border-teal-200">{r}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* ── Carte informations personnelles ── */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="px-5 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 flex items-center gap-2.5">
                                <span className="text-white/80"><IconUser /></span>
                                <h3 className="text-white font-semibold text-sm">Informations personnelles</h3>
                            </div>
                            <form onSubmit={handleInfoSubmit} className="p-5 space-y-4">
                                <Field
                                    label="Nom complet"
                                    value={info.name}
                                    onChange={e => setInfo(d => ({ ...d, name: e.target.value }))}
                                    error={infoErr.name?.[0]}
                                    placeholder="Votre nom"
                                    autoComplete="name"
                                />
                                <Field
                                    label="Adresse e-mail"
                                    type="email"
                                    value={info.email}
                                    onChange={e => setInfo(d => ({ ...d, email: e.target.value }))}
                                    error={infoErr.email?.[0]}
                                    placeholder="exemple@domaine.com"
                                    autoComplete="email"
                                />
                                <Field
                                    label="Téléphone"
                                    type="tel"
                                    value={info.telephone}
                                    onChange={e => setInfo(d => ({ ...d, telephone: e.target.value }))}
                                    error={infoErr.telephone?.[0]}
                                    placeholder="+229 01 23 45 67"
                                    autoComplete="tel"
                                />
                                <div className="pt-1">
                                    <button type="submit" disabled={savingInfo}
                                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600
                                            text-white text-sm font-semibold shadow hover:shadow-md
                                            disabled:opacity-60 transition">
                                        {savingInfo ? 'Enregistrement…' : 'Enregistrer les modifications'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* ── Carte mot de passe ── */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="px-5 py-4 bg-gradient-to-r from-slate-700 to-slate-800 flex items-center gap-2.5">
                                <span className="text-white/80"><IconLock /></span>
                                <h3 className="text-white font-semibold text-sm">Changer le mot de passe</h3>
                            </div>
                            <form onSubmit={handlePwdSubmit} className="p-5 space-y-4">
                                <PasswordField
                                    label="Mot de passe actuel"
                                    value={pwd.current_password}
                                    onChange={e => setPwd(d => ({ ...d, current_password: e.target.value }))}
                                    error={pwdErr.current_password?.[0]}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                                <PasswordField
                                    label="Nouveau mot de passe"
                                    value={pwd.password}
                                    onChange={e => setPwd(d => ({ ...d, password: e.target.value }))}
                                    error={pwdErr.password?.[0]}
                                    placeholder="8 caractères minimum"
                                    autoComplete="new-password"
                                />

                                {/* Barre de force */}
                                {pwd.password && (
                                    <div className="space-y-1 -mt-1">
                                        <div className="flex gap-1">
                                            {[1,2,3,4].map(i => (
                                                <div key={i}
                                                    className={`flex-1 h-1.5 rounded-full transition-all duration-300
                                                        ${i <= strength ? strengthColor : 'bg-slate-100'}`} />
                                            ))}
                                        </div>
                                        {strengthLabel && (
                                            <p className="text-xs text-slate-500">
                                                Force : <span className="font-semibold">{strengthLabel}</span>
                                            </p>
                                        )}
                                    </div>
                                )}

                                <PasswordField
                                    label="Confirmer le nouveau mot de passe"
                                    value={pwd.password_confirmation}
                                    onChange={e => setPwd(d => ({ ...d, password_confirmation: e.target.value }))}
                                    error={pwdErr.password_confirmation?.[0]}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                />

                                {/* Aide mots de passe forts */}
                                <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-[11px] text-slate-500 space-y-0.5">
                                    {[
                                        ['Au moins 8 caractères', pwd.password.length >= 8],
                                        ['Une lettre majuscule', /[A-Z]/.test(pwd.password)],
                                        ['Un chiffre', /[0-9]/.test(pwd.password)],
                                        ['Un caractère spécial', /[^A-Za-z0-9]/.test(pwd.password)],
                                    ].map(([label, ok]) => (
                                        <div key={label} className="flex items-center gap-1.5">
                                            <span className={ok ? 'text-emerald-500' : 'text-slate-300'}>
                                                {ok ? '✓' : '○'}
                                            </span>
                                            <span className={ok ? 'text-emerald-700' : ''}>{label}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-1">
                                    <button type="submit" disabled={savingPwd}
                                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800
                                            text-white text-sm font-semibold shadow hover:shadow-md
                                            disabled:opacity-60 transition">
                                        {savingPwd ? 'Modification…' : 'Changer le mot de passe'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div>

            <ModernNotification
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(t => ({ ...t, show: false }))}
            />
        </div>
    );
}
