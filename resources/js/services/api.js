import axios from 'axios';

const api = axios.create({
    baseURL: '/',
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

export const getCsrfCookie = () => api.get('/sanctum/csrf-cookie');
export const login         = (data) => api.post('/login', data);
export const register      = (data) => api.post('/register', data);
export const logout        = ()     => api.post('/logout');
export const forgotPassword = (email) => api.post('/forgot-password', { email });
export const getUser       = ()     => api.get('/api/user');

export default api;
