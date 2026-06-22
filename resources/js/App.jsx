import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider }            from './contexts/AuthContext';
import { GuestRoute, ProtectedRoute } from './components/AuthGuards';
import Login           from './pages/Login';
import Register        from './pages/Register';
import ForgotPassword  from './pages/ForgotPassword';
import Dashboard       from './pages/Dashboard';
import UsersManagement  from './pages/UsersManagement';
import CreateUser       from './pages/CreateUser';
import RolesManagement  from './pages/RolesManagement';
import GeographyManagement from './pages/GeographyManagement';
import ComingSoon       from './pages/ComingSoon';

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

                    {/* Gestion des utilisateurs */}
                    <Route path="/dashboard/users"        element={<UsersManagement />} />
                    <Route path="/dashboard/users/create" element={<CreateUser />} />

                    {/* Modules à venir */}
                    <Route path="/producteurs"        element={<ComingSoon title="Producteurs"    icon="users"    />} />
                    <Route path="/producteurs/create" element={<ComingSoon title="Nouveau producteur" icon="users" />} />
                    <Route path="/parcelles"          element={<ComingSoon title="Parcelles"      icon="parcelles" />} />
                    <Route path="/parcelles/create"   element={<ComingSoon title="Nouvelle parcelle" icon="parcelles" />} />
                    <Route path="/suivis"             element={<ComingSoon title="Suivis CEP"     icon="suivis"   />} />
                    <Route path="/suivis/create"      element={<ComingSoon title="Nouveau suivi"  icon="suivis"   />} />
                    <Route path="/cultures"           element={<ComingSoon title="Cultures"       icon="cultures" />} />
                    <Route path="/caisse"             element={<ComingSoon title="Caisse & Stock" icon="caisse"   />} />
                    <Route path="/rapports"           element={<ComingSoon title="Rapports"       icon="rapports" />} />
                    <Route path="/stats"              element={<ComingSoon title="Statistiques"   icon="stats"    />} />
                    <Route path="/roles"              element={<RolesManagement />} />
                    <Route path="/geographie"         element={<GeographyManagement />} />
                    <Route path="/config"             element={<ComingSoon title="Configuration"  icon="settings" />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </AuthProvider>
    );
}
