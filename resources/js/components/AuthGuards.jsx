import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Loader() {
    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0F7F2' }}>
            <div className="text-center">
                <div className="text-5xl mb-4">🌾</div>
                <div className="flex items-center gap-2 justify-center" style={{ color: '#2D6A4F' }}>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    <span className="text-sm font-medium">Chargement PASAD…</span>
                </div>
            </div>
        </div>
    );
}

export function ProtectedRoute() {
    const { user, loading, activeCommune, conseillerCommunes } = useAuth();
    if (loading) return <Loader />;
    if (!user) return <Navigate to="/login" replace />;

    // Conseiller avec plusieurs communes → doit d'abord choisir
    const isConseiller = user.roles?.includes('Conseiller');
    if (isConseiller && conseillerCommunes.length > 1 && !activeCommune) {
        return <Navigate to="/choisir-commune" replace />;
    }

    return <Outlet />;
}

export function GuestRoute() {
    const { user, loading, activeCommune, conseillerCommunes } = useAuth();
    if (loading) return <Loader />;
    if (!user) return <Outlet />;

    // Conseiller avec plusieurs communes → envoyer sur la sélection
    const isConseiller = user.roles?.includes('Conseiller');
    if (isConseiller && conseillerCommunes.length > 1 && !activeCommune) {
        return <Navigate to="/choisir-commune" replace />;
    }

    return <Navigate to="/dashboard" replace />;
}

// Guard spécial pour la page de sélection de commune
export function CommuneSelectionRoute() {
    const { user, loading, activeCommune, conseillerCommunes } = useAuth();
    if (loading) return <Loader />;
    if (!user) return <Navigate to="/login" replace />;

    // Si déjà une commune choisie ou 1 seule commune → pas besoin de cette page
    const isConseiller = user.roles?.includes('Conseiller');
    if (!isConseiller || conseillerCommunes.length <= 1 || activeCommune) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}
