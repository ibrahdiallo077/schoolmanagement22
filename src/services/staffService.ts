// src/services/staffService.ts - Service avec gestion d'erreur 500 améliorée

console.log('🔧 Service personnel configuré pour utiliser UNIQUEMENT la base de données PostgreSQL');

// === CONFIGURATION ===
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const STAFF_ENDPOINT = `${API_BASE_URL}/api/staff`;

console.log('🌐 API Endpoint:', STAFF_ENDPOINT);

// === INTERFACES LOCALES ===
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
  initials?: string;
  assigned_classes_count?: number;
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

interface StaffFormData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  status: 'active' | 'inactive' | 'on_leave';
  hire_date?: string;
  salary?: number;
  address?: string;
  qualifications?: string;
  notes?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  payment_method?: string;
  bank_account?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  nationality?: string;
  contract_type?: string;
  employment_type?: string;
  photoFile?: File;
}

interface StaffListParams {
  page?: number;
  limit?: number;
  search?: string;
  position?: string;
  department?: string;
  status?: string;
  contract_type?: string;
  employment_type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
}

interface StaffApiResponse extends ApiResponse {
  employee?: Staff;
  staff?: Staff;
}

interface StaffListApiResponse extends ApiResponse {
  staff?: Staff[];
  pagination?: {
    current_page?: number;
    total_pages?: number;
    total_items?: number;
    per_page?: number;
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

interface PositionOption {
  value: string;
  label: string;
  icon?: string;
  category?: string;
}

interface DepartmentOption {
  value: string;
  label: string;
  icon?: string;
}

interface PhotoUploadResponse extends ApiResponse {
  photoUrl?: string;
  file?: {
    originalName: string;
    filename: string;
    size: number;
  };
}

interface StaffStatistics {
  total_staff: number;
  active_staff: number;
  inactive_staff: number;
  on_leave_staff: number;
  by_position: Record<string, number>;
  by_department: Record<string, number>;
  by_contract_type: Record<string, number>;
  by_employment_type: Record<string, number>;
  average_salary: number;
  total_salary_budget: number;
  recent_hires: Staff[];
  upcoming_birthdays: Staff[];
}

// === CONSTANTES ===
const POSITION_OPTIONS: PositionOption[] = [
  { value: 'teacher', label: 'Enseignant(e)', icon: '👨‍🏫', category: 'Éducation' },
  { value: 'principal', label: 'Directeur/trice', icon: '👨‍💼', category: 'Direction' },
  { value: 'assistant_principal', label: 'Directeur/trice adjoint(e)', icon: '👩‍💼', category: 'Direction' },
  { value: 'admin', label: 'Administrateur/trice', icon: '⚙️', category: 'Administration' },
  { value: 'secretary', label: 'Secrétaire', icon: '📋', category: 'Administration' },
  { value: 'accountant', label: 'Comptable', icon: '💰', category: 'Finance' },
  { value: 'librarian', label: 'Bibliothécaire', icon: '📚', category: 'Éducation' },
  { value: 'counselor', label: 'Conseiller/ère', icon: '🧠', category: 'Éducation' },
  { value: 'cleaner', label: 'Agent(e) d\'entretien', icon: '🧹', category: 'Services' },
  { value: 'guard', label: 'Gardien(ne)', icon: '👮‍♂️', category: 'Sécurité' },
  { value: 'cook', label: 'Cuisinier(ère)', icon: '👨‍🍳', category: 'Services' },
  { value: 'nurse', label: 'Infirmier(ère)', icon: '👩‍⚕️', category: 'Santé' },
  { value: 'maintenance', label: 'Agent(e) de maintenance', icon: '🔧', category: 'Maintenance' },
  { value: 'driver', label: 'Chauffeur', icon: '🚗', category: 'Transport' },
  { value: 'it_support', label: 'Support informatique', icon: '💻', category: 'Technique' }
];

const DEPARTMENT_OPTIONS: DepartmentOption[] = [
  { value: 'administration', label: 'Administration', icon: '🏢' },
  { value: 'education', label: 'Éducation', icon: '🎓' },
  { value: 'education_coranique', label: 'Éducation Coranique', icon: '🕌' },
  { value: 'education_francaise', label: 'Éducation Française', icon: '🇫🇷' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'security', label: 'Sécurité', icon: '🛡️' },
  { value: 'services', label: 'Services Généraux', icon: '🔧' },
  { value: 'food_service', label: 'Restauration', icon: '🍽️' },
  { value: 'health', label: 'Santé', icon: '⚕️' },
  { value: 'transport', label: 'Transport', icon: '🚌' },
  { value: 'library', label: 'Bibliothèque', icon: '📚' },
  { value: 'it', label: 'Informatique', icon: '💻' }
];

const CONTRACT_TYPE_OPTIONS = [
  { value: 'cdi', label: 'CDI - Contrat à Durée Indéterminée' },
  { value: 'cdd', label: 'CDD - Contrat à Durée Déterminée' }
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Temps plein' },
  { value: 'part_time', label: 'Temps partiel' },
  { value: 'half_time', label: 'Mi-temps' }
];

// === UTILITAIRES D'AUTHENTIFICATION ===
const getStoredAuthData = () => {
  try {
    // Priorité 1: localStorage pour sessions longues
    let authData = localStorage.getItem('auth_data');
    if (authData) {
      const parsed = JSON.parse(authData);
      if (parsed.accessToken || parsed.token) {
        return parsed;
      }
    }

    // Priorité 2: sessionStorage pour sessions courtes
    authData = sessionStorage.getItem('auth_data');
    if (authData) {
      const parsed = JSON.parse(authData);
      if (parsed.accessToken || parsed.token) {
        return parsed;
      }
    }

    // Priorité 3: Ancien format (compatibilité)
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      return { accessToken: token, token: token };
    }

    // Priorité 4: Format v3 (nouveau système)
    authData = localStorage.getItem('auth_data_v3');
    if (authData) {
      const parsed = JSON.parse(authData);
      if (parsed.accessToken) {
        return parsed;
      }
    }

    console.warn('⚠️ Aucun token d\'authentification trouvé');
    return null;
  } catch (error) {
    console.error('❌ Erreur récupération token:', error);
    return null;
  }
};

const getAuthHeaders = (): HeadersInit => {
  const authData = getStoredAuthData();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (authData) {
    const token = authData.accessToken || authData.token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 Token ajouté aux headers:', token.substring(0, 20) + '...');
    }
  } else {
    console.warn('⚠️ Pas de token disponible pour les headers');
  }

  return headers;
};

const getAuthHeadersForUpload = (): HeadersInit => {
  const authData = getStoredAuthData();
  const headers: HeadersInit = {
    'Accept': 'application/json'
  };

  if (authData) {
    const token = authData.accessToken || authData.token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// ✅ GESTION AMÉLIORÉE DES RÉPONSES API AVEC ERREUR 500
const handleApiResponse = async (response: Response) => {
  console.log('📡 Réponse API reçue:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    headers: Object.fromEntries(response.headers.entries())
  });
  
  if (!response.ok) {
    let errorMessage = `Erreur HTTP ${response.status}`;
    let errorDetails = null;
    
    try {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        console.error('❌ Détails erreur API:', errorData);
        
        errorMessage = errorData.error || errorData.message || errorMessage;
        errorDetails = errorData.details || errorData.stack;
        
        // ✅ GESTION SPÉCIFIQUE DES ERREURS 500
        if (response.status === 500) {
          console.error('💥 ERREUR SERVEUR 500 - Analyse détaillée:', {
            error: errorData.error,
            message: errorData.message,
            details: errorData.details,
            stack: errorData.stack
          });
          
          // Messages d'erreur plus clairs selon le contenu
          if (errorMessage.includes('duplicate') || errorMessage.includes('already exists') || errorMessage.includes('23505')) {
            errorMessage = 'Un employé avec ces informations existe déjà dans la base de données';
          } else if (errorMessage.includes('validation') || errorMessage.includes('constraint')) {
            errorMessage = 'Erreur de validation des données - Vérifiez que tous les champs obligatoires sont correctement remplis';
          } else if (errorMessage.includes('database') || errorMessage.includes('connection')) {
            errorMessage = 'Erreur de connexion à la base de données - Contactez l\'administrateur système';
          } else if (errorMessage.includes('foreign key') || errorMessage.includes('reference')) {
            errorMessage = 'Erreur de référence dans la base de données - Certaines valeurs sont invalides';
          } else if (errorMessage.includes('syntax') || errorMessage.includes('query')) {
            errorMessage = 'Erreur dans la requête de base de données - Problème technique détecté';
          } else if (errorMessage.includes('column') || errorMessage.includes('42703')) {
            errorMessage = 'Erreur de structure: colonne manquante dans la base de données';
          } else if (errorMessage.includes('table') || errorMessage.includes('42P01')) {
            errorMessage = 'Erreur: table staff non trouvée';
          } else if (!errorMessage || errorMessage === `Erreur HTTP ${response.status}`) {
            errorMessage = 'Erreur interne du serveur - Vérifiez les logs du serveur backend';
          }
        }
        
      } else {
        // Réponse non-JSON
        const textData = await response.text();
        console.error('❌ Réponse non-JSON:', textData);
        if (response.status === 500) {
          errorMessage = 'Erreur serveur: réponse HTML au lieu de JSON';
        } else {
          errorMessage = `${errorMessage}: Réponse serveur invalide`;
        }
      }
    } catch (parseError) {
      console.error('❌ Impossible de parser la réponse d\'erreur:', parseError);
      errorMessage = `${errorMessage}: ${response.statusText}`;
    }
    
    // Gestion spéciale pour l'authentification
    if (response.status === 401) {
      console.error('🔒 Erreur d\'authentification - Token invalide ou expiré');
      errorMessage = 'Session expirée - Veuillez vous reconnecter';
    } else if (response.status === 403) {
      console.error('🚫 Accès refusé - Permissions insuffisantes');
      errorMessage = 'Accès refusé - Vous n\'avez pas les permissions nécessaires';
    } else if (response.status === 404) {
      if (response.url.includes('/api/staff')) {
        errorMessage = 'Endpoint /api/staff non trouvé - Vérifiez le serveur backend';
      } else {
        errorMessage = 'Ressource non trouvée sur le serveur';
      }
    } else if (response.status >= 500) {
      console.error('🔥 Erreur serveur - Détails:', { errorMessage, errorDetails });
    }
    
    throw new Error(errorMessage);
  }
  
  return await response.json();
};

// === VALIDATION DES DONNÉES ===
const validateStaffData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Champs obligatoires
  if (!data.first_name?.trim()) {
    errors.push('Le prénom est obligatoire');
  }
  
  if (!data.last_name?.trim()) {
    errors.push('Le nom de famille est obligatoire');
  }
  
  // Validation email (si fourni)
  if (data.email && data.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push('L\'adresse email n\'est pas valide');
    }
  }
  
  // Validation téléphone (si fourni)
  if (data.phone && data.phone.trim()) {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,}$/;
    if (!phoneRegex.test(data.phone.trim())) {
      errors.push('Le numéro de téléphone n\'est pas valide');
    }
  }
  
  // Validation salaire (si fourni)
  if (data.salary && (isNaN(parseFloat(data.salary)) || parseFloat(data.salary) < 0)) {
    errors.push('Le salaire doit être un nombre positif');
  }
  
  // Validation statut
  if (data.status && !['active', 'inactive', 'on_leave'].includes(data.status)) {
    errors.push('Le statut doit être: active, inactive ou on_leave');
  }

  // Validation genre
  if (data.gender && !['male', 'female', 'other'].includes(data.gender)) {
    errors.push('Genre invalide');
  }

  // Validation type de contrat
  if (data.contract_type && !['cdi', 'cdd'].includes(data.contract_type)) {
    errors.push('Type de contrat invalide');
  }

  // Validation type d'emploi
  if (data.employment_type && !['full_time', 'part_time', 'half_time'].includes(data.employment_type)) {
    errors.push('Type d\'emploi invalide');
  }

  // Validation âge
  if (data.date_of_birth) {
    const birthDate = new Date(data.date_of_birth);
    const now = new Date();
    const age = now.getFullYear() - birthDate.getFullYear();
    if (age < 16 || age > 80) {
      errors.push('L\'âge doit être entre 16 et 80 ans');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// === SERVICE PRINCIPAL ===
class DatabaseStaffService {
  // Test de connexion à l'API
  async testConnection(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log('🧪 Test connexion API backend:', STAFF_ENDPOINT + '/test');
      
      const response = await fetch(`${STAFF_ENDPOINT}/test`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await handleApiResponse(response);
      console.log('✅ Connexion API réussie:', data);
      
      return {
        success: true,
        message: data.message || 'API Backend connectée et fonctionnelle'
      };
      
    } catch (error: any) {
      console.error('❌ Échec connexion API:', error);
      return {
        success: false,
        error: error.message || 'Impossible de se connecter au serveur backend'
      };
    }
  }

  // Récupérer la liste du personnel depuis la base de données
  async getStaffList(params: StaffListParams = {}): Promise<StaffListApiResponse> {
    try {
      console.log('📋 [DB] Récupération liste personnel:', params);
      
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const url = `${STAFF_ENDPOINT}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🌐 URL complète:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await handleApiResponse(response);
      console.log('✅ [DB] Personnel récupéré:', data);
      
      return {
        success: true,
        staff: data.staff || [],
        pagination: data.pagination || {
          current_page: 1,
          total_pages: 1,
          total_items: 0,
          per_page: 12
        }
      };
      
    } catch (error: any) {
      console.error('❌ [DB] Erreur récupération personnel:', error);
      return {
        success: false,
        error: error.message,
        staff: [],
        pagination: { current_page: 1, total_pages: 1, total_items: 0, per_page: 12 }
      };
    }
  }

  // Récupérer un employé par ID depuis la base de données
  async getStaffById(id: string): Promise<StaffApiResponse> {
    try {
      console.log('👤 [DB] Récupération employé ID:', id);
      
      const response = await fetch(`${STAFF_ENDPOINT}/${id}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await handleApiResponse(response);
      console.log('✅ [DB] Employé récupéré:', data);
      
      return {
        success: true,
        employee: data.employee || data.staff
      };
      
    } catch (error: any) {
      console.error('❌ [DB] Erreur récupération employé:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Upload photo d'un employé
  async uploadStaffPhoto(staffId: string, photoFile: File): Promise<PhotoUploadResponse> {
    try {
      console.log('📸 [DB] Upload photo employé:', staffId);
      
      if (!photoFile.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image');
      }

      if (photoFile.size > 5 * 1024 * 1024) {
        throw new Error('La taille de l\'image ne peut pas dépasser 5MB');
      }

      const formData = new FormData();
      formData.append('photo', photoFile);

      const response = await fetch(`${STAFF_ENDPOINT}/${staffId}/upload-photo`, {
        method: 'POST',
        headers: getAuthHeadersForUpload(),
        body: formData
      });

      const data = await handleApiResponse(response);
      console.log('✅ [DB] Photo uploadée avec succès:', data);
      
      return {
        success: true,
        photoUrl: data.photoUrl,
        file: data.file,
        message: data.message || 'Photo uploadée avec succès'
      };

    } catch (error: any) {
      console.error('❌ [DB] Erreur upload photo:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'upload de la photo'
      };
    }
  }

  // Supprimer photo d'un employé
  async deleteStaffPhoto(staffId: string): Promise<ApiResponse> {
    try {
      console.log('🗑️ [DB] Suppression photo employé:', staffId);
      
      const response = await fetch(`${STAFF_ENDPOINT}/${staffId}/photo`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await handleApiResponse(response);
      console.log('✅ [DB] Photo supprimée avec succès:', data);
      
      return {
        success: true,
        message: data.message || 'Photo supprimée avec succès'
      };

    } catch (error: any) {
      console.error('❌ [DB] Erreur suppression photo:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la suppression de la photo'
      };
    }
  }

  // ✅ CRÉER UN EMPLOYÉ AVEC VALIDATION ET GESTION D'ERREUR AMÉLIORÉE
  async createStaff(staffData: StaffFormData): Promise<StaffApiResponse> {
    try {
      console.log('➕ [DB] Création employé dans la base de données:', staffData);
      
      // ✅ VALIDATION DES DONNÉES AVANT ENVOI
      const validation = validateStaffData(staffData);
      if (!validation.isValid) {
        throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
      }
      
      // Vérifier l'authentification avant l'appel
      const authData = getStoredAuthData();
      if (!authData || !(authData.accessToken || authData.token)) {
        throw new Error('Utilisateur non connecté - Veuillez vous reconnecter');
      }
      
      // ✅ NETTOYER ET PRÉPARER LES DONNÉES
      const cleanedData = {
        first_name: staffData.first_name.trim(),
        last_name: staffData.last_name.trim(),
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
        emergency_contact: staffData.emergency_contact?.trim() || null,
        emergency_phone: staffData.emergency_phone?.trim() || null,
        payment_method: staffData.payment_method?.trim() || null,
        bank_account: staffData.bank_account?.trim() || null,
        date_of_birth: staffData.date_of_birth || null,
        gender: staffData.gender || null,
        nationality: staffData.nationality?.trim() || null,
        contract_type: staffData.contract_type || null,
        employment_type: staffData.employment_type || 'full_time'
      };
      
      console.log('📤 [DB] Données nettoyées envoyées à l\'API:', cleanedData);
      
      const response = await fetch(STAFF_ENDPOINT, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(cleanedData)
      });
      
      const data = await handleApiResponse(response);
      const newEmployee = data.employee || data.staff;
      console.log('✅ [DB] Employé créé avec succès dans la base:', data);

      // Upload photo si fournie
      if (staffData.photoFile && newEmployee?.id) {
        const photoResult = await this.uploadStaffPhoto(newEmployee.id, staffData.photoFile);
        if (photoResult.success) {
          newEmployee.photo_url = photoResult.photoUrl;
        }
      }
      
      // Déclencher événement pour notifier les composants
      window.dispatchEvent(new CustomEvent('staffListUpdated', {
        detail: { action: 'create', employee: newEmployee }
      }));
      
      return {
        success: true,
        employee: newEmployee,
        message: data.message || 'Employé créé avec succès dans la base de données'
      };
      
    } catch (error: any) {
      console.error('❌ [DB] Erreur création employé:', error);
      
      // ✅ GESTION SPÉCIALE DES ERREURS D'AUTHENTIFICATION
      if (error.message.includes('401') || error.message.includes('Session expirée')) {
        console.error('🔒 Problème d\'authentification détecté');
        
        // Debug de l'authentification
        console.log('🔍 État de l\'authentification:', {
          authData: getStoredAuthData(),
          localStorage: localStorage.getItem('auth_token'),
          sessionStorage: sessionStorage.getItem('auth_token')
        });
      }
      
      return {
        success: false,
        error: error.message || 'Erreur lors de la création dans la base de données'
      };
    }
  }

  // ✅ MODIFIER UN EMPLOYÉ AVEC VALIDATION AMÉLIORÉE
  async updateStaff(id: string, staffData: StaffFormData): Promise<StaffApiResponse> {
    try {
      console.log('✏️ [DB] Modification employé dans la base de données:', id, staffData);
      
      // ✅ VALIDATION DES DONNÉES AVANT ENVOI
      const validation = validateStaffData(staffData);
      if (!validation.isValid) {
        throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
      }
      
      // Vérifier l'authentification avant l'appel
      const authData = getStoredAuthData();
      if (!authData || !(authData.accessToken || authData.token)) {
        throw new Error('Utilisateur non connecté - Veuillez vous reconnecter');
      }
      
      // ✅ NETTOYER ET PRÉPARER LES DONNÉES
      const cleanedData = {
        first_name: staffData.first_name.trim(),
        last_name: staffData.last_name.trim(),
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
        emergency_contact: staffData.emergency_contact?.trim() || null,
        emergency_phone: staffData.emergency_phone?.trim() || null,
        payment_method: staffData.payment_method?.trim() || null,
        bank_account: staffData.bank_account?.trim() || null,
        date_of_birth: staffData.date_of_birth || null,
        gender: staffData.gender || null,
        nationality: staffData.nationality?.trim() || null,
        contract_type: staffData.contract_type || null,
        employment_type: staffData.employment_type || null
      };
      
      console.log('📤 [DB] Données de mise à jour envoyées:', cleanedData);
      
      const response = await fetch(`${STAFF_ENDPOINT}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(cleanedData)
      });
      
      const data = await handleApiResponse(response);
      const updatedEmployee = data.employee || data.staff;
      console.log('✅ [DB] Employé modifié avec succès dans la base:', data);

      // Upload nouvelle photo si fournie
      if (staffData.photoFile && updatedEmployee?.id) {
        const photoResult = await this.uploadStaffPhoto(updatedEmployee.id, staffData.photoFile);
        if (photoResult.success) {
          updatedEmployee.photo_url = photoResult.photoUrl;
        }
      }
      
      // Déclencher événement pour notifier les composants
      window.dispatchEvent(new CustomEvent('staffListUpdated', {
        detail: { action: 'update', employee: updatedEmployee }
      }));
      
      return {
        success: true,
        employee: updatedEmployee,
        message: data.message || 'Employé modifié avec succès dans la base de données'
      };
      
    } catch (error: any) {
      console.error('❌ [DB] Erreur modification employé:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la modification dans la base de données'
      };
    }
  }

  // Supprimer un employé de la base de données
  async deleteStaff(id: string): Promise<ApiResponse> {
    try {
      console.log('🗑️ [DB] Suppression employé de la base de données:', id);
      
      const authData = getStoredAuthData();
      if (!authData || !(authData.accessToken || authData.token)) {
        throw new Error('Utilisateur non connecté - Veuillez vous reconnecter');
      }
      
      const response = await fetch(`${STAFF_ENDPOINT}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      const data = await handleApiResponse(response);
      console.log('✅ [DB] Employé supprimé avec succès de la base:', data);
      
      // Déclencher événement pour notifier les composants
      window.dispatchEvent(new CustomEvent('staffListUpdated', {
        detail: { action: 'delete', employeeId: id }
      }));
      
      return {
        success: true,
        message: data.message || 'Employé supprimé avec succès de la base de données'
      };
      
    } catch (error: any) {
      console.error('❌ [DB] Erreur suppression employé:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la suppression de la base de données'
      };
    }
  }

  // Récupérer les types de contrats
  async getContractTypes(): Promise<{ success: boolean; contractTypes: any[]; error?: string }> {
    try {
      const response = await fetch(`${STAFF_ENDPOINT}/contract-types`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await handleApiResponse(response);
      
      return {
        success: true,
        contractTypes: data.contract_types || CONTRACT_TYPE_OPTIONS
      };
      
    } catch (error: any) {
      return {
        success: true,
        contractTypes: CONTRACT_TYPE_OPTIONS
      };
    }
  }

  // Récupérer les types d'emploi
  async getEmploymentTypes(): Promise<{ success: boolean; employmentTypes: any[]; error?: string }> {
    try {
      const response = await fetch(`${STAFF_ENDPOINT}/employment-types`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await handleApiResponse(response);
      
      return {
        success: true,
        employmentTypes: data.employment_types || EMPLOYMENT_TYPE_OPTIONS
      };
      
    } catch (error: any) {
      return {
        success: true,
        employmentTypes: EMPLOYMENT_TYPE_OPTIONS
      };
    }
  }

  // Statistiques avancées
  async getAdvancedStats(): Promise<{ success: boolean; stats: any; error?: string }> {
    try {
      const response = await fetch(`${STAFF_ENDPOINT}/stats/contracts`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await handleApiResponse(response);
      
      return {
        success: true,
        stats: {
          contract_statistics: data.contract_statistics || [],
          employment_statistics: data.employment_statistics || [],
          photo_statistics: data.photo_statistics || {
            total_staff: 0,
            with_photo: 0,
            without_photo: 0,
            photo_percentage: 0
          }
        }
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        stats: null
      };
    }
  }

  // Recherche globale
  async searchStaff(searchTerm: string): Promise<{ success: boolean; results: Staff[]; error?: string }> {
    try {
      if (!searchTerm || searchTerm.length < 2) {
        return {
          success: false,
          results: [],
          error: 'Terme de recherche trop court (minimum 2 caractères)'
        };
      }
      
      const response = await fetch(`${STAFF_ENDPOINT}/search/${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await handleApiResponse(response);
      
      return {
        success: true,
        results: data.results || []
      };
      
    } catch (error: any) {
      return {
        success: false,
        results: [],
        error: error.message
      };
    }
  }

  // Vérifier les doublons
  async checkDuplicates(email?: string, phone?: string, excludeId?: string): Promise<{ success: boolean; conflicts: any[]; error?: string }> {
    try {
      const response = await fetch(`${STAFF_ENDPOINT}/check-duplicate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: email?.trim(),
          phone: phone?.trim(),
          exclude_id: excludeId
        })
      });
      
      const data = await handleApiResponse(response);
      
      return {
        success: true,
        conflicts: data.conflicts || []
      };
      
    } catch (error: any) {
      return {
        success: false,
        conflicts: [],
        error: error.message
      };
    }
  }

  // Export CSV
  async exportStaffCSV(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${STAFF_ENDPOINT}/export/csv`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `staff_export_${timestamp}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        message: 'Export CSV téléchargé avec succès'
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'export CSV'
      };
    }
  }

  // Import CSV
  async importStaffCSV(csvFile: File): Promise<{ success: boolean; imported: number; errors: string[]; message?: string }> {
    try {
      if (!csvFile.name.endsWith('.csv')) {
        throw new Error('Le fichier doit être au format CSV');
      }

      if (csvFile.size > 10 * 1024 * 1024) {
        throw new Error('La taille du fichier ne peut pas dépasser 10MB');
      }

      const formData = new FormData();
      formData.append('csv', csvFile);

      const response = await fetch(`${STAFF_ENDPOINT}/import/csv`, {
        method: 'POST',
        headers: getAuthHeadersForUpload(),
        body: formData
      });

      const data = await handleApiResponse(response);

      window.dispatchEvent(new CustomEvent('staffListUpdated', {
        detail: { action: 'bulk_import', count: data.imported }
      }));

      return {
        success: true,
        imported: data.imported || 0,
        errors: data.errors || [],
        message: data.message || `${data.imported} employés importés avec succès`
      };

    } catch (error: any) {
      return {
        success: false,
        imported: 0,
        errors: [error.message],
        message: error.message || 'Erreur lors de l\'import CSV'
      };
    }
  }

  // Statistiques complètes
  async getStaffStatistics(): Promise<{ success: boolean; stats: StaffStatistics | null; error?: string }> {
    try {
      const response = await fetch(`${STAFF_ENDPOINT}/stats`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await handleApiResponse(response);
      
      return {
        success: true,
        stats: {
          total_staff: data.total_staff || 0,
          active_staff: data.active_staff || 0,
          inactive_staff: data.inactive_staff || 0,
          on_leave_staff: data.on_leave_staff || 0,
          by_position: data.by_position || {},
          by_department: data.by_department || {},
          by_contract_type: data.by_contract_type || {},
          by_employment_type: data.by_employment_type || {},
          average_salary: data.average_salary || 0,
          total_salary_budget: data.total_salary_budget || 0,
          recent_hires: data.recent_hires || [],
          upcoming_birthdays: data.upcoming_birthdays || []
        }
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        stats: null
      };
    }
  }

  // Mise à jour en masse du statut
  async bulkUpdateStatus(staffIds: string[], status: 'active' | 'inactive' | 'on_leave', reason?: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${STAFF_ENDPOINT}/bulk/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          staff_ids: staffIds,
          status,
          reason
        })
      });

      const data = await handleApiResponse(response);

      window.dispatchEvent(new CustomEvent('staffListUpdated', {
        detail: { action: 'bulk_status_change', staffIds, newStatus: status }
      }));

      return {
        success: true,
        message: data.message || `Statut mis à jour pour ${staffIds.length} employés`
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Suppression en masse
  async bulkDelete(staffIds: string[]): Promise<ApiResponse> {
    try {
      const response = await fetch(`${STAFF_ENDPOINT}/bulk/delete`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          staff_ids: staffIds
        })
      });

      const data = await handleApiResponse(response);

      window.dispatchEvent(new CustomEvent('staffListUpdated', {
        detail: { action: 'bulk_delete', staffIds }
      }));

      return {
        success: true,
        message: data.message || `${staffIds.length} employés supprimés avec succès`
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Génération de rapports
  async generateStaffReport(reportType: 'summary' | 'detailed' | 'payroll', filters?: StaffListParams): Promise<{ success: boolean; reportUrl?: string; error?: string }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '' && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `${STAFF_ENDPOINT}/reports/${reportType}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const reportUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = reportUrl;
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `staff_report_${reportType}_${timestamp}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return {
        success: true,
        reportUrl,
        message: 'Rapport généré et téléchargé avec succès'
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de la génération du rapport'
      };
    }
  }

  // Historique d'un employé
  async getStaffHistory(staffId: string): Promise<{ success: boolean; history: any[]; error?: string }> {
    try {
      const response = await fetch(`${STAFF_ENDPOINT}/${staffId}/history`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await handleApiResponse(response);
      
      return {
        success: true,
        history: data.history || []
      };
      
    } catch (error: any) {
      return {
        success: false,
        history: [],
        error: error.message
      };
    }
  }

  // Récupérer les enseignants actifs
  async getActiveTeachers(): Promise<{ success: boolean; teachers: Staff[]; error?: string }> {
    try {
      console.log('👨‍🏫 [DB] Récupération enseignants actifs');
      
      const params: StaffListParams = {
        position: 'teacher',
        status: 'active',
        limit: 100
      };
      
      const result = await this.getStaffList(params);
      
      return {
        success: result.success,
        teachers: result.staff || [],
        error: result.error
      };
      
    } catch (error: any) {
      console.error('❌ [DB] Erreur récupération enseignants:', error);
      return {
        success: false,
        teachers: [],
        error: error.message
      };
    }
  }

  // Changer le statut d'un employé
  async changeStaffStatus(id: string, status: 'active' | 'inactive' | 'on_leave', reason?: string): Promise<ApiResponse> {
    try {
      console.log(`🔄 [DB] Changement statut employé ${id} vers ${status}`);
      
      const response = await fetch(`${STAFF_ENDPOINT}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, reason })
      });
      
      const data = await handleApiResponse(response);
      console.log('✅ [DB] Statut changé avec succès:', data);
      
      // Déclencher événement pour notifier les composants
      window.dispatchEvent(new CustomEvent('staffListUpdated', {
        detail: { action: 'status_change', employeeId: id, newStatus: status }
      }));
      
      return {
        success: true,
        message: data.message || 'Statut changé avec succès'
      };
      
    } catch (error: any) {
      console.error('❌ [DB] Erreur changement statut:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Récupérer les positions disponibles
  async getPositions(): Promise<{ success: boolean; positions: PositionOption[]; error?: string }> {
    return { success: true, positions: POSITION_OPTIONS };
  }

  // Récupérer les départements disponibles
  async getDepartments(): Promise<{ success: boolean; departments: DepartmentOption[]; error?: string }> {
    return { success: true, departments: DEPARTMENT_OPTIONS };
  }

  // Vérifier l'état de la base de données
  async getDatabaseStatus() {
    try {
      const connectionTest = await this.testConnection();
      const listTest = await this.getStaffList({ limit: 1 });
      
      return {
        connected: connectionTest.success,
        canRead: listTest.success,
        endpoint: STAFF_ENDPOINT,
        authStatus: getStoredAuthData() ? 'Authentifié' : 'Non authentifié',
        message: connectionTest.success 
          ? 'Base de données PostgreSQL connectée et opérationnelle' 
          : connectionTest.error
      };
      
    } catch (error: any) {
      return {
        connected: false,
        canRead: false,
        endpoint: STAFF_ENDPOINT,
        authStatus: 'Erreur',
        message: error.message
      };
    }
  }

  // Alias pour getStatus (compatibilité)
  async getStatus() {
    return await this.getDatabaseStatus();
  }

  // Fonction utilitaire pour obtenir les statistiques
  async getStats() {
    try {
      const response = await fetch(`${STAFF_ENDPOINT}/stats`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const data = await handleApiResponse(response);
      return {
        success: true,
        stats: data.stats
      };
      
    } catch (error: any) {
      console.error('❌ [DB] Erreur récupération statistiques:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ FONCTION DE DEBUG AMÉLIORÉE POUR L'AUTHENTIFICATION
  async debugAuth() {
    const authData = getStoredAuthData();
    
    console.log('🔍 === DEBUG AUTHENTIFICATION DÉTAILLÉ ===');
    console.log('📊 Auth Data:', authData);
    console.log('🔑 Headers générés:', getAuthHeaders());
    console.log('💾 localStorage auth_token:', localStorage.getItem('auth_token'));
    console.log('💾 sessionStorage auth_token:', sessionStorage.getItem('auth_token'));
    console.log('💾 localStorage auth_data:', localStorage.getItem('auth_data'));
    console.log('💾 sessionStorage auth_data:', sessionStorage.getItem('auth_data'));
    console.log('💾 localStorage auth_data_v3:', localStorage.getItem('auth_data_v3'));
    console.log('🌐 API Endpoint:', STAFF_ENDPOINT);
    console.log('🔧 Environment:', import.meta.env.VITE_API_URL);
    
    // Test de connexion en temps réel
    try {
      const testResult = await this.testConnection();
      console.log('🧪 Test connexion en temps réel:', testResult);
    } catch (error) {
      console.error('❌ Erreur test connexion:', error);
    }
    
    console.log('🔍 === FIN DEBUG AUTHENTIFICATION ===');
    
    return {
      hasToken: !!(authData?.accessToken || authData?.token),
      authData: authData,
      headers: getAuthHeaders(),
      endpoint: STAFF_ENDPOINT,
      environment: import.meta.env.VITE_API_URL
    };
  }
}

// === FONCTIONS UTILITAIRES (NON EXPORTÉES INDIVIDUELLEMENT) ===
const getPositionLabel = (position: string): string => {
  const option = POSITION_OPTIONS.find(opt => opt.value === position);
  return option ? option.label : position;
};

const getDepartmentLabel = (department: string): string => {
  const option = DEPARTMENT_OPTIONS.find(opt => opt.value === department);
  return option ? option.label : department;
};

const getContractTypeLabel = (contractType: string): string => {
  const option = CONTRACT_TYPE_OPTIONS.find(opt => opt.value === contractType);
  return option ? option.label : contractType;
};

const getEmploymentTypeLabel = (employmentType: string): string => {
  const option = EMPLOYMENT_TYPE_OPTIONS.find(opt => opt.value === employmentType);
  return option ? option.label : employmentType;
};

const getStatusLabel = (status: string): string => {
  const statusLabels = {
    'active': 'Actif',
    'inactive': 'Inactif',
    'on_leave': 'En congé'
  };
  return statusLabels[status as keyof typeof statusLabels] || status;
};

const getGenderLabel = (gender: string): string => {
  const genderLabels = {
    'male': 'Homme',
    'female': 'Femme',
    'other': 'Autre'
  };
  return genderLabels[gender as keyof typeof genderLabels] || gender;
};

const formatSalary = (salary: number): string => {
  if (!salary) return 'Non spécifié';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(salary);
};

const generateInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
};

const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const formatHireDate = (hireDate: string): string => {
  if (!hireDate) return 'Non spécifié';
  return new Date(hireDate).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const calculateSeniority = (hireDate: string): string => {
  if (!hireDate) return 'Non spécifié';
  const hire = new Date(hireDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - hire.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  
  if (years > 0) {
    return `${years} an${years > 1 ? 's' : ''} ${months > 0 ? `et ${months} mois` : ''}`;
  } else if (months > 0) {
    return `${months} mois`;
  } else {
    return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  }
};

const isValidPhotoUrl = (photoUrl?: string): boolean => {
  if (!photoUrl) return false;
  try {
    new URL(photoUrl);
    return true;
  } catch {
    return false;
  }
};

const getPhotoUrl = (staff: Staff): string | null => {
  if (staff.photo_url && isValidPhotoUrl(staff.photo_url)) {
    if (staff.photo_url.startsWith('/')) {
      return `${API_BASE_URL}${staff.photo_url}`;
    }
    return staff.photo_url;
  }
  return null;
};

// === INSTANCE UNIQUE ===
const staffService = new DatabaseStaffService();

// Test de connexion automatique au démarrage avec debug auth
staffService.testConnection().then(result => {
  if (result.success) {
    console.log('✅ Service personnel configuré et connecté à PostgreSQL');
    console.log('📊 Toutes les opérations seront sauvegardées dans la base de données');
  } else {
    console.error('❌ ERREUR: Impossible de se connecter à la base de données');
    console.error('🔧 Vérifiez que le serveur backend est démarré sur:', API_BASE_URL);
    console.error('❌ Erreur:', result.error);
    
    // Debug automatique en cas d'erreur
    staffService.debugAuth();
  }
});

// === EXPORT PAR DÉFAUT ===
export default staffService;

// === EXPORTS NOMMÉS COMPLETS POUR COMPATIBILITÉ ===
export { 
  staffService,
  DatabaseStaffService,
  POSITION_OPTIONS,
  DEPARTMENT_OPTIONS,
  CONTRACT_TYPE_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  validateStaffData,
  getStoredAuthData,
  getAuthHeaders,
  getAuthHeadersForUpload,
  handleApiResponse,
  getPositionLabel,
  getDepartmentLabel,
  getContractTypeLabel,
  getEmploymentTypeLabel,
  getStatusLabel,
  getGenderLabel,
  formatSalary,
  generateInitials,
  calculateAge,
  formatHireDate,
  calculateSeniority,
  isValidPhotoUrl,
  getPhotoUrl
};

// === EXPORTS DE TYPES TYPESCRIPT ===
export type {
  Staff,
  StaffFormData,
  StaffListParams,
  ApiResponse,
  StaffApiResponse,
  StaffListApiResponse,
  PhotoUploadResponse,
  PositionOption,
  DepartmentOption,
  StaffStatistics
};