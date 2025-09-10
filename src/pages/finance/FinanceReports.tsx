// src/pages/finance/FinanceReports.tsx - Page Simple pour les Rapports
import React from 'react';
import { FileText, Download, Calendar, TrendingUp, BarChart3 } from 'lucide-react';

const FinanceReports: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FileText className="w-8 h-8 mr-3 text-blue-600" />
            Rapports Financiers
          </h1>
          <p className="text-gray-600 mt-2">
            Analyses détaillées et exports de données financières
          </p>
        </div>

        {/* Cards de rapports */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Rapport Mensuel */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <button className="text-blue-600 hover:text-blue-700">
                <Download className="w-5 h-5" />
              </button>
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Rapport Mensuel</h3>
            <p className="text-gray-600 text-sm mb-4">
              Synthèse complète des revenus et dépenses du mois
            </p>
            <button className="w-full py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              Générer
            </button>
          </div>

          {/* Rapport Annuel */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <button className="text-green-600 hover:text-green-700">
                <Download className="w-5 h-5" />
              </button>
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Rapport Annuel</h3>
            <p className="text-gray-600 text-sm mb-4">
              Bilan annuel avec évolution et projections
            </p>
            <button className="w-full py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
              Générer
            </button>
          </div>

          {/* Analyses Avancées */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <button className="text-purple-600 hover:text-purple-700">
                <Download className="w-5 h-5" />
              </button>
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Analyses Avancées</h3>
            <p className="text-gray-600 text-sm mb-4">
              Tableaux de bord et métriques personnalisées
            </p>
            <button className="w-full py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
              Accéder
            </button>
          </div>
        </div>

        {/* Message temporaire */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start space-x-3">
            <FileText className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Page de Rapports en Développement
              </h3>
              <p className="text-blue-700 text-sm">
                Cette page sera complétée avec des fonctionnalités avancées de génération de rapports financiers.
                Pour le moment, utilisez le Dashboard principal pour accéder aux données financières.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceReports;