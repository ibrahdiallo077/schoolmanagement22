// services/expenseService.ts - VERSION COMPLÈTE CORRIGÉE AVEC UUID HARMONISÉ
// 🔥 Correction de la validation UUID et suppression optimisée

import {
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  CreateExpenseDto,
  ExpenseResponsible,
  UpdateExpenseDto,
  ExpenseFilters,
  ApiResponse,
  PaginatedResponse,
  ExpenseListResponse,
  ExpenseDashboard
} from '@/types/expense.types';

// ============================================================================
// CONFIGURATION SÉCURISÉE
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================================================
// GESTION ROBUSTE DES TOKENS
// ============================================================================

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

    performTokenCleanup();
    return null;

  } catch (error) {
    console.error('💥 [ExpenseService] Erreur récupération token:', error);
    performTokenCleanup();
    return null;
  }
};

const isValidToken = (token: any): token is string => {
  if (!token || typeof token !== 'string') return false;
  if (token === 'undefined' || token === 'null' || token === '') return false;
  if (token.includes('undefined') || token.includes('null')) return false;
  if (token.length < 20) return false;
  
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  return true;
};

const performTokenCleanup = (): void => {
  try {
    const keysToClean = [
      'auth_token', 'token', 'accessToken', 'refreshToken',
      'user_info', 'user', 'auth_data', 'auth_data_v3'
    ];

    keysToClean.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  } catch (error) {
    console.error('💥 [ExpenseService] Erreur nettoyage:', error);
  }
};

const handleAuthError = (error: any, response?: any): void => {
  const isAuthError = (
    response?.status === 401 ||
    error.message?.includes('Token') ||
    error.message?.includes('authentification') ||
    error.message?.includes('Unauthorized') ||
    error.message?.includes('Session expirée')
  );

  if (isAuthError) {
    performTokenCleanup();
    setTimeout(() => {
      if (window.location.pathname !== '/signin') {
        window.location.href = '/signin';
      }
    }, 500);
  }
};

const getRequestConfig = (options: RequestInit = {}): RequestInit => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (token) {
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    (config.headers as Record<string, string>)['X-Auth-Token'] = token;
  }

  return config;
};

// ============================================================================
// API CLIENT ROBUSTE
// ============================================================================

class ApiClient {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;

  private static async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const result = await this.performRequest<T>(endpoint, options);
        return result;
      } catch (error: any) {
        lastError = error;
        
        if (this.shouldNotRetry(error)) {
          break;
        }
        
        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY * attempt);
        }
      }
    }
    
    this.handleFinalError(lastError!, endpoint);
    throw lastError!;
  }

  private static async performRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    if (!cleanEndpoint.startsWith('/api/expenses')) {
      cleanEndpoint = `/api/expenses${cleanEndpoint}`;
    }
    
    const url = `${API_BASE_URL}${cleanEndpoint}`;
    const config = getRequestConfig(options);

    const token = getAuthToken();
    if (!token) {
      throw new Error('Session expirée - Veuillez vous reconnecter');
    }

    const response = await fetch(url, config);
    return this.processResponse<T>(response, cleanEndpoint);
  }

  private static async processResponse<T>(response: Response, endpoint: string): Promise<T> {
    if (response.status === 401) {
      handleAuthError(new Error('Token invalide'), { status: 401 });
      throw new Error('Session expirée - Veuillez vous reconnecter');
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorData.message || errorMessage;
        }
      } catch (parseError) {
        // Ignore parsing errors
      }
      
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true } as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      
      if (data.success === false) {
        throw new Error(data.error || data.details || data.message || 'Erreur serveur');
      }
      
      return data;
    } else {
      return { success: true } as T;
    }
  }

  private static shouldNotRetry(error: any): boolean {
    const status = error.status;
    return status === 401 || status === 403 || status === 404 || status === 422 ||
           error.message?.includes('Token') || error.message?.includes('authentification');
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static handleFinalError(error: any, endpoint: string): void {
    if (error.status === 401 || error.message?.includes('Token') || error.message?.includes('Session expirée')) {
      handleAuthError(error);
    }
  }

  // Méthodes publiques
  static get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static patch<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static delete<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { 
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// ============================================================================
// 🔥 VALIDATION UUID HARMONISÉE AVEC LE BACKEND
// ============================================================================

const isValidUUID = (uuid: string): boolean => {
  if (!uuid || typeof uuid !== 'string') return false;
  
  // 🔥 CORRECTION : Regex UUID harmonisée avec le backend - plus flexible
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  return uuidRegex.test(uuid.trim());
};

/**
 * 🔥 NOUVEAU : Validation UUID avec debugging
 */
export const validateUUID = (uuid: any, context: string = 'Unknown'): string | null => {
  if (!uuid) {
    console.warn(`⚠️ [UUID] ${context}: UUID manquant`);
    return null;
  }
  
  const cleanUuid = String(uuid).trim();
  
  if (!isValidUUID(cleanUuid)) {
    console.warn(`⚠️ [UUID] ${context}: UUID invalide:`, cleanUuid);
    debugUUID(cleanUuid, context);
    return null;
  }
  
  return cleanUuid;
};

/**
 * 🔥 NOUVEAU : Debug UUID pour développement
 */
export const debugUUID = (uuid: any, context: string = 'Unknown') => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔍 [UUID Debug] ${context}`);
    console.log('Valeur reçue:', uuid);
    console.log('Type:', typeof uuid);
    console.log('Après String():', String(uuid));
    console.log('Après trim():', String(uuid).trim());
    console.log('Longueur:', String(uuid).trim().length);
    console.log('Est valide:', isValidUUID(String(uuid).trim()));
    
    // Test avec différentes regex
    const strictRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const flexibleRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    console.log('Strict regex (v4 only):', strictRegex.test(String(uuid).trim()));
    console.log('Flexible regex (all versions):', flexibleRegex.test(String(uuid).trim()));
    console.groupEnd();
  }
};

/**
 * 🔥 NOUVEAU : Nettoyage des IDs pour les listes
 */
export const cleanExpenseIds = (ids: any[]): string[] => {
  if (!Array.isArray(ids)) {
    console.warn('⚠️ [cleanExpenseIds] Entrée non-array:', ids);
    return [];
  }
  
  const cleanIds = ids
    .map(id => validateUUID(id, 'cleanExpenseIds'))
    .filter((id): id is string => id !== null);
  
  console.log(`📊 [cleanExpenseIds] ${ids.length} -> ${cleanIds.length} IDs valides`);
  return cleanIds;
};

// ============================================================================
// EXPENSE SERVICE AVEC RECHERCHE INTELLIGENTE
// ============================================================================

export class ExpenseService {
  
  // ==================== 🆕 NOUVELLES MÉTHODES - RECHERCHE INTELLIGENTE ====================
  
  /**
   * 🆕 Get filter options - VERSION SIMPLIFIÉE
   */
  static async getFilterOptions(): Promise<ApiResponse<{
    categories: { id: string; name: string; color: string; icon: string }[];
    statuses: { id: string; name: string; color: string; icon: string }[];
    years: number[];
    search_hints: {
      text: string;
      amount: string;
      year: string;
      global: string;
    };
  }>> {
    try {
      const response = await ApiClient.get<any>('/config/filter-options');
      
      if (response && response.success) {
        return {
          success: true,
          data: response.filter_options,
          user_permissions: response.user_permissions,
          message: 'Options de filtrage récupérées avec succès'
        };
      }
      
      throw new Error(response?.error || 'Erreur lors de la récupération des options');
      
    } catch (error: any) {
      return {
        success: false,
        data: {
          categories: [{ id: 'all', name: 'Toutes les catégories', color: '#6B7280', icon: 'Layers' }],
          statuses: [
            { id: 'all', name: 'Tous les statuts', color: '#6B7280', icon: 'List' },
            { id: 'pending', name: 'En attente', color: '#F59E0B', icon: 'Clock' },
            { id: 'paid', name: 'Payé', color: '#10B981', icon: 'Check' },
            { id: 'rejected', name: 'Rejeté', color: '#EF4444', icon: 'X' }
          ],
          years: [2024, 2025, 2026, 2027, 2028],
          search_hints: {
            text: 'Rechercher par description, référence, fournisseur...',
            amount: 'Rechercher par montant (ex: 1000, 250.50)',
            year: 'Rechercher par année (ex: 2024, 2025)',
            global: 'Recherche dans toutes les données'
          }
        },
        error: error.message || 'Erreur de chargement des options'
      };
    }
  }

  /**
   * 🆕 Get search suggestions - RECHERCHE DYNAMIQUE
   */
  static async getSearchSuggestions(query: string): Promise<ApiResponse<{
    type: 'description' | 'supplier' | 'amount' | 'year';
    value: string;
  }[]>> {
    try {
      if (!query || query.length < 2) {
        return {
          success: true,
          data: []
        };
      }
      
      const params = new URLSearchParams();
      params.append('q', query.trim());
      
      const response = await ApiClient.get<any>(`/search/suggestions?${params.toString()}`);
      
      if (response && response.success) {
        return {
          success: true,
          data: Array.isArray(response.suggestions) ? response.suggestions : [],
          message: 'Suggestions récupérées'
        };
      }
      
      return {
        success: true,
        data: []
      };
      
    } catch (error: any) {
      return {
        success: true,
        data: []
      };
    }
  }

  // ==================== 🔧 MÉTHODE CORRIGÉE - GET EXPENSES ====================

  /**
   * 🔧 Get expenses list - VERSION CORRIGÉE AVEC RECHERCHE INTELLIGENTE
   */
  static async getExpenses(filters: Partial<ExpenseFilters> = {}): Promise<ExpenseListResponse> {
    try {
      // Construire les paramètres selon le backend corrigé
      const params = new URLSearchParams();
      
      // Paramètres de pagination avec validation
      params.append('page', Math.max(1, filters.page || 1).toString());
      params.append('limit', Math.max(1, Math.min(100, filters.limit || 12)).toString());
      
      // 🔍 RECHERCHE GLOBALE INTELLIGENTE (remplace recherche + année + mois)
      if (filters.search && filters.search.trim()) {
        params.append('search', filters.search.trim());
      }
      
      // Filtres simplifiés
      if (filters.category_id && filters.category_id !== 'all') {
        params.append('category_id', filters.category_id.trim());
      }
      
      if (filters.status_id && filters.status_id !== 'all') {
        params.append('status_id', filters.status_id.trim());
      }
      
      // Tri sécurisé
      const allowedSortFields = ['expense_date', 'amount', 'reference', 'created_at', 'description'];
      const sortBy = allowedSortFields.includes(filters.sort_by || '') ? filters.sort_by : 'expense_date';
      const sortOrder = ['asc', 'desc'].includes(filters.sort_order || '') ? filters.sort_order : 'desc';
      
      params.append('sort_by', sortBy!);
      params.append('sort_order', sortOrder!);
      
      const queryString = params.toString();
      const endpoint = queryString ? `?${queryString}` : '';
      
      const response = await ApiClient.get<any>(endpoint);
      
      if (response && response.success) {
        // Traiter les données avec enrichissement sécurisé
        const expenses = Array.isArray(response.expenses) ? response.expenses : [];
        
        const enrichedExpenses = expenses.map((expense: any) => this.enrichExpenseData(expense));
        
        return {
          success: true,
          data: enrichedExpenses,
          pagination: this.sanitizePagination(response.pagination),
          search_info: response.search_info || null,
          filters: response.filters || {},
          user_info: response.user_info || null,
          message: response.search_info 
            ? `${enrichedExpenses.length} résultats pour "${response.search_info.term}"`
            : `${enrichedExpenses.length} dépenses récupérées`
        };
      }
      
      throw new Error(response?.error || 'Réponse invalide du serveur');
      
    } catch (error: any) {
      // Retourner une réponse de fallback en cas d'erreur
      return {
        success: false,
        data: [],
        pagination: { page: 1, limit: 12, total: 0, pages: 0 },
        error: error.message || 'Erreur de connexion au serveur'
      };
    }
  }

  // ==================== Validation et User Info ====================
  
  static async checkValidationAccess(): Promise<ApiResponse<{
    has_access: boolean;
    user_info: {
      id: number;
      name: string;
      role: string;
      badge: string;
      can_validate: boolean;
      can_view_validation_page: boolean;
    };
    message: string;
  }>> {
    try {
      const response = await ApiClient.get<any>('/validation/access-check');
      
      if (response && response.success) {
        return {
          success: true,
          data: response,
          message: response.message || 'Vérification d\'accès réussie'
        };
      }
      
      throw new Error(response?.error || 'Erreur de vérification d\'accès');
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur de vérification d\'accès'
      };
    }
  }

  static async getUserInfo(): Promise<ApiResponse<{
    id: number;
    name: string;
    email: string;
    role: string;
    permissions: {
      canValidate: boolean;
      canCreateExpense: boolean;
      canViewValidation: boolean;
      canViewAllExpenses: boolean;
      canEditOwnExpenses: boolean;
      canDeleteOwnExpenses: boolean;
    };
  }>> {
    try {
      const response = await ApiClient.get<any>('/test/user-info');
      
      if (response && response.success) {
        return {
          success: true,
          data: response.user,
          message: 'Informations utilisateur récupérées'
        };
      }
      
      throw new Error(response?.error || 'Erreur récupération utilisateur');
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur récupération utilisateur'
      };
    }
  }
  
  // ==================== 🔥 CRUD OPERATIONS CORRIGÉES ====================
  
  static async getExpense(id: string): Promise<ApiResponse<Expense>> {
    try {
      // 🔥 CORRECTION : Utiliser la nouvelle validation
      const cleanId = validateUUID(id, 'getExpense');
      if (!cleanId) {
        return {
          success: false,
          error: 'ID de dépense invalide'
        };
      }
      
      const response = await ApiClient.get<any>(`/${cleanId}`);
      
      if (response && response.success) {
        const expense = this.enrichExpenseData(response.expense);
        
        return {
          success: true,
          data: expense,
          user_permissions: response.user_permissions,
          message: response.message || 'Dépense récupérée avec succès'
        };
      }
      
      throw new Error(response?.error || 'Dépense non trouvée');
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur de récupération'
      };
    }
  }

  static async createExpense(data: CreateExpenseDto): Promise<ApiResponse<Expense>> {
    try {
      const validationError = this.validateCreateData(data);
      if (validationError) {
        return {
          success: false,
          error: validationError
        };
      }
      
      const cleanData = this.sanitizeCreateData(data);
      
      const response = await ApiClient.post<any>('/', cleanData);
      
      if (response && response.success && response.expense) {
        const expense = this.enrichExpenseData(response.expense);
        
        return {
          success: true,
          data: expense,
          created_by: response.created_by,
          next_steps: response.next_steps,
          message: response.message || 'Dépense créée avec succès'
        };
      }
      
      throw new Error(response?.error || 'Erreur lors de la création');
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur de création'
      };
    }
  }

  static async updateExpense(id: string, data: UpdateExpenseDto): Promise<ApiResponse<Expense>> {
    try {
      // 🔥 CORRECTION : Utiliser la nouvelle validation
      const cleanId = validateUUID(id, 'updateExpense');
      if (!cleanId) {
        return {
          success: false,
          error: 'ID de dépense invalide'
        };
      }
      
      const cleanData = this.sanitizeUpdateData(data);
      
      const response = await ApiClient.put<any>(`/${cleanId}`, cleanData);
      
      if (response && response.success) {
        return {
          success: true,
          message: response.message || 'Dépense modifiée avec succès'
        };
      }
      
      throw new Error(response?.error || 'Erreur lors de la modification');
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur de modification'
      };
    }
  }

  static async changeExpenseStatus(
    id: string, 
    status_id: string, 
    notes_validation?: string
  ): Promise<ApiResponse<any>> {
    try {
      // 🔥 CORRECTION : Utiliser la nouvelle validation pour les deux IDs
      const cleanId = validateUUID(id, 'changeExpenseStatus-expense');
      const cleanStatusId = validateUUID(status_id, 'changeExpenseStatus-status');
      
      if (!cleanId || !cleanStatusId) {
        return {
          success: false,
          error: 'IDs invalides (dépense ou statut)'
        };
      }
      
      const data = {
        status_id: cleanStatusId,
        notes_validation: notes_validation?.trim().substring(0, 500) || undefined
      };
      
      const response = await ApiClient.patch<any>(`/${cleanId}/status`, data);
      
      if (response && response.success) {
        return {
          success: true,
          data: response.validation_info,
          message: response.message || 'Statut modifié avec succès'
        };
      }
      
      throw new Error(response?.error || 'Erreur lors du changement de statut');
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur de changement de statut'
      };
    }
  }

  // ==================== 🔥 CORRECTION : SUPPRESSION AVEC UUID HARMONISÉ ====================
 
  /**
   * 🔥 CORRECTION : Supprimer une dépense avec validation UUID corrigée
   */
  static async deleteExpense(id: string): Promise<ApiResponse<void>> {
    try {
      console.log('🗑️ [ExpenseService] Tentative de suppression pour ID:', id);
      console.log('🗑️ [ExpenseService] Type de l\'ID:', typeof id);
      
      // 🔥 CORRECTION : Validation UUID avec debugging
      const cleanId = validateUUID(id, 'deleteExpense');
      if (!cleanId) {
        return {
          success: false,
          error: 'ID de dépense invalide ou manquant'
        };
      }

      console.log('✅ [ExpenseService] UUID validé:', cleanId);

      // 📡 Appel API avec gestion d'erreur améliorée
      const response = await ApiClient.delete<any>(`/${cleanId}`);
      
      console.log('📡 [ExpenseService] Réponse suppression:', response);
      
      if (response && response.success) {
        console.log('✅ [ExpenseService] Suppression réussie:', cleanId);
        return {
          success: true,
          message: response.message || 'Dépense supprimée avec succès',
          data: response.deleted_expense || undefined
        };
      }
      
      // 🔥 CORRECTION : Gestion des erreurs spécifiques
      const errorMessage = response?.error || response?.details || 'Erreur lors de la suppression';
      console.error('❌ [ExpenseService] Erreur backend:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
      
    } catch (error: any) {
      console.error('💥 [ExpenseService] Erreur suppression:', error);
      
      // 🔥 CORRECTION : Messages d'erreur plus spécifiques selon le status HTTP
      let userMessage = 'Erreur de suppression';
      
      if (error.status === 400) {
        userMessage = 'Données invalides - Vérifiez l\'ID de la dépense';
        // Debug supplémentaire pour les erreurs 400
        debugUUID(id, 'deleteExpense-error-400');
      } else if (error.status === 401) {
        userMessage = 'Session expirée - Veuillez vous reconnecter';
      } else if (error.status === 403) {
        userMessage = 'Permissions insuffisantes pour supprimer cette dépense';
      } else if (error.status === 404) {
        userMessage = 'Dépense non trouvée ou déjà supprimée';
      } else if (error.status === 409) {
        userMessage = 'Impossible de supprimer - Dépense déjà traitée';
      } else if (error.message?.includes('fetch')) {
        userMessage = 'Problème de connexion au serveur';
      } else if (error.message) {
        userMessage = error.message;
      }
      
      return {
        success: false,
        error: userMessage
      };
    }
  }

  /**
   * 🔥 CORRECTION : Suppression multiple avec validation UUID corrigée
   */
  static async deleteMultipleExpenses(ids: string[]): Promise<ApiResponse<{
    successful: number;
    failed: number;
    errors: string[];
    successfulIds: string[];
    failedIds: string[];
  }>> {
    try {
      console.log('🗑️ [ExpenseService] Suppression multiple pour:', ids?.length, 'éléments');
      console.log('🗑️ [ExpenseService] IDs reçus:', ids);
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return {
          success: false,
          error: 'Aucune dépense sélectionnée pour suppression'
        };
      }

      if (ids.length > 20) {
        return {
          success: false,
          error: 'Trop de dépenses sélectionnées (maximum 20)'
        };
      }

      // 🔥 CORRECTION : Valider tous les IDs avec nouveau système
      const validIds = cleanExpenseIds(ids);

      if (validIds.length === 0) {
        console.error('❌ [ExpenseService] Aucun ID valide après nettoyage');
        return {
          success: false,
          error: 'Aucun ID de dépense valide trouvé',
          data: {
            successful: 0,
            failed: ids.length,
            errors: ids.map(id => `${id}: Format d'ID invalide`),
            successfulIds: [],
            failedIds: ids.map(id => String(id))
          }
        };
      }

      console.log(`📊 [ExpenseService] IDs valides: ${validIds.length}/${ids.length}`);

      // 🔥 TENTATIVE 1 : Utiliser la route bulk si elle existe
      try {
        console.log('🔄 [ExpenseService] Tentative suppression bulk...');
        const bulkResponse = await ApiClient.delete<any>('/bulk/delete', {
          expense_ids: validIds
        });

        if (bulkResponse && bulkResponse.success) {
          console.log('✅ [ExpenseService] Suppression bulk réussie');
          return {
            success: true,
            data: {
              successful: bulkResponse.results?.deleted_count || 0,
              failed: (bulkResponse.results?.not_found?.length || 0) + (bulkResponse.results?.non_deletable?.length || 0),
              errors: [
                ...(bulkResponse.results?.not_found?.map((id: string) => `${id}: Non trouvé`) || []),
                ...(bulkResponse.results?.non_deletable?.map((item: any) => `${item.id}: ${item.reason}`) || [])
              ],
              successfulIds: bulkResponse.results?.deleted_expenses?.map((exp: any) => exp.id) || [],
              failedIds: [
                ...(bulkResponse.results?.not_found || []),
                ...(bulkResponse.results?.non_deletable?.map((item: any) => item.id) || [])
              ]
            },
            message: bulkResponse.message || 'Suppression multiple terminée'
          };
        }
      } catch (bulkError) {
        console.warn('⚠️ [ExpenseService] Suppression bulk échouée, fallback individuel:', bulkError);
      }

      // 🔥 FALLBACK : Suppression individuelle
      console.log('🔄 [ExpenseService] Suppression individuelle pour chaque ID...');
      
      const results = await Promise.allSettled(
        validIds.map(async (id) => {
          try {
            const result = await this.deleteExpense(id);
            return { id, result };
          } catch (error) {
            return { id, result: { success: false, error: (error as Error).message } };
          }
        })
      );

      // 📊 Analyser les résultats
      const successful: string[] = [];
      const failed: string[] = [];
      const errors: string[] = [];

      results.forEach((promiseResult, index) => {
        const id = validIds[index];
        
        if (promiseResult.status === 'fulfilled') {
          const { result } = promiseResult.value;
          if (result.success) {
            successful.push(id);
          } else {
            failed.push(id);
            errors.push(`${id}: ${result.error || 'Erreur inconnue'}`);
          }
        } else {
          failed.push(id);
          errors.push(`${id}: ${promiseResult.reason?.message || 'Erreur de suppression'}`);
        }
      });

      // Ajouter les IDs invalides aux échecs
      const invalidIds = ids.filter(id => !validIds.includes(String(id).trim()));
      invalidIds.forEach(id => {
        failed.push(String(id));
        errors.push(`${id}: Format d'ID invalide`);
      });

      const totalSuccessful = successful.length;
      const totalFailed = failed.length;

      console.log(`✅ [ExpenseService] Suppression multiple terminée: ${totalSuccessful} réussies, ${totalFailed} échouées`);

      return {
        success: totalSuccessful > 0, // Succès si au moins une suppression réussie
        data: {
          successful: totalSuccessful,
          failed: totalFailed,
          errors,
          successfulIds: successful,
          failedIds: failed
        },
        message: totalFailed === 0 
          ? `${totalSuccessful} dépense(s) supprimée(s) avec succès`
          : `${totalSuccessful} dépense(s) supprimée(s), ${totalFailed} échec(s)`
      };

    } catch (error: any) {
      console.error('💥 [ExpenseService] Erreur suppression multiple:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la suppression multiple'
      };
    }
  }

  // ==================== Configuration Data ====================

  static async getCategories(): Promise<ApiResponse<ExpenseCategory[]>> {
    try {
      const response = await ApiClient.get<any>('/config/categories');
      
      if (response && response.success) {
        const categories = Array.isArray(response.categories) ? response.categories : [];
        return {
          success: true,
          data: categories,
          message: 'Catégories récupérées avec succès'
        };
      }
      
      throw new Error(response?.error || 'Erreur lors de la récupération des catégories');
      
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Erreur de chargement des catégories'
      };
    }
  }

  static async getStatuses(): Promise<ApiResponse<ExpenseStatus[]>> {
    try {
      const response = await ApiClient.get<any>('/config/statuses');
      
      if (response && response.success) {
        const statuses = Array.isArray(response.statuses) ? response.statuses : [];
        return {
          success: true,
          data: statuses,
          user_permissions: response.user_permissions,
          message: 'Statuts récupérés avec succès'
        };
      }
      
      throw new Error(response?.error || 'Erreur lors de la récupération des statuts');
      
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Erreur de chargement des statuts'
      };
    }
  }  

  // 🔥 MÉTHODE AJOUTÉE : getResponsibles
  static async getResponsibles(): Promise<ApiResponse<ExpenseResponsible[]>> {
    try {
      const response = await ApiClient.get<any>('/config/responsibles');
      
      if (response && response.success) {
        const responsibles = Array.isArray(response.responsibles) ? response.responsibles : [];
        return {
          success: true,
          data: responsibles,
          message: 'Responsables récupérés avec succès'
        };
      }
      
      throw new Error(response?.error || 'Erreur lors de la récupération des responsables');
      
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Erreur de chargement des responsables'
      };
    }
  }

  static async getPaymentMethods(): Promise<ApiResponse<{ value: string; label: string; description: string }[]>> {
    try {
      const response = await ApiClient.get<any>('/config/payment-methods');
      
      if (response && response.success) {
        const methods = Array.isArray(response.payment_methods) ? response.payment_methods : [];
        return {
          success: true,
          data: methods,
          message: 'Méthodes de paiement récupérées avec succès'
        };
      }
      
      throw new Error(response?.error || 'Erreur lors de la récupération des méthodes');
      
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Erreur de chargement des méthodes de paiement'
      };
    }
  }

  // ==================== Dashboard ====================

  static async getDashboard(): Promise<ApiResponse<ExpenseDashboard>> {
    try {
      const response = await ApiClient.get<any>('/dashboard');
      
      if (response && response.success && response.dashboard) {
        const stats = response.dashboard.statistiques || {};
        const dashboard: ExpenseDashboard = {
          stats: this.sanitizeDashboardStats(stats),
          recent_expenses: Array.isArray(response.dashboard.depenses_recentes) ? response.dashboard.depenses_recentes : [],
          top_categories: Array.isArray(response.dashboard.categories_top) ? response.dashboard.categories_top : [],
          monthly_trend: Array.isArray(response.dashboard.evolution_mensuelle) ? response.dashboard.evolution_mensuelle : [],
          user_permissions: response.dashboard.user_permissions || null
        };
        
        return {
          success: true,
          data: dashboard,
          message: 'Dashboard récupéré avec succès'
        };
      }
      
      throw new Error(response?.error || 'Erreur lors de la récupération du dashboard');
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur de chargement du dashboard'
      };
    }
  }

  // ==================== Workflow Functions ====================

  static async getPendingExpenses(): Promise<ApiResponse<Expense[]>> {
    try {
      const response = await ApiClient.get<any>('/workflow/pending');
      
      if (response && response.success) {
        const expenses = Array.isArray(response.pending_expenses) ? response.pending_expenses : [];
        const enrichedExpenses = expenses.map((expense: any) => this.enrichExpenseData(expense));
        
        return {
          success: true,
          data: enrichedExpenses,
          count: response.count || 0,
          validator_info: response.validator_info,
          message: `${response.count || 0} dépenses en attente de validation`
        };
      }
      
      throw new Error(response?.error || 'Erreur lors de la récupération des dépenses en attente');
      
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Erreur de chargement'
      };
    }
  }

  static async validateSingleExpense(
    expense_id: string, 
    action: 'approve' | 'reject', 
    notes?: string
  ): Promise<ApiResponse<any>> {
    try {
      // 🔥 CORRECTION : Utiliser la nouvelle validation
      const cleanId = validateUUID(expense_id, 'validateSingleExpense');
      if (!cleanId) {
        return {
          success: false,
          error: 'ID de dépense invalide'
        };
      }
      
      if (!action || !['approve', 'reject'].includes(action)) {
        return {
          success: false,
          error: 'Action requise: "approve" ou "reject"'
        };
      }
      
      const data = {
        expense_id: cleanId,
        action,
        notes: notes?.trim().substring(0, 500) || undefined
      };
      
      const response = await ApiClient.post<any>('/workflow/validate-single', data);
      
      if (response && response.success) {
        return {
          success: true,
          data: {
            processed_expense: response.processed_expense,
            action: response.action,
            validated_by: response.validated_by
          },
          message: response.message || 'Validation individuelle réussie'
        };
      }
      
      throw new Error(response?.error || 'Erreur lors de la validation individuelle');
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur de validation individuelle'
      };
    }
  }

  static async bulkValidateExpenses(
    expense_ids: string[], 
    action: 'approve' | 'reject', 
    notes?: string
  ): Promise<ApiResponse<any>> {
    try {
      if (!Array.isArray(expense_ids) || expense_ids.length === 0) {
        return {
          success: false,
          error: 'Liste des IDs de dépenses requise'
        };
      }

      if (expense_ids.length > 50) {
        return {
          success: false,
          error: 'Trop de dépenses sélectionnées (maximum 50)'
        };
      }
      
      if (!action || !['approve', 'reject'].includes(action)) {
        return {
          success: false,
          error: 'Action requise: "approve" ou "reject"'
        };
      }

      // 🔥 CORRECTION : Utiliser la nouvelle fonction de nettoyage
      const validExpenseIds = cleanExpenseIds(expense_ids);

      if (validExpenseIds.length === 0) {
        return {
          success: false,
          error: 'Aucun ID de dépense valide fourni'
        };
      }
      
      const data = {
        expense_ids: validExpenseIds,
        action,
        notes: notes?.trim().substring(0, 500) || undefined
      };
      
      try {
        const response = await ApiClient.post<any>('/workflow/bulk-validate', data);
        
        if (response && response.success) {
          return {
            success: true,
            data: {
              processed_count: response.processed_count || 0,
              requested_count: response.requested_count || 0,
              invalid_ids_count: response.invalid_ids_count || 0,
              processed_expenses: Array.isArray(response.processed_expenses) ? response.processed_expenses : [],
              action: response.action,
              validated_by: response.validated_by
            },
            message: response.message || 'Validation en masse réussie'
          };
        }
        
        throw new Error(response?.error || 'Erreur lors de la validation en masse');
        
      } catch (bulkError: any) {
        // 🔄 FALLBACK : Validation individuelle si validation en masse échoue
        if (validExpenseIds.length <= 5) {
          const results = [];
          let successCount = 0;
          let errorCount = 0;
          
          for (const expenseId of validExpenseIds) {
            try {
              const singleResult = await this.validateSingleExpense(expenseId, action, notes);
              if (singleResult.success) {
                successCount++;
                results.push(singleResult.data?.processed_expense);
              } else {
                errorCount++;
              }
            } catch (singleError) {
              errorCount++;
            }
          }
          
          if (successCount > 0) {
            return {
              success: true,
              data: {
                processed_count: successCount,
                requested_count: validExpenseIds.length,
                processed_expenses: results,
                action: action,
                fallback_used: true
              },
              message: `${successCount} dépense(s) ${action === 'approve' ? 'approuvée(s)' : 'rejetée(s)'} (validation individuelle)${errorCount > 0 ? ` - ${errorCount} échec(s)` : ''}`
            };
          }
        }
        
        throw bulkError;
      }
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur de validation'
      };
    }
  }

  // ==================== Initialization Functions ====================

  static async initializeData(force: boolean = false): Promise<ApiResponse<any>> {
    try {
      const response = await ApiClient.post<any>('/init/data', { force: !!force });
      
      if (response && response.success) {
        return {
          success: true,
          data: response.results,
          message: response.message || 'Données initialisées avec succès'
        };
      }
      
      throw new Error(response?.error || 'Erreur lors de l\'initialisation');
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur d\'initialisation'
      };
    }
  }

  static async getInitStatus(): Promise<ApiResponse<any>> {
    try {
      const response = await ApiClient.get<any>('/init/status');
      
      if (response && response.success) {
        return {
          success: true,
          data: response.status,
          is_ready: response.is_ready,
          user: response.status?.user,
          message: response.message || 'Statut récupéré'
        };
      }
      
      throw new Error(response?.error || 'Erreur lors de la vérification du statut');
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur de vérification'
      };
    }
  }

  static async testConnection(): Promise<ApiResponse<any>> {
    try {
      const response = await ApiClient.get<any>('/test/connection');
      
      return {
        success: true,
        data: response,
        message: 'Connexion API testée avec succès'
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Test de connexion échoué'
      };
    }
  }

  static async testApiWithAuth(): Promise<ApiResponse<any>> {
    try {
      const response = await ApiClient.get<any>('/test/api');
      
      if (response && response.success) {
        return {
          success: true,
          data: response.test_results,
          user_permissions: response.test_results?.user_permissions,
          message: 'Test API avec authentification réussi'
        };
      }
      
      throw new Error(response?.error || 'Test API échoué');
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Test API avec auth échoué'
      };
    }
  }

  // ==================== UTILITAIRES PRIVÉS ====================

  private static enrichExpenseData(expense: any): any {
    if (!expense || typeof expense !== 'object') {
      return {};
    }

    return {
      ...expense,
      // Informations de catégorie avec fallbacks
      category_name: sanitizeString(expense.category_name) || 'Catégorie inconnue',
      category_color: isValidColor(expense.category_color) ? expense.category_color : '#3B82F6',
      category_icon: sanitizeString(expense.category_icon) || 'FileText',
      
      // Informations de statut avec fallbacks
      status_name: sanitizeString(expense.status_name) || 'En attente',
      status_color: isValidColor(expense.status_color) ? expense.status_color : '#F59E0B',
      status_icon: sanitizeString(expense.status_icon) || 'Clock',
      status_final: Boolean(expense.status_final),
      
      // Responsable avec fallbacks sécurisés
      responsible_name: sanitizeString(expense.responsible_name) || sanitizeString(expense.responsable_nom) || 'Utilisateur inconnu',
      responsible_role: sanitizeString(expense.responsible_role) || sanitizeString(expense.responsable_role) || 'unknown',
      responsible_badge: sanitizeString(expense.responsible_badge) || sanitizeString(expense.responsable_badge) || 'Utilisateur',
      responsible_badge_color: isValidColor(expense.responsible_badge_color) ? expense.responsible_badge_color : '#6B7280',
      
      // Indicateurs sécurisés
      is_own_expense: Boolean(expense.is_own_expense),
      
      // Validation avec fallbacks
      valide_par: sanitizeString(expense.valide_par) || null,
      date_validation_formatee: sanitizeString(expense.date_validation_formatee) || null,
      
      // Formatage avec validation
      montant_formate: sanitizeString(expense.montant_formate) || formatCurrency(parseFloat(expense.amount) || 0),
      date_formatee: sanitizeString(expense.date_formatee) || formatDate(expense.expense_date),
      cree_le: sanitizeString(expense.cree_le) || formatDate(expense.created_at),

      // Priorité et timing pour workflow
      priorite: sanitizeString(expense.priorite) || 'NORMAL',
      heures_attente: Math.max(0, parseFloat(expense.heures_attente) || 0)
    };
  }

  private static validateCreateData(data: CreateExpenseDto): string | null {
    if (!data.description?.trim()) {
      return 'La description est requise';
    }
    if (data.description.trim().length > 500) {
      return 'La description ne peut pas dépasser 500 caractères';
    }
    if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
      return 'Le montant doit être un nombre positif';
    }
    if (Number(data.amount) > 1000000000) {
      return 'Le montant ne peut pas dépasser 1 milliard';
    }
    
    // 🔥 CORRECTION : Utiliser la nouvelle validation UUID
    if (!data.category_id || !validateUUID(data.category_id, 'createExpense-category')) {
      return 'La catégorie est requise et doit être valide';
    }
    
    if (!data.expense_date) {
      return 'La date de dépense est requise';
    }
    if (!isValidDate(data.expense_date)) {
      return 'La date de dépense doit être valide';
    }
    
    return null;
  }

  private static sanitizeCreateData(data: CreateExpenseDto): any {
    return {
      description: sanitizeString(data.description).substring(0, 500),
      amount: Math.max(0, Math.min(1000000000, parseFloat(data.amount.toString()))),
      category_id: data.category_id,
      expense_date: data.expense_date,
      payment_method: data.payment_method ? sanitizeString(data.payment_method).substring(0, 50) : null,
      supplier_name: data.supplier_name ? sanitizeString(data.supplier_name).substring(0, 200) : null,
      notes: data.notes ? sanitizeString(data.notes).substring(0, 1000) : null
    };
  }

  private static sanitizeUpdateData(data: UpdateExpenseDto): any {
    const cleaned: any = {};

    if (data.description !== undefined) {
      cleaned.description = sanitizeString(data.description).substring(0, 500);
    }
    if (data.amount !== undefined) {
      cleaned.amount = Math.max(0, Math.min(1000000000, parseFloat(data.amount.toString())));
    }
    
    // 🔥 CORRECTION : Validation UUID pour category_id
    if (data.category_id !== undefined) {
      const cleanCategoryId = validateUUID(data.category_id, 'updateExpense-category');
      if (cleanCategoryId) {
        cleaned.category_id = cleanCategoryId;
      }
    }
    
    if (data.expense_date !== undefined && isValidDate(data.expense_date)) {
      cleaned.expense_date = data.expense_date;
    }
    if (data.payment_method !== undefined) {
      cleaned.payment_method = data.payment_method ? sanitizeString(data.payment_method).substring(0, 50) : null;
    }
    if (data.supplier_name !== undefined) {
      cleaned.supplier_name = data.supplier_name ? sanitizeString(data.supplier_name).substring(0, 200) : null;
    }
    if (data.notes !== undefined) {
      cleaned.notes = data.notes ? sanitizeString(data.notes).substring(0, 1000) : null;
    }

    return cleaned;
  }

  private static sanitizePagination(pagination: any): any {
    if (!pagination || typeof pagination !== 'object') {
      return { page: 1, limit: 12, total: 0, pages: 0 };
    }

    return {
      page: Math.max(1, parseInt(pagination.page) || 1),
      limit: Math.max(1, Math.min(100, parseInt(pagination.limit) || 12)),
      total: Math.max(0, parseInt(pagination.total) || 0),
      pages: Math.max(0, parseInt(pagination.pages) || 0)
    };
  }

  private static sanitizeDashboardStats(stats: any): any {
    const safeNumber = (value: any): number => Math.max(0, parseFloat(value) || 0);
    const safeString = (value: any): string => sanitizeString(value) || '0 FG';

    return {
      total_depenses: safeNumber(stats.total_depenses),
      total_montant: safeNumber(stats.total_montant),
      montant_formate: safeString(stats.montant_formate),
      en_attente: safeNumber(stats.en_attente),
      payes: safeNumber(stats.payes),
      rejetes: safeNumber(stats.rejetes),
      montant_en_attente: safeNumber(stats.montant_en_attente),
      montant_en_attente_formate: safeString(stats.montant_en_attente_formate),
      montant_paye: safeNumber(stats.montant_paye),
      montant_paye_formate: safeString(stats.montant_paye_formate),
      montant_rejete: safeNumber(stats.montant_rejete),
      montant_rejete_formate: safeString(stats.montant_rejete_formate),
      ce_mois: safeNumber(stats.ce_mois),
      montant_ce_mois: safeNumber(stats.montant_ce_mois),
      montant_ce_mois_formate: safeString(stats.montant_ce_mois_formate),
      montant_ce_mois_valide: safeNumber(stats.montant_ce_mois_valide),
      montant_ce_mois_valide_formate: safeString(stats.montant_ce_mois_valide_formate),
      impact_capital: safeNumber(stats.impact_capital),
      impact_capital_formate: safeString(stats.impact_capital_formate)
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS SÉCURISÉES
// ============================================================================

const isValidColor = (color: any): boolean => {
  if (!color || typeof color !== 'string') return false;
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return colorRegex.test(color);
};

const isValidDate = (date: any): boolean => {
  if (!date) return false;
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

const sanitizeString = (str: any): string => {
  if (!str || typeof str !== 'string') return '';
  return str.trim()
    .replace(/[<>]/g, '')
    .replace(/\0/g, '')
    .substring(0, 10000);
};

export const formatCurrency = (amount: number, currency: string = 'FG'): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 ' + sanitizeString(currency);
  }
  const safeAmount = Math.max(0, Math.min(999999999999, amount));
  return new Intl.NumberFormat('fr-FR').format(safeAmount) + ` ${sanitizeString(currency)}`;
};

const formatDate = (dateInput: any): string => {
  if (!dateInput) return '';
  
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR');
  } catch {
    return '';
  }
};

export const parseCurrency = (currencyString: string): number => {
  if (!currencyString || typeof currencyString !== 'string') return 0;
  const cleanString = currencyString.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : Math.max(0, Math.min(999999999999, parsed));
};

export const getPaymentMethodLabel = (method: string): string => {
  const cleanMethod = sanitizeString(method);
  const labels: Record<string, string> = {
    'cash': 'Espèces',
    'bank_transfer': 'Virement bancaire',
    'mobile_money': 'Mobile Money',
    'check': 'Chèque',
    'card': 'Carte bancaire'
  };
  
  return labels[cleanMethod] || cleanMethod || 'Méthode inconnue';
};

export const getRoleBadge = (role: string): { label: string; color: string } => {
  const cleanRole = sanitizeString(role);
  const badges: Record<string, { label: string; color: string }> = {
    'super_admin': { label: 'Super Administrateur', color: '#9333EA' },
    'admin': { label: 'Administrateur', color: '#3B82F6' },
    'user': { label: 'Utilisateur', color: '#6B7280' }
  };
  
  return badges[cleanRole] || { label: 'Utilisateur', color: '#6B7280' };
};

export const getPriorityColor = (priority: string): string => {
  const cleanPriority = sanitizeString(priority);
  const colors: Record<string, string> = {
    'URGENT': '#EF4444',
    'IMPORTANT': '#F59E0B',
    'NORMAL': '#10B981'
  };
  
  return colors[cleanPriority] || colors['NORMAL'];
};

export const formatWaitingTime = (hours: number): string => {
  const safeHours = Math.max(0, parseFloat(hours as any) || 0);
  
  if (safeHours < 1) {
    const minutes = Math.round(safeHours * 60);
    return `${minutes} min`;
  } else if (safeHours < 24) {
    return `${Math.round(safeHours)}h`;
  } else {
    const days = Math.round(safeHours / 24);
    return `${days} jour${days > 1 ? 's' : ''}`;
  }
};

console.log('✅ [ExpenseService] Service complet corrigé avec UUID harmonisé');

// Default export
export default ExpenseService;