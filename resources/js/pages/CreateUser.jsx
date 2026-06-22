import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Header } from '../components/Layout';
import Toast from '../components/Toast';
import api from '../services/api';

export default function CreateUser() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  // Vérifier la permission
  useEffect(() => {
    if (!hasPermission('utilisateurs.créer')) {
      navigate('/dashboard');
    }
  }, [hasPermission, navigate]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: '',
  });

  const [departements, setDepartements] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [selectedDepartement, setSelectedDepartement] = useState('');
  const [selectedCommunes, setSelectedCommunes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  const roles = ['Conseiller', 'Superviseur', 'Administrateur', 'Super-Admin'];

  // Charger les départements au montage
  useEffect(() => {
    const fetchDepartements = async () => {
      try {
        const res = await api.get('/departements');
        setDepartements(res.data);
      } catch (err) {
        console.error('Erreur chargement départements:', err);
      }
    };
    fetchDepartements();
  }, []);

  // Charger les communes quand un département est sélectionné
  useEffect(() => {
    if (selectedDepartement) {
      const fetchCommunes = async () => {
        try {
          const res = await api.get(`/departements/${selectedDepartement}/communes`);
          setCommunes(res.data);
          setSelectedCommunes([]); // Reset communes sélectionnées
        } catch (err) {
          console.error('Erreur chargement communes:', err);
        }
      };
      fetchCommunes();
    } else {
      setCommunes([]);
      setSelectedCommunes([]);
    }
  }, [selectedDepartement]);

  // Reset sélections géographiques quand le rôle change
  useEffect(() => {
    if (formData.role !== 'Conseiller') {
      setSelectedDepartement('');
      setCommunes([]);
      setSelectedCommunes([]);
    }
  }, [formData.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCommuneToggle = (communeId) => {
    setSelectedCommunes((prev) =>
      prev.includes(communeId)
        ? prev.filter((id) => id !== communeId)
        : [...prev, communeId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation locale
      if (formData.password !== formData.password_confirmation) {
        setToast({
          show: true,
          message: 'Les mots de passe ne correspondent pas.',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      if (formData.role === 'Conseiller' && selectedCommunes.length === 0) {
        setToast({
          show: true,
          message: 'Veuillez sélectionner au moins une commune pour le conseiller.',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === 'Conseiller') {
        payload.commune_ids = selectedCommunes;
      }

      await api.post('/users', payload);

      setToast({
        show: true,
        message: 'Utilisateur créé avec succès !',
        type: 'success',
      });

      setTimeout(() => {
        navigate('/dashboard/users');
      }, 1500);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[Object.keys(err.response.data.errors)[0]]?.[0] ||
        'Erreur lors de la création de l\'utilisateur.';
      setToast({ show: true, message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-8 mt-16">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => navigate('/dashboard/users')}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Retour
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Créer un utilisateur</h1>
              <p className="text-gray-600 mt-2">Ajoutez un nouvel utilisateur au système</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations de base */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Jean Dupont"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="jean.dupont@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmer le mot de passe
                    </label>
                    <input
                      type="password"
                      name="password_confirmation"
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rôle
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner un rôle</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Affectation géographique pour Conseiller */}
                {formData.role === 'Conseiller' && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Affectation géographique
                    </h3>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Département
                      </label>
                      <select
                        value={selectedDepartement}
                        onChange={(e) => setSelectedDepartement(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sélectionner un département</option>
                        {departements.map((dep) => (
                          <option key={dep.id} value={dep.id}>
                            {dep.nom} ({dep.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedDepartement && communes.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Communes (sélection multiple)
                        </label>
                        <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto p-3 space-y-2">
                          {communes.map((commune) => (
                            <label
                              key={commune.id}
                              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedCommunes.includes(commune.id)}
                                onChange={() => handleCommuneToggle(commune.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{commune.nom}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {selectedCommunes.length} commune(s) sélectionnée(s)
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/users')}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Création...' : 'Créer l\'utilisateur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        title={toast.type === 'error' ? 'Erreur' : 'Succès'}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}
