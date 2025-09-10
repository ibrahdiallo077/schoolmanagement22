// config/database.js
const { Pool } = require('pg');

// Configuration PostgreSQL avec gestion d'erreurs
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecole_moderne',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Gestion des erreurs de connexion
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Gestion des événements de connexion
pool.on('connect', (client) => {
  console.log('✅ Nouvelle connexion PostgreSQL établie');
});

pool.on('acquire', (client) => {
  console.log('🔗 Client PostgreSQL acquis du pool');
});

pool.on('error', (err, client) => {
  console.error('❌ Erreur inattendue du client PostgreSQL:', err);
  console.error('Stack trace:', err.stack);
});

pool.on('remove', (client) => {
  console.log('🗑️ Client PostgreSQL supprimé du pool');
});

// Fonction pour tester la connexion avec retry
const testConnection = async (retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔗 Test de connexion à la base de données (tentative ${attempt}/${retries})...`);
      
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      
      console.log('✅ Base de données connectée avec succès!');
      console.log(`⏰ Heure du serveur: ${result.rows[0].current_time}`);
      console.log(`🐘 Version PostgreSQL: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`);
      
      client.release();
      return true;
      
    } catch (err) {
      console.error(`❌ Tentative ${attempt} échouée:`, err.message);
      
      if (attempt === retries) {
        console.error('💥 Impossible de se connecter à la base de données après', retries, 'tentatives');
        console.error('Vérifiez votre configuration dans le fichier .env:');
        console.error('  - DB_HOST =', process.env.DB_HOST || 'localhost');
        console.error('  - DB_PORT =', process.env.DB_PORT || '5432');
        console.error('  - DB_NAME =', process.env.DB_NAME || 'ecole_moderne');
        console.error('  - DB_USER =', process.env.DB_USER || 'postgres');
        console.error('  - DB_PASSWORD = [configuré:', !!process.env.DB_PASSWORD, ']');
        throw err;
      }
      
      // Attendre avant la prochaine tentative
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
};

// Fonction pour exécuter une requête avec gestion d'erreurs
const query = async (text, params = []) => {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    console.log('📊 Requête exécutée:', {
      query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      rows: result.rowCount
    });
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - start;
    
    console.error('💥 Erreur lors de l\'exécution de la requête:', {
      query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      params: params,
      duration: `${duration}ms`,
      error: error.message
    });
    
    // Ajouter des informations contextuelles à l'erreur
    error.query = text;
    error.params = params;
    error.duration = duration;
    
    throw error;
  }
};

// Fonction pour commencer une transaction
const transaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🚀 Transaction commencée');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    console.log('✅ Transaction committée');
    
    return result;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('🔄 Transaction annulée:', error.message);
    throw error;
    
  } finally {
    client.release();
    console.log('🔓 Client de transaction libéré');
  }
};

// Fonction pour vérifier si une table existe
const tableExists = async (tableName) => {
  try {
    const result = await query(
      'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)',
      [tableName]
    );
    return result.rows[0].exists;
  } catch (error) {
    console.error(`❌ Erreur lors de la vérification de la table ${tableName}:`, error.message);
    return false;
  }
};

// Fonction pour obtenir les statistiques du pool
const getPoolStats = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
};

// Fonction pour fermer le pool proprement
const closePool = async () => {
  try {
    console.log('🔄 Fermeture du pool de connexions...');
    
    const stats = getPoolStats();
    console.log('📊 Statistiques du pool avant fermeture:', stats);
    
    await pool.end();
    console.log('✅ Pool de connexions fermé proprement');
    
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture du pool:', error.message);
    throw error;
  }
};

// Fonction de monitoring de santé
const healthCheck = async () => {
  try {
    const start = Date.now();
    const result = await query('SELECT 1 as health_check');
    const responseTime = Date.now() - start;
    
    const stats = getPoolStats();
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      poolStats: stats,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      poolStats: getPoolStats(),
      timestamp: new Date().toISOString()
    };
  }
};

// Gestion gracieuse de l'arrêt
process.on('SIGINT', async () => {
  console.log('📝 Signal SIGINT reçu - Fermeture du pool de connexions...');
  await closePool();
});

process.on('SIGTERM', async () => {
  console.log('📝 Signal SIGTERM reçu - Fermeture du pool de connexions...');
  await closePool();
});

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  closePool,
  tableExists,
  getPoolStats,
  healthCheck
};