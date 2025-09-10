// src/pages/expenses/index.ts - Export de la page expenses

export { default } from './ExpensesPage';
export { default as ExpensesPage } from './ExpensesPage';

// Re-export des composants si nécessaire
export { 
  ExpensesDashboard, 
  ExpenseCard, 
  ExpenseForm 
} from '@/components/expenses';