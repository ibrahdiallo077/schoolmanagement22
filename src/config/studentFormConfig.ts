// src/config/studentFormConfig.ts

export const STUDENT_FORM_CONFIG = {
  // Types de relations familiales
  relationshipTypes: [
    {
      value: 'pere',
      label: 'Père',
      icon: '👨'
    },
    {
      value: 'mere',
      label: 'Mère',
      icon: '👩'
    },
    {
      value: 'tuteur_legal',
      label: 'Tuteur légal',
      icon: '🛡️'
    },
    {
      value: 'grand_parent',
      label: 'Grand-parent',
      icon: '👴'
    },
    {
      value: 'oncle',
      label: 'Oncle',
      icon: '👨‍👩‍👧‍👦'
    },
    {
      value: 'tante',
      label: 'Tante',
      icon: '👨‍👩‍👧‍👦'
    },
    {
      value: 'frere',
      label: 'Frère',
      icon: '👨‍👩‍👧‍👦'
    },
    {
      value: 'soeur',
      label: 'Sœur',
      icon: '👨‍👩‍👧‍👦'
    },
    {
      value: 'autre',
      label: 'Autre',
      icon: '👤'
    }
  ],

  // Validation rules
  validation: {
    required: {
      first_name: 'Le prénom est obligatoire',
      last_name: 'Le nom est obligatoire',
      birth_date: 'La date de naissance est obligatoire',
      gender: 'Le genre est obligatoire',
      'guardian.first_name': 'Le prénom du tuteur est obligatoire',
      'guardian.last_name': 'Le nom du tuteur est obligatoire',
      'guardian.phone': 'Le téléphone du tuteur est obligatoire',
      'guardian.relationship': 'La relation avec le tuteur est obligatoire'
    },
    
    patterns: {
      phone: {
        pattern: /^(\+221|00221)?\s*[67]\d{8}$/,
        message: 'Format de téléphone invalide (ex: 623456789 ou +221623456789)'
      },
      email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Format d\'email invalide'
      }
    },

    age: {
      min: 3,
      max: 25,
      message: 'L\'âge doit être compris entre 3 et 25 ans'
    }
  },

  // Default values
  defaults: {
    status: 'externe',
    is_orphan: false,
    is_needy: false,
    notes: '',
    guardian: {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      address: '',
      relationship: ''
    }
  },

  // Form sections configuration
  sections: [
    {
      id: 'personal',
      title: 'Informations personnelles',
      label: 'Étudiant',
      icon: 'User',
      color: 'from-blue-500 to-indigo-600',
      description: 'Renseignez les informations de base'
    },
    {
      id: 'schooling',
      title: 'Scolarité',
      label: 'Classes',
      icon: 'BookOpen',
      color: 'from-emerald-500 to-green-600',
      description: 'Choisissez les classes et l\'année scolaire'
    },
    {
      id: 'guardian',
      title: 'Tuteur',
      label: 'Responsable',
      icon: 'Users',
      color: 'from-purple-500 to-violet-600',
      description: 'Contact principal et responsable légal'
    },
    {
      id: 'photo',
      title: 'Photo & Notes',
      label: 'Compléments',
      icon: 'Camera',
      color: 'from-pink-500 to-rose-600',
      description: 'Photo et informations complémentaires'
    },
    {
      id: 'summary',
      title: 'Résumé',
      label: 'Validation',
      icon: 'CheckCircle',
      color: 'from-green-500 to-emerald-600',
      description: 'Vérifiez avant de finaliser'
    }
  ]
};