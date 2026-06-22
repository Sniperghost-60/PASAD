import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
    getCsrfCookie,
    getUser,
    login  as apiLogin,
    logout as apiLogout,
    register as apiRegister,
} from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user,    setUser]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [errors,  setErrors]  = useState({});

    const fetchUser = useCallback(async () => {
        try {
            const { data } = await getUser();
            setUser(data);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUser(); }, [fetchUser]);

    const login = async (credentials) => {
        setErrors({});
        await getCsrfCookie();
        try {
            await apiLogin(credentials);
            await fetchUser();
            return { success: true };
        } catch (err) {
            if (err.response?.status === 422) setErrors(err.response.data.errors ?? {});
            return { success: false, message: err.response?.data?.message ?? 'Identifiants incorrects.' };
        }
    };

    const register = async (data) => {
        setErrors({});
        await getCsrfCookie();
        try {
            await apiRegister(data);
            await fetchUser();
            return { success: true };
        } catch (err) {
            if (err.response?.status === 422) setErrors(err.response.data.errors ?? {});
            return { success: false, message: err.response?.data?.message ?? "Erreur lors de l'inscription." };
        }
    };

    const logout = async () => {
        await apiLogout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, errors, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
