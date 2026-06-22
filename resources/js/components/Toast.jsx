import React, { useEffect } from 'react';

/* ─── SVG Icons ─── */
const AlertCircleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
);

const CheckCircleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
);

const InfoIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
);

const XIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

/**
 * Toast notification component
 * @param {string} message - Message à afficher
 * @param {('error'|'success'|'info')} type - Type de toast
 * @param {function} onClose - Callback de fermeture
 * @param {number} duration - Durée d'affichage en ms (0 = pas d'auto-close)
 * @param {boolean} show - Afficher le toast
 */
export default function Toast({
    message,
    title,
    type = 'error',
    onClose,
    duration = 5000,
    show = false
}) {
    useEffect(() => {
        if (show && duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose]);

    if (!show || !message) return null;

    const configs = {
        error: {
            accent: 'from-red-500 to-rose-500',
            badge: 'bg-red-50 text-red-600 ring-red-100',
            title: 'text-red-900',
            text: 'text-red-700',
            icon: <AlertCircleIcon />,
            progressBg: 'bg-red-500',
            glow: 'shadow-red-900/10',
        },
        success: {
            accent: 'from-emerald-500 to-green-600',
            badge: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
            title: 'text-emerald-950',
            text: 'text-emerald-800',
            icon: <CheckCircleIcon />,
            progressBg: 'bg-emerald-500',
            glow: 'shadow-emerald-900/10',
        },
        info: {
            accent: 'from-sky-500 to-blue-600',
            badge: 'bg-sky-50 text-sky-700 ring-sky-100',
            title: 'text-sky-950',
            text: 'text-sky-800',
            icon: <InfoIcon />,
            progressBg: 'bg-sky-500',
            glow: 'shadow-sky-900/10',
        },
    };

    const config = configs[type] || configs.error;

    return (
        <>
            <div
                className="fixed inset-0 bg-slate-950/35 backdrop-blur-sm z-50 animate-fadeIn"
                onClick={onClose}
            />

            <div className="fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-5 sm:pt-8 pointer-events-none">
                <div
                    className={`relative w-full max-w-[440px] overflow-hidden rounded-[1.35rem]
                               border border-white/70 bg-white/95 shadow-2xl ${config.glow}
                               pointer-events-auto backdrop-blur-xl animate-slideDown`}
                    style={{
                        animation: 'slideDown 0.26s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    role="alert"
                    aria-live={type === 'error' ? 'assertive' : 'polite'}
                >
                    <div className={`h-1.5 bg-gradient-to-r ${config.accent}`} />

                    <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm">
                                    <img
                                        src="/images/ceplogo.png"
                                        alt="PASAD"
                                        className="h-full w-full object-contain p-1.5"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                        PASAD
                                    </p>
                                    <h3 className={`${config.title} mt-0.5 truncate text-base font-black`}>
                                        {title || (type === 'error' ? 'Échec de connexion' : type === 'success' ? 'Succès' : 'Information')}
                                    </h3>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="shrink-0 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-600/25"
                                aria-label="Fermer"
                            >
                                <XIcon />
                            </button>
                        </div>

                        <div className="flex items-start gap-3 rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
                            <div className={`${config.badge} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1`}>
                                {config.icon}
                            </div>
                            <p className={`${config.text} min-w-0 flex-1 text-sm font-medium leading-relaxed`}>
                                {message}
                            </p>
                        </div>
                    </div>

                    {duration > 0 && (
                        <div className="h-1 bg-slate-100">
                            <div
                                className={`h-full ${config.progressBg}`}
                                style={{
                                    animation: `shrink ${duration}ms linear forwards`,
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-18px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </>
    );
}
