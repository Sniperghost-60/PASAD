import { useState } from 'react';

/**
 * Select générique avec une option "Autre (à préciser)" qui bascule vers une saisie libre.
 * Réutilisé par CultureSelect et par tout champ nécessitant une liste + échappatoire texte libre.
 */
export default function SelectWithOther({
    value, onChange, options, otherValue = 'Autre (à préciser)',
    className, style, placeholder = '— Sélectionner —', customPlaceholder = 'Préciser…',
}) {
    const [forceCustom, setForceCustom] = useState(false);
    const isCustom = forceCustom || (value !== '' && !options.includes(value));

    if (isCustom) {
        return (
            <div className="relative">
                <input value={value} onChange={e => onChange(e.target.value)}
                    placeholder={customPlaceholder}
                    className={className} style={{ ...style, paddingRight: 22 }} />
                <button type="button" onClick={() => { setForceCustom(false); onChange(''); }}
                    title="Revenir à la liste"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                    <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <select value={value}
            onChange={e => {
                if (e.target.value === otherValue) { setForceCustom(true); onChange(''); }
                else onChange(e.target.value);
            }}
            className={className} style={style}>
            <option value="">{placeholder}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
            {!options.includes(otherValue) && <option value={otherValue}>{otherValue}</option>}
        </select>
    );
}
