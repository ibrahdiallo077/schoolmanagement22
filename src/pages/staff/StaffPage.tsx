// src/pages/staff/StaffPage.tsx - VERSION SIMPLIFIÉE ET CORRIGÉE

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// === CONFIGURATION ===
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// === INTERFACES ===
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
  status: 'active' | 'inactive' | 'on_leave';
  salary?: number;
  hire_date?: string;
  photo_url?: string;
  initials?: string;
}

// === SERVICE D'AUTHENTIFICATION ===
const authService = {
  getToken(): string {
    return localStorage.getItem('auth_token') || 
           sessionStorage.getItem('auth_token') || 
           `dev-token-${Date.now()}`;
  }
};

// === SERVICE STAFF SIMPLIFIÉ ===
const staffService = {
  async getStaffList(): Promise<{ success: boolean; data: Staff[]; error?: string }> {
    try {
      console.log('📋 Chargement du personnel...');
      
      const token = authService.getToken();
      const url = `${API_BASE_URL}/api/staff`;

      // Tentative avec authentification
      let response;
      try {
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          signal: AbortSignal.timeout(10000)
        });
      } catch (error) {
        // Fallback sans authentification
        response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000)
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Extraire les données selon le format
      let staffList: any[] = [];
      if (data.success && Array.isArray(data.staff)) {
        staffList = data.staff;
      } else if (Array.isArray(data.staff)) {
        staffList = data.staff;
      } else if (Array.isArray(data)) {
        staffList = data;
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Format de réponse non reconnu');
      }

      // Nettoyer et enrichir les données
      const enrichedStaff = staffList.map((staff: any) => ({
        id: staff.id,
        staff_number: staff.staff_number || `STAFF-${staff.id?.substring(0, 6)}`,
        first_name: staff.first_name || '',
        last_name: staff.last_name || '',
        full_name: staff.full_name || `${staff.first_name || ''} ${staff.last_name || ''}`.trim(),
        position: staff.position || null,
        department: staff.department || null,
        email: staff.email || null,
        phone: staff.phone || null,
        status: staff.status || 'active',
        salary: staff.salary ? parseFloat(staff.salary) : 0,
        hire_date: staff.hire_date || null,
        photo_url: staff.photo_url || null,
        initials: staff.initials || `${staff.first_name?.[0] || ''}${staff.last_name?.[0] || ''}`.toUpperCase()
      })).filter(staff => staff.id); // Supprimer les entrées sans ID

      console.log(`✅ ${enrichedStaff.length} employé(s) chargé(s)`);
      return { success: true, data: enrichedStaff };

    } catch (error: any) {
      console.error('❌ Erreur chargement personnel:', error);
      
      let errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout - Le serveur ne répond pas';
      } else if (errorMessage.includes('ECONNREFUSED')) {
        errorMessage = 'Serveur indisponible - Vérifiez qu\'il est démarré';
      } else if (errorMessage.includes('500')) {
        errorMessage = 'Erreur serveur interne - Vérifiez la base de données';
      }
      
      return { success: false, data: [], error: errorMessage };
    }
  },

  async deleteStaff(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = authService.getToken();
      
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/staff/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      } catch {
        response = await fetch(`${API_BASE_URL}/api/staff/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Erreur HTTP ${response.status}` }));
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      const data = await response.json();
      return { success: true, message: data.message || 'Suppression réussie' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erreur de suppression' };
    }
  }
};

// === FONCTIONS UTILITAIRES ===
const formatSalary = (salary?: number): string => {
  if (!salary || salary === 0) return 'Non spécifié';
  return new Intl.NumberFormat('fr-FR').format(salary) + ' GNF';
};

const getStatusBadge = (status: string) => {
  const configs = {
    active: { label: 'Actif', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    inactive: { label: 'Inactif', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    on_leave: { label: 'En congé', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' }
  };
  
  const config = configs[status as keyof typeof configs] || configs.active;
  
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
      {config.label}
    </span>
  );
};

const getAvatar = (staff: Staff) => {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
  const colorIndex = (staff.id?.charCodeAt(0) || 0) % colors.length;
  
  return (
    <div className={`w-10 h-10 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-semibold text-sm`}>
      {staff.initials || 'N/A'}
    </div>
  );
};

const showNotification = (type: 'success' | 'error', title: string, message: string) => {
  const notification = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? '✅' : '❌';
  
  notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md`;
  notification.innerHTML = `
    <div class="flex items-center space-x-2">
      <span>${icon}</span>
      <div>
        <div class="font-bold">${title}</div>
        <div class="text-sm opacity-90">${message}</div>
      </div>
    </div>
  `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
};

// === COMPOSANT PRINCIPAL ===
const StaffPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // === CHARGEMENT INITIAL ===
  useEffect(() => {
    loadStaffData();
  }, []);

  const loadStaffData = async () => {
    setLoading(true);
    setError(null);
    
    const response = await staffService.getStaffList();
    
    if (response.success) {
      setStaffList(response.data);
      setError(null);
    } else {
      setError(response.error || 'Erreur de chargement');
      setStaffList([]);
    }
    
    setLoading(false);
  };

  // === FILTRAGE ===
  useEffect(() => {
    if (!searchTerm) {
      setFilteredStaff(staffList);
      return;
    }

    const filtered = staffList.filter(staff => 
      staff.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.phone?.includes(searchTerm) ||
      staff.staff_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredStaff(filtered);
  }, [searchTerm, staffList]);

  // === GESTIONNAIRES ===
  const handleView = (id: string) => navigate(`/staff/${id}`);
  const handleEdit = (id: string) => navigate(`/staff/edit/${id}`);

  const handleDelete = async (id: string) => {
    const staff = staffList.find(s => s.id === id);
    if (!staff) return;

    const confirmed = window.confirm(`Supprimer ${staff.full_name} ?`);
    if (!confirmed) return;

    const response = await staffService.deleteStaff(id);
    
    if (response.success) {
      await loadStaffData();
      showNotification('success', 'Supprimé', response.message || 'Employé supprimé');
    } else {
      showNotification('error', 'Erreur', response.error || 'Erreur de suppression');
    }
  };

  // === STATISTIQUES ===
  const stats = {
    total: staffList.length,
    active: staffList.filter(s => s.status === 'active').length,
    inactive: staffList.filter(s => s.status === 'inactive').length,
    totalSalary: staffList.reduce((sum, s) => sum + (s.salary || 0), 0)
  };

  // === RENDU ===
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <div className="text-xl font-bold text-gray-900 mb-2">Chargement du personnel...</div>
        </div>
      </div>
    );
  }

  if (error && staffList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md mx-auto bg-white rounded-2xl p-8 shadow-xl border border-red-200">
          <div className="text-8xl mb-6">🚨</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Erreur de connexion</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={loadStaffData}
              className="w-full bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600"
            >
              🔄 Réessayer
            </button>
            <button
              onClick={() => navigate('/staff/new')}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600"
            >
              ➕ Ajouter un employé
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-xl">
              <span className="text-3xl">👥</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Gestion du Personnel</h1>
              <p className="text-green-100 mt-1">Gérez les employés et leurs informations</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={loadStaffData}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30"
            >
              <span>🔄</span>
              Actualiser
            </button>
            
            <button 
              onClick={() => navigate('/staff/new')}
              className="flex items-center gap-2 px-6 py-2 bg-yellow-400 text-yellow-900 rounded-xl font-bold hover:bg-yellow-300"
            >
              <span>✨</span>
              Nouveau Personnel
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>
        
        <div className="bg-green-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Actifs</p>
              <p className="text-3xl font-bold">{stats.active}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-red-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Inactifs</p>
              <p className="text-3xl font-bold">{stats.inactive}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">❌</span>
            </div>
          </div>
        </div>

        <div className="bg-emerald-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Masse salariale</p>
              <p className="text-xl font-bold">{formatSalary(stats.totalSalary)}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-gray-100">
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">🔍</span>
          <input
            type="text"
            placeholder="Rechercher par nom, email, téléphone, numéro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Liste du personnel */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
          <span className="text-6xl mb-4 block">👥</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {staffList.length === 0 ? 'Aucun personnel enregistré' : 'Aucun personnel trouvé'}
          </h3>
          <p className="text-gray-600 mb-6">
            {staffList.length === 0 
              ? "Commencez par ajouter votre premier employé"
              : "Aucun résultat ne correspond à votre recherche"
            }
          </p>
          <button
            onClick={() => staffList.length === 0 ? navigate('/staff/new') : setSearchTerm('')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
          >
            <span>{staffList.length === 0 ? '✨' : '🔄'}</span>
            {staffList.length === 0 ? 'Ajouter un employé' : 'Réinitialiser la recherche'}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl text-green-600">👥</span>
                <h2 className="text-lg font-semibold text-gray-800">
                  Personnel ({filteredStaff.length})
                </h2>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Personnel</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Poste</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Salaire</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-green-50/30 transition-all duration-200 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {getAvatar(staff)}
                        <div>
                          <div className="font-semibold text-gray-900">{staff.full_name}</div>
                          <div className="text-sm text-gray-500">{staff.staff_number}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💼</span>
                        <span className="font-medium text-gray-900">{staff.position || 'Non défini'}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span>📧</span>
                          <span className="text-gray-600">{staff.email || 'Non renseigné'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span>📞</span>
                          <span className="text-gray-600">{staff.phone || 'Non renseigné'}</span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-green-500">💰</span>
                        <span className="font-semibold text-green-600">{formatSalary(staff.salary)}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      {getStatusBadge(staff.status)}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button
                          onClick={() => handleView(staff.id)}
                          className="p-2 rounded-lg hover:bg-green-50 text-green-600"
                          title="Voir"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handleEdit(staff.id)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(staff.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;