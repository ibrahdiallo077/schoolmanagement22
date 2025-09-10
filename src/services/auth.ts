// src/services/auth.ts - VERSION CORRIGÉE COMPLÈTE POUR RÉSOUDRE LES PROBLÈMES D'AUTHENTIFICATION

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================================================
// INTERFACES (Simplifiées et corrigées)
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: UserSession;
  requiresFirstLogin?: boolean;
  session?: {
    connectionQuality: string;
    duration: string;
    rememberMe: boolean;
    expiresIn: string;
    canRefresh: boolean;
  };
  requestId?: string;
}

export interface UserSession {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'super_admin' | 'admin' | 'teacher' | 'accountant';
  is_active: boolean;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  phone?: string;
  date_of_birth?: string;
}

// Interface pour les données stockées (simplifiée)
interface StoredAuthData {
  token: string;
  refreshToken?: string;
  user: UserSession;
  rememberMe: boolean;
  storedAt: number;
}

// ============================================================================
// AUTHSERVICE CORRIGÉ
// ============================================================================

export class AuthService {
  
  // ==================== GESTION DES DONNÉES ====================
  
  /**
   * 🧹 NETTOYER TOUTES LES DONNÉES D'AUTHENTIFICATION
   */
  static clearAllAuthData(): void {
    console.log('🧹 Nettoyage complet des données d\'authentification');
    
    // Nettoyer localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user_info');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_data');
    localStorage.removeItem('auth_data_v3');
    
    // Nettoyer sessionStorage
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user_info');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('auth_data');
    sessionStorage.removeItem('auth_data_v3');
    
    console.log('✅ Toutes les données d\'authentification supprimées');
  }

  /**
   * 🔑 OBTENIR LE TOKEN AVEC VALIDATION STRICTE
   */
  static getAuthToken(): string | null {
    // Priorités de recherche
    const sources = [
      localStorage.getItem('auth_token'),
      localStorage.getItem('token'),
      sessionStorage.getItem('auth_token'),
      sessionStorage.getItem('token')
    ];

    for (const token of sources) {
      if (token && 
          token !== 'undefined' && 
          token !== 'null' && 
          token.trim() !== '' &&
          !token.includes('undefined') &&
          token.length > 20) {
        return token;
      }
    }

    // Si aucun token valide trouvé, nettoyer
    console.log('⚠️ Aucun token valide trouvé, nettoyage automatique');
    this.clearAllAuthData();
    return null;
  }

  /**
   * 💾 STOCKER LE TOKEN DE MANIÈRE SÉCURISÉE
   */
  static setAuthToken(token: string, refreshToken?: string, user?: UserSession, rememberMe: boolean = false): void {
    if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
      console.error('❌ Tentative de stockage d\'un token invalide');
      this.clearAllAuthData();
      return;
    }

    console.log('💾 Stockage du token d\'authentification');

    const storage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;

    // Nettoyer l'autre storage
    otherStorage.removeItem('auth_token');
    otherStorage.removeItem('token');
    otherStorage.removeItem('user_info');

    // Stocker dans le bon storage
    storage.setItem('auth_token', token);
    storage.setItem('token', token); // Compatibilité

    if (refreshToken && refreshToken !== 'undefined') {
      storage.setItem('refreshToken', refreshToken);
    }

    if (user) {
      storage.setItem('user_info', JSON.stringify(user));
    }

    // Stocker métadonnées
    const authData: StoredAuthData = {
      token,
      refreshToken,
      user: user!,
      rememberMe,
      storedAt: Date.now()
    };
    storage.setItem('auth_data', JSON.stringify(authData));

    console.log(`✅ Token stocké avec succès (${rememberMe ? 'localStorage' : 'sessionStorage'})`);
  }

  /**
   * 👤 OBTENIR L'UTILISATEUR STOCKÉ
   */
  static getStoredUser(): UserSession | null {
    try {
      const userStr = localStorage.getItem('user_info') || sessionStorage.getItem('user_info');
      if (!userStr || userStr === 'undefined') {
        return null;
      }
      return JSON.parse(userStr);
    } catch (error) {
      console.error('💥 Erreur parsing user info:', error);
      return null;
    }
  }

  /**
   * ✅ VÉRIFIER SI AUTHENTIFIÉ
   */
  static isAuthenticated(): boolean {
    const token = this.getAuthToken();
    const user = this.getStoredUser();
    return !!(token && user);
  }

  /**
   * 🚨 GÉRER LES ERREURS D'AUTHENTIFICATION
   */
  static handleAuthError(error: any, response?: any): void {
    console.error('🚨 Erreur d\'authentification détectée:', error);

    const errorCodes = [
      'NO_TOKEN',
      'EXPIRED_TOKEN', 
      'INVALID_TOKEN',
      'MALFORMED_TOKEN',
      'USER_NOT_FOUND',
      'USER_INACTIVE',
      'USER_MISMATCH',
      'NOT_AUTHENTICATED'
    ];

    const errorCode = response?.code || error?.code;
    const errorMessage = error?.message || '';
    
    if (errorCodes.includes(errorCode) || 
        errorMessage.includes('Token') ||
        errorMessage.includes('authentification') ||
        errorMessage.includes('Session expirée') ||
        errorMessage.includes('Veuillez vous reconnecter')) {
      
      console.log('🔄 Erreur d\'authentification critique, déconnexion forcée');
      this.forceLogout();
    }
  }

  /**
   * 🚪 DÉCONNEXION FORCÉE (NETTOYAGE + REDIRECTION)
   */
  static forceLogout(): void {
    console.log('🚪 Déconnexion forcée en cours...');
    
    this.clearAllAuthData();
    
    // Redirection différée pour éviter les boucles
    setTimeout(() => {
      if (window.location.pathname !== '/signin') {
        window.location.href = '/signin';
      }
    }, 100);
  }

  // ==================== MÉTHODES D'AUTHENTIFICATION ====================

  /**
   * 🔐 CONNEXION
   */
  static async signIn(email: string, password: string, rememberMe: boolean = false): Promise<AuthResponse> {
    try {
      console.log(`🔐 Connexion pour: ${email} (rememberMe: ${rememberMe})`);

      const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      // Gestion spéciale première connexion
      if (response.status === 403 && data.error === 'FIRST_LOGIN_REQUIRED') {
        console.log('🔄 Première connexion requise');
        return {
          success: false,
          error: 'FIRST_LOGIN_REQUIRED',
          requiresFirstLogin: true,
          message: data.message,
          user: data.user
        };
      }

      // Vérifier succès de la connexion
      if (data.success && (data.accessToken || data.token) && data.user) {
        const token = data.accessToken || data.token;
        const refreshToken = data.refreshToken;

        console.log('✅ Connexion réussie');

        // Nettoyer d'abord toutes les anciennes données
        this.clearAllAuthData();

        // Stocker les nouvelles données
        this.setAuthToken(token, refreshToken, data.user, rememberMe);

        return {
          success: true,
          message: data.message || 'Connexion réussie',
          token,
          accessToken: token,
          refreshToken,
          user: data.user,
          session: data.session
        };
      } else {
        console.log('❌ Échec de connexion:', data.error);
        return {
          success: false,
          error: data.error || 'Email ou mot de passe incorrect'
        };
      }

    } catch (error: any) {
      console.error('💥 Erreur lors de la connexion:', error);
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      };
    }
  }

  /**
   * 🔄 RAFRAÎCHIR LE TOKEN
   */
  static async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
      
      if (!refreshToken || refreshToken === 'undefined') {
        console.log('🚫 Pas de refresh token disponible');
        this.forceLogout();
        return {
          success: false,
          error: 'MISSING_REFRESH_TOKEN'
        };
      }

      console.log('🔄 Rafraîchissement du token...');

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (data.success && data.accessToken) {
        console.log('✅ Token rafraîchi avec succès');

        // Récupérer les données actuelles
        const currentUser = this.getStoredUser();
        const isRemembered = !!localStorage.getItem('auth_token');

        // Nettoyer et re-stocker
        this.clearAllAuthData();
        this.setAuthToken(data.accessToken, data.refreshToken, data.user || currentUser!, isRemembered);

        return {
          success: true,
          message: 'Token rafraîchi',
          token: data.accessToken,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user || currentUser!
        };
      } else {
        console.log('❌ Échec du rafraîchissement:', data.error);
        this.forceLogout();
        return {
          success: false,
          error: data.error || 'Échec du rafraîchissement'
        };
      }

    } catch (error: any) {
      console.error('💥 Erreur lors du rafraîchissement:', error);
      this.forceLogout();
      return {
        success: false,
        error: 'Erreur lors du rafraîchissement du token'
      };
    }
  }

  /**
   * 👤 OBTENIR L'UTILISATEUR ACTUEL
   */
  static async getCurrentUser(): Promise<UserSession | null> {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        console.log('🚫 Pas de token disponible');
        return null;
      }

      console.log('👤 Récupération de l\'utilisateur actuel...');

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔄 Token expiré, tentative de refresh...');
          const refreshResult = await this.refreshToken();
          
          if (refreshResult.success) {
            // Retry avec le nouveau token
            return this.getCurrentUser();
          }
        }
        
        console.log('❌ Erreur récupération utilisateur, déconnexion');
        this.forceLogout();
        return null;
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        // Mettre à jour les infos stockées
        const currentToken = this.getAuthToken();
        const isRemembered = !!localStorage.getItem('auth_token');
        
        if (currentToken) {
          this.setAuthToken(currentToken, undefined, data.user, isRemembered);
        }
        
        return data.user;
      }

      console.log('❌ Réponse invalide, déconnexion');
      this.forceLogout();
      return null;

    } catch (error: any) {
      console.error('💥 Erreur lors de la récupération de l\'utilisateur:', error);
      this.handleAuthError(error);
      return null;
    }
  }

  /**
   * 🚪 DÉCONNEXION PROPRE
   */
  static async signOut(allDevices: boolean = false): Promise<void> {
    try {
      console.log(`👋 Déconnexion${allDevices ? ' de tous les appareils' : ''}...`);

      const token = this.getAuthToken();
      const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
      
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ 
              allDevices,
              refreshToken 
            }),
          });
        } catch (error) {
          console.warn('⚠️ Erreur lors de la déconnexion serveur:', error);
        }
      }
    } catch (error) {
      console.warn('⚠️ Erreur déconnexion serveur:', error);
    } finally {
      // Toujours nettoyer les données locales
      this.clearAllAuthData();
      console.log('✅ Déconnexion effectuée');
      
      // Redirection si pas déjà sur signin
      if (window.location.pathname !== '/signin') {
        window.location.href = '/signin';
      }
    }
  }

  // ==================== PREMIÈRE CONNEXION ====================

  /**
   * 📧 VÉRIFIER EMAIL POUR PREMIÈRE CONNEXION
   */
  static async verifyEmail(email: string): Promise<AuthResponse> {
    try {
      console.log('📧 Vérification email:', email);

      const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Email vérifié');
        return {
          success: true,
          user: data.user,
          message: data.message || 'Email vérifié avec succès'
        };
      } else {
        console.log('❌ Email non trouvé:', data.error);
        return {
          success: false,
          error: data.error || 'Email non trouvé'
        };
      }

    } catch (error: any) {
      console.error('💥 Erreur vérification email:', error);
      return {
        success: false,
        error: 'Erreur lors de la vérification de l\'email'
      };
    }
  }

  /**
   * 🔍 VÉRIFIER TOKEN PREMIÈRE CONNEXION
   */
  static async verifyFirstLoginToken(token: string, email: string): Promise<AuthResponse> {
    try {
      console.log('🔍 Vérification token première connexion');

      const response = await fetch(`${API_BASE_URL}/api/auth/verify-first-login-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Token valide');
        return {
          success: true,
          user: data.user,
          message: data.message || 'Token valide'
        };
      } else {
        console.log('❌ Token invalide:', data.error);
        return {
          success: false,
          error: data.error || 'Token invalide ou expiré'
        };
      }

    } catch (error: any) {
      console.error('💥 Erreur vérification token:', error);
      return {
        success: false,
        error: 'Erreur lors de la vérification du token'
      };
    }
  }

  /**
   * 🔐 CONFIGURER MOT DE PASSE PREMIÈRE CONNEXION
   */
  static async setupFirstPassword(token: string, newPassword: string): Promise<AuthResponse> {
    try {
      console.log('🔐 Configuration mot de passe première connexion');

      const response = await fetch(`${API_BASE_URL}/api/auth/setup-first-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Mot de passe configuré avec succès');
        return {
          success: true,
          message: data.message || 'Mot de passe configuré avec succès'
        };
      } else {
        console.log('❌ Échec configuration mot de passe:', data.error);
        return {
          success: false,
          error: data.error || 'Erreur lors de la configuration du mot de passe'
        };
      }

    } catch (error: any) {
      console.error('💥 Erreur configuration mot de passe:', error);
      return {
        success: false,
        error: 'Erreur lors de la configuration du mot de passe'
      };
    }
  }

  // ==================== UTILITAIRES ====================

  /**
   * 🧪 TESTER LA CONNEXION API
   */
  static async testConnection(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      return {
        success: data.success,
        message: data.message || 'API auth accessible',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Impossible de se connecter au serveur d\'authentification'
      };
    }
  }

  /**
   * 🔄 S'ASSURER QUE LE TOKEN EST VALIDE
   */
  static async ensureValidToken(): Promise<boolean> {
    const token = this.getAuthToken();
    
    if (!token) {
      this.forceLogout();
      return false;
    }

    // Vérifier la validité via getCurrentUser
    const user = await this.getCurrentUser();
    return !!user;
  }

  /**
   * 📊 INFORMATIONS DE DEBUG (DEV SEULEMENT)
   */
  static getDebugInfo(): any {
    if (import.meta.env.PROD) {
      return null;
    }

    const token = this.getAuthToken();
    const user = this.getStoredUser();
    
    return {
      hasToken: !!token,
      hasUser: !!user,
      tokenPreview: token ? token.substring(0, 20) + '...' : null,
      userEmail: user?.email,
      userRole: user?.role,
      isAuthenticated: this.isAuthenticated(),
      storageLocation: localStorage.getItem('auth_token') ? 'localStorage' : 
                      sessionStorage.getItem('auth_token') ? 'sessionStorage' : 'none'
    };
  }
}

// ============================================================================
// INTERCEPTEUR POUR LES REQUÊTES API
// ============================================================================

export class AuthenticatedApiClient {
  private static async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const token = AuthService.getAuthToken();
      
      if (!token) {
        throw new Error('Aucun token d\'authentification disponible');
      }

      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        credentials: 'include',
      });

      // Gestion des erreurs d'authentification
      if (response.status === 401) {
        console.log('🚨 Erreur 401 détectée - Token invalide');
        
        let errorData: any = null;
        try {
          errorData = await response.json();
        } catch (e) {
          // Ignore parsing errors
        }
        
        AuthService.handleAuthError(new Error('Token invalide'), errorData);
        throw new Error('Session expirée - Veuillez vous reconnecter');
      }

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // Ignore parsing errors
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();

    } catch (error: any) {
      console.error(`💥 Erreur API [${endpoint}]:`, error);
      
      // Vérifier si c'est une erreur d'auth
      if (error.message?.includes('Token') || 
          error.message?.includes('authentification') ||
          error.message?.includes('Session expirée')) {
        AuthService.handleAuthError(error);
      }
      
      throw error;
    }
  }

  static get<T = any>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  static post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static delete<T = any>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }
}

console.log('✅ AuthService CORRIGÉ chargé - Gestion d\'erreurs robuste 🚀');
console.log('🔧 Corrections appliquées:');
console.log('  ✅ Nettoyage automatique des tokens invalides');
console.log('  ✅ Gestion stricte des erreurs 401');
console.log('  ✅ Déconnexion forcée en cas de problème');
console.log('  ✅ Intercepteur d\'erreurs intégré');
console.log('  ✅ Compatibilité avec le backend expenses.js');

export default AuthService;