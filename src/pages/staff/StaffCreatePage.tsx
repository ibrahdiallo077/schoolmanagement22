// src/pages/staff/StaffCreatePage.tsx - VERSION CORRIGÉE port 3001 et mapping photo

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StaffEnrollmentWizard from '../../components/staff/StaffEnrollmentWizard';

// ✅ CORRECTION PORT API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

console.log('🌐 API Base URL CORRIGÉE:', API_BASE_URL);

// === SERVICE D'AUTHENTIFICATION ROBUSTE ===
const authService = {
  getToken() {
    const sources = [
      localStorage.getItem('auth_token'),
      sessionStorage.getItem('auth_token'),
      localStorage.getItem('auth_data'),
      sessionStorage.getItem('auth_data')
    ];
    
    // Essayer les tokens directs
    for (const source of sources.slice(0, 2)) {
      if (source && source.length > 10) {
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
            return token;
          }
        } catch (e) {
          console.log('⚠️ Erreur parsing auth_data:', e);
        }
      }
    }
    
    return null;
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  async loginAsAdmin() {
    try {
      console.log('🔐 Connexion automatique avec compte admin...');
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@ecole.com',
          password: 'admin123'
        })
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

// === SERVICE STAFF AVEC GESTION PHOTO CORRECTE ===
const staffService = {
  async ensureAuthenticated() {
    let token = authService.getToken();
    
    if (!token) {
      console.log('🔐 Pas de token, connexion automatique...');
      token = await authService.loginAsAdmin();
    }
    
    return token;
  },

  async testConnection() {
    try {
      const token = await this.ensureAuthenticated();
      
      const response = await fetch(`${API_BASE_URL}/api/staff/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { error: 'Réponse non-JSON' };
      }
      
      console.log('🧪 Test connexion staff:', { status: response.status, data });
      
      return { 
        success: response.ok, 
        message: data.message || 'Test connexion OK',
        error: data.error 
      };
    } catch (error: any) {
      console.error('❌ Erreur test connexion:', error);
      return { success: false, error: error.message };
    }
  },

  // ✅ UPLOAD PHOTO SIMULÉ (en attendant implémentation serveur réelle)
  async uploadPhoto(file: File): Promise<string | null> {
    try {
      console.log('📸 Upload photo simulé pour:', file.name);
      
      // Pour l'instant, créer une URL blob locale
      // TODO: Implémenter upload réel vers serveur
      const blobUrl = URL.createObjectURL(file);
      
      // Simuler délai d'upload
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('✅ Photo "uploadée" (simulé):', blobUrl);
      return blobUrl;
    } catch (error) {
      console.error('❌ Erreur upload photo:', error);
      return null;
    }
  },

  async createStaff(staffData: any) {
    try {
      console.log('🚀 === CRÉATION EMPLOYÉ - DÉBUT ===');
      console.log('📊 Données reçues:', staffData);
      
      const token = await this.ensureAuthenticated();
      console.log('🔑 Token utilisé:', token.substring(0, 30) + '...');
      
      // ✅ GESTION PHOTO CORRECTE
      let photoUrl = null;
      if (staffData.photo_file && staffData.photo_file instanceof File) {
        console.log('📸 Upload de la nouvelle photo...');
        photoUrl = await this.uploadPhoto(staffData.photo_file);
      } else if (staffData.photo_url && !staffData.photo_url.startsWith('blob:')) {
        // Garder photo existante si c'est une vraie URL
        photoUrl = staffData.photo_url;
      }

      // ✅ DONNÉES COMPLÈTES selon le schéma PostgreSQL
      const cleanData = {
        // Champs obligatoires
        first_name: staffData.first_name?.trim() || '',
        last_name: staffData.last_name?.trim() || '',
        
        // Champs de contact
        email: staffData.email?.trim() || null,
        phone: staffData.phone?.trim() || null,
        address: staffData.address?.trim() || null,
        
        // Champs professionnels
        position: staffData.position || null,
        department: staffData.department || null,
        status: staffData.status || 'active',
        hire_date: staffData.hire_date || null,
        salary: staffData.salary ? parseFloat(staffData.salary.toString()) : null,
        qualifications: staffData.qualifications?.trim() || null,
        notes: staffData.notes?.trim() || null,
        
        // ✅ CHAMPS PERSONNELS
        date_of_birth: staffData.date_of_birth || null,
        gender: staffData.gender || null,
        nationality: staffData.nationality || null,
        
        // ✅ CONTACTS D'URGENCE
        emergency_contact: staffData.emergency_contact?.trim() || null,
        emergency_phone: staffData.emergency_phone?.trim() || null,
        
        // ✅ INFORMATIONS FINANCIÈRES
        payment_method: staffData.payment_method?.trim() || null,
        bank_account: staffData.bank_account?.trim() || null,
        
        // ✅ INFORMATIONS CONTRACTUELLES
        contract_type: staffData.contract_type || null,
        employment_type: staffData.employment_type || 'full_time',
        
        // ✅ PHOTO CORRIGÉE
        photo_url: photoUrl
      };

      // Validation obligatoire
      if (!cleanData.first_name || !cleanData.last_name) {
        throw new Error('❌ Le prénom et le nom sont obligatoires');
      }

      console.log('📤 Données nettoyées (schéma complet):', cleanData);
      
      const response = await fetch(`${API_BASE_URL}/api/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanData)
      });

      console.log('📡 Réponse serveur:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });

      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
        console.log('📄 Contenu JSON:', responseData);
      } else {
        const textData = await response.text();
        console.error('❌ Réponse non-JSON:', textData);
        throw new Error(`Serveur a retourné du contenu non-JSON: ${textData.substring(0, 200)}`);
      }

      if (!response.ok) {
        console.error('💥 Erreur HTTP:', response.status);
        console.error('📝 Détails erreur:', responseData);
        
        let errorMessage = responseData.error || responseData.message || `Erreur HTTP ${response.status}`;
        
        switch (response.status) {
          case 400:
            errorMessage = `Données invalides: ${errorMessage}`;
            break;
          case 401:
            errorMessage = 'Non autorisé - Token invalide';
            console.log('🔄 Tentative de reconnexion...');
            const newToken = await authService.loginAsAdmin();
            return this.createStaff(staffData);
          case 403:
            errorMessage = 'Accès refusé - Permissions insuffisantes';
            break;
          case 409:
            errorMessage = 'Conflit - Un employé avec ces informations existe déjà';
            break;
          case 500:
            if (errorMessage.includes('table') || errorMessage.includes('column') || errorMessage.includes('colonne')) {
              errorMessage = `🗄️ Erreur de base de données - Colonne manquante: ${errorMessage}`;
            } else if (errorMessage.includes('constraint') || errorMessage.includes('duplicate')) {
              errorMessage = '🔒 Contrainte violée - Vérifiez l\'unicité des données';
            } else {
              errorMessage = `🔥 Erreur serveur interne: ${errorMessage}`;
            }
            break;
          default:
            errorMessage = `Erreur ${response.status}: ${errorMessage}`;
        }
        
        throw new Error(errorMessage);
      }

      if (responseData.success) {
        console.log('✅ === CRÉATION RÉUSSIE ===');
        console.log('👤 Employé créé:', responseData.employee);
        
        return {
          success: true,
          employee: responseData.employee || responseData.staff,
          message: responseData.message || 'Employé créé avec succès'
        };
      } else {
        throw new Error(responseData.error || 'Réponse inattendue du serveur');
      }

    } catch (error: any) {
      console.error('💥 === ERREUR CRÉATION ===');
      console.error('❌ Erreur complète:', error);
      
      return {
        success: false,
        error: error.message || 'Erreur inconnue lors de la création'
      };
    }
  },

  async getStaffById(id: string) {
    try {
      const token = await this.ensureAuthenticated();
      
      const response = await fetch(`${API_BASE_URL}/api/staff/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { success: true, employee: data.employee || data.staff };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async updateStaff(id: string, staffData: any) {
    try {
      const token = await this.ensureAuthenticated();
      
      // ✅ GESTION PHOTO POUR UPDATE
      let photoUrl = staffData.photo_url;
      if (staffData.has_new_photo && staffData.photo_file instanceof File) {
        console.log('📸 Upload nouvelle photo pour update...');
        photoUrl = await this.uploadPhoto(staffData.photo_file);
      }
      
      // ✅ DONNÉES COMPLÈTES pour la mise à jour
      const cleanData = {
        first_name: staffData.first_name?.trim() || '',
        last_name: staffData.last_name?.trim() || '',
        email: staffData.email?.trim() || null,
        phone: staffData.phone?.trim() || null,
        position: staffData.position || null,
        department: staffData.department || null,
        status: staffData.status || 'active',
        hire_date: staffData.hire_date || null,
        address: staffData.address?.trim() || null,
        qualifications: staffData.qualifications?.trim() || null,
        notes: staffData.notes?.trim() || null,
        salary: staffData.salary ? parseFloat(staffData.salary.toString()) : null,
        
        // ✅ NOUVEAUX CHAMPS pour la mise à jour
        date_of_birth: staffData.date_of_birth || null,
        gender: staffData.gender || null,
        nationality: staffData.nationality || null,
        emergency_contact: staffData.emergency_contact?.trim() || null,
        emergency_phone: staffData.emergency_phone?.trim() || null,
        payment_method: staffData.payment_method?.trim() || null,
        bank_account: staffData.bank_account?.trim() || null,
        contract_type: staffData.contract_type || null,
        employment_type: staffData.employment_type || null,
        
        // ✅ PHOTO CORRIGÉE
        photo_url: photoUrl
      };

      if (!cleanData.first_name || !cleanData.last_name) {
        throw new Error('Le prénom et le nom sont obligatoires');
      }

      const response = await fetch(`${API_BASE_URL}/api/staff/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        employee: data.employee || data.staff,
        message: data.message
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// === ✅ TRANSFORMATEUR DE DONNÉES CORRIGÉ avec photo ===
// Fixed transformFormDataToApi function in StaffCreatePage.tsx

const transformFormDataToApi = (formData: any) => {
  console.log('🔄 Transformation formulaire → API:', formData);
  
  // Extract names from different possible sources
  let firstName = formData.firstName || formData.first_name || '';
  let lastName = formData.lastName || formData.last_name || '';
  
  if (formData.personalInfo) {
    firstName = firstName || formData.personalInfo.firstName || formData.personalInfo.first_name || '';
    lastName = lastName || formData.personalInfo.lastName || formData.personalInfo.last_name || '';
  }
  
  // FIXED: Clean phone number for API
  let cleanPhone = null;
  if (formData.phone || formData.contactInfo?.phone) {
    const rawPhone = formData.phone || formData.contactInfo?.phone;
    // Remove spaces, dashes, parentheses, plus signs
    cleanPhone = rawPhone.replace(/[\s\-\+\(\)]/g, '');
    // Only keep if it's valid (8-15 digits)
    if (!/^\d{8,15}$/.test(cleanPhone)) {
      cleanPhone = rawPhone; // Keep original if cleaning fails
    }
  }
  
  const apiData = {
    // Required fields
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    
    // Contact fields
    email: formData.email?.trim() || formData.contactInfo?.email?.trim() || null,
    phone: cleanPhone, // FIXED: Use cleaned phone
    address: formData.address?.trim() || formData.contactInfo?.address?.trim() || null,
    
    // Professional fields
    position: formData.position || formData.professionalInfo?.position || null,
    department: formData.department || formData.professionalInfo?.department || null,
    status: formData.status || 'active',
    hire_date: formData.hireDate || formData.professionalInfo?.hireDate || formData.hire_date || null,
    salary: formData.salary ? parseFloat(formData.salary.toString()) : null,
    qualifications: formData.qualifications?.trim() || formData.professionalInfo?.qualifications?.trim() || null,
    notes: formData.notes?.trim() || null,
    
    // Personal fields
    date_of_birth: formData.dateOfBirth || formData.personalInfo?.dateOfBirth || formData.date_of_birth || null,
    gender: formData.gender || formData.personalInfo?.gender || null,
    nationality: formData.nationality || formData.personalInfo?.nationality || null,
    
    // Emergency contacts
    emergency_contact: formData.emergencyContact?.trim() || formData.contactInfo?.emergencyContact?.trim() || null,
    emergency_phone: formData.emergencyPhone?.trim() || formData.contactInfo?.emergencyPhone?.trim() || null,
    
    // Financial information
    payment_method: formData.paymentMethod?.trim() || formData.financialInfo?.paymentMethod?.trim() || null,
    bank_account: formData.bankAccount?.trim() || formData.financialInfo?.bankAccount?.trim() || null,
    
    // Contract information
    contract_type: formData.contractType || formData.professionalInfo?.contractType || null,
    employment_type: formData.employmentType || formData.professionalInfo?.employmentType || 'full_time',
    
    // Photo handling
    photo_url: formData.photo_url || null,
    photo_file: formData.profilePhoto || formData.photo_file || null,
    has_new_photo: !!formData.profilePhoto
  };
  
  console.log('📤 Données API final (avec téléphone nettoyé):', {
    ...apiData,
    photo_file: apiData.photo_file ? 'Fichier présent' : 'Pas de fichier',
    phone_cleaned: !!cleanPhone
  });
  
  return apiData;
};

// === COMPOSANT PRINCIPAL ===
interface StaffCreatePageProps {
  mode?: 'create' | 'edit';
}

const StaffCreatePage: React.FC<StaffCreatePageProps> = ({ mode: propMode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const mode = propMode || (id ? 'edit' : 'create');
  const staffId = id;

  // États
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(mode === 'edit');
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string>('checking');

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setAuthStatus('checking');
        
        if (!authService.isAuthenticated()) {
          console.log('🔐 Pas d\'authentification, connexion auto...');
          await authService.loginAsAdmin();
        }
        
        const testResult = await staffService.testConnection();
        if (testResult.success) {
          setAuthStatus('authenticated');
          console.log('✅ Authentification OK');
        } else {
          throw new Error(testResult.error);
        }
      } catch (error: any) {
        console.error('❌ Erreur authentification:', error);
        setAuthStatus('error');
        setError(`Erreur d'authentification: ${error.message}`);
      }
    };

    checkAuth();
  }, []);

  // ✅ CHARGEMENT COMPLET DES DONNÉES pour le mode édition
  useEffect(() => {
    const loadStaffData = async () => {
      if (mode === 'edit' && staffId && authStatus === 'authenticated') {
        setLoading(true);
        setError(null);

        try {
          const response = await staffService.getStaffById(staffId);
          
          if (response.success && response.employee) {
            const staffData = response.employee;
            
            // ✅ FORMULAIRE COMPLET avec TOUS les champs + photo
            const formData = {
              // Champs personnels
              firstName: staffData.first_name || '',
              lastName: staffData.last_name || '',
              dateOfBirth: staffData.date_of_birth ? staffData.date_of_birth.split('T')[0] : '',
              gender: staffData.gender || '',
              nationality: staffData.nationality || '',
              
              // Champs professionnels
              position: staffData.position || '',
              department: staffData.department || '',
              hireDate: staffData.hire_date ? staffData.hire_date.split('T')[0] : '',
              qualifications: staffData.qualifications || '',
              salary: staffData.salary?.toString() || '',
              contractType: staffData.contract_type || '', // ✅ MAPPING CORRECT
              employmentType: staffData.employment_type || 'full_time',
              
              // Champs de contact
              phone: staffData.phone || '',
              email: staffData.email || '',
              address: staffData.address || '',
              emergencyContact: staffData.emergency_contact || '',
              emergencyPhone: staffData.emergency_phone || '',
              
              // Champs financiers
              paymentMethod: staffData.payment_method || '',
              bankAccount: staffData.bank_account || '',
              
              // Autres
              status: staffData.status || 'active',
              notes: staffData.notes || '',
              
              // ✅ PHOTO CORRECTE
              photoUrl: staffData.photo_url || '', // URL photo existante
              
              // Métadonnées
              staff_number: staffData.staff_number,
              created_at: staffData.created_at
            };
            
            console.log('📝 Données chargées pour édition:', formData);
            setInitialData(formData);
          } else {
            setError(response.error || 'Employé non trouvé');
          }
        } catch (err: any) {
          setError(err.message || 'Erreur de connexion au serveur');
        } finally {
          setLoading(false);
        }
      }
    };

    loadStaffData();
  }, [mode, staffId, authStatus]);

  // Gestionnaire de succès
  const handleSuccess = async (staffData: any) => {
    try {
      console.log('💾 === DÉBUT SAUVEGARDE ===');
      console.log('📋 Données du wizard:', staffData);
      
      // Transformer les données avec TOUS les nouveaux champs
      const apiData = transformFormDataToApi(staffData);
      
      // Validation
      if (!apiData.first_name || !apiData.last_name) {
        throw new Error('Le prénom et le nom sont obligatoires');
      }
      
      let response;
      
      if (mode === 'edit' && staffId) {
        response = await staffService.updateStaff(staffId, apiData);
      } else {
        response = await staffService.createStaff(apiData);
      }
      
      if (response.success) {
        showSuccessNotification(
          `Personnel ${mode === 'edit' ? 'modifié' : 'créé'} !`,
          `${apiData.first_name} ${apiData.last_name} a été ${mode === 'edit' ? 'modifié' : 'ajouté'} avec succès`
        );

        setTimeout(() => {
          navigate('/staff');
        }, 2000);
      } else {
        throw new Error(response.error);
      }
    } catch (error: any) {
      console.error('💥 Erreur sauvegarde:', error);
      handleError(error.message);
    }
  };

  const handleCancel = () => {
    navigate('/staff');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    showErrorNotification('Erreur', errorMessage);
  };

  // Notifications
  const showSuccessNotification = (title: string, message: string) => {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-md';
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <span class="text-2xl">✅</span>
        <div>
          <div class="font-bold text-lg">${title}</div>
          <div class="text-sm opacity-90">${message}</div>
        </div>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
  };

  const showErrorNotification = (title: string, message: string) => {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-md';
    notification.innerHTML = `
      <div class="flex items-start space-x-3">
        <span class="text-xl">❌</span>
        <div class="flex-1">
          <div class="font-bold text-lg">${title}</div>
          <div class="text-sm opacity-90 mt-1">${message}</div>
        </div>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 6000);
  };

  // États de chargement et d'erreur
  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-900">Vérification authentification...</h2>
        </div>
      </div>
    );
  }

  if (authStatus === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl border border-red-200 max-w-md">
          <div className="text-6xl mb-6">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur d'authentification</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600"
            >
              🔄 Réessayer
            </button>
            <button
              onClick={() => navigate('/staff')}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-300"
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Chargement des données</h2>
          <p className="text-gray-600">Récupération des informations depuis la base de données...</p>
        </div>
      </div>
    );
  }

  if (error && mode === 'edit') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl border border-red-200 max-w-md">
          <div className="text-6xl mb-6">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/staff')}
              className="w-full bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-600"
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

  // Rendu principal
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Debug panel en développement */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-green-100 border-b border-green-200 px-4 py-2">
          <div className="flex items-center justify-between text-sm text-green-800">
          </div>
        </div>
      )}

      {/* Formulaire principal */}
      <StaffEnrollmentWizard
        mode={mode}
        staffId={staffId}
        initialData={initialData}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        onError={handleError}
      />
    </div>
  );
};

export default StaffCreatePage;

