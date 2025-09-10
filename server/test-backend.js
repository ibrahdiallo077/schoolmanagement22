// test-backend.js - Tests complets des API backend
// Placez ce fichier dans le dossier server/ et exécutez avec: node test-backend.js

const API_BASE_URL = 'http://localhost:3001';

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Fonction de test générique
async function testEndpoint(name, url, options = {}) {
  try {
    log('blue', `🔍 Test: ${name}`);
    console.log(`   URL: ${url}`);
    
    const startTime = Date.now();
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const duration = Date.now() - startTime;
    
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    if (response.ok) {
      log('green', `   ✅ SUCCÈS (${response.status}) - ${duration}ms`);
      console.log(`   Réponse:`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
      return { success: true, data, status: response.status, duration };
    } else {
      log('red', `   ❌ ÉCHEC (${response.status}) - ${duration}ms`);
      console.log(`   Erreur:`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
      return { success: false, data, status: response.status, duration };
    }
  } catch (error) {
    log('red', `   💥 ERREUR RÉSEAU: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Tests principaux
async function runBackendTests() {
  log('bold', '🚀 DÉBUT DES TESTS BACKEND API');
  log('bold', '=====================================');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };
  
  // Test 1: Endpoint racine
  const test1 = await testEndpoint(
    'API Racine', 
    `${API_BASE_URL}/api`
  );
  results.tests.push({ name: 'API Racine', ...test1 });
  
  // Test 2: Health check
  const test2 = await testEndpoint(
    'Health Check', 
    `${API_BASE_URL}/api/health`
  );
  results.tests.push({ name: 'Health Check', ...test2 });
  
  // Test 3: Auth Test
  const test3 = await testEndpoint(
    'Auth Test', 
    `${API_BASE_URL}/api/auth/test`
  );
  results.tests.push({ name: 'Auth Test', ...test3 });
  
  // Test 4: Auth Health
  const test4 = await testEndpoint(
    'Auth Health', 
    `${API_BASE_URL}/api/auth/health`
  );
  results.tests.push({ name: 'Auth Health', ...test4 });
  
  // Test 5: Vérification Email (doit échouer sans email)
  const test5 = await testEndpoint(
    'Verify Email (sans données)', 
    `${API_BASE_URL}/api/auth/verify-email`,
    { method: 'POST', body: JSON.stringify({}) }
  );
  results.tests.push({ name: 'Verify Email (vide)', ...test5 });
  
  // Test 6: SignIn (doit échouer sans credentials)
  const test6 = await testEndpoint(
    'SignIn (sans données)', 
    `${API_BASE_URL}/api/auth/signin`,
    { method: 'POST', body: JSON.stringify({}) }
  );
  results.tests.push({ name: 'SignIn (vide)', ...test6 });
  
  // Test 7: Endpoint inexistant (doit retourner 404)
  const test7 = await testEndpoint(
    'Endpoint inexistant', 
    `${API_BASE_URL}/api/inexistant`
  );
  results.tests.push({ name: 'Endpoint inexistant', ...test7 });
  
  // Test 8: CORS - Avec Origin Header
  const test8 = await testEndpoint(
    'Test CORS', 
    `${API_BASE_URL}/api`,
    { 
      headers: { 
        'Origin': 'http://localhost:8080',
        'Access-Control-Request-Method': 'GET'
      }
    }
  );
  results.tests.push({ name: 'Test CORS', ...test8 });
  
  // Calcul des résultats
  results.total = results.tests.length;
  results.passed = results.tests.filter(test => test.success).length;
  results.failed = results.total - results.passed;
  
  // Affichage du résumé
  log('bold', '\n📊 RÉSUMÉ DES TESTS BACKEND');
  log('bold', '============================');
  
  results.tests.forEach(test => {
    const status = test.success ? '✅' : '❌';
    const time = test.duration ? `(${test.duration}ms)` : '';
    console.log(`${status} ${test.name} ${time}`);
  });
  
  console.log(`\n📈 Total: ${results.total}`);
  log('green', `✅ Réussis: ${results.passed}`);
  log('red', `❌ Échoués: ${results.failed}`);
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  
  if (results.failed === 0) {
    log('green', `\n🎉 TOUS LES TESTS RÉUSSIS ! (${successRate}%)`);
  } else if (results.passed > results.failed) {
    log('yellow', `\n⚠️ CERTAINS TESTS ÉCHOUÉS (${successRate}% de réussite)`);
  } else {
    log('red', `\n🚨 PROBLÈMES DÉTECTÉS (${successRate}% de réussite)`);
  }
  
  // Diagnostics
  console.log(`\n🔍 DIAGNOSTIC:`);
  
  const apiRootTest = results.tests.find(t => t.name === 'API Racine');
  if (!apiRootTest.success) {
    log('red', '❌ Le serveur backend ne répond pas');
    log('yellow', '💡 Vérifiez que le serveur est démarré avec: npm run dev');
    log('yellow', '💡 Vérifiez que le port 3001 est libre');
  } else {
    log('green', '✅ Le serveur backend répond correctement');
  }
  
  const corsTest = results.tests.find(t => t.name === 'Test CORS');
  if (corsTest.success) {
    log('green', '✅ CORS configuré correctement');
  } else {
    log('yellow', '⚠️ Vérifiez la configuration CORS');
  }
  
  return results;
}

// Test de performance
async function performanceTest() {
  log('bold', '\n⚡ TEST DE PERFORMANCE');
  log('bold', '=======================');
  
  const iterations = 5;
  const times = [];
  
  for (let i = 1; i <= iterations; i++) {
    log('blue', `Test ${i}/${iterations}...`);
    const result = await testEndpoint(
      `Performance ${i}`, 
      `${API_BASE_URL}/api`
    );
    
    if (result.success && result.duration) {
      times.push(result.duration);
    }
  }
  
  if (times.length > 0) {
    const avgTime = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`\n📊 Statistiques de performance:`);
    console.log(`   Temps moyen: ${avgTime}ms`);
    console.log(`   Temps minimum: ${minTime}ms`);
    console.log(`   Temps maximum: ${maxTime}ms`);
    
    if (avgTime < 100) {
      log('green', '✅ Performance excellente');
    } else if (avgTime < 500) {
      log('yellow', '⚠️ Performance acceptable');
    } else {
      log('red', '❌ Performance dégradée');
    }
  }
}

// Test de connectivité détaillé
async function connectivityTest() {
  log('bold', '\n🌐 TEST DE CONNECTIVITÉ');
  log('bold', '========================');
  
  // Test ping simple
  try {
    const start = Date.now();
    const response = await fetch(`${API_BASE_URL}/api`);
    const end = Date.now();
    
    if (response.ok) {
      log('green', `✅ Ping réussi en ${end - start}ms`);
    } else {
      log('red', `❌ Ping échoué: HTTP ${response.status}`);
    }
  } catch (error) {
    log('red', `❌ Impossible de joindre le serveur: ${error.message}`);
    log('yellow', '💡 Vérifiez que le backend est démarré sur le port 3001');
    return false;
  }
  
  return true;
}

// Exécution principale
async function main() {
  console.clear();
  log('bold', '🧪 TESTS BACKEND API - CLASSE FLOW MANAGER');
  log('bold', '===========================================\n');
  
  // Test de connectivité d'abord
  const isConnected = await connectivityTest();
  
  if (!isConnected) {
    log('red', '\n🚨 ARRÊT DES TESTS - Backend non accessible');
    process.exit(1);
  }
  
  // Tests principaux
  await runBackendTests();
  
  // Test de performance
  await performanceTest();
  
  log('bold', '\n🏁 TESTS TERMINÉS');
  log('blue', 'Maintenant, testez le frontend avec le fichier test-frontend.html');
}

// Gestion des erreurs globales
process.on('unhandledRejection', (reason, promise) => {
  log('red', `💥 Erreur non gérée: ${reason}`);
  process.exit(1);
});

// Exécuter si c'est le fichier principal
if (require.main === module) {
  main().catch(error => {
    log('red', `💥 Erreur fatale: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { testEndpoint, runBackendTests };