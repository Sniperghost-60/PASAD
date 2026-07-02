import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
    getCsrfCookie,
    getUser,
    login  as apiLogin,
    logout as apiLogout,
    register as apiRegister,
} from '../services/api';
import api from '../services/api';
import { getApiErrorMessage, translateApiErrors } from '../utils/apiMessages';

const AuthContext = createContext({});

const storageKey = 'parsad_commune';
const readStoredCommune = () => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || null; } catch { return null; }
};

export function AuthProvider({ children }) {
    const [user,    setUser]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [errors,  setErrors]  = useState({});
    const [activeCommune,      setActiveCommuneState] = useState(readStoredCommune);
    const [conseillerCommunes, setConseillerCommunes] = useState([]);

    const setActiveCommune = (commune) => {
        setActiveCommuneState(commune);
        if (commune) localStorage.setItem(storageKey, JSON.stringify(commune));
        else localStorage.removeItem(storageKey);
    };

    const fetchUser = useCallback(async () => {
        try {
            const { data } = await getUser();
            setUser(data);
            // Si Conseiller, charger ses communes
            if (data?.roles?.includes('Conseiller')) {
                try {
                    const { data: communes } = await api.get('/api/user/communes');
                    const list = Array.isArray(communes) ? communes : [];
                    setConseillerCommunes(list);
                    // Auto-sélectionner si 1 seule commune
                    if (list.length === 1) {
                        setActiveCommune(list[0]);
                    }
                } catch { setConseillerCommunes([]); }
            }
            return data;
        } catch {
            setUser(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUser(); }, [fetchUser]);

    const login = async (credentials) => {
        setErrors({});
        try {
            await getCsrfCookie();
            await apiLogin(credentials);
            const authenticatedUser = await fetchUser();

            if (!authenticatedUser) {
                return {
                    success: false,
                    message: 'Identifiants incorrects. Vérifiez votre email et mot de passe.',
                };
            }

            return { success: true };
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(translateApiErrors(err.response.data.errors ?? {}));
            }

            return {
                success: false,
                message: getApiErrorMessage(err, 'Identifiants incorrects. Vérifiez votre email et mot de passe.'),
            };
        }
    };

    const register = async (data) => {
        setErrors({});
        try {
            await getCsrfCookie();
            await apiRegister(data);
            const authenticatedUser = await fetchUser();

            if (!authenticatedUser) {
                return {
                    success: false,
                    message: "Le compte a peut-être été créé, mais la connexion automatique a échoué.",
                };
            }

            return { success: true };
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(translateApiErrors(err.response.data.errors ?? {}));
            }

            return {
                success: false,
                message: getApiErrorMessage(err, "Une erreur est survenue lors de l'inscription."),
            };
        }
    };

    const logout = async () => {
        await apiLogout();
        setUser(null);
        setActiveCommune(null);
        setConseillerCommunes([]);
    };

    // ── Helpers rôles ────────────────────────────────────────────────────
    const hasRole = (role) => {
        if (!user?.roles) return false;
        if (Array.isArray(role)) return role.some(r => user.roles.includes(r));
        return user.roles.includes(role);
    };

    const hasPermission = (perm) => {
        if (!user?.permissions) return false;
        return user.permissions.includes(perm);
    };

    const isSuperAdmin = () => hasRole('Super-Admin');

    return (
        <AuthContext.Provider value={{ user, loading, errors, login, register, logout, hasRole, hasPermission, isSuperAdmin, activeCommune, setActiveCommune, conseillerCommunes, fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
