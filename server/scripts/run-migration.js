// server/scripts/run-migration.js
// Script pour exécuter la migration avec diagnostics complets

const fs = require('fs').promises;
const path = require('path');
const { query, testConnection } = require('../config/database');

async function runMigrationWithDiagnostics() {
  console.log('🚀 EXÉCUTION DE LA MIGRATION SÉCURISÉE');
  console.log('=====================================');
  
  try {
    // 1. Test de connexion avec diagnostics
    console.log('🔍 Test de connexion à la base de données...');
    
    try {
      await testConnection();
      console.log('✅ Connexion réussie !');
    } catch (connectionError) {
      console.error('💥 Impossible de se connecter à la base de données');
      console.error('Vérifiez votre configuration dans le fichier .env:');
      console.error('  - DB_HOST =', process.env.DB_HOST || 'localhost');
      console.error('  - DB_PORT =', process.env.DB_PORT || '5432');
      console.error('  - DB_NAME =', process.env.DB_NAME || 'ecole_moderne');
      console.error('  - DB_USER =', process.env.DB_USER || 'postgres');
      console.error('  - DB_PASSWORD = [configuré:', !!process.env.DB_PASSWORD, ']');
      console.error('\n🔍 Erreur détaillée:', connectionError.message);
      console.error('\n💡 Solutions possibles:');
      console.error('  1. Vérifiez que PostgreSQL est démarré: sudo service postgresql start');
      console.error('  2. Vérifiez que la base existe: createdb ecole_moderne');
      console.error('  3. Vérifiez les identifiants dans .env');
      process.exit(1);
    }

    // 2. Lire le script de migration
    console.log('\n📖 Lecture du script de migration...');
    const migrationPath = path.join(__dirname, '../config/migration-safe.sql');
    
    let migrationSQL;
    try {
      migrationSQL = await fs.readFile(migrationPath, 'utf8');
      console.log('✅ Script de migration lu (', migrationSQL.length, 'caractères)');
    } catch (fileError) {
      console.error('💥 Impossible de lire le fichier migration-safe.sql');
      console.error('Vérifiez que le fichier existe:', migrationPath);
      console.error('Erreur:', fileError.message);
      process.exit(1);
    }

    // 3. Vérifier l'état actuel de la base
    console.log('\n🔍 Vérification de l\'état actuel...');
    
    try {
      // Compter les tables existantes
      const tablesResult = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      
      console.log('📊 Tables existantes:', tablesResult.rows.length);
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });

      // Compter les utilisateurs
      const usersResult = await query('SELECT COUNT(*) as count FROM admin_users WHERE is_active = true');
      console.log('👥 Utilisateurs actifs:', usersResult.rows[0].count);

    } catch (checkError) {
      console.warn('⚠️ Impossible de vérifier l\'état actuel:', checkError.message);
    }

    // 4. Exécuter la migration
    console.log('\n🛠️ Exécution de la migration...');
    
    try {
      await query(migrationSQL);
      console.log('✅ Migration exécutée avec succès !');
    } catch (migrationError) {
      console.error('💥 Erreur lors de la migration:', migrationError.message);
      
      // Diagnostics spécifiques selon l'erreur
      if (migrationError.message.includes('already exists')) {
        console.log('💡 Cette erreur est normale - les éléments existent déjà');
      } else if (migrationError.message.includes('permission denied')) {
        console.error('💡 Problème de permissions - Connectez-vous en tant que postgres');
      } else if (migrationError.message.includes('syntax error')) {
        console.error('💡 Erreur de syntaxe SQL - Vérifiez le fichier migration-safe.sql');
      }
      
      throw migrationError;
    }

    // 5. Vérifier le résultat
    console.log('\n🎯 Vérification post-migration...');
    
    try {
      // Vérifier les nouvelles tables
      const newTables = ['refresh_tokens', 'user_sessions', 'activity_logs'];
      
      for (const tableName of newTables) {
        const exists = await query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [tableName]);
        
        if (exists.rows[0].exists) {
          console.log(`✅ Table ${tableName} créée`);
        } else {
          console.log(`❌ Table ${tableName} manquante`);
        }
      }

      // Vérifier que les utilisateurs sont toujours là
      const finalUsersResult = await query(`
        SELECT first_name, last_name, email, role 
        FROM admin_users 
        WHERE is_active = true 
        ORDER BY id
      `);
      
      console.log('\n👥 Utilisateurs préservés:');
      finalUsersResult.rows.forEach(user => {
        console.log(`  ✅ ${user.first_name} ${user.last_name} (${user.email}) - ${user.role}`);
      });

    } catch (verifyError) {
      console.warn('⚠️ Impossible de vérifier le résultat:', verifyError.message);
    }

    console.log('\n🎉 MIGRATION TERMINÉE AVEC SUCCÈS !');
    console.log('🚀 Votre base de données est prête pour les sessions robustes');
    
  } catch (error) {
    console.error('\n💥 ÉCHEC DE LA MIGRATION');
    console.error('========================');
    console.error('Erreur:', error.message);
    
    console.error('\n🆘 SOLUTIONS DE DÉPANNAGE:');
    console.error('1. Vérifiez la connexion à PostgreSQL');
    console.error('2. Vérifiez les permissions de votre utilisateur');
    console.error('3. Exécutez manuellement: psql -d ecole_moderne -f server/config/migration-safe.sql');
    console.error('4. Contactez le support si le problème persiste');
    
    process.exit(1);
  }
}

// Exécution si appelé directement
if (require.main === module) {
  runMigrationWithDiagnostics();
}

module.exports = runMigrationWithDiagnostics;