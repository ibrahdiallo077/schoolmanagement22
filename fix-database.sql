-- Script de correction pour la base de données École Moderne
-- Fichier: fix-database.sql

-- Supprimer les tables problématiques si elles existent
DROP TABLE IF EXISTS student_payments CASCADE;
DROP TABLE IF EXISTS payment_schedules CASCADE;
DROP TABLE IF EXISTS tuition_fees CASCADE;
DROP TABLE IF EXISTS salary_payments CASCADE;
DROP TABLE IF EXISTS staff_salaries CASCADE;
DROP TABLE IF EXISTS guardians CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- Recréer la table students sans la colonne calculée problématique
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    age INTEGER, -- Colonne normale au lieu de générée
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

-- Table des tuteurs/gardiens
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

-- Table des salaires du personnel par année scolaire
CREATE TABLE IF NOT EXISTS staff_salaries (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    school_year_id INTEGER REFERENCES school_years(id) ON DELETE CASCADE,
    monthly_salary DECIMAL(10,2) NOT NULL,
    effective_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, school_year_id)
);

-- Table des paiements de salaires
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

-- Table des frais de scolarité par classe et année
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

-- Table des échéances de paiement
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

-- Table des paiements des étudiants
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

-- Fonction pour calculer l'âge automatiquement
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger pour mettre à jour l'âge automatiquement
CREATE OR REPLACE FUNCTION update_student_age()
RETURNS TRIGGER AS $$
BEGIN
    NEW.age = calculate_age(NEW.birth_date);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur les insertions et mises à jour
DROP TRIGGER IF EXISTS trigger_update_student_age ON students;
CREATE TRIGGER trigger_update_student_age
    BEFORE INSERT OR UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_student_age();

-- Triggers pour les timestamps (si pas déjà créés)
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guardians_updated_at ON guardians;
CREATE TRIGGER update_guardians_updated_at 
    BEFORE UPDATE ON guardians 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Créer les index manquants
CREATE INDEX IF NOT EXISTS idx_students_school_year ON students(school_year_id);
CREATE INDEX IF NOT EXISTS idx_students_student_number ON students(student_number);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_guardians_student ON guardians(student_id);

-- Message de confirmation
SELECT 'Tables students et dépendances créées avec succès!' as message;