-- ================================
-- TABLE NOTIFICATIONS SYSTEME - VERSION COMPLETE CORRIGEE
-- ================================

-- Supprimer la table si elle existe deja (optionnel - decommentez si necessaire)
-- DROP TABLE IF EXISTS notifications CASCADE;

-- Table principale des notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Informations de base
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'success', 'reminder', 'alert'
    
    -- Priorite
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    
    -- Dates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP WITH TIME ZONE, -- Date limite pour le rappel
    reminder_date TIMESTAMP WITH TIME ZONE, -- Date du rappel
    
    -- Etats
    is_read BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_reminder_sent BOOLEAN DEFAULT FALSE,
    
    -- Utilisateur cible (NULL = pour tous)
    user_id INTEGER REFERENCES admin_users(id),
    
    -- Metadonnees
    category VARCHAR(100), -- 'payment', 'expense', 'salary', 'general', 'system'
    related_entity_type VARCHAR(50), -- 'student', 'expense', 'staff', etc.
    related_entity_id UUID, -- ID de l'entite liee
    
    -- Donnees additionnelles (JSON)
    metadata JSONB DEFAULT '{}',
    
    -- Audit
    created_by INTEGER REFERENCES admin_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES admin_users(id)
);

-- ================================
-- INDEX POUR PERFORMANCES
-- ================================

-- Index pour les requetes frequentes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_is_active ON notifications(is_active);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_due_date ON notifications(due_date);
CREATE INDEX idx_notifications_reminder_date ON notifications(reminder_date);
CREATE INDEX idx_notifications_category ON notifications(category);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Index compose pour les notifications non lues par utilisateur
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, is_active) 
WHERE is_read = FALSE AND is_active = TRUE;

-- Index pour les rappels a envoyer
CREATE INDEX idx_notifications_pending_reminders ON notifications(reminder_date, is_reminder_sent, is_active)
WHERE is_reminder_sent = FALSE AND is_active = TRUE;

-- ================================
-- CONTRAINTES ET VALIDATIONS
-- ================================

-- Contrainte pour valider le type
ALTER TABLE notifications ADD CONSTRAINT chk_notification_type 
CHECK (type IN ('info', 'warning', 'error', 'success', 'reminder', 'alert'));

-- Contrainte pour valider la priorite
ALTER TABLE notifications ADD CONSTRAINT chk_notification_priority 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Contrainte pour valider les dates
ALTER TABLE notifications ADD CONSTRAINT chk_notification_dates
CHECK (
    (due_date IS NULL OR due_date >= created_at) AND
    (reminder_date IS NULL OR reminder_date >= created_at) AND
    (due_date IS NULL OR reminder_date IS NULL OR reminder_date <= due_date)
);

-- ================================
-- FONCTIONS UTILITAIRES
-- ================================

-- Fonction pour marquer une notification comme lue
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_uuid UUID, user_uuid INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, 
        updated_at = CURRENT_TIMESTAMP,
        updated_by = user_uuid
    WHERE id = notification_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour compter les notifications non lues par utilisateur
CREATE OR REPLACE FUNCTION count_unread_notifications(user_uuid INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM notifications 
        WHERE (user_id = user_uuid OR user_id IS NULL)
        AND is_read = FALSE 
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les anciennes notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * days_old
    AND is_read = TRUE
    AND is_active = FALSE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- VUES UTILES
-- ================================

-- Vue pour les notifications avec informations utilisateur
CREATE VIEW notifications_with_user AS
SELECT 
    n.*,
    u.first_name || ' ' || u.last_name as user_name,
    u.email as user_email,
    u.role as user_role,
    cb.first_name || ' ' || cb.last_name as created_by_name,
    
    -- Calcul du temps restant
    CASE 
        WHEN due_date IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (due_date - CURRENT_TIMESTAMP))/3600
        ELSE NULL 
    END as hours_remaining,
    
    -- Statut de priorite avec couleur
    CASE n.priority
        WHEN 'urgent' THEN '#DC2626'  -- Rouge
        WHEN 'high' THEN '#EA580C'    -- Orange fonce
        WHEN 'medium' THEN '#D97706'  -- Orange
        WHEN 'low' THEN '#059669'     -- Vert
    END as priority_color,
    
    -- Icone selon le type
    CASE n.type
        WHEN 'error' THEN 'AlertTriangle'
        WHEN 'warning' THEN 'AlertCircle'
        WHEN 'success' THEN 'CheckCircle'
        WHEN 'info' THEN 'Info'
        WHEN 'reminder' THEN 'Clock'
        WHEN 'alert' THEN 'Bell'
        ELSE 'Bell'
    END as type_icon

FROM notifications n
LEFT JOIN admin_users u ON n.user_id = u.id
LEFT JOIN admin_users cb ON n.created_by = cb.id;

-- Vue pour le dashboard des notifications
CREATE VIEW notifications_dashboard AS
SELECT 
    -- Compteurs par priorite
    COUNT(*) FILTER (WHERE priority = 'urgent' AND is_read = FALSE AND is_active = TRUE) as urgent_unread,
    COUNT(*) FILTER (WHERE priority = 'high' AND is_read = FALSE AND is_active = TRUE) as high_unread,
    COUNT(*) FILTER (WHERE priority = 'medium' AND is_read = FALSE AND is_active = TRUE) as medium_unread,
    COUNT(*) FILTER (WHERE priority = 'low' AND is_read = FALSE AND is_active = TRUE) as low_unread,
    
    -- Compteurs par type
    COUNT(*) FILTER (WHERE type = 'error' AND is_read = FALSE AND is_active = TRUE) as error_unread,
    COUNT(*) FILTER (WHERE type = 'warning' AND is_read = FALSE AND is_active = TRUE) as warning_unread,
    COUNT(*) FILTER (WHERE type = 'reminder' AND is_read = FALSE AND is_active = TRUE) as reminder_unread,
    
    -- Statistiques generales
    COUNT(*) FILTER (WHERE is_read = FALSE AND is_active = TRUE) as total_unread,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_created,
    COUNT(*) FILTER (WHERE due_date <= CURRENT_TIMESTAMP + INTERVAL '24 hours' AND due_date > CURRENT_TIMESTAMP AND is_active = TRUE) as due_soon,
    COUNT(*) FILTER (WHERE due_date <= CURRENT_TIMESTAMP AND is_active = TRUE) as overdue
    
FROM notifications;

-- ================================
-- DONNEES DE TEST
-- ================================

-- Inserer quelques notifications de test si aucune n'existe
INSERT INTO notifications (
    title, message, type, priority, category, 
    user_id, created_by, due_date, reminder_date
) 
SELECT 
    'Validation des depenses en attente',
    'Il y a des depenses en attente de validation pour un montant important',
    'warning',
    'high',
    'expense',
    (SELECT id FROM admin_users WHERE role = 'super_admin' LIMIT 1),
    (SELECT id FROM admin_users WHERE role = 'super_admin' LIMIT 1),
    CURRENT_TIMESTAMP + INTERVAL '2 days',
    CURRENT_TIMESTAMP + INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM notifications LIMIT 1);

INSERT INTO notifications (
    title, message, type, priority, category, 
    user_id, created_by, due_date, reminder_date
) 
SELECT
    'Rappel de paiement - Classe 6eme A',
    'Les frais de scolarite du mois de Janvier sont dus. Plusieurs eleves n ont pas encore paye.',
    'reminder',
    'medium',
    'payment',
    (SELECT id FROM admin_users WHERE role = 'super_admin' LIMIT 1),
    (SELECT id FROM admin_users WHERE role = 'admin' LIMIT 1),
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    CURRENT_TIMESTAMP + INTERVAL '3 days'
WHERE (SELECT COUNT(*) FROM notifications) < 2;

INSERT INTO notifications (
    title, message, type, priority, category, 
    user_id, created_by
) 
SELECT
    'Maintenance programmee',
    'Une maintenance du systeme est prevue ce week-end. L acces pourra etre temporairement interrompu.',
    'info',
    'low',
    'system',
    NULL, -- Pour tous les utilisateurs
    (SELECT id FROM admin_users WHERE role = 'super_admin' LIMIT 1)
WHERE (SELECT COUNT(*) FROM notifications) < 3;

INSERT INTO notifications (
    title, message, type, priority, category, 
    user_id, created_by, due_date, reminder_date
) 
SELECT
    'Budget mensuel depasse',
    'Le budget des depenses pour le mois de Janvier a ete depasse de 15%. Action requise immediatement.',
    'error',
    'urgent',
    'expense',
    (SELECT id FROM admin_users WHERE role = 'super_admin' LIMIT 1),
    (SELECT id FROM admin_users WHERE role = 'super_admin' LIMIT 1),
    CURRENT_TIMESTAMP + INTERVAL '1 day',
    CURRENT_TIMESTAMP + INTERVAL '4 hours'
WHERE (SELECT COUNT(*) FROM notifications) < 4;

INSERT INTO notifications (
    title, message, type, priority, category, 
    user_id, created_by
) 
SELECT
    'Rapport mensuel genere',
    'Le rapport financier de Janvier 2025 a ete genere avec succes et est disponible pour telechargement.',
    'success',
    'low',
    'general',
    (SELECT id FROM admin_users WHERE role = 'super_admin' LIMIT 1),
    (SELECT id FROM admin_users WHERE role = 'super_admin' LIMIT 1)
WHERE (SELECT COUNT(*) FROM notifications) < 5;

-- ================================
-- COMMENTAIRES ET DOCUMENTATION
-- ================================

COMMENT ON TABLE notifications IS 'Systeme de notifications avec priorites, rappels et gestion des delais';
COMMENT ON COLUMN notifications.title IS 'Titre de la notification (obligatoire)';
COMMENT ON COLUMN notifications.message IS 'Message detaille de la notification';
COMMENT ON COLUMN notifications.type IS 'Type: info, warning, error, success, reminder, alert';
COMMENT ON COLUMN notifications.priority IS 'Priorite: low, medium, high, urgent';
COMMENT ON COLUMN notifications.due_date IS 'Date limite pour la notification';
COMMENT ON COLUMN notifications.reminder_date IS 'Date a laquelle envoyer un rappel';
COMMENT ON COLUMN notifications.category IS 'Categorie: payment, expense, salary, general, system';
COMMENT ON COLUMN notifications.related_entity_type IS 'Type d entite liee (student, expense, etc.)';
COMMENT ON COLUMN notifications.related_entity_id IS 'ID de l entite liee';
COMMENT ON COLUMN notifications.metadata IS 'Donnees JSON additionnelles';

-- ================================
-- TESTS ET VERIFICATION
-- ================================

-- Tester les fonctions
SELECT count_unread_notifications(1) as unread_count_user_1;

-- Afficher le dashboard
SELECT * FROM notifications_dashboard;

-- Afficher les notifications avec details utilisateur
SELECT 
    id,
    title,
    type,
    priority,
    priority_color,
    type_icon,
    user_name,
    created_by_name,
    hours_remaining,
    is_read
FROM notifications_with_user 
ORDER BY 
    CASE priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    created_at DESC 
LIMIT 10;

-- Afficher les statistiques
SELECT 
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE is_read = FALSE) as unread_notifications,
    COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_notifications,
    COUNT(*) FILTER (WHERE priority = 'high') as high_notifications,
    COUNT(*) FILTER (WHERE priority = 'medium') as medium_notifications,
    COUNT(*) FILTER (WHERE priority = 'low') as low_notifications,
    COUNT(*) FILTER (WHERE type = 'error') as error_notifications,
    COUNT(*) FILTER (WHERE type = 'warning') as warning_notifications,
    COUNT(*) FILTER (WHERE type = 'success') as success_notifications,
    COUNT(*) FILTER (WHERE type = 'info') as info_notifications,
    COUNT(*) FILTER (WHERE type = 'reminder') as reminder_notifications,
    COUNT(*) FILTER (WHERE type = 'alert') as alert_notifications
FROM notifications;

-- Afficher les notifications par utilisateur
SELECT 
    COALESCE(u.first_name || ' ' || u.last_name, 'Tous les utilisateurs') as destinataire,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE n.is_read = FALSE) as non_lues
FROM notifications n
LEFT JOIN admin_users u ON n.user_id = u.id
WHERE n.is_active = TRUE
GROUP BY u.id, u.first_name, u.last_name, n.user_id
ORDER BY non_lues DESC, total DESC;

-- ================================
-- MESSAGE DE CONFIRMATION
-- ================================

\echo '================================'
\echo 'TABLE NOTIFICATIONS CREEE AVEC SUCCES !'
\echo '================================'
\echo 'Fonctionnalites disponibles :'
\echo '- Table notifications avec tous les champs'
\echo '- Index optimises pour les performances'
\echo '- Contraintes de validation'
\echo '- Fonctions utilitaires (mark_as_read, count_unread, cleanup)'
\echo '- Vues enrichies (notifications_with_user, notifications_dashboard)'
\echo '- Donnees de test inserees'
\echo '================================'
\echo 'Prochaines etapes :'
\echo '1. Ajouter les routes backend dans server.js'
\echo '2. Creer les composants React frontend'
\echo '3. Integrer avec les autres modules'
\echo '================================'