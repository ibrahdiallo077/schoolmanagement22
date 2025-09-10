-- =====================================
-- 🏦 SYSTÈME FINANCIER UNIFIÉ - NETTOYAGE COMPLET ET RÉINSTALLATION
-- =====================================

-- 🗑️ NETTOYAGE COMPLET - SUPPRIMER TOUT CE QUI EXISTE
DROP VIEW IF EXISTS v_financial_dashboard_live CASCADE;
DROP VIEW IF EXISTS v_unified_financial_flows CASCADE;

-- Supprimer les triggers existants
DROP TRIGGER IF EXISTS tr_update_capital_on_student_payment ON student_payments CASCADE;
DROP TRIGGER IF EXISTS tr_update_capital_on_expense ON expenses CASCADE;
DROP TRIGGER IF EXISTS tr_update_capital_on_salary ON salary_payments_v2 CASCADE;
DROP TRIGGER IF EXISTS tr_update_capital_on_manual ON manual_financial_transactions CASCADE;

-- Supprimer les fonctions existantes avec toutes leurs signatures
DROP FUNCTION IF EXISTS update_financial_capital_simple() CASCADE;
DROP FUNCTION IF EXISTS get_financial_stats() CASCADE;
DROP FUNCTION IF EXISTS inject_transaction(VARCHAR, NUMERIC, TEXT, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS trigger_update_capital() CASCADE;
DROP FUNCTION IF EXISTS show_real_data_summary() CASCADE;
DROP FUNCTION IF EXISTS calculate_real_time_balance() CASCADE;

-- Supprimer les index existants
DROP INDEX IF EXISTS idx_manual_transactions_date CASCADE;
DROP INDEX IF EXISTS idx_manual_transactions_type CASCADE;
DROP INDEX IF EXISTS idx_financial_categories_type CASCADE;

-- Supprimer les tables existantes
DROP TABLE IF EXISTS financial_budget_allocations CASCADE;
DROP TABLE IF EXISTS financial_budgets CASCADE;
DROP TABLE IF EXISTS financial_alerts CASCADE;
DROP TABLE IF EXISTS financial_predictions CASCADE;
DROP TABLE IF EXISTS financial_categories CASCADE;
DROP TABLE IF EXISTS financial_capital CASCADE;
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS manual_financial_transactions CASCADE;

-- =====================================
-- 📊 CRÉATION DES TABLES (COMPATIBLE BACKEND)
-- =====================================

-- 💰 Table des transactions manuelles (REQUISE par le backend)
CREATE TABLE manual_financial_transactions (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    category VARCHAR(100),
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'manual_injection',
    notes TEXT,
    entity_name VARCHAR(255),
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    impact_capital BOOLEAN DEFAULT true,
    metadata JSONB
);

-- 📊 Capital financier en temps réel (structure simplifiée)
CREATE TABLE financial_capital (
    id SERIAL PRIMARY KEY,
    current_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_income NUMERIC(15,2) DEFAULT 0,
    total_expenses NUMERIC(15,2) DEFAULT 0,
    monthly_income NUMERIC(15,2) DEFAULT 0,
    monthly_expenses NUMERIC(15,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,
    notes TEXT
);

-- 🏷️ Catégories financières
CREATE TABLE financial_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'money',
    monthly_budget NUMERIC(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- 🔍 VUES POUR LE DASHBOARD (VRAIES DONNÉES)
-- =====================================

-- Vue des flux financiers unifiés (RÉCUPÈRE LES VRAIES DONNÉES)
CREATE VIEW v_unified_financial_flows AS
-- Vrais paiements etudiants
SELECT 
    'INCOME' as type,
    CAST(sp.amount AS NUMERIC) as amount,
    sp.payment_date as transaction_date,
    'student_payment' as source,
    EXTRACT(YEAR FROM sp.payment_date) as year,
    EXTRACT(MONTH FROM sp.payment_date) as month,
    s.first_name || ' ' || s.last_name as entity_name,
    sp.payment_type as category_detail,
    sp.created_at
FROM student_payments sp
JOIN students s ON sp.student_id = s.id
WHERE sp.is_cancelled = FALSE
  AND sp.payment_date IS NOT NULL
  AND sp.amount > 0

UNION ALL

-- Vraies depenses generales
SELECT 
    'EXPENSE' as type,
    CAST(e.amount AS NUMERIC) as amount,
    e.expense_date as transaction_date,
    'general_expense' as source,
    EXTRACT(YEAR FROM e.expense_date) as year,
    EXTRACT(MONTH FROM e.expense_date) as month,
    COALESCE(e.supplier_name, 'Fournisseur non specifie') as entity_name,
    COALESCE(ec.name, 'Depense generale') as category_detail,
    e.created_at
FROM expenses e
LEFT JOIN expense_categories ec ON e.category_id = ec.id
WHERE e.paid_date IS NOT NULL
  AND e.expense_date IS NOT NULL
  AND e.amount > 0

UNION ALL

-- Vrais salaires personnel
SELECT 
    'EXPENSE' as type,
    CAST(sal.amount AS NUMERIC) as amount,
    sal.payment_date as transaction_date,
    'staff_salary' as source,
    EXTRACT(YEAR FROM sal.payment_date) as year,
    EXTRACT(MONTH FROM sal.payment_date) as month,
    st.first_name || ' ' || st.last_name as entity_name,
    'Salaire personnel' as category_detail,
    sal.created_at
FROM salary_payments_v2 sal
JOIN staff_salaries_v2 ss ON sal.staff_salary_id = ss.id
JOIN staff st ON ss.staff_id = st.id
WHERE sal.status = 'completed'
  AND sal.payment_date IS NOT NULL
  AND sal.amount > 0

UNION ALL

-- Transactions manuelles (quand elles existent)
SELECT 
    mft.type,
    mft.amount,
    mft.transaction_date,
    'manual_transaction' as source,
    EXTRACT(YEAR FROM mft.transaction_date) as year,
    EXTRACT(MONTH FROM mft.transaction_date) as month,
    COALESCE(mft.entity_name, 'Transaction manuelle') as entity_name,
    COALESCE(mft.category, 'Injection manuelle') as category_detail,
    mft.created_at
FROM manual_financial_transactions mft
WHERE mft.impact_capital = true
  AND mft.transaction_date IS NOT NULL
  AND mft.amount > 0;

-- Vue du dashboard financier (CALCULS BASÉS SUR VRAIES DONNÉES)
CREATE VIEW v_financial_dashboard_live AS
SELECT 
    -- CAPITAL TOTAL (VRAIES DONNÉES)
    COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END), 0) as current_balance,
    
    -- FLUX MENSUEL ACTUEL (VRAIES DONNÉES)
    COALESCE(SUM(CASE WHEN type = 'INCOME' AND year = EXTRACT(YEAR FROM CURRENT_DATE) 
                  AND month = EXTRACT(MONTH FROM CURRENT_DATE) THEN amount ELSE 0 END), 0) as monthly_income,
    COALESCE(SUM(CASE WHEN type = 'EXPENSE' AND year = EXTRACT(YEAR FROM CURRENT_DATE) 
                  AND month = EXTRACT(MONTH FROM CURRENT_DATE) THEN amount ELSE 0 END), 0) as monthly_expenses,
    
    -- FLUX MOIS PRÉCÉDENT (VRAIES DONNÉES)
    COALESCE(SUM(CASE WHEN type = 'INCOME' AND 
                ((year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE) - 1) OR
                 (year = EXTRACT(YEAR FROM CURRENT_DATE) - 1 AND month = 12 AND EXTRACT(MONTH FROM CURRENT_DATE) = 1))
             THEN amount ELSE 0 END), 0) as prev_monthly_income,
    COALESCE(SUM(CASE WHEN type = 'EXPENSE' AND 
                ((year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE) - 1) OR
                 (year = EXTRACT(YEAR FROM CURRENT_DATE) - 1 AND month = 12 AND EXTRACT(MONTH FROM CURRENT_DATE) = 1))
             THEN amount ELSE 0 END), 0) as prev_monthly_expenses,
    
    -- STATISTIQUES (VRAIES DONNÉES)
    COUNT(*) as total_transactions,
    COUNT(DISTINCT source) as unique_sources,
    COUNT(DISTINCT entity_name) as unique_entities,
    COUNT(CASE WHEN type = 'INCOME' THEN 1 END) as income_transactions,
    COUNT(CASE WHEN type = 'EXPENSE' THEN 1 END) as expense_transactions,
    
    COALESCE(AVG(CASE WHEN type = 'INCOME' THEN amount END), 0) as avg_income_amount,
    COALESCE(AVG(CASE WHEN type = 'EXPENSE' THEN amount END), 0) as avg_expense_amount,
    COALESCE(MAX(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as max_income,
    COALESCE(MAX(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as max_expense,
    COALESCE(MIN(CASE WHEN type = 'INCOME' THEN amount ELSE 999999999 END), 0) as min_income,
    COALESCE(MIN(CASE WHEN type = 'EXPENSE' THEN amount ELSE 999999999 END), 0) as min_expense
    
FROM v_unified_financial_flows;

-- =====================================
-- 🔄 FONCTIONS AUTOMATIQUES
-- =====================================

-- Fonction de mise à jour du capital (BASÉE SUR VRAIES DONNÉES)
CREATE OR REPLACE FUNCTION update_financial_capital_simple()
RETURNS TEXT AS $$
DECLARE
    capital_data RECORD;
    result_text TEXT;
BEGIN
    -- Récupérer les vraies données depuis la vue
    SELECT * INTO capital_data FROM v_financial_dashboard_live;
    
    -- Supprimer l'ancien capital et insérer le nouveau
    DELETE FROM financial_capital;
    
    INSERT INTO financial_capital (
        current_balance, total_income, total_expenses, 
        monthly_income, monthly_expenses, last_updated
    ) VALUES (
        capital_data.current_balance,
        capital_data.total_income,
        capital_data.total_expenses,
        capital_data.monthly_income,
        capital_data.monthly_expenses,
        CURRENT_TIMESTAMP
    );
    
    result_text := 'Capital calcule depuis vraies donnees: ' || 
                   COALESCE(capital_data.current_balance::TEXT, '0') || ' FG';
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les statistiques financières (VRAIES DONNÉES)
CREATE OR REPLACE FUNCTION get_financial_stats()
RETURNS TABLE(
    current_balance NUMERIC,
    total_income NUMERIC,
    total_expenses NUMERIC,
    monthly_income NUMERIC,
    monthly_expenses NUMERIC,
    total_transactions BIGINT
) AS $$
BEGIN
    RETURN QUERY SELECT 
        v.current_balance,
        v.total_income,
        v.total_expenses,
        v.monthly_income,
        v.monthly_expenses,
        v.total_transactions
    FROM v_financial_dashboard_live v;
END;
$$ LANGUAGE plpgsql;

-- Fonction d'injection de transaction
CREATE OR REPLACE FUNCTION inject_transaction(
    p_type VARCHAR,
    p_amount NUMERIC,
    p_description TEXT,
    p_category VARCHAR DEFAULT NULL,
    p_entity_name VARCHAR DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    new_id INTEGER;
    ref_number VARCHAR;
BEGIN
    -- Générer une référence unique
    ref_number := 'INJ-' || p_type || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT;
    
    -- Insérer la transaction
    INSERT INTO manual_financial_transactions (
        reference, type, amount, description, category, entity_name
    ) VALUES (
        ref_number, p_type, p_amount, p_description, 
        COALESCE(p_category, CASE WHEN p_type = 'INCOME' THEN 'Revenus divers' ELSE 'Sorties diverses' END),
        COALESCE(p_entity_name, 'Manuel')
    ) RETURNING id INTO new_id;
    
    -- Mettre à jour le capital
    PERFORM update_financial_capital_simple();
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour le rapport des vraies données
CREATE OR REPLACE FUNCTION show_real_data_summary()
RETURNS TABLE(
    source_type TEXT,
    transaction_count BIGINT,
    total_amount NUMERIC,
    date_range TEXT
) AS $$
BEGIN
    RETURN QUERY
    
    -- Paiements étudiants
    SELECT 
        'Paiements Etudiants'::TEXT,
        COUNT(*)::BIGINT,
        COALESCE(SUM(amount), 0)::NUMERIC,
        COALESCE(MIN(payment_date)::TEXT || ' a ' || MAX(payment_date)::TEXT, 'Aucune donnee')::TEXT
    FROM student_payments 
    WHERE is_cancelled = FALSE AND amount > 0
    
    UNION ALL
    
    -- Dépenses générales
    SELECT 
        'Depenses Generales'::TEXT,
        COUNT(*)::BIGINT,
        COALESCE(SUM(amount), 0)::NUMERIC,
        COALESCE(MIN(expense_date)::TEXT || ' a ' || MAX(expense_date)::TEXT, 'Aucune donnee')::TEXT
    FROM expenses 
    WHERE paid_date IS NOT NULL AND amount > 0
    
    UNION ALL
    
    -- Salaires personnel
    SELECT 
        'Salaires Personnel'::TEXT,
        COUNT(*)::BIGINT,
        COALESCE(SUM(amount), 0)::NUMERIC,
        COALESCE(MIN(payment_date)::TEXT || ' a ' || MAX(payment_date)::TEXT, 'Aucune donnee')::TEXT
    FROM salary_payments_v2 
    WHERE status = 'completed' AND amount > 0;
    
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 🔄 TRIGGERS DE SYNCHRONISATION
-- =====================================

-- Trigger pour mise à jour automatique du capital
CREATE OR REPLACE FUNCTION trigger_update_capital()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_financial_capital_simple();
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_capital_on_student_payment
    AFTER INSERT OR UPDATE OR DELETE ON student_payments
    FOR EACH ROW EXECUTE FUNCTION trigger_update_capital();

CREATE TRIGGER tr_update_capital_on_expense
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW EXECUTE FUNCTION trigger_update_capital();

CREATE TRIGGER tr_update_capital_on_salary
    AFTER INSERT OR UPDATE OR DELETE ON salary_payments_v2
    FOR EACH ROW EXECUTE FUNCTION trigger_update_capital();

CREATE TRIGGER tr_update_capital_on_manual
    AFTER INSERT OR UPDATE OR DELETE ON manual_financial_transactions
    FOR EACH ROW EXECUTE FUNCTION trigger_update_capital();

-- =====================================
-- 📊 DONNÉES D'INITIALISATION
-- =====================================

-- Catégories de base
INSERT INTO financial_categories (name, type, color, monthly_budget) VALUES
('Frais de Scolarite', 'INCOME', '#10B981', 5000000),
('Frais Inscription', 'INCOME', '#059669', 1000000),
('Frais Examen', 'INCOME', '#0891B2', 500000),
('Services Annexes', 'INCOME', '#0284C7', 300000),
('Subventions', 'INCOME', '#3B82F6', 2000000),
('Salaires Personnel', 'EXPENSE', '#EF4444', 3000000),
('Charges Fixes', 'EXPENSE', '#DC2626', 800000),
('Fournitures Pedagogiques', 'EXPENSE', '#B91C1C', 500000),
('Maintenance', 'EXPENSE', '#991B1B', 400000),
('Transport', 'EXPENSE', '#F97316', 300000),
('Autres Depenses', 'EXPENSE', '#EA580C', 200000);

-- =====================================
-- 🚀 INDEX POUR PERFORMANCES
-- =====================================

CREATE INDEX idx_manual_transactions_date ON manual_financial_transactions(transaction_date);
CREATE INDEX idx_manual_transactions_type ON manual_financial_transactions(type);
CREATE INDEX idx_financial_categories_type ON financial_categories(type);

-- =====================================
-- 🚀 INITIALISATION AVEC VRAIES DONNÉES
-- =====================================

-- Calculer le capital initial basé sur les vraies données existantes
SELECT update_financial_capital_simple();

-- =====================================
-- ✅ VÉRIFICATION FINALE ET RAPPORT
-- =====================================

-- Test final et affichage des vraies statistiques
DO $$
DECLARE
    stats RECORD;
    real_data_count INTEGER;
BEGIN
    -- Vérifier combien de vraies transactions on a
    SELECT COUNT(*) INTO real_data_count FROM v_unified_financial_flows;
    
    -- Récupérer les stats calculées
    SELECT * INTO stats FROM get_financial_stats();
    
    RAISE NOTICE '=== SYSTEME FINANCIER INSTALLE AVEC VRAIES DONNEES ===';
    RAISE NOTICE 'Nombre de transactions reelles trouvees: %', real_data_count;
    RAISE NOTICE 'Solde actuel: %.2f FG', stats.current_balance;
    RAISE NOTICE 'Revenus mensuels: %.2f FG', stats.monthly_income;
    RAISE NOTICE 'Depenses mensuelles: %.2f FG', stats.monthly_expenses;
    RAISE NOTICE 'Total transactions: %', stats.total_transactions;
    RAISE NOTICE 'Systeme financier installe avec succes !';
END $$;