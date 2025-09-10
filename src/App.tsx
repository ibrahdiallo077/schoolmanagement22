// App.tsx - VERSION CORRIGÉE SANS ERREUR D'IMPORT

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// PAGES PRINCIPALES - DASHBOARDS CONNECTÉS - IMPORTS CORRIGÉS
import ModernDashboard from "@/components/dashboard/ModernDashboard"; // Default import
import { SchoolDashboard } from "@/components/dashboard/SchoolDashboard";

// PAGES D'AUTHENTIFICATION
import LoginPage from "@/components/auth/LoginPage";
import FirstLoginPage from "@/components/auth/FirstLoginPage";
import FirstLoginEmailPage from "@/components/auth/FirstLoginEmailPage"; 
import { ForgotPasswordPage } from "@/components/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/components/auth/ResetPasswordPage"; 

// PAGES ÉTUDIANTS
import StudentsPage from "./pages/StudentsPage";

// PAGES PERSONNEL
import { StaffMainRouter } from "./pages/staff";

// PAGES ANNÉES SCOLAIRES
import SchoolYearsManagement from "./pages/schools/SchoolYearsManagement";

// PAGES CLASSES
import ClassesManagement from "./pages/classes/ClassesManagement";

// PAGES ACADÉMIQUES
import AcademicProgressPage from "./pages/academic-progress/AcademicProgressPage";
import EditEvaluationPage from "./pages/academic-progress/EditEvaluationPage";

// PAGES PAIEMENTS ÉTUDIANTS
import StudentPaymentsPage from "./pages/student-payments/StudentPaymentsPage";

// PAIEMENTS SALAIRES
import SalaryPaymentsPage from "./pages/staff-payments/SalaryPaymentsPage";

// PAGES DÉPENSES
import ExpensesPage from "./pages/expenses/ExpensesPage";

// SYSTÈME FINANCIER UNIFIÉ - SUPER ADMIN
import FinanceDashboard from "./components/finance/FinanceDashboard";
import FinanceReports from "./pages/finance/FinanceReports";

// PAGES NOTIFICATIONS
import { NotificationsPage } from "./pages/notifications";

// AUTRES PAGES
import { PaymentsPage } from "./pages/PaymentsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { AdminManagementPage } from "./pages/AdminManagementPage";
import NotFound from "./pages/NotFound";

// Configuration du QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Composant pour protéger les routes Super Admin
const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute requiredRole="super_admin">
    {children}
  </ProtectedRoute>
);

// Dashboard Principal Corrigé - Utilise ModernDashboard par défaut
const MainDashboard = () => {
  return <ModernDashboard />;
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* ============================================================================ */}
              {/* ROUTES PUBLIQUES (sans layout) */}
              {/* ============================================================================ */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/first-login" element={<FirstLoginPage />} />
              <Route path="/first-login-email" element={<FirstLoginEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              
              {/* ============================================================================ */}
              {/* ROUTES DASHBOARD PRINCIPALES - DASHBOARDS CONNECTÉS */}
              {/* ============================================================================ */}
              
              {/* Dashboard principal - Version moderne connectée */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <MainDashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Dashboard moderne complet - Super Admin */}
              <Route
                path="/dashboard/modern"
                element={
                  <SuperAdminRoute>
                    <DashboardLayout>
                      <ModernDashboard />
                    </DashboardLayout>
                  </SuperAdminRoute>
                }
              />

              {/* Dashboard école spécialisé */}
              <Route
                path="/dashboard/school"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SchoolDashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Dashboard standard - Utilise ModernDashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ModernDashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Alias dashboard principal */}
              <Route
                path="/dashboard/main"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <MainDashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* ============================================================================ */}
              {/* ROUTES ÉTUDIANTS */}
              {/* ============================================================================ */}
              <Route
                path="/students/*"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <StudentsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* ============================================================================ */}
              {/* ROUTES PERSONNEL */}
              {/* ============================================================================ */}
              <Route
                path="/staff/*"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <StaffMainRouter />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* ============================================================================ */}
              {/* ROUTES ACADÉMIQUES */}
              {/* ============================================================================ */}
              
              {/* Années scolaires */}
              <Route
                path="/school-years"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SchoolYearsManagement />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Classes */}
              <Route
                path="/classes"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ClassesManagement />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* ============================================================================ */}
              {/* ROUTES ÉVOLUTION ACADÉMIQUE */}
              {/* ============================================================================ */}
              
              {/* Page principale */}
              <Route
                path="/academic-progress"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AcademicProgressPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Dashboard des évaluations */}
              <Route
                path="/academic-progress/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AcademicProgressPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Liste des évaluations */}
              <Route
                path="/academic-progress/evaluations"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AcademicProgressPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Modifier une évaluation */}
              <Route
                path="/academic-progress/edit/:id"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <EditEvaluationPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Route alternative pour modification */}
              <Route
                path="/academic-progress/evaluations/:id/edit"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <EditEvaluationPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Autres routes académiques */}
              <Route
                path="/academic-progress/manage"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AcademicProgressPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/academic-progress/evaluations/new"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AcademicProgressPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/academic-progress/new"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AcademicProgressPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/academic-progress/evaluations/:evaluationId"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AcademicProgressPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/academic-progress/evaluation/:evaluationId"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AcademicProgressPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/academic-progress/student/:studentId"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AcademicProgressPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/academic-progress/reports"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AcademicProgressPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/academic-progress/analytics"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AcademicProgressPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/academic-progress/export"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AcademicProgressPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* ============================================================================ */}
              {/* ROUTES NOTIFICATIONS */}
              {/* ============================================================================ */}
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <NotificationsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* ============================================================================ */}
              {/* ROUTES FINANCIÈRES TRADITIONNELLES */}
              {/* ============================================================================ */}

              {/* Paiements étudiants */}
              <Route
                path="/student-payments"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <StudentPaymentsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student-payments/manage"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <StudentPaymentsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student-payments/:studentId"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <StudentPaymentsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Paiements salaires */}
              <Route
                path="/staff-payments"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SalaryPaymentsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* ============================================================================ */}
              {/* ROUTES DÉPENSES */}
              {/* ============================================================================ */}
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ExpensesPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/expenses/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ExpensesPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/expenses/manage"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ExpensesPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* ============================================================================ */}
              {/* SYSTÈME FINANCIER UNIFIÉ - SUPER ADMIN */}
              {/* ============================================================================ */}
              
              {/* Route principale Finance */}
              <Route
                path="/finance"
                element={
                  <SuperAdminRoute>
                    <DashboardLayout>
                      <FinanceDashboard />
                    </DashboardLayout>
                  </SuperAdminRoute>
                }
              />

              <Route
                path="/finance/dashboard"
                element={
                  <SuperAdminRoute>
                    <DashboardLayout>
                      <FinanceDashboard />
                    </DashboardLayout>
                  </SuperAdminRoute>
                }
              />

              <Route
                path="/finance/reports"
                element={
                  <SuperAdminRoute>
                    <DashboardLayout>
                      <FinanceReports />
                    </DashboardLayout>
                  </SuperAdminRoute>
                }
              />

              <Route
                path="/finance/transactions"
                element={
                  <SuperAdminRoute>
                    <DashboardLayout>
                      <FinanceDashboard />
                    </DashboardLayout>
                  </SuperAdminRoute>
                }
              />

              <Route
                path="/finance/settings"
                element={
                  <SuperAdminRoute>
                    <DashboardLayout>
                      <SettingsPage />
                    </DashboardLayout>
                  </SuperAdminRoute>
                }
              />

              <Route
                path="/finance/alerts"
                element={
                  <SuperAdminRoute>
                    <DashboardLayout>
                      <FinanceReports />
                    </DashboardLayout>
                  </SuperAdminRoute>
                }
              />

              <Route
                path="/finance/analytics"
                element={
                  <SuperAdminRoute>
                    <DashboardLayout>
                      <FinanceReports />
                    </DashboardLayout>
                  </SuperAdminRoute>
                }
              />

              {/* ============================================================================ */}
              {/* AUTRES ROUTES FONCTIONNELLES */}
              {/* ============================================================================ */}

              {/* Paiements généraux */}
              <Route
                path="/payments"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <PaymentsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Profil utilisateur */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ProfilePage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Paramètres */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SettingsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Gestion admin */}
              <Route
                path="/admin-management"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AdminManagementPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* ============================================================================ */}
              {/* ROUTES D'AIDE ET SUPPORT */}
              {/* ============================================================================ */}
              
              <Route
                path="/help/finance"
                element={
                  <SuperAdminRoute>
                    <DashboardLayout>
                      <FinanceReports />
                    </DashboardLayout>
                  </SuperAdminRoute>
                }
              />

              <Route
                path="/help/academic-progress"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AcademicProgressPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/support"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SettingsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/finance/tutorials"
                element={
                  <SuperAdminRoute>
                    <DashboardLayout>
                      <FinanceReports />
                    </DashboardLayout>
                  </SuperAdminRoute>
                }
              />

              <Route
                path="/academic-progress/tutorials"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AcademicProgressPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/privacy"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SettingsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* ============================================================================ */}
              {/* ROUTE 404 */}
              {/* ============================================================================ */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;