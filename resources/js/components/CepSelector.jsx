import { useEffect, useState } from 'react';
import api from '../services/api';

/**
 * Sélecteur de CEP réutilisable.
 * Props :
 *   value      : string  — cep_id sélectionné ('' = aucun)
 *   onChange   : fn(id)  — appelé avec le nouvel id (string)
 *   required   : bool    — affiche l'astérisque
 *   className  : string  — classes Tailwind supplémentaires
 */
export default function CepSelector({ value, onChange, required = false, className = '' }) {
    const [cepList, setCepList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/cep')
            .then(res => setCepList(Array.isArray(res.data) ? res.data : []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                CEP concerné{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                required={required}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all disabled:opacity-50">
                <option value="">— Sélectionner un CEP —</option>
                {cepList.map(c => (
                    <option key={c.id} value={String(c.id)}>
                        {c.nom_cep}
                        {c.commune?.nom ? ` — ${c.commune.nom}` : ''}
                        {c.village ? ` (${c.village})` : ''}
                    </option>
                ))}
            </select>
            {!loading && cepList.length === 0 && (
                <p className="text-xs text-amber-600 font-semibold">
                    Aucun CEP disponible — créez d'abord un CEP dans "Gestion des CEP".
                </p>
            )}
        </div>
    );
}
