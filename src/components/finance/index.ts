// src/components/finance/index.ts - Export complet des composants finance
export { default as FinanceDashboard } from './FinanceDashboard';
export { default as TransactionInjectionForm } from './TransactionInjectionForm';
export { default as FinanceIcons } from './FinanceIcons';
export * from './FinanceIcons';
export * from './FinanceUtils';

// Types re-exports pour faciliter l'importation
export type {
  FinanceMetrics,
  TrendData,
  AlertData
} from './FinanceUtils';

// Utilitaires principaux re-exports
export {
  formatGNF,
  formatGNFShort,
  calculateTrend,
  calculateHealthScore,
  generateFinancialAlerts,
  getTransactionColor,
  getTransactionIcon,
  validateTransactionData
} from './FinanceUtils';