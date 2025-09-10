// src/components/debug/AuthTestComponent.tsx - Composant de test pour les sessions adaptatives

import React, { useState, useEffect } from 'react';
import { 
  useAuth, 
  useSessionInfo, 
  useNetworkStatus, 
  useAutoRefresh, 
  useAuthDebug 
} from '@/hooks/useAuth';
import AuthService from '@/services/auth';
import { testApiConnection, getConnectionStatus } from '@/config/api';

interface TestResults {
  authService: any;
  apiConnection: any;
  connectionStatus: any;
  sessionInfo: any;
  networkStatus: any;
  autoRefresh: any;
  debugInfo: any;
}

const AuthTestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hooks useAuth
  const { 
    user, 
    profile, 
    isLoading, 
    refreshToken, 
    heartbeat, 
    getConnectionStatus: authGetConnectionStatus,
    signOutAllDevices 
  } = useAuth();

  // Hooks utilitaires
  const sessionInfo = useSessionInfo();
  const networkStatus = useNetworkStatus();
  const autoRefresh = useAutoRefresh();
  const debugInfo = useAuthDebug();

  const runTests = async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      console.log('🧪 Démarrage des tests d\'authentification...');

      // Test 1: AuthService
      console.log('🔍 Test AuthService...');
      const authServiceTest = {
        hasStoredToken: AuthService.hasStoredToken(),
        hasRememberedSession: AuthService.hasRememberedSession(),
        isTokenNearExpiration: AuthService.isTokenNearExpiration(),
        sessionMetadata: AuthService.getSessionMetadata(),
        debugInfo: AuthService.getDebugInfo(),
        testConnection: await AuthService.testConnection(),
        systemHealth: await AuthService.getSystemHealth()
      };

      // Test 2: Connexion API
      console.log('🌐 Test connexion API...');
      const apiConnectionTest = await testApiConnection();

      // Test 3: Statut de connexion
      console.log('📡 Test statut connexion...');
      const connectionStatusTest = await getConnectionStatus();

      // Test 4: Heartbeat (si connecté)
      let heartbeatTest = null;
      if (user) {
        console.log('💓 Test heartbeat...');
        try {
          heartbeatTest = await heartbeat();
        } catch (err) {
          heartbeatTest = { error: 'Heartbeat failed', details: err };
        }
      }

      // Test 5: Refresh token (si disponible)
      let refreshTest = null;
      if (user && AuthService.hasRememberedSession()) {
        console.log('🔄 Test refresh token...');
        try {
          refreshTest = await refreshToken();
        } catch (err) {
          refreshTest = { error: 'Refresh failed', details: err };
        }
      }

      // Compiler les résultats
      const results: TestResults = {
        authService: authServiceTest,
        apiConnection: apiConnectionTest,
        connectionStatus: connectionStatusTest,
        sessionInfo: {
          ...sessionInfo,
          heartbeatTest,
          refreshTest
        },
        networkStatus,
        autoRefresh,
        debugInfo
      };

      setTestResults(results);
      console.log('✅ Tests terminés:', results);

    } catch (err) {
      console.error('💥 Erreur lors des tests:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsRunning(false);
    }
  };

  const testRefreshToken = async () => {
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    try {
      setIsRunning(true);
      console.log('🔄 Test manuel refresh token...');
      const result = await refreshToken();
      console.log('Résultat refresh:', result);
      alert(result ? 'Refresh réussi ✅' : 'Refresh échoué ❌');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur refresh');
    } finally {
      setIsRunning(false);
    }
  };

  const testHeartbeat = async () => {
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    try {
      setIsRunning(true);
      console.log('💓 Test manuel heartbeat...');
      const result = await heartbeat();
      console.log('Résultat heartbeat:', result);
      alert(result ? 'Heartbeat réussi ✅' : 'Heartbeat échoué ❌');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur heartbeat');
    } finally {
      setIsRunning(false);
    }
  };

  const testSignOutAll = async () => {
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir vous déconnecter de tous les appareils ?')) {
      try {
        setIsRunning(true);
        await signOutAllDevices();
        alert('Déconnecté de tous les appareils ✅');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur déconnexion');
      } finally {
        setIsRunning(false);
      }
    }
  };

  // Auto-run tests on component mount
  useEffect(() => {
    if (import.meta.env.DEV) {
      runTests();
    }
  }, []);

  if (import.meta.env.PROD) {
    return null; // Pas de test en production
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Bouton flottant */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-800">🧪 Auth Tests</h3>
          <span className={`text-xs px-2 py-1 rounded ${
            networkStatus.isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {networkStatus.connectionStatus}
          </span>
        </div>

        {/* Statut utilisateur */}
        <div className="mb-3 text-xs">
          <p className="text-gray-600">
            <strong>Utilisateur:</strong> {user ? `${user.firstName} ${user.lastName}` : 'Non connecté'}
          </p>
          {user && (
            <p className="text-gray-600">
              <strong>Session:</strong> {sessionInfo.isRemembered ? 'LONGUE' : 'COURTE'} 
              ({sessionInfo.connectionQuality})
            </p>
          )}
        </div>

        {/* Boutons de test */}
        <div className="space-y-2">
          <button
            onClick={runTests}
            disabled={isRunning}
            className="w-full px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isRunning ? '⏳ Tests...' : '🔄 Run Tests'}
          </button>

          {user && (
            <>
              <button
                onClick={testHeartbeat}
                disabled={isRunning}
                className="w-full px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                💓 Test Heartbeat
              </button>

              {AuthService.hasRememberedSession() && (
                <button
                  onClick={testRefreshToken}
                  disabled={isRunning}
                  className="w-full px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                >
                  🔄 Test Refresh
                </button>
              )}

              <button
                onClick={testSignOutAll}
                disabled={isRunning}
                className="w-full px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                🚪 Sign Out All
              </button>
            </>
          )}
        </div>

        {/* Affichage des erreurs */}
        {error && (
          <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700">
            <strong>Erreur:</strong> {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Résultats des tests (collapsible) */}
        {testResults && (
          <details className="mt-3">
            <summary className="text-xs font-medium text-gray-700 cursor-pointer hover:text-gray-900">
              📊 Résultats ({Object.keys(testResults).length} tests)
            </summary>
            <div className="mt-2 max-h-64 overflow-y-auto">
              <pre className="text-xs bg-gray-100 p-2 rounded border overflow-x-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          </details>
        )}

        {/* Informations debug rapides */}
        {debugInfo && (
          <details className="mt-2">
            <summary className="text-xs font-medium text-gray-700 cursor-pointer hover:text-gray-900">
              🔍 Debug Info
            </summary>
            <div className="mt-1 text-xs space-y-1">
              <p><strong>Version:</strong> {debugInfo.session?.version || 'N/A'}</p>
              <p><strong>Storage:</strong> {debugInfo.storage?.storageLocation || 'N/A'}</p>
              <p><strong>Has Refresh Token:</strong> {debugInfo.storage?.hasRefreshToken ? '✅' : '❌'}</p>
              <p><strong>Near Expiration:</strong> {debugInfo.storage?.isNearExpiration ? '⚠️' : '✅'}</p>
            </div>
          </details>
        )}

        {/* Auto-refresh info */}
        {autoRefresh.isAutoRefreshActive && (
          <div className="mt-2 text-xs bg-blue-50 p-2 rounded border">
            <p className="font-medium text-blue-800">🔄 Auto-refresh actif</p>
            {autoRefresh.lastRefresh && (
              <p className="text-blue-600">
                Dernier: {autoRefresh.lastRefresh.toLocaleTimeString()}
              </p>
            )}
            {autoRefresh.nextRefresh && (
              <p className="text-blue-600">
                Prochain: {autoRefresh.nextRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthTestComponent;