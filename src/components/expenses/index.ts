// src/components/expenses/index.ts - Export des composants expenses

// Export des composants
export { default as ExpensesDashboard } from './ExpensesDashboard';
export { default as ExpenseCard } from './ExpenseCard';
export { default as ExpenseForm } from './ExpenseForm';

// Re-export des types depuis le fichier de types
export type {
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  ExpenseResponsible,
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseFilters,
  ExpenseDashboard,
  UseExpensesOptions,
  UseExpensesReturn,
  ExpenseCardProps,
  ExpenseFormProps,
  PaymentMethod,
  PaymentMethodOption
} from '@/types/expense.types';

// Re-export du service et du hook
export { default as ExpenseService, formatCurrency, getPaymentMethodLabel } from '@/services/expenseService';
export { default as useExpenses, useExpenseDashboard, useExpenseConfig, useExpense } from '@/hooks/useExpense';