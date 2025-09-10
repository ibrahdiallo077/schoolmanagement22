-- safe_database_update.sql - Mise à jour sécurisée pour table existante
-- Ce script ne modifie que ce qui manque, sans toucher aux données existantes

-- === AJOUTER LES COLONNES MANQUANTES À admin_users (si elles n'existent pas) ===

-- Ajouter la colonne is_first_login si elle n'existe pas
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='is_first_login') THEN
        ALTER TABLE admin_users ADD COLUMN is_first_login BOOLEAN DEFAULT false;
        RAISE NOTICE 'Colonne is_first_login ajoutée';
    ELSE
        RAISE NOTICE 'Colonne is_first_login existe déjà';
    END IF;
END $$;

-- Ajouter la colonne avatar_url si elle n'existe pas
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='avatar_url') THEN
        ALTER TABLE admin_users ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Colonne avatar_url ajoutée';
    ELSE
        RAISE NOTICE 'Colonne avatar_url existe déjà';
    END IF;
END $$;

-- Ajouter la colonne phone si elle n'existe pas
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='phone') THEN
        ALTER TABLE admin_users ADD COLUMN phone VARCHAR(20);
        RAISE NOTICE 'Colonne phone ajoutée';
    ELSE
        RAISE NOTICE 'Colonne phone existe déjà';
    END IF;
END $$;

-- Ajouter la colonne date_of_birth si elle n'existe pas
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='date_of_birth') THEN
        ALTER TABLE admin_users ADD COLUMN date_of_birth DATE;
        RAISE NOTICE 'Colonne date_of_birth ajoutée';
    ELSE
        RAISE NOTICE 'Colonne date_of_birth existe déjà';
    END IF;
END $$;

-- Ajouter la colonne last_activity si elle n'existe pas
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='last_activity') THEN
        ALTER TABLE admin_users ADD COLUMN last_activity TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Colonne last_activity ajoutée';
    ELSE
        RAISE NOTICE 'Colonne last_activity existe déjà';
    END IF;
END $$;

-- === CRÉER LA TABLE password_reset_tokens (si elle n'existe pas) ===
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    
    -- États et expirations
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    
    -- Informations de traçabilité
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- === CRÉER LES INDEX (si ils n'existent pas) ===

-- Index pour admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- Index pour password_reset_tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_used ON password_reset_tokens(used);

-- === VÉRIFICATION ET RAPPORT ===
DO $$
DECLARE
    admin_count INTEGER;
    token_table_exists BOOLEAN;
BEGIN
    -- Compter les admins
    SELECT COUNT(*) INTO admin_count FROM admin_users WHERE is_active = true;
    
    -- Vérifier si la table des tokens existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'password_reset_tokens'
    ) INTO token_table_exists;
    
    RAISE NOTICE '=== RAPPORT DE MISE À JOUR ===';
    RAISE NOTICE 'Admins actifs: %', admin_count;
    RAISE NOTICE 'Table password_reset_tokens: %', 
        CASE WHEN token_table_exists THEN 'EXISTS' ELSE 'CREATED' END;
    RAISE NOTICE 'Mise à jour terminée avec succès !';
END $$;