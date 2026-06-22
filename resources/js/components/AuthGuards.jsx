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
    const { user, loading } = useAuth();
    if (loading) return <Loader />;
    return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function GuestRoute() {
    const { user, loading } = useAuth();
    if (loading) return <Loader />;
    return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
