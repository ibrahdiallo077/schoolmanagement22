-- Schema Database - Gestion des Etudiants avec Double Scolarite (Markaz + Ecole francaise)
-- Version: 1.2 - Corrigee pour encodage et erreurs
-- Compatible: PostgreSQL 12+

-- =============================================
-- SUPPRESSION ET RECREATION FORCEE
-- =============================================

-- Supprimer les tables existantes si elles existent
DROP TABLE IF EXISTS guardians CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS school_years CASCADE;

-- =============================================
-- TABLES PRINCIPALES ETUDIANTS
-- =============================================

-- Table des annees scolaires
CREATE TABLE school_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE, -- Ex: "2024-2025"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_date_range CHECK (end_date > start_date),
    CONSTRAINT valid_year_name CHECK (name ~ '^[0-9]{4}-[0-9]{4}$')
);

-- Index pour performance
CREATE INDEX idx_school_years_current ON school_years(is_current) WHERE is_current = TRUE;
CREATE INDEX idx_school_years_dates ON school_years(start_date, end_date);

-- Contrainte pour une seule annee courante
CREATE UNIQUE INDEX idx_school_years_single_current 
    ON school_years(is_current) WHERE is_current = TRUE;

-- Table des classes (double scolarite: coranique + francaise)
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- Ex: "Hifz 1", "CP", "CE1"
    level VARCHAR(50) NOT NULL, -- Ex: "Debutant", "Intermediaire", "Avance"
    type VARCHAR(20) NOT NULL CHECK (type IN ('coranic', 'french')),
    description TEXT,
    capacity INTEGER DEFAULT 30 CHECK (capacity > 0),
    
    -- Professeur responsable
    teacher_id UUID, -- Reference vers une table teachers (future)
    teacher_name VARCHAR(200), -- Nom temporaire en attendant la table teachers
    
    -- Metadonnees
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performance
CREATE INDEX idx_classes_type ON classes(type);
CREATE INDEX idx_classes_level ON classes(level);
CREATE INDEX idx_classes_active ON classes(is_active) WHERE is_active = TRUE;

-- Table principale des etudiants
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification unique
    student_number VARCHAR(50) NOT NULL UNIQUE, -- Ex: ELV-2024-001
    
    -- Informations personnelles
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    age INTEGER,
    gender CHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
    
    -- Statut social et educatif
    is_orphan BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'externe' 
        CHECK (status IN ('interne', 'externe', 'archived')),
    
    -- Relations - Double scolarite
    coranic_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    french_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    
    -- Annee scolaire
    school_year_id UUID REFERENCES school_years(id) ON DELETE SET NULL,
    
    -- Medias
    photo_url VARCHAR(500), -- URL de la photo de l'etudiant
    
    -- Date d'inscription
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Notes et observations
    notes TEXT,
    
    -- Metadonnees
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_birth_date CHECK (birth_date <= CURRENT_DATE),
    CONSTRAINT valid_age_range CHECK (age BETWEEN 3 AND 25),
    CONSTRAINT valid_enrollment_date CHECK (enrollment_date <= CURRENT_DATE)
);

-- Fonction pour calculer l'age automatiquement
CREATE OR REPLACE FUNCTION calculate_student_age()
RETURNS TRIGGER AS $$
BEGIN
    NEW.age := EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.birth_date));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer l'age automatiquement
CREATE TRIGGER tr_students_calculate_age
    BEFORE INSERT OR UPDATE OF birth_date ON students
    FOR EACH ROW
    EXECUTE FUNCTION calculate_student_age();

-- Index pour performance et recherche
CREATE INDEX idx_students_number ON students(student_number);
CREATE INDEX idx_students_names ON students(last_name, first_name);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_gender ON students(gender);
CREATE INDEX idx_students_age ON students(age);
CREATE INDEX idx_students_enrollment ON students(enrollment_date);
CREATE INDEX idx_students_school_year ON students(school_year_id);
CREATE INDEX idx_students_classes ON students(coranic_class_id, french_class_id);
CREATE INDEX idx_students_orphan ON students(is_orphan);

-- Index composites pour recherches frequentes
CREATE INDEX idx_students_active_year 
    ON students(school_year_id, status) WHERE status != 'archived';

-- Table des tuteurs/gardiens
CREATE TABLE guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    
    -- Informations personnelles
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    
    -- Contact
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    
    -- Relation avec l'etudiant
    relationship VARCHAR(50) NOT NULL, -- Ex: "Pere", "Mere", "Oncle", etc.
    is_primary BOOLEAN DEFAULT FALSE, -- Tuteur principal
    
    -- Metadonnees
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email IS NULL OR email ~ '^[^@]+@[^@]+\.[^@]+$'),
    CONSTRAINT valid_phone CHECK (phone ~ '^[\+]?[0-9\s\-\(\)]+$')
);

-- Index pour performance
CREATE INDEX idx_guardians_student ON guardians(student_id);
CREATE INDEX idx_guardians_primary ON guardians(student_id, is_primary);
CREATE INDEX idx_guardians_phone ON guardians(phone);
CREATE INDEX idx_guardians_email ON guardians(email) WHERE email IS NOT NULL;

-- Contrainte pour un seul tuteur principal par etudiant
CREATE UNIQUE INDEX idx_guardians_single_primary 
    ON guardians(student_id) WHERE is_primary = TRUE;

-- =============================================
-- VUES POUR FACILITER LES REQUETES
-- =============================================

-- Vue pour les etudiants avec informations completes
CREATE OR REPLACE VIEW students_complete AS
SELECT 
    s.id,
    s.student_number,
    s.first_name,
    s.last_name,
    s.first_name || ' ' || s.last_name AS full_name,
    s.birth_date,
    s.age,
    s.gender,
    s.is_orphan,
    s.status,
    s.photo_url,
    s.enrollment_date,
    s.notes,
    
    -- Classes
    cc.name AS coranic_class_name,
    cc.level AS coranic_class_level,
    fc.name AS french_class_name,
    fc.level AS french_class_level,
    
    -- Annee scolaire
    sy.name AS school_year_name,
    sy.start_date AS school_year_start,
    sy.end_date AS school_year_end,
    sy.is_current AS is_current_year,
    
    -- Tuteur principal
    g.first_name AS guardian_first_name,
    g.last_name AS guardian_last_name,
    g.phone AS guardian_phone,
    g.email AS guardian_email,
    g.address AS guardian_address,
    g.relationship AS guardian_relationship,
    
    -- Metadonnees
    s.created_at,
    s.updated_at
    
FROM students s
LEFT JOIN classes cc ON s.coranic_class_id = cc.id
LEFT JOIN classes fc ON s.french_class_id = fc.id
LEFT JOIN school_years sy ON s.school_year_id = sy.id
LEFT JOIN guardians g ON s.id = g.student_id AND g.is_primary = TRUE;

-- Vue pour les statistiques rapides par classe
CREATE OR REPLACE VIEW class_statistics AS
SELECT 
    c.id,
    c.name,
    c.level,
    c.type,
    c.capacity,
    
    -- Nombre d'etudiants
    COUNT(s.id) AS student_count,
    COUNT(s.id) FILTER (WHERE s.gender = 'M') AS male_count,
    COUNT(s.id) FILTER (WHERE s.gender = 'F') AS female_count,
    
    -- Pourcentage d'occupation
    ROUND((COUNT(s.id)::DECIMAL / NULLIF(c.capacity, 0)) * 100, 2) AS utilization_rate,
    
    -- Age moyen
    ROUND(AVG(s.age), 1) AS average_age,
    
    -- Statistiques sociales
    COUNT(s.id) FILTER (WHERE s.is_orphan = TRUE) AS orphan_count,
    COUNT(s.id) FILTER (WHERE s.status = 'interne') AS internal_count,
    
    c.created_at
    
FROM classes c
LEFT JOIN students s ON (
    (c.type = 'coranic' AND s.coranic_class_id = c.id) OR 
    (c.type = 'french' AND s.french_class_id = c.id)
) AND s.status != 'archived'
GROUP BY c.id, c.name, c.level, c.type, c.capacity, c.created_at;

-- =============================================
-- FONCTIONS UTILITAIRES
-- =============================================

-- Fonction pour generer un numero d'etudiant unique
CREATE OR REPLACE FUNCTION generate_student_number(school_year INTEGER DEFAULT NULL)
RETURNS VARCHAR(50) AS $$
DECLARE
    year_part INTEGER;
    sequence_num INTEGER;
    result VARCHAR(50);
BEGIN
    -- Utiliser l'annee courante si non specifiee
    year_part := COALESCE(school_year, EXTRACT(YEAR FROM CURRENT_DATE));
    
    -- Compter les etudiants existants pour cette annee
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(student_number FROM 'ELV-' || year_part || '-([0-9]+)') AS INTEGER)
    ), 0) + 1 
    INTO sequence_num
    FROM students 
    WHERE student_number LIKE 'ELV-' || year_part || '-%';
    
    -- Formater le resultat
    result := 'ELV-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre a jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Triggers pour mettre a jour automatiquement updated_at
CREATE TRIGGER tr_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_guardians_updated_at
    BEFORE UPDATE ON guardians
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_classes_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_school_years_updated_at
    BEFORE UPDATE ON school_years
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour valider qu'il n'y a qu'une seule annee scolaire courante
CREATE OR REPLACE FUNCTION ensure_single_current_year()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_current = TRUE THEN
        -- Desactiver toutes les autres annees courantes
        UPDATE school_years 
        SET is_current = FALSE 
        WHERE id != NEW.id AND is_current = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_single_current_year
    BEFORE INSERT OR UPDATE ON school_years
    FOR EACH ROW
    WHEN (NEW.is_current = TRUE)
    EXECUTE FUNCTION ensure_single_current_year();

-- =============================================
-- DONNEES D'EXEMPLE
-- =============================================

-- Inserer une annee scolaire courante
INSERT INTO school_years (name, start_date, end_date, is_current, description) 
VALUES (
    '2024-2025',
    '2024-09-01',
    '2025-06-30',
    TRUE,
    'Annee scolaire courante 2024-2025'
) ON CONFLICT (name) DO NOTHING;

-- Inserer quelques classes de base
INSERT INTO classes (name, level, type, description, capacity) VALUES
-- Classes coraniques
('Hifz Debutant', 'Debutant', 'coranic', 'Memorisation du Coran niveau debutant', 25),
('Hifz Intermediaire', 'Intermediaire', 'coranic', 'Memorisation du Coran niveau intermediaire', 20),
('Hifz Avance', 'Avance', 'coranic', 'Memorisation du Coran niveau avance', 15),
('Tajwid 1', 'Debutant', 'coranic', 'Apprentissage des regles de recitation', 30),

-- Classes francaises
('CP', 'Debutant', 'french', 'Cours Preparatoire', 30),
('CE1', 'Debutant', 'french', 'Cours Elementaire 1ere annee', 30),
('CE2', 'Intermediaire', 'french', 'Cours Elementaire 2eme annee', 30),
('CM1', 'Intermediaire', 'french', 'Cours Moyen 1ere annee', 28),
('CM2', 'Intermediaire', 'french', 'Cours Moyen 2eme annee', 28),
('6eme', 'Avance', 'french', 'Sixieme - College', 25)

ON CONFLICT DO NOTHING;

-- =============================================
-- MAINTENANCE ET OPTIMISATION
-- =============================================

-- Analyser les tables pour optimiser les performances
ANALYZE students;
ANALYZE guardians;
ANALYZE classes;
ANALYZE school_years;

-- =============================================
-- COMMENTAIRES POUR DOCUMENTATION
-- =============================================

COMMENT ON TABLE students IS 'Table principale des etudiants avec support double scolarite';
COMMENT ON COLUMN students.student_number IS 'Numero unique de l etudiant (format: ELV-YYYY-XXX)';
COMMENT ON COLUMN students.is_orphan IS 'Indique si l etudiant est orphelin';
COMMENT ON COLUMN students.coranic_class_id IS 'Classe coranique (memorisation du Coran, Tajwid)';
COMMENT ON COLUMN students.french_class_id IS 'Classe francaise (programme educatif francais)';
COMMENT ON COLUMN students.status IS 'Statut de l etudiant: interne, externe ou archived';
COMMENT ON COLUMN students.notes IS 'Notes et observations sur l etudiant';

COMMENT ON TABLE guardians IS 'Tuteurs/gardiens des etudiants avec contacts';
COMMENT ON COLUMN guardians.is_primary IS 'Tuteur principal pour les communications officielles';

COMMENT ON TABLE classes IS 'Classes pour double scolarite: coraniques et francaises';
COMMENT ON COLUMN classes.type IS 'Type de classe: coranic (religieux) ou french (seculier)';

COMMENT ON VIEW students_complete IS 'Vue complete avec toutes les informations etudiant pour affichage';
COMMENT ON VIEW class_statistics IS 'Statistiques par classe pour tableaux de bord';

-- =============================================
-- FIN DU SCHEMA
-- =============================================