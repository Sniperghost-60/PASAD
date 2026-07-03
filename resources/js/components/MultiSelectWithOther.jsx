import SelectWithOther from './SelectWithOther';

/**
 * Variante de saisie multiple (ajout/suppression de lignes) où chaque ligne
 * est un SelectWithOther plutôt qu'un champ texte libre.
 */
export default function MultiSelectWithOther({ values, onChange, options, placeholder }) {
    const add    = () => onChange([...values, '']);
    const remove = (i) => onChange(values.length > 1 ? values.filter((_, idx) => idx !== i) : ['']);
    const update = (i, v) => onChange(values.map((val, idx) => idx === i ? v : val));

    return (
        <div className="space-y-1">
            {values.map((val, i) => (
                <div key={i} className="flex items-start gap-1">
                    <div className="flex-1">
                        <SelectWithOther
                            value={val}
                            onChange={v => update(i, v)}
                            options={options}
                            placeholder={placeholder}
                            customPlaceholder="Préciser…"
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all"
                        />
                    </div>
                    <button type="button" onClick={() => remove(i)}
                        className="mt-0.5 flex size-6 flex-shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-400 hover:bg-red-100 transition-colors">
                        <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
            <button type="button" onClick={add}
                className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-800 transition-colors">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Ajouter
            </button>
        </div>
    );
}
