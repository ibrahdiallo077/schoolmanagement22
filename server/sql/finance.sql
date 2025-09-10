-- =====================================
-- 🏦 SYSTÈME FINANCIER ÉCOLE MODERNE
-- =====================================

-- 🗑️ Supprimer les tables existantes si elles existent (ordre inverse des dépendances)
DROP TRIGGER IF EXISTS tr_update_capital_on_student_payment ON student_payments CASCADE;
DROP TRIGGER IF EXISTS tr_update_capital_on_expense ON expenses CASCADE;
DROP TRIGGER IF EXISTS tr_update_capital_on_salary ON salary_payments_v2 CASCADE;

DROP FUNCTION IF EXISTS update_financial_capital() CASCADE;
DROP FUNCTION IF EXISTS generate_financial_predictions(INTEGER) CASCADE;

DROP VIEW IF EXISTS v_financial_dashboard CASCADE;
DROP VIEW IF EXISTS v_financial_flows CASCADE;

DROP TABLE IF EXISTS financial_budget_allocations CASCADE;
DROP TABLE IF EXISTS financial_budgets CASCADE;
DROP TABLE IF EXISTS financial_alerts CASCADE;
DROP TABLE IF EXISTS financial_predictions CASCADE;
DROP TABLE IF EXISTS financial_categories CASCADE;
DROP TABLE IF EXISTS financial_capital CASCADE;
DROP TABLE IF EXISTS financial_transactions CASCADE;

-- =====================================
-- 📊 CRÉATION DES TABLES
-- =====================================

-- 💰 Table principale des transactions financières (INNOVATION)
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    reference VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    
    -- Montants
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    
    -- Dates
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    processed_date DATE,
    
    -- Références vers tables existantes
    source_table VARCHAR(50),
    source_id UUID,
    
    -- Responsabilité
    created_by INTEGER REFERENCES admin_users(id),
    validated_by INTEGER REFERENCES admin_users(id),
    
    -- Statut et méthode
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED')),
    payment_method VARCHAR(30),
    
    -- Métadonnées
    notes TEXT,
    metadata JSON,
    budget_impact BOOLEAN DEFAULT TRUE,
    
    -- Traçabilité
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📊 Capital et trésorerie en temps réel
CREATE TABLE financial_capital (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Montants
    current_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
    reserved_amount NUMERIC(15,2) DEFAULT 0,
    available_amount NUMERIC(15,2) GENERATED ALWAYS AS (current_balance - reserved_amount) STORED,
    
    -- Période
    period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year INTEGER NOT NULL CHECK (period_year BETWEEN 2020 AND 2050),
    
    -- Objectifs et seuils
    monthly_target NUMERIC(15,2) DEFAULT 0,
    alert_threshold NUMERIC(15,2) DEFAULT 500000,
    
    -- Statistiques automatiques
    total_income NUMERIC(15,2) DEFAULT 0,
    total_expenses NUMERIC(15,2) DEFAULT 0,
    net_flow NUMERIC(15,2) GENERATED ALWAYS AS (total_income - total_expenses) STORED,
    
    -- Métadonnées
    notes TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES admin_users(id),
    
    UNIQUE(period_month, period_year)
);

-- 💡 Catégories financières intelligentes
CREATE TABLE financial_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    parent_id UUID REFERENCES financial_categories(id),
    
    -- Visuels
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'DollarSign',
    
    -- Budget
    monthly_budget NUMERIC(15,2) DEFAULT 0,
    yearly_budget NUMERIC(15,2) DEFAULT 0,
    
    -- Règles automatiques
    is_recurring BOOLEAN DEFAULT FALSE,
    auto_approve BOOLEAN DEFAULT FALSE,
    requires_validation BOOLEAN DEFAULT TRUE,
    
    -- Priorité et ordre
    priority INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 1,
    
    -- Métadonnées
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📈 Prédictions et analytiques (INNOVATION IA)
CREATE TABLE financial_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Période de prédiction
    prediction_month INTEGER NOT NULL,
    prediction_year INTEGER NOT NULL,
    prediction_type VARCHAR(50) NOT NULL,
    
    -- Prédictions
    predicted_income NUMERIC(15,2) NOT NULL,
    predicted_expenses NUMERIC(15,2) NOT NULL,
    predicted_balance NUMERIC(15,2) GENERATED ALWAYS AS (predicted_income - predicted_expenses) STORED,
    confidence_score DECIMAL(3,2) DEFAULT 0.75,
    
    -- Base de calcul
    algorithm_used VARCHAR(50) DEFAULT 'TREND_ANALYSIS',
    data_points_used INTEGER DEFAULT 12,
    
    -- Facteurs d'influence
    student_count_factor NUMERIC(5,2) DEFAULT 1.0,
    seasonal_factor NUMERIC(5,2) DEFAULT 1.0,
    economic_factor NUMERIC(5,2) DEFAULT 1.0,
    
    -- Métadonnées
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by INTEGER REFERENCES admin_users(id),
    
    UNIQUE(prediction_month, prediction_year, prediction_type)
);

-- 🚨 Alertes financières intelligentes
CREATE TABLE financial_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    -- Conditions de déclenchement
    threshold_amount NUMERIC(15,2),
    threshold_percentage DECIMAL(5,2),
    
    -- Destinataires
    target_roles JSON,
    notification_methods JSON,
    
    -- État
    is_active BOOLEAN DEFAULT TRUE,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES admin_users(id),
    
    -- Récurrence
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50),
    
    -- Métadonnées
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_snapshot JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🎯 Budgets et planification
CREATE TABLE financial_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Période
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget_year INTEGER NOT NULL,
    
    -- Type et statut
    budget_type VARCHAR(50) DEFAULT 'ANNUAL' CHECK (budget_type IN ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'PROJECT')),
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    
    -- Montants globaux
    total_budget NUMERIC(15,2) NOT NULL,
    allocated_amount NUMERIC(15,2) DEFAULT 0,
    spent_amount NUMERIC(15,2) DEFAULT 0,
    remaining_amount NUMERIC(15,2) GENERATED ALWAYS AS (total_budget - spent_amount) STORED,
    
    -- Analyse de performance
    utilization_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN total_budget > 0 THEN (spent_amount / total_budget) * 100 ELSE 0 END
    ) STORED,
    
    -- Responsabilité
    created_by INTEGER REFERENCES admin_users(id),
    approved_by INTEGER REFERENCES admin_users(id),
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 💰 Détails des allocations budgétaires
CREATE TABLE financial_budget_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    budget_id UUID REFERENCES financial_budgets(id) ON DELETE CASCADE,
    category_id UUID REFERENCES financial_categories(id),
    
    -- Allocation
    allocated_amount NUMERIC(15,2) NOT NULL,
    spent_amount NUMERIC(15,2) DEFAULT 0,
    remaining_amount NUMERIC(15,2) GENERATED ALWAYS AS (allocated_amount - spent_amount) STORED,
    
    -- Pourcentages
    percentage_of_total DECIMAL(5,2) NOT NULL,
    variance_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN allocated_amount > 0 THEN ((spent_amount - allocated_amount) / allocated_amount) * 100 ELSE 0 END
    ) STORED,
    
    -- Limites et contrôles
    soft_limit NUMERIC(15,2),
    hard_limit NUMERIC(15,2),
    allow_overflow BOOLEAN DEFAULT FALSE,
    
    -- Métadonnées
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- 📊 VUES POUR TABLEAUX DE BORD
-- =====================================

-- Vue consolidée des flux financiers
CREATE VIEW v_financial_flows AS
SELECT 
    'INCOME' as flow_type,
    'student_payments' as source,
    sp.payment_date as transaction_date,
    sp.amount,
    sp.payment_type as category,
    s.first_name || ' ' || s.last_name as entity_name,
    sp.payment_method,
    sp.created_by as processed_by
FROM student_payments sp
JOIN students s ON sp.student_id = s.id
WHERE sp.is_cancelled = FALSE

UNION ALL

SELECT 
    'EXPENSE' as flow_type,
    'expenses' as source,
    e.expense_date as transaction_date,
    e.amount,
    ec.name as category,
    e.supplier_name as entity_name,
    e.payment_method,
    e.responsible_user_name as processed_by
FROM expenses e
JOIN expense_categories ec ON e.category_id = ec.id

UNION ALL

SELECT 
    'EXPENSE' as flow_type,
    'salary_payments' as source,
    sal.payment_date as transaction_date,
    sal.amount,
    'Salaire Personnel' as category,
    st.first_name || ' ' || st.last_name as entity_name,
    sal.payment_method,
    sal.created_by as processed_by
FROM salary_payments_v2 sal
JOIN staff_salaries_v2 ss ON sal.staff_salary_id = ss.id
JOIN staff st ON ss.staff_id = st.id
WHERE sal.status = 'completed';

-- Vue du tableau de bord financier
CREATE VIEW v_financial_dashboard AS
SELECT 
    DATE_TRUNC('month', transaction_date) as period,
    EXTRACT(YEAR FROM transaction_date) as year,
    EXTRACT(MONTH FROM transaction_date) as month,
    
    -- Totaux par type
    SUM(CASE WHEN flow_type = 'INCOME' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN flow_type = 'EXPENSE' THEN amount ELSE 0 END) as total_expenses,
    SUM(CASE WHEN flow_type = 'INCOME' THEN amount ELSE -amount END) as net_flow,
    
    -- Détails par catégorie
    COUNT(*) as transaction_count,
    AVG(CASE WHEN flow_type = 'INCOME' THEN amount END) as avg_income_transaction,
    AVG(CASE WHEN flow_type = 'EXPENSE' THEN amount END) as avg_expense_transaction
    
FROM v_financial_flows
GROUP BY DATE_TRUNC('month', transaction_date), EXTRACT(YEAR FROM transaction_date), EXTRACT(MONTH FROM transaction_date)
ORDER BY period DESC;

-- =====================================
-- 🔄 TRIGGERS ET FONCTIONS
-- =====================================

-- Fonction pour mettre à jour le capital automatiquement
CREATE OR REPLACE FUNCTION update_financial_capital()
RETURNS TRIGGER AS $$
BEGIN
    -- Insérer ou mettre à jour le capital du mois courant
    INSERT INTO financial_capital (
        period_month, 
        period_year, 
        current_balance,
        total_income,
        total_expenses
    )
    VALUES (
        EXTRACT(MONTH FROM CURRENT_DATE),
        EXTRACT(YEAR FROM CURRENT_DATE),
        (SELECT COALESCE(SUM(CASE WHEN flow_type = 'INCOME' THEN amount ELSE -amount END), 0) 
         FROM v_financial_flows),
        (SELECT COALESCE(SUM(amount), 0) FROM v_financial_flows WHERE flow_type = 'INCOME'),
        (SELECT COALESCE(SUM(amount), 0) FROM v_financial_flows WHERE flow_type = 'EXPENSE')
    )
    ON CONFLICT (period_month, period_year) 
    DO UPDATE SET
        current_balance = (SELECT COALESCE(SUM(CASE WHEN flow_type = 'INCOME' THEN amount ELSE -amount END), 0) 
                          FROM v_financial_flows),
        total_income = (SELECT COALESCE(SUM(amount), 0) FROM v_financial_flows WHERE flow_type = 'INCOME'),
        total_expenses = (SELECT COALESCE(SUM(amount), 0) FROM v_financial_flows WHERE flow_type = 'EXPENSE'),
        last_updated = CURRENT_TIMESTAMP;
        
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger sur les paiements étudiants
CREATE TRIGGER tr_update_capital_on_student_payment
    AFTER INSERT OR UPDATE OR DELETE ON student_payments
    FOR EACH ROW EXECUTE FUNCTION update_financial_capital();

-- Trigger sur les dépenses
CREATE TRIGGER tr_update_capital_on_expense
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_financial_capital();

-- Trigger sur les salaires
CREATE TRIGGER tr_update_capital_on_salary
    AFTER INSERT OR UPDATE OR DELETE ON salary_payments_v2
    FOR EACH ROW EXECUTE FUNCTION update_financial_capital();

-- =====================================
-- 📈 DONNÉES D'INITIALISATION
-- =====================================

-- Catégories financières de base (CORRIGÉ)
INSERT INTO financial_categories (name, type, color, icon, monthly_budget) VALUES
-- REVENUS
('Frais de Scolarité', 'INCOME', '#10B981', 'GraduationCap', 5000000),
('Frais d''Inscription', 'INCOME', '#059669', 'UserPlus', 1000000),
('Frais d''Examen', 'INCOME', '#0891B2', 'FileText', 500000),
('Services Annexes', 'INCOME', '#0284C7', 'Package', 300000),
('Subventions', 'INCOME', '#3B82F6', 'TrendingUp', 2000000),

-- DÉPENSES
('Salaires Personnel', 'EXPENSE', '#EF4444', 'Users', 3000000),
('Charges Fixes', 'EXPENSE', '#DC2626', 'Zap', 800000),
('Fournitures Pédagogiques', 'EXPENSE', '#B91C1C', 'BookOpen', 500000),
('Maintenance', 'EXPENSE', '#991B1B', 'Wrench', 400000),
('Transport', 'EXPENSE', '#F97316', 'Car', 300000),
('Autres Dépenses', 'EXPENSE', '#EA580C', 'Package', 200000);

-- Initialiser le capital actuel
INSERT INTO financial_capital (period_month, period_year, current_balance, total_income, total_expenses, monthly_target)
SELECT 
    EXTRACT(MONTH FROM CURRENT_DATE),
    EXTRACT(YEAR FROM CURRENT_DATE),
    COALESCE(SUM(CASE WHEN flow_type = 'INCOME' THEN amount ELSE -amount END), 0),
    COALESCE(SUM(CASE WHEN flow_type = 'INCOME' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN flow_type = 'EXPENSE' THEN amount ELSE 0 END), 0),
    8000000 -- Objectif mensuel de 8M FG
FROM v_financial_flows;

-- =====================================
-- 🎯 INDEX POUR PERFORMANCES
-- =====================================

CREATE INDEX idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX idx_financial_transactions_category ON financial_transactions(category);
CREATE INDEX idx_financial_capital_period ON financial_capital(period_year, period_month);
CREATE INDEX idx_financial_flows_date ON student_payments(payment_date);
CREATE INDEX idx_financial_flows_amount ON expenses(amount);

-- =====================================
-- 🎯 FONCTIONS UTILITAIRES
-- =====================================

-- Fonction pour calculer les prédictions automatiques
CREATE OR REPLACE FUNCTION generate_financial_predictions(months_ahead INTEGER DEFAULT 3)
RETURNS TABLE(month INT, year INT, predicted_income NUMERIC, predicted_expenses NUMERIC) AS $$
DECLARE
    avg_income NUMERIC;
    avg_expenses NUMERIC;
    trend_factor NUMERIC := 1.05;
    i INTEGER;
BEGIN
    -- Calculer les moyennes des 12 derniers mois
    SELECT 
        AVG(total_income),
        AVG(total_expenses)
    INTO avg_income, avg_expenses
    FROM v_financial_dashboard
    WHERE period >= CURRENT_DATE - INTERVAL '12 months';
    
    -- Générer les prédictions
    FOR i IN 1..months_ahead LOOP
        month := EXTRACT(MONTH FROM CURRENT_DATE + (i || ' months')::INTERVAL);
        year := EXTRACT(YEAR FROM CURRENT_DATE + (i || ' months')::INTERVAL);
        predicted_income := avg_income * (trend_factor ^ (i/12.0));
        predicted_expenses := avg_expenses * (1.02 ^ (i/12.0));
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 🔄 FONCTION POUR SYNCHRONISER LES DONNÉES
-- =====================================

-- Fonction pour synchroniser les transactions existantes
CREATE OR REPLACE FUNCTION sync_existing_transactions()
RETURNS VOID AS $$
BEGIN
    -- Synchroniser les paiements étudiants
    INSERT INTO financial_transactions (
        reference, type, category, amount, description,
        transaction_date, source_table, source_id,
        status, payment_method, created_by
    )
    SELECT 
        sp.receipt_number,
        'INCOME',
        sp.payment_type,
        sp.amount,
        'Paiement étudiant: ' || s.first_name || ' ' || s.last_name,
        sp.payment_date,
        'student_payments',
        sp.id,
        'COMPLETED',
        sp.payment_method,
        12 -- ID par défaut
    FROM student_payments sp
    JOIN students s ON sp.student_id = s.id
    WHERE sp.is_cancelled = FALSE
    AND NOT EXISTS (
        SELECT 1 FROM financial_transactions ft 
        WHERE ft.source_table = 'student_payments' AND ft.source_id = sp.id
    );
    
    -- Synchroniser les dépenses
    INSERT INTO financial_transactions (
        reference, type, category, amount, description,
        transaction_date, source_table, source_id,
        status, payment_method, created_by
    )
    SELECT 
        e.reference,
        'EXPENSE',
        ec.name,
        e.amount,
        e.description,
        e.expense_date,
        'expenses',
        e.id,
        CASE WHEN e.paid_date IS NOT NULL THEN 'COMPLETED' ELSE 'PENDING' END,
        e.payment_method,
        e.created_by
    FROM expenses e
    JOIN expense_categories ec ON e.category_id = ec.id
    WHERE NOT EXISTS (
        SELECT 1 FROM financial_transactions ft 
        WHERE ft.source_table = 'expenses' AND ft.source_id = e.id
    );
    
    -- Synchroniser les salaires
    INSERT INTO financial_transactions (
        reference, type, category, amount, description,
        transaction_date, source_table, source_id,
        status, payment_method, created_by
    )
    SELECT 
        sal.receipt_number,
        'EXPENSE',
        'Salaire Personnel',
        sal.amount,
        'Paiement salaire: ' || st.first_name || ' ' || st.last_name,
        sal.payment_date,
        'salary_payments_v2',
        sal.id,
        'COMPLETED',
        sal.payment_method,
        12 -- ID par défaut
    FROM salary_payments_v2 sal
    JOIN staff_salaries_v2 ss ON sal.staff_salary_id = ss.id
    JOIN staff st ON ss.staff_id = st.id
    WHERE sal.status = 'completed'
    AND NOT EXISTS (
        SELECT 1 FROM financial_transactions ft 
        WHERE ft.source_table = 'salary_payments_v2' AND ft.source_id = sal.id
    );
    
END;
$$ LANGUAGE plpgsql;

-- Exécuter la synchronisation
SELECT sync_existing_transactions();