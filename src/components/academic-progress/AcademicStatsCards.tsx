// src/components/academic-progress/AcademicStatsCards.tsx - VERSION CORRIGÉE ALIGNÉE

import React from 'react';
import { BookOpen, Brain, Mic, Users, TrendingUp, Award, AlertCircle } from 'lucide-react';

// Import des types depuis le fichier types
import type { AcademicStats } from '../../types/academicProgress.types';

interface AcademicStatsCardsProps {
  stats: AcademicStats | null;
  loading: boolean;
  error: string | null;
}

const AcademicStatsCards: React.FC<AcademicStatsCardsProps> = ({
  stats,
  loading,
  error
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100/50 shadow-sm">
            <div className="animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200/50 rounded-2xl p-6 mb-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="font-semibold text-red-800">Erreur de chargement</h3>
            <p className="text-red-600 text-sm">
              {error || 'Impossible de charger les statistiques'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Données alignées avec la structure backend
  const generalStats = stats.general || {};
  const performanceStats = stats.performance || {};
  const subjectsStats = stats.subjects || {};

  // Configuration des matières avec données du backend
  const subjects = [
    {
      name: 'Mémorisation',
      key: 'memorization',
      icon: Brain,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100'
    },
    {
      name: 'Récitation',
      key: 'recitation', 
      icon: Mic,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100'
    },
    {
      name: 'Tajwid',
      key: 'tajwid',
      icon: BookOpen,
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100'
    },
    {
      name: 'Comportement',
      key: 'behavior',
      icon: Users,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100'
    }
  ];

  // Configuration des mentions alignée backend
  const mentions = [
    {
      name: 'Excellent',
      key: 'excellent',
      range: '16-20',
      color: 'emerald',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200'
    },
    {
      name: 'Bien', 
      key: 'good',
      range: '14-16',
      color: 'blue',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200'
    },
    {
      name: 'Assez bien',
      key: 'average', 
      range: '12-14',
      color: 'amber',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200'
    },
    {
      name: 'Insuffisant',
      key: 'below_average',
      range: '<12',
      color: 'red',
      bg: 'bg-red-50', 
      text: 'text-red-700',
      border: 'border-red-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total évaluations */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900">
                {generalStats.total_evaluations || 0}
              </div>
              <div className="text-sm font-medium text-blue-700">
                Évaluations totales
              </div>
            </div>
          </div>
        </div>

        {/* Étudiants évalués */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6 border border-green-200/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-900">
                {generalStats.students_evaluated || 0}
              </div>
              <div className="text-sm font-medium text-green-700">
                Étudiants évalués
              </div>
            </div>
          </div>
        </div>

        {/* Moyenne générale */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-900">
                {generalStats.global_average ? `${generalStats.global_average.toFixed(1)}/20` : 'N/A'}
              </div>
              <div className="text-sm font-medium text-purple-700">
                Moyenne générale
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques par matière */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {subjects.map((subject) => {
          const score = subjectsStats[subject.key as keyof typeof subjectsStats] || 0;
          const percentage = Math.min((score / 20) * 100, 100);
          const Icon = subject.icon;
          
          return (
            <div
              key={subject.key}
              className={`group bg-gradient-to-r ${subject.bgGradient} rounded-2xl p-6 border border-${subject.color}-200/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${subject.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className={`text-lg font-bold text-${subject.color}-800`}>
                  {score ? `${score.toFixed(1)}` : 'N/A'}
                </div>
              </div>
              
              <h3 className={`text-sm font-semibold text-${subject.color}-900 mb-3 truncate`}>
                {subject.name}
              </h3>
              
              <div className="relative">
                <div className="w-full bg-white/70 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`bg-gradient-to-r ${subject.gradient} h-2 rounded-full transition-all duration-1000 ease-out shadow-sm`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span className={`text-${subject.color}-600`}>0</span>
                  <span className={`text-${subject.color}-600 font-semibold`}>
                    {score ? `${score.toFixed(1)}` : '0'}/20
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribution des mentions */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-100/50 shadow-sm hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Distribution des Mentions</h3>
            <p className="text-sm text-gray-600">Répartition des niveaux de performance</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {mentions.map((mention) => {
            const data = performanceStats[mention.key as keyof typeof performanceStats];
            const count = data?.count || 0;
            const percentage = data?.percentage || '0';
            
            return (
              <div
                key={mention.key}
                className={`${mention.bg} ${mention.border} border rounded-xl p-4 hover:scale-105 transition-all duration-200 hover:shadow-md`}
              >
                <div className="text-center">
                  <div className={`text-3xl font-bold ${mention.text} mb-2`}>
                    {count}
                  </div>
                  <div className="text-sm font-semibold text-gray-800 mb-1">
                    {mention.name}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    Notes {mention.range}
                  </div>
                  <div className={`text-sm font-bold ${mention.text} bg-white/80 rounded-full px-3 py-1 inline-block shadow-sm`}>
                    {percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Statistiques supplémentaires */}
        {generalStats.total_pages_memorized !== undefined && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-cyan-600" />
                  <div>
                    <div className="text-xl font-bold text-cyan-900">
                      {generalStats.total_pages_memorized}
                    </div>
                    <div className="text-sm text-cyan-700">Pages mémorisées</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-teal-600" />
                  <div>
                    <div className="text-xl font-bold text-teal-900">
                      {generalStats.average_attendance ? `${generalStats.average_attendance.toFixed(1)}%` : 'N/A'}
                    </div>
                    <div className="text-sm text-teal-700">Présence moyenne</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Export par défaut
export default AcademicStatsCards;