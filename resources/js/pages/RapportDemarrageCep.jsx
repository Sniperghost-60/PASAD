import { useEffect, useState } from 'react';
import { Sidebar, Header } from '../components/Layout';
import ModernNotification from '../components/ModernNotification';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

/* ── État initial ────────────────────────────────────────────────────── */
const initData = () => ({
    departement: '', commune_id: '', facilitateur: '', structure: 'FUPRO-BENIN', telephone: '',
    longitude: '', latitude: '',
    beneficiaires_villages: '', raison_installation: '',
    seance_sensibilisation: null, sensibilisation_total: '', sensibilisation_hommes: '',
    sensibilisation_femmes: '', sensibilisation_autorites: '',
    enquete_base: null, enquete_nb_seances: '', enquete_total: '', enquete_hommes: '',
    enquete_femmes: '', enquete_resultats_restitues: null, enquete_details: '',
    apprenants_total: '', apprenants_hommes: '', apprenants_femmes: '',
    choix_participants: '', nom_groupe: '', slogan_groupe: '', jour_animation: '',
    constitution_definie: null, sous_groupes: null, nb_sous_groupes: '',
    comite_en_place: null, postes_comite: [], autres_postes: '',
    site_identifie: null, statut_site: '',
});

const fromApi = (r) => ({
    departement:               r.departement              ?? '',
    commune_id:                r.commune_id               ? String(r.commune_id) : '',
    facilitateur:              r.facilitateur             ?? '',
    structure:                 r.structure                ?? 'FUPRO-BENIN',
    telephone:                 r.telephone                ?? '',
    longitude:                 r.longitude                ?? '',
    latitude:                  r.latitude                 ?? '',
    beneficiaires_villages:    r.beneficiaires_villages   ?? '',
    raison_installation:       r.raison_installation      ?? '',
    seance_sensibilisation:    r.seance_sensibilisation   ?? null,
    sensibilisation_total:     r.sensibilisation_total    != null ? String(r.sensibilisation_total)    : '',
    sensibilisation_hommes:    r.sensibilisation_hommes   != null ? String(r.sensibilisation_hommes)   : '',
    sensibilisation_femmes:    r.sensibilisation_femmes   != null ? String(r.sensibilisation_femmes)   : '',
    sensibilisation_autorites: r.sensibilisation_autorites ?? '',
    enquete_base:              r.enquete_base              ?? null,
    enquete_nb_seances:        r.enquete_nb_seances        != null ? String(r.enquete_nb_seances) : '',
    enquete_total:             r.enquete_total             != null ? String(r.enquete_total)       : '',
    enquete_hommes:            r.enquete_hommes            != null ? String(r.enquete_hommes)      : '',
    enquete_femmes:            r.enquete_femmes            != null ? String(r.enquete_femmes)      : '',
    enquete_resultats_restitues: r.enquete_resultats_restitues ?? null,
    enquete_details:           r.enquete_details           ?? '',
    apprenants_total:          r.apprenants_total          != null ? String(r.apprenants_total)    : '',
    apprenants_hommes:         r.apprenants_hommes         != null ? String(r.apprenants_hommes)   : '',
    apprenants_femmes:         r.apprenants_femmes         != null ? String(r.apprenants_femmes)   : '',
    choix_participants:        r.choix_participants        ?? '',
    nom_groupe:                r.nom_groupe                ?? '',
    slogan_groupe:             r.slogan_groupe             ?? '',
    jour_animation:            r.jour_animation            ?? '',
    constitution_definie:      r.constitution_definie      ?? null,
    sous_groupes:              r.sous_groupes              ?? null,
    nb_sous_groupes:           r.nb_sous_groupes           != null ? String(r.nb_sous_groupes) : '',
    comite_en_place:           r.comite_en_place           ?? null,
    postes_comite:             Array.isArray(r.postes_comite) ? r.postes_comite : [],
    autres_postes:             r.autres_postes             ?? '',
    site_identifie:            r.site_identifie            ?? null,
    statut_site:               r.statut_site               ?? '',
});

/* ── Contenu PDF avec styles 100% inline (aucun CSS global injecté) ───── */
function buildPdfContent(data, communes) {
    const communeName = communes.find(c => String(c.id) === String(data.commune_id))?.nom ?? '';
    const dot  = (v) => v || '…………………………………';
    const chk  = (v) => v ? '&#9745;' : '&#9744;';
    const postes = data.postes_comite || [];

    const S = {
        wrap:    'font-family:Arial,sans-serif;font-size:10px;color:#000;background:#fff;box-sizing:border-box',
        logoRow: 'display:flex;align-items:center;justify-content:space-between;border:1px solid #999;padding:5px 8px;margin-bottom:0',
        hRow:    'display:flex;border:1px solid #999;border-top:none',
        hCell:   'flex:1;padding:3px 6px;border-right:1px solid #ccc;font-size:10px',
        hCellL:  'flex:1;padding:3px 6px;font-size:10px',
        hCell2:  'flex:2;padding:3px 6px;border-right:1px solid #ccc;font-size:10px',
        secH:    'font-weight:bold;text-align:center;font-size:10.5px;padding:4px;background:#eee;border:1px solid #999;border-top:none',
        q:       'border:1px solid #ddd;border-top:none;padding:4px 6px;font-size:10px;line-height:1.5',
        qBlock:  'border:1px solid #ddd;border-top:none;padding:5px 6px;min-height:26px;font-size:10px;white-space:pre-wrap;line-height:1.5',
        qI:      'border:1px solid #ddd;border-top:none;padding:4px 6px 4px 20px;font-size:10px;line-height:1.5',
        qBI:     'border:1px solid #ddd;border-top:none;padding:5px 6px 5px 20px;min-height:24px;font-size:10px;white-space:pre-wrap',
        cbg:     'display:inline-flex;gap:12px;margin-left:5px',
        cb:      'display:inline-flex;align-items:center;gap:3px',
        b:       'font-weight:bold',
    };

    return `<div style="${S.wrap}">
<div style="${S.logoRow}">
    <img src="/images/ceplogo.png" alt="CEP" style="height:55px;object-fit:contain" />
    <div style="text-align:center;flex:1">
        <div style="font-size:13px;font-weight:bold;text-decoration:underline;text-transform:uppercase;letter-spacing:1px">RAPPORT DE DEMARRAGE DU CEP</div>
        <div style="font-size:9px;color:#555;margin-top:2px">AgriSuivi CEP — Champs Écoles Paysans</div>
    </div>
    <img src="/images/logofupro.png" alt="FUPRO" style="height:55px;object-fit:contain" />
</div>
<div style="${S.hRow}">
    <div style="${S.hCell}"><span style="${S.b}">Département :</span> ${dot(data.departement)}</div>
    <div style="${S.hCellL}"><span style="${S.b}">Commune :</span> ${dot(communeName)}</div>
</div>
<div style="${S.hRow}">
    <div style="${S.hCell}"><span style="${S.b}">Facilitateur :</span> ${dot(data.facilitateur)}</div>
    <div style="${S.hCell}"><span style="${S.b}">Structure :</span> ${dot(data.structure)}</div>
    <div style="${S.hCellL}"><span style="${S.b}">Téléphone :</span> ${dot(data.telephone)}</div>
</div>
<div style="${S.hRow}">
    <div style="${S.hCell2}"><span style="${S.b}">Coordonnées géographiques — Longitude :</span> ${dot(data.longitude)}</div>
    <div style="${S.hCellL}"><span style="${S.b}">Latitude :</span> ${dot(data.latitude)}</div>
</div>
<div style="${S.secH}">1. Activités préliminaires d'installation du CEP</div>
<div style="${S.q}"><span style="${S.b}">Qui sont les bénéficiaires du CEP</span> (Donner le(s) nom(s) du ou des villages ou de l'OP)</div>
<div style="${S.qBlock}">${data.beneficiaires_villages || ''}</div>
<div style="${S.q}"><span style="${S.b}">Pourquoi avez-vous choisi d'installer le CEP au profit de cette communauté ?</span></div>
<div style="${S.qBlock}">${data.raison_installation || ''}</div>
<div style="${S.q}">Avez-vous conduit une séance d'information-sensibilisation communautaire ?
    <span style="${S.cbg}"><span style="${S.cb}">${chk(data.seance_sensibilisation === true)} Oui</span><span style="${S.cb}">${chk(data.seance_sensibilisation === false)} Non</span></span>
</div>
${data.seance_sensibilisation ? `<div style="${S.qI}">Si oui, nombre total de participants : <b>${dot(data.sensibilisation_total)}</b> &nbsp; Hommes : <b>${dot(data.sensibilisation_hommes)}</b> &nbsp; Femmes : <b>${dot(data.sensibilisation_femmes)}</b></div>
<div style="${S.qI}">Précisez les autorités qui ont participé (Coutumiers, religieux, conseillers, etc.)</div>
<div style="${S.qBI}">${data.sensibilisation_autorites || ''}</div>` : ''}
<div style="${S.q}">Avez-vous conduit une enquête de base pour l'installation du CEP ?
    <span style="${S.cbg}"><span style="${S.cb}">${chk(data.enquete_base === true)} Oui</span><span style="${S.cb}">${chk(data.enquete_base === false)} Non</span></span>
</div>
${data.enquete_base ? `<div style="${S.qI}">Si oui, en combien de séances : <b>${dot(data.enquete_nb_seances)}</b></div>
<div style="${S.qI}">Nb. personnes en moyenne : Total <b>${dot(data.enquete_total)}</b> &nbsp; H <b>${dot(data.enquete_hommes)}</b> &nbsp; F <b>${dot(data.enquete_femmes)}</b></div>
<div style="${S.qI}">Avez-vous restitué les résultats à la communauté ?
    <span style="${S.cbg}"><span style="${S.cb}">${chk(data.enquete_resultats_restitues === true)} Oui</span><span style="${S.cb}">${chk(data.enquete_resultats_restitues === false)} Non</span></span>
</div>
<div style="${S.qBI}">${data.enquete_details || ''}</div>` : ''}
<div style="${S.q}">Combien d'apprenants sont inscrits : Total <b>${dot(data.apprenants_total)}</b> &nbsp; H <b>${dot(data.apprenants_hommes)}</b> &nbsp; F <b>${dot(data.apprenants_femmes)}</b></div>
<div style="${S.q}"><span style="${S.b}">Qui a choisi les participants au CEP :</span> ${dot(data.choix_participants)}</div>
<div style="${S.q}"><span style="${S.b}">Nom du groupe CEP :</span> ${dot(data.nom_groupe)}</div>
<div style="${S.q}"><span style="${S.b}">Slogan du groupe CEP :</span> ${dot(data.slogan_groupe)}</div>
<div style="${S.q}"><span style="${S.b}">Jour d'animation du CEP :</span> ${dot(data.jour_animation)}</div>
<div style="${S.q}">Le groupe a-t-il défini une constitution (règlement intérieur) ?
    <span style="${S.cbg}"><span style="${S.cb}">${chk(data.constitution_definie === true)} Oui</span><span style="${S.cb}">${chk(data.constitution_definie === false)} Non</span></span>
</div>
<div style="${S.q}">Le groupe est-il divisé en sous-groupe ?
    <span style="${S.cbg}"><span style="${S.cb}">${chk(data.sous_groupes === true)} Oui</span><span style="${S.cb}">${chk(data.sous_groupes === false)} Non</span></span>
    ${data.sous_groupes ? `&nbsp;&nbsp; Si oui, combien : <b>${dot(data.nb_sous_groupes)}</b>` : ''}
</div>
<div style="${S.q}">Le groupe a-t-il mis en place un comité ?
    <span style="${S.cbg}"><span style="${S.cb}">${chk(data.comite_en_place === true)} Oui</span><span style="${S.cb}">${chk(data.comite_en_place === false)} Non</span></span>
</div>
${data.comite_en_place ? `<div style="${S.qI}">Si oui, postes du comité :
    <span style="${S.cbg}"><span style="${S.cb}">${chk(postes.includes('president'))} Président</span><span style="${S.cb}">${chk(postes.includes('secretaire'))} Secrétaire</span><span style="${S.cb}">${chk(postes.includes('tresorier'))} Trésorier</span></span>
</div>` : ''}
<div style="${S.q}"><span style="${S.b}">Autres à préciser :</span> ${dot(data.autres_postes)}</div>
<div style="${S.q}">Avez-vous identifié un site pour le CEP ?
    <span style="${S.cbg}"><span style="${S.cb}">${chk(data.site_identifie === true)} Oui</span><span style="${S.cb}">${chk(data.site_identifie === false)} Non</span></span>
</div>
<div style="${S.q}">Statut du site ?
    <span style="${S.cbg}"><span style="${S.cb}">${chk(data.statut_site === 'accord_cession')} Accord de cession</span><span style="${S.cb}">${chk(data.statut_site === 'communautaire')} Communautaire</span><span style="${S.cb}">${chk(data.statut_site === 'location')} Location</span></span>
</div>
</div>`;
}

/* ── OuiNon ──────────────────────────────────────────────────────────── */
function OuiNon({ value, onChange, name }) {
    return (
        <span className="inline-flex items-center gap-4 ml-2">
            {[true, false].map(v => (
                <label key={String(v)} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name={name} checked={value === v}
                        onChange={() => onChange(v)} className="accent-teal-600 size-3.5" />
                    <span className="text-sm">{v ? 'Oui' : 'Non'}</span>
                </label>
            ))}
        </span>
    );
}

function Section({ title, children }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            {title && (
                <div className="bg-slate-100 border-b border-slate-200 px-5 py-2.5">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
                </div>
            )}
            <div className="px-5 py-4 space-y-4">{children}</div>
        </div>
    );
}

function FieldRow({ label, children }) {
    return (
        <div className="flex flex-wrap items-start gap-2">
            <span className="text-sm text-slate-600 font-medium shrink-0 mt-1.5">{label}</span>
            {children}
        </div>
    );
}

/* ── Page principale ─────────────────────────────────────────────────── */
export default function RapportDemarrageCep() {
    const { user, activeCommune, conseillerCommunes } = useAuth();

    const [data, setData]         = useState(initData());
    const [communes, setCommunes] = useState([]);
    const [saving, setSaving]     = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [loaded, setLoaded]     = useState(false);
    const [toast, setToast]       = useState({ show: false, message: '', type: 'success' });

    const set = (field, val) => setData(d => ({ ...d, [field]: val }));
    const togglePoste = (poste) => {
        setData(d => {
            const p = d.postes_comite ?? [];
            return { ...d, postes_comite: p.includes(poste) ? p.filter(x => x !== poste) : [...p, poste] };
        });
    };

    /* ── Charger communes + rapport existant ── */
    useEffect(() => {
        const communesList = conseillerCommunes.length > 0 ? conseillerCommunes : [];
        if (communesList.length > 0) setCommunes(communesList);

        api.get('/api/user/communes')
            .then(res => { if (Array.isArray(res.data)) setCommunes(res.data); })
            .catch(() => {});

        api.get('/api/rapport-demarrage-cep')
            .then(res => {
                if (res.data) {
                    setData(fromApi(res.data));
                }
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, []);

    /* ── Auto-remplir depuis le conseiller connecté (une seule fois, si pas de données sauvegardées) ── */
    useEffect(() => {
        if (!loaded) return;
        setData(prev => {
            // Seulement remplir les champs vides
            const updates = {};
            if (!prev.facilitateur && user?.name)       updates.facilitateur = user.name;
            if (!prev.structure)                         updates.structure    = 'FUPRO-BENIN';
            if (!prev.commune_id && activeCommune?.id)   updates.commune_id   = String(activeCommune.id);
            if (!prev.departement && activeCommune?.departement?.nom)
                updates.departement = activeCommune.departement.nom;
            return Object.keys(updates).length ? { ...prev, ...updates } : prev;
        });
    }, [loaded, user, activeCommune]);

    /* ── Soumission ── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...data,
                commune_id:             data.commune_id ? Number(data.commune_id) : null,
                sensibilisation_total:  data.sensibilisation_total  !== '' ? Number(data.sensibilisation_total)  : null,
                sensibilisation_hommes: data.sensibilisation_hommes !== '' ? Number(data.sensibilisation_hommes) : null,
                sensibilisation_femmes: data.sensibilisation_femmes !== '' ? Number(data.sensibilisation_femmes) : null,
                enquete_nb_seances:     data.enquete_nb_seances     !== '' ? Number(data.enquete_nb_seances)     : null,
                enquete_total:          data.enquete_total           !== '' ? Number(data.enquete_total)          : null,
                enquete_hommes:         data.enquete_hommes          !== '' ? Number(data.enquete_hommes)         : null,
                enquete_femmes:         data.enquete_femmes          !== '' ? Number(data.enquete_femmes)         : null,
                apprenants_total:       data.apprenants_total        !== '' ? Number(data.apprenants_total)       : null,
                apprenants_hommes:      data.apprenants_hommes       !== '' ? Number(data.apprenants_hommes)      : null,
                apprenants_femmes:      data.apprenants_femmes       !== '' ? Number(data.apprenants_femmes)      : null,
                nb_sous_groupes:        data.nb_sous_groupes         !== '' ? Number(data.nb_sous_groupes)        : null,
            };
            const res = await api.post('/api/rapport-demarrage-cep', payload);
            setToast({ show: true, message: res.data.message, type: 'success' });
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.message || 'Erreur.', type: 'error' });
        } finally { setSaving(false); }
    };

    /* ── Téléchargement PDF direct (div temporaire, pas de CSS global) ── */
    const downloadPdf = async () => {
        setDownloading(true);
        try {
            const { default: html2pdf } = await import('html2pdf.js');

            // Div temporaire hors-écran — NE pollue pas les styles globaux
            const tmp = document.createElement('div');
            tmp.style.cssText = 'position:absolute;left:-9999px;top:0;width:794px;background:#fff';
            tmp.innerHTML = buildPdfContent(data, communes);
            document.body.appendChild(tmp);

            await html2pdf()
                .set({
                    margin:      [8, 8, 8, 8],
                    filename:    'rapport-demarrage-cep.pdf',
                    image:       { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, logging: false },
                    jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
                    pagebreak:   { mode: 'avoid-all' },
                })
                .from(tmp)
                .save();

            document.body.removeChild(tmp);
        } catch {
            setToast({ show: true, message: 'Erreur lors du téléchargement PDF.', type: 'error' });
        } finally { setDownloading(false); }
    };

    /* ── Styles ── */
    const iCls  = 'flex-1 min-w-[160px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all';
    const taCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all resize-none';
    const nCls  = 'w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-center outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all';
    const sCls  = 'flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all';

    const postes = data.postes_comite ?? [];

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-60">
                <Header title="Rapport de Démarrage du CEP" />

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-5 max-w-4xl">

                        {/* ── Logo header (identique au style login) ── */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#062824] to-teal-800">
                                {/* Logo CEP */}
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white/95 ring-1 ring-white/60 overflow-hidden shadow-lg">
                                        <img src="/images/ceplogo.png" alt="CEP" className="h-full w-full object-contain p-1" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm">AgriSuivi CEP</p>
                                        <p className="text-cyan-200/70 text-xs">Champs Écoles Paysans</p>
                                    </div>
                                </div>

                                {/* Titre */}
                                <div className="text-center">
                                    <h2 className="text-white text-lg font-extrabold uppercase tracking-widest underline decoration-2 underline-offset-4">
                                        Rapport de Démarrage du CEP
                                    </h2>
                                </div>

                                {/* Logo FUPRO */}
                                <div className="flex items-center gap-3">
                                    <div>
                                        <p className="text-white font-bold text-sm text-right">FUPRO-BENIN</p>
                                        <p className="text-cyan-200/70 text-xs text-right">Structure d'appui</p>
                                    </div>
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white/95 ring-1 ring-white/60 overflow-hidden shadow-lg">
                                        <img src="/images/logofupro.png" alt="FUPRO" className="h-full w-full object-contain p-1" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Informations générales ── */}
                        <Section title="Informations générales">
                            <div className="grid grid-cols-2 gap-3">
                                <FieldRow label="Département :">
                                    <input value={data.departement}
                                        onChange={e => set('departement', e.target.value)}
                                        placeholder="Département…" className={iCls} />
                                </FieldRow>
                                <FieldRow label="Commune :">
                                    <select value={data.commune_id}
                                        onChange={e => set('commune_id', e.target.value)}
                                        className={sCls}>
                                        <option value="">— Sélectionner —</option>
                                        {communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                                    </select>
                                </FieldRow>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <FieldRow label="Facilitateur :">
                                    <input value={data.facilitateur}
                                        onChange={e => set('facilitateur', e.target.value)}
                                        placeholder="Nom du facilitateur…" className={iCls} />
                                </FieldRow>
                                <FieldRow label="Structure :">
                                    <input value={data.structure}
                                        onChange={e => set('structure', e.target.value)}
                                        className={`${iCls} font-semibold text-teal-700`} />
                                </FieldRow>
                                <FieldRow label="Téléphone :">
                                    <input value={data.telephone}
                                        onChange={e => set('telephone', e.target.value)}
                                        placeholder="…" className={iCls} />
                                </FieldRow>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <FieldRow label="Longitude :">
                                    <input value={data.longitude}
                                        onChange={e => set('longitude', e.target.value)}
                                        placeholder="ex: -2.1234" className={iCls} />
                                </FieldRow>
                                <FieldRow label="Latitude :">
                                    <input value={data.latitude}
                                        onChange={e => set('latitude', e.target.value)}
                                        placeholder="ex: 11.5678" className={iCls} />
                                </FieldRow>
                            </div>
                        </Section>

                        {/* ── Section 1 ── */}
                        <Section title="1. Activités préliminaires d'installation du CEP">

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Qui sont les bénéficiaires du CEP ?
                                    <span className="font-normal text-slate-400 ml-1">(Donner le(s) nom(s) du ou des villages ou de l'OP)</span>
                                </label>
                                <textarea rows={3} value={data.beneficiaires_villages}
                                    onChange={e => set('beneficiaires_villages', e.target.value)} className={taCls} />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Pourquoi avez-vous choisi d'installer le CEP au profit de cette communauté ?
                                </label>
                                <textarea rows={3} value={data.raison_installation}
                                    onChange={e => set('raison_installation', e.target.value)} className={taCls} />
                            </div>

                            {/* Séance sensibilisation */}
                            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                                <FieldRow label="Avez-vous conduit une séance d'information-sensibilisation communautaire ?">
                                    <OuiNon value={data.seance_sensibilisation} onChange={v => set('seance_sensibilisation', v)} name="sensib" />
                                </FieldRow>
                                {data.seance_sensibilisation && (
                                    <div className="pl-4 border-l-2 border-teal-200 space-y-3">
                                        <div className="flex flex-wrap items-center gap-4">
                                            {[['sensibilisation_total','Total'],['sensibilisation_hommes','Hommes'],['sensibilisation_femmes','Femmes']].map(([f,l]) => (
                                                <label key={f} className="flex items-center gap-2 text-sm">
                                                    <span className="text-slate-600">{l} :</span>
                                                    <input type="number" min="0" value={data[f]} onChange={e => set(f, e.target.value)} className={nCls} />
                                                </label>
                                            ))}
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-600 mb-1">
                                                Précisez les autorités qui ont participé
                                                <span className="text-slate-400 ml-1">(Coutumiers, religieux, conseillers, etc.)</span>
                                            </label>
                                            <textarea rows={2} value={data.sensibilisation_autorites}
                                                onChange={e => set('sensibilisation_autorites', e.target.value)} className={taCls} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Enquête de base */}
                            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                                <FieldRow label="Avez-vous conduit une enquête de base pour l'installation du CEP ?">
                                    <OuiNon value={data.enquete_base} onChange={v => set('enquete_base', v)} name="enquete" />
                                </FieldRow>
                                {data.enquete_base && (
                                    <div className="pl-4 border-l-2 border-teal-200 space-y-3">
                                        <FieldRow label="En combien de séances avez-vous réalisé l'enquête de base :">
                                            <input type="number" min="0" value={data.enquete_nb_seances}
                                                onChange={e => set('enquete_nb_seances', e.target.value)} className={nCls} />
                                        </FieldRow>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <span className="text-sm text-slate-600">Nb. personnes en moyenne :</span>
                                            {[['enquete_total','Total'],['enquete_hommes','Hommes'],['enquete_femmes','Femmes']].map(([f,l]) => (
                                                <label key={f} className="flex items-center gap-2 text-sm">
                                                    <span className="text-slate-600">{l} :</span>
                                                    <input type="number" min="0" value={data[f]} onChange={e => set(f, e.target.value)} className={nCls} />
                                                </label>
                                            ))}
                                        </div>
                                        <FieldRow label="Avez-vous restitué les résultats à la communauté ?">
                                            <OuiNon value={data.enquete_resultats_restitues} onChange={v => set('enquete_resultats_restitues', v)} name="restitue" />
                                        </FieldRow>
                                        <textarea rows={2} placeholder="Détails…" value={data.enquete_details}
                                            onChange={e => set('enquete_details', e.target.value)} className={taCls} />
                                    </div>
                                )}
                            </div>

                            {/* Apprenants */}
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="text-sm font-semibold text-slate-700">Apprenants inscrits pour le CEP :</span>
                                {[['apprenants_total','Total'],['apprenants_hommes','Hommes'],['apprenants_femmes','Femmes']].map(([f,l]) => (
                                    <label key={f} className="flex items-center gap-2 text-sm">
                                        <span className="text-slate-600">{l} :</span>
                                        <input type="number" min="0" value={data[f]} onChange={e => set(f, e.target.value)} className={nCls} />
                                    </label>
                                ))}
                            </div>

                            <FieldRow label="Qui a choisi les participants au CEP :">
                                <input value={data.choix_participants} onChange={e => set('choix_participants', e.target.value)} placeholder="…" className={iCls} />
                            </FieldRow>
                            <FieldRow label="Nom du groupe CEP :">
                                <input value={data.nom_groupe} onChange={e => set('nom_groupe', e.target.value)} placeholder="…" className={iCls} />
                            </FieldRow>
                            <FieldRow label="Slogan du groupe CEP :">
                                <input value={data.slogan_groupe} onChange={e => set('slogan_groupe', e.target.value)} placeholder="…" className={iCls} />
                            </FieldRow>
                            <FieldRow label="Jour d'animation du CEP :">
                                <input value={data.jour_animation} onChange={e => set('jour_animation', e.target.value)} placeholder="ex: Mercredi" className={iCls} />
                            </FieldRow>

                            <FieldRow label="Le groupe a-t-il défini une constitution (règlement intérieur) ?">
                                <OuiNon value={data.constitution_definie} onChange={v => set('constitution_definie', v)} name="constit" />
                            </FieldRow>

                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-sm font-semibold text-slate-700">Le groupe est-il divisé en sous-groupe ?</span>
                                <OuiNon value={data.sous_groupes} onChange={v => set('sous_groupes', v)} name="sousgr" />
                                {data.sous_groupes && (
                                    <label className="flex items-center gap-2 text-sm">
                                        <span className="text-slate-600">Nombre :</span>
                                        <input type="number" min="0" value={data.nb_sous_groupes}
                                            onChange={e => set('nb_sous_groupes', e.target.value)} className={nCls} />
                                    </label>
                                )}
                            </div>

                            {/* Comité */}
                            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                                <FieldRow label="Le groupe a-t-il mis en place un comité ?">
                                    <OuiNon value={data.comite_en_place} onChange={v => set('comite_en_place', v)} name="comite" />
                                </FieldRow>
                                {data.comite_en_place && (
                                    <div className="pl-4 border-l-2 border-teal-200">
                                        <p className="text-sm text-slate-600 mb-2">Postes du comité :</p>
                                        <div className="flex flex-wrap gap-4">
                                            {[['president','Président'],['secretaire','Secrétaire'],['tresorier','Trésorier']].map(([v,l]) => (
                                                <label key={v} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                                                    <input type="checkbox" checked={postes.includes(v)} onChange={() => togglePoste(v)} className="accent-teal-600 size-4" />
                                                    {l}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <FieldRow label="Autres à préciser :">
                                <input value={data.autres_postes} onChange={e => set('autres_postes', e.target.value)} placeholder="…" className={iCls} />
                            </FieldRow>

                            <FieldRow label="Avez-vous identifié un site pour le CEP ?">
                                <OuiNon value={data.site_identifie} onChange={v => set('site_identifie', v)} name="site" />
                            </FieldRow>

                            <div className="flex flex-wrap items-center gap-4">
                                <span className="text-sm font-semibold text-slate-700">Statut du site :</span>
                                {[['accord_cession','Accord de cession'],['communautaire','Communautaire'],['location','Location']].map(([v,l]) => (
                                    <label key={v} className="flex items-center gap-2 cursor-pointer text-sm">
                                        <input type="radio" name="statut_site" value={v}
                                            checked={data.statut_site === v} onChange={() => set('statut_site', v)}
                                            className="accent-teal-600 size-3.5" />
                                        {l}
                                    </label>
                                ))}
                            </div>
                        </Section>

                        {/* ── Actions ── */}
                        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
                            {/* Télécharger PDF */}
                            <button type="button" onClick={downloadPdf} disabled={downloading}
                                className="flex items-center gap-2 rounded-xl border-2 border-teal-600 bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors">
                                {downloading
                                    ? <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                    : <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                                }
                                {downloading ? 'Génération…' : 'Télécharger PDF'}
                            </button>

                            <div className="flex items-center gap-3">
                                <button type="button" onClick={() => setData(initData())}
                                    className="px-5 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                                    Réinitialiser
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#062824] text-sm font-bold text-white shadow-sm hover:bg-[#062824]/80 disabled:opacity-50 transition-all">
                                    {saving && <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    Enregistrer
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <ModernNotification show={toast.show} message={toast.message} type={toast.type}
                    onClose={() => setToast(t => ({ ...t, show: false }))} />
            </main>
        </div>
    );
}
