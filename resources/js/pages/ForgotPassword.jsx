import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getCsrfCookie } from '../services/api';

export default function ForgotPassword() {
    const [email,   setEmail]   = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error,   setError]   = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await getCsrfCookie();
            await api.post('/forgot-password', { email });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message ?? 'Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#F4FAF6' }}>
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow"
                            style={{ background: 'linear-gradient(135deg,#1B4332,#40916C)' }}>
                            <span className="text-xl">🌾</span>
                        </div>
                        <span className="text-2xl font-bold" style={{ color: '#1B4332' }}>PASAD</span>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
                    {success ? (
                        <div className="text-center py-4">
                            <div className="text-5xl mb-4">📬</div>
                            <h2 className="text-xl font-bold mb-2" style={{ color: '#1B4332' }}>Email envoyé !</h2>
                            <p className="text-gray-400 text-sm mb-6">
                                Un lien de réinitialisation a été envoyé à <strong className="text-gray-600">{email}</strong>.
                                Vérifiez votre boîte de réception.
                            </p>
                            <Link to="/login" className="text-sm font-semibold" style={{ color: '#40916C' }}>
                                ← Retour à la connexion
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-7">
                                <h2 className="text-2xl font-bold" style={{ color: '#1B4332' }}>Mot de passe oublié</h2>
                                <p className="text-gray-400 text-sm mt-1">
                                    Entrez votre email pour recevoir un lien de réinitialisation.
                                </p>
                            </div>

                            {error && (
                                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2">
                                    <span>⚠️</span>
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Email professionnel
                                    </label>
                                    <input
                                        type="email" value={email} required
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="agronome@domaine.fr"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50
                                                   focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                                                   text-sm transition"
                                    />
                                </div>
                                <button
                                    type="submit" disabled={loading}
                                    className="w-full py-3 rounded-xl font-semibold text-white text-sm
                                               flex items-center justify-center gap-2 disabled:opacity-70
                                               active:scale-[.98] transition-all"
                                    style={{ background: 'linear-gradient(135deg,#1B4332,#40916C)' }}
                                >
                                    {loading ? 'Envoi en cours…' : <><span>📧</span> Envoyer le lien</>}
                                </button>
                            </form>

                            <p className="mt-6 text-center">
                                <Link to="/login" className="text-sm font-semibold" style={{ color: '#40916C' }}>
                                    ← Retour à la connexion
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
