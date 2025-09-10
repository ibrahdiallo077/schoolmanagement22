-- =====================================
-- NETTOYAGE COMPLET DE L'ANCIENNE STRUCTURE
-- =====================================

-- Supprimer les vues existantes
DROP VIEW IF EXISTS student_yearly_evolution CASCADE;
DROP VIEW IF EXISTS monthly_class_statistics CASCADE;
DROP VIEW IF EXISTS student_academic_history CASCADE;
DROP VIEW IF EXISTS academic_progress_stats CASCADE;
DROP VIEW IF EXISTS student_academic_ranking CASCADE;
DROP VIEW IF EXISTS academic_progress_summary CASCADE;

-- Supprimer les triggers existants
DROP TRIGGER IF EXISTS tr_calculate_overall_grade ON student_monthly_progress;
DROP TRIGGER IF EXISTS tr_update_progress_timestamp ON student_monthly_progress;
DROP TRIGGER IF EXISTS tr_calculate_academic_progress ON student_academic_progress;
DROP TRIGGER IF EXISTS tr_update_academic_progress_timestamp ON student_academic_progress;

-- Supprimer les fonctions existantes
DROP FUNCTION IF EXISTS calculate_overall_grade() CASCADE;
DROP FUNCTION IF EXISTS calculate_academic_progress() CASCADE;
DROP FUNCTION IF EXISTS insert_sample_progress_data() CASCADE;
DROP FUNCTION IF EXISTS insert_sample_academic_progress() CASCADE;
DROP FUNCTION IF EXISTS update_timestamp() CASCADE;

-- Supprimer les anciennes tables
DROP TABLE IF EXISTS student_monthly_progress CASCADE;
DROP TABLE IF EXISTS student_academic_progress CASCADE;

-- =====================================
-- FONCTIONS UTILITAIRES
-- =====================================

-- Fonction pour mettre à jour le timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- TABLE PRINCIPALE - ÉVOLUTION ACADÉMIQUE
-- =====================================

CREATE TABLE student_academic_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Références principales
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    
    -- Période d'évaluation
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    evaluation_month INTEGER NOT NULL DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
    evaluation_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    
    -- Progression Coranique
    current_sourate VARCHAR(100) NOT NULL,
    sourate_number INTEGER CHECK (sourate_number >= 1 AND sourate_number <= 114),
    current_jouzou INTEGER CHECK (current_jouzou >= 1 AND current_jouzou <= 30),
    current_hizb INTEGER CHECK (current_hizb >= 1 AND current_hizb <= 60),
    
    -- Mémorisation
    pages_memorized INTEGER DEFAULT 0 CHECK (pages_memorized >= 0),
    verses_memorized INTEGER DEFAULT 0 CHECK (verses_memorized >= 0),
    memorization_status VARCHAR(20) DEFAULT 'en_cours' CHECK (memorization_status IN ('non_commence', 'en_cours', 'memorise', 'perfectionne')),
    
    -- Évaluations sur 20
    memorization_grade DECIMAL(4,2) CHECK (memorization_grade >= 0 AND memorization_grade <= 20),
    recitation_grade DECIMAL(4,2) CHECK (recitation_grade >= 0 AND recitation_grade <= 20),
    tajwid_grade DECIMAL(4,2) CHECK (tajwid_grade >= 0 AND tajwid_grade <= 20),
    behavior_grade DECIMAL(4,2) CHECK (behavior_grade >= 0 AND behavior_grade <= 20),
    
    -- Note globale (calculée automatiquement)
    overall_grade DECIMAL(4,2) CHECK (overall_grade >= 0 AND overall_grade <= 20),
    
    -- Informations de suivi
    attendance_rate INTEGER DEFAULT 100 CHECK (attendance_rate >= 0 AND attendance_rate <= 100),
    sourates_completed_this_month INTEGER DEFAULT 0,
    pages_learned_this_month INTEGER DEFAULT 0,
    
    -- Commentaires et observations
    teacher_comment TEXT,
    student_behavior VARCHAR(20) DEFAULT 'bon' CHECK (student_behavior IN ('excellent', 'tres_bon', 'bon', 'moyen', 'difficile')),
    next_month_objective TEXT,
    difficulties TEXT,
    strengths TEXT,
    
    -- Métadonnées
    evaluated_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    is_validated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Contraintes
    CONSTRAINT unique_student_evaluation_date UNIQUE (student_id, evaluation_date),
    CONSTRAINT valid_evaluation_date CHECK (evaluation_date <= CURRENT_DATE)
);

-- =====================================
-- INDEX POUR LES PERFORMANCES
-- =====================================

CREATE INDEX idx_academic_progress_student_id ON student_academic_progress(student_id);
CREATE INDEX idx_academic_progress_date ON student_academic_progress(evaluation_date DESC);
CREATE INDEX idx_academic_progress_month_year ON student_academic_progress(evaluation_year DESC, evaluation_month DESC);
CREATE INDEX idx_academic_progress_grade ON student_academic_progress(overall_grade DESC);
CREATE INDEX idx_academic_progress_school_year ON student_academic_progress(school_year_id);
CREATE INDEX idx_academic_progress_class ON student_academic_progress(class_id);
CREATE INDEX idx_academic_progress_sourate ON student_academic_progress(sourate_number);
CREATE INDEX idx_academic_progress_status ON student_academic_progress(memorization_status);

-- =====================================
-- FONCTION DE CALCUL AUTOMATIQUE
-- =====================================

-- Fonction pour calculer la note globale et mettre à jour les métadonnées
CREATE OR REPLACE FUNCTION calculate_academic_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculer la moyenne des 4 notes principales
    IF NEW.memorization_grade IS NOT NULL AND NEW.recitation_grade IS NOT NULL 
       AND NEW.tajwid_grade IS NOT NULL AND NEW.behavior_grade IS NOT NULL THEN
        
        NEW.overall_grade := ROUND(
            (NEW.memorization_grade + NEW.recitation_grade + NEW.tajwid_grade + NEW.behavior_grade) / 4.0, 
            2
        );
    END IF;
    
    -- Extraire mois et année de la date d'évaluation
    NEW.evaluation_month := EXTRACT(MONTH FROM NEW.evaluation_date);
    NEW.evaluation_year := EXTRACT(YEAR FROM NEW.evaluation_date);
    
    -- Mise à jour du timestamp
    NEW.updated_at := CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- TRIGGERS
-- =====================================

-- Appliquer les triggers
CREATE TRIGGER tr_calculate_academic_progress
    BEFORE INSERT OR UPDATE ON student_academic_progress
    FOR EACH ROW
    EXECUTE FUNCTION calculate_academic_progress();

CREATE TRIGGER tr_update_academic_progress_timestamp
    BEFORE UPDATE ON student_academic_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- =====================================
-- VUES POUR LES RAPPORTS ET ANALYSES
-- =====================================

-- Vue pour l'historique complet d'un étudiant
CREATE VIEW student_academic_history AS
SELECT 
    sap.id,
    s.id as student_id,
    s.student_number,
    s.first_name || ' ' || s.last_name as student_name,
    s.age,
    s.gender,
    sap.evaluation_date,
    TO_CHAR(sap.evaluation_date, 'DD/MM/YYYY') as evaluation_date_formatted,
    sap.evaluation_month,
    sap.evaluation_year,
    
    -- Informations de classe et année scolaire
    c.name as class_name,
    c.level as class_level,
    sy.name as school_year_name,
    
    -- Progression coranique
    sap.current_sourate,
    sap.sourate_number,
    sap.current_jouzou,
    sap.current_hizb,
    sap.memorization_status,
    sap.pages_memorized,
    sap.verses_memorized,
    
    -- Notes
    sap.memorization_grade,
    sap.recitation_grade,
    sap.tajwid_grade,
    sap.behavior_grade,
    sap.overall_grade,
    
    -- Progression
    sap.attendance_rate,
    sap.sourates_completed_this_month,
    sap.pages_learned_this_month,
    
    -- Commentaires
    sap.teacher_comment,
    sap.student_behavior,
    sap.next_month_objective,
    sap.difficulties,
    sap.strengths,
    
    -- Métadonnées
    sap.is_validated,
    st.first_name || ' ' || st.last_name as evaluated_by_name,
    sap.created_at,
    sap.updated_at
    
FROM student_academic_progress sap
JOIN students s ON sap.student_id = s.id
LEFT JOIN classes c ON sap.class_id = c.id
LEFT JOIN school_years sy ON sap.school_year_id = sy.id
LEFT JOIN staff st ON sap.evaluated_by = st.id
WHERE s.deleted = false OR s.deleted IS NULL
ORDER BY s.student_number, sap.evaluation_date DESC;

-- Vue pour les statistiques par période
CREATE VIEW academic_progress_summary AS
SELECT 
    sap.evaluation_year,
    sap.evaluation_month,
    sap.school_year_id,
    sy.name as school_year_name,
    COUNT(DISTINCT sap.student_id) as total_students_evaluated,
    
    -- Moyennes des notes
    ROUND(AVG(sap.overall_grade), 2) as average_overall_grade,
    ROUND(AVG(sap.memorization_grade), 2) as average_memorization,
    ROUND(AVG(sap.recitation_grade), 2) as average_recitation,
    ROUND(AVG(sap.tajwid_grade), 2) as average_tajwid,
    ROUND(AVG(sap.behavior_grade), 2) as average_behavior,
    
    -- Statistiques de présence
    ROUND(AVG(sap.attendance_rate), 1) as average_attendance_rate,
    
    -- Progression coranique
    ROUND(AVG(sap.pages_memorized), 1) as average_pages_memorized,
    SUM(sap.sourates_completed_this_month) as total_sourates_completed,
    SUM(sap.pages_learned_this_month) as total_pages_learned,
    
    -- Répartition des comportements
    COUNT(CASE WHEN sap.student_behavior = 'excellent' THEN 1 END) as excellent_behavior,
    COUNT(CASE WHEN sap.student_behavior = 'tres_bon' THEN 1 END) as very_good_behavior,
    COUNT(CASE WHEN sap.student_behavior = 'bon' THEN 1 END) as good_behavior,
    COUNT(CASE WHEN sap.student_behavior = 'moyen' THEN 1 END) as average_behavior_count,
    COUNT(CASE WHEN sap.student_behavior = 'difficile' THEN 1 END) as difficult_behavior,
    
    -- Répartition des notes
    COUNT(CASE WHEN sap.overall_grade >= 16 THEN 1 END) as excellent_grades,
    COUNT(CASE WHEN sap.overall_grade >= 14 AND sap.overall_grade < 16 THEN 1 END) as good_grades,
    COUNT(CASE WHEN sap.overall_grade >= 12 AND sap.overall_grade < 14 THEN 1 END) as average_grades,
    COUNT(CASE WHEN sap.overall_grade < 12 THEN 1 END) as below_average_grades
    
FROM student_academic_progress sap
LEFT JOIN school_years sy ON sap.school_year_id = sy.id
GROUP BY sap.evaluation_year, sap.evaluation_month, sap.school_year_id, sy.name
ORDER BY sap.evaluation_year DESC, sap.evaluation_month DESC;

-- Vue pour l'évolution annuelle des étudiants
CREATE VIEW student_yearly_evolution AS
SELECT 
    s.id as student_id,
    s.student_number,
    s.first_name || ' ' || s.last_name as student_name,
    sap.evaluation_year,
    sy.name as school_year_name,
    
    -- Statistiques annuelles
    COUNT(*) as evaluations_count,
    ROUND(AVG(sap.overall_grade), 2) as yearly_average,
    MIN(sap.overall_grade) as min_grade,
    MAX(sap.overall_grade) as max_grade,
    
    -- Progression coranique annuelle
    MAX(sap.pages_memorized) as total_pages_memorized,
    SUM(sap.sourates_completed_this_month) as total_sourates_completed,
    MAX(sap.current_jouzou) as max_jouzou_reached,
    
    -- Moyennes par matière
    ROUND(AVG(sap.memorization_grade), 2) as avg_memorization,
    ROUND(AVG(sap.recitation_grade), 2) as avg_recitation,
    ROUND(AVG(sap.tajwid_grade), 2) as avg_tajwid,
    ROUND(AVG(sap.behavior_grade), 2) as avg_behavior,
    ROUND(AVG(sap.attendance_rate), 1) as avg_attendance
    
FROM students s
JOIN student_academic_progress sap ON s.id = sap.student_id
LEFT JOIN school_years sy ON sap.school_year_id = sy.id
WHERE s.deleted = false OR s.deleted IS NULL
GROUP BY s.id, s.student_number, s.first_name, s.last_name, sap.evaluation_year, sy.name
ORDER BY s.student_number, sap.evaluation_year DESC;

-- =====================================
-- FONCTION POUR DONNÉES D'EXEMPLE
-- =====================================

-- Fonction pour insérer des données d'exemple
CREATE OR REPLACE FUNCTION insert_sample_academic_progress()
RETURNS TEXT AS $$
DECLARE
    sample_student_id UUID;
    sample_school_year_id UUID;
    sample_class_id UUID;
    evaluation_date_var DATE;
    i INTEGER;
    sourate_names TEXT[] := ARRAY[
        'Al-Fatiha', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas', 'Al-Kawthar', 'Al-Fil',
        'Quraysh', 'Al-Maun', 'Al-Kafirun', 'An-Nasr', 'Al-Masad', 'Ad-Duha'
    ];
    sourate_numbers INTEGER[] := ARRAY[1, 112, 113, 114, 108, 105, 106, 107, 109, 110, 111, 93];
BEGIN
    -- Récupérer un étudiant existant
    SELECT id INTO sample_student_id 
    FROM students 
    WHERE deleted = false OR deleted IS NULL 
    LIMIT 1;
    
    -- Récupérer l'année scolaire actuelle
    SELECT id INTO sample_school_year_id 
    FROM school_years 
    WHERE is_current = true 
    LIMIT 1;
    
    -- Si pas d'année actuelle, prendre la première
    IF sample_school_year_id IS NULL THEN
        SELECT id INTO sample_school_year_id FROM school_years LIMIT 1;
    END IF;
    
    -- Récupérer une classe
    SELECT id INTO sample_class_id 
    FROM classes 
    WHERE (is_active = true OR is_active IS NULL)
      AND (type = 'coranic' OR type IS NULL)
    LIMIT 1;
    
    IF sample_student_id IS NULL THEN
        RETURN 'Aucun étudiant trouvé pour les données d''exemple';
    END IF;
    
    -- Insérer des évaluations pour les 6 derniers mois
    FOR i IN 0..5 LOOP
        evaluation_date_var := CURRENT_DATE - (i || ' months')::INTERVAL;
        
        INSERT INTO student_academic_progress (
            student_id,
            school_year_id,
            class_id,
            evaluation_date,
            current_sourate,
            sourate_number,
            current_jouzou,
            current_hizb,
            pages_memorized,
            verses_memorized,
            memorization_status,
            memorization_grade,
            recitation_grade,
            tajwid_grade,
            behavior_grade,
            attendance_rate,
            sourates_completed_this_month,
            pages_learned_this_month,
            teacher_comment,
            student_behavior,
            next_month_objective,
            difficulties,
            strengths,
            is_validated
        ) VALUES (
            sample_student_id,
            sample_school_year_id,
            sample_class_id,
            evaluation_date_var,
            sourate_names[1 + (i % array_length(sourate_names, 1))],
            sourate_numbers[1 + (i % array_length(sourate_numbers, 1))],
            1 + (i % 30),
            1 + (i % 60),
            10 + (i * 8), -- Pages mémorisées progressives
            50 + (i * 30), -- Versets mémorisés progressifs
            CASE i % 4 
                WHEN 0 THEN 'en_cours'
                WHEN 1 THEN 'memorise'
                WHEN 2 THEN 'perfectionne'
                ELSE 'en_cours'
            END,
            12.0 + (i * 1.5), -- Notes progressives
            11.0 + (i * 1.2),
            13.0 + (i * 1.0),
            15.0 + (i * 0.8),
            85 + (i * 2), -- Taux de présence
            CASE WHEN i < 3 THEN 1 ELSE 0 END, -- Sourates complétées
            3 + i, -- Pages apprises ce mois
            'Évaluation du ' || TO_CHAR(evaluation_date_var, 'DD/MM/YYYY') || ' - Progrès ' || 
            CASE WHEN i < 2 THEN 'excellent' ELSE 'satisfaisant' END,
            CASE i % 4
                WHEN 0 THEN 'excellent'
                WHEN 1 THEN 'tres_bon' 
                WHEN 2 THEN 'bon'
                ELSE 'bon'
            END,
            'Continuer la mémorisation de ' || sourate_names[1 + (i % array_length(sourate_names, 1))],
            CASE WHEN i > 2 THEN 'Parfois des difficultés de concentration' ELSE NULL END,
            'Bonne mémorisation et récitation claire',
            CASE WHEN i < 3 THEN true ELSE false END
        ) ON CONFLICT (student_id, evaluation_date) DO NOTHING;
    END LOOP;
    
    RETURN 'Données d''exemple insérées avec succès pour l''étudiant ID: ' || sample_student_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- COMMENTAIRES ET DOCUMENTATION
-- =====================================

COMMENT ON TABLE student_academic_progress IS 'Suivi de l''évolution académique des étudiants coraniques - Structure simplifiée et optimisée';
COMMENT ON COLUMN student_academic_progress.evaluation_date IS 'Date d''évaluation (unique par étudiant par date)';
COMMENT ON COLUMN student_academic_progress.overall_grade IS 'Note globale calculée automatiquement (moyenne des 4 notes principales)';
COMMENT ON COLUMN student_academic_progress.memorization_status IS 'Statut de mémorisation: non_commence, en_cours, memorise, perfectionne';
COMMENT ON COLUMN student_academic_progress.pages_memorized IS 'Nombre total de pages mémorisées par l''étudiant';
COMMENT ON COLUMN student_academic_progress.current_jouzou IS 'Partie du Coran en cours d''étude (1-30)';
COMMENT ON COLUMN student_academic_progress.current_hizb IS 'Subdivision du Coran (1-60)';
COMMENT ON COLUMN student_academic_progress.is_validated IS 'Évaluation validée par un enseignant ou responsable';

-- =====================================
-- FINALISATION
-- =====================================

-- Message de confirmation
SELECT 'Structure de suivi académique créée avec succès!' as message;