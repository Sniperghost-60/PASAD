import React, { useEffect, useState } from 'react';
import { Header, Icon, ICONS } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

const API = (path) => `/api${path}`;

function VersionBadge({ version, color = 'teal' }) {
    const colors = {
        teal:   'bg-teal-100 text-teal-800 border-teal-200',
        amber:  'bg-amber-100 text-amber-800 border-amber-200',
        red:    'bg-red-100 text-red-800 border-red-200',
        slate:  'bg-slate-100 text-slate-600 border-slate-200',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${colors[color]}`}>
            <span className="font-mono">v{version}</span>
        </span>
    );
}

function Field({ label, hint, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</label>
            {hint && <p className="text-xs text-slate-400">{hint}</p>}
            {children}
        </div>
    );
}

function Input({ ...props }) {
    return (
        <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-mono text-slate-800 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
            {...props}
        />
    );
}

export default function AppVersionManagement() {
    const { token } = useAuth();

    const [config, setConfig]     = useState(null);
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [success, setSuccess]   = useState(false);
    const [error, setError]       = useState(null);

    const [form, setForm] = useState({
        min_version:    '1.0.0',
        latest_version: '1.0.0',
        force_update:   false,
        android_url:    '',
        ios_url:        '',
        release_notes:  '',
    });

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(API('/app/version'), {
                    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                });
                if (!res.ok) throw new Error('Erreur de chargement');
                const data = await res.json();
                setConfig(data);
                setForm({
                    min_version:    data.min_version    ?? '1.0.0',
                    latest_version: data.latest_version ?? '1.0.0',
                    force_update:   data.force_update   ?? false,
                    android_url:    data.android_url    ?? '',
                    ios_url:        data.ios_url        ?? '',
                    release_notes:  data.release_notes  ?? '',
                });
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const res = await fetch(API('/app/version'), {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...form,
                    android_url:   form.android_url   || null,
                    ios_url:       form.ios_url       || null,
                    release_notes: form.release_notes || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message ?? 'Erreur lors de la sauvegarde');
            setConfig(data.config);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const set = (key) => (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm(f => ({ ...f, [key]: val }));
    };

    const isForceChanged = config && form.force_update !== config.force_update;
    const isMinChanged   = config && form.min_version !== config.min_version;

    return (
        <div className="min-h-screen bg-slate-50">
            <Header
                title="Gestion des versions"
                subtitle="Contrôle des mises à jour de l'application mobile PASAD"
            />

            <div className="p-6 max-w-3xl mx-auto space-y-6">

                {/* Statut actuel */}
                {config && !loading && (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                                <Icon d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v6l4 2-1 1.73-5-2.93V7h2z" className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-800">Statut actuel</h2>
                                <p className="text-xs text-slate-400">Configuration en production</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-slate-100">
                            <Stat label="Version minimale" value={<VersionBadge version={config.min_version} color={isMinChanged ? 'amber' : 'teal'} />} />
                            <Stat label="Dernière version" value={<VersionBadge version={config.latest_version} color="slate" />} />
                            <Stat label="Mise à jour forcée" value={
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                    config.force_update
                                        ? 'bg-red-100 text-red-700 border-red-200'
                                        : 'bg-green-100 text-green-700 border-green-200'
                                }`}>
                                    <span className={`size-1.5 rounded-full ${config.force_update ? 'bg-red-500' : 'bg-green-500'}`} />
                                    {config.force_update ? 'Oui' : 'Non'}
                                </span>
                            } />
                            <Stat label="Publié par" value={
                                <span className="text-xs font-semibold text-slate-600">
                                    {config.published_by ? `Utilisateur #${config.published_by}` : 'Système'}
                                </span>
                            } />
                        </div>
                    </div>
                )}

                {/* Alertes */}
                {success && (
                    <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                        <Icon d={ICONS.check} className="size-4 text-green-500 flex-shrink-0" />
                        Configuration publiée. L'application mobile détectera la nouvelle version au prochain démarrage.
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        <Icon d={ICONS.x} className="size-4 text-red-500 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Formulaire */}
                <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <Icon d={ICONS.edit} className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800">Publier une nouvelle version</h2>
                            <p className="text-xs text-slate-400">Les utilisateurs seront notifiés au prochain lancement de l'app</p>
                        </div>
                    </div>

                    <div className="px-6 py-5 space-y-5">
                        {/* Versions */}
                        <div className="grid grid-cols-2 gap-4">
                            <Field
                                label="Version minimale requise"
                                hint="Les appareils sous cette version seront bloqués"
                            >
                                <Input
                                    type="text"
                                    value={form.min_version}
                                    onChange={set('min_version')}
                                    placeholder="ex : 1.2.0"
                                    pattern="\d+\.\d+\.\d+"
                                    required
                                />
                            </Field>
                            <Field
                                label="Dernière version disponible"
                                hint="Version la plus récente publiée sur les stores"
                            >
                                <Input
                                    type="text"
                                    value={form.latest_version}
                                    onChange={set('latest_version')}
                                    placeholder="ex : 1.2.0"
                                    pattern="\d+\.\d+\.\d+"
                                    required
                                />
                            </Field>
                        </div>

                        {/* Forcer la mise à jour */}
                        <div className={`flex items-start gap-4 rounded-xl border p-4 transition ${
                            form.force_update
                                ? 'border-red-200 bg-red-50'
                                : 'border-slate-200 bg-slate-50'
                        }`}>
                            <input
                                id="force_update"
                                type="checkbox"
                                checked={form.force_update}
                                onChange={set('force_update')}
                                className="mt-0.5 size-4 rounded border-slate-300 accent-red-600"
                            />
                            <label htmlFor="force_update" className="flex-1 cursor-pointer">
                                <span className={`block text-sm font-bold ${form.force_update ? 'text-red-700' : 'text-slate-700'}`}>
                                    Bloquer les anciennes versions
                                </span>
                                <span className="text-xs text-slate-500 mt-0.5 block">
                                    Si activé, toute version en dessous de la version minimale affiche un écran de blocage
                                    non contournable. L'utilisateur ne peut plus accéder à l'app sans mettre à jour.
                                </span>
                            </label>
                        </div>

                        {/* Lien de téléchargement */}
                        <Field
                            label="Lien de téléchargement APK (Android)"
                            hint="URL directe vers le fichier .apk — lien EAS Build ou fichier hébergé sur votre serveur"
                        >
                            <Input
                                type="url"
                                value={form.android_url}
                                onChange={set('android_url')}
                                placeholder="https://pasad.sidem-benin.net/downloads/pasad-1.2.0.apk"
                            />
                        </Field>
                        <Field
                            label="Lien de téléchargement IPA (iOS) — optionnel"
                            hint="URL directe vers le fichier .ipa si une version iOS existe"
                        >
                            <Input
                                type="url"
                                value={form.ios_url}
                                onChange={set('ios_url')}
                                placeholder="https://pasad.sidem-benin.net/downloads/pasad-1.2.0.ipa"
                            />
                        </Field>

                        {/* Notes de version */}
                        <Field
                            label="Notes de mise à jour"
                            hint="Texte affiché sur l'écran de mise à jour (améliorations, corrections…)"
                        >
                            <textarea
                                rows={4}
                                value={form.release_notes}
                                onChange={set('release_notes')}
                                placeholder={"• Nouvelle fonctionnalité X\n• Correction du bug Y\n• Amélioration des performances"}
                                maxLength={2000}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition resize-none"
                            />
                            <p className="text-right text-xs text-slate-400">{form.release_notes.length}/2000</p>
                        </Field>

                        {/* Alerte changement critique */}
                        {(isForceChanged || isMinChanged) && (
                            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                                <svg className="size-4 flex-shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                </svg>
                                <div>
                                    <strong>Changement critique détecté.</strong>
                                    {isMinChanged && (
                                        <span> La version minimale passe de <b>v{config.min_version}</b> à <b>v{form.min_version}</b>.</span>
                                    )}
                                    {isForceChanged && form.force_update && (
                                        <span> Le blocage forcé sera <b>activé</b> — les utilisateurs non à jour seront bloqués immédiatement.</span>
                                    )}
                                    {isForceChanged && !form.force_update && (
                                        <span> Le blocage forcé sera <b>désactivé</b>.</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3">
                        <button
                            type="submit"
                            disabled={saving || loading}
                            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition"
                        >
                            {saving ? (
                                <>
                                    <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Publication…
                                </>
                            ) : (
                                <>
                                    <Icon d={ICONS.check} className="size-4" />
                                    Publier la configuration
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Explication du mécanisme */}
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-6 py-5 space-y-3">
                    <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                        <Icon d={ICONS.shield} className="size-4 text-blue-500" />
                        Comment fonctionne la vérification ?
                    </h3>
                    <div className="space-y-2 text-xs text-blue-700">
                        <p>
                            <strong>1. Générez le nouvel APK</strong> avec EAS Build
                            (ex: <code className="font-mono bg-blue-100 px-1 rounded">eas build --platform android</code>),
                            puis copiez l'URL de téléchargement du fichier <code className="font-mono bg-blue-100 px-1 rounded">.apk</code> dans le champ ci-dessus.
                        </p>
                        <p>
                            <strong>2. Publiez ici</strong> — Renseignez la nouvelle version minimale, collez le lien APK,
                            activez le blocage si nécessaire, puis cliquez "Publier".
                        </p>
                        <p>
                            <strong>3. L'utilisateur voit l'écran de mise à jour</strong> — Un bouton
                            "Télécharger la mise à jour" ouvre directement le lien APK.
                            L'utilisateur installe le fichier et relance l'app.
                        </p>
                        <p>
                            <strong>4. Preuve automatique</strong> — La version est <strong>gravée dans le binaire APK</strong> lors du
                            build EAS et ne peut pas être falsifiée. Après installation, l'app envoie sa nouvelle version
                            au serveur et le blocage se lève automatiquement sans intervention manuelle.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div className="flex flex-col gap-1.5 px-6 py-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
            <div>{value}</div>
        </div>
    );
}
