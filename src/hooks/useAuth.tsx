// hooks/useAuth.tsx - VERSION ULTRA-ROBUSTE COMPATIBLE EXPENSESERVICE
// 🛡️ CORRIGÉE ET COMPLÈTE

import React, { createContext, useContext, useState, useEffect } from 'react';

// ============================================================================
// INTERFACES ULTRA-ROBUSTES
// ============================================================================

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'admin' | 'teacher' | 'accountant';
  username?: string;
  isActive?: boolean;
}

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'admin' | 'teacher' | 'accountant';
  avatar_url?: string;
  username?: string;
  last_login?: Date;
  phone?: string;
  date_of_birth?: Date;
  created_at?: Date;
  is_active?: boolean;
}

interface SessionMetadata {
  connectionQuality: 'stable' | 'unstable' | 'offline';
  duration: string;
  rememberMe: boolean;
  expiresIn: string;
  canRefresh: boolean;
  adaptiveSession: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error?: string; requiresFirstLogin?: boolean; success?: boolean }>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error?: string }>;
  signOut: () => void;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
  uploadAvatar: (file: File) => Promise<{ error?: string; url?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
  verifyEmail: (email: string) => Promise<{ error?: string; user?: any }>;
  generateFirstLoginToken: (email: string) => Promise<{ error?: string; token?: string }>;
  verifyFirstLoginToken: (token: string, email: string) => Promise<{ error?: string; user?: any }>;
  setupFirstPassword: (token: string, newPassword: string) => Promise<{ error?: string; token?: string }>;
  testConnection: () => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  loading: boolean;
  getSessionInfo: () => { isRemembered: boolean; expiresAt: Date | null; timeLeft: string; connectionQuality?: string };
  refreshToken: () => Promise<boolean>;
  heartbeat: () => Promise<boolean>;
  getConnectionStatus: () => Promise<SessionMetadata>;
  signOutAllDevices: () => Promise<void>;
}

// ============================================================================
// CONFIGURATION ADAPTÉE AU NOUVEAU BACKEND
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const API_ENDPOINTS = {
  SIGNIN: `${API_BASE_URL}/api/auth/signin`,
  REFRESH_TOKEN: `${API_BASE_URL}/api/auth/refresh-token`,
  HEARTBEAT: `${API_BASE_URL}/api/auth/heartbeat`,
  ME: `${API_BASE_URL}/api/auth/me`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  CONNECTION_STATUS: `${API_BASE_URL}/api/auth/connection-status`,
  CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
  VERIFY_EMAIL: `${API_BASE_URL}/api/auth/verify-email`,
  VERIFY_FIRST_LOGIN_TOKEN: `${API_BASE_URL}/api/auth/verify-first-login-token`,
  SETUP_FIRST_PASSWORD: `${API_BASE_URL}/api/auth/setup-first-password`,
  GENERATE_FIRST_LOGIN_TOKEN: `${API_BASE_URL}/api/auth/generate-first-login-token`,
  TEST: `${API_BASE_URL}/api/auth/test`,
  PROFILE: `${API_BASE_URL}/api/auth/me`,
  UPLOAD_AVATAR: `${API_BASE_URL}/api/auth/upload-avatar`
};

// Configuration sessions adaptatives
const AFRICA_SESSION_CONFIG = {
  STABLE: {
    SHORT_SESSION: 30 * 60 * 1000, // 30 minutes
    LONG_SESSION: 24 * 60 * 60 * 1000, // 24 heures
    REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes avant expiration
  },
  UNSTABLE: {
    SHORT_SESSION: 4 * 60 * 60 * 1000, // 4 heures
    LONG_SESSION: 7 * 24 * 60 * 60 * 1000, // 7 jours
    REFRESH_THRESHOLD: 30 * 60 * 1000, // 30 minutes avant expiration
  },
  OFFLINE: {
    SHORT_SESSION: 24 * 60 * 60 * 1000, // 24 heures
    LONG_SESSION: 30 * 24 * 60 * 60 * 1000, // 30 jours
    REFRESH_THRESHOLD: 60 * 60 * 1000, // 1 heure avant expiration
  },
  CHECK_INTERVAL: 5 * 60 * 1000, // Toutes les 5 minutes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // 2 secondes entre tentatives
  HEARTBEAT_INTERVAL: 10 * 60 * 1000, // Toutes les 10 minutes
};

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER ULTRA-ROBUSTE
// ============================================================================

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ==================== GESTION ULTRA-SÉCURISÉE DES TOKENS ====================

  /**
   * 🔒 Vérifier qu'un token est valide
   */
  const isValidToken = (token: any): token is string => {
    if (!token || typeof token !== 'string') return false;
    if (token === 'undefined' || token === 'null' || token === '') return false;
    if (token.includes('undefined') || token.includes('null')) return false;
    if (token.length < 20) return false;
    
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    return true;
  };

  /**
   * 🧹 Nettoyer toutes les données d'authentification corrompues
   */
  const performTokenCleanup = (): void => {
    console.log('🧹 [useAuth] Nettoyage complet des tokens corrompus...');
    
    try {
      const keysToClean = [
        'auth_token', 'token', 'accessToken', 'refreshToken',
        'user_info', 'user', 'auth_data', 'auth_data_v3', 'auth_backup'
      ];

      keysToClean.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      console.log('✅ [useAuth] Nettoyage terminé');
    } catch (error) {
      console.error('💥 [useAuth] Erreur nettoyage:', error);
    }
  };

  /**
   * 🔑 Récupérer le token d'authentification de manière ultra-sécurisée
   */
  const getAuthToken = (): string | null => {
    try {
      const sources = [
        localStorage.getItem('auth_token'),
        localStorage.getItem('token'),
        localStorage.getItem('accessToken'),
        sessionStorage.getItem('auth_token'),
        sessionStorage.getItem('token'),
        sessionStorage.getItem('accessToken')
      ];

      for (const token of sources) {
        if (isValidToken(token)) {
          return token;
        }
      }

      console.warn('⚠️ [useAuth] Aucun token valide trouvé - Nettoyage automatique');
      performTokenCleanup();
      return null;

    } catch (error) {
      console.error('💥 [useAuth] Erreur récupération token:', error);
      performTokenCleanup();
      return null;
    }
  };

  /**
   * 💾 Sauvegarder les données d'authentification de manière robuste
   */
  const saveAuthData = (
    accessToken: string, 
    refreshToken: string, 
    userData: User, 
    profileData: Profile, 
    rememberMe: boolean,
    sessionMetadata?: SessionMetadata
  ) => {
    if (!isValidToken(accessToken) || !isValidToken(refreshToken)) {
      console.error('❌ [useAuth] Tentative de sauvegarde de tokens invalides');
      return;
    }

    const config = sessionMetadata?.connectionQuality ? 
      AFRICA_SESSION_CONFIG[sessionMetadata.connectionQuality.toUpperCase() as keyof typeof AFRICA_SESSION_CONFIG] :
      AFRICA_SESSION_CONFIG.STABLE;
    
    const expirationTime = Date.now() + (rememberMe ? config.LONG_SESSION : config.SHORT_SESSION);
    
    const authPayload = {
      accessToken,
      refreshToken,
      user: userData,
      profile: profileData,
      expirationTime,
      rememberMe,
      savedAt: Date.now(),
      version: '4.0',
      connectionQuality: sessionMetadata?.connectionQuality || 'stable',
      sessionMetadata
    };

    const storage = rememberMe ? localStorage : sessionStorage;
    
    try {
      storage.setItem('auth_data', JSON.stringify(authPayload));
      
      if (rememberMe) {
        sessionStorage.setItem('auth_backup', JSON.stringify(authPayload));
        console.log(`💾 [useAuth] Session longue sauvegardée (${sessionMetadata?.connectionQuality})`);
      } else {
        console.log(`💾 [useAuth] Session courte sauvegardée (${sessionMetadata?.connectionQuality})`);
      }

      storage.setItem('auth_token', accessToken);
      storage.setItem('token', accessToken);
      
    } catch (error) {
      console.error('💥 [useAuth] Erreur sauvegarde auth data:', error);
      performTokenCleanup();
    }
  };

  /**
   * 📂 Récupérer les données d'authentification de manière robuste
   */
  const loadAuthData = () => {
    try {
      let authData = localStorage.getItem('auth_data');
      let parsedData = authData ? JSON.parse(authData) : null;

      if (!parsedData) {
        authData = sessionStorage.getItem('auth_data');
        parsedData = authData ? JSON.parse(authData) : null;
      }

      if (!parsedData) {
        authData = sessionStorage.getItem('auth_backup');
        parsedData = authData ? JSON.parse(authData) : null;
        if (parsedData) {
          console.log('🔄 [useAuth] Récupération depuis backup');
        }
      }

      if (parsedData) {
        if (Date.now() < parsedData.expirationTime && 
            isValidToken(parsedData.accessToken) && 
            isValidToken(parsedData.refreshToken)) {
          console.log(`✅ [useAuth] Session valide - Type: ${parsedData.rememberMe ? 'LONGUE' : 'COURTE'}`);
          return parsedData;
        } else {
          console.log('⏰ [useAuth] Session ou tokens expirés/corrompus, nettoyage...');
          clearAuthData();
        }
      }
    } catch (error) {
      console.error('❌ [useAuth] Erreur chargement auth data:', error);
      clearAuthData();
    }
    return null;
  };

  /**
   * 🧹 Nettoyage complet et sécurisé
   */
  const clearAuthData = () => {
    console.log('🧹 [useAuth] Nettoyage complet des données auth...');
    performTokenCleanup();
    setUser(null);
    setProfile(null);
  };

  // ==================== REQUÊTES API ULTRA-ROBUSTES ====================

  /**
   * 🌐 Faire une requête API sécurisée avec retry automatique
   */
  const makeSecureRequest = async (
    url: string,
    options: RequestInit = {},
    maxRetries: number = 3
  ): Promise<Response> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🌐 [useAuth] Tentative ${attempt}/${maxRetries}: ${options.method || 'GET'} ${url}`);
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
          },
        });
        
        if (attempt > 1) {
          console.log(`✅ [useAuth] Succès après ${attempt} tentatives`);
        }
        
        return response;
        
      } catch (error: any) {
        lastError = error;
        
        console.warn(`⚠️ [useAuth] Tentative ${attempt} échouée:`, error.message);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, AFRICA_SESSION_CONFIG.RETRY_DELAY * attempt));
            continue;
          }
        } else {
          break;
        }
      }
    }
    
    throw lastError!;
  };

  // ==================== MÉTHODES D'AUTHENTIFICATION ====================

  /**
   * 🔐 Connexion CORRIGÉE pour être compatible avec le nouveau backend
   */
  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      console.log(`🔐 [useAuth] Connexion avec session ${rememberMe ? 'LONGUE' : 'COURTE'}:`, { email });
      setIsLoading(true);

      const response = await makeSecureRequest(API_ENDPOINTS.SIGNIN, {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();
      
      console.log('📡 [useAuth] Réponse serveur:', data);

      if (response.status === 403 && data.error === 'FIRST_LOGIN_REQUIRED') {
        console.log('⚠️ [useAuth] Premier login requis');
        return { 
          error: 'FIRST_LOGIN_REQUIRED',
          requiresFirstLogin: true 
        };
      }

      if (!response.ok) {
        console.log('❌ [useAuth] Échec de connexion:', data.error);
        return { error: data.error || 'Email ou mot de passe incorrect' };
      }

      if (data.success && (data.accessToken || data.token) && data.user) {
        const accessToken = data.accessToken || data.token;
        const refreshToken = data.refreshToken || accessToken;
        
        console.log(`✅ [useAuth] Connexion réussie avec sessions adaptatives`);
        
        const userData: User = {
          id: data.user.id?.toString() || '',
          email: data.user.email || email,
          firstName: data.user.first_name || '',
          lastName: data.user.last_name || '',
          role: data.user.role || 'admin',
          username: data.user.username,
          isActive: data.user.is_active !== false
        };

        const profileData: Profile = {
          id: data.user.id?.toString() || '',
          email: data.user.email || email,
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || '',
          role: data.user.role || 'admin',
          avatar_url: data.user.avatar_url,
          username: data.user.username,
          last_login: data.user.last_login ? new Date(data.user.last_login) : new Date(),
          phone: data.user.phone,
          date_of_birth: data.user.date_of_birth ? new Date(data.user.date_of_birth) : undefined,
          created_at: data.user.created_at ? new Date(data.user.created_at) : new Date(),
          is_active: data.user.is_active !== false
        };

        saveAuthData(
          accessToken, 
          refreshToken, 
          userData, 
          profileData, 
          rememberMe,
          data.session
        );
        
        setUser(userData);
        setProfile(profileData);
        
        console.log('💾 [useAuth] Données sauvegardées avec métadonnées de session');
        console.log('👤 [useAuth] Utilisateur connecté:', userData.email, userData.role);
        
        return { success: true };
        
      } else {
        console.error('🤔 [useAuth] Réponse inattendue du serveur:', data);
        return { error: 'Erreur lors de la connexion' };
      }
      
    } catch (error: any) {
      console.error('💥 [useAuth] Erreur lors de la connexion:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { error: 'Impossible de joindre le serveur. Vérifiez votre connexion internet.' };
      }
      
      return { 
        error: error.message || 'Erreur de connexion au serveur' 
      };
      
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 🔄 Renouvellement intelligent du token CORRIGÉ
   */
  const refreshToken = async (): Promise<boolean> => {
    try {
      const authData = loadAuthData();
      if (!authData || !authData.refreshToken) {
        console.log('🚫 [useAuth] Renouvellement impossible - Pas de refresh token');
        return false;
      }

      console.log('🔄 [useAuth] Tentative de renouvellement du token...');

      const response = await makeSecureRequest(API_ENDPOINTS.REFRESH_TOKEN, {
        method: 'POST',
        headers: {
          'X-Refresh-Token': authData.refreshToken,
        },
        body: JSON.stringify({ refreshToken: authData.refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.accessToken && data.refreshToken) {
          console.log('✅ [useAuth] Token renouvelé avec succès');
          
          saveAuthData(
            data.accessToken, 
            data.refreshToken, 
            authData.user, 
            authData.profile, 
            authData.rememberMe,
            data.session
          );
          
          return true;
        }
      } else if (response.status === 401) {
        console.log('🚫 [useAuth] Refresh token invalide, déconnexion nécessaire');
        signOut();
        return false;
      }
    } catch (error) {
      console.error('❌ [useAuth] Erreur renouvellement token:', error);
    }
    
    return false;
  };

  /**
   * 💓 Heartbeat CORRIGÉ pour maintenir la session
   */
  const heartbeat = async (): Promise<boolean> => {
    try {
      const authData = loadAuthData();
      if (!authData?.accessToken) {
        return false;
      }

      console.log('💓 [useAuth] Heartbeat de session...');

      const requestBody = {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        connectionQuality: (navigator as any).connection?.effectiveType || 'unknown'
      };

      const response = await makeSecureRequest(API_ENDPOINTS.HEARTBEAT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.accessToken}`,
          'X-Refresh-Token': authData.refreshToken || '',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        try {
          const data = await response.json();
          
          const newAccessToken = response.headers.get('X-New-Access-Token');
          const newRefreshToken = response.headers.get('X-New-Refresh-Token');
          
          if (newAccessToken && newRefreshToken) {
            console.log('🔄 [useAuth] Tokens mis à jour automatiquement via heartbeat');
            saveAuthData(
              newAccessToken,
              newRefreshToken,
              authData.user,
              authData.profile,
              authData.rememberMe,
              data.session
            );
          }
          
          console.log(`✅ [useAuth] Heartbeat réussi - Qualité: ${data.session?.connectionQuality || 'stable'}`);
          return true;
        } catch (jsonError) {
          console.error('💥 [useAuth] Erreur parsing réponse heartbeat:', jsonError);
          return false;
        }
      } else if (response.status === 401) {
        console.log('🔄 [useAuth] Token expiré pendant heartbeat, tentative de refresh...');
        return await refreshToken();
      } else {
        console.log(`❌ [useAuth] Heartbeat échoué: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error('💥 [useAuth] Erreur heartbeat:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('📡 [useAuth] Problème réseau détecté, heartbeat ignoré');
        return true;
      }
      
      return false;
    }
  };

  /**
   * 🌐 Obtenir le statut de connexion depuis le backend
   */
  const getConnectionStatus = async (): Promise<SessionMetadata> => {
    try {
      const response = await makeSecureRequest(API_ENDPOINTS.CONNECTION_STATUS);
      const data = await response.json();
      
      if (data.success) {
        return {
          connectionQuality: data.connectionQuality,
          duration: data.recommendations?.short || 'Inconnue',
          rememberMe: false,
          expiresIn: data.recommendations?.long || 'Inconnue',
          canRefresh: true,
          adaptiveSession: true
        };
      }
    } catch (error) {
      console.error('❌ [useAuth] Erreur statut connexion:', error);
    }
    
    return {
      connectionQuality: 'stable',
      duration: '30 minutes',
      rememberMe: false,
      expiresIn: '24 heures',
      canRefresh: true,
      adaptiveSession: false
    };
  };

  /**
   * 📊 Informations sur la session avec qualité de connexion
   */
  const getSessionInfo = () => {
    const authData = loadAuthData();
    
    if (!authData) {
      return { isRemembered: false, expiresAt: null, timeLeft: 'Non connecté' };
    }

    const expiresAt = new Date(authData.expirationTime);
    const timeLeft = authData.expirationTime - Date.now();
    
    let timeLeftText = 'Expiré';
    if (timeLeft > 0) {
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      
      if (days > 0) {
        timeLeftText = `${days} jour(s)`;
      } else if (hours > 0) {
        timeLeftText = `${hours} heure(s)`;
      } else {
        const minutes = Math.floor(timeLeft / (1000 * 60));
        timeLeftText = `${minutes} minute(s)`;
      }
    }

    return {
      isRemembered: authData.rememberMe,
      expiresAt,
      timeLeft: timeLeftText,
      connectionQuality: authData.connectionQuality || 'stable'
    };
  };

  /**
   * 👤 Recharger le profil depuis l'API CORRIGÉ
   */
  const refreshProfile = async () => {
    const retryRefresh = async (attempt = 1): Promise<void> => {
      try {
        const authData = loadAuthData();
        if (!authData?.accessToken) {
          console.log('❌ [useAuth] Pas de token pour recharger le profil');
          setProfile(null);
          setUser(null);
          return;
        }

        console.log(`🔄 [useAuth] Rechargement du profil (tentative ${attempt})...`);

        const response = await makeSecureRequest(API_ENDPOINTS.ME, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authData.accessToken}`,
            'X-Refresh-Token': authData.refreshToken,
          },
        });

        const newAccessToken = response.headers.get('X-New-Access-Token');
        const newRefreshToken = response.headers.get('X-New-Refresh-Token');

        if (newAccessToken && newRefreshToken) {
          console.log('🔄 [useAuth] Tokens mis à jour automatiquement');
          saveAuthData(
            newAccessToken,
            newRefreshToken,
            authData.user,
            authData.profile,
            authData.rememberMe,
            authData.sessionMetadata
          );
        }

        if (!response.ok) {
          if (response.status === 401) {
            console.log('🔑 [useAuth] Token expiré, tentative de renouvellement...');
            const renewed = await refreshToken();
            if (renewed && attempt === 1) {
              return retryRefresh(2);
            } else {
              signOut();
              return;
            }
          }
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.user) {
          console.log('✅ [useAuth] Profil rechargé avec succès');

          const profileData: Profile = {
            id: data.user.id.toString(),
            email: data.user.email,
            first_name: data.user.first_name || '',
            last_name: data.user.last_name || '',
            role: data.user.role,
            avatar_url: data.user.avatar_url,
            username: data.user.username,
            last_login: data.user.last_login ? new Date(data.user.last_login) : undefined,
            phone: data.user.phone,
            date_of_birth: data.user.date_of_birth ? new Date(data.user.date_of_birth) : undefined,
            created_at: data.user.created_at ? new Date(data.user.created_at) : undefined,
            is_active: data.user.is_active
          };

          const userData: User = {
            id: data.user.id.toString(),
            email: data.user.email,
            firstName: data.user.first_name || '',
            lastName: data.user.last_name || '',
            role: data.user.role,
            username: data.user.username,
            isActive: data.user.is_active
          };

          setProfile(profileData);
          setUser(userData);

          if (authData) {
            saveAuthData(
              authData.accessToken,
              authData.refreshToken,
              userData,
              profileData,
              authData.rememberMe,
              data.session
            );
          }
        }
      } catch (error) {
        console.error(`❌ [useAuth] Erreur rechargement profil (tentative ${attempt}):`, error);
        if (attempt < AFRICA_SESSION_CONFIG.RETRY_ATTEMPTS) {
          console.log(`🔄 [useAuth] Nouvelle tentative dans ${AFRICA_SESSION_CONFIG.RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, AFRICA_SESSION_CONFIG.RETRY_DELAY));
          return retryRefresh(attempt + 1);
        } else {
          console.error('💥 [useAuth] Échec définitif du rechargement du profil');
          throw error;
        }
      }
    };

    return retryRefresh();
  };

  /**
   * 👋 Déconnexion propre
   */
  const signOut = () => {
    console.log('👋 [useAuth] Déconnexion avec nettoyage complet...');
    clearAuthData();
    console.log('✅ [useAuth] Déconnexion effectuée');
  };

  /**
   * 👋 Déconnexion de tous les appareils
   */
  const signOutAllDevices = async () => {
    try {
      const authData = loadAuthData();
      if (authData?.accessToken) {
        await makeSecureRequest(API_ENDPOINTS.LOGOUT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authData.accessToken}`,
            'X-Refresh-Token': authData.refreshToken,
          },
          body: JSON.stringify({ allDevices: true })
        });
      }
    } catch (error) {
      console.error('❌ [useAuth] Erreur déconnexion tous appareils:', error);
    } finally {
      clearAuthData();
      console.log('✅ [useAuth] Déconnexion de tous les appareils effectuée');
    }
  };

  // ==================== AUTRES MÉTHODES CORRIGÉES ====================

  /**
   * 🧪 Test de connexion
   */
  const testConnection = async () => {
    try {
      const response = await makeSecureRequest(API_ENDPOINTS.TEST);
      const data = await response.json();
      return { success: data.success, error: data.error };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur de connexion' 
      };
    }
  };

  /**
   * 📧 Vérifier email pour premier login
   */
  const verifyEmail = async (email: string) => {
    try {
      const response = await makeSecureRequest(API_ENDPOINTS.VERIFY_EMAIL, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.success) {
        return { user: data.user };
      } else {
        return { error: data.error };
      }
    } catch (error) {
      console.error('💥 [useAuth] Erreur lors de la vérification de l\'email:', error);
      return { error: 'Erreur lors de la vérification de l\'email' };
    }
  };

  /**
   * 🔑 Générer token première connexion
   */
  const generateFirstLoginToken = async (email: string) => {
    try {
      const response = await makeSecureRequest(API_ENDPOINTS.GENERATE_FIRST_LOGIN_TOKEN, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.success) {
        return { token: data.token };
      } else {
        return { error: data.error };
      }
    } catch (error) {
      console.error('💥 [useAuth] Erreur lors de la génération du token:', error);
      return { error: 'Erreur lors de la génération du token' };
    }
  };

  /**
   * 🔍 Vérifier token première connexion
   */
  const verifyFirstLoginToken = async (token: string, email: string) => {
    try {
      const response = await makeSecureRequest(API_ENDPOINTS.VERIFY_FIRST_LOGIN_TOKEN, {
        method: 'POST',
        body: JSON.stringify({ token, email }),
      });

      const data = await response.json();
      if (data.success) {
        return { user: data.user };
      } else {
        return { error: data.error };
      }
    } catch (error) {
      console.error('💥 [useAuth] Erreur lors de la vérification du token:', error);
      return { error: 'Erreur lors de la vérification du token' };
    }
  };

  /**
   * 🔐 Configuration premier mot de passe
   */
  const setupFirstPassword = async (token: string, newPassword: string) => {
    try {
      setIsLoading(true);
      console.log('🔐 [useAuth] Configuration du premier mot de passe...');

      const response = await makeSecureRequest(API_ENDPOINTS.SETUP_FIRST_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      if (data.success) {
        console.log('✅ [useAuth] Premier mot de passe configuré avec succès');

        if (data.accessToken && data.refreshToken && data.user) {
          console.log('🔑 [useAuth] Tokens JWT reçus, connexion automatique...');

          const userData: User = {
            id: data.user.id?.toString() || '',
            email: data.user.email || '',
            firstName: data.user.first_name || '',
            lastName: data.user.last_name || '',
            role: data.user.role || 'admin',
            username: data.user.username,
            isActive: data.user.is_active !== false
          };

          const profileData: Profile = {
            id: data.user.id?.toString() || '',
            email: data.user.email || '',
            first_name: data.user.first_name || '',
            last_name: data.user.last_name || '',
            role: data.user.role || 'admin',
            avatar_url: data.user.avatar_url,
            username: data.user.username,
            last_login: new Date(),
            is_active: data.user.is_active !== false
          };

          saveAuthData(
            data.accessToken,
            data.refreshToken,
            userData,
            profileData,
            true,
            data.session
          );

          setUser(userData);
          setProfile(profileData);

          return { token: data.accessToken };
        } else {
          console.log('🔄 [useAuth] Pas de tokens retournés, reconnexion nécessaire');
          return {};
        }
      } else {
        return { error: data.error };
      }
    } catch (error) {
      console.error('💥 [useAuth] Erreur lors de la configuration du mot de passe:', error);
      return { error: 'Erreur lors de la configuration du mot de passe' };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 📝 Inscription (non disponible)
   */
  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      console.log('📝 [useAuth] Tentative d\'inscription:', { email, firstName, lastName });
      return { error: 'L\'inscription publique n\'est pas disponible. Contactez un administrateur.' };
    } catch (error) {
      console.error('💥 [useAuth] Erreur lors de l\'inscription:', error);
      return { error: 'Erreur lors de l\'inscription' };
    }
  };

  /**
   * 🔄 Réinitialisation mot de passe
   */
  const resetPassword = async (email: string) => {
    try {
      console.log('🔄 [useAuth] Réinitialisation mot de passe pour:', email);
      return { error: 'Fonctionnalité non implémentée. Contactez un administrateur.' };
    } catch (error) {
      console.error('💥 [useAuth] Erreur lors de la réinitialisation:', error);
      return { error: 'Erreur lors de la réinitialisation' };
    }
  };

  /**
   * 📝 Mise à jour du profil
   */
  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!profile || !user) {
        return { error: 'Aucun profil trouvé' };
      }

      console.log('📝 [useAuth] Mise à jour du profil:', updates);
      const authData = loadAuthData();
      if (!authData?.accessToken) {
        return { error: 'Token d\'authentification manquant' };
      }

      const response = await makeSecureRequest(API_ENDPOINTS.PROFILE, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authData.accessToken}`,
          'X-Refresh-Token': authData.refreshToken,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        await refreshProfile();
        console.log('✅ [useAuth] Profil mis à jour avec succès');
        return {};
      } else {
        return { error: data.error || 'Erreur lors de la mise à jour du profil' };
      }
    } catch (error) {
      console.error('💥 [useAuth] Erreur lors de la mise à jour du profil:', error);
      return { error: 'Erreur lors de la mise à jour du profil' };
    }
  };

  /**
   * 📸 Upload d'avatar avec cache-busting
   */
  const uploadAvatar = async (file: File) => {
    try {
      console.log('📸 [useAuth] Upload d\'avatar:', file.name);
      const authData = loadAuthData();
      if (!authData?.accessToken) {
        return { error: 'Token d\'authentification manquant' };
      }

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(API_ENDPOINTS.UPLOAD_AVATAR, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.accessToken}`,
          'X-Refresh-Token': authData.refreshToken,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const avatarUrlWithCacheBust = `${data.avatarUrl}?v=${timestamp}&r=${randomId}`;

        console.log('🔄 [useAuth] URL avatar avec cache-busting:', avatarUrlWithCacheBust);

        // Invalider toutes les images avatar sur la page
        const allAvatarImages = document.querySelectorAll('img[src*="avatar"], img[src*="profile"], [style*="background-image"]');
        allAvatarImages.forEach((element) => {
          if (element instanceof HTMLImageElement) {
            element.src = '';
            setTimeout(() => {
              element.src = avatarUrlWithCacheBust;
            }, 100);
          }
          if (element instanceof HTMLElement && element.style.backgroundImage) {
            element.style.backgroundImage = `url(${avatarUrlWithCacheBust})`;
          }
        });

        // Mettre à jour le profil immédiatement
        if (profile) {
          const updatedProfile = { ...profile, avatar_url: avatarUrlWithCacheBust };
          setProfile(updatedProfile);
        }

        // Event global pour tous les composants
        window.dispatchEvent(new CustomEvent('avatarUpdated', {
          detail: {
            url: avatarUrlWithCacheBust,
            originalUrl: data.avatarUrl,
            userId: authData.user.id,
            timestamp: timestamp,
            forceRefresh: true
          }
        }));

        // Forcer le refresh du profil en arrière-plan
        setTimeout(async () => {
          try {
            await refreshProfile();
            console.log('✅ [useAuth] Profil rafraîchi après upload avatar');
          } catch (error) {
            console.warn('⚠️ [useAuth] Erreur refresh profil après upload');
          }
        }, 1000);

        console.log('✅ [useAuth] Avatar uploadé avec succès - Cache entièrement invalidé');
        return { url: avatarUrlWithCacheBust, success: true, forceRefresh: true };
      } else {
        return { error: data.error || 'Erreur lors de l\'upload d\'avatar' };
      }
    } catch (error) {
      console.error('💥 [useAuth] Erreur lors de l\'upload d\'avatar:', error);
      return { error: 'Erreur lors de l\'upload d\'avatar' };
    }
  };

  /**
   * 🔐 Changement de mot de passe
   */
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      console.log('🔐 [useAuth] Changement de mot de passe...');
      const authData = loadAuthData();
      if (!authData?.accessToken) {
        return { error: 'Token d\'authentification manquant' };
      }

      const response = await makeSecureRequest(API_ENDPOINTS.CHANGE_PASSWORD, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.accessToken}`,
          'X-Refresh-Token': authData.refreshToken,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      if (data.success) {
        console.log('✅ [useAuth] Mot de passe changé avec succès');
        return {};
      } else {
        console.log('❌ [useAuth] Échec du changement de mot de passe:', data.error);
        return { error: data.error || 'Échec du changement de mot de passe' };
      }
    } catch (error) {
      console.error('💥 [useAuth] Erreur lors du changement de mot de passe:', error);
      return { error: 'Erreur lors du changement de mot de passe' };
    }
  };

  // ==================== VÉRIFICATIONS PÉRIODIQUES ====================

  /**
   * ⏰ Configuration des vérifications périodiques avec heartbeat
   */
  const setupPeriodicChecks = () => {
    // Vérification d'expiration
    const expirationInterval = setInterval(async () => {
      const authData = loadAuthData();
      if (authData) {
        const timeUntilExpiration = authData.expirationTime - Date.now();
        const config = AFRICA_SESSION_CONFIG[authData.connectionQuality?.toUpperCase() as keyof typeof AFRICA_SESSION_CONFIG] || AFRICA_SESSION_CONFIG.STABLE;

        // Si proche de l'expiration et session longue, tenter renouvellement
        if (timeUntilExpiration < config.REFRESH_THRESHOLD && authData.rememberMe) {
          console.log('⏰ [useAuth] Session proche de l\'expiration, renouvellement...');
          await refreshToken();
        }

        // Si session expirée, déconnecter
        if (timeUntilExpiration <= 0) {
          console.log('⏰ [useAuth] Session expirée, déconnexion automatique');
          signOut();
        }
      }
    }, AFRICA_SESSION_CONFIG.CHECK_INTERVAL);

    // Heartbeat périodique pour sessions longues
    const heartbeatInterval = setInterval(async () => {
      const authData = loadAuthData();
      if (authData && authData.rememberMe) {
        await heartbeat();
      }
    }, AFRICA_SESSION_CONFIG.HEARTBEAT_INTERVAL);

    // Nettoyer les intervals au démontage
    return () => {
      clearInterval(expirationInterval);
      clearInterval(heartbeatInterval);
    };
  };

  /**
   * 🌐 Gestion événements réseau
   */
  const setupNetworkEventListeners = () => {
    const handleOnline = async () => {
      console.log('🌐 [useAuth] Connexion réseau rétablie');
      const authData = loadAuthData();
      if (authData && authData.rememberMe) {
        console.log('🔄 [useAuth] Vérification de la session après reconnexion...');
        const isValid = await heartbeat();
        if (!isValid) {
          console.log('❌ [useAuth] Session invalide après reconnexion, tentative de renouvellement...');
          await refreshToken();
        }
      }
    };

    const handleOffline = () => {
      console.log('📴 [useAuth] Connexion réseau perdue - Mode hors ligne');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  };

  /**
   * 🚀 Initialiser l'authentification au démarrage
   */
  const initializeAuth = async () => {
    try {
      console.log('🔄 [useAuth] Initialisation auth avancée avec sessions adaptatives...');
      setIsLoading(true);

      const authData = loadAuthData();
      if (!authData) {
        console.log('❌ [useAuth] Aucune session trouvée');
        return;
      }

      console.log(`✅ [useAuth] Session trouvée: ${authData.rememberMe ? 'LONGUE' : 'COURTE'} (${authData.connectionQuality})`);

      // Charger les données depuis le cache d'abord
      setUser(authData.user);
      setProfile(authData.profile);

      // Puis rafraîchir depuis l'API en arrière-plan
      try {
        await refreshProfile();
      } catch (error) {
        console.log('⚠️ [useAuth] Impossible de rafraîchir depuis l\'API, utilisation du cache');
      }
    } catch (error) {
      console.error('💥 [useAuth] Erreur initialisation auth:', error);
      clearAuthData();
    } finally {
      setIsLoading(false);
      console.log('✅ [useAuth] Initialisation terminée');
    }
  };

  // ==================== EFFECTS ====================

  useEffect(() => {
    initializeAuth();
    const cleanupChecks = setupPeriodicChecks();
    const cleanupNetwork = setupNetworkEventListeners();

    return () => {
      cleanupChecks();
      cleanupNetwork();
    };
  }, []);

  // ==================== DEBUG (DEV SEULEMENT) ====================

  if (import.meta.env.DEV) {
    const sessionInfo = getSessionInfo();
    console.log('🔍 [useAuth] État Auth Compatible ExpenseService:', {
      isLoading,
      hasUser: !!user,
      hasProfile: !!profile,
      sessionType: sessionInfo.isRemembered ? 'LONGUE' : 'COURTE',
      connectionQuality: sessionInfo.connectionQuality,
      timeLeft: sessionInfo.timeLeft,
      profileName: profile ? `${profile.first_name} ${profile.last_name}` : 'N/A',
      userRole: user?.role,
      hasAccessToken: !!loadAuthData()?.accessToken,
      hasRefreshToken: !!loadAuthData()?.refreshToken,
      expirationTime: sessionInfo.expiresAt?.toLocaleString() || 'N/A',
      version: '4.0 - Compatible ExpenseService'
    });
  }

  // ==================== CONTEXT VALUE ====================

  const value: AuthContextType = {
    user,
    profile,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    uploadAvatar,
    changePassword,
    refreshProfile,
    verifyEmail,
    generateFirstLoginToken,
    verifyFirstLoginToken,
    setupFirstPassword,
    testConnection,
    isLoading,
    loading: isLoading,
    getSessionInfo,
    refreshToken,
    heartbeat,
    getConnectionStatus,
    signOutAllDevices
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// HOOKS UTILITAIRES
// ============================================================================

/**
 * 🎯 Hook principal useAuth
 */
function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * 🔐 Hook permissions
 */
function usePermissions() {
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;
  const isTeacher = user?.role === 'teacher';
  const isAccountant = user?.role === 'accountant';

  const canManageUsers = isSuperAdmin;
  const canViewAdmin = isAdmin;
  const canManageContent = isAdmin || isTeacher;
  const canViewFinances = isAdmin || isAccountant;

  return {
    isSuperAdmin,
    isAdmin,
    isTeacher,
    isAccountant,
    canManageUsers,
    canViewAdmin,
    canManageContent,
    canViewFinances,
    userRole: user?.role
  };
}

/**
 * 👤 Hook affichage utilisateur
 */
function useUserDisplay() {
  const { user, profile } = useAuth();

  const displayName = profile 
    ? `${profile.first_name} ${profile.last_name}`.trim() || profile.username || profile.email
    : user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`.trim()
      : user?.email || 'Utilisateur';

  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : '??';

  const roleLabel = {
    'super_admin': 'Super Administrateur',
    'admin': 'Administrateur', 
    'teacher': 'Enseignant',
    'accountant': 'Comptable'
  }[user?.role || 'admin'] || 'Utilisateur';

  return {
    displayName,
    initials,
    roleLabel,
    avatarUrl: profile?.avatar_url
  };
}

/**
 * 📊 Hook informations session
 */
function useSessionInfo() {
  const { getSessionInfo } = useAuth();
  const sessionData = getSessionInfo();

  const getRecommendations = (quality: string, isRemembered: boolean) => {
    if (quality === 'offline') {
      return isRemembered 
        ? ['Session ultra-longue (30j)', 'Optimisé pour zones reculées', 'Fonctionne complètement hors ligne']
        : ['Session longue (24h)', 'Pour postes partagés isolés', 'Activez "Se souvenir" pour plus de stabilité'];
    }
    
    if (quality === 'unstable') {
      return isRemembered
        ? ['Session longue (7j)', 'Idéal pour connexions instables', 'Renouvellement automatique intelligent']
        : ['Session moyenne (4h)', 'Pour connexions mobiles', 'Activez "Se souvenir" pour plus de confort'];
    }
    
    return isRemembered
      ? ['Session standard (24h)', 'Pour connexions stables', 'Renouvellement automatique']
      : ['Session courte (30min)', 'Session sécurisée', 'Parfait pour postes partagés'];
  };

  return {
    ...sessionData,
    isAfricaOptimized: true,
    adaptiveSession: true,
    connectionQuality: sessionData.connectionQuality || 'stable',
    sessionConfig: {
      currentQuality: sessionData.connectionQuality || 'stable',
      stableSession: 'Connexion stable: 30min/24h',
      unstableSession: 'Connexion instable: 4h/7j',
      offlineSession: 'Mode hors ligne: 24h/30j',
      optimizedFor: 'Connexions variables en Afrique'
    },
    recommendations: getRecommendations(sessionData.connectionQuality || 'stable', sessionData.isRemembered)
  };
}

/**
 * 🚨 Hook gestion d'erreurs auth
 */
function useAuthErrors() {
  const { signOut, refreshToken } = useAuth();

  const handleAuthError = async (error: any) => {
    console.error('🚨 [useAuth] Erreur auth interceptée:', error);

    // Si erreur 401, tenter refresh d'abord
    if (error.response?.status === 401) {
      console.log('🔒 [useAuth] Token expiré, tentative de refresh...');
      const refreshed = await refreshToken();
      if (refreshed) {
        console.log('✅ [useAuth] Token refreshed automatiquement');
        return { shouldRetry: true };
      } else {
        console.log('❌ [useAuth] Refresh impossible, déconnexion automatique');
        signOut();
        return { shouldRedirectToLogin: true };
      }
    }

    // Si erreur réseau, garder en cache
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.log('📡 [useAuth] Erreur réseau, mode hors ligne activé');
      return { shouldUseCache: true };
    }

    return { shouldShowError: true, message: error.message };
  };

  return { handleAuthError };
}

/**
 * 🌐 Hook statut réseau
 */
function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const { refreshToken, getSessionInfo, heartbeat } = useAuth();

  useEffect(() => {
    const handleOnline = async () => {
      console.log('🌐 [useAuth] Connexion réseau rétablie');
      setIsOnline(true);
      
      if (wasOffline) {
        console.log('🔄 [useAuth] Vérification session après reconnexion...');
        const sessionInfo = getSessionInfo();
        if (sessionInfo.isRemembered) {
          try {
            const heartbeatOk = await heartbeat();
            if (!heartbeatOk) {
              await refreshToken();
            }
            console.log('✅ [useAuth] Session vérifiée après reconnexion');
          } catch (error) {
            console.log('⚠️ [useAuth] Impossible de vérifier la session');
          }
        }
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      console.log('📴 [useAuth] Connexion réseau perdue');
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline, refreshToken, getSessionInfo, heartbeat]);

  return {
    isOnline,
    wasOffline,
    connectionStatus: isOnline ? 'En ligne' : 'Hors ligne'
  };
}

/**
 * 📸 Hook refresh avatar avec cache-busting
 */
function useAvatarRefresh() {
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const [forceRefresh, setForceRefresh] = useState(0);
  const { profile, refreshProfile } = useAuth();

  useEffect(() => {
    const handleAvatarUpdate = async (event: CustomEvent) => {
      console.log('🔄 [useAuth] Avatar mis à jour globalement:', event.detail);
      const newKey = Date.now();
      setAvatarKey(newKey);
      setForceRefresh(prev => prev + 1);

      if (event.detail.forceRefresh) {
        setTimeout(async () => {
          try {
            await refreshProfile();
            console.log('✅ [useAuth] Profil rafraîchi via hook avatar');
          } catch (error) {
            console.warn('⚠️ [useAuth] Erreur refresh profil via hook');
          }
        }, 1000);
      }
    };

    // Écouter les mises à jour d'avatar
    window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener);

    // Écouter les changements de focus (retour sur l'onglet)
    const handleFocus = () => {
      setAvatarKey(Date.now());
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshProfile]);

  // URL avec cache-busting ultra-agressif
  const avatarUrl = profile?.avatar_url 
    ? `${profile.avatar_url.split('?')[0]}?v=${avatarKey}&f=${forceRefresh}&t=${Date.now()}`
    : null;

  return {
    avatarUrl,
    refreshAvatar: () => {
      const newKey = Date.now();
      setAvatarKey(newKey);
      setForceRefresh(prev => prev + 1);
    },
    forceRefresh: () => {
      setForceRefresh(prev => prev + 1);
      window.dispatchEvent(new CustomEvent('avatarUpdated', {
        detail: {
          url: profile?.avatar_url,
          userId: profile?.id,
          timestamp: Date.now(),
          forceRefresh: true
        }
      }));
    }
  };
}

/**
 * 🔄 Hook auto-refresh pour sessions longues avec heartbeat
 */
function useAutoRefresh() {
  const { refreshToken, getSessionInfo, heartbeat } = useAuth();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  const [nextRefresh, setNextRefresh] = useState<Date | null>(null);

  useEffect(() => {
    const checkAndRefresh = async () => {
      const sessionInfo = getSessionInfo();
      
      if (sessionInfo.isRemembered && sessionInfo.expiresAt) {
        const timeUntilExpiration = sessionInfo.expiresAt.getTime() - Date.now();
        const quality = sessionInfo.connectionQuality || 'stable';
        const config = AFRICA_SESSION_CONFIG[quality.toUpperCase() as keyof typeof AFRICA_SESSION_CONFIG] || AFRICA_SESSION_CONFIG.STABLE;

        // Heartbeat périodique pour sessions longues
        if (timeUntilExpiration > config.REFRESH_THRESHOLD) {
          const heartbeatSuccess = await heartbeat();
          if (heartbeatSuccess) {
            setLastHeartbeat(new Date());
            console.log('💓 [useAuth] Heartbeat réussi');
          }
        }

        // Renouveler avant expiration
        if (timeUntilExpiration < config.REFRESH_THRESHOLD) {
          console.log('⏰ [useAuth] Auto-refresh de la session...');
          try {
            const success = await refreshToken();
            if (success) {
              setLastRefresh(new Date());
              console.log('✅ [useAuth] Session auto-renouvelée');
            }
          } catch (error) {
            console.error('❌ [useAuth] Échec auto-refresh:', error);
          }
        }

        // Calculer le prochain refresh
        const nextRefreshTime = new Date(sessionInfo.expiresAt.getTime() - config.REFRESH_THRESHOLD);
        setNextRefresh(nextRefreshTime);
      }
    };

    // Vérifier immédiatement
    checkAndRefresh();

    // Puis toutes les 5 minutes
    const interval = setInterval(checkAndRefresh, AFRICA_SESSION_CONFIG.CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [refreshToken, getSessionInfo, heartbeat]);

  return {
    lastRefresh,
    lastHeartbeat,
    nextRefresh,
    isAutoRefreshActive: !!nextRefresh
  };
}

/**
 * 🔧 Hook debug pour développement
 */
function useAuthDebug() {
  const { user, profile, isLoading, getSessionInfo } = useAuth();

  if (import.meta.env.PROD) {
    return null; // Pas de debug en production
  }

  const sessionInfo = getSessionInfo();
  const authData = localStorage.getItem('auth_data') || sessionStorage.getItem('auth_data');
  
  let parsedAuthData = null;
  try {
    parsedAuthData = authData ? JSON.parse(authData) : null;
  } catch (e) {
    // Ignore parsing errors
  }

  return {
    // États
    states: {
      hasUser: !!user,
      hasProfile: !!profile,
      isLoading,
      userRole: user?.role,
      userId: user?.id
    },
    
    // Session avec qualité de connexion
    session: {
      type: sessionInfo.isRemembered ? 'LONGUE' : 'COURTE',
      connectionQuality: sessionInfo.connectionQuality || 'stable',
      timeLeft: sessionInfo.timeLeft,
      expiresAt: sessionInfo.expiresAt?.toLocaleString(),
      isRemembered: sessionInfo.isRemembered,
      adaptiveSession: true,
      version: '4.0'
    },
    
    // Storage avec refresh tokens
    storage: {
      hasAuthData: !!authData,
      authDataSize: authData ? authData.length : 0,
      hasLocalStorage: !!localStorage.getItem('auth_data'),
      hasSessionStorage: !!sessionStorage.getItem('auth_data'),
      hasBackup: !!sessionStorage.getItem('auth_backup'),
      hasAccessToken: !!parsedAuthData?.accessToken,
      hasRefreshToken: !!parsedAuthData?.refreshToken,
      sessionMetadata: parsedAuthData?.sessionMetadata
    },
    
    // Méthodes debug
    clearAllAuth: () => {
      localStorage.clear();
      sessionStorage.clear();
      console.log('🧹 [useAuth] Toutes les données auth supprimées');
    },
    
    logAuthState: () => {
      console.table({
        'Utilisateur connecté': !!user,
        'Profil chargé': !!profile,
        'Type de session': sessionInfo.isRemembered ? 'LONGUE' : 'COURTE',
        'Qualité connexion': sessionInfo.connectionQuality || 'stable',
        'Temps restant': sessionInfo.timeLeft,
        'Rôle': user?.role || 'N/A',
        'A Access Token': !!parsedAuthData?.accessToken,
        'A Refresh Token': !!parsedAuthData?.refreshToken,
        'Version': '4.0 - Compatible ExpenseService'
      });
    }
  };
}

// ============================================================================
// LOGS DE DÉMARRAGE
// ============================================================================

console.log('✅ [useAuth] Hook ultra-robuste chargé - Compatible ExpenseService 🛡️');
console.log('🔗 [useAuth] Synchronisé avec le nouveau backend auth.js');
console.log('🔒 [useAuth] Gestion ultra-sécurisée des tokens JWT');
console.log('🔄 [useAuth] Auto-refresh et heartbeat intelligents');
console.log('🌍 [useAuth] Optimisé pour l\'Afrique avec sessions adaptatives');
console.log('🚫 [useAuth] Export par défaut supprimé (Fast Refresh compatible)');

// ============================================================================
// EXPORTS NOMMÉS SEULEMENT (Fast Refresh compatible)
// ============================================================================

export { 
  AuthProvider, 
  useAuth, 
  usePermissions, 
  useUserDisplay, 
  useSessionInfo, 
  useAuthErrors, 
  useNetworkStatus, 
  useAvatarRefresh, 
  useAutoRefresh, 
  useAuthDebug 
};

console.log('✅ [useAuth] VERSION COMPLÈTE CORRIGÉE - Tous les hooks exportés 🛡️');