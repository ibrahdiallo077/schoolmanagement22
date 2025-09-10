// src/pages/StudentsPage.tsx - VERSION CORRIGÉE ET AMÉLIORÉE
// Router principal pour toutes les pages Students modernes

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';

// ✅ IMPORT DES COMPOSANTS CORRIGÉS
import StudentsListPage from './Students/StudentsListPage';
import StudentProfilePage from './Students/StudentProfilePage';
import StudentFormPage from './Students/StudentFormPage';
import StudentEditPage from './Students/StudentEditPage'; 

// ✅ COMPOSANT 404 MODERNE ET INTÉRACTIF
const StudentNotFound: React.FC = () => {
  const handleGoBack = () => {
    if (window.history && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/students';
    }
  };

  const handleGoHome = () => {
    window.location.href = '/students';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="text-center max-w-lg mx-auto">
        {/* Animation et design moderne */}
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl transform transition-all hover:scale-105">
            <AlertTriangle className="w-16 h-16 text-white" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-600 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">
            Page non trouvée
          </h1>
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            Cette page étudiant n'existe pas ou a été supprimée.<br />
            Vérifiez l'URL ou retournez à la liste des étudiants.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleGoBack}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-slate-700 text-white rounded-xl hover:from-gray-700 hover:to-slate-800 transition-all shadow-xl font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour
            </button>
            <button 
              onClick={handleGoHome}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:from-red-700 hover:to-orange-700 transition-all shadow-xl font-medium"
            >
              <Home className="w-5 h-5" />
              Liste des étudiants
            </button>
          </div>
        </div>

        {/* Informations de debug (optionnel) */}
        <div className="mt-6 text-sm text-gray-500">
          <p>URL demandée : <code className="bg-gray-100 px-2 py-1 rounded">{window.location.pathname}</code></p>
        </div>
      </div>
    </div>
  );
};

// ✅ COMPOSANT DE CHARGEMENT MODERNE
const StudentsLoading: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="text-center">
      <div className="relative">
        <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl mb-6 mx-auto animate-pulse">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Chargement...</h2>
      <p className="text-slate-600">Initialisation du module étudiants</p>
    </div>
  </div>
);

// ✅ WRAPPER POUR GESTION D'ERREURS
const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (error: any) => {
      console.error('Error in StudentsPage:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border border-red-100">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-rose-600 rounded-3xl flex items-center justify-center shadow-2xl mb-6 mx-auto">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Erreur système</h2>
          <p className="text-slate-600 mb-6">Une erreur s'est produite dans le module étudiants.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all shadow-xl font-medium"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * 🎯 ROUTER PRINCIPAL DES ÉTUDIANTS - VERSION AMÉLIORÉE
 * 
 * ✅ Routes disponibles :
 * - /students              → Liste des étudiants (StudentsListPage corrigée)
 * - /students/new          → Nouveau formulaire (StudentFormPage améliorée)
 * - /students/:id          → Profil d'un étudiant (StudentProfilePage corrigée)
 * - /students/:id/edit     → Édition d'un étudiant (StudentFormPage en mode édition)
 * - /*                     → 404 étudiant moderne
 * 
 * 🚀 Améliorations :
 * - Gestion d'erreurs robuste
 * - Interface moderne et responsive
 * - Navigation fluide
 * - États de chargement élégants
 * - Composants optimisés
 */
const StudentsPage: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);

  // ✅ SIMULATION DE CHARGEMENT INITIAL (optionnel)
  React.useEffect(() => {
    // Simuler le temps de chargement initial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Afficher l'état de chargement si nécessaire
  if (isLoading) {
    return <StudentsLoading />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Routes>
          {/* ✅ LISTE PRINCIPALE DES ÉTUDIANTS - CORRIGÉE */}
          <Route 
            path="/" 
            element={<StudentsListPage />} 
          />
          
          {/* ✅ NOUVEAU FORMULAIRE D'ÉTUDIANT - AMÉLIORÉ */}
          <Route 
            path="/new" 
            element={<StudentFormPage />} 
          />
          
          {/* ✅ PROFIL D'UN ÉTUDIANT SPÉCIFIQUE - CORRIGÉ */}
          <Route 
            path="/:id" 
            element={<StudentProfilePage />} 
          />
          
          {/* ✅ ÉDITION D'UN ÉTUDIANT - AMÉLIORÉE */}
          {/* ✅ ÉDITION D'UN ÉTUDIANT - AMÉLIORÉE */}
          <Route 
            path="/:id/edit" 
            element={<StudentEditPage />}   // ✅ CORRECT
          />
          
          {/* ✅ REDIRECTIONS AUTOMATIQUES POUR COMPATIBILITÉ */}
          <Route 
            path="/list" 
            element={<Navigate to="/students" replace />} 
          />
          
          <Route 
            path="/create" 
            element={<Navigate to="/students/new" replace />} 
          />
          
          <Route 
            path="/add" 
            element={<Navigate to="/students/new" replace />} 
          />
          
          {/* ✅ ROUTES FUTURES (préparation pour extensions) */}
          <Route 
            path="/:id/payments" 
            element={
              <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border border-green-100">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl mb-6 mx-auto">
                    <span className="text-3xl">💳</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">Module Paiements</h2>
                  <p className="text-slate-600 mb-6">Cette fonctionnalité sera bientôt disponible.</p>
                  <button 
                    onClick={() => window.history.back()}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-xl font-medium"
                  >
                    Retour au profil
                  </button>
                </div>
              </div>
            } 
          />
          
          <Route 
            path="/:id/grades" 
            element={
              <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border border-blue-100">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl mb-6 mx-auto">
                    <span className="text-3xl">📚</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">Module Notes</h2>
                  <p className="text-slate-600 mb-6">Cette fonctionnalité sera bientôt disponible.</p>
                  <button 
                    onClick={() => window.history.back()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl font-medium"
                  >
                    Retour au profil
                  </button>
                </div>
              </div>
            } 
          />
          
          <Route 
            path="/:id/attendance" 
            element={
              <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border border-purple-100">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl mb-6 mx-auto">
                    <span className="text-3xl">✅</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">Module Présences</h2>
                  <p className="text-slate-600 mb-6">Cette fonctionnalité sera bientôt disponible.</p>
                  <button 
                    onClick={() => window.history.back()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-xl font-medium"
                  >
                    Retour au profil
                  </button>
                </div>
              </div>
            } 
          />
          
          {/* ✅ PAGE 404 MODERNE POUR LES ROUTES INVALIDES */}
          <Route 
            path="*" 
            element={<StudentNotFound />} 
          />
        </Routes>
      </div>
    </ErrorBoundary>
  );
};

export default StudentsPage;
