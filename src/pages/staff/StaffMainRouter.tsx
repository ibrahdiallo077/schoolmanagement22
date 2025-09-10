// src/pages/staff/StaffMainRouter.tsx - Routeur Principal CORRIGÉ

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// ✅ CORRECTION: Import des composants corrigés
import StaffPage from './StaffPage';
import StaffCreatePage from './StaffCreatePage';
import StaffDetailPage from './StaffDetailPage';

// === COMPOSANT PRINCIPAL ===
const StaffMainRouter: React.FC = () => {
  return (
    <Routes>
      {/* ✅ CORRECTION: Route principale liste du personnel */}
      <Route path="/" element={<StaffPage />} />
      
      {/* ✅ CORRECTION: Route création nouveau personnel */}
      <Route path="/new" element={<StaffCreatePage mode="create" />} />
      
      {/* ✅ CORRECTION: Route édition personnel existant */}
      <Route path="/edit/:id" element={<StaffCreatePage mode="edit" />} />
      
      {/* ✅ CORRECTION: Route détails d'un personnel */}
      <Route path="/:id" element={<StaffDetailPage />} />
      
      {/* ✅ CORRECTION: Redirection pour toute route non trouvée */}
      <Route path="*" element={<Navigate to="/staff" replace />} />
    </Routes>
  );
};

export default StaffMainRouter;