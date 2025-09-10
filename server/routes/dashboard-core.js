// server/routes/dashboard-core.js - BASE ET CONFIGURATION
const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

console.log('📊 === DASHBOARD CORE V4.0 - BASE ET CONFIGURATION ===');

// === CACHE INTELLIGENT MULTI-NIVEAUX ===
const dashboardCache = new Map();
const quickCache = new Map();
const liveCache = new Map();
const CACHE_DURATION_DASHBOARD = 30000; // 30 secondes
const CACHE_DURATION_QUICK = 5000;      // 5 secondes
const CACHE_DURATION_LIVE = 2000;       // 2 secondes
const MAX_CACHE_SIZE = 100;

// === RATE LIMITING ===
const requestTracker = new Map();
const RATE_LIMIT_WINDOW = 15000;
const MAX_REQUESTS_PER_WINDOW = 30;

// === MIDDLEWARE PRINCIPAL ===
router.use((req, res, next) => {
  const clientId = req.ip + (req.user?.id || 'anonymous');
  const now = Date.now();
  
  // Nettoyer les anciennes entrées
  for (const [key, data] of requestTracker.entries()) {
    if (now - data.firstRequest > RATE_LIMIT_WINDOW) {
      requestTracker.delete(key);
    }
  }
  
  // Rate limiting intelligent
  if (requestTracker.has(clientId)) {
    const data = requestTracker.get(clientId);
    if (now - data.firstRequest < RATE_LIMIT_WINDOW) {
      data.count++;
      if (data.count > MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({
          success: false,
          error: 'Tableau de bord temporairement limité',
          retry_after: Math.ceil((RATE_LIMIT_WINDOW - (now - data.firstRequest)) / 1000)
        });
      }
    } else {
      requestTracker.set(clientId, { firstRequest: now, count: 1 });
    }
  } else {
    requestTracker.set(clientId, { firstRequest: now, count: 1 });
  }
  
  console.log(`📊 DASHBOARD: ${req.method} ${req.originalUrl} [${req.user?.username || 'anonymous'}]`);
  
  // CORS optimisé
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, x-auth-token');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// === UTILITAIRES DE CACHE ===
function getFromCache(cacheMap, key, duration) {
  const item = cacheMap.get(key);
  if (item && Date.now() - item.timestamp < duration) {
    return item.data;
  }
  return null;
}

function setCache(cacheMap, key, data, maxSize = MAX_CACHE_SIZE) {
  cacheMap.set(key, { data, timestamp: Date.now() });
  if (cacheMap.size > maxSize) {
    const oldestKeys = Array.from(cacheMap.keys()).slice(0, Math.floor(maxSize / 2));
    oldestKeys.forEach(k => cacheMap.delete(k));
  }
}

// === UTILITAIRES DE FORMATAGE ===
const formatGNF = (amount) => {
  const num = Number(amount || 0);
  return isNaN(num) ? '0 FG' : `${num.toLocaleString('fr-FR')} FG`;
};

const calculatePercentage = (part, total) => {
  if (!total || total === 0) return 0;
  return Math.round((part / total) * 100);
};

const calculateTrend = (current, previous) => {
  if (!previous || previous === 0) return { percentage: 0, direction: 'stable' };
  const change = ((current - previous) / previous) * 100;
  return {
    percentage: Math.abs(change).toFixed(1),
    direction: change > 3 ? 'up' : change < -3 ? 'down' : 'stable',
    raw_change: change
  };
};

// === ROUTE DE TEST ===
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Dashboard Core opérationnel',
    version: '4.0.0',
    cache_status: {
      dashboard_cache: dashboardCache.size,
      quick_cache: quickCache.size,
      live_cache: liveCache.size
    },
    active_requests: requestTracker.size,
    timestamp: new Date().toISOString()
  });
});

// Exporter les utilitaires pour les autres modules
module.exports = {
  router,
  dashboardCache,
  quickCache, 
  liveCache,
  CACHE_DURATION_DASHBOARD,
  CACHE_DURATION_QUICK,
  CACHE_DURATION_LIVE,
  getFromCache,
  setCache,
  formatGNF,
  calculatePercentage,
  calculateTrend
};