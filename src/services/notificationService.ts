// src/services/notificationService.ts - VERSION CORRIGÉE AVEC AUTH SIMPLIFIÉE

// ================================
// TYPES ET INTERFACES (inchangés)
// ================================

export type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'reminder' | 'alert';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationCategory = 'general' | 'expense' | 'payment' | 'salary' | 'system';

export interface Notification {
  id: string;
  title: string;
  message?: string;
  type: NotificationType;
  priority: NotificationPriority;
  category: NotificationCategory;
  is_read: boolean;
  is_active: boolean;
  user_id?: number;
  created_at: string;
  due_date?: string;
  reminder_date?: string;
  created_by?: number;
  
  // Champs formatés
  created_at_formatted?: string;
  due_date_formatted?: string;
  reminder_date_formatted?: string;
  priority_color?: string;
  type_icon?: string;
  type_color?: string;
  target_user_name?: string;
  created_by_name?: string;
  can_delete?: boolean;
  deadline_status?: 'no_deadline' | 'overdue' | 'due_soon' | 'on_time';
  hours_remaining?: number;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  priority?: NotificationPriority | 'all' | '';
  type?: NotificationType | 'all' | '';
  category?: NotificationCategory | 'all' | '';
  is_read?: 'true' | 'false' | 'all' | '';
  search?: string;
  sort_by?: 'created_at' | 'priority' | 'due_date' | 'title' | 'type' | 'is_read';
  sort_order?: 'asc' | 'desc';
  date_filter?: 'today' | 'week' | 'month' | 'overdue' | 'due_soon' | 'all' | '';
}

export interface NotificationCounts {
  total_unread: number;
  urgent_unread: number;
  high_unread: number;
  medium_unread: number;
  low_unread: number;
  error_unread: number;
  warning_unread: number;
  reminder_unread: number;
  due_soon: number;
  overdue: number;
}

export interface CreateNotificationData {
  title: string;
  message?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  category?: NotificationCategory;
  user_id?: number | null;
  due_date?: string;
  reminder_date?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  metadata?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  user_permissions?: any;
  counts?: NotificationCounts;
}

export interface NotificationListResponse extends ApiResponse<Notification[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters?: any;
  user_info?: any;
}

// ================================
// CONFIGURATION SIMPLIFIÉE
// ================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ================================
// GESTION TOKEN SIMPLIFIÉE
// ================================

const getAuthToken = (): string | null => {
  try {
    // Chercher le token dans toutes les sources possibles
    const sources = [
      localStorage.getItem('auth_token'),
      localStorage.getItem('token'),
      localStorage.getItem('accessToken'),
      sessionStorage.getItem('auth_token'),
      sessionStorage.getItem('token')
    ];

    for (const token of sources) {
      if (token && typeof token === 'string' && token.trim() && token !== 'undefined' && token !== 'null') {
        console.log('🔑 [NotificationService] Token trouvé, longueur:', token.length);
        return token.trim();
      }
    }

    console.warn('⚠️ [NotificationService] Aucun token valide trouvé');
    return null;

  } catch (error) {
    console.error('💥 [NotificationService] Erreur récupération token:', error);
    return null;
  }
};

const getRequestHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-auth-token'] = token;
  }

  return headers;
};

// ================================
// API CLIENT SIMPLIFIÉ
// ================================

class NotificationApiClient {
  private static async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      // Construire l'URL complète
      let fullEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      if (!fullEndpoint.startsWith('/api/notifications')) {
        fullEndpoint = `/api/notifications${fullEndpoint}`;
      }
      
      const url = `${API_BASE_URL}${fullEndpoint}`;
      
      // Préparer les headers
      const headers = getRequestHeaders();
      
      // Configuration de la requête
      const config: RequestInit = {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      };

      console.log(`📤 [NotificationService] ${config.method || 'GET'} ${fullEndpoint}`);
      
      // Vérifier le token avant la requête
      if (!getAuthToken()) {
        throw new Error('Session expirée - Token manquant');
      }

      // Exécuter la requête
      const response = await fetch(url, config);
      
      // Traiter la réponse
      return await this.processResponse<T>(response, fullEndpoint);
      
    } catch (error: any) {
      console.error(`💥 [NotificationService] Request error for ${endpoint}:`, error);
      throw error;
    }
  }

  private static async processResponse<T>(response: Response, endpoint: string): Promise<T> {
    console.log(`📥 [NotificationService] Response ${response.status} pour ${endpoint}`);
    
    // Gestion spécifique des erreurs 401
    if (response.status === 401) {
      const errorText = await response.text().catch(() => 'Unauthorized');
      console.error('🔐 [NotificationService] Erreur 401 - Auth requise');
      throw new Error(`Erreur 401: ${errorText || 'Unauthorized'}`);
    }

    // Autres erreurs HTTP
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorData.message || errorMessage;
        } else {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
      } catch (parseError) {
        console.warn('⚠️ [NotificationService] Erreur parsing réponse erreur:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    // Réponse 204 ou vide
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true } as T;
    }

    // Parser JSON
    try {
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
    } catch (parseError: any) {
      console.error('💥 [NotificationService] Erreur parsing JSON:', parseError);
      throw new Error('Réponse serveur invalide');
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

// ================================
// NOTIFICATION SERVICE PRINCIPAL
// ================================

export class NotificationService {
  
  // ==================== OBTENIR LES NOTIFICATIONS ====================
  
  /**
   * Obtenir la liste des notifications avec filtres
   */
  static async getNotifications(filters: Partial<NotificationFilters> = {}): Promise<NotificationListResponse> {
    try {
      // Construire les paramètres selon le backend
      const params = new URLSearchParams();
      
      // Paramètres de pagination avec validation
      params.append('page', Math.max(1, filters.page || 1).toString());
      params.append('limit', Math.max(1, Math.min(100, filters.limit || 20)).toString());
      
      // Recherche globale
      if (filters.search && filters.search.trim()) {
        params.append('search', filters.search.trim());
      }
      
      // Filtres simplifiés
      if (filters.priority && filters.priority !== 'all') {
        params.append('priority', filters.priority);
      }
      
      if (filters.type && filters.type !== 'all') {
        params.append('type', filters.type);
      }
      
      if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category);
      }
      
      if (filters.is_read && filters.is_read !== 'all') {
        params.append('is_read', filters.is_read);
      }
      
      if (filters.date_filter && filters.date_filter !== 'all') {
        params.append('date_filter', filters.date_filter);
      }
      
      // Tri sécurisé
      const allowedSortFields = ['created_at', 'priority', 'due_date', 'title', 'type', 'is_read'];
      const sortBy = allowedSortFields.includes(filters.sort_by || '') ? filters.sort_by : 'created_at';
      const sortOrder = ['asc', 'desc'].includes(filters.sort_order || '') ? filters.sort_order : 'desc';
      
      params.append('sort_by', sortBy!);
      params.append('sort_order', sortOrder!);
      
      const queryString = params.toString();
      const endpoint = queryString ? `?${queryString}` : '';
      
      console.log('📋 [NotificationService] Requesting notifications with endpoint:', endpoint);
      
      const response = await NotificationApiClient.get<any>(endpoint);
      
      if (response && response.success) {
        // Traiter les données avec enrichissement sécurisé
        const notifications = Array.isArray(response.notifications) ? response.notifications : [];
        
        const enrichedNotifications = notifications.map((notification: any) => this.enrichNotificationData(notification));
        
        console.log('✅ [NotificationService] Notifications récupérées:', enrichedNotifications.length);
        
        return {
          success: true,
          data: enrichedNotifications,
          pagination: this.sanitizePagination(response.pagination),
          filters: response.filters || {},
          user_info: response.user_info || null,
          message: `${enrichedNotifications.length} notifications récupérées`
        };
      }
      
      throw new Error(response?.error || 'Réponse invalide du serveur');
      
    } catch (error: any) {
      console.error('💥 [NotificationService] Erreur getNotifications:', error);
      return {
        success: false,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        error: error.message || 'Erreur de connexion au serveur'
      };
    }
  }

  /**
   * Obtenir le compteur de notifications
   */
  static async getCounts(): Promise<ApiResponse<NotificationCounts>> {
    try {
      console.log('📢 [NotificationService] Requesting counts...');
      
      const response = await NotificationApiClient.get<any>('/count');
      
      if (response && response.success) {
        const counts: NotificationCounts = {
          total_unread: parseInt(response.counts?.total_unread || 0),
          urgent_unread: parseInt(response.counts?.urgent_unread || 0),
          high_unread: parseInt(response.counts?.high_unread || 0),
          medium_unread: parseInt(response.counts?.medium_unread || 0),
          low_unread: parseInt(response.counts?.low_unread || 0),
          error_unread: parseInt(response.counts?.error_unread || 0),
          warning_unread: parseInt(response.counts?.warning_unread || 0),
          reminder_unread: parseInt(response.counts?.reminder_unread || 0),
          due_soon: parseInt(response.counts?.due_soon || 0),
          overdue: parseInt(response.counts?.overdue || 0)
        };
        
        console.log('✅ [NotificationService] Counts récupérés:', counts);
        
        return {
          success: true,
          data: counts,
          message: 'Compteurs récupérés'
        };
      }
      
      throw new Error(response?.error || 'Erreur compteurs');
      
    } catch (error: any) {
      console.error('💥 [NotificationService] Erreur getCounts:', error);
      return {
        success: false,
        data: {
          total_unread: 0,
          urgent_unread: 0,
          high_unread: 0,
          medium_unread: 0,
          low_unread: 0,
          error_unread: 0,
          warning_unread: 0,
          reminder_unread: 0,
          due_soon: 0,
          overdue: 0
        },
        error: error.message || 'Erreur compteurs'
      };
    }
  }

  // ==================== CRÉER UNE NOTIFICATION ====================
  
  /**
   * Créer une nouvelle notification
   */
  static async createNotification(data: CreateNotificationData): Promise<ApiResponse<Notification>> {
    try {
      const validationError = this.validateCreateData(data);
      if (validationError) {
        return {
          success: false,
          error: validationError
        };
      }
      
      const cleanData = this.sanitizeCreateData(data);
      
      console.log('➕ [NotificationService] Creating notification:', cleanData.title);
      
      const response = await NotificationApiClient.post<any>('/', cleanData);
      
      if (response && response.success && response.notification) {
        const notification = this.enrichNotificationData(response.notification);
        
        console.log('✅ [NotificationService] Notification créée:', notification.id);
        
        return {
          success: true,
          data: notification,
          message: response.message || 'Notification créée avec succès'
        };
      }
      
      throw new Error(response?.error || 'Erreur lors de la création');
      
    } catch (error: any) {
      console.error('💥 [NotificationService] Erreur createNotification:', error);
      return {
        success: false,
        error: error.message || 'Erreur de création'
      };
    }
  }

  // ==================== MARQUER COMME LUE ====================
  
  /**
   * Marquer une notification comme lue/non lue
   */
  static async markAsRead(id: string, isRead: boolean = true): Promise<ApiResponse<void>> {
    try {
      if (!this.isValidUUID(id)) {
        return {
          success: false,
          error: 'ID de notification invalide'
        };
      }
      
      console.log(`📖 [NotificationService] Marking ${isRead ? 'read' : 'unread'}:`, id);
      
      const response = await NotificationApiClient.patch<any>(`/${id}/read`, {
        is_read: isRead
      });
      
      if (response && response.success) {
        console.log('✅ [NotificationService] Notification marked:', id);
        
        return {
          success: true,
          message: response.message || `Notification ${isRead ? 'marquée comme lue' : 'marquée comme non lue'}`
        };
      }
      
      throw new Error(response?.error || 'Erreur lors du marquage');
      
    } catch (error: any) {
      console.error('💥 [NotificationService] Erreur markAsRead:', error);
      return {
        success: false,
        error: error.message || 'Erreur de marquage'
      };
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  static async markAllAsRead(): Promise<ApiResponse<void>> {
    try {
      console.log('📚 [NotificationService] Marking all as read...');
      
      const response = await NotificationApiClient.patch<any>('/mark-all-read');
      
      if (response && response.success) {
        console.log('✅ [NotificationService] All notifications marked as read');
        
        return {
          success: true,
          message: response.message || 'Toutes les notifications marquées comme lues'
        };
      }
      
      throw new Error(response?.error || 'Erreur lors du marquage');
      
    } catch (error: any) {
      console.error('💥 [NotificationService] Erreur markAllAsRead:', error);
      return {
        success: false,
        error: error.message || 'Erreur de marquage'
      };
    }
  }

  // ==================== SUPPRIMER UNE NOTIFICATION ====================
  
  /**
   * Supprimer une notification
   */
  static async deleteNotification(id: string): Promise<ApiResponse<void>> {
    try {
      if (!this.isValidUUID(id)) {
        return {
          success: false,
          error: 'ID de notification invalide'
        };
      }
      
      console.log('🗑️ [NotificationService] Deleting notification:', id);
      
      const response = await NotificationApiClient.delete<any>(`/${id}`);
      
      if (response && response.success) {
        console.log('✅ [NotificationService] Notification deleted:', id);
        
        return {
          success: true,
          message: response.message || 'Notification supprimée avec succès'
        };
      }
      
      throw new Error(response?.error || 'Erreur lors de la suppression');
      
    } catch (error: any) {
      console.error('💥 [NotificationService] Erreur deleteNotification:', error);
      return {
        success: false,
        error: error.message || 'Erreur de suppression'
      };
    }
  }

  // ==================== OBTENIR LES ALERTES ====================
  
  /**
   * Obtenir les alertes
   */
  static async getAlerts(): Promise<ApiResponse<any[]>> {
    try {
      console.log('🚨 [NotificationService] Requesting alerts...');
      
      const response = await NotificationApiClient.get<any>('/alerts');
      
      if (response && response.success) {
        console.log('✅ [NotificationService] Alerts récupérées:', response.alerts?.length || 0);
        
        return {
          success: true,
          data: response.alerts || [],
          message: 'Alertes récupérées'
        };
      }
      
      throw new Error(response?.error || 'Erreur alertes');
      
    } catch (error: any) {
      console.error('💥 [NotificationService] Erreur getAlerts:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Erreur alertes'
      };
    }
  }

  // ==================== OBTENIR LE DASHBOARD ====================
  
  /**
   * Obtenir le dashboard des notifications
   */
  static async getDashboard(): Promise<ApiResponse<any>> {
    try {
      console.log('📊 [NotificationService] Requesting dashboard...');
      
      const response = await NotificationApiClient.get<any>('/dashboard');
      
      if (response && response.success) {
        console.log('✅ [NotificationService] Dashboard récupéré');
        
        return {
          success: true,
          data: response.dashboard || null,
          message: 'Dashboard récupéré'
        };
      }
      
      throw new Error(response?.error || 'Erreur dashboard');
      
    } catch (error: any) {
      console.error('💥 [NotificationService] Erreur getDashboard:', error);
      return {
        success: false,
        error: error.message || 'Erreur dashboard'
      };
    }
  }

  // ==================== TEST DE CONNEXION ====================
  
  /**
   * Tester la connexion
   */
  static async testConnection(): Promise<ApiResponse<any>> {
    try {
      console.log('🧪 [NotificationService] Testing connection...');
      
      const response = await NotificationApiClient.get<any>('/test/api');
      
      console.log('✅ [NotificationService] Connection test passed');
      
      return {
        success: true,
        data: response,
        message: 'Connexion API testée avec succès'
      };
      
    } catch (error: any) {
      console.error('💥 [NotificationService] Erreur testConnection:', error);
      return {
        success: false,
        error: error.message || 'Test de connexion échoué'
      };
    }
  }

  // ==================== UTILITAIRES PRIVÉS ====================

  private static enrichNotificationData(notification: any): Notification {
    if (!notification || typeof notification !== 'object') {
      return {} as Notification;
    }

    return {
      ...notification,
      // Assurer que les champs requis existent
      id: this.sanitizeString(notification.id) || '',
      title: this.sanitizeString(notification.title) || 'Notification sans titre',
      message: this.sanitizeString(notification.message) || undefined,
      type: this.sanitizeEnum(notification.type, ['info', 'warning', 'error', 'success', 'reminder', 'alert'], 'info'),
      priority: this.sanitizeEnum(notification.priority, ['low', 'medium', 'high', 'urgent'], 'medium'),
      category: this.sanitizeEnum(notification.category, ['general', 'expense', 'payment', 'salary', 'system'], 'general'),
      is_read: Boolean(notification.is_read),
      is_active: Boolean(notification.is_active),
      
      // Champs formatés avec fallbacks
      created_at_formatted: this.sanitizeString(notification.created_at_formatted) || this.formatDate(notification.created_at),
      due_date_formatted: this.sanitizeString(notification.due_date_formatted) || this.formatDate(notification.due_date),
      reminder_date_formatted: this.sanitizeString(notification.reminder_date_formatted) || this.formatDate(notification.reminder_date),
      
      // Couleurs et icônes avec fallbacks
      priority_color: this.isValidColor(notification.priority_color) ? notification.priority_color : this.getPriorityColor(notification.priority),
      type_color: this.isValidColor(notification.type_color) ? notification.type_color : this.getTypeColor(notification.type),
      type_icon: this.sanitizeString(notification.type_icon) || this.getTypeIcon(notification.type),
      
      // Informations utilisateur
      target_user_name: this.sanitizeString(notification.target_user_name) || undefined,
      created_by_name: this.sanitizeString(notification.created_by_name) || undefined,
      
      // Permissions et statut
      can_delete: Boolean(notification.can_delete),
      deadline_status: this.sanitizeEnum(notification.deadline_status, ['no_deadline', 'overdue', 'due_soon', 'on_time'], 'no_deadline'),
      hours_remaining: Math.max(0, parseFloat(notification.hours_remaining) || 0)
    };
  }

  private static validateCreateData(data: CreateNotificationData): string | null {
    if (!data.title?.trim()) {
      return 'Le titre est requis';
    }
    if (data.title.trim().length > 255) {
      return 'Le titre ne peut pas dépasser 255 caractères';
    }
    if (data.message && data.message.length > 1000) {
      return 'Le message ne peut pas dépasser 1000 caractères';
    }
    
    return null;
  }

  private static sanitizeCreateData(data: CreateNotificationData): any {
    return {
      title: this.sanitizeString(data.title).substring(0, 255),
      message: data.message ? this.sanitizeString(data.message).substring(0, 1000) : undefined,
      type: this.sanitizeEnum(data.type, ['info', 'warning', 'error', 'success', 'reminder', 'alert'], 'info'),
      priority: this.sanitizeEnum(data.priority, ['low', 'medium', 'high', 'urgent'], 'medium'),
      category: this.sanitizeEnum(data.category, ['general', 'expense', 'payment', 'salary', 'system'], 'general'),
      user_id: data.user_id || null,
      due_date: data.due_date ? this.sanitizeDate(data.due_date) : undefined,
      reminder_date: data.reminder_date ? this.sanitizeDate(data.reminder_date) : undefined,
      related_entity_type: data.related_entity_type ? this.sanitizeString(data.related_entity_type).substring(0, 100) : undefined,
      related_entity_id: data.related_entity_id ? this.sanitizeString(data.related_entity_id).substring(0, 100) : undefined,
      metadata: data.metadata || {}
    };
  }

  private static sanitizePagination(pagination: any): any {
    if (!pagination || typeof pagination !== 'object') {
      return { page: 1, limit: 20, total: 0, pages: 0 };
    }

    return {
      page: Math.max(1, parseInt(pagination.page) || 1),
      limit: Math.max(1, Math.min(100, parseInt(pagination.limit) || 20)),
      total: Math.max(0, parseInt(pagination.total) || 0),
      pages: Math.max(0, parseInt(pagination.pages) || 0)
    };
  }

  private static isValidUUID(uuid: string): boolean {
    if (!uuid || typeof uuid !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid.trim());
  }

  private static sanitizeString(str: any): string {
    if (!str || typeof str !== 'string') return '';
    return str.trim()
      .replace(/[<>]/g, '')
      .replace(/\0/g, '')
      .substring(0, 10000);
  }

  private static sanitizeEnum<T extends string>(value: any, allowedValues: T[], defaultValue: T): T {
    if (typeof value === 'string' && allowedValues.includes(value as T)) {
      return value as T;
    }
    return defaultValue;
  }

  private static sanitizeDate(date: any): string | undefined {
    if (!date) return undefined;
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return undefined;
      return parsedDate.toISOString();
    } catch {
      return undefined;
    }
  }

  private static isValidColor(color: any): boolean {
    if (!color || typeof color !== 'string') return false;
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return colorRegex.test(color);
  }

  private static formatDate(dateInput: any): string {
    if (!dateInput) return '';
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  private static getPriorityColor(priority: string): string {
    const colors = {
      urgent: '#DC2626',
      high: '#EA580C',
      medium: '#D97706',
      low: '#059669',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  }

  private static getTypeColor(type: string): string {
    const colors = {
      error: '#DC2626',
      warning: '#F59E0B',
      success: '#059669',
      info: '#3B82F6',
      reminder: '#7C3AED',
      alert: '#DC2626',
    };
    return colors[type as keyof typeof colors] || colors.info;
  }

  private static getTypeIcon(type: string): string {
    const icons = {
      error: 'AlertTriangle',
      warning: 'AlertCircle',
      success: 'CheckCircle',
      info: 'Info',
      reminder: 'Clock',
      alert: 'Bell',
    };
    return icons[type as keyof typeof icons] || icons.info;
  }
}

// ================================
// INSTANCE SINGLETON ET EXPORTS
// ================================

const notificationServiceInstance = new NotificationService();

export default NotificationService;
export { NotificationService as NotificationServiceClass };

console.log('✅ [NotificationService] Service simplifié avec auth corrigée chargé');