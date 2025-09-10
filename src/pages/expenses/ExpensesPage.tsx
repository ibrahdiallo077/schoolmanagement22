// src/pages/expenses/ExpensesPage.tsx - Page wrapper pour les dépenses

import React, { useEffect } from 'react';
import ExpensesDashboard from '@/components/expenses/ExpensesDashboard';

const ExpensesPage: React.FC = () => {
  // Mettre à jour le titre de la page
  useEffect(() => {
    document.title = 'Gestion des Dépenses - Haramain';
    
    // Cleanup au démontage
    return () => {
      document.title = 'Haramain';
    };
  }, []);

  return (
    <div className="expenses-page">
      <ExpensesDashboard />
    </div>
  );
};

export default ExpensesPage;