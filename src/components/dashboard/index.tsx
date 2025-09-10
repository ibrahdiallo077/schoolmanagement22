// src/pages/dashboard/index.tsx - PAGE PRINCIPALE DASHBOARD

import React from 'react';
import { ModernDashboard } from '@/components/dashboard/ModernDashboard';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Composant de loading
function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="text-gray-600">Chargement du tableau de bord...</p>
      </div>
    </div>
  );
}

// Composant d'erreur
function DashboardError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Erreur de chargement</h3>
        <p className="text-gray-600">Une erreur est survenue lors du chargement du tableau de bord.</p>
        <button
          onClick={retry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary fallback={DashboardError}>
      <Suspense fallback={<DashboardLoading />}>
        <ModernDashboard />
      </Suspense>
    </ErrorBoundary>
  );
}