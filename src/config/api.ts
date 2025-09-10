// src/config/api.ts - Configuration API Frontend avec sessions adaptatives

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  // === AUTH ENDPOINTS PRINCIPAUX ===
  SIGNIN: `${API_BASE_URL}/api/auth/signin`,
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  ME: `${API_BASE_URL}/api/auth/me`,
  CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
  
  // ✨ NOUVEAUX : SESSIONS ROBUSTES ET REFRESH TOKENS
  REFRESH_TOKEN: `${API_BASE_URL}/api/auth/refresh-token`,
  HEARTBEAT: `${API_BASE_URL}/api/auth/heartbeat`,
  CONNECTION_STATUS: `${API_BASE_URL}/api/auth/connection-status`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  
  // === PREMIÈRE CONNEXION ===
  VERIFY_EMAIL: `${API_BASE_URL}/api/auth/verify-email`,
  GENERATE_FIRST_LOGIN_TOKEN: `${API_BASE_URL}/api/auth/generate-first-login-token`,
  VERIFY_FIRST_LOGIN_TOKEN: `${API_BASE_URL}/api/auth/verify-first-login-token`,
  SETUP_FIRST_PASSWORD: `${API_BASE_URL}/api/auth/setup-first-password`,
  FIRST_LOGIN: `${API_BASE_URL}/api/auth/first-login`, // ✨ AJOUT
  
  // === ADMIN ENDPOINTS CRUD ===
  CREATE_ADMIN: `${API_BASE_URL}/api/auth/create-admin`,
  LIST_ADMINS: `${API_BASE_URL}/api/auth/admins`,
  GET_ADMIN: (id: string) => `${API_BASE_URL}/api/auth/admins/${id}`,
  UPDATE_ADMIN: (id: string) => `${API_BASE_URL}/api/auth/admins/${id}`,
  DELETE_ADMIN: (id: string) => `${API_BASE_URL}/api/auth/admins/${id}`,
  
  // === RESET PASSWORD ===
  DIRECT_RESET_PASSWORD: `${API_BASE_URL}/api/auth/direct-reset-password`,
  
  // === PROFIL ===
  PROFILE: `${API_BASE_URL}/api/admin/profile`,
  UPLOAD_AVATAR: `${API_BASE_URL}/api/admin/upload-avatar`,
  DELETE_AVATAR: `${API_BASE_URL}/api/admin/avatar`,
  UPDATE_PROFILE: `${API_BASE_URL}/api/admin/profile`,
  
  // === STATISTIQUES ===
  ADMIN_STATS: `${API_BASE_URL}/api/admin/stats`,
  
  // ✨ NOUVEAU : DEBUG ET MONITORING
  AUTH_STATS: `${API_BASE_URL}/api/auth/debug/auth-stats`,
  
  // === TEST ET SANTÉ ===
  TEST: `${API_BASE_URL}/api/test`,
  TEST_AUTH: `${API_BASE_URL}/api/auth/test`,
  HEALTH: `${API_BASE_URL}/api/auth/health`,
  API_INFO: `${API_BASE_URL}/api`,
  API_HEALTH: `${API_BASE_URL}/api/health`,
  CLEANUP_EXPIRED_TOKENS: `${API_BASE_URL}/api/auth/cleanup-expired-tokens`,
  
  // ✨ NOUVEAU : Endpoints dynamiques pour compatibilité
  REFRESH: `${API_BASE_URL}/api/auth/refresh`, // Alias pour REFRESH_TOKEN
  // ✨ NOUVEAUX : ENDPOINTS ANNÉES SCOLAIRES
  SCHOOL_YEARS: `${API_BASE_URL}/api/school-years`,
  SCHOOL_YEARS_CURRENT: `${API_BASE_URL}/api/school-years/current`,
  SCHOOL_YEARS_STATS: `${API_BASE_URL}/api/school-years/stats/overview`,
  SCHOOL_YEARS_OPTIONS: `${API_BASE_URL}/api/school-years/options/select`,
  SCHOOL_YEARS_QUICK: `${API_BASE_URL}/api/quick/school-years`,
  SCHOOL_YEARS_TEST: `${API_BASE_URL}/api/school-years/test`,
  
  // Fonctions dynamiques pour les années scolaires
  SCHOOL_YEAR_BY_ID: (id: string) => `${API_BASE_URL}/api/school-years/${id}`,
  SCHOOL_YEAR_SET_CURRENT: (id: string) => `${API_BASE_URL}/api/school-years/${id}/set-current`,
  SCHOOL_YEAR_ARCHIVE: (id: string) => `${API_BASE_URL}/api/school-years/${id}/archive`,
  
  // ✨ ENDPOINTS CLASSES (pour plus tard)
  CLASSES: `${API_BASE_URL}/api/classes`,
  CLASSES_ACTIVE: `${API_BASE_URL}/api/classes/active`,
  CLASSES_TEACHERS: `${API_BASE_URL}/api/classes/teachers/available`,
  CLASSES_STATS: `${API_BASE_URL}/api/classes/stats/overview`,
  CLASSES_QUICK: `${API_BASE_URL}/api/quick/classes`,
  CLASSES_TEST: `${API_BASE_URL}/api/classes/test`,
  
  // Fonctions dynamiques pour les classes
  CLASS_BY_ID: (id: string) => `${API_BASE_URL}/api/classes/${id}`,
  CLASS_DUPLICATE: (id: string) => `${API_BASE_URL}/api/classes/${id}/duplicate`,
  
  // Routes rapides
  QUICK_TEACHERS: `${API_BASE_URL}/api/quick/teachers`,
};

// ✨ Interface pour les données d'authentification stockées (compatibilité AuthService)
interface StoredAuthData {
  accessToken: string;
  refreshToken: string | null;
  user: any;
  rememberMe: boolean;
  sessionMetadata?: any;
  storedAt: number;
  updatedAt?: number;
  version: string;
}

// Configuration par défaut pour les requêtes
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// ✨ AMÉLIORÉE : Fonction pour obtenir les données d'auth complètes
const getStoredAuthData = (): StoredAuthData | null => {
  try {
    // Priorité 1: Format useAuth (notre nouveau format)
    let authDataStr = localStorage.getItem('auth_data') || sessionStorage.getItem('auth_data');
    if (authDataStr) {
      const data = JSON.parse(authDataStr);
      // Vérifier que c'est un format valide
      if (data.accessToken && data.version) {
        return {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || null,
          user: data.user,
          rememberMe: data.rememberMe || false,
          sessionMetadata: data.sessionMetadata,
          storedAt: data.savedAt || Date.now(),
          version: data.version || '3.0'
        };
      }
    }

    // Priorité 2: Format v3.0 (pour compatibilité future)
    authDataStr = localStorage.getItem('auth_data_v3') || sessionStorage.getItem('auth_data_v3');
    if (authDataStr) {
      return JSON.parse(authDataStr);
    }

    // Priorité 3: Format legacy
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user_info');
    
    if (token && userStr) {
      return {
        accessToken: token,
        refreshToken: null,
        user: JSON.parse(userStr),
        rememberMe: !!localStorage.getItem('auth_token'),
        storedAt: Date.now(),
        version: '1.0'
      };
    }

    return null;
  } catch (error) {
    console.error('💥 Erreur récupération auth data:', error);
    return null;
  }
};

// ✨ AMÉLIORÉE : Fonction utilitaire pour obtenir les headers avec tokens
export const getAuthHeaders = (includeRefreshToken: boolean = false): HeadersInit => {
  const authData = getStoredAuthData();
  
  const headers: HeadersInit = {
    ...DEFAULT_HEADERS,
  };

  if (authData?.accessToken) {
    headers['Authorization'] = `Bearer ${authData.accessToken}`;
  }

  if (includeRefreshToken && authData?.refreshToken) {
    headers['X-Refresh-Token'] = authData.refreshToken;
  }

  return headers;
};

// ✨ AMÉLIORÉE : Fonction pour gérer la mise à jour automatique des tokens
const handleTokenRefresh = (response: Response): void => {
  const newAccessToken = response.headers.get('X-New-Access-Token');
  const newRefreshToken = response.headers.get('X-New-Refresh-Token');

  if (newAccessToken && newRefreshToken) {
    console.log('🔄 Tokens mis à jour automatiquement par le serveur');
    
    const authData = getStoredAuthData();
    if (authData) {
      const updatedAuthData: StoredAuthData = {
        ...authData,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        updatedAt: Date.now()
      };

      // ✨ AMÉLIORATION : Stocker dans le format useAuth (prioritaire)
      const storage = authData.rememberMe ? localStorage : sessionStorage;
      storage.setItem('auth_data', JSON.stringify({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: authData.user,
        profile: authData.user, // Compatibilité
        expirationTime: Date.now() + (authData.rememberMe ? 24 * 60 * 60 * 1000 : 30 * 60 * 1000),
        rememberMe: authData.rememberMe,
        savedAt: Date.now(),
        version: '3.0',
        connectionQuality: authData.sessionMetadata?.connectionQuality || 'stable',
        sessionMetadata: authData.sessionMetadata
      }));
      
      // Aussi sauver le token seul pour compatibilité
      storage.setItem('auth_token', newAccessToken);
    }
  }
};

// ✨ AMÉLIORÉE : Fonction utilitaire pour les requêtes API avec gestion refresh automatique
export const apiRequest = async (
  url: string, 
  options: RequestInit = {},
  includeRefreshToken: boolean = false
): Promise<any> => {
  const defaultOptions: RequestInit = {
    headers: getAuthHeaders(includeRefreshToken),
    credentials: 'include',
  };

  try {
    console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    // ✨ NOUVEAU : Gérer les tokens automatiquement mis à jour
    handleTokenRefresh(response);
    
    // Gérer les réponses sans contenu
    if (response.status === 204) {
      return { success: true };
    }
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error(`Erreur de format de réponse: ${response.status} ${response.statusText}`);
    }
    
    if (!response.ok) {
      // Gestion spéciale pour FIRST_LOGIN_REQUIRED
      if (response.status === 403 && data.error === 'FIRST_LOGIN_REQUIRED') {
        const error = new Error(data.error);
        (error as any).requiresFirstLogin = true;
        (error as any).user = data.user;
        (error as any).message = data.message;
        throw error;
      }

      // ✨ NOUVEAU : Gestion 401 avec refresh automatique
      if (response.status === 401 && !url.includes('refresh-token')) {
        console.log('🔑 Token expiré, tentative de refresh automatique...');
        
        const authData = getStoredAuthData();
        if (authData?.refreshToken) {
          try {
            const refreshResponse = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Refresh-Token': authData.refreshToken,
              },
              credentials: 'include',
              body: JSON.stringify({ refreshToken: authData.refreshToken }),
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              
              if (refreshData.success && refreshData.accessToken) {
                console.log('✅ Token refreshed automatiquement, retry de la requête...');
                
                // Mettre à jour les données stockées
                const updatedAuthData: StoredAuthData = {
                  ...authData,
                  accessToken: refreshData.accessToken,
                  refreshToken: refreshData.refreshToken || authData.refreshToken,
                  updatedAt: Date.now()
                };

                const storage = authData.rememberMe ? localStorage : sessionStorage;
                storage.setItem('auth_data', JSON.stringify({
                  accessToken: refreshData.accessToken,
                  refreshToken: refreshData.refreshToken || authData.refreshToken,
                  user: authData.user,
                  profile: authData.user,
                  expirationTime: Date.now() + (authData.rememberMe ? 24 * 60 * 60 * 1000 : 30 * 60 * 1000),
                  rememberMe: authData.rememberMe,
                  savedAt: Date.now(),
                  version: '3.0',
                  connectionQuality: refreshData.session?.connectionQuality || 'stable',
                  sessionMetadata: refreshData.session
                }));

                // Retry la requête originale avec le nouveau token
                const retryOptions = {
                  ...options,
                  headers: {
                    ...(options.headers || {}),
                    'Authorization': `Bearer ${refreshData.accessToken}`,
                    ...(includeRefreshToken && { 'X-Refresh-Token': refreshData.refreshToken || authData.refreshToken })
                  }
                };

                return apiRequest(url, retryOptions, includeRefreshToken);
              }
            }
          } catch (refreshError) {
            console.error('❌ Échec refresh automatique:', refreshError);
          }
        }
      }
      
      throw new Error(data.error || `Erreur HTTP ${response.status}: ${response.statusText}`);
    }

    console.log(`✅ API Response: ${response.status} ${url}`);
    return data;
    
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Erreur de connexion au serveur. Vérifiez que le backend est démarré.');
    }
    console.error(`❌ API Error: ${url}`, error);
    throw error;
  }
};

// ✨ NOUVELLE : Wrapper spécialisé pour les requêtes avec refresh token
export const apiRequestWithRefresh = async (url: string, options: RequestInit = {}): Promise<any> => {
  return apiRequest(url, options, true);
};

// ✨ NOUVELLE : Fonction spéciale pour le refresh token compatible useAuth
export const refreshAuthToken = async () => {
  const authData = getStoredAuthData();
  
  if (!authData?.refreshToken) {
    throw new Error('Pas de refresh token disponible');
  }

  try {
    const response = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Refresh-Token': authData.refreshToken,
      },
      credentials: 'include',
      body: JSON.stringify({ 
        refreshToken: authData.refreshToken 
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur refresh: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.accessToken && data.refreshToken) {
      // Sauvegarder dans le format useAuth
      const storage = authData.rememberMe ? localStorage : sessionStorage;
      storage.setItem('auth_data', JSON.stringify({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: authData.user,
        profile: authData.user,
        expirationTime: Date.now() + (authData.rememberMe ? 24 * 60 * 60 * 1000 : 30 * 60 * 1000),
        rememberMe: authData.rememberMe,
        savedAt: Date.now(),
        version: '3.0',
        connectionQuality: data.session?.connectionQuality || 'stable',
        sessionMetadata: data.session
      }));
      
      storage.setItem('auth_token', data.accessToken);
      
      return data;
    } else {
      throw new Error('Réponse refresh invalide');
    }
  } catch (error) {
    console.error('❌ Erreur refresh token:', error);
    throw error;
  }
};

// === FONCTIONS UTILITAIRES SPÉCIFIQUES AUX ADMINS (AMÉLIORÉES) ===

// Lister les administrateurs
export const listAdmins = async () => {
  return apiRequestWithRefresh(API_ENDPOINTS.LIST_ADMINS);
};

// Obtenir un administrateur spécifique
export const getAdmin = async (id: string) => {
  return apiRequestWithRefresh(API_ENDPOINTS.GET_ADMIN(id));
};

// Créer un administrateur
export const createAdmin = async (adminData: AdminData) => {
  return apiRequestWithRefresh(API_ENDPOINTS.CREATE_ADMIN, {
    method: 'POST',
    body: JSON.stringify(adminData),
  });
};

// Modifier un administrateur
export const updateAdmin = async (id: string, adminData: Partial<AdminData>) => {
  return apiRequestWithRefresh(API_ENDPOINTS.UPDATE_ADMIN(id), {
    method: 'PUT',
    body: JSON.stringify(adminData),
  });
};

// Supprimer un administrateur
export const deleteAdmin = async (id: string) => {
  return apiRequestWithRefresh(API_ENDPOINTS.DELETE_ADMIN(id), {
    method: 'DELETE',
  });
};

// ✨ NOUVELLES FONCTIONS POUR SESSIONS ROBUSTES ===

// ✨ CORRIGÉE : Heartbeat pour maintenir la session avec body JSON correct
export const heartbeat = async () => {
  return apiRequestWithRefresh(API_ENDPOINTS.HEARTBEAT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connectionQuality: (navigator as any).connection?.effectiveType || 'unknown'
    })
  });
};

// Obtenir le statut de connexion
export const getConnectionStatus = async () => {
  return apiRequest(API_ENDPOINTS.CONNECTION_STATUS);
};

// Déconnexion avec option tous appareils
export const logout = async (allDevices: boolean = false) => {
  return apiRequestWithRefresh(API_ENDPOINTS.LOGOUT, {
    method: 'POST',
    body: JSON.stringify({ allDevices }),
  });
};

// Obtenir les statistiques d'authentification (Admin uniquement)
export const getAuthStats = async () => {
  return apiRequestWithRefresh(API_ENDPOINTS.AUTH_STATS);
};

// Test de connectivité (AMÉLIORÉ)
export const testApiConnection = async () => {
  try {
    console.log('🔍 Test de connectivité API...');
    
    // Test de l'API principale
    const apiResponse = await fetch(API_ENDPOINTS.API_INFO);
    const apiData = await apiResponse.json();
    
    // Test de l'API auth
    const authResponse = await fetch(API_ENDPOINTS.TEST_AUTH);
    const authData = await authResponse.json();
    
    // Test de santé du système
    const healthResponse = await fetch(API_ENDPOINTS.HEALTH);
    const healthData = await healthResponse.json();
    
    console.log('✅ API entièrement connectée:', {
      api: apiData,
      auth: authData,
      health: healthData
    });
    
    return { 
      success: true, 
      data: {
        api: apiData,
        auth: authData,
        health: healthData,
        endpoints: Object.keys(API_ENDPOINTS).length,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('❌ Erreur connectivité API:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString()
    };
  }
};

// ✨ NOUVELLE : Fonction pour tester la qualité de connexion
export const testConnectionQuality = async (): Promise<{
  quality: 'stable' | 'unstable' | 'offline';
  latency: number;
  recommendations: any;
}> => {
  const startTime = Date.now();
  
  try {
    const response = await fetch(API_ENDPOINTS.CONNECTION_STATUS);
    const latency = Date.now() - startTime;
    const data = await response.json();
    
    return {
      quality: data.connectionQuality || 'stable',
      latency,
      recommendations: data.recommendations
    };
  } catch (error) {
    return {
      quality: 'offline',
      latency: Date.now() - startTime,
      recommendations: {
        short: '24 heures',
        long: '30 jours',
        description: 'Mode hors ligne détecté'
      }
    };
  }
};

// ✨ NOUVELLE : Fonction pour vérifier la santé complète du système
export const getSystemHealth = async () => {
  try {
    const [apiHealth, authHealth, connectionTest] = await Promise.allSettled([
      fetch(API_ENDPOINTS.API_HEALTH).then(r => r.json()),
      fetch(API_ENDPOINTS.HEALTH).then(r => r.json()),
      testConnectionQuality()
    ]);

    return {
      success: true,
      health: {
        api: apiHealth.status === 'fulfilled' ? apiHealth.value : { error: 'Failed' },
        auth: authHealth.status === 'fulfilled' ? authHealth.value : { error: 'Failed' },
        connection: connectionTest.status === 'fulfilled' ? connectionTest.value : { error: 'Failed' },
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur système',
      timestamp: new Date().toISOString()
    };
  }
};

// Types améliorés
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  requestId?: string;
  timestamp?: string;
}

export interface AuthApiResponse extends ApiResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: any;
  requiresFirstLogin?: boolean;
  session?: {
    connectionQuality: 'stable' | 'unstable' | 'offline';
    duration: string;
    rememberMe: boolean;
    expiresIn: string;
    canRefresh: boolean;
    adaptiveSession: boolean;
  };
}

export interface AdminData {
  id?: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'super_admin' | 'teacher' | 'accountant';
  username?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  phone?: string;
  avatar_url?: string;
}

// ✨ NOUVEAUX TYPES
export interface SessionMetadata {
  connectionQuality: 'stable' | 'unstable' | 'offline';
  duration: string;
  rememberMe: boolean;
  expiresIn: string;
  canRefresh: boolean;
  adaptiveSession: boolean;
}

export interface ConnectionQuality {
  quality: 'stable' | 'unstable' | 'offline';
  latency: number;
  recommendations: {
    short: string;
    long: string;
    refresh: string;
    description: string;
  };
}



// Configuration et logging
const config = {
  baseUrl: API_BASE_URL,
  environment: import.meta.env.DEV ? 'development' : 'production',
  endpoints: Object.keys(API_ENDPOINTS).length,
  features: [
    '✅ Sessions adaptatives',
    '✅ Refresh tokens automatiques',
    '✅ Heartbeat intelligent',
    '✅ Gestion erreurs robuste',
    '✅ Compatibilité multi-versions',
    '✅ Compatible useAuth 3.0'
  ]
};

console.log('🔧 Configuration API v3.0 chargée:', config);

// Export de la configuration pour debug
export { config as API_CONFIG };