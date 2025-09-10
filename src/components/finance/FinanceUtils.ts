// src/components/finance/FinanceUtils.ts - Corrigé et Amélioré
export interface FinanceMetrics {
  total_income: number;
  total_expenses: number;
  current_balance: number;
  monthly_flow: number;
  health_score: number;
}

export interface TrendData {
  direction: 'up' | 'down' | 'stable';
  percentage: string;
  raw_change?: number;
}

export interface AlertData {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; // Compatible avec backend
  title: string;
  message: string;
  recommendation: string;
  color: string;
}

/**
 * Formate un montant en francs guinéens
 */
export const formatGNF = (amount: number): string => {
  if (isNaN(amount)) return '0 FG';
  return `${amount.toLocaleString('fr-FR')} FG`;
};

/**
 * Formate un montant en format court (K, M, B)
 */
export const formatGNFShort = (amount: number): string => {
  if (isNaN(amount)) return '0 FG';
  
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B FG`;
  } else if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M FG`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K FG`;
  } else {
    return `${amount.toLocaleString('fr-FR')} FG`;
  }
};

/**
 * Calcule la tendance entre deux valeurs
 */
export const calculateTrend = (current: number, previous: number): TrendData => {
  if (!previous || previous === 0) {
    return { percentage: '0', direction: 'stable' };
  }
  
  const change = ((current - previous) / previous) * 100;
  
  return {
    percentage: Math.abs(change).toFixed(1),
    direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
    raw_change: change
  };
};

/**
 * Calcule le score de santé financière
 */
export const calculateHealthScore = (metrics: FinanceMetrics): {
  score: number;
  level: 'excellent' | 'good' | 'warning' | 'critical';
  color: string;
} => {
  let score = 0;
  
  // Analyse du capital (40% du score)
  if (metrics.current_balance >= 5000000) score += 40;
  else if (metrics.current_balance >= 2000000) score += 32;
  else if (metrics.current_balance >= 1000000) score += 24;
  else if (metrics.current_balance >= 0) score += 16;
  else score += 0; // Capital négatif
  
  // Analyse du flux mensuel (30% du score)
  if (metrics.monthly_flow > 1000000) score += 30;
  else if (metrics.monthly_flow > 500000) score += 24;
  else if (metrics.monthly_flow > 0) score += 18;
  else if (metrics.monthly_flow > -500000) score += 10;
  else score += 0; // Flux très négatif
  
  // Ratio revenus/dépenses (20% du score)
  const ratio = metrics.total_expenses > 0 ? metrics.total_income / metrics.total_expenses : 0;
  if (ratio >= 1.5) score += 20;
  else if (ratio >= 1.2) score += 16;
  else if (ratio >= 1.0) score += 12;
  else if (ratio >= 0.8) score += 8;
  else score += 0;
  
  // Stabilité (10% du score)
  if (metrics.current_balance > 0 && metrics.monthly_flow > 0) score += 10;
  else if (metrics.current_balance > 0 || metrics.monthly_flow > 0) score += 5;
  
  score = Math.min(100, Math.max(0, score));
  
  let level: 'excellent' | 'good' | 'warning' | 'critical';
  let color: string;
  
  if (score >= 85) {
    level = 'excellent';
    color = '#10B981';
  } else if (score >= 70) {
    level = 'good';
    color = '#3B82F6';
  } else if (score >= 50) {
    level = 'warning';
    color = '#F59E0B';
  } else {
    level = 'critical';
    color = '#EF4444';
  }
  
  return { score, level, color };
};

/**
 * Génère des alertes intelligentes basées sur les métriques
 */
export const generateFinancialAlerts = (metrics: FinanceMetrics): AlertData[] => {
  const alerts: AlertData[] = [];
  
  // Alerte capital négatif
  if (metrics.current_balance < 0) {
    alerts.push({
      type: 'CAPITAL_NEGATIVE',
      severity: 'CRITICAL',
      title: 'Capital négatif',
      message: `Le capital est négatif de ${formatGNF(Math.abs(metrics.current_balance))}`,
      recommendation: 'Action urgente requise pour redresser la situation',
      color: '#EF4444'
    });
  }
  
  // Alerte capital faible
  else if (metrics.current_balance < 500000) {
    alerts.push({
      type: 'CAPITAL_LOW',
      severity: 'MEDIUM',
      title: 'Capital faible',
      message: `Capital actuel: ${formatGNF(metrics.current_balance)}`,
      recommendation: 'Surveiller de près et limiter les dépenses',
      color: '#F59E0B'
    });
  }
  
  // Alerte flux mensuel critique
  if (metrics.monthly_flow < -1000000) {
    alerts.push({
      type: 'MONTHLY_FLOW_CRITICAL',
      severity: 'HIGH',
      title: 'Flux mensuel critique',
      message: `Déficit mensuel de ${formatGNF(Math.abs(metrics.monthly_flow))}`,
      recommendation: 'Réviser immédiatement la stratégie financière',
      color: '#EF4444'
    });
  }
  
  // Alerte dépenses élevées
  if (metrics.total_expenses > metrics.total_income * 1.2) {
    alerts.push({
      type: 'EXPENSES_HIGH',
      severity: 'MEDIUM',
      title: 'Dépenses élevées',
      message: 'Les dépenses dépassent significativement les revenus',
      recommendation: 'Analyser et optimiser les postes de dépenses',
      color: '#F59E0B'
    });
  }
  
  return alerts;
};

/**
 * Calcule des statistiques avancées
 */
export const calculateAdvancedStats = (transactions: any[]): {
  averageTransactionSize: number;
  largestTransaction: number;
  transactionFrequency: number;
  volatility: number;
} => {
  if (!transactions || transactions.length === 0) {
    return {
      averageTransactionSize: 0,
      largestTransaction: 0,
      transactionFrequency: 0,
      volatility: 0
    };
  }
  
  const amounts = transactions.map(t => parseFloat(t.amount || 0));
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  
  const averageTransactionSize = total / amounts.length;
  const largestTransaction = Math.max(...amounts);
  const transactionFrequency = transactions.length;
  
  // Calcul de la volatilité (écart-type)
  const variance = amounts.reduce((acc, amount) => {
    return acc + Math.pow(amount - averageTransactionSize, 2);
  }, 0) / amounts.length;
  const volatility = Math.sqrt(variance);
  
  return {
    averageTransactionSize,
    largestTransaction,
    transactionFrequency,
    volatility
  };
};

/**
 * Formate une date en français
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formate une date courte
 */
export const formatDateShort = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Calcule le pourcentage de croissance
 */
export const calculateGrowthRate = (current: number, previous: number): number => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Détermine si une transaction est récente (moins de 7 jours)
 */
export const isRecentTransaction = (date: string | Date): boolean => {
  const transactionDate = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - transactionDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
};

/**
 * Catégorise les transactions par type
 */
export const categorizeTransactions = (transactions: any[]): {
  income: any[];
  expenses: any[];
  recentTransactions: any[];
} => {
  if (!transactions) {
    return { income: [], expenses: [], recentTransactions: [] };
  }
  
  return {
    income: transactions.filter(t => t.type === 'INCOME'),
    expenses: transactions.filter(t => t.type === 'EXPENSE'),
    recentTransactions: transactions.filter(t => isRecentTransaction(t.date || t.created_at))
  };
};

/**
 * Couleurs par type de transaction
 */
export const getTransactionColor = (type: string): string => {
  switch (type) {
    case 'INCOME':
      return '#10B981'; // Vert
    case 'EXPENSE':
      return '#EF4444'; // Rouge
    default:
      return '#6B7280'; // Gris
  }
};

/**
 * Icônes par type de transaction
 */
export const getTransactionIcon = (type: string): string => {
  switch (type) {
    case 'INCOME':
      return '💰';
    case 'EXPENSE':
      return '💸';
    default:
      return '💼';
  }
};

/**
 * Valide les données d'injection de transaction
 */
export const validateTransactionData = (data: any): string[] => {
  const errors: string[] = [];
  
  if (!data.type || !['INCOME', 'EXPENSE'].includes(data.type)) {
    errors.push('Type de transaction requis (INCOME ou EXPENSE)');
  }
  
  if (!data.amount || isNaN(data.amount) || parseFloat(data.amount) <= 0) {
    errors.push('Montant requis et positif');
  }
  
  if (!data.description || data.description.trim().length < 5) {
    errors.push('Description requise (minimum 5 caractères)');
  }
  
  if (parseFloat(data.amount) > 100000000) {
    errors.push('Montant trop élevé (maximum 100 000 000 FG)');
  }
  
  if (data.entity_name && data.entity_name.trim().length < 2) {
    errors.push('Nom de l\'entité doit contenir au moins 2 caractères');
  }
  
  return errors;
};

/**
 * Génère un rapport financier résumé
 */
export const generateFinancialSummary = (metrics: FinanceMetrics): string => {
  const healthData = calculateHealthScore(metrics);
  const ratio = metrics.total_expenses > 0 ? (metrics.total_income / metrics.total_expenses).toFixed(2) : '0';
  
  return `Santé financière: ${healthData.level.toUpperCase()} (${healthData.score}%)
Capital actuel: ${formatGNF(metrics.current_balance)}
Flux mensuel: ${formatGNF(metrics.monthly_flow)}
Ratio revenus/dépenses: ${ratio}
Total revenus: ${formatGNF(metrics.total_income)}
Total dépenses: ${formatGNF(metrics.total_expenses)}`;
};

/**
 * Export utilitaire pour les rapports
 */
export const exportFinanceData = (data: any, format: 'json' | 'csv'): void => {
  const timestamp = new Date().toISOString().split('T')[0];
  
  if (format === 'json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-export-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else if (format === 'csv') {
    // Conversion basique JSON vers CSV
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map((row: any) => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-export-${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

/**
 * Convertit un montant en mots (français)
 */
export const numberToWords = (amount: number): string => {
  if (amount === 0) return 'zéro';
  
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  
  // Implementation simplifiée pour les grands nombres
  if (amount >= 1000000000) {
    return `${Math.floor(amount / 1000000000)} milliard${Math.floor(amount / 1000000000) > 1 ? 's' : ''}`;
  } else if (amount >= 1000000) {
    return `${Math.floor(amount / 1000000)} million${Math.floor(amount / 1000000) > 1 ? 's' : ''}`;
  } else if (amount >= 1000) {
    return `${Math.floor(amount / 1000)} mille`;
  }
  
  return amount.toString();
};

/**
 * Calcule la projection financière simple
 */
export const calculateSimpleProjection = (
  currentBalance: number,
  monthlyIncome: number,
  monthlyExpenses: number,
  months: number = 12
): Array<{ month: number; balance: number; cumulative: number }> => {
  const projection = [];
  let runningBalance = currentBalance;
  
  for (let i = 1; i <= months; i++) {
    const monthlyFlow = monthlyIncome - monthlyExpenses;
    runningBalance += monthlyFlow;
    
    projection.push({
      month: i,
      balance: monthlyFlow,
      cumulative: runningBalance
    });
  }
  
  return projection;
};

/**
 * Utilitaires de couleurs pour les graphiques
 */
export const getChartColors = (): {
  income: string;
  expense: string;
  positive: string;
  negative: string;
  neutral: string;
  gradient: {
    income: string[];
    expense: string[];
    balance: string[];
  };
} => ({
  income: '#10B981',
  expense: '#EF4444',
  positive: '#10B981',
  negative: '#EF4444',
  neutral: '#6B7280',
  gradient: {
    income: ['#10B981', '#059669'],
    expense: ['#EF4444', '#DC2626'],
    balance: ['#3B82F6', '#1D4ED8']
  }
});

/**
 * Formate un pourcentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Calcule la moyenne mobile
 */
export const calculateMovingAverage = (data: number[], window: number = 3): number[] => {
  if (data.length < window) return data;
  
  const result = [];
  for (let i = window - 1; i < data.length; i++) {
    const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / window);
  }
  
  return result;
};

/**
 * Détermine la classe CSS pour un montant (positif/négatif)
 */
export const getAmountColorClass = (amount: number): string => {
  if (amount > 0) return 'text-green-600';
  if (amount < 0) return 'text-red-600';
  return 'text-gray-600';
};

/**
 * Formate une durée en français
 */
export const formatDuration = (days: number): string => {
  if (days < 7) return `${days} jour${days > 1 ? 's' : ''}`;
  if (days < 30) return `${Math.floor(days / 7)} semaine${Math.floor(days / 7) > 1 ? 's' : ''}`;
  if (days < 365) return `${Math.floor(days / 30)} mois`;
  return `${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? 's' : ''}`;
};

/**
 * Génère une référence unique pour les transactions
 */
export const generateTransactionReference = (type: 'INCOME' | 'EXPENSE'): string => {
  const prefix = type === 'INCOME' ? 'REV' : 'DEP';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Valide un numéro de téléphone guinéen
 */
export const validateGuineanPhone = (phone: string): boolean => {
  // Format: +224 6XX XX XX XX ou 6XX XX XX XX
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');
  return /^(224)?6[0-9]{8}$/.test(cleanPhone);
};

/**
 * Formate un numéro de téléphone guinéen
 */
export const formatGuineanPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');
  if (cleanPhone.startsWith('224')) {
    const number = cleanPhone.substring(3);
    return `+224 ${number.substring(0, 3)} ${number.substring(3, 5)} ${number.substring(5, 7)} ${number.substring(7)}`;
  } else if (cleanPhone.length === 9) {
    return `${cleanPhone.substring(0, 3)} ${cleanPhone.substring(3, 5)} ${cleanPhone.substring(5, 7)} ${cleanPhone.substring(7)}`;
  }
  return phone;
};

/**
 * Calcule l'âge en années
 */
export const calculateAge = (birthDate: string | Date): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Utilities pour les notifications de transaction
 */
export const getTransactionNotificationMessage = (
  type: 'INCOME' | 'EXPENSE',
  amount: number,
  description: string
): string => {
  const formattedAmount = formatGNF(amount);
  
  if (type === 'INCOME') {
    return `💰 Nouvelle entrée: ${formattedAmount} - ${description}`;
  } else {
    return `💸 Nouvelle sortie: ${formattedAmount} - ${description}`;
  }
};

/**
 * Calcule les jours ouvrables entre deux dates
 */
export const calculateBusinessDays = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Pas dimanche (0) ni samedi (6)
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
};

/**
 * Détermine si c'est un jour ouvrable
 */
export const isBusinessDay = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6; // Pas dimanche ni samedi
};

/**
 * Formate un taux de change
 */
export const formatExchangeRate = (rate: number, fromCurrency: string, toCurrency: string): string => {
  return `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
};

/**
 * Convertit les francs guinéens vers d'autres devises
 */
export const convertFromGNF = (amountGNF: number, exchangeRate: number): number => {
  return amountGNF / exchangeRate;
};

/**
 * Convertit vers les francs guinéens depuis d'autres devises
 */
export const convertToGNF = (amount: number, exchangeRate: number): number => {
  return amount * exchangeRate;
};

/**
 * Calcule les intérêts composés
 */
export const calculateCompoundInterest = (
  principal: number,
  rate: number,
  time: number,
  compoundFrequency: number = 12
): number => {
  return principal * Math.pow(1 + (rate / 100) / compoundFrequency, compoundFrequency * time);
};

/**
 * Calcule les intérêts simples
 */
export const calculateSimpleInterest = (
  principal: number,
  rate: number,
  time: number
): number => {
  return principal * (1 + (rate / 100) * time);
};

/**
 * Formats a number with appropriate suffix (K, M, B)
 */
export const formatNumberWithSuffix = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Génère un code de couleur basé sur une chaîne
 */
export const generateColorFromString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Détermine si une année est bissextile
 */
export const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

/**
 * Calcule le nombre de jours dans un mois
 */
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

/**
 * Formate une devise avec son symbole - Version simplifiée pour franc guinéen uniquement
 */
export const formatCurrencyWithSymbol = (amount: number, currency: string = 'GNF'): string => {
  // Support uniquement du franc guinéen pour éviter les problèmes d'encodage
  if (currency === 'GNF') {
    return `${amount.toLocaleString('fr-FR')} FG`;
  }
  
  // Fallback pour autres devises
  return `${amount.toLocaleString('fr-FR')} ${currency}`;
};

/**
 * Utilitaires d'export par défaut
 */
export default {
  formatGNF,
  formatGNFShort,
  calculateTrend,
  calculateHealthScore,
  generateFinancialAlerts,
  formatDate,
  formatDateShort,
  getTransactionColor,
  getTransactionIcon,
  validateTransactionData,
  exportFinanceData,
  numberToWords,
  calculateSimpleProjection,
  getChartColors,
  formatPercentage,
  getAmountColorClass,
  generateTransactionReference,
  validateGuineanPhone,
  formatGuineanPhone,
  getTransactionNotificationMessage,
  isBusinessDay,
  calculateCompoundInterest,
  calculateSimpleInterest,
  formatNumberWithSuffix,
  generateColorFromString,
  formatCurrencyWithSymbol
};