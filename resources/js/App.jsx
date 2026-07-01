import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider }            from './contexts/AuthContext';
import { GuestRoute, ProtectedRoute, CommuneSelectionRoute } from './components/AuthGuards';
import Login           from './pages/Login';
import Register        from './pages/Register';
import ForgotPassword  from './pages/ForgotPassword';
import Dashboard       from './pages/Dashboard';
import UsersManagement  from './pages/UsersManagement';
import CreateUser       from './pages/CreateUser';
import EditUser         from './pages/EditUser';
import RolesManagement  from './pages/RolesManagement';
import GeographyManagement from './pages/GeographyManagement';
import ProfilHistorique from './pages/ProfilHistorique';
import ProfilHistoriqueList from './pages/ProfilHistoriqueList';
import HierarchisationDomainesActivites from './pages/HierarchisationDomainesActivites';
import HierarchisationSpeculationsAgricoles from './pages/HierarchisationSpeculationsAgricoles';
import MatriceProblemesSolutions from './pages/MatriceProblemesSolutions';
import CurriculumApprentissageCep from './pages/CurriculumApprentissageCep';
import ResumeProtocolesExperimentations from './pages/ResumeProtocolesExperimentations';
import ListePresenceSensibilisation from './pages/ListePresenceSensibilisation';
import IdentificationParticipantsCep from './pages/IdentificationParticipantsCep';
import GestionCep from './pages/GestionCep';
import AnimationSessionsCep from './pages/AnimationSessionsCep';
import BaseBeneficiairesIntervention from './pages/BaseBeneficiairesIntervention';
import BilanSessionsAnimationCep from './pages/BilanSessionsAnimationCep';
import OrganisationVisitesEchanges from './pages/OrganisationVisitesEchanges';
import VisitesEchangesCommentees from './pages/VisitesEchangesCommentees';
import DifficulteSuggestions from './pages/DifficulteSuggestions';
import EvolutionRendementsCep from './pages/EvolutionRendementsCep';
import RendementDispositif from './pages/RendementDispositif';
import RapportDemarrageCep from './pages/RapportDemarrageCep';
import MonProfil from './pages/MonProfil';
import StatistiquesCep from './pages/StatistiquesCep';
import CommuneSelection from './pages/CommuneSelection';
import ComingSoon       from './pages/ComingSoon';
import AppVersionManagement from './pages/AppVersionManagement';
import CaiListeProducteurs  from './pages/CaiListeProducteurs';
import CaiListeOrganisations from './pages/CaiListeOrganisations';
import CaiNegociationAccord        from './pages/CaiNegociationAccord';
import CaiMarchesCaracterisation  from './pages/CaiMarchesCaracterisation';
import CaiFacteursLimitant        from './pages/CaiFacteursLimitant';
import CaiEtudeMarche             from './pages/CaiEtudeMarche';
import CaiAgroecologieProducteurs from './pages/CaiAgroecologieProducteurs';
import CaiAppuiMarche             from './pages/CaiAppuiMarche';
import CaiProgrammationMarche     from './pages/CaiProgrammationMarche';
import CaiProgrammeQuinzaine      from './pages/CaiProgrammeQuinzaine';
import CaiJournalCaisse           from './pages/CaiJournalCaisse';
import CaiFicheStock              from './pages/CaiFicheStock';
import CaiEvolutionRendementsCep  from './pages/CaiEvolutionRendementsCep';
import CaiEvolutionRendementsUd          from './pages/CaiEvolutionRendementsUd';
import CaiEvolutionProduitsChimiques     from './pages/CaiEvolutionProduitsChimiques';
import CaiEvolutionProduitsOrganiques    from './pages/CaiEvolutionProduitsOrganiques';
import CaiEvolutionEspeces              from './pages/CaiEvolutionEspeces';
import CaiAnalyseQualiteSols           from './pages/CaiAnalyseQualiteSols';
import CaiCoutTransaction              from './pages/CaiCoutTransaction';

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Routes publiques (redirige vers /dashboard si déjà connecté) */}
                <Route element={<GuestRoute />}>
                    <Route path="/login"           element={<Login />} />
                    <Route path="/register"        element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                </Route>

                {/* Sélection de commune (Conseiller multi-communes) */}
                <Route element={<CommuneSelectionRoute />}>
                    <Route path="/choisir-commune" element={<CommuneSelection />} />
                </Route>

                {/* Routes protégées */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* Gestion des utilisateurs */}
                    <Route path="/dashboard/users"         element={<UsersManagement />} />
                    <Route path="/dashboard/users/create"  element={<CreateUser />} />
                    <Route path="/dashboard/users/:id/edit" element={<EditUser />} />

                    {/* Profil Historique */}
                    <Route path="/profil-historique" element={<ProfilHistorique />} />
                    <Route path="/profil-historique/liste" element={<ProfilHistoriqueList />} />
                    <Route path="/hierarchisation-domaines-activites" element={<HierarchisationDomainesActivites />} />
                    <Route path="/hierarchisation-speculations-agricoles" element={<HierarchisationSpeculationsAgricoles />} />
                    <Route path="/matrice-problemes-solutions" element={<MatriceProblemesSolutions />} />
                    <Route path="/curriculum-apprentissage-cep" element={<CurriculumApprentissageCep />} />
                    <Route path="/resume-protocoles-experimentations" element={<ResumeProtocolesExperimentations />} />
                    <Route path="/liste-presence-sensibilisation" element={<ListePresenceSensibilisation />} />
                    <Route path="/identification-participants-cep" element={<IdentificationParticipantsCep />} />
                    <Route path="/gestion-cep" element={<GestionCep />} />
                    <Route path="/animation-sessions-cep" element={<AnimationSessionsCep />} />
                    <Route path="/base-beneficiaires-intervention" element={<BaseBeneficiairesIntervention />} />
                    <Route path="/bilan-sessions-animation-cep" element={<BilanSessionsAnimationCep />} />
                    <Route path="/organisation-visites-echanges" element={<OrganisationVisitesEchanges />} />
                    <Route path="/visites-echanges-commentees" element={<VisitesEchangesCommentees />} />
                    <Route path="/difficultes-suggestions" element={<DifficulteSuggestions />} />
                    <Route path="/evolution-rendements-cep" element={<EvolutionRendementsCep />} />
                    <Route path="/rendement-dispositif" element={<RendementDispositif />} />
                    <Route path="/rapport-demarrage-cep" element={<RapportDemarrageCep />} />
                    <Route path="/mon-profil" element={<MonProfil />} />
                    <Route path="/statistiques-cep" element={<StatistiquesCep />} />

                    {/* ── CAI (Conseil Agricole Intégré) */}
                    <Route path="/cai/liste-producteurs"   element={<CaiListeProducteurs />} />
                    <Route path="/cai/liste-organisations" element={<CaiListeOrganisations />} />
                    <Route path="/cai/negociation-accord"       element={<CaiNegociationAccord />} />
                    <Route path="/cai/marches-caracterisation" element={<CaiMarchesCaracterisation />} />
                    <Route path="/cai/facteurs-limitant"       element={<CaiFacteursLimitant />} />
                    <Route path="/cai/etude-marche"           element={<CaiEtudeMarche />} />
                    <Route path="/cai/agroecologie-producteurs" element={<CaiAgroecologieProducteurs />} />
                    <Route path="/cai/appui-marche"            element={<CaiAppuiMarche />} />
                    <Route path="/cai/programmation-marche"    element={<CaiProgrammationMarche />} />
                    <Route path="/cai/programme-quinzaine"     element={<CaiProgrammeQuinzaine />} />
                    <Route path="/cai/journal-caisse"          element={<CaiJournalCaisse />} />
                    <Route path="/cai/fiche-stock"             element={<CaiFicheStock />} />
                    <Route path="/cai/evolution-rendements-cep" element={<CaiEvolutionRendementsCep />} />
                    <Route path="/cai/evolution-rendements-ud"        element={<CaiEvolutionRendementsUd />} />
                    <Route path="/cai/evolution-produits-chimiques"   element={<CaiEvolutionProduitsChimiques />} />
                    <Route path="/cai/evolution-produits-organiques"  element={<CaiEvolutionProduitsOrganiques />} />
                    <Route path="/cai/evolution-especes"              element={<CaiEvolutionEspeces />} />
                    <Route path="/cai/analyse-qualite-sols"           element={<CaiAnalyseQualiteSols />} />
                    <Route path="/cai/cout-transaction"               element={<CaiCoutTransaction />} />

                    {/* Modules à venir */}
                    <Route path="/producteurs"        element={<ComingSoon title="Producteurs"    icon="users"    />} />
                    <Route path="/producteurs/create" element={<ComingSoon title="Nouveau producteur" icon="users" />} />
                    <Route path="/parcelles"          element={<ComingSoon title="Parcelles"      icon="parcelles" />} />
                    <Route path="/parcelles/create"   element={<ComingSoon title="Nouvelle parcelle" icon="parcelles" />} />
                    <Route path="/suivis"             element={<ComingSoon title="Suivis CEP"     icon="suivis"   />} />
                    <Route path="/suivis/create"      element={<ComingSoon title="Nouveau suivi"  icon="suivis"   />} />
                    <Route path="/cultures"           element={<ComingSoon title="Cultures"       icon="cultures" />} />
                    <Route path="/caisse"             element={<ComingSoon title="Caisse & Stock" icon="caisse"   />} />
                    <Route path="/rapports"           element={<ComingSoon title="Rapports"       icon="rapports" />} />
                    <Route path="/stats"              element={<ComingSoon title="Statistiques"   icon="stats"    />} />
                    <Route path="/roles"              element={<RolesManagement />} />
                    <Route path="/geographie"         element={<GeographyManagement />} />
                    <Route path="/app-version"        element={<AppVersionManagement />} />
                    <Route path="/config"             element={<ComingSoon title="Configuration"  icon="settings" />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </AuthProvider>
    );
}
