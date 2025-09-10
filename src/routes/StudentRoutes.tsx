// src/routes/StudentRoutes.tsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';

// ✨ PAGES ÉTUDIANTS
import StudentsListPage from '../pages/Students/StudentsListPage';
import StudentFormPage from '../pages/Students/StudentFormPage';
import StudentDetailsPage from '../pages/Students/StudentDetailsPage';
import StudentPhotoPage from '../pages/Students/StudentPhotoPage';
import StudentsImportPage from '../pages/Students/StudentsImportPage';
import StudentsStatsPage from '../pages/Students/StudentsStatsPage';

const StudentRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Liste des étudiants */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <StudentsListPage />
          </ProtectedRoute>
        }
      />

      {/* Création d'un nouvel étudiant */}
      <Route
        path="/new"
        element={
          <ProtectedRoute requireAdmin>
            <StudentFormPage />
          </ProtectedRoute>
        }
      />

      {/* Détails d'un étudiant */}
      <Route
        path="/:id"
        element={
          <ProtectedRoute>
            <StudentDetailsPage />
          </ProtectedRoute>
        }
      />

      {/* Modification d'un étudiant */}
      <Route
        path="/:id/edit"
        element={
          <ProtectedRoute requireAdmin>
            <StudentFormPage />
          </ProtectedRoute>
        }
      />

      {/* Gestion photo étudiant */}
      <Route
        path="/:id/photo"
        element={
          <ProtectedRoute requireAdmin>
            <StudentPhotoPage />
          </ProtectedRoute>
        }
      />

      {/* Import en masse */}
      <Route
        path="/import"
        element={
          <ProtectedRoute requireAdmin>
            <StudentsImportPage />
          </ProtectedRoute>
        }
      />

      {/* Statistiques */}
      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <StudentsStatsPage />
          </ProtectedRoute>
        }
      />

      {/* Redirection par défaut */}
      <Route path="*" element={<Navigate to="/students" replace />} />
    </Routes>
  );
};

export default StudentRoutes;