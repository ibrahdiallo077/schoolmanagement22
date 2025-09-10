// src/components/school-years/SchoolYearsManagement.tsx - Page de gestion des années scolaires

import React, { useState, useCallback } from 'react';
import { 
  Calendar, 
  Plus, 
  BarChart3, 
  Search, 
  Filter, 
  Download,
  Star,
  Clock,
  Users,
  GraduationCap,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { SchoolYear } from '../../types/schoolyear.types';
import useSchoolYear, { useSchoolYearStats } from '../../hooks/useSchool';
import SchoolYearList from './SchoolYearList';
import SchoolYearForm from './SchoolYearForm';
import SchoolYearSelector from './SchoolYearSelector';

const SchoolYearsManagement: React.FC = () => {
  const {
    schoolYears,
    currentYear,
    isLoading,
    error,
    createSchoolYear,
    updateSchoolYear,
    deleteSchoolYear,
    refresh,
    clearError
  } = useSchoolYear();

  const { stats, isLoading: statsLoading } = useSchoolYearStats();

  // États locaux pour l'interface
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<SchoolYear | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // Filtrer les années scolaires
  const filteredSchoolYears = schoolYears.filter(schoolYear => {
    const matchesSearch = schoolYear.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (schoolYear.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    if (filterStatus === 'current') return schoolYear.is_current;
    if (filterStatus === 'active') {
      const now = new Date();
      const endDate = new Date(schoolYear.end_date);
      return endDate >= now;
    }
    if (filterStatus === 'past') {
      const now = new Date();
      const endDate = new Date(schoolYear.end_date);
      return endDate < now;
    }

    return true;
  });

  // Ouvrir le formulaire de création
  const handleCreate = useCallback(() => {
    setSelectedSchoolYear(null);
    setFormMode('create');
    setIsFormOpen(true);
  }, []);

  // Ouvrir le formulaire de modification
  const handleEdit = useCallback((schoolYear: SchoolYear) => {
    setSelectedSchoolYear(schoolYear);
    setFormMode('edit');
    setIsFormOpen(true);
  }, []);

  // Sauvegarder (créer ou modifier)
  const handleSave = useCallback(async (data: any) => {
    if (formMode === 'create') {
      await createSchoolYear(data);
    } else if (selectedSchoolYear) {
      await updateSchoolYear(selectedSchoolYear.id, data);
    }
  }, [formMode, selectedSchoolYear, createSchoolYear, updateSchoolYear]);

  // Fermer le formulaire
  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setSelectedSchoolYear(null);
  }, []);

  // Gérer la suppression
  const handleDelete = useCallback(async (schoolYear: SchoolYear) => {
    // La confirmation est gérée dans SchoolYearList
    await deleteSchoolYear(schoolYear.id);
  }, [deleteSchoolYear]);

  // Statistiques calculées
  const totalStudents = stats?.recent_years_comparison?.reduce((sum, year) => sum + year.students_count, 0) || 0;
  const totalClasses = stats?.recent_years_comparison?.reduce((sum, year) => sum + year.classes_count, 0) || 0;
  const averageOccupancy = stats?.recent_years_comparison?.length 
    ? Math.round(stats.recent_years_comparison.reduce((sum, year) => sum + year.occupancy_rate, 0) / stats.recent_years_comparison.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Années Scolaires</h1>
                  <p className="text-gray-600">Gérez les années scolaires et leurs paramètres</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>{showStats ? 'Masquer' : 'Afficher'} les statistiques</span>
                </button>

                <button
                  onClick={handleCreate}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouvelle année</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques */}
        {showStats && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vue d'ensemble</h2>
            
            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total années */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Années</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.general.total_years || schoolYears.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <span>{stats?.general.current_years || (currentYear ? 1 : 0)} courante(s)</span>
                </div>
              </div>

              {/* Total étudiants */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Étudiants</p>
                    <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>Toutes années confondues</span>
                </div>
              </div>

              {/* Total classes */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Classes</p>
                    <p className="text-2xl font-bold text-gray-900">{totalClasses}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <GraduationCap className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm text-purple-600">
                  <span>Actives et inactives</span>
                </div>
              </div>

              {/* Taux d'occupation moyen */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taux d'Occupation</p>
                    <p className="text-2xl font-bold text-gray-900">{averageOccupancy}%</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <span>Moyenne générale</span>
                </div>
              </div>
            </div>

            {/* Année courante mise en évidence */}
            {currentYear && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Année Scolaire Courante</h3>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 mb-1">{currentYear.name}</p>
                    <p className="text-gray-600">
                      {currentYear.start_date_formatted} - {currentYear.end_date_formatted}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    {currentYear.total_students !== undefined && (
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">{currentYear.total_students}</span> étudiants
                      </div>
                    )}
                    {currentYear.total_classes !== undefined && (
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">{currentYear.total_classes}</span> classes
                      </div>
                    )}
                    {currentYear.progress_percentage !== null && currentYear.progress_percentage !== undefined && (
                      <div className="text-sm text-blue-600 font-medium">
                        {currentYear.progress_percentage}% terminé
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Barre de progression de l'année courante */}
                {currentYear.progress_percentage !== null && currentYear.progress_percentage !== undefined && (
                  <div className="mt-4">
                    <div className="w-full bg-blue-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${currentYear.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Alerte si pas d'année courante */}
            {!currentYear && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
                  <div>
                    <h4 className="text-amber-800 font-medium">Aucune année scolaire courante</h4>
                    <p className="text-amber-700 text-sm mt-1">
                      Définissez une année comme courante pour faciliter les inscriptions d'étudiants.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Recherche */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher une année scolaire..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filtres */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Toutes les années</option>
                  <option value="current">Année courante</option>
                  <option value="active">Années actives</option>
                  <option value="past">Années passées</option>
                </select>
              </div>

              <button
                onClick={refresh}
                disabled={isLoading}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
            </div>
          </div>

          {/* Résultats de recherche */}
          {searchTerm && (
            <div className="mt-3 text-sm text-gray-600">
              <span className="font-medium">{filteredSchoolYears.length}</span> résultat(s) pour "{searchTerm}"
            </div>
          )}
        </div>

        {/* Liste des années scolaires */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Années Scolaires ({filteredSchoolYears.length})
              </h2>
              
              {filteredSchoolYears.length > 0 && (
                <button
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter</span>
                </button>
              )}
            </div>

            {/* Affichage d'erreur */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                  <div className="flex-1">
                    <h3 className="text-red-800 font-medium">Erreur de chargement</h3>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                  </div>
                  <button
                    onClick={clearError}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Liste des années avec les données filtrées */}
            <SchoolYearList
              onEdit={handleEdit}
              onDelete={handleDelete}
              showActions={true}
              compact={false}
            />
          </div>
        </div>
      </div>

      {/* Formulaire modal */}
      <SchoolYearForm
        schoolYear={selectedSchoolYear}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSave}
        mode={formMode}
      />
    </div>
  );
};

export default SchoolYearsManagement;