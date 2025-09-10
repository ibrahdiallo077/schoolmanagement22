// src/services/financeService.ts - Service Finance V3.0 Final - Compatible Backend
import type {
  DashboardData,
  CurrentCapital,
  LiveTransaction,
  TransactionStatistics,
  TransactionFilters,
  TransactionInjectionData,
  InjectionResponse,
  FinancialReport,
  ReportPeriod,
  SystemHealth,
  TransactionType
} from '../types/finance.types';

class FinanceService {
  private baseURL: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 30 * 1000; // 30 secondes pour éviter rate limiting
  private isServerAvailable = true;
  private retryCount = 0;
  private maxRetries = 3;

  constructor() {
    this.baseURL = this.detectServerURL();
    this.checkServerAvailability();
  }

   private detectServerURL(): string {
  // Utiliser la variable d'environnement avec fallback
     return import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }
  private async checkServerAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/unified-finance/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      this.isServerAvailable = response.ok;
      this.retryCount = 0;
      
      console.log(`🔗 Serveur ${this.isServerAvailable ? 'disponible' : 'indisponible'} sur ${this.baseURL}`);
      return this.isServerAvailable;
    } catch (error) {
      this.isServerAvailable = false;
      console.warn(`⚠️ Serveur non disponible sur ${this.baseURL}:`, error);
      return false;
    }
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Auth-Token': token || ''
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.isServerAvailable && this.retryCount < this.maxRetries) {
      console.log(`🔄 Tentative de reconnexion ${this.retryCount + 1}/${this.maxRetries}...`);
      await this.checkServerAvailability();
      this.retryCount++;
    }

    if (!this.isServerAvailable) {
      throw new FinanceAPIError('Serveur non disponible - Veuillez vérifier que le serveur backend est démarré', 'SERVER_UNAVAILABLE');
    }

    const url = `${this.baseURL}/api/unified-finance${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      signal: AbortSignal.timeout(30000),
    };

    try {
      console.log(`📤 Finance API Request: ${endpoint}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn(`⚠️ Rate limit atteint pour ${endpoint}, retry dans 2 secondes...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const retryResponse = await fetch(url, config);
          if (!retryResponse.ok) {
            throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
          }
          const retryData = await retryResponse.json();
          if (!retryData.success) {
            throw new Error(retryData.error || 'Erreur serveur');
          }
          return retryData;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log(`✅ Finance API Response [${endpoint}]:`, data.success ? 'Success' : 'Error');
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur serveur');
      }
      
      this.isServerAvailable = true;
      this.retryCount = 0;
      
      return data;
    } catch (error: any) {
      console.error(`💥 Finance API Error [${endpoint}]:`, error.message);
      
      if (error.name === 'TypeError' && error.message.includes('fetch') ||
          error.message.includes('ERR_CONNECTION_REFUSED') ||
          error.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
        this.isServerAvailable = false;
      }
      
      throw this.handleError(error, endpoint);
    }
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`📦 Cache hit: ${key}`);
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    console.log(`💾 Cache set: ${key}`);
  }

  // ✅ DASHBOARD - COMPATIBLE ROUTE: GET /dashboard
  async getDashboard(useCache = true): Promise<DashboardData> {
    const cacheKey = 'dashboard';
    
    if (useCache) {
      const cached = this.getCachedData<DashboardData>(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await this.request<any>('/dashboard');
      
      const dashboardData: DashboardData = {
        financial_health: response.dashboard?.financial_health || {
          score: 0,
          level: 'critical' as const,
          current_balance: 0,
          formatted_balance: '0 FG',
          monthly_flow: 0,
          formatted_monthly_flow: '0 FG',
          trend: { percentage: 0, direction: 'stable' as const, raw_change: 0 },
          status_message: '🚨 Situation critique'
        },
        unified_flows: response.dashboard?.unified_flows || {
          income: { 
            total: 0, 
            monthly: 0, 
            formatted_total: '0 FG', 
            formatted_monthly: '0 FG',
            trend: { percentage: 0, direction: 'stable' as const, raw_change: 0 },
            transaction_count: 0,
            avg_amount: 0,
            max_amount: 0,
            min_amount: 0
          },
          expenses: { 
            total: 0, 
            monthly: 0, 
            formatted_total: '0 FG', 
            formatted_monthly: '0 FG',
            trend: { percentage: 0, direction: 'stable' as const, raw_change: 0 },
            transaction_count: 0,
            avg_amount: 0,
            max_amount: 0,
            min_amount: 0
          },
          net_balance: { 
            amount: 0, 
            formatted: '0 FG', 
            trend: { percentage: 0, direction: 'stable' as const, raw_change: 0 },
            is_positive: false,
            total_net: 0,
            formatted_total_net: '0 FG'
          }
        },
        evolution: response.dashboard?.evolution || [],
        source_breakdown: response.dashboard?.source_breakdown || [],
        payment_analysis: response.dashboard?.payment_analysis || [],
        alerts: response.dashboard?.alerts || [],
        statistics: response.dashboard?.statistics || {
          total_transactions: 0,
          unique_sources: 0,
          unique_entities: 0,
          income_transactions: 0,
          expense_transactions: 0,
          avg_transaction_size: 0,
          largest_income: 0,
          largest_expense: 0,
          income_expense_ratio: 0
        },
        metadata: response.dashboard?.metadata || {
          generated_at: new Date().toISOString(),
          period: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            name: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
          },
          data_source: 'api',
          last_transaction_date: null
        }
      };
      
      this.setCachedData(cacheKey, dashboardData);
      return dashboardData;
      
    } catch (error) {
      console.error('💥 Erreur getDashboard:', error);
      throw new FinanceAPIError('Impossible de récupérer le dashboard', 'DASHBOARD_ERROR');
    }
  }

  // ✅ CAPITAL ACTUEL - COMPATIBLE ROUTE: GET /capital/current
  async getCurrentCapital(useCache = true): Promise<CurrentCapital> {
    const cacheKey = 'current_capital';
    
    if (useCache) {
      const cached = this.getCachedData<CurrentCapital>(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await this.request<any>('/capital/current');
      
      const capital: CurrentCapital = {
        current_balance: response.capital?.current_balance || 0,
        formatted_balance: response.capital?.formatted_balance || this.formatGNF(response.capital?.current_balance || 0),
        total_income: response.capital?.total_income || 0,
        total_expenses: response.capital?.total_expenses || 0,
        formatted_income: response.capital?.formatted_income || this.formatGNF(response.capital?.total_income || 0),
        formatted_expenses: response.capital?.formatted_expenses || this.formatGNF(response.capital?.total_expenses || 0),
        health_level: response.capital?.health_level || 'critical',
        last_updated: response.capital?.last_updated || new Date().toISOString()
      };
      
      this.setCachedData(cacheKey, capital);
      return capital;
      
    } catch (error) {
      console.error('💥 Erreur getCurrentCapital:', error);
      throw new FinanceAPIError('Impossible de récupérer le capital', 'CAPITAL_ERROR');
    }
  }

  // ✅ TRANSACTIONS EN TEMPS RÉEL - COMPATIBLE ROUTE: GET /transactions/live
  async getLiveTransactions(filters: TransactionFilters = {}): Promise<{ transactions: LiveTransaction[]; statistics: TransactionStatistics }> {
    const params = new URLSearchParams();
    
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.type) params.append('type', filters.type);
    if (filters.category) params.append('category', filters.category);
    if (filters.entity_name) params.append('entity_name', filters.entity_name);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.status) params.append('status', filters.status);
    
    const queryString = params.toString();
    const endpoint = `/transactions/live${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await this.request<any>(endpoint);
      
      const transactions: LiveTransaction[] = (response.live_transactions?.transactions || []).map((tx: any) => ({
        transaction_id: tx.transaction_id || tx.id?.toString() || '',
        type: tx.type || 'EXPENSE' as TransactionType,
        amount: parseFloat(tx.amount) || 0,
        formatted_amount: tx.formatted_amount || this.formatGNF(tx.amount || 0),
        date: tx.date || tx.transaction_date || '',
        formatted_date: tx.formatted_date || this.formatDate(tx.date || tx.transaction_date || ''),
        category: tx.category || 'Non catégorisé',
        entity_name: tx.entity_name || 'Entité inconnue',
        method: tx.method || tx.payment_method || 'Non spécifié',
        reference: tx.reference || '',
        recorded_at: tx.recorded_at || tx.created_at || new Date().toISOString(),
        status: tx.status || 'completed',
        color: tx.color || (tx.type === 'INCOME' ? '#10B981' : '#EF4444'),
        icon: tx.icon || (tx.type === 'INCOME' ? '💰' : '💸'),
        
        id: tx.id,
        description: tx.description,
        transaction_date: tx.transaction_date,
        payment_method: tx.payment_method,
        notes: tx.notes,
        impact_capital: tx.impact_capital,
        created_at: tx.created_at,
        formatted_created_at: tx.formatted_created_at,
        created_by_username: tx.created_by_username,
        created_by_name: tx.created_by_name,
        impact_on_capital: tx.type === 'INCOME' ? 'positive' : 'negative',
        metadata_parsed: tx.metadata_parsed
      }));

      const statistics: TransactionStatistics = {
        total_transactions: response.live_transactions?.count || transactions.length,
        total_income: transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0),
        total_expenses: transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0),
        formatted_income: this.formatGNF(transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0)),
        formatted_expenses: this.formatGNF(transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0)),
        net_impact: transactions.reduce((sum, t) => sum + (t.type === 'INCOME' ? t.amount : -t.amount), 0),
        formatted_net_impact: this.formatGNF(transactions.reduce((sum, t) => sum + (t.type === 'INCOME' ? t.amount : -t.amount), 0))
      };
      
      return { transactions, statistics };
      
    } catch (error) {
      console.error('💥 Erreur getLiveTransactions:', error);
      throw new FinanceAPIError('Impossible de récupérer les transactions', 'TRANSACTIONS_ERROR');
    }
  }

  // ✅ TRANSACTIONS MANUELLES - COMPATIBLE ROUTE: GET /manual-transactions
  async getManualTransactions(limit = 20, type: 'INCOME' | 'EXPENSE' | 'all' = 'all'): Promise<LiveTransaction[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (type !== 'all') params.append('type', type);
    
    const endpoint = `/manual-transactions?${params.toString()}`;

    try {
      const response = await this.request<any>(endpoint);
      
      return (response.manual_transactions || []).map((tx: any) => ({
        transaction_id: tx.id?.toString() || '',
        type: tx.type || 'EXPENSE' as TransactionType,
        amount: parseFloat(tx.amount) || 0,
        formatted_amount: tx.formatted_amount || this.formatGNF(tx.amount || 0),
        date: tx.transaction_date || '',
        formatted_date: tx.formatted_date || this.formatDate(tx.transaction_date || ''),
        category: tx.category || 'Transaction manuelle',
        entity_name: tx.entity_name || 'Manuel',
        method: tx.payment_method || 'manual_injection',
        reference: tx.reference || '',
        recorded_at: tx.created_at || new Date().toISOString(),
        status: tx.status || 'completed',
        color: tx.color || (tx.type === 'INCOME' ? '#10B981' : '#EF4444'),
        icon: tx.icon || (tx.type === 'INCOME' ? '💰' : '💸'),
        
        id: tx.id,
        description: tx.description,
        transaction_date: tx.transaction_date,
        payment_method: tx.payment_method,
        notes: tx.notes,
        impact_capital: tx.impact_capital,
        created_at: tx.created_at,
        formatted_created_at: tx.formatted_created_at,
        created_by_username: tx.created_by_username,
        created_by_name: tx.created_by_name,
        impact_on_capital: tx.type === 'INCOME' ? 'positive' : 'negative',
        metadata_parsed: tx.metadata_parsed
      }));
    } catch (error) {
      console.warn('⚠️ Transactions manuelles non disponibles:', error);
      return [];
    }
  }

  // ✅ INJECTION DE TRANSACTION - COMPATIBLE ROUTE: POST /inject-transaction
  async injectTransaction(data: TransactionInjectionData): Promise<InjectionResponse> {
    try {
      // Conversion du format pour le backend
      const backendData = {
        type: data.type,
        amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
        category: data.category || 'Divers',
        description: data.description,
        entity_name: data.entity_name || 'Manuel',
        transaction_date: data.transaction_date || new Date().toISOString().split('T')[0],
        payment_method: data.payment_method || 'manual_injection',
        notes: data.notes || '',
        reference: data.reference,
        impact_capital: data.impact_capital !== false // Par défaut true
      };

      console.log('🚀 Injection de transaction:', backendData);

      const response = await this.request<any>('/inject-transaction', {
        method: 'POST',
        body: JSON.stringify(backendData),
      });
      
      this.invalidateCache();
      console.log('✅ Transaction injectée avec succès:', response);
      
      return response as InjectionResponse;
    } catch (error) {
      console.error('💥 Erreur injectTransaction:', error);
      throw new FinanceAPIError('Impossible d\'injecter la transaction', 'INJECTION_ERROR');
    }
  }

  // ✅ RACCOURCIS POUR INJECTION RAPIDE
  async addMoney(amount: number, description: string, category?: string, entityName?: string): Promise<InjectionResponse> {
    return this.injectTransaction({
      type: 'INCOME',
      amount,
      description,
      category: category || 'Revenus divers',
      entity_name: entityName || 'Manuel',
      impact_capital: true
    });
  }

  async removeMoney(amount: number, description: string, category?: string, entityName?: string): Promise<InjectionResponse> {
    return this.injectTransaction({
      type: 'EXPENSE',
      amount,
      description,
      category: category || 'Dépenses diverses',
      entity_name: entityName || 'Manuel',
      impact_capital: true
    });
  }

  // ✅ INITIALISER LE CAPITAL - COMPATIBLE ROUTE: POST /initialize-capital
  async initializeCapital(amount: number, description?: string): Promise<any> {
    try {
      const response = await this.request<any>('/initialize-capital', {
        method: 'POST',
        body: JSON.stringify({
          amount,
          description: description || 'Capital initial de l\'école'
        }),
      });
      
      this.invalidateCache();
      return response;
    } catch (error) {
      console.error('💥 Erreur initializeCapital:', error);
      throw new FinanceAPIError('Impossible d\'initialiser le capital', 'INITIAL_CAPITAL_ERROR');
    }
  }

  // ✅ MODIFIER UNE TRANSACTION - COMPATIBLE ROUTE: PUT /manual-transaction/:id
  async updateManualTransaction(id: string, data: Partial<TransactionInjectionData>): Promise<any> {
    try {
      const response = await this.request<any>(`/manual-transaction/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      
      this.invalidateCache();
      return response;
    } catch (error) {
      console.error('💥 Erreur updateManualTransaction:', error);
      throw new FinanceAPIError('Impossible de modifier la transaction', 'UPDATE_ERROR');
    }
  }

  // ✅ DÉTAILS D'UNE TRANSACTION - COMPATIBLE ROUTE: GET /manual-transaction/:id
  async getTransactionDetails(id: string): Promise<LiveTransaction> {
    try {
      const response = await this.request<any>(`/manual-transaction/${id}`);
      
      const tx = response.transaction;
      return {
        transaction_id: tx.id?.toString() || '',
        type: tx.type || 'EXPENSE' as TransactionType,
        amount: parseFloat(tx.amount) || 0,
        formatted_amount: tx.formatted_amount || this.formatGNF(tx.amount || 0),
        date: tx.transaction_date || '',
        formatted_date: tx.formatted_date || this.formatDate(tx.transaction_date || ''),
        category: tx.category || 'Transaction manuelle',
        entity_name: tx.entity_name || 'Manuel',
        method: tx.payment_method || 'manual_injection',
        reference: tx.reference || '',
        recorded_at: tx.created_at || new Date().toISOString(),
        status: tx.status || 'completed',
        color: tx.color || (tx.type === 'INCOME' ? '#10B981' : '#EF4444'),
        icon: tx.icon || (tx.type === 'INCOME' ? '💰' : '💸'),
        
        id: tx.id,
        description: tx.description,
        transaction_date: tx.transaction_date,
        payment_method: tx.payment_method,
        notes: tx.notes,
        impact_capital: tx.impact_capital,
        created_at: tx.created_at,
        formatted_created_at: tx.formatted_created_at,
        created_by_username: tx.created_by_username,
        created_by_name: tx.created_by_name,
        impact_on_capital: tx.type === 'INCOME' ? 'positive' : 'negative',
        metadata_parsed: tx.metadata_parsed
      };
    } catch (error) {
      console.error('💥 Erreur getTransactionDetails:', error);
      throw new FinanceAPIError('Impossible de récupérer les détails', 'DETAILS_ERROR');
    }
  }

  // ✅ SUPPRIMER UNE TRANSACTION - COMPATIBLE ROUTE: DELETE /manual-transaction/:id
  async deleteManualTransaction(id: string): Promise<any> {
    try {
      const response = await this.request<any>(`/manual-transaction/${id}`, {
        method: 'DELETE',
      });
      
      this.invalidateCache();
      return response;
    } catch (error) {
      console.error('💥 Erreur deleteManualTransaction:', error);
      throw new FinanceAPIError('Impossible de supprimer la transaction', 'DELETE_ERROR');
    }
  }

  // ✅ RAPPORT FINANCIER - COMPATIBLE ROUTE: GET /report
  async getReport(period: ReportPeriod = 'current_month', year?: number, month?: number): Promise<FinancialReport> {
    const params = new URLSearchParams();
    params.append('period', period);
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    
    const endpoint = `/report?${params.toString()}`;

    try {
      const response = await this.request<any>(endpoint);
      
      const report: FinancialReport = {
        period,
        total_income: response.report?.total_income || 0,
        total_expenses: response.report?.total_expenses || 0,
        net_balance: response.report?.net_balance || 0,
        formatted_income: response.report?.formatted_income || this.formatGNF(response.report?.total_income || 0),
        formatted_expenses: response.report?.formatted_expenses || this.formatGNF(response.report?.total_expenses || 0),
        formatted_net_balance: response.report?.formatted_net_balance || this.formatGNF(response.report?.net_balance || 0),
        total_transactions: response.report?.total_transactions || 0,
        income_transactions: response.report?.income_transactions || 0,
        expense_transactions: response.report?.expense_transactions || 0,
        generated_at: response.report?.generated_at || new Date().toISOString()
      };
      
      return report;
    } catch (error) {
      console.error('💥 Erreur getReport:', error);
      throw new FinanceAPIError('Impossible de générer le rapport', 'REPORT_ERROR');
    }
  }

  // ✅ SANTÉ DU SYSTÈME - COMPATIBLE ROUTE: GET /health
  async checkHealth(): Promise<SystemHealth> {
    try {
      const response = await this.request<any>('/health');
      
      return {
        success: response.success || true,
        message: response.message || 'Service opérationnel',
        version: response.version || '3.0.0',
        features: response.features || [],
        timestamp: response.timestamp || new Date().toISOString()
      };
    } catch (error) {
      console.error('💥 Erreur checkHealth:', error);
      throw new FinanceAPIError('Service indisponible', 'HEALTH_ERROR');
    }
  }

  // ✅ DIAGNOSTIC (compatible avec useFinance)
  async diagnose(): Promise<any> {
    try {
      const response = await this.request<any>('/debug');
      return response;
    } catch (error) {
      console.error('💥 Erreur diagnose:', error);
      return {
        server_status: this.serverStatus,
        cache_size: this.cache.size,
        error: error instanceof FinanceAPIError ? error.message : 'Diagnostic indisponible'
      };
    }
  }

  // ✅ UTILITAIRES
  invalidateCache(): void {
    this.cache.clear();
    console.log('🧹 Cache finance invalidé');
  }

  formatGNF(amount: number): string {
    if (isNaN(amount)) return '0 FG';
    return `${amount.toLocaleString('fr-FR')} FG`;
  }

  formatDate(date: string | Date): string {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('fr-FR');
    } catch {
      return 'Date invalide';
    }
  }

  // ✅ GESTION D'ERREUR
  handleError(error: any, context: string): FinanceAPIError {
    console.error(`Finance Error [${context}]:`, error);
    
    if (error instanceof FinanceAPIError) {
      return error;
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new FinanceAPIError('Serveur backend non accessible', 'NETWORK_ERROR');
    }
    
    if (error.message?.includes('429')) {
      return new FinanceAPIError('Trop de requêtes - Veuillez patienter', 'RATE_LIMITED');
    }
    
    return new FinanceAPIError(error.message || 'Erreur de connexion au serveur', 'UNKNOWN_ERROR');
  }

  // ✅ GETTERS
  get serverStatus() {
    return {
      isAvailable: this.isServerAvailable,
      baseURL: this.baseURL,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries
    };
  }

  async forceReconnect(): Promise<boolean> {
    console.log('🔄 Tentative de reconnexion forcée...');
    this.retryCount = 0;
    return await this.checkServerAvailability();
  }
}

// ✅ CLASSE D'ERREUR
export class FinanceAPIError extends Error {
  constructor(
    message: string, 
    public code: string = 'FINANCE_ERROR',
    public statusCode?: number
  ) {
    super(message);
    this.name = 'FinanceAPIError';
  }

  static formatMessage(error: any): string {
    if (error instanceof FinanceAPIError) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return 'Une erreur est survenue';
  }

  static isConnectionError(error: any): boolean {
    return error instanceof FinanceAPIError && 
           (error.code === 'NETWORK_ERROR' || 
            error.code === 'CONNECTION_REFUSED' || 
            error.code === 'SERVER_UNAVAILABLE');
  }
}

// ✅ INSTANCE SINGLETON
export const financeService = new FinanceService();

// Export par défaut
export default financeService;