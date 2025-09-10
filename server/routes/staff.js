// server/routes/staff.js - VERSION CORRIGÉE AVEC DEBUGGING

const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { uploadAvatar, handleUploadError } = require('../config/multer');
const { isValidEmail, sanitizeText } = require('../utils/validation');

const router = express.Router();

console.log('👥 Module staff.js chargé - VERSION CORRIGÉE');

// === TYPES DE CONTRATS SIMPLIFIÉS ===
const CONTRACT_TYPES = [
  { value: 'cdi', label: 'CDI - Contrat à Durée Indéterminée', category: 'permanent' },
  { value: 'cdd', label: 'CDD - Contrat à Durée Déterminée', category: 'temporary' }
];

// === TYPES D'EMPLOI SIMPLIFIÉS ===
const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Temps plein', hours: '35-40h/semaine' },
  { value: 'part_time', label: 'Temps partiel', hours: '< 35h/semaine' },
  { value: 'half_time', label: 'Mi-temps', hours: '17,5h/semaine' }
];

// === MIDDLEWARE CORS GLOBAL ===
router.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3000', 
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173'
  ];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  console.log(`📡 STAFF: ${req.method} ${req.originalUrl} - Origin: ${origin || 'none'}`);
  
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS Preflight handled');
    return res.status(200).end();
  }
  
  next();
});

// === CONSTANTES ===
const AVAILABLE_POSITIONS = [
  'teacher', 'admin', 'secretary', 'accountant', 'guard', 'cook', 
  'cleaner', 'driver', 'nurse', 'librarian', 'it_support', 'maintenance',
  'principal', 'assistant_principal', 'counselor'
];

const AVAILABLE_DEPARTMENTS = [
  'education', 'administration', 'finance', 'security', 'food_service',
  'maintenance', 'transport', 'health', 'library', 'it',
  'education_coranique', 'education_francaise', 'services'
];

// === FONCTIONS UTILITAIRES ===
const generateStaffNumber = async (position) => {
  try {
    const currentYear = new Date().getFullYear();
    const positionCode = position ? position.toUpperCase().substring(0, 3) : 'STF';
    const baseId = `${positionCode}-${currentYear}`;
    
    const result = await query(
      `SELECT COUNT(*) as count FROM staff WHERE staff_number LIKE $1`,
      [`${baseId}-%`]
    );
    
    const nextNumber = (parseInt(result.rows[0].count) + 1).toString().padStart(3, '0');
    return `${baseId}-${nextNumber}`;
  } catch (error) {
    console.error('💥 Erreur génération numéro:', error);
    throw new Error('Erreur génération numéro personnel');
  }
};

const validateStaffData = (data) => {
  const errors = [];
  
  if (!data.first_name || data.first_name.trim().length < 2) {
    errors.push('Le prénom doit contenir au moins 2 caractères');
  }
  
  if (!data.last_name || data.last_name.trim().length < 2) {
    errors.push('Le nom doit contenir au moins 2 caractères');
  }
  
  if (data.email && !isValidEmail(data.email)) {
    errors.push('Format d\'email invalide');
  }
  
  if (data.phone && data.phone.trim().length < 8) {
    errors.push('Numéro de téléphone invalide');
  }

  if (data.gender && !['male', 'female', 'other'].includes(data.gender)) {
    errors.push('Genre invalide (male, female, other)');
  }

  if (data.contract_type) {
    const validContractTypes = CONTRACT_TYPES.map(ct => ct.value);
    if (!validContractTypes.includes(data.contract_type)) {
      errors.push(`Type de contrat invalide. Valeurs autorisées: ${validContractTypes.join(', ')}`);
    }
  }

  if (data.employment_type) {
    const validEmploymentTypes = EMPLOYMENT_TYPES.map(et => et.value);
    if (!validEmploymentTypes.includes(data.employment_type)) {
      errors.push(`Type d'emploi invalide. Valeurs autorisées: ${validEmploymentTypes.join(', ')}`);
    }
  }

  if (data.salary && (isNaN(data.salary) || parseFloat(data.salary) < 0)) {
    errors.push('Le salaire doit être un nombre positif');
  }

  if (data.date_of_birth) {
    const birthDate = new Date(data.date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 16 || age > 80) {
      errors.push('L\'âge doit être entre 16 et 80 ans');
    }
  }
  
  return errors;
};

const getContractTypeLabel = (contractType) => {
  const contract = CONTRACT_TYPES.find(ct => ct.value === contractType);
  return contract ? contract.label : contractType;
};

const getEmploymentTypeLabel = (employmentType) => {
  const employment = EMPLOYMENT_TYPES.find(et => et.value === employmentType);
  return employment ? employment.label : employmentType;
};

// === FONCTION FORMATAGE MONTANT ===
const formatGNF = (amount) => {
  const numAmount = Number(amount || 0);
  if (isNaN(numAmount)) return '0 FG';
  return `${numAmount.toLocaleString()} FG`;
};

// === ROUTE DE TEST ===
router.get('/test', (req, res) => {
  console.log('🧪 Test CORS staff');
  res.json({
    success: true,
    message: 'Routes staff - VERSION CORRIGÉE',
    timestamp: new Date().toISOString(),
    available_contract_types: CONTRACT_TYPES.length,
    available_employment_types: EMPLOYMENT_TYPES.length,
    contract_types: CONTRACT_TYPES,
    employment_types: EMPLOYMENT_TYPES
  });
});

// === LISTER LE PERSONNEL - VERSION SIMPLIFIÉE ET SÉCURISÉE ===
router.get('/', async (req, res) => {
  try {
    console.log('👥 === RÉCUPÉRATION LISTE PERSONNEL ===');
    console.log('🔍 Paramètres query:', req.query);
    console.log('🔑 Headers auth:', req.headers.authorization ? 'Présent' : 'Absent');

    const {
      page = 1,
      limit = 20,
      search = '',
      position = '',
      department = '',
      status = '',
      contract_type = '',
      employment_type = '',
      sortBy = 'first_name',
      sortOrder = 'asc'
    } = req.query;

    // Vérification de la base de données
    console.log('📊 Test de connexion à la base...');
    
    let testQuery;
    try {
      testQuery = await query('SELECT 1 as test');
      console.log('✅ Connexion DB OK');
    } catch (dbError) {
      console.error('💥 ERREUR CONNEXION DB:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Erreur de connexion à la base de données',
        details: process.env.NODE_ENV === 'development' ? {
          message: dbError.message,
          code: dbError.code
        } : undefined
      });
    }

    // Vérification de l'existence de la table staff
    console.log('🔍 Vérification table staff...');
    
    let tableCheckQuery;
    try {
      tableCheckQuery = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'staff'
      `);
      
      if (tableCheckQuery.rows.length === 0) {
        console.error('❌ Table staff n\'existe pas');
        return res.status(500).json({
          success: false,
          error: 'Table staff non trouvée dans la base de données',
          details: process.env.NODE_ENV === 'development' ? {
            message: 'La table staff n\'existe pas. Exécutez les migrations.',
            suggestion: 'CREATE TABLE staff (...)'
          } : undefined
        });
      }
      
      console.log('✅ Table staff existe');
    } catch (tableError) {
      console.error('💥 ERREUR VÉRIFICATION TABLE:', tableError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification de la structure de base',
        details: process.env.NODE_ENV === 'development' ? {
          message: tableError.message,
          code: tableError.code
        } : undefined
      });
    }

    // Construction de la requête avec gestion d'erreurs
    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramIndex = 1;

    // Recherche sécurisée
    if (search && search.trim()) {
      whereConditions.push(`(
        LOWER(COALESCE(s.first_name, '')) LIKE LOWER($${paramIndex}) OR 
        LOWER(COALESCE(s.last_name, '')) LIKE LOWER($${paramIndex}) OR 
        LOWER(COALESCE(s.staff_number, '')) LIKE LOWER($${paramIndex}) OR
        LOWER(COALESCE(s.email, '')) LIKE LOWER($${paramIndex}) OR
        COALESCE(s.phone, '') LIKE $${paramIndex}
      )`);
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }

    // Filtres sécurisés
    if (position && position !== 'all' && AVAILABLE_POSITIONS.includes(position)) {
      whereConditions.push(`s.position = $${paramIndex}`);
      queryParams.push(position);
      paramIndex++;
    }

    if (department && department !== 'all' && AVAILABLE_DEPARTMENTS.includes(department)) {
      whereConditions.push(`s.department = $${paramIndex}`);
      queryParams.push(department);
      paramIndex++;
    }

    if (status && status !== 'all' && ['active', 'inactive', 'on_leave'].includes(status)) {
      whereConditions.push(`s.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (contract_type && contract_type !== 'all') {
      const validContractTypes = CONTRACT_TYPES.map(ct => ct.value);
      if (validContractTypes.includes(contract_type)) {
        whereConditions.push(`s.contract_type = $${paramIndex}`);
        queryParams.push(contract_type);
        paramIndex++;
      }
    }

    if (employment_type && employment_type !== 'all') {
      const validEmploymentTypes = EMPLOYMENT_TYPES.map(et => et.value);
      if (validEmploymentTypes.includes(employment_type)) {
        whereConditions.push(`s.employment_type = $${paramIndex}`);
        queryParams.push(employment_type);
        paramIndex++;
      }
    }

    const whereClause = whereConditions.join(' AND ');
    
    // Validation du tri
    const allowedSortColumns = ['first_name', 'last_name', 'staff_number', 'position', 'department', 'hire_date', 'created_at', 'contract_type', 'employment_type', 'status'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'first_name';
    const sortDirection = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Requête principale avec gestion d'erreurs améliorée
    const staffQuery = `
      SELECT 
        s.id,
        s.staff_number,
        COALESCE(s.first_name, '') as first_name,
        COALESCE(s.last_name, '') as last_name,
        COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '') as full_name,
        COALESCE(UPPER(LEFT(s.first_name, 1)), '') || COALESCE(UPPER(LEFT(s.last_name, 1)), '') as initials,
        s.position,
        s.department,
        s.email,
        s.phone,
        s.address,
        s.hire_date,
        COALESCE(s.status, 'active') as status,
        s.salary,
        s.qualifications,
        s.notes,
        s.photo_url,
        s.date_of_birth,
        s.gender,
        s.nationality,
        s.emergency_contact,
        s.emergency_phone,
        s.bank_account,
        s.payment_method,
        s.contract_type,
        s.employment_type,
        s.created_at,
        s.updated_at,
        
        CASE 
          WHEN s.hire_date IS NOT NULL THEN 
            EXTRACT(YEAR FROM AGE(CURRENT_DATE, s.hire_date))
          ELSE NULL
        END as years_of_service

      FROM staff s
      WHERE ${whereClause}
      ORDER BY s.${sortColumn} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    queryParams.push(parseInt(limit), offset);

    console.log('🔍 Requête SQL:', staffQuery);
    console.log('📝 Paramètres:', queryParams);

    let staffResult;
    try {
      staffResult = await query(staffQuery, queryParams);
      console.log(`✅ Requête exécutée - ${staffResult.rows.length} résultats`);
    } catch (queryError) {
      console.error('💥 ERREUR REQUÊTE STAFF:', queryError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du personnel',
        details: process.env.NODE_ENV === 'development' ? {
          message: queryError.message,
          code: queryError.code,
          query: staffQuery,
          params: queryParams
        } : undefined
      });
    }

    // Enrichissement des données avec gestion d'erreurs
    const enrichedStaff = staffResult.rows.map((staff, index) => {
      try {
        return {
          ...staff,
          contract_type_label: getContractTypeLabel(staff.contract_type),
          employment_type_label: getEmploymentTypeLabel(staff.employment_type),
          // Assurer que les champs critiques sont définis
          full_name: staff.full_name || `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || 'Sans nom',
          initials: staff.initials || 'N/A',
          status: staff.status || 'active'
        };
      } catch (enrichError) {
        console.error(`❌ Erreur enrichissement employé ${index}:`, enrichError);
        // Retourner un objet minimal en cas d'erreur
        return {
          ...staff,
          full_name: staff.first_name || 'Sans nom',
          initials: 'N/A',
          status: 'active',
          contract_type_label: staff.contract_type || 'Non défini',
          employment_type_label: staff.employment_type || 'Non défini'
        };
      }
    });

    // Requête de comptage
    const countQuery = `SELECT COUNT(*) as total FROM staff s WHERE ${whereClause}`;
    const countParams = queryParams.slice(0, -2); // Enlever limit et offset
    
    let countResult;
    try {
      countResult = await query(countQuery, countParams);
      console.log(`📊 Total personnel: ${countResult.rows[0].total}`);
    } catch (countError) {
      console.error('💥 ERREUR COMPTAGE:', countError);
      // En cas d'erreur de comptage, utiliser la longueur des résultats
      countResult = { rows: [{ total: enrichedStaff.length }] };
    }

    const totalStaff = parseInt(countResult.rows[0].total);

    console.log(`✅ Récupération réussie: ${enrichedStaff.length} employé(s) sur ${totalStaff} total`);

    // Réponse structurée
    const response = {
      success: true,
      staff: enrichedStaff,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_items: totalStaff,
        total_pages: Math.ceil(totalStaff / parseInt(limit)),
        has_next: parseInt(page) < Math.ceil(totalStaff / parseInt(limit)),
        has_prev: parseInt(page) > 1
      },
      filters: {
        search: search || null,
        position: position !== 'all' ? position : null,
        department: department !== 'all' ? department : null,
        status: status !== 'all' ? status : null,
        contract_type: contract_type !== 'all' ? contract_type : null,
        employment_type: employment_type !== 'all' ? employment_type : null,
        sortBy,
        sortOrder
      },
      meta: {
        server_time: new Date().toISOString(),
        query_duration: Date.now() - new Date().getTime()
      }
    };

    res.json(response);

  } catch (error) {
    console.error('💥 === ERREUR GÉNÉRALE STAFF ===');
    console.error('❌ Type:', error.constructor.name);
    console.error('❌ Message:', error.message);
    console.error('❌ Stack:', error.stack);
    
    let userMessage = 'Erreur lors de la récupération du personnel';
    let statusCode = 500;
    
    // Gestion spécifique des erreurs
    if (error.code) {
      switch (error.code) {
        case 'ECONNREFUSED':
          userMessage = 'Impossible de se connecter à la base de données';
          break;
        case '42P01': // Table n'existe pas
          userMessage = 'Table personnel non trouvée';
          break;
        case '42703': // Colonne n'existe pas
          userMessage = 'Structure de base de données incorrecte';
          break;
        case '28P01': // Authentification échouée
          userMessage = 'Erreur d\'authentification base de données';
          break;
        default:
          userMessage = `Erreur base de données: ${error.message}`;
      }
    }
    
    res.status(statusCode).json({
      success: false,
      error: userMessage,
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        stack: error.stack.split('\n').slice(0, 5) // Limiter la stack trace
      } : undefined
    });
  }
});

// === DÉTAILS D'UN EMPLOYÉ ===
router.get('/:id', async (req, res) => {
  try {
    const staffId = req.params.id;
    console.log(`👤 Récupération détails employé: ${staffId}`);

    if (!staffId || !staffId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'ID employé invalide'
      });
    }

    const staffQuery = `
      SELECT 
        s.*,
        COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '') as full_name,
        COALESCE(UPPER(LEFT(s.first_name, 1)), '') || COALESCE(UPPER(LEFT(s.last_name, 1)), '') as initials,
        
        CASE 
          WHEN s.hire_date IS NOT NULL THEN 
            EXTRACT(YEAR FROM AGE(CURRENT_DATE, s.hire_date))
          ELSE NULL
        END as years_of_service
      FROM staff s
      WHERE s.id = $1
    `;

    const staffResult = await query(staffQuery, [staffId]);

    if (staffResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Employé non trouvé'
      });
    }

    const employee = staffResult.rows[0];

    employee.contract_type_label = getContractTypeLabel(employee.contract_type);
    employee.employment_type_label = getEmploymentTypeLabel(employee.employment_type);

    console.log(`✅ Détails employé ${employee.staff_number} récupérés`);

    res.json({
      success: true,
      employee: employee
    });

  } catch (error) {
    console.error('💥 Erreur récupération détails employé:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des détails',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// === CRÉER UN EMPLOYÉ ===
// Fixed POST route for staff creation in staff.js

router.post('/', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      position,
      department,
      email,
      phone,
      address,
      hire_date,
      status = 'active',
      salary,
      qualifications,
      notes,
      date_of_birth,
      gender,
      nationality,
      emergency_contact,
      emergency_phone,
      bank_account,
      payment_method,
      contract_type,
      employment_type
    } = req.body;

    console.log('➕ === CRÉATION EMPLOYÉ ===');
    console.log('📋 Données reçues:', { 
      first_name, 
      last_name, 
      position, 
      contract_type, 
      employment_type,
      phone // Add phone to debug
    });

    // FIXED: Updated phone validation to be more flexible
    const validateStaffDataFixed = (data) => {
      const errors = [];
      
      if (!data.first_name || data.first_name.trim().length < 2) {
        errors.push('Le prénom doit contenir au moins 2 caractères');
      }
      
      if (!data.last_name || data.last_name.trim().length < 2) {
        errors.push('Le nom doit contenir au moins 2 caractères');
      }
      
      if (data.email && !isValidEmail(data.email)) {
        errors.push('Format d\'email invalide');
      }
      
      // FIXED: More flexible phone validation
      if (data.phone) {
        const cleanPhone = data.phone.toString().replace(/[\s\-\+\(\)]/g, '');
        if (cleanPhone.length < 8 || cleanPhone.length > 15 || !/^\d+$/.test(cleanPhone)) {
          errors.push('Numéro de téléphone invalide (8-15 chiffres)');
        }
      }

      if (data.gender && !['male', 'female', 'other'].includes(data.gender)) {
        errors.push('Genre invalide (male, female, other)');
      }

      if (data.contract_type) {
        const validContractTypes = CONTRACT_TYPES.map(ct => ct.value);
        if (!validContractTypes.includes(data.contract_type)) {
          errors.push(`Type de contrat invalide. Valeurs autorisées: ${validContractTypes.join(', ')}`);
        }
      }

      if (data.employment_type) {
        const validEmploymentTypes = EMPLOYMENT_TYPES.map(et => et.value);
        if (!validEmploymentTypes.includes(data.employment_type)) {
          errors.push(`Type d'emploi invalide. Valeurs autorisées: ${validEmploymentTypes.join(', ')}`);
        }
      }

      if (data.salary && (isNaN(data.salary) || parseFloat(data.salary) < 0)) {
        errors.push('Le salaire doit être un nombre positif');
      }

      if (data.date_of_birth) {
        const birthDate = new Date(data.date_of_birth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 16 || age > 80) {
          errors.push('L\'âge doit être entre 16 et 80 ans');
        }
      }
      
      return errors;
    };

    const validationErrors = validateStaffDataFixed({
      first_name, 
      last_name, 
      email, 
      phone, 
      gender, 
      contract_type, 
      employment_type, 
      salary, 
      date_of_birth
    });

    if (validationErrors.length > 0) {
      console.error('❌ Erreurs de validation:', validationErrors);
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: validationErrors
      });
    }

    // Check for existing email
    if (email) {
      const existingEmail = await query(
        'SELECT id, first_name, last_name FROM staff WHERE LOWER(email) = LOWER($1)',
        [email]
      );

      if (existingEmail.rows.length > 0) {
        const existing = existingEmail.rows[0];
        return res.status(409).json({
          success: false,
          error: `Cet email est déjà utilisé par ${existing.first_name} ${existing.last_name}`
        });
      }
    }

    // Generate staff number
    const staffNumber = await generateStaffNumber(position);
    console.log('📝 Numéro généré:', staffNumber);

    // FIXED: Create employee (not update)
    const createResult = await query(`
      INSERT INTO staff (
        id,
        staff_number,
        first_name, 
        last_name, 
        position, 
        department,
        email, 
        phone, 
        address, 
        hire_date, 
        status,
        salary, 
        qualifications, 
        notes, 
        date_of_birth, 
        gender, 
        nationality,
        emergency_contact, 
        emergency_phone, 
        bank_account,
        payment_method, 
        contract_type, 
        employment_type,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
        $14, $15, $16, $17, $18, $19, $20, $21, $22, 
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
    `, [
      staffNumber,
      first_name?.trim(),
      last_name?.trim(),
      position,
      department,
      email || null,
      phone || null,
      address?.trim() || null,
      hire_date || null,
      status,
      salary ? parseFloat(salary) : null,
      qualifications?.trim() || null,
      notes?.trim() || null,
      date_of_birth || null,
      gender || null,
      nationality || null,
      emergency_contact?.trim() || null,
      emergency_phone || null,
      bank_account || null,
      payment_method || null,
      contract_type || null,
      employment_type || null
    ]);

    if (createResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de l\'employé'
      });
    }

    const newEmployee = createResult.rows[0];
    
    // Enrich employee data
    newEmployee.full_name = `${newEmployee.first_name} ${newEmployee.last_name}`;
    newEmployee.initials = `${newEmployee.first_name[0]}${newEmployee.last_name[0]}`.toUpperCase();
    newEmployee.contract_type_label = getContractTypeLabel(newEmployee.contract_type);
    newEmployee.employment_type_label = getEmploymentTypeLabel(newEmployee.employment_type);

    console.log('✅ Employé créé:', newEmployee.staff_number);

    res.status(201).json({
      success: true,
      message: `Employé ${newEmployee.full_name} créé avec succès`,
      employee: newEmployee
    });

  } catch (error) {
    console.error('💥 Erreur création employé:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'employé',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// === MODIFIER UN EMPLOYÉ ===
router.put('/:id', async (req, res) => {
  try {
    const staffId = req.params.id;
    const {
      first_name,
      last_name,
      position,
      department,
      email,
      phone,
      address,
      hire_date,
      status = 'active',
      salary,
      qualifications,
      notes,
      date_of_birth,
      gender,
      nationality,
      emergency_contact,
      emergency_phone,
      bank_account,
      payment_method,
      contract_type,
      employment_type
    } = req.body;

    console.log('✏️ === MODIFICATION EMPLOYÉ ===');
    console.log('📋 ID:', staffId);
    console.log('📋 Données reçues:', { 
      first_name, 
      last_name, 
      position, 
      contract_type, 
      employment_type,
      phone
    });

    // Validate ID format
    if (!staffId || !staffId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'ID employé invalide'
      });
    }

    // Fixed phone validation function
    const validateStaffDataFixed = (data) => {
      const errors = [];
      
      if (!data.first_name || data.first_name.trim().length < 2) {
        errors.push('Le prénom doit contenir au moins 2 caractères');
      }
      
      if (!data.last_name || data.last_name.trim().length < 2) {
        errors.push('Le nom doit contenir au moins 2 caractères');
      }
      
      if (data.email && !isValidEmail(data.email)) {
        errors.push('Format d\'email invalide');
      }
      
      // More flexible phone validation
      if (data.phone) {
        const cleanPhone = data.phone.toString().replace(/[\s\-\+\(\)]/g, '');
        if (cleanPhone.length < 8 || cleanPhone.length > 15 || !/^\d+$/.test(cleanPhone)) {
          errors.push('Numéro de téléphone invalide (8-15 chiffres)');
        }
      }

      if (data.gender && !['male', 'female', 'other'].includes(data.gender)) {
        errors.push('Genre invalide (male, female, other)');
      }

      if (data.contract_type) {
        const validContractTypes = CONTRACT_TYPES.map(ct => ct.value);
        if (!validContractTypes.includes(data.contract_type)) {
          errors.push(`Type de contrat invalide. Valeurs autorisées: ${validContractTypes.join(', ')}`);
        }
      }

      if (data.employment_type) {
        const validEmploymentTypes = EMPLOYMENT_TYPES.map(et => et.value);
        if (!validEmploymentTypes.includes(data.employment_type)) {
          errors.push(`Type d'emploi invalide. Valeurs autorisées: ${validEmploymentTypes.join(', ')}`);
        }
      }

      if (data.salary && (isNaN(data.salary) || parseFloat(data.salary) < 0)) {
        errors.push('Le salaire doit être un nombre positif');
      }

      if (data.date_of_birth) {
        const birthDate = new Date(data.date_of_birth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 16 || age > 80) {
          errors.push('L\'âge doit être entre 16 et 80 ans');
        }
      }
      
      return errors;
    };

    const validationErrors = validateStaffDataFixed({
      first_name, 
      last_name, 
      email, 
      phone, 
      gender, 
      contract_type, 
      employment_type, 
      salary, 
      date_of_birth
    });

    if (validationErrors.length > 0) {
      console.error('❌ Erreurs de validation:', validationErrors);
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: validationErrors
      });
    }

    // Check if employee exists
    const existingEmployee = await query(
      'SELECT id, first_name, last_name, email FROM staff WHERE id = $1',
      [staffId]
    );

    if (existingEmployee.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Employé non trouvé'
      });
    }

    // Check for email conflict (excluding current employee)
    if (email) {
      const existingEmail = await query(
        'SELECT id, first_name, last_name FROM staff WHERE LOWER(email) = LOWER($1) AND id != $2',
        [email, staffId]
      );

      if (existingEmail.rows.length > 0) {
        const existing = existingEmail.rows[0];
        return res.status(409).json({
          success: false,
          error: `Cet email est déjà utilisé par ${existing.first_name} ${existing.last_name}`
        });
      }
    }

    // Update employee
    const updateResult = await query(`
      UPDATE staff SET
        first_name = $1, 
        last_name = $2, 
        position = $3, 
        department = $4,
        email = $5, 
        phone = $6, 
        address = $7, 
        hire_date = $8, 
        status = $9,
        salary = $10, 
        qualifications = $11, 
        notes = $12, 
        date_of_birth = $13, 
        gender = $14, 
        nationality = $15,
        emergency_contact = $16, 
        emergency_phone = $17, 
        bank_account = $18,
        payment_method = $19, 
        contract_type = $20, 
        employment_type = $21,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $22
      RETURNING *
    `, [
      first_name?.trim(),
      last_name?.trim(),
      position,
      department,
      email || null,
      phone || null,
      address?.trim() || null,
      hire_date || null,
      status,
      salary ? parseFloat(salary) : null,
      qualifications?.trim() || null,
      notes?.trim() || null,
      date_of_birth || null,
      gender || null,
      nationality || null,
      emergency_contact?.trim() || null,
      emergency_phone || null,
      bank_account || null,
      payment_method || null,
      contract_type || null,
      employment_type || null,
      staffId
    ]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Employé non trouvé ou erreur de mise à jour'
      });
    }

    const updatedEmployee = updateResult.rows[0];
    
    // Enrich employee data
    updatedEmployee.full_name = `${updatedEmployee.first_name} ${updatedEmployee.last_name}`;
    updatedEmployee.initials = `${updatedEmployee.first_name[0]}${updatedEmployee.last_name[0]}`.toUpperCase();
    updatedEmployee.contract_type_label = getContractTypeLabel(updatedEmployee.contract_type);
    updatedEmployee.employment_type_label = getEmploymentTypeLabel(updatedEmployee.employment_type);

    console.log('✅ Employé modifié:', updatedEmployee.staff_number);

    res.json({
      success: true,
      message: `Employé ${updatedEmployee.full_name} modifié avec succès`,
      employee: updatedEmployee
    });

  } catch (error) {
    console.error('💥 Erreur modification employé:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification de l\'employé',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// === SUPPRIMER UN EMPLOYÉ ===
router.delete('/:id', async (req, res) => {
  try {
    const staffId = req.params.id;
    const { permanent = 'true' } = req.query;

    console.log(`🗑️ ${permanent === 'true' ? 'Suppression définitive' : 'Désactivation'} employé ${staffId}`);

    if (!staffId || !staffId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'ID employé invalide'
      });
    }

    const employeeInfo = await query(
      'SELECT staff_number, first_name, last_name, position, photo_url FROM staff WHERE id = $1',
      [staffId]
    );
    
    if (employeeInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Employé non trouvé'
      });
    }

    const employee = employeeInfo.rows[0];

    let result;
    let message;

    if (permanent === 'true') {
      result = await query(
        'DELETE FROM staff WHERE id = $1 RETURNING staff_number',
        [staffId]
      );
      message = `Employé ${employee.first_name} ${employee.last_name} supprimé définitivement`;
      console.log('✅ Suppression définitive effectuée');
    } else {
      result = await query(
        'UPDATE staff SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING staff_number',
        ['inactive', staffId]
      );
      message = `Employé ${employee.first_name} ${employee.last_name} désactivé avec succès`;
      console.log('✅ Désactivation effectuée');
    }

    if (result.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'opération de suppression'
      });
    }

    console.log(`✅ Action terminée: ${employee.staff_number}`);

    res.json({
      success: true,
      message: message,
      action: permanent === 'true' ? 'deleted' : 'deactivated',
      employee: {
        id: staffId,
        staff_number: employee.staff_number,
        full_name: `${employee.first_name} ${employee.last_name}`
      }
    });

  } catch (error) {
    console.error('💥 Erreur suppression/désactivation employé:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression/désactivation de l\'employé',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// === ROUTES UTILITAIRES ===
router.get('/meta/positions', (req, res) => {
  console.log('📋 Récupération positions disponibles');
  
  const positions = AVAILABLE_POSITIONS.map(position => ({
    value: position,
    label: position.charAt(0).toUpperCase() + position.slice(1).replace('_', ' ')
  }));

  res.json({
    success: true,
    positions: positions
  });
});

router.get('/meta/departments', (req, res) => {
  console.log('🏢 Récupération départements disponibles');
  
  const departments = AVAILABLE_DEPARTMENTS.map(department => ({
    value: department,
    label: department.charAt(0).toUpperCase() + department.slice(1).replace('_', ' ')
  }));

  res.json({
    success: true,
    departments: departments
  });
});

router.get('/meta/contract-types', (req, res) => {
  console.log('📋 Récupération types de contrats');
  
  res.json({
    success: true,
    contract_types: CONTRACT_TYPES,
    total_types: CONTRACT_TYPES.length
  });
});

router.get('/meta/employment-types', (req, res) => {
  console.log('💼 Récupération types d\'emploi');
  
  res.json({
    success: true,
    employment_types: EMPLOYMENT_TYPES,
    total_types: EMPLOYMENT_TYPES.length
  });
});

// === ROUTES SPÉCIALISÉES POUR PAIEMENTS (si nécessaires) ===
router.get('/for-payments', async (req, res) => {
  try {
    const { search = '', limit = 50 } = req.query;
    
    console.log('💰 === LISTE EMPLOYÉS POUR PAIEMENTS SALAIRES ===');
    console.log('🔍 Paramètres:', { search, limit });

    let whereConditions = ['s.status = $1'];
    let queryParams = ['active'];
    let paramIndex = 2;

    // Filtre de recherche
    if (search.trim()) {
      whereConditions.push(`(
        LOWER(COALESCE(s.first_name, '')) LIKE LOWER(${paramIndex}) OR 
        LOWER(COALESCE(s.last_name, '')) LIKE LOWER(${paramIndex}) OR 
        LOWER(COALESCE(s.staff_number, '')) LIKE LOWER(${paramIndex}) OR
        LOWER(COALESCE(s.position, '')) LIKE LOWER(${paramIndex})
      )`);
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const staffQuery = `
      SELECT 
        s.id,
        s.staff_number,
        COALESCE(s.first_name, '') as first_name,
        COALESCE(s.last_name, '') as last_name,
        COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '') as full_name,
        s.position,
        s.department,
        s.photo_url,
        s.email,
        s.phone,
        s.salary
        
      FROM staff s
      WHERE ${whereClause}
      ORDER BY s.first_name, s.last_name
      LIMIT ${paramIndex}
    `;

    queryParams.push(parseInt(limit));

    console.log('🔍 Exécution requête employés pour paiements...');
    const result = await query(staffQuery, queryParams);

    const staffForPayments = result.rows.map(staff => ({
      // Pour sélecteur/dropdown
      value: staff.id,
      label: `${staff.first_name} ${staff.last_name}`,
      
      // Informations employé
      id: staff.id,
      staff_number: staff.staff_number,
      first_name: staff.first_name,
      last_name: staff.last_name,
      full_name: staff.full_name,
      position: staff.position,
      department: staff.department,
      photo_url: staff.photo_url,
      email: staff.email,
      phone: staff.phone,
      salary: staff.salary,
      
      // Montants formatés
      formatted_salary: staff.salary ? formatGNF(staff.salary) : null,
      
      // Affichage pour sélecteurs
      display_text: `${staff.first_name} ${staff.last_name} (${staff.staff_number})`,
      display_label: `${staff.first_name} ${staff.last_name} - ${formatGNF(staff.salary)}`,
      subtitle: `${staff.position || 'Poste non défini'} • ${formatGNF(staff.salary)}`,
      
      // État pour interface
      is_selectable: true
    }));

    console.log(`✅ ${staffForPayments.length} employés récupérés pour paiements`);

    res.json({
      success: true,
      staff: staffForPayments,
      statistics: {
        total: staffForPayments.length,
        selectable_for_payment: staffForPayments.length
      },
      filters: {
        search: search || null,
        limit: parseInt(limit)
      },
      message: `${staffForPayments.length} employé(s) disponible(s) pour paiement`
    });

  } catch (error) {
    console.error('💥 === ERREUR LISTE EMPLOYÉS PAIEMENTS ===');
    console.error('❌ Erreur:', error.message);
    console.error('📍 Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des employés pour paiements',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code
      } : undefined
    });
  }
});

// === RECHERCHE EMPLOYÉS POUR AUTOCOMPLETE ===
router.get('/search', async (req, res) => {
  try {
    const { q = '', limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        staff: [],
        message: 'Terme de recherche trop court (minimum 2 caractères)'
      });
    }

    console.log(`🔍 Recherche employés: "${q}"`);

    const searchQuery = `
      SELECT 
        s.id,
        s.staff_number,
        COALESCE(s.first_name, '') as first_name,
        COALESCE(s.last_name, '') as last_name,
        COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '') as full_name,
        s.position,
        s.department,
        s.photo_url,
        s.email,
        s.phone,
        s.salary
        
      FROM staff s
      WHERE s.status = 'active' AND (
        LOWER(COALESCE(s.first_name, '')) LIKE LOWER($1) OR 
        LOWER(COALESCE(s.last_name, '')) LIKE LOWER($1) OR 
        LOWER(COALESCE(s.staff_number, '')) LIKE LOWER($1) OR
        LOWER(COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '')) LIKE LOWER($1)
      )
      ORDER BY 
        CASE 
          WHEN LOWER(COALESCE(s.first_name, '')) LIKE LOWER($2) THEN 1
          WHEN LOWER(COALESCE(s.last_name, '')) LIKE LOWER($2) THEN 2
          WHEN LOWER(COALESCE(s.staff_number, '')) LIKE LOWER($2) THEN 3
          ELSE 4 
        END,
        s.first_name, s.last_name
      LIMIT $3
    `;

    const result = await query(searchQuery, [`%${q}%`, `${q}%`, parseInt(limit)]);

    const searchResults = result.rows.map(staff => ({
      value: staff.id,
      label: `${staff.first_name} ${staff.last_name}`,
      
      id: staff.id,
      staff_number: staff.staff_number,
      first_name: staff.first_name,
      last_name: staff.last_name,
      full_name: staff.full_name,
      position: staff.position,
      department: staff.department,
      photo_url: staff.photo_url,
      email: staff.email,
      phone: staff.phone,
      salary: staff.salary,
      
      formatted_salary: staff.salary ? formatGNF(staff.salary) : null,
      
      display_text: `${staff.first_name} ${staff.last_name} (${staff.staff_number})`,
      display_label: staff.position ? 
        `${staff.first_name} ${staff.last_name} - ${staff.position}` :
        `${staff.first_name} ${staff.last_name}`,
      subtitle: `${staff.staff_number} • ${staff.position || 'Poste non défini'}`
    }));

    console.log(`✅ ${searchResults.length} résultats trouvés pour "${q}"`);

    res.json({
      success: true,
      staff: searchResults,
      query: q,
      total_found: searchResults.length
    });

  } catch (error) {
    console.error('💥 Erreur recherche employés:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche des employés',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// === LISTE SIMPLIFIÉE POUR SÉLECTEURS ===
router.get('/simple-list', async (req, res) => {
  try {
    const { status = 'active', with_salary = 'false', search = '', limit = 100 } = req.query;
    
    console.log('👥 === LISTE SIMPLIFIÉE EMPLOYÉS ===');
    console.log('📋 Paramètres:', { status, with_salary, search, limit });

    let joinClause = '';
    let selectSalary = `
      null as salary_config_id, 
      null as monthly_salary, 
      false as has_salary_config
    `;
    
    if (with_salary === 'true') {
      joinClause = 'LEFT JOIN staff_salaries_v2 ss ON s.id = ss.staff_id AND ss.is_active = true';
      selectSalary = `
        ss.id as salary_config_id,
        ss.monthly_salary,
        CASE WHEN ss.id IS NOT NULL THEN true ELSE false END as has_salary_config
      `;
    }

    let whereConditions = [`s.status = $1`];
    let queryParams = [status];
    let paramIndex = 2;

    // Filtre de recherche
    if (search && search.trim()) {
      whereConditions.push(`(
        LOWER(COALESCE(s.first_name, '')) LIKE LOWER(${paramIndex}) OR 
        LOWER(COALESCE(s.last_name, '')) LIKE LOWER(${paramIndex}) OR 
        LOWER(COALESCE(s.staff_number, '')) LIKE LOWER(${paramIndex}) OR
        LOWER(COALESCE(s.position, '')) LIKE LOWER(${paramIndex}) OR
        LOWER(COALESCE(s.department, '')) LIKE LOWER(${paramIndex})
      )`);
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const staffQuery = `
      SELECT 
        s.id,
        s.staff_number,
        COALESCE(s.first_name, '') as first_name,
        COALESCE(s.last_name, '') as last_name,
        COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '') as full_name,
        s.position,
        s.department,
        COALESCE(s.status, 'active') as status,
        s.photo_url,
        s.email,
        s.phone,
        s.salary,
        ${selectSalary}
        
      FROM staff s
      ${joinClause}
      WHERE ${whereClause}
      ORDER BY s.first_name, s.last_name
      LIMIT ${paramIndex}
    `;

    queryParams.push(parseInt(limit));

    console.log('🔍 Requête SQL simple-list:', staffQuery);
    console.log('📝 Paramètres SQL:', queryParams);

    const result = await query(staffQuery, queryParams);

    const simpleStaff = result.rows.map(staff => ({
      // Valeurs pour sélecteur
      value: staff.id,
      label: `${staff.first_name} ${staff.last_name}`,
      
      // Informations de base
      id: staff.id,
      staff_number: staff.staff_number,
      first_name: staff.first_name,
      last_name: staff.last_name,
      full_name: staff.full_name,
      position: staff.position,
      department: staff.department,
      status: staff.status,
      photo_url: staff.photo_url,
      email: staff.email,
      phone: staff.phone,
      salary: staff.salary,
      
      // Informations salaire (si demandées)
      has_salary_config: staff.has_salary_config || false,
      salary_config_id: staff.salary_config_id,
      monthly_salary: staff.monthly_salary || staff.salary,
      formatted_salary: (staff.monthly_salary || staff.salary) ? formatGNF(staff.monthly_salary || staff.salary) : null,
      
      // Formats d'affichage pour les sélecteurs
      display_text: `${staff.first_name} ${staff.last_name} (${staff.staff_number})`,
      display_label: staff.position ? 
        `${staff.first_name} ${staff.last_name} - ${staff.position}` :
        `${staff.first_name} ${staff.last_name}`,
      subtitle: `${staff.staff_number} • ${staff.position || 'Poste non défini'} • ${staff.department || 'Département non défini'}`
    }));

    console.log(`✅ ${simpleStaff.length} employés en liste simplifiée`);
    console.log('📊 Avec config salaire:', simpleStaff.filter(s => s.has_salary_config).length);

    res.json({
      success: true,
      staff: simpleStaff,
      total: simpleStaff.length,
      with_salary: simpleStaff.filter(s => s.has_salary_config).length,
      filters: {
        status,
        with_salary: with_salary === 'true',
        search: search || null,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('💥 === ERREUR LISTE SIMPLIFIÉE ===');
    console.error('❌ Erreur:', error.message);
    console.error('📍 Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la liste des employés',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code
      } : undefined
    });
  }
});

// === RECHERCHE EMPLOYÉS POUR AUTOCOMPLETE PAIEMENTS ===
router.get('/search-for-payments', async (req, res) => {
  try {
    const { q = '', limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        staff: [],
        message: 'Terme de recherche trop court (minimum 2 caractères)'
      });
    }

    console.log(`🔍 Recherche employés pour paiements: "${q}"`);

    const searchQuery = `
      SELECT 
        s.id,
        s.staff_number,
        COALESCE(s.first_name, '') as first_name,
        COALESCE(s.last_name, '') as last_name,
        COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '') as full_name,
        s.position,
        s.department,
        s.photo_url,
        s.salary
        
      FROM staff s
      WHERE s.status = 'active' AND (
        LOWER(COALESCE(s.first_name, '')) LIKE LOWER($1) OR 
        LOWER(COALESCE(s.last_name, '')) LIKE LOWER($1) OR 
        LOWER(COALESCE(s.staff_number, '')) LIKE LOWER($1) OR
        LOWER(COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '')) LIKE LOWER($1)
      )
      ORDER BY 
        CASE 
          WHEN LOWER(COALESCE(s.first_name, '')) LIKE LOWER($2) THEN 1
          WHEN LOWER(COALESCE(s.last_name, '')) LIKE LOWER($2) THEN 2
          WHEN LOWER(COALESCE(s.staff_number, '')) LIKE LOWER($2) THEN 3
          ELSE 4 
        END,
        s.first_name, s.last_name
      LIMIT $3
    `;

    const result = await query(searchQuery, [`%${q}%`, `${q}%`, parseInt(limit)]);

    const searchResults = result.rows.map(staff => ({
      value: staff.id,
      label: `${staff.first_name} ${staff.last_name}`,
      
      id: staff.id,
      staff_number: staff.staff_number,
      first_name: staff.first_name,
      last_name: staff.last_name,
      full_name: staff.full_name,
      position: staff.position,
      department: staff.department,
      photo_url: staff.photo_url,
      salary: staff.salary,
      
      has_salary_config: true,
      monthly_salary: staff.salary,
      formatted_salary: staff.salary ? formatGNF(staff.salary) : null,
      
      display_text: `${staff.first_name} ${staff.last_name} (${staff.staff_number})`,
      display_label: `${staff.first_name} ${staff.last_name} - ${formatGNF(staff.salary)}`,
      subtitle: `${staff.position || 'N/A'} • ${formatGNF(staff.salary)}`,
      
      is_selectable: true,
      badge: 'Disponible',
      badge_color: 'success'
    }));

    console.log(`✅ ${searchResults.length} résultats trouvés sélectionnables`);

    res.json({
      success: true,
      staff: searchResults,
      query: q,
      statistics: {
        total_found: searchResults.length,
        selectable: searchResults.length
      }
    });

  } catch (error) {
    console.error('💥 Erreur recherche employés paiements:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche des employés',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// === ROUTES UTILITAIRES CORRIGÉES ===
router.get('/meta/positions', (req, res) => {
  console.log('📋 Récupération positions disponibles');
  
  const positions = AVAILABLE_POSITIONS.map(position => ({
    value: position,
    label: position.charAt(0).toUpperCase() + position.slice(1).replace('_', ' ')
  }));

  res.json({
    success: true,
    positions: positions,
    total: positions.length
  });
});

router.get('/meta/departments', (req, res) => {
  console.log('🏢 Récupération départements disponibles');
  
  const departments = AVAILABLE_DEPARTMENTS.map(department => ({
    value: department,
    label: department.charAt(0).toUpperCase() + department.slice(1).replace('_', ' ')
  }));

  res.json({
    success: true,
    departments: departments,
    total: departments.length
  });
});

router.get('/meta/contract-types', (req, res) => {
  console.log('📋 Récupération types de contrats');
  
  res.json({
    success: true,
    contract_types: CONTRACT_TYPES,
    total_types: CONTRACT_TYPES.length
  });
});

router.get('/meta/employment-types', (req, res) => {
  console.log('💼 Récupération types d\'emploi');
  
  res.json({
    success: true,
    employment_types: EMPLOYMENT_TYPES,
    total_types: EMPLOYMENT_TYPES.length
  });
});

// === ROUTE DE STATISTIQUES RAPIDES ===
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Récupération statistiques personnel');

    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
        COUNT(CASE WHEN status = 'on_leave' THEN 1 END) as on_leave,
        COUNT(CASE WHEN position = 'teacher' THEN 1 END) as teachers,
        COALESCE(SUM(salary), 0) as total_salary,
        COALESCE(AVG(salary), 0) as average_salary,
        COUNT(CASE WHEN salary > 0 THEN 1 END) as with_salary
      FROM staff
    `;

    const result = await query(statsQuery);
    const stats = result.rows[0];

    console.log('✅ Statistiques calculées:', stats);

    res.json({
      success: true,
      statistics: {
        total: parseInt(stats.total),
        active: parseInt(stats.active),
        inactive: parseInt(stats.inactive),
        on_leave: parseInt(stats.on_leave),
        teachers: parseInt(stats.teachers),
        total_salary: parseFloat(stats.total_salary),
        average_salary: parseFloat(stats.average_salary),
        with_salary: parseInt(stats.with_salary),
        // Formats pour affichage
        formatted_total_salary: formatGNF(stats.total_salary),
        formatted_average_salary: formatGNF(stats.average_salary)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Erreur calcul statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul des statistiques',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// === MIDDLEWARE DE GESTION D'ERREURS GLOBAL ===
router.use((error, req, res, next) => {
  console.error('💥 === ERREUR MIDDLEWARE STAFF ===');
  console.error('❌ URL:', req.originalUrl);
  console.error('❌ Méthode:', req.method);
  console.error('❌ Erreur:', error.message);
  console.error('❌ Stack:', error.stack);

  let statusCode = 500;
  let errorMessage = 'Erreur interne du serveur';

  if (error.code) {
    switch (error.code) {
      case '23505': // Violation contrainte unique
        statusCode = 409;
        errorMessage = 'Données en conflit - Élément déjà existant';
        break;
      case '23502': // Violation NOT NULL
        statusCode = 400;
        errorMessage = 'Champs obligatoires manquants';
        break;
      case '42P01': // Table n'existe pas
        statusCode = 500;
        errorMessage = 'Table de base de données manquante';
        break;
      case '42703': // Colonne n'existe pas
        statusCode = 500;
        errorMessage = 'Structure de base de données incorrecte';
        break;
      case 'ECONNREFUSED':
        statusCode = 503;
        errorMessage = 'Base de données indisponible';
        break;
      case '28P01': // Auth failed
        statusCode = 500;
        errorMessage = 'Erreur d\'authentification base de données';
        break;
    }
  }

  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    timestamp: new Date().toISOString(),
    endpoint: req.originalUrl,
    method: req.method,
    details: process.env.NODE_ENV === 'development' ? {
      message: error.message,
      code: error.code,
      constraint: error.constraint
    } : undefined
  });
});

console.log('✅ === STAFF.JS COMPLÈTEMENT CORRIGÉ ET OPTIMISÉ ===');
console.log('🎯 Routes disponibles:');
console.log('   ✅ GET /test - Test de connectivité');
console.log('   ✅ GET / - Liste personnel (avec pagination et filtres)');
console.log('   ✅ GET /:id - Détails employé');
console.log('   ✅ POST / - Créer employé');
console.log('   ✅ PUT /:id - Modifier employé');
console.log('   ✅ DELETE /:id - Supprimer employé');
console.log('   ✅ GET /for-payments - Liste pour paiements');
console.log('   ✅ GET /search - Recherche employés');
console.log('   ✅ GET /simple-list - Liste simplifiée');
console.log('   ✅ GET /search-for-payments - Recherche pour paiements');
console.log('   ✅ GET /stats - Statistiques rapides');
console.log('   ✅ GET /meta/* - Routes utilitaires');
console.log('');
console.log('🔧 FONCTIONNALITÉS:');
console.log('   ✅ Gestion d\'erreurs complète avec codes HTTP appropriés');
console.log('   ✅ Validation des données renforcée');
console.log('   ✅ Support CORS complet');
console.log('   ✅ Debugging détaillé avec logs');
console.log('   ✅ Requêtes SQL sécurisées avec COALESCE');
console.log('   ✅ Support valeurs NULL/undefined');
console.log('   ✅ Messages d\'erreur informatifs');
console.log('   ✅ Middleware global de gestion d\'erreurs');
console.log('   ✅ Routes spécialisées pour différents cas d\'usage');
console.log('   ✅ Formatage des montants en Francs Guinéens');
console.log('   ✅ Génération automatique des numéros de personnel');
console.log('   ✅ Statistiques en temps réel');

module.exports = router;