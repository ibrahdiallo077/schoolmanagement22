// server/config/database-init.js
const { query, tableExists } = require('./database');

const REQUIRED_TABLES = [
  'admin_users',
  'password_reset_tokens', 
  'refresh_tokens',
  'user_sessions',
  'activity_logs'
];

/**
 * Vérifier l'état de la base de données
 */
const checkDatabaseHealth = async () => {
  const health = {
    tables: {},
    adminExists: false,
    timestamp: new Date().toISOString()
  };
  
  try {
    // Vérifier les tables
    for (const tableName of REQUIRED_TABLES) {
      health.tables[tableName] = await tableExists(tableName);
    }
    
    // Vérifier l'admin
    const adminResult = await query(
      "SELECT COUNT(*) as count FROM admin_users WHERE role IN ('super_admin', 'admin') AND is_active = true"
    );
    health.adminExists = parseInt(adminResult.rows[0].count) > 0;
    
    return health;
    
  } catch (error) {
    health.error = error.message;
    return health;
  }
};

/**
 * Fonction principale d'initialisation
 */
const initializeDatabase = async () => {
  console.log('🔍 Vérification de la base de données...');
  
  try {
    // Vérifier les tables existantes
    const missingTables = [];
    
    for (const tableName of REQUIRED_TABLES) {
      const exists = await tableExists(tableName);
      
      if (exists) {
        console.log(`✅ Table existe: ${tableName}`);
      } else {
        console.log(`❌ Table manquante: ${tableName}`);
        missingTables.push(tableName);
      }
    }
    
    if (missingTables.length > 0) {
      console.warn(`⚠️ Tables manquantes détectées: ${missingTables.join(', ')}`);
      console.warn('💡 Veuillez exécuter la migration SQL manuellement');
      console.warn('   ou utiliser: psql -d ecole_moderne -f migration-safe.sql');
      return false;
    }
    
    console.log('✅ Toutes les tables requises sont présentes');
    return true;
    
  } catch (error) {
    console.error('💥 Erreur lors de la vérification:', error.message);
    return false;
  }
};

module.exports = {
  initializeDatabase,
  checkDatabaseHealth,
  REQUIRED_TABLES
};