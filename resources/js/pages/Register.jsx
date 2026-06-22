import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

/* ─── SVG Icons ─── */
const UserIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M20 21a8 8 0 0 0-16 0"/>
    </svg>
);
const MailIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="3"/>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
);
const LockIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
);
const EyeIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);
const EyeOffIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
        <line x1="2" y1="2" x2="22" y2="22"/>
    </svg>
);
const SpinIcon = () => (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
);

/* ─── Champ de saisie moderne ─── */
function Field({ label, icon, type, name, value, onChange, placeholder, error, suffix }) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                {label}
            </label>
            <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none
                                transition-colors duration-200 ${
                                    error
                                        ? 'text-red-500'
                                        : 'text-gray-400 group-focus-within:text-green-600'
                                }`}>
                    {icon}
                </div>
                <input
                    type={type} name={name} value={value}
                    onChange={onChange} required placeholder={placeholder}
                    className={`w-full pl-12 ${suffix ? 'pr-12' : 'pr-4'} py-4 rounded-2xl
                               border-2 transition-all duration-200 text-sm text-gray-800 placeholder-gray-400
                               ${error
                                   ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:bg-red-50/80 focus:shadow-lg focus:shadow-red-500/10'
                                   : 'border-transparent bg-gray-100/80 focus:border-green-500 focus:bg-white focus:shadow-lg focus:shadow-green-500/10'
                               } focus:outline-none`}
                />
                {suffix && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        {suffix}
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-2 text-xs text-red-600 flex items-center gap-1.5 pl-1 font-medium animate-shake">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
}

/* ─────────────────────────────── Page Register ── */
export default function Register() {
    const [form, setForm] = useState({
        name: '', email: '', password: '', password_confirmation: '',
    });
    const [showPwd,     setShowPwd]     = useState(false);
    const [showPwdConf, setShowPwdConf] = useState(false);
    const [loading,     setLoading]     = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [successMsg,  setSuccessMsg]  = useState('');
    const [showToast,   setShowToast]   = useState(false);
    const [toastType,   setToastType]   = useState('error');
    const { register, errors } = useAuth();
    const navigate = useNavigate();

    const handleChange = ({ target: { name, value } }) =>
        setForm(p => ({ ...p, [name]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setSuccessMsg('');
        setShowToast(false);
        try {
            const res = await register(form);
            if (res.success) {
                setToastType('success');
                setSuccessMsg('Compte créé avec succès. Redirection vers le tableau de bord...');
                setShowToast(true);
                window.setTimeout(() => navigate('/dashboard'), 700);
            } else {
                setToastType('error');
                setGlobalError(res.message || "Erreur lors de l'inscription.");
                setShowToast(true);
            }
        } catch {
            setToastType('error');
            setGlobalError('Une erreur réseau est survenue. Vérifiez votre connexion.');
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    const advantages = [
        '✓ Collecte de données mobile & hors-ligne',
        '✓ Données sécurisées & chiffrées',
        '✓ Synchronisation en temps réel',
        '✓ Rapports automatisés & exports PDF',
        '✓ Support technique inclus',
    ];

    return (
        <div className="min-h-screen flex">

            {/* ── Panneau gauche : Photo + overlay ── */}
            <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden flex-col justify-between p-12">

                <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80')" }}
                />
                <div className="absolute inset-0" style={{
                    background: 'linear-gradient(160deg, rgba(27,67,50,0.95) 0%, rgba(45,106,79,0.85) 60%, rgba(64,145,108,0.75) 100%)',
                }}/>

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl"
                        style={{ background: 'linear-gradient(135deg, #D4A017, #F59E0B)' }}>
                        <span className="text-xl">🌾</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">AgriSuivi CEP</h1>
                        <p className="text-amber-300 text-xs font-semibold tracking-widest uppercase mt-0.5">
                            Champs Écoles Paysans
                        </p>
                    </div>
                </div>

                {/* Centre */}
                <div className="relative z-10">
                    <div className="text-7xl mb-5 select-none">🌱</div>
                    <h2 className="text-2xl font-black text-white mb-3 leading-tight">
                        Rejoignez la<br/>
                        <span style={{ color: '#FCD34D' }}>communauté CEP</span>
                    </h2>
                    <p className="text-green-100/90 text-sm leading-relaxed">
                        Créez votre compte et commencez à digitaliser
                        l'accompagnement des producteurs ruraux
                        avec des outils conçus pour le terrain.
                    </p>
                </div>

                {/* Avantages */}
                <div className="relative z-10 space-y-2">
                    {advantages.map(a => (
                        <p key={a} className="text-green-100/90 text-sm flex items-center gap-2">
                            {a}
                        </p>
                    ))}
                </div>

                <p className="relative z-10 text-green-300/50 text-xs">
                    © 2026 AgriSuivi CEP
                </p>
            </div>

            {/* ── Panneau droit : Formulaire ── */}
            <div className="flex-1 flex items-center justify-center p-8"
                style={{ background: 'linear-gradient(135deg, #f8fdf9 0%, #f0f9f3 100%)' }}>
                <div className="w-full max-w-[440px]">

                    {/* Logo mobile */}
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #1B4332, #40916C)' }}>
                            <span className="text-xl">🌾</span>
                        </div>
                        <div>
                            <p className="text-xl font-black" style={{ color: '#1B4332' }}>AgriSuivi CEP</p>
                            <p className="text-xs text-gray-400">Champs Écoles Paysans</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-2xl shadow-green-900/10 p-9 border border-green-100/60">

                        <div className="mb-7">
                            <h2 className="text-2xl font-black" style={{ color: '#1B4332' }}>Créer un compte</h2>
                            <p className="text-gray-400 text-sm mt-1.5">
                                Enregistrez-vous pour accéder à la plateforme
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">

                            <Field label="Nom complet" icon={<UserIcon />}
                                type="text" name="name" value={form.name}
                                onChange={handleChange} placeholder="Prénom Nom"
                                error={errors?.name?.[0]}
                            />

                            <Field label="Adresse email" icon={<MailIcon />}
                                type="email" name="email" value={form.email}
                                onChange={handleChange} placeholder="conseiller@cep-agri.org"
                                error={errors?.email?.[0]}
                            />

                            <Field label="Mot de passe" icon={<LockIcon />}
                                type={showPwd ? 'text' : 'password'}
                                name="password" value={form.password}
                                onChange={handleChange} placeholder="Minimum 8 caractères"
                                error={errors?.password?.[0]}
                                suffix={
                                    <button type="button" onClick={() => setShowPwd(v => !v)}
                                        className="text-gray-400 hover:text-green-600 transition-colors p-1 rounded-lg">
                                        {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                }
                            />

                            <Field label="Confirmer le mot de passe" icon={<LockIcon />}
                                type={showPwdConf ? 'text' : 'password'}
                                name="password_confirmation" value={form.password_confirmation}
                                onChange={handleChange} placeholder="••••••••"
                                error={errors?.password_confirmation?.[0]}
                                suffix={
                                    <button type="button" onClick={() => setShowPwdConf(v => !v)}
                                        className="text-gray-400 hover:text-green-600 transition-colors p-1 rounded-lg">
                                        {showPwdConf ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                }
                            />

                            <button type="submit" disabled={loading}
                                className="w-full py-4 rounded-2xl font-bold text-white text-sm
                                           flex items-center justify-center gap-2.5 mt-2
                                           disabled:opacity-60 active:scale-[.98] transition-all duration-200
                                           shadow-lg shadow-green-900/25 hover:shadow-xl hover:shadow-green-900/35"
                                style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 60%, #40916C 100%)' }}>
                                {loading
                                    ? <><SpinIcon /> Création du compte…</>
                                    : <><span>🌱</span> Créer mon compte</>
                                }
                            </button>
                        </form>

                        <div className="mt-7 pt-6 border-t border-gray-100 text-center">
                            <p className="text-sm text-gray-500">
                                Déjà inscrit ?{' '}
                                <Link to="/login"
                                    className="font-black hover:underline transition-colors"
                                    style={{ color: '#1B4332' }}>
                                    Se connecter
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast notification */}
            <Toast
                message={toastType === 'success' ? successMsg : globalError}
                title={toastType === 'success' ? 'Compte créé' : "Échec de l'inscription"}
                type={toastType}
                show={showToast}
                onClose={() => setShowToast(false)}
                duration={toastType === 'success' ? 3000 : 0}
            />

        </div>
    );
}
