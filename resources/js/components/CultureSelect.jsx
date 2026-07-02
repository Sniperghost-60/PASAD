import SelectWithOther from './SelectWithOther';
import { CULTURES_BENIN } from '../utils/cultures';

/**
 * Sélecteur de culture/spéculation basé sur la base globale des cultures du Bénin,
 * avec une option "Autre (à préciser)" qui bascule vers une saisie libre.
 */
export default function CultureSelect({ value, onChange, className, style, placeholder = '— Culture —' }) {
    return (
        <SelectWithOther
            value={value}
            onChange={onChange}
            options={CULTURES_BENIN}
            className={className}
            style={style}
            placeholder={placeholder}
            customPlaceholder="Préciser la culture"
        />
    );
}
