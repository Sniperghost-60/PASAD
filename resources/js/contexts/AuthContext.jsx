import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
    getCsrfCookie,
    getUser,
    login  as apiLogin,
    logout as apiLogout,
    register as apiRegister,
} from '../services/api';
import { getApiErrorMessage, translateApiErrors } from '../utils/apiMessages';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user,    setUser]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [errors,  setErrors]  = useState({});

    const fetchUser = useCallback(async () => {
        try {
            const { data } = await getUser();
            setUser(data);
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
    };

    return (
        <AuthContext.Provider value={{ user, loading, errors, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
