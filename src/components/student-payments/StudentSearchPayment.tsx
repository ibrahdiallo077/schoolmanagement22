import React, { useState, useEffect } from 'react';
import { 
  Search, User, Hash, Phone, Heart, BookOpen, Plus, 
  Users, ArrowRight, X, ChevronDown
} from 'lucide-react';

interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  status: 'interne' | 'externe';
  is_orphan: boolean;
  age: number;
  photo_url?: string;
  coranic_class?: {
    id: string;
    name: string;
    level?: string;
  };
  school_year?: {
    name: string;
  };
  guardian_name?: string;
  guardian_phone?: string;
  enrollment_date?: string;
  balance?: number;
  last_payment_date?: string;
}

interface StudentSearchProps {
  selectedStudent: Student | null;
  onStudentSelect: (student: Student) => void;
  onStudentClear: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  className?: string;
}

const StudentSearchPayment: React.FC<StudentSearchProps> = ({
  selectedStudent,
  onStudentSelect,
  onStudentClear,
  searchQuery,
  onSearchQueryChange,
  className = ""
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fonction utilitaire pour obtenir le nom complet
  const getStudentDisplayName = (student: Student): string => {
    if (student.full_name && student.full_name.trim()) {
      return student.full_name.trim();
    }
    const firstName = student.first_name?.trim() || 'Prénom';
    const lastName = student.last_name?.trim() || 'Nom';
    return `${firstName} ${lastName}`;
  };

  // Fonction pour obtenir les initiales
  const getStudentInitials = (student: Student): string => {
    const firstName = student.first_name?.trim() || 'U';
    const lastName = student.last_name?.trim() || 'N';
    return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
  };

  // Chargement des étudiants avec gestion d'erreur améliorée
  const loadStudents = async (searchTerm = '', page = 1, append = false) => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      let url = '';
      
      if (searchTerm.trim()) {
        // Pour la recherche, utiliser une approche plus simple
        url = `${baseUrl}/api/students?search=${encodeURIComponent(searchTerm.trim())}&limit=15`;
      } else {
        url = `${baseUrl}/api/students?page=${page}&limit=15&sort_by=first_name&sort_order=ASC`;
      }

      console.log('Chargement étudiants depuis:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer dev-token',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Réponse API status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Données reçues:', data);
        
        let studentsData = [];
        let hasMoreData = false;
        
        // Adapter selon la structure de réponse de votre API
        if (Array.isArray(data)) {
          studentsData = data;
        } else if (data.students && Array.isArray(data.students)) {
          studentsData = data.students;
          hasMoreData = data.pagination?.has_next || false;
        } else if (data.data && Array.isArray(data.data)) {
          studentsData = data.data;
          hasMoreData = data.pagination?.has_next || false;
        } else if (data.success && Array.isArray(data.results)) {
          studentsData = data.results;
        }
        
        const adaptedStudents = studentsData.map((student: any) => {
          const firstName = student.first_name || student.firstName || student.prenom || 'Prénom';
          const lastName = student.last_name || student.lastName || student.nom || 'Nom';
          const fullName = student.full_name || student.name || student.nom_complet || `${firstName} ${lastName}`;

          return {
            id: student.id || student._id,
            student_number: student.student_number || student.studentNumber || student.numero_etudiant || 'N/A',
            first_name: firstName,
            last_name: lastName,
            full_name: fullName,
            status: student.status || student.statut || 'externe',
            is_orphan: student.is_orphan || student.isOrphan || student.orphelin || false,
            age: student.age || student.age_years || 0,
            photo_url: student.photo_url || student.display_photo || student.photoUrl,
            coranic_class: student.coranic_class || student.coranicClass || student.class || (student.class_name ? {
              id: student.class_id || null,
              name: student.class_name,
              level: student.class_level
            } : null),
            school_year: student.school_year || student.schoolYear || student.annee_scolaire,
            guardian_name: student.guardian_display_name || student.guardian?.name || student.guardianName || student.tuteur_nom,
            guardian_phone: student.guardian_phone || student.guardian?.phone || student.guardianPhone || student.tuteur_telephone,
            enrollment_date: student.enrollment_date || student.enrollmentDate || student.date_inscription,
            balance: student.balance || student.solde || 0,
            last_payment_date: student.last_payment_date || student.lastPaymentDate || student.dernier_paiement
          };
        });
        
        if (append && !searchTerm.trim()) {
          setStudents(prevStudents => [...prevStudents, ...adaptedStudents]);
        } else {
          setStudents(adaptedStudents);
        }
        
        setHasMore(hasMoreData);
        
      } else {
        console.error('Erreur API étudiants:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Détails erreur:', errorText);
        
        if (!append) setStudents([]);
        
        // Fallback: essayer avec une URL différente
        if (searchTerm.trim() && response.status === 400) {
          console.log('Tentative avec URL alternative...');
          try {
            const fallbackUrl = `${baseUrl}/api/students?name=${encodeURIComponent(searchTerm.trim())}`;
            const fallbackResponse = await fetch(fallbackUrl, {
              method: 'GET',
              headers: {
                'Authorization': 'Bearer dev-token',
                'Content-Type': 'application/json'
              }
            });
            
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              console.log('Données fallback:', fallbackData);
              // Traiter les données fallback...
            }
          } catch (fallbackError) {
            console.error('Erreur fallback:', fallbackError);
          }
        }
      }
    } catch (error) {
      console.error('Erreur réseau chargement étudiants:', error);
      if (!append) setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreStudents = () => {
    if (!loading && !searchQuery.trim() && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadStudents('', nextPage, true);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadStudents('', 1);
  }, []);

  useEffect(() => {
    const delayedLoad = setTimeout(() => {
      setCurrentPage(1);
      loadStudents(searchQuery, 1);
    }, 300);
    return () => clearTimeout(delayedLoad);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.student-search-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStudentSelect = (student: Student) => {
    onStudentSelect(student);
    setShowDropdown(false);
    const displayName = getStudentDisplayName(student);
    onSearchQueryChange(displayName);
  };

  const handleStudentClear = () => {
    onStudentClear();
    onSearchQueryChange('');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sélection de l'étudiant</h2>
        <p className="text-gray-600">Recherchez et sélectionnez l'étudiant pour le paiement</p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <div className="relative student-search-container">
          {/* Barre de recherche */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou numéro d'étudiant..."
              value={searchQuery}
              onChange={(e) => {
                onSearchQueryChange(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-base transition-all duration-200 bg-gray-50 focus:bg-white shadow-sm"
            />
            <ChevronDown className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            
            {loading && (
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Dropdown étudiants */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-80 overflow-hidden z-50">
              {loading && students.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-blue-600 font-medium">Recherche en cours...</p>
                </div>
              ) : students.length > 0 ? (
                <div className="overflow-y-auto max-h-80">
                  <div className="p-2 space-y-1">
                    {students.map((student) => {
                      const displayName = getStudentDisplayName(student);
                      const initials = getStudentInitials(student);
                      
                      return (
                        <div
                          key={student.id}
                          onClick={() => handleStudentSelect(student)}
                          className="group relative p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200 rounded-lg border border-transparent hover:border-blue-200 hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar compact */}
                            <div className="relative flex-shrink-0">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                                {initials}
                              </div>
                              {student.is_orphan && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                                  <Heart className="w-2 h-2 text-white" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* Nom et statut sur la même ligne */}
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-gray-900 truncate text-sm">
                                  {displayName}
                                </h3>
                                
                                <div className="flex items-center gap-1 ml-2">
                                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                    student.status === 'interne' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'bg-green-100 text-green-700'
                                  }`}>
                                    {student.status === 'interne' ? 'INT' : 'EXT'}
                                  </span>
                                  
                                  {student.is_orphan && (
                                    <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-orange-100 text-orange-700">
                                      O
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Informations compactes */}
                              <div className="flex items-center justify-between text-xs text-gray-600">
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center gap-1">
                                    <Hash className="w-3 h-3" />
                                    {student.student_number}
                                  </span>
                                  <span>{student.age}ans</span>
                                  {student.coranic_class && (
                                    <span className="text-blue-600 font-medium truncate max-w-20">
                                      {student.coranic_class.name}
                                    </span>
                                  )}
                                </div>
                                
                                {student.balance !== undefined && (
                                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                    student.balance > 0 ? 'bg-red-50 text-red-600' : 
                                    student.balance < 0 ? 'bg-green-50 text-green-600' : 
                                    'bg-gray-50 text-gray-600'
                                  }`}>
                                    {student.balance > 0 ? `${Math.round(student.balance/1000)}K` : 
                                     student.balance < 0 ? `+${Math.round(Math.abs(student.balance)/1000)}K` : 
                                     'OK'}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <ArrowRight className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Bouton "Charger plus" */}
                  {!searchQuery.trim() && hasMore && (
                    <div className="p-2 border-t bg-gray-50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadMoreStudents();
                        }}
                        disabled={loading}
                        className="w-full py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-200"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            Chargement...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Charger plus
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Aucun étudiant trouvé</h3>
                  <p className="text-sm">
                    {searchQuery.trim() 
                      ? `Aucun résultat pour "${searchQuery}"` 
                      : 'Commencez à taper pour rechercher un étudiant'}
                  </p>
                  {searchQuery.trim() && (
                    <button
                      onClick={() => {
                        onSearchQueryChange('');
                        loadStudents('', 1);
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Effacer la recherche
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Étudiant sélectionné */}
        {selectedStudent && (
          <div className="mt-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {getStudentInitials(selectedStudent)}
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {getStudentDisplayName(selectedStudent)}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" />
                        {selectedStudent.student_number}
                      </span>
                      <span>{selectedStudent.age} ans</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        selectedStudent.status === 'interne' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedStudent.status === 'interne' ? 'Interne' : 'Externe'}
                      </span>
                      {selectedStudent.is_orphan && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          Orphelin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleStudentClear}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Informations supplémentaires */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {selectedStudent.coranic_class && (
                  <div className="bg-white/60 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                      <BookOpen className="w-4 h-4" />
                      <span className="font-medium">Classe</span>
                    </div>
                    <p className="text-gray-800 font-medium">{selectedStudent.coranic_class.name}</p>
                    {selectedStudent.coranic_class.level && (
                      <p className="text-gray-600 text-xs">Niveau: {selectedStudent.coranic_class.level}</p>
                    )}
                  </div>
                )}

                {selectedStudent.guardian_name && (
                  <div className="bg-white/60 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                      <User className="w-4 h-4" />
                      <span className="font-medium">Tuteur</span>
                    </div>
                    <p className="text-gray-800 font-medium truncate">{selectedStudent.guardian_name}</p>
                    {selectedStudent.guardian_phone && (
                      <p className="text-gray-600 text-xs flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {selectedStudent.guardian_phone}
                      </p>
                    )}
                  </div>
                )}

                <div className="bg-white/60 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-purple-600 mb-1">
                    <Hash className="w-4 h-4" />
                    <span className="font-medium">Solde</span>
                  </div>
                  <p className={`font-bold ${
                    selectedStudent.balance && selectedStudent.balance > 0 ? 'text-red-600' : 
                    selectedStudent.balance && selectedStudent.balance < 0 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {selectedStudent.balance !== undefined ? 
                      new Intl.NumberFormat('fr-GN', {
                        style: 'currency',
                        currency: 'GNF',
                        minimumFractionDigits: 0
                      }).format(selectedStudent.balance) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSearchPayment;