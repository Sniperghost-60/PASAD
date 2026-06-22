import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/* ─── SVG Icons ─── */
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
const LoginIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <polyline points="10 17 15 12 10 7"/>
        <line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
);
const SpinIcon = () => (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
);
const CheckIcon = () => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
    </svg>
);

function Field({ label, icon, type, name, value, onChange, placeholder, error, suffix }) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                {label}
            </label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none
                                text-gray-400 group-focus-within:text-green-600 transition-colors duration-200">
                    {icon}
                </div>
                <input
                    type={type} name={name} value={value}
                    onChange={onChange} required placeholder={placeholder}
                    className={`w-full pl-12 ${suffix ? 'pr-12' : 'pr-4'} py-4 rounded-2xl
                               border-2 border-transparent bg-gray-100/80
                               focus:outline-none focus:border-green-500 focus:bg-white focus:shadow-lg focus:shadow-green-500/10
                               text-sm text-gray-800 placeholder-gray-400
                               transition-all duration-200`}
                />
                {suffix && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        {suffix}
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5 pl-1">
                    <span>⚠</span> {error}
                </p>
            )}
        </div>
    );
}

export default function Login() {
    const [form,        setForm]        = useState({ email: '', password: '', remember: false });
    const [showPwd,     setShowPwd]     = useState(false);
    const [loading,     setLoading]     = useState(false);
    const [globalError, setGlobalError] = useState('');
    const { login, errors } = useAuth();
    const navigate = useNavigate();

    const handleChange = ({ target: { name, value, type, checked } }) =>
        setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        const res = await login(form);
        setLoading(false);
        res.success ? navigate('/dashboard') : setGlobalError(res.message);
    };

    const features = [
        { icon: '👥', title: 'Profils producteurs',    desc: 'Bénéficiaires & ménages ruraux' },
        { icon: '🌿', title: 'Suivi agroécologique',   desc: 'Expérimentations & rendements' },
        { icon: '📦', title: 'Gestion caisse & stock', desc: 'Trésorerie & approvisionnement' },
        { icon: '🔗', title: 'Chaînes de valeur',      desc: 'Insertion & mise en marché (CAI)' },
    ];

    return (
        <div className="min-h-screen flex">

            {/* ── Panneau gauche : Photo + overlay ── */}
            <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col justify-between p-12">

                <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80')" }}
                />
                <div className="absolute inset-0" style={{
                    background: 'linear-gradient(145deg, rgba(27,67,50,0.94) 0%, rgba(45,106,79,0.83) 55%, rgba(64,145,108,0.70) 100%)',
                }}/>

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
                        style={{ background: 'linear-gradient(135deg, #D4A017, #F59E0B)' }}>
                        <span className="text-2xl">🌾</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight leading-none">AgriSuivi CEP</h1>
                        <p className="text-amber-300 text-xs font-semibold tracking-widest uppercase mt-1">
                            Champs Écoles Paysans
                        </p>
                    </div>
                </div>

                {/* Texte central */}
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-white/20"
                        style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
                        <span className="text-green-100 text-xs font-semibold tracking-wide">
                            Plateforme de suivi agroécologique
                        </span>
                    </div>
                    <h2 className="text-4xl font-black text-white leading-tight mb-4">
                        Du diagnostic terrain<br/>
                        <span style={{ color: '#FCD34D' }}>à la mise en marché</span>
                    </h2>
                    <p className="text-green-100/90 text-sm leading-relaxed max-w-md">
                        Digitalisez l'accompagnement des producteurs agroécologiques :
                        fiches terrain, suivi des rendements, gestion de caisse
                        et insertion dans les chaînes de valeur agricoles.
                    </p>
                </div>

                {/* Features */}
                <div className="relative z-10 grid grid-cols-2 gap-3">
                    {features.map(({ icon, title, desc }) => (
                        <div key={title}
                            className="flex items-start gap-3 rounded-2xl p-4 border border-white/10 hover:border-white/25 transition-all duration-200"
                            style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(6px)' }}>
                            <span className="text-2xl mt-0.5 flex-shrink-0">{icon}</span>
                            <div>
                                <p className="text-white text-sm font-semibold leading-tight">{title}</p>
                                <p className="text-green-200/80 text-xs mt-0.5 leading-snug">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="relative z-10 text-green-300/50 text-xs">
                    © 2026 AgriSuivi CEP · Tous droits réservés
                </p>
            </div>

            {/* ── Panneau droit : Formulaire ── */}
            <div className="flex-1 flex items-center justify-center p-8"
                style={{ background: 'linear-gradient(135deg, #f8fdf9 0%, #f0f9f3 100%)' }}>
                <div className="w-full max-w-[420px]">

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

                        <div className="mb-8">
                            <h2 className="text-2xl font-black" style={{ color: '#1B4332' }}>Connexion</h2>
                            <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">
                                Espace réservé aux conseillers CEP<br/>et facilitateurs de terrain
                            </p>
                        </div>

                        {globalError && (
                            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
                                <span className="text-lg">⚠️</span>
                                <p className="text-red-600 text-sm leading-relaxed">{globalError}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">

                            <Field label="Adresse email" icon={<MailIcon />}
                                type="email" name="email" value={form.email}
                                onChange={handleChange} placeholder="conseiller@cep-agri.org"
                                error={errors?.email?.[0]}
                            />

                            <Field label="Mot de passe" icon={<LockIcon />}
                                type={showPwd ? 'text' : 'password'}
                                name="password" value={form.password}
                                onChange={handleChange} placeholder="••••••••"
                                error={errors?.password?.[0]}
                                suffix={
                                    <button type="button" onClick={() => setShowPwd(v => !v)}
                                        className="text-gray-400 hover:text-green-600 transition-colors p-1 rounded-lg">
                                        {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                }
                            />

                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2.5 cursor-pointer group select-none"
                                    onClick={() => setForm(p => ({ ...p, remember: !p.remember }))}>
                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200
                                        ${form.remember
                                            ? 'border-green-500 bg-green-500 shadow-sm shadow-green-500/30'
                                            : 'border-gray-200 bg-gray-50 group-hover:border-green-300'}`}>
                                        {form.remember && <span className="text-white"><CheckIcon /></span>}
                                    </div>
                                    <span className="text-sm text-gray-600">Se souvenir de moi</span>
                                </label>
                                <Link to="/forgot-password"
                                    className="text-sm font-bold hover:underline transition-colors"
                                    style={{ color: '#40916C' }}>
                                    Mot de passe oublié ?
                                </Link>
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full py-4 rounded-2xl font-bold text-white text-sm
                                           flex items-center justify-center gap-2.5 mt-2
                                           disabled:opacity-60 active:scale-[.98] transition-all duration-200
                                           shadow-lg shadow-green-900/25 hover:shadow-xl hover:shadow-green-900/35"
                                style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 60%, #40916C 100%)' }}>
                                {loading
                                    ? <><SpinIcon /> Connexion en cours…</>
                                    : <><LoginIcon /> Se connecter</>
                                }
                            </button>
                        </form>

                        <div className="mt-7 pt-6 border-t border-gray-100 text-center">
                            <p className="text-sm text-gray-500">
                                Première connexion ?{' '}
                                <Link to="/register"
                                    className="font-black hover:underline transition-colors"
                                    style={{ color: '#1B4332' }}>
                                    Demander un accès
                                </Link>
                            </p>
                        </div>
                    </div>

                    <p className="mt-5 text-center text-xs text-gray-400">
                        © 2026 AgriSuivi CEP · Digitalisation des Champs Écoles Paysans
                    </p>
                </div>
            </div>

        </div>
    );
}
