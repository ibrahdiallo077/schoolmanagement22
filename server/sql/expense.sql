CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    name_ar VARCHAR(255),
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'document',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLE DES RESPONSABLES/SERVICES
CREATE TABLE expense_responsibles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLE DES STATUTS DE DEPENSES
CREATE TABLE expense_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    name_ar VARCHAR(100),
    color VARCHAR(7) NOT NULL,
    icon VARCHAR(50) DEFAULT 'clipboard',
    description TEXT,
    is_final BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLE PRINCIPALE DES DEPENSES
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
    responsible_id UUID REFERENCES expense_responsibles(id) ON DELETE SET NULL,
    status_id UUID NOT NULL REFERENCES expense_statuses(id) ON DELETE RESTRICT,
    expense_date DATE NOT NULL,
    due_date DATE,
    paid_date DATE,
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'bank_transfer', 'check', 'card', 'mobile_money')),
    payment_reference VARCHAR(100),
    supplier_name VARCHAR(255),
    supplier_contact VARCHAR(255),
    invoice_number VARCHAR(100),
    receipt_url TEXT,
    notes TEXT,
    budget_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    budget_month INTEGER CHECK (budget_month BETWEEN 1 AND 12),
    created_by INTEGER REFERENCES admin_users(id),
    updated_by INTEGER REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLE DES BUDGETS PAR CATEGORIE
CREATE TABLE expense_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
    budget_year INTEGER NOT NULL,
    budget_month INTEGER CHECK (budget_month BETWEEN 1 AND 12),
    allocated_amount DECIMAL(15,2) NOT NULL CHECK (allocated_amount >= 0),
    spent_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (allocated_amount - COALESCE(spent_amount, 0)) STORED,
    created_by INTEGER REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, budget_year, budget_month)
);

-- 6. TABLE DES HISTORIQUES DE STATUTS
CREATE TABLE expense_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    old_status_id UUID REFERENCES expense_statuses(id),
    new_status_id UUID NOT NULL REFERENCES expense_statuses(id),
    changed_by INTEGER REFERENCES admin_users(id),
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEX POUR OPTIMISATION
CREATE INDEX idx_expenses_reference ON expenses(reference);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_status ON expenses(status_id);
CREATE INDEX idx_expenses_year_month ON expenses(budget_year, budget_month);

-- TRIGGER POUR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expenses_updated_at 
    BEFORE UPDATE ON expenses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON expense_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- TRIGGER POUR REFERENCE AUTOMATIQUE
CREATE OR REPLACE FUNCTION generate_expense_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix TEXT;
    sequence_num INTEGER;
    new_reference TEXT;
BEGIN
    year_prefix := TO_CHAR(NEW.expense_date, 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM E'\\d+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM expenses 
    WHERE reference LIKE 'DEP-' || year_prefix || '-%';
    
    new_reference := 'DEP-' || year_prefix || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    IF NEW.reference IS NULL OR NEW.reference = '' THEN
        NEW.reference := new_reference;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_expense_reference_trigger
    BEFORE INSERT ON expenses
    FOR EACH ROW EXECUTE FUNCTION generate_expense_reference();

-- VUE DETAILLEE DES DEPENSES
CREATE VIEW v_expenses_detailed AS
SELECT 
    e.id,
    e.reference,
    e.description,
    e.amount,
    e.expense_date,
    e.due_date,
    e.paid_date,
    e.payment_method,
    e.supplier_name,
    e.notes,
    e.budget_year,
    e.budget_month,
    c.name as category_name,
    c.color as category_color,
    c.icon as category_icon,
    r.name as responsible_name,
    r.department as responsible_department,
    s.name as status_name,
    s.color as status_color,
    s.icon as status_icon,
    e.created_at,
    e.updated_at,
    TO_CHAR(e.amount, 'FM999,999,999.00') || ' FG' as formatted_amount
FROM expenses e
JOIN expense_categories c ON e.category_id = c.id
LEFT JOIN expense_responsibles r ON e.responsible_id = r.id
JOIN expense_statuses s ON e.status_id = s.id;

-- VUE DASHBOARD DES DEPENSES
CREATE VIEW v_expenses_dashboard AS
SELECT 
    COUNT(*) as total_expenses,
    SUM(amount) as total_amount,
    TO_CHAR(SUM(amount), 'FM999,999,999.00') || ' FG' as formatted_total_amount,
    COUNT(*) FILTER (WHERE s.name = 'En attente') as pending_count,
    SUM(amount) FILTER (WHERE s.name = 'En attente') as pending_amount,
    COUNT(*) FILTER (WHERE s.name = 'Valide') as approved_count,
    SUM(amount) FILTER (WHERE s.name = 'Valide') as approved_amount,
    COUNT(*) FILTER (WHERE s.name = 'Paye') as paid_count,
    SUM(amount) FILTER (WHERE s.name = 'Paye') as paid_amount,
    EXTRACT(YEAR FROM CURRENT_DATE) as current_year,
    EXTRACT(MONTH FROM CURRENT_DATE) as current_month
FROM expenses e
JOIN expense_statuses s ON e.status_id = s.id;

-- VUE DEPENSES PAR CATEGORIE
CREATE VIEW v_expenses_by_category AS
SELECT 
    c.id as category_id,
    c.name as category_name,
    c.color as category_color,
    c.icon as category_icon,
    COUNT(e.id) as expense_count,
    COALESCE(SUM(e.amount), 0) as total_amount,
    TO_CHAR(COALESCE(SUM(e.amount), 0), 'FM999,999,999.00') || ' FG' as formatted_total_amount
FROM expense_categories c
LEFT JOIN expenses e ON c.id = e.category_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.color, c.icon
ORDER BY total_amount DESC;