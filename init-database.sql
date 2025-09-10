-- Script d'initialisation de la base de données École Moderne
-- Fichier: init-database.sql

-- Créer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table des années scolaires
CREATE TABLE IF NOT EXISTS school_years (
    id SERIAL PRIMARY KEY,
    label VARCHAR(20) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table du personnel (créée avant classes pour la référence teacher_id)
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    staff_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(100),
    department VARCHAR(100),
    email VARCHAR(200) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    hire_date DATE,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'on_leave')) DEFAULT 'active',
    photo_url VARCHAR(500),
    qualifications TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table des classes
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    school_year_id INTEGER REFERENCES school_years(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    level VARCHAR(50),
    type VARCHAR(20) CHECK (type IN ('coranic', 'french')),
    schedule TEXT,
    teacher_id INTEGER REFERENCES staff(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table des étudiants
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    age INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM AGE(birth_date))) STORED,
    gender VARCHAR(20),
    is_orphan BOOLEAN DEFAULT FALSE,
    is_needy BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) CHECK (status IN ('nouveau', 'ancien')) DEFAULT 'nouveau',
    coranic_class_id INTEGER REFERENCES classes(id),
    french_class_id INTEGER REFERENCES classes(id),
    enrollment_date DATE,
    school_year_id INTEGER REFERENCES school_years(id),
    photo_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table des tuteurs/gardiens
CREATE TABLE IF NOT EXISTS guardians (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(200),
    address TEXT,
    relationship VARCHAR(50),
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table des salaires du personnel par année scolaire
CREATE TABLE IF NOT EXISTS staff_salaries (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    school_year_id INTEGER REFERENCES school_years(id) ON DELETE CASCADE,
    monthly_salary DECIMAL(10,2) NOT NULL,
    effective_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, school_year_id)
);

-- 7. Table des paiements de salaires
CREATE TABLE IF NOT EXISTS salary_payments (
    id SERIAL PRIMARY KEY,
    staff_salary_id INTEGER REFERENCES staff_salaries(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_month INTEGER CHECK (payment_month BETWEEN 1 AND 12),
    payment_year INTEGER,
    payment_date DATE,
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'bank_transfer', 'mobile_money')),
    paid_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Table des frais de scolarité par classe et année
CREATE TABLE IF NOT EXISTS tuition_fees (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    school_year_id INTEGER REFERENCES school_years(id) ON DELETE CASCADE,
    registration_fee DECIMAL(10,2),
    monthly_amount DECIMAL(10,2),
    annual_amount DECIMAL(10,2),
    additional_fees DECIMAL(10,2) DEFAULT 0,
    payment_type VARCHAR(20) CHECK (payment_type IN ('monthly', 'annual', 'both')),
    orphan_discount_percent DECIMAL(5,2) DEFAULT 0,
    needy_discount_percent DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, school_year_id)
);

-- 9. Table des échéances de paiement
CREATE TABLE IF NOT EXISTS payment_schedules (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    tuition_fee_id INTEGER REFERENCES tuition_fees(id) ON DELETE CASCADE,
    due_month INTEGER CHECK (due_month BETWEEN 1 AND 12),
    due_year INTEGER,
    amount_due DECIMAL(10,2) NOT NULL,
    discount_applied DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('pending', 'paid', 'partial', 'overdue')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Table des paiements des étudiants
CREATE TABLE IF NOT EXISTS student_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_schedule_id INTEGER REFERENCES payment_schedules(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE,
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'mobile_money', 'bank_transfer', 'check')),
    paid_by VARCHAR(100),
    receipt_number VARCHAR(50) UNIQUE,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Table des utilisateurs administrateurs
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) CHECK (role IN ('super_admin', 'admin', 'teacher', 'accountant')) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Fonction pour générer un numéro d'étudiant unique
CREATE OR REPLACE FUNCTION generate_student_number()
RETURNS TEXT AS $$
DECLARE
    year_suffix TEXT;
    sequence_num INTEGER;
    new_number TEXT;
BEGIN
    year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(student_number FROM 4) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM students 
    WHERE student_number LIKE 'ET' || year_suffix || '%';
    
    new_number := 'ET' || year_suffix || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- 13. Fonction pour générer un numéro d'employé unique
CREATE OR REPLACE FUNCTION generate_staff_number()
RETURNS TEXT AS $$
DECLARE
    year_suffix TEXT;
    sequence_num INTEGER;
    new_number TEXT;
BEGIN
    year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(staff_number FROM 4) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM staff 
    WHERE staff_number LIKE 'EMP' || year_suffix || '%';
    
    new_number := 'EMP' || year_suffix || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- 14. Fonction de mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Triggers pour mise à jour automatique des timestamps
CREATE TRIGGER update_school_years_updated_at BEFORE UPDATE ON school_years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guardians_updated_at BEFORE UPDATE ON guardians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 16. Insertion des données initiales

-- Année scolaire par défaut
INSERT INTO school_years (label, start_date, end_date, is_active) 
VALUES ('2024-2025', '2024-09-01', '2025-07-15', true)
ON CONFLICT (label) DO NOTHING;

-- Super administrateur par défaut (mot de passe: admin123)
-- Le hash correspond au mot de passe "admin123" avec bcrypt rounds=12
INSERT INTO admin_users (username, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    'admin', 
    'admin@ecole.com', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaQJOCNdq8/Z8TvG8w9QGvH1C',
    'Super', 
    'Administrateur', 
    'super_admin', 
    true
)
ON CONFLICT (username) DO NOTHING;

-- Classes par défaut pour l'année en cours
INSERT INTO classes (school_year_id, name, level, type) VALUES 
((SELECT id FROM school_years WHERE is_active = true), 'CP Coranique', 'CP', 'coranic'),
((SELECT id FROM school_years WHERE is_active = true), 'CE1 Coranique', 'CE1', 'coranic'),
((SELECT id FROM school_years WHERE is_active = true), 'CE2 Coranique', 'CE2', 'coranic'),
((SELECT id FROM school_years WHERE is_active = true), 'CM1 Coranique', 'CM1', 'coranic'),
((SELECT id FROM school_years WHERE is_active = true), 'CM2 Coranique', 'CM2', 'coranic'),
((SELECT id FROM school_years WHERE is_active = true), 'CP Français', 'CP', 'french'),
((SELECT id FROM school_years WHERE is_active = true), 'CE1 Français', 'CE1', 'french'),
((SELECT id FROM school_years WHERE is_active = true), 'CE2 Français', 'CE2', 'french'),
((SELECT id FROM school_years WHERE is_active = true), 'CM1 Français', 'CM1', 'french'),
((SELECT id FROM school_years WHERE is_active = true), 'CM2 Français', 'CM2', 'french')
ON CONFLICT DO NOTHING;

-- 17. Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_students_school_year ON students(school_year_id);
CREATE INDEX IF NOT EXISTS idx_students_student_number ON students(student_number);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_guardians_student ON guardians(student_id);
CREATE INDEX IF NOT EXISTS idx_staff_staff_number ON staff(staff_number);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Affichage du résumé
SELECT 'Base de données École Moderne initialisée avec succès!' as message;
SELECT 'Utilisateur admin créé - Username: admin, Email: admin@ecole.com, Password: admin123' as admin_info;



