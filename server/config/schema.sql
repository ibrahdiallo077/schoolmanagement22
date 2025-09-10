-- ================================================================
-- MIGRATION SÉCURISÉE - SANS PERTE DE DONNÉES
-- ================================================================
-- ⚠️ Cette migration PRESERVE vos données existantes
-- ✅ Ajoute seulement les tables et colonnes manquantes

-- Extension pour UUID (si pas déjà présente)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- ÉTAPE 1: AJOUTER LES COLONNES MANQUANTES À admin_users
-- ================================================================

-- Vérifier la structure actuelle
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
ORDER BY ordinal_position;

-- Ajouter les colonnes manquantes (IF NOT EXISTS équivalent)
DO $$
BEGIN
    -- Ajouter avatar_url si pas présente
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='avatar_url') THEN
        ALTER TABLE admin_users ADD COLUMN avatar_url VARCHAR(500);
        RAISE NOTICE '✅ Colonne avatar_url ajoutée';
    ELSE
        RAISE NOTICE '✅ Colonne avatar_url existe déjà';
    END IF;

    -- Ajouter phone si pas présente
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='phone') THEN
        ALTER TABLE admin_users ADD COLUMN phone VARCHAR(20);
        RAISE NOTICE '✅ Colonne phone ajoutée';
    ELSE
        RAISE NOTICE '✅ Colonne phone existe déjà';
    END IF;

    -- Ajouter date_of_birth si pas présente
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='date_of_birth') THEN
        ALTER TABLE admin_users ADD COLUMN date_of_birth DATE;
        RAISE NOTICE '✅ Colonne date_of_birth ajoutée';
    ELSE
        RAISE NOTICE '✅ Colonne date_of_birth existe déjà';
    END IF;

    -- Vérifier/ajouter contraintes email si pas présente
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='admin_users' AND constraint_name='valid_email') THEN
        ALTER TABLE admin_users ADD CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
        RAISE NOTICE '✅ Contrainte valid_email ajoutée';
    ELSE
        RAISE NOTICE '✅ Contrainte valid_email existe déjà';
    END IF;
END $$;

-- ================================================================
-- ÉTAPE 2: CRÉER LES NOUVELLES TABLES (SEULEMENT SI MANQUANTES)
-- ================================================================

-- Table refresh_tokens pour sessions robustes
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    
    -- Token hashé pour sécurité
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    
    -- Métadonnées de session
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    connection_quality VARCHAR(20) DEFAULT 'stable' CHECK (connection_quality IN ('stable', 'unstable', 'offline')),
    remember_me BOOLEAN DEFAULT false,
    
    -- Informations de connexion
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Métadonnées pour sécurité
    client_ip INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(64),
    
    -- État
    is_revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason VARCHAR(100)
);

-- Table user_sessions pour tracking sessions actives
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    
    -- Identifiants de session
    session_id VARCHAR(64) UNIQUE NOT NULL,
    access_token_jti VARCHAR(64), -- JWT ID pour tracking
    
    -- Métadonnées de connexion
    connection_quality VARCHAR(20) DEFAULT 'stable' CHECK (connection_quality IN ('stable', 'unstable', 'offline')),
    remember_me BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Informations client
    client_ip INET,
    user_agent TEXT,
    device_type VARCHAR(20), -- mobile, desktop, tablet
    browser_name VARCHAR(50),
    os_name VARCHAR(50),
    
    -- État
    is_active BOOLEAN DEFAULT true,
    ended_at TIMESTAMP WITH TIME ZONE,
    end_reason VARCHAR(50), -- logout, timeout, revoked
    
    -- Statistiques
    requests_count INTEGER DEFAULT 0,
    last_endpoint VARCHAR(200)
);

-- Table activity_logs pour logs d'activité
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
    session_id VARCHAR(64),
    
    -- Action
    action VARCHAR(100) NOT NULL, -- signin, signout, heartbeat, refresh_token, etc.
    resource VARCHAR(100), -- auth, admin, etc.
    method VARCHAR(10), -- GET, POST, PUT, DELETE
    endpoint VARCHAR(200),
    
    -- Résultat
    status_code INTEGER,
    success BOOLEAN,
    error_code VARCHAR(50),
    
    -- Métadonnées
    request_id VARCHAR(20),
    connection_quality VARCHAR(20),
    response_time_ms INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Client info
    client_ip INET,
    user_agent TEXT,
    
    -- Données additionnelles (JSON)
    metadata JSONB
);

-- ================================================================
-- ÉTAPE 3: CRÉER LES INDEX MANQUANTS
-- ================================================================

-- Index pour admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_last_login ON admin_users(last_login);

-- Index pour password_reset_tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_used ON password_reset_tokens(used);

-- Index pour refresh_tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_connection_quality ON refresh_tokens(connection_quality);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_client_ip ON refresh_tokens(client_ip);

-- Index pour user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_client_ip ON user_sessions(client_ip);

-- Index pour activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_success ON activity_logs(success);
CREATE INDEX IF NOT EXISTS idx_activity_logs_client_ip ON activity_logs(client_ip);
CREATE INDEX IF NOT EXISTS idx_activity_logs_session_id ON activity_logs(session_id);

-- Index GIN pour recherche dans metadata JSON
CREATE INDEX IF NOT EXISTS idx_activity_logs_metadata ON activity_logs USING GIN (metadata);

-- ================================================================
-- ÉTAPE 4: CRÉER LES VUES UTILES
-- ================================================================

-- Vue des sessions actives
CREATE OR REPLACE VIEW active_sessions AS
SELECT 
    us.id,
    us.user_id,
    au.email,
    au.first_name,
    au.last_name,
    au.role,
    us.session_id,
    us.connection_quality,
    us.remember_me,
    us.created_at,
    us.last_activity_at,
    us.expires_at,
    us.client_ip,
    us.device_type,
    us.requests_count,
    EXTRACT(EPOCH FROM (us.expires_at - CURRENT_TIMESTAMP)) / 60 AS minutes_until_expiry,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - us.last_activity_at)) / 60 AS minutes_since_activity
FROM user_sessions us
JOIN admin_users au ON us.user_id = au.id
WHERE us.is_active = true 
  AND us.expires_at > CURRENT_TIMESTAMP
  AND au.is_active = true
ORDER BY us.last_activity_at DESC;

-- Vue des statistiques d'authentification
CREATE OR REPLACE VIEW auth_stats AS
SELECT 
    COUNT(*) FILTER (WHERE success = true AND action = 'signin') AS successful_signins_today,
    COUNT(*) FILTER (WHERE success = false AND action = 'signin') AS failed_signins_today,
    COUNT(*) FILTER (WHERE action = 'heartbeat') AS heartbeats_today,
    COUNT(*) FILTER (WHERE action = 'refresh_token') AS token_refreshes_today,
    COUNT(DISTINCT user_id) AS unique_users_today,
    COUNT(DISTINCT client_ip) AS unique_ips_today,
    AVG(response_time_ms) FILTER (WHERE response_time_ms IS NOT NULL) AS avg_response_time_ms
FROM activity_logs 
WHERE created_at >= CURRENT_DATE;

-- ================================================================
-- ÉTAPE 5: CRÉER LES FONCTIONS UTILITAIRES
-- ================================================================

-- Fonction pour nettoyer les tokens expirés
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Supprimer les refresh tokens expirés
    DELETE FROM refresh_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP 
       OR is_revoked = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Supprimer les password reset tokens expirés
    DELETE FROM password_reset_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Marquer les sessions expirées comme inactives
    UPDATE user_sessions 
    SET is_active = false, 
        ended_at = CURRENT_TIMESTAMP,
        end_reason = 'expired'
    WHERE expires_at < CURRENT_TIMESTAMP 
      AND is_active = true;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour révoquer toutes les sessions d'un utilisateur
CREATE OR REPLACE FUNCTION revoke_user_sessions(target_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    revoked_count INTEGER;
BEGIN
    -- Révoquer les refresh tokens
    UPDATE refresh_tokens 
    SET is_revoked = true, 
        revoked_at = CURRENT_TIMESTAMP,
        revoked_reason = 'admin_revoked'
    WHERE user_id = target_user_id 
      AND is_revoked = false;
    
    GET DIAGNOSTICS revoked_count = ROW_COUNT;
    
    -- Terminer les sessions actives
    UPDATE user_sessions 
    SET is_active = false, 
        ended_at = CURRENT_TIMESTAMP,
        end_reason = 'admin_revoked'
    WHERE user_id = target_user_id 
      AND is_active = true;
    
    RETURN revoked_count;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- ÉTAPE 6: CRÉER/METTRE À JOUR LE TRIGGER updated_at
-- ================================================================

-- Fonction pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;

-- Créer le nouveau trigger
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- ÉTAPE 7: VÉRIFICATIONS FINALES
-- ================================================================

-- Afficher le résumé des modifications
DO $$
DECLARE
    table_count INTEGER;
    new_tables TEXT[] := ARRAY['refresh_tokens', 'user_sessions', 'activity_logs'];
    table_name TEXT;
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE '🎉 MIGRATION SÉCURISÉE TERMINÉE';
    RAISE NOTICE '================================';
    
    -- Compter les tables au total
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    RAISE NOTICE '📊 Total de tables dans la base: %', table_count;
    
    -- Vérifier les nouvelles tables
    RAISE NOTICE '📝 Nouvelles tables pour sessions robustes:';
    FOREACH table_name IN ARRAY new_tables
    LOOP
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = table_name
        ) INTO table_exists;
        
        IF table_exists THEN
            RAISE NOTICE '  ✅ %', table_name;
        ELSE
            RAISE NOTICE '  ❌ % (ERREUR)', table_name;
        END IF;
    END LOOP;
    
    -- Vérifier les données existantes
    RAISE NOTICE '👥 Vos utilisateurs existants sont préservés:';
    FOR table_name IN 
        SELECT first_name || ' ' || last_name || ' (' || email || ')' 
        FROM admin_users 
        WHERE is_active = true 
        ORDER BY id
    LOOP
        RAISE NOTICE '  👤 %', table_name;
    END LOOP;
    
    RAISE NOTICE '✅ Migration terminée sans perte de données!';
    RAISE NOTICE '🚀 Votre serveur peut maintenant utiliser les sessions robustes';
END $$;

-- ================================================================
-- ÉTAPE 8: COMMENTAIRES FINAUX
-- ================================================================

COMMENT ON TABLE refresh_tokens IS 'Tokens de rafraîchissement pour sessions robustes - NOUVEAU';
COMMENT ON TABLE user_sessions IS 'Sessions actives des utilisateurs avec métadonnées - NOUVEAU';
COMMENT ON TABLE activity_logs IS 'Logs d''activité détaillés pour monitoring - NOUVEAU';

-- Afficher les statistiques
SELECT 
    'admin_users' as table_name,
    COUNT(*) as row_count,
    'PRÉSERVÉ ✅' as status
FROM admin_users
UNION ALL
SELECT 
    'refresh_tokens' as table_name,
    COUNT(*) as row_count,
    'NOUVEAU ✨' as status
FROM refresh_tokens
UNION ALL
SELECT 
    'user_sessions' as table_name,
    COUNT(*) as row_count,
    'NOUVEAU ✨' as status
FROM user_sessions
UNION ALL
SELECT 
    'activity_logs' as table_name,
    COUNT(*) as row_count,
    'NOUVEAU ✨' as status
FROM activity_logs;