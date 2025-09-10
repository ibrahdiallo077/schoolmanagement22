// src/services/apiClient.ts - VERSION CORRIGÉE URL UNIQUEMENT

interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  details?: string;
  [key: string]: any;
}

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  data?: any; // CORRECTION : Ajouter le paramètre data
  timeout?: number;
}

class ApiClient {
  private config: ApiConfig;

  constructor() {
    this.config = {
      baseURL: this.getBaseURL(),
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer dev-token'
      }
    };

    console.log('🌐 ApiClient initialisé:', {
      baseURL: this.config.baseURL,
      environment: this.getEnvironment()
    });
  }

  private getEnvironment(): string {
    try {
      if (typeof process !== 'undefined' && process.env) {
        return process.env.NODE_ENV || 'development';
      }
      
      if (typeof window !== 'undefined') {
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' ||
            window.location.port === '3000' ||
            window.location.port === '8080' ||
            window.location.port === '5173') {
          return 'development';
        }
        return 'production';
      }
      
      return 'development';
    } catch (error) {
      console.warn('⚠️ Erreur détection environnement:', error);
      return 'development';
    }
  }

  // ✅ CORRECTION PRINCIPALE : Simplifier getBaseURL comme auth.ts
  private getBaseURL(): string {
    try {
      // Utiliser la même logique que auth.ts
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      console.log('🔧 URL API récupérée:', baseUrl);
      
      // Ajouter /api si pas déjà présent
      return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
      
    } catch (error) {
      console.error('💥 Erreur getBaseURL:', error);
      return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;
    }
  }

  private getEnvVar(key: string, defaultValue: string = ''): string {
    try {
      if (typeof process !== 'undefined' && process.env) {
        return process.env[key] || defaultValue;
      }

      const reactKey = `REACT_APP_${key}`;
      if (typeof window !== 'undefined' && (window as any)[reactKey]) {
        return (window as any)[reactKey];
      }

      const nextKey = `NEXT_PUBLIC_${key}`;
      if (typeof window !== 'undefined' && (window as any)[nextKey]) {
        return (window as any)[nextKey];
      }

      return defaultValue;
    } catch (error) {
      console.warn(`⚠️ Erreur récupération variable ${key}:`, error);
      return defaultValue;
    }
  }

  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const defaultHeaders = { ...this.config.headers };
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token') || 
                   localStorage.getItem('auth_token') || 
                   sessionStorage.getItem('auth_token') ||
                   'dev-token';
      
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    return {
      ...defaultHeaders,
      ...customHeaders
    };
  }

  private handleError(error: any, url: string, method: string): never {
    console.error('💥 Erreur API:', {
      method,
      url,
      error: error.message || error,
      status: error.status,
      stack: error.stack
    });

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Erreur de connexion au serveur. Vérifiez votre connexion internet.');
    }

    if (error.name === 'AbortError') {
      throw new Error('Délai d\'attente dépassé. Le serveur met trop de temps à répondre.');
    }

    if (error.status) {
      switch (error.status) {
        case 400:
          throw new Error('Données invalides envoyées au serveur. Vérifiez tous les champs requis.');
        case 401:
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('access_token');
            sessionStorage.removeItem('auth_token');
          }
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        case 403:
          throw new Error('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
        case 404:
          throw new Error('Ressource non trouvée sur le serveur.');
        case 422:
          throw new Error('Données de validation incorrectes.');
        case 429:
          throw new Error('Trop de requêtes. Veuillez patienter quelques instants.');
        case 500:
          throw new Error('Erreur interne du serveur. Contactez le support technique.');
        case 502:
        case 503:
        case 504:
          throw new Error('Service temporairement indisponible. Réessayez dans quelques minutes.');
        default:
          throw new Error(`Erreur serveur: ${error.status} - ${error.statusText || 'Erreur inconnue'}`);
      }
    }

    throw new Error(error.message || 'Une erreur inattendue s\'est produite.');
  }

  /**
   * CORRECTION MAJEURE : Méthode request corrigée pour gérer body ET data
   */
  async request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers: customHeaders,
      body,
      data, // CORRECTION : Récupérer aussi le paramètre data
      timeout = this.config.timeout
    } = config;

    const url = `${this.config.baseURL}${endpoint}`;
    const headers = this.getHeaders(customHeaders);

    // CORRECTION MAJEURE : Utiliser data en priorité, puis body
    const requestBody = data || body;

    // CORRECTION : Logging amélioré pour débugger
    console.log('🚀 Requête API:', {
      method,
      url,
      headers: { 
        ...headers, 
        Authorization: headers.Authorization?.substring(0, 30) + '...' 
      },
      hasBody: !!requestBody,
      bodyType: requestBody ? typeof requestBody : 'none',
      bodyPreview: requestBody ? (
        typeof requestBody === 'object' 
          ? Object.keys(requestBody).join(', ') 
          : String(requestBody).substring(0, 100)
      ) : 'empty'
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: controller.signal
      };

      // CORRECTION MAJEURE : Sérialization conditionnelle du body
      if (requestBody && method !== 'GET') {
        if (headers['Content-Type']?.includes('application/json')) {
          // Pour JSON, sérialiser l'objet
          fetchOptions.body = JSON.stringify(requestBody);
          console.log('📤 Body JSON envoyé:', {
            originalData: requestBody,
            serializedLength: fetchOptions.body.length,
            serializedPreview: fetchOptions.body.substring(0, 200) + '...'
          });
        } else {
          // Pour les autres types (FormData, string), envoyer tel quel
          fetchOptions.body = requestBody;
          console.log('📤 Body brut envoyé:', typeof requestBody);
        }
      } else if (method === 'GET' && requestBody) {
        console.warn('⚠️ Body ignoré pour requête GET');
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      console.log('📡 Réponse API:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Gestion des réponses non-JSON
      const contentType = response.headers.get('content-type');
      
      if (contentType && !contentType.includes('application/json')) {
        if (response.ok) {
          if (contentType.includes('application/pdf') || contentType.includes('image/')) {
            const blob = await response.blob();
            return {
              success: true,
              data: blob as T,
              message: 'Fichier téléchargé avec succès'
            };
          }
          
          const text = await response.text();
          return {
            success: true,
            data: text as T,
            message: 'Données récupérées avec succès'
          };
        }
      }

      // Traitement des réponses JSON
      let responseData: any;
      try {
        const text = await response.text();
        responseData = text ? JSON.parse(text) : {};
        console.log('📨 Données JSON reçues:', {
          hasData: !!responseData,
          keys: responseData && typeof responseData === 'object' ? Object.keys(responseData) : 'non-object',
          success: responseData?.success,
          error: responseData?.error
        });
      } catch (parseError) {
        console.warn('⚠️ Impossible de parser la réponse JSON:', parseError);
        responseData = { 
          success: false, 
          error: 'Réponse invalide du serveur',
          details: parseError instanceof Error ? parseError.message : 'Parse error'
        };
      }

      if (!response.ok) {
        const error = new Error(responseData.message || responseData.error || response.statusText) as any;
        error.status = response.status;
        error.statusText = response.statusText;
        error.data = responseData;
        
        this.handleError(error, url, method);
      }

      // CORRECTION : Retour normalisé
      return {
        success: responseData.success ?? true,
        ...responseData,
        data: responseData.data || responseData
      };

    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Si c'est déjà une erreur gérée, la relancer
      if (error.message && (
        error.message.includes('Données invalides') ||
        error.message.includes('Session expirée') ||
        error.message.includes('Erreur')
      )) {
        throw error;
      }
      
      this.handleError(error, url, method);
    }
  }

  /**
   * CORRECTION : Méthodes de convenance corrigées
   */
  async get<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body' | 'data'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', data }); // CORRECTION : utiliser data
  }

  async put<T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', data }); // CORRECTION : utiliser data
  }

  async patch<T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', data }); // CORRECTION : utiliser data
  }

  async delete<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body' | 'data'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // Reste des méthodes inchangées...
  async uploadFile<T = any>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('avatar', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const headers = this.getHeaders();
    delete headers['Content-Type'];

    console.log('📤 Upload fichier:', {
      endpoint,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    const url = `${this.config.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseData = await response.json();

      if (!response.ok) {
        const error = new Error(responseData.message || response.statusText) as any;
        error.status = response.status;
        error.data = responseData;
        this.handleError(error, url, 'POST');
      }

      console.log('✅ Upload réussi:', responseData);
      return { success: true, ...responseData };

    } catch (error: any) {
      clearTimeout(timeoutId);
      this.handleError(error, url, 'POST');
    }
  }

  async downloadFile(endpoint: string, filename?: string): Promise<void> {
    try {
      const response = await this.request<Blob>(endpoint);
      
      if (response.success && response.data) {
        const blob = response.data as Blob;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('✅ Fichier téléchargé:', filename);
      }
    } catch (error) {
      console.error('💥 Erreur téléchargement:', error);
      throw error;
    }
  }

  setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('access_token', token);
    }
    this.config.headers.Authorization = `Bearer ${token}`;
    console.log('🔐 Token mis à jour');
  }

  clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('auth_token');
    }
    this.config.headers.Authorization = 'Bearer dev-token';
    console.log('🚪 Token supprimé');
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch (error) {
      console.warn('⚠️ Serveur non disponible:', error);
      return false;
    }
  }

  getConfig(): ApiConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configuration mise à jour:', this.config);
  }

  debugEnvironment(): void {
    console.log('🔧 === DEBUG ENVIRONNEMENT ===');
    console.log('Environment:', this.getEnvironment());
    console.log('BaseURL:', this.config.baseURL);
    console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('Window defined:', typeof window !== 'undefined');
    console.log('Process defined:', typeof process !== 'undefined');
    
    if (typeof window !== 'undefined') {
      console.log('Location:', window.location.href);
      console.log('Hostname:', window.location.hostname);
      console.log('Port:', window.location.port);
      console.log('LocalStorage tokens:', {
        auth_token: !!localStorage.getItem('auth_token'),
        access_token: !!localStorage.getItem('access_token')
      });
    }
    console.log('🔧 === FIN DEBUG ===');
  }
}

// Instance singleton
export const apiClient = new ApiClient();

// Debug en développement
if (typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  (window as any).debugApiClient = () => apiClient.debugEnvironment();
  console.log('🔧 Debug disponible: debugApiClient()');
}

export type { ApiResponse, RequestConfig };
export default apiClient;