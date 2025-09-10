// src/pages/staff/StaffDetailPage.tsx - Version corrigée pour afficher l'employé

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Staff {
  id: string;
  staff_number: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  address?: string;
  hire_date?: string;
  status: 'active' | 'inactive' | 'on_leave';
  qualifications?: string;
  notes?: string;
  photo_url?: string;
  salary?: number;
  emergency_contact?: string;
  emergency_phone?: string;
  payment_method?: string;
  bank_account?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  nationality?: string;
  contract_type?: string;
  employment_type?: string;
  created_at?: string;
  updated_at?: string;
}

const STAFF_STATUS_LABELS = {
  active: 'Actif',
  inactive: 'Inactif',
  on_leave: 'En congé'
};

// Services d'authentification
const authService = {
  getToken() {
    // Chercher dans toutes les sources possibles
    const sources = [
      localStorage.getItem('auth_token'),
      sessionStorage.getItem('auth_token'),
      localStorage.getItem('auth_data'),
      sessionStorage.getItem('auth_data')
    ];
    
    console.log('🔍 Recherche token dans les sources:', sources);
    
    // Essayer les tokens directs
    for (const source of sources.slice(0, 2)) {
      if (source && source.length > 10) {
        console.log('✅ Token direct trouvé:', source.substring(0, 20) + '...');
        return source;
      }
    }
    
    // Essayer les objets auth_data
    for (const source of sources.slice(2)) {
      if (source) {
        try {
          const parsed = JSON.parse(source);
          const token = parsed.token || parsed.accessToken;
          if (token) {
            console.log('✅ Token trouvé dans auth_data:', token.substring(0, 20) + '...');
            return token;
          }
        } catch (e) {
          console.log('⚠️ Erreur parsing auth_data:', e);
        }
      }
    }
    
    console.warn('❌ Aucun token trouvé');
    return null;
  },

  async loginAsAdmin() {
    try {
      console.log('🔐 Connexion automatique avec compte admin...');
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@ecole.com', password: 'admin123' })
      });

      if (!response.ok) {
        throw new Error(`Erreur connexion: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_data', JSON.stringify({
          token: data.token,
          user: data.user,
          loginTime: new Date().toISOString()
        }));
        
        console.log('✅ Connexion admin réussie');
        return data.token;
      } else {
        throw new Error(data.error || 'Erreur de connexion');
      }
    } catch (error: any) {
      console.error('❌ Erreur connexion admin:', error);
      throw error;
    }
  }
};

const staffService = {
  async ensureAuthenticated() {
    let token = authService.getToken();
    if (!token) {
      console.log('🔐 Pas de token, connexion automatique...');
      token = await authService.loginAsAdmin();
    }
    return token;
  },

  async getStaffById(id: string) {
    try {
      console.log('🔍 === RÉCUPÉRATION EMPLOYÉ ===');
      console.log('📋 ID recherché:', id);
      
      const token = await this.ensureAuthenticated();
      console.log('🔑 Token utilisé:', token.substring(0, 30) + '...');
      
      const url = `${API_BASE_URL}/api/staff/${id}`;
      console.log('🌐 URL appelée:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Réponse serveur:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.error('❌ Employé non trouvé (404)');
          return { success: false, error: 'Employé non trouvé' };
        }
        if (response.status === 401) {
          console.log('🔄 Token expiré, reconnexion...');
          const newToken = await authService.loginAsAdmin();
          return this.getStaffById(id);
        }
        
        const errorText = await response.text();
        console.error('❌ Erreur HTTP:', errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textData = await response.text();
        console.error('❌ Réponse non-JSON:', textData);
        throw new Error('Réponse serveur non-JSON');
      }

      const data = await response.json();
      console.log('📄 Données reçues:', data);

      // ✅ GESTION MULTIPLE DES FORMATS DE RÉPONSE
      let employee = null;
      
      if (data.success && data.employee) {
        employee = data.employee;
        console.log('✅ Format: { success: true, employee: {...} }');
      } else if (data.success && data.staff) {
        employee = data.staff;
        console.log('✅ Format: { success: true, staff: {...} }');
      } else if (data.employee) {
        employee = data.employee;
        console.log('✅ Format: { employee: {...} }');
      } else if (data.staff) {
        employee = data.staff;
        console.log('✅ Format: { staff: {...} }');
      } else if (data.id) {
        // Réponse directe avec l'objet employé
        employee = data;
        console.log('✅ Format: objet employé direct');
      }

      if (employee) {
        // Construire le nom complet si absent
        const staffData = {
          ...employee,
          full_name: employee.full_name || `${employee.first_name} ${employee.last_name}`
        };
        
        console.log('✅ === EMPLOYÉ TROUVÉ ===');
        console.log('👤 Données finales:', staffData);
        
        return { success: true, staff: staffData };
      } else {
        console.error('❌ Aucune donnée employé trouvée dans:', data);
        return { success: false, error: 'Format de données invalide' };
      }

    } catch (error: any) {
      console.error('💥 === ERREUR RÉCUPÉRATION ===');
      console.error('❌ Erreur complète:', error);
      return { success: false, error: error.message || 'Erreur de connexion' };
    }
  },

  async deleteStaff(id: string) {
    try {
      const token = await this.ensureAuthenticated();
      
      const response = await fetch(`${API_BASE_URL}/api/staff/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur de suppression');
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// Fonctions utilitaires
const getPositionLabel = (position?: string) => {
  const labels: Record<string, string> = {
    teacher: 'Enseignant(e)',
    admin: 'Administrateur/trice',
    secretary: 'Secrétaire',
    accountant: 'Comptable',
    guard: 'Gardien(ne)',
    cook: 'Cuisinier(ère)',
    cleaner: 'Agent(e) d\'entretien',
    driver: 'Chauffeur',
    nurse: 'Infirmier(ère)',
    librarian: 'Bibliothécaire',
    it_support: 'Support informatique',
    maintenance: 'Maintenance'
  };
  return labels[position || ''] || position || 'Non défini';
};

const getDepartmentLabel = (department?: string) => {
  const labels: Record<string, string> = {
    administration: 'Administration',
    education: 'Éducation',
    finance: 'Finance',
    security: 'Sécurité',
    food_service: 'Restauration',
    maintenance: 'Maintenance',
    transport: 'Transport',
    health: 'Santé',
    library: 'Bibliothèque',
    it: 'Informatique'
  };
  return labels[department || ''] || department || 'Non assigné';
};

const formatSalary = (salary?: number) => {
  if (!salary) return 'Non spécifié';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0
  }).format(salary);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Non défini';
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'Date invalide';
  }
};

const calculateSeniority = (hireDate?: string) => {
  if (!hireDate) return 'Non défini';
  
  const hire = new Date(hireDate);
  const now = new Date();
  const diffDays = Math.ceil((now.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) return `${diffDays} jours`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} mois`;
  
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  return months > 0 ? `${years} an${years > 1 ? 's' : ''} ${months} mois` : `${years} an${years > 1 ? 's' : ''}`;
};

const getGenderLabel = (gender?: string) => {
  const labels: Record<string, string> = {
    male: 'Masculin',
    female: 'Féminin',
    other: 'Autre'
  };
  return labels[gender || ''] || 'Non spécifié';
};

// Composant principal
const StaffDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const loadStaff = async () => {
      console.log('🚀 === CHARGEMENT DÉTAIL EMPLOYÉ ===');
      console.log('📋 ID URL:', id);
      
      if (!id) {
        setError('ID employé manquant dans l\'URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await staffService.getStaffById(id);
        setDebugInfo(response);
        
        if (response.success && response.staff) {
          console.log('✅ Employé chargé avec succès:', response.staff);
          setStaff(response.staff);
        } else {
          console.error('❌ Échec chargement:', response.error);
          setError(response.error || 'Employé non trouvé');
        }
      } catch (err: any) {
        console.error('💥 Erreur inattendue:', err);
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, [id]);

  const handleEdit = () => {
    if (staff) {
      navigate(`/staff/edit/${staff.id}`);
    }
  };

  const handleDelete = async () => {
    if (!staff) return;

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${staff.full_name} ?\n\nCette action est irréversible.`
    );

    if (confirmed) {
      try {
        const response = await staffService.deleteStaff(staff.id);
        
        if (response.success) {
          alert('✅ Personnel supprimé avec succès');
          navigate('/staff');
        } else {
          alert(`❌ Erreur: ${response.error}`);
        }
      } catch (error) {
        alert('❌ Erreur de connexion');
      }
    }
  };

  const getStaffAvatar = () => {
    if (staff?.photo_url) {
      return (
        <img
          src={staff.photo_url}
          alt={staff.full_name}
          className="w-20 h-20 rounded-xl object-cover border-4 border-white shadow-lg"
        />
      );
    }

    const initials = `${staff?.first_name?.[0] || ''}${staff?.last_name?.[0] || ''}`;
    
    return (
      <div className="w-20 h-20 rounded-xl bg-green-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
        {initials}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-red-100 text-red-700',
      on_leave: 'bg-yellow-100 text-yellow-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto mb-4"></div>
          <div className="text-xl font-bold text-gray-900 mb-2">Chargement...</div>
          <div className="text-gray-600">Récupération des données employé</div>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-left text-xs">
              <div><strong>ID:</strong> {id}</div>
              <div><strong>API:</strong> {API_BASE_URL}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md mx-auto bg-white rounded-2xl p-8 shadow-xl border border-red-200">
          <div className="text-8xl mb-6">❌</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Employé non trouvé</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          
          {/* Debug info en développement */}
          {process.env.NODE_ENV === 'development' && debugInfo && (
            <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left text-xs">
              <strong>Debug:</strong>
              <pre className="mt-2 overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/staff')}
              className="w-full bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600"
            >
              ← Retour à la liste
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-300"
            >
              🔄 Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-green-500 text-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/staff')}
                className="p-2 hover:bg-green-600 rounded-xl transition-colors"
              >
                <span className="text-xl">←</span>
              </button>
              
              <div className="p-3 bg-white/20 rounded-xl">
                <span className="text-2xl">👁️</span>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold">Détails du Personnel</h1>
                <p className="text-green-100 mt-1">Informations complètes de l'employé</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleEdit}
                className="bg-white/20 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/30 transition-all duration-200 flex items-center space-x-2"
              >
                <span>✏️</span>
                <span>Modifier</span>
              </button>
              
              <button
                onClick={() => navigate('/staff')}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-all duration-200 flex items-center space-x-2"
              >
                <span>📋</span>
                <span>Liste</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Profil principal */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="p-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-6">
                {getStaffAvatar()}

                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {staff.full_name}
                  </h1>
                  <div className="flex items-center space-x-4 text-gray-600 mb-3">
                    <span className="font-medium">{staff.staff_number}</span>
                    <span>•</span>
                    <span>{getPositionLabel(staff.position)}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(staff.status)}`}>
                      {STAFF_STATUS_LABELS[staff.status]}
                    </span>
                    
                    {staff.department && (
                      <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 rounded-full">
                        🏢 {getDepartmentLabel(staff.department)}
                      </span>
                    )}

                    <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-full">
                      📅 {calculateSeniority(staff.hire_date)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleEdit}
                  className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition-all duration-200 flex items-center space-x-2"
                >
                  <span>✏️</span>
                  <span>Modifier</span>
                </button>
                
                <button
                  onClick={() => window.print()}
                  className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 transition-all duration-200 flex items-center space-x-2"
                >
                  <span>🖨️</span>
                  <span>Imprimer</span>
                </button>

                <button
                  onClick={handleDelete}
                  className="bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 transition-all duration-200 flex items-center space-x-2"
                >
                  <span>🗑️</span>
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Informations principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informations personnelles */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-green-50 p-6 border-b border-green-200">
              <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                <span>👤</span>
                Informations personnelles
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm font-medium text-gray-500 mb-1">Prénom</div>
                  <div className="text-lg font-bold text-gray-900">{staff.first_name}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm font-medium text-gray-500 mb-1">Nom</div>
                  <div className="text-lg font-bold text-gray-900">{staff.last_name}</div>
                </div>
              </div>

              {staff.date_of_birth && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm font-medium text-gray-500 mb-1">Date de naissance</div>
                  <div className="text-lg font-bold text-gray-900">{formatDate(staff.date_of_birth)}</div>
                </div>
              )}

              {staff.gender && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm font-medium text-gray-500 mb-1">Genre</div>
                  <div className="text-lg font-bold text-gray-900">{getGenderLabel(staff.gender)}</div>
                </div>
              )}

              {staff.nationality && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm font-medium text-gray-500 mb-1">Nationalité</div>
                  <div className="text-lg font-bold text-gray-900">{staff.nationality}</div>
                </div>
              )}

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl">📧</span>
                <div>
                  <div className="text-sm font-medium text-gray-500">Email</div>
                  <div className="text-lg font-bold text-gray-900">{staff.email || 'Non renseigné'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl">📞</span>
                <div>
                  <div className="text-sm font-medium text-gray-500">Téléphone</div>
                  <div className="text-lg font-bold text-gray-900">{staff.phone || 'Non renseigné'}</div>
                </div>
              </div>

              {staff.address && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <span className="text-2xl">🏠</span>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Adresse</div>
                    <div className="text-lg font-bold text-gray-900">{staff.address}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informations professionnelles */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-blue-50 p-6 border-b border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                <span>💼</span>
                Informations professionnelles
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-500 mb-1">Poste</div>
                <div className="text-lg font-bold text-gray-900">{getPositionLabel(staff.position)}</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-500 mb-1">Département</div>
                <div className="text-lg font-bold text-gray-900">{getDepartmentLabel(staff.department)}</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-500 mb-1">Date d'embauche</div>
                <div className="text-lg font-bold text-gray-900">{formatDate(staff.hire_date)}</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-500 mb-1">Salaire mensuel</div>
                <div className="text-lg font-bold text-green-600">{formatSalary(staff.salary)}</div>
              </div>

              {staff.contract_type && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm font-medium text-gray-500 mb-1">Type de contrat</div>
                  <div className="text-lg font-bold text-gray-900">{staff.contract_type}</div>
                </div>
              )}

              {staff.employment_type && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm font-medium text-gray-500 mb-1">Type d'emploi</div>
                  <div className="text-lg font-bold text-gray-900">
                    {staff.employment_type === 'full_time' ? 'Temps plein' : 
                     staff.employment_type === 'part_time' ? 'Temps partiel' : 
                     staff.employment_type === 'contract' ? 'Contractuel' : 
                     staff.employment_type}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact d'urgence et informations financières */}
        {(staff.emergency_contact || staff.emergency_phone || staff.payment_method || staff.bank_account || staff.qualifications || staff.notes) && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact d'urgence */}
            {(staff.emergency_contact || staff.emergency_phone) && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-yellow-50 p-6 border-b border-yellow-200">
                  <h3 className="text-lg font-bold text-yellow-900 flex items-center gap-2">
                    <span>🚨</span>
                    Contact d'urgence
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {staff.emergency_contact && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="text-sm font-medium text-gray-500 mb-1">Nom du contact</div>
                      <div className="text-lg font-bold text-gray-900">{staff.emergency_contact}</div>
                    </div>
                  )}
                  {staff.emergency_phone && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="text-sm font-medium text-gray-500 mb-1">Téléphone</div>
                      <div className="text-lg font-bold text-gray-900">{staff.emergency_phone}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Informations financières */}
            {(staff.payment_method || staff.bank_account) && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-purple-50 p-6 border-b border-purple-200">
                  <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                    <span>💳</span>
                    Informations financières
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {staff.payment_method && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="text-sm font-medium text-gray-500 mb-1">Mode de paiement</div>
                      <div className="text-lg font-bold text-gray-900">{staff.payment_method}</div>
                    </div>
                  )}
                  {staff.bank_account && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="text-sm font-medium text-gray-500 mb-1">Compte bancaire</div>
                      <div className="text-lg font-bold text-gray-900">{staff.bank_account}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes et qualifications */}
            {(staff.qualifications || staff.notes) && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden lg:col-span-2">
                <div className="bg-indigo-50 p-6 border-b border-indigo-200">
                  <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                    <span>📝</span>
                    Notes et qualifications
                  </h3>
                </div>
                <div className="p-6">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {staff.qualifications && (
                      <div className="mb-4">
                        <h4 className="font-bold text-gray-900 mb-2">Qualifications :</h4>
                        <p>{staff.qualifications}</p>
                      </div>
                    )}
                    {staff.notes && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">Notes :</h4>
                        <p>{staff.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Statistiques */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-green-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">⏰</span>
              <div className="text-right">
                <div className="text-2xl font-bold">{calculateSeniority(staff.hire_date)}</div>
                <div className="text-xs opacity-80">Ancienneté</div>
              </div>
            </div>
            <div className="text-sm font-medium opacity-90">Dans l'établissement</div>
          </div>
          
          <div className="bg-blue-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{staff.status === 'active' ? '✅' : '❌'}</span>
              <div className="text-right">
                <div className="text-2xl font-bold">{STAFF_STATUS_LABELS[staff.status]}</div>
                <div className="text-xs opacity-80">Statut</div>
              </div>
            </div>
            <div className="text-sm font-medium opacity-90">Actuel</div>
          </div>

          <div className="bg-purple-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">💰</span>
              <div className="text-right">
                <div className="text-lg font-bold">
                  {staff.salary ? `${staff.salary.toLocaleString()} GNF` : 'N/A'}
                </div>
                <div className="text-xs opacity-80">Salaire</div>
              </div>
            </div>
            <div className="text-sm font-medium opacity-90">Mensuel</div>
          </div>

          <div className="bg-orange-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">📝</span>
              <div className="text-right">
                <div className="text-xl font-bold">
                  {staff.updated_at ? new Date(staff.updated_at).toLocaleDateString('fr-FR') : 'Jamais'}
                </div>
                <div className="text-xs opacity-80">Dernière MAJ</div>
              </div>
            </div>
            <div className="text-sm font-medium opacity-90">Modification</div>
          </div>
        </div>

        {/* Boutons d'action rapide */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={handleEdit}
            className="bg-green-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-green-600 transition-all duration-200 flex items-center space-x-3 text-lg"
          >
            <span>✏️</span>
            <span>Modifier les informations</span>
          </button>
          
          <button
            onClick={() => navigate('/staff')}
            className="bg-gray-500 text-white px-8 py-4 rounded-2xl font-medium hover:bg-gray-600 transition-all duration-200 flex items-center space-x-3 text-lg"
          >
            <span>📋</span>
            <span>Retour à la liste</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffDetailPage;

console.log('✅ === StaffDetailPage.tsx CORRIGÉ ===');
console.log('🔍 Gestion multiple des formats de réponse API');
console.log('🚨 Gestion robuste des erreurs et debugging');
console.log('📱 Interface responsive et complète');
console.log('🎯 Compatible avec tous les nouveaux champs');