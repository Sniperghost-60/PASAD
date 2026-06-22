import { useNavigate } from 'react-router-dom';
import { Sidebar, Header, Icon, ICONS } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export default function ComingSoon({ title, description, icon = 'settings' }) {
    const [collapsed, setCollapsed] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(o => !o)} />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header
                    collapsed={collapsed}
                    onToggle={() => setCollapsed(o => !o)}
                    title={title}
                />
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mb-6 shadow-sm">
                            <Icon d={ICONS[icon]} className="w-12 h-12 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
                        <p className="text-gray-500 mb-2 max-w-md">
                            {description || 'Ce module est en cours de développement et sera disponible prochainement.'}
                        </p>
                        <p className="text-xs text-gray-400 mb-8">
                            Connectez-vous avec l'équipe de développement pour plus d'informations.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                        >
                            <Icon d={ICONS.dashboard} className="w-4 h-4" />
                            Retour au tableau de bord
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}
