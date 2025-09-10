-- Ajouter school_year_id et monthly_fee à la table classes
ALTER TABLE classes ADD COLUMN IF NOT EXISTS school_year_id UUID;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10,2) DEFAULT 0;

-- Ajouter les contraintes de clé étrangère
ALTER TABLE classes 
ADD CONSTRAINT classes_school_year_id_fkey 
FOREIGN KEY (school_year_id) REFERENCES school_years(id) ON DELETE SET NULL;

-- Ajouter les index pour les performances
CREATE INDEX IF NOT EXISTS idx_classes_school_year ON classes(school_year_id);

-- Mettre à jour les classes existantes avec des valeurs par défaut
UPDATE classes SET monthly_fee = 0 WHERE monthly_fee IS NULL;

-- Créer une année scolaire par défaut si aucune n'existe
INSERT INTO school_years (name, start_date, end_date, is_current, description)
SELECT 
    '2024-2025',
    '2024-09-01',
    '2025-07-31',
    true,
    'Année scolaire par défaut'
WHERE NOT EXISTS (SELECT 1 FROM school_years WHERE is_current = true);

-- Lier les classes existantes à l'année courante
UPDATE classes 
SET school_year_id = (
    SELECT id FROM school_years WHERE is_current = true LIMIT 1
)
WHERE school_year_id IS NULL;