import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider }            from './contexts/AuthContext';
import { GuestRoute, ProtectedRoute } from './components/AuthGuards';
import Login          from './pages/Login';
import Register       from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard      from './pages/Dashboard';

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Routes publiques (redirige vers /dashboard si déjà connecté) */}
                <Route element={<GuestRoute />}>
                    <Route path="/login"           element={<Login />} />
                    <Route path="/register"        element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                </Route>

                {/* Routes protégées */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </AuthProvider>
    );
}
