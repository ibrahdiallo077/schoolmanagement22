// utils/validation.js

// === FONCTIONS DE VALIDATION DE BASE ===

// Validation d'email avec plusieurs niveaux
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  // Regex plus stricte pour l'email
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  // Vérifications supplémentaires
  if (email.length > 254) return false; // RFC 5321
  if (email.startsWith('.') || email.endsWith('.')) return false;
  if (email.includes('..')) return false;
  
  return emailRegex.test(email.toLowerCase());
};

// Validation de mot de passe fort avec détails
const isStrongPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  
  // Critères de mot de passe fort
  const minLength = 8;
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  
  return password.length >= minLength && 
         hasLowerCase && 
         hasUpperCase && 
         hasNumbers && 
         hasSpecialChar;
};

// Détails sur la force du mot de passe
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, feedback: ['Mot de passe requis'] };
  
  const feedback = [];
  let score = 0;
  
  // Longueur
  if (password.length < 8) {
    feedback.push('Au moins 8 caractères requis');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }
  
  // Minuscules
  if (!/[a-z]/.test(password)) {
    feedback.push('Au moins une lettre minuscule requise');
  } else {
    score += 1;
  }
  
  // Majuscules
  if (!/[A-Z]/.test(password)) {
    feedback.push('Au moins une lettre majuscule requise');
  } else {
    score += 1;
  }
  
  // Chiffres
  if (!/\d/.test(password)) {
    feedback.push('Au moins un chiffre requis');
  } else {
    score += 1;
  }
  
  // Caractères spéciaux
  if (!/[@$!%*?&]/.test(password)) {
    feedback.push('Au moins un caractère spécial requis (@$!%*?&)');
  } else {
    score += 1;
  }
  
  // Patterns dangereux
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Évitez les caractères répétés');
    score -= 1;
  }
  
  if (/123|abc|qwe|password|admin/i.test(password)) {
    feedback.push('Évitez les séquences communes');
    score -= 1;
  }
  
  return {
    score: Math.max(0, score),
    maxScore: 6,
    feedback: feedback.length > 0 ? feedback : ['Mot de passe fort'],
    isStrong: score >= 5 && feedback.length === 0
  };
};

// Validation de numéro de téléphone
const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  
  // Supprimer tous les espaces et caractères spéciaux pour la validation
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
  
  // Vérifier que ce ne sont que des chiffres
  if (!/^\d+$/.test(cleanPhone)) return false;
  
  // Longueur acceptable (8 à 15 chiffres)
  return cleanPhone.length >= 8 && cleanPhone.length <= 15;
};

// Validation de date avec plage acceptable
const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  
  // Vérifier que c'est une date valide
  if (isNaN(date.getTime())) return false;
  
  // Vérifier que la date n'est pas dans un futur trop lointain ou un passé trop ancien
  const now = new Date();
  const minDate = new Date(1900, 0, 1);
  const maxDate = new Date(now.getFullYear() + 100, 11, 31);
  
  return date >= minDate && date <= maxDate;
};

// Validation d'âge avec plage personnalisable
const isValidAge = (birthDate, minAge = 0, maxAge = 120) => {
  if (!isValidDate(birthDate)) return false;
  
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age >= minAge && age <= maxAge;
};

// Validation de rôle utilisateur
const isValidRole = (role) => {
  const validRoles = ['super_admin', 'admin', 'teacher', 'accountant'];
  return validRoles.includes(role);
};

// Validation de statut avec options personnalisables
const isValidStatus = (status, validStatuses = ['active', 'inactive']) => {
  return validStatuses.includes(status);
};

// Nettoyage et validation de texte
const sanitizeText = (text, maxLength = 255) => {
  if (typeof text !== 'string') return '';
  
  // Supprimer les caractères de contrôle et normaliser
  const cleaned = text
    .replace(/[\x00-\x1F\x7F]/g, '') // Caractères de contrôle
    .replace(/\s+/g, ' ') // Normaliser les espaces
    .trim();
  
  return cleaned.substring(0, maxLength);
};

// Validation de numéro d'étudiant
const isValidStudentNumber = (studentNumber) => {
  if (!studentNumber || typeof studentNumber !== 'string') return false;
  
  // Format: ET + 2 chiffres année + 4 chiffres séquentiels
  const studentNumberRegex = /^ET\d{6}$/;
  return studentNumberRegex.test(studentNumber);
};

// Validation de numéro d'employé
const isValidStaffNumber = (staffNumber) => {
  if (!staffNumber || typeof staffNumber !== 'string') return false;
  
  // Format: EMP + 2 chiffres année + 4 chiffres séquentiels
  const staffNumberRegex = /^EMP\d{6}$/;
  return staffNumberRegex.test(staffNumber);
};

// Validation d'URL
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// === MIDDLEWARES DE VALIDATION ===

// Créer une réponse d'erreur standardisée
const createValidationError = (errors, field = null) => {
  return {
    success: false,
    error: 'Données invalides',
    details: Array.isArray(errors) ? errors : [errors],
    field: field,
    code: 'VALIDATION_ERROR'
  };
};

// Middleware pour valider les données d'inscription
const validateSignUpData = (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const errors = [];

    // Validation email
    if (!email) {
      errors.push('Email requis');
    } else if (!isValidEmail(email)) {
      errors.push('Format d\'email invalide');
    }

    // Validation mot de passe
    if (!password) {
      errors.push('Mot de passe requis');
    } else if (!isStrongPassword(password)) {
      const strength = getPasswordStrength(password);
      errors.push(...strength.feedback);
    }

    // Validation prénom
    if (!firstName || firstName.trim().length < 2) {
      errors.push('Prénom valide requis (minimum 2 caractères)');
    }

    // Validation nom
    if (!lastName || lastName.trim().length < 2) {
      errors.push('Nom valide requis (minimum 2 caractères)');
    }

    if (errors.length > 0) {
      return res.status(400).json(createValidationError(errors));
    }

    // Nettoyer les données
    req.body.email = email.toLowerCase().trim();
    req.body.firstName = sanitizeText(firstName, 50);
    req.body.lastName = sanitizeText(lastName, 50);

    next();

  } catch (error) {
    console.error('💥 Erreur validation inscription:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erreur de validation des données',
      code: 'VALIDATION_INTERNAL_ERROR'
    });
  }
};

// Middleware pour valider les données de profil
const validateProfileData = (req, res, next) => {
  try {
    const { first_name, last_name, email } = req.body;
    const errors = [];

    // Validation prénom
    if (!first_name || first_name.trim().length < 2) {
      errors.push('Prénom valide requis (minimum 2 caractères)');
    }

    // Validation nom
    if (!last_name || last_name.trim().length < 2) {
      errors.push('Nom valide requis (minimum 2 caractères)');
    }

    // Validation email
    if (!email) {
      errors.push('Email requis');
    } else if (!isValidEmail(email)) {
      errors.push('Format d\'email invalide');
    }

    if (errors.length > 0) {
      return res.status(400).json(createValidationError(errors));
    }

    // Nettoyer les données
    req.body.first_name = sanitizeText(first_name, 50);
    req.body.last_name = sanitizeText(last_name, 50);
    req.body.email = email.toLowerCase().trim();

    next();

  } catch (error) {
    console.error('💥 Erreur validation profil:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erreur de validation des données',
      code: 'VALIDATION_INTERNAL_ERROR'
    });
  }
};

// Middleware pour valider les données d'étudiant
const validateStudentData = (req, res, next) => {
  try {
    const { first_name, last_name, birth_date, school_year_id } = req.body;
    const errors = [];

    // Validation prénom
    if (!first_name || first_name.trim().length < 2) {
      errors.push('Prénom valide requis');
    }

    // Validation nom
    if (!last_name || last_name.trim().length < 2) {
      errors.push('Nom valide requis');
    }

    // Validation date de naissance
    if (!birth_date) {
      errors.push('Date de naissance requise');
    } else if (!isValidDate(birth_date)) {
      errors.push('Date de naissance invalide');
    } else if (!isValidAge(birth_date, 3, 25)) {
      errors.push('Âge invalide (entre 3 et 25 ans)');
    }

    // Validation année scolaire
    if (!school_year_id || isNaN(parseInt(school_year_id))) {
      errors.push('Année scolaire valide requise');
    }

    if (errors.length > 0) {
      return res.status(400).json(createValidationError(errors));
    }

    // Nettoyer les données
    req.body.first_name = sanitizeText(first_name, 50);
    req.body.last_name = sanitizeText(last_name, 50);

    next();

  } catch (error) {
    console.error('💥 Erreur validation étudiant:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erreur de validation des données',
      code: 'VALIDATION_INTERNAL_ERROR'
    });
  }
};

// Middleware pour valider les données de personnel
const validateStaffData = (req, res, next) => {
  try {
    const { first_name, last_name, position } = req.body;
    const errors = [];

    // Validation prénom
    if (!first_name || first_name.trim().length < 2) {
      errors.push('Prénom valide requis');
    }

    // Validation nom
    if (!last_name || last_name.trim().length < 2) {
      errors.push('Nom valide requis');
    }

    // Validation poste
    if (!position || position.trim().length < 2) {
      errors.push('Poste valide requis');
    }

    if (errors.length > 0) {
      return res.status(400).json(createValidationError(errors));
    }

    // Nettoyer les données
    req.body.first_name = sanitizeText(first_name, 50);
    req.body.last_name = sanitizeText(last_name, 50);
    req.body.position = sanitizeText(position, 100);

    next();

  } catch (error) {
    console.error('💥 Erreur validation personnel:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erreur de validation des données',
      code: 'VALIDATION_INTERNAL_ERROR'
    });
  }
};

// Middleware pour valider les paramètres d'ID
const validateIdParam = (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide',
        code: 'INVALID_ID'
      });
    }

    req.params.id = id;
    next();

  } catch (error) {
    console.error('💥 Erreur validation ID:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erreur de validation de l\'ID',
      code: 'VALIDATION_INTERNAL_ERROR'
    });
  }
};

// Fonction utilitaire pour calculer l'âge
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Fonction pour générer un numéro d'étudiant
const generateStudentNumber = () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const randomNum = Math.floor(Math.random() * 9999);
  return `ET${year}${randomNum.toString().padStart(4, '0')}`;
};

// Fonction pour générer un numéro d'employé
const generateStaffNumber = () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const randomNum = Math.floor(Math.random() * 9999);
  return `EMP${year}${randomNum.toString().padStart(4, '0')}`;
};

module.exports = {
  // Fonctions de validation
  isValidEmail,
  isStrongPassword,
  getPasswordStrength,
  isValidPhone,
  isValidDate,
  isValidAge,
  isValidRole,
  isValidStatus,
  isValidStudentNumber,
  isValidStaffNumber,
  isValidUrl,
  sanitizeText,
  calculateAge,
  generateStudentNumber,
  generateStaffNumber,

  // Middlewares de validation
  validateSignUpData,
  validateProfileData,
  validateStudentData,
  validateStaffData,
  validateIdParam,
  
  // Utilitaires
  createValidationError
};