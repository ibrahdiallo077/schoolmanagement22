-- =====================================================================
-- 🔄 COMPLÉTION DE LA MIGRATION - PARTIE MANQUANTE
-- =====================================================================

-- Créer des échéanciers pour tous les étudiants existants
DO $$
DECLARE
    student_record RECORD;
    current_year_id UUID;
BEGIN
    -- Récupérer l'année scolaire actuelle
    SELECT id INTO current_year_id 
    FROM school_years 
    WHERE is_current = true 
    LIMIT 1;
    
    IF current_year_id IS NULL THEN
        RAISE NOTICE 'Aucune année scolaire actuelle trouvée. Échéanciers non créés.';
        RETURN;
    END IF;
    
    -- Créer les échéanciers pour chaque étudiant actif
    FOR student_record IN 
        SELECT id FROM students 
        WHERE status != 'archived' AND deleted = false
    LOOP
        BEGIN
            PERFORM create_payment_schedule_for_student(student_record.id, current_year_id);
            RAISE NOTICE 'Échéancier créé pour étudiant: %', student_record.id;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erreur pour étudiant %: %', student_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Création des échéanciers terminée !';
END;
$$;

-- =====================================================================
-- 🎯 REQUÊTES DE VÉRIFICATION ET STATISTIQUES
-- =====================================================================

-- Statistiques générales
CREATE OR REPLACE VIEW school_dashboard AS
SELECT 
    -- Étudiants
    (SELECT COUNT(*) FROM students WHERE status != 'archived' AND deleted = false) as total_students,
    (SELECT COUNT(*) FROM students WHERE status = 'interne' AND deleted = false) as internal_students,
    (SELECT COUNT(*) FROM students WHERE is_orphan = true AND deleted = false) as orphan_students,
    (SELECT COUNT(*) FROM students WHERE gender = 'F' AND deleted = false) as female_students,
    (SELECT COUNT(*) FROM students WHERE gender = 'M' AND deleted = false) as male_students,
    
    -- Classes
    (SELECT COUNT(*) FROM classes WHERE is_active = true) as total_classes,
    (SELECT COUNT(*) FROM classes WHERE type = 'coranic' AND is_active = true) as coranic_classes,
    (SELECT COUNT(*) FROM classes WHERE type = 'french' AND is_active = true) as french_classes,
    
    -- Staff
    (SELECT COUNT(*) FROM staff WHERE status = 'active') as total_staff,
    
    -- Paiements du mois
    (SELECT COUNT(*) FROM student_payment_schedules 
     WHERE due_month = EXTRACT(MONTH FROM CURRENT_DATE) 
     AND due_year = EXTRACT(YEAR FROM CURRENT_DATE)
     AND status = 'paid') as payments_this_month,
    
    (SELECT COUNT(*) FROM student_payment_schedules 
     WHERE status = 'overdue') as overdue_payments,
    
    (SELECT COALESCE(SUM(amount), 0) FROM student_payments 
     WHERE payment_date >= DATE_TRUNC('month', CURRENT_DATE)) as revenue_this_month,
    
    (SELECT COALESCE(SUM(amount), 0) FROM student_payments 
     WHERE payment_date >= DATE_TRUNC('year', CURRENT_DATE)) as revenue_this_year;

-- Vue pour les rapports financiers
CREATE OR REPLACE VIEW financial_summary AS
SELECT 
    DATE_TRUNC('month', sp.payment_date) as month,
    COUNT(*) as payment_count,
    SUM(sp.amount) as total_amount,
    AVG(sp.amount) as average_amount,
    COUNT(DISTINCT sp.student_id) as students_paid,
    
    -- Par type de paiement
    SUM(CASE WHEN sp.payment_type = 'tuition_monthly' THEN sp.amount ELSE 0 END) as tuition_revenue,
    SUM(CASE WHEN sp.payment_type = 'registration' THEN sp.amount ELSE 0 END) as registration_revenue,
    SUM(CASE WHEN sp.payment_type LIKE '%_fee' THEN sp.amount ELSE 0 END) as fees_revenue,
    
    -- Par méthode
    COUNT(*) FILTER (WHERE sp.payment_method = 'cash') as cash_payments,
    COUNT(*) FILTER (WHERE sp.payment_method = 'bank_transfer') as bank_payments,
    COUNT(*) FILTER (WHERE sp.payment_method = 'mobile_money') as mobile_payments

FROM student_payments sp
WHERE sp.is_cancelled = false
GROUP BY DATE_TRUNC('month', sp.payment_date)
ORDER BY month DESC;

-- =====================================================================
-- 🛡️ FONCTIONS DE SÉCURITÉ ET VALIDATION
-- =====================================================================

-- Fonction pour valider les paiements
CREATE OR REPLACE FUNCTION validate_payment(
    p_payment_id UUID,
    p_validator VARCHAR(100)
)
RETURNS BOOLEAN AS $$
DECLARE
    payment_exists BOOLEAN;
BEGIN
    -- Vérifier que le paiement existe et n'est pas annulé
    SELECT EXISTS(
        SELECT 1 FROM student_payments 
        WHERE id = p_payment_id 
        AND is_cancelled = false
        AND validated_by IS NULL
    ) INTO payment_exists;
    
    IF NOT payment_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Marquer comme validé
    UPDATE student_payments 
    SET validated_by = p_validator,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_payment_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour annuler un paiement
CREATE OR REPLACE FUNCTION cancel_payment(
    p_payment_id UUID,
    p_reason TEXT,
    p_cancelled_by VARCHAR(100)
)
RETURNS BOOLEAN AS $$
DECLARE
    payment_amount NUMERIC(10,2);
    schedule_id UUID;
BEGIN
    -- Récupérer les infos du paiement
    SELECT amount, payment_schedule_id 
    INTO payment_amount, schedule_id
    FROM student_payments 
    WHERE id = p_payment_id AND is_cancelled = false;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Marquer le paiement comme annulé
    UPDATE student_payments 
    SET is_cancelled = true,
        cancelled_reason = p_reason,
        cancelled_by = p_cancelled_by,
        cancelled_at = CURRENT_TIMESTAMP
    WHERE id = p_payment_id;
    
    -- Remettre à jour le solde de l'échéancier
    IF schedule_id IS NOT NULL THEN
        UPDATE student_payment_schedules 
        SET amount_paid = amount_paid - payment_amount,
            status = CASE 
                WHEN amount_paid - payment_amount <= 0 THEN 'pending'
                WHEN amount_paid - payment_amount < final_amount THEN 'partial'
                ELSE status
            END
        WHERE id = schedule_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 💬 COMMENTAIRES ET DOCUMENTATION
-- =====================================================================

COMMENT ON TABLE tuition_fees_v2 IS 'Frais de scolarité par classe et année scolaire avec support des remises';
COMMENT ON TABLE student_payment_schedules IS 'Échéanciers de paiement avec calcul automatique des pénalités';
COMMENT ON TABLE student_payments IS 'Historique complet des paiements avec traçabilité';
COMMENT ON TABLE staff_salaries_v2 IS 'Salaires du personnel avec bonus et déductions';
COMMENT ON TABLE salary_payments_v2 IS 'Paiements de salaires avec support multi-mois';

COMMENT ON VIEW students_with_payments IS 'Vue complète des étudiants avec statut financier en temps réel';
COMMENT ON VIEW staff_with_salaries IS 'Vue du personnel avec informations salariales';
COMMENT ON VIEW school_dashboard IS 'Tableau de bord avec statistiques générales';
COMMENT ON VIEW financial_summary IS 'Résumé financier mensuel pour rapports';

-- =====================================================================
-- ✅ VÉRIFICATIONS POST-MIGRATION
-- =====================================================================

-- Vérifier les tables créées
SELECT 'Tables créées:' as info, 
       COUNT(*) FILTER (WHERE table_name IN ('tuition_fees_v2', 'student_payment_schedules', 'student_payments', 'staff_salaries_v2', 'salary_payments_v2')) as tables_count
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Vérifier les vues créées
SELECT 'Vues créées:' as info, 
       COUNT(*) FILTER (WHERE table_name IN ('students_with_payments', 'staff_with_salaries', 'school_dashboard', 'financial_summary')) as views_count
FROM information_schema.views 
WHERE table_schema = 'public';

-- Vérifier les fonctions créées
SELECT 'Fonctions créées:' as info, 
       COUNT(*) FILTER (WHERE routine_name IN ('update_payment_penalties', 'create_payment_schedule_for_student', 'mark_notification_sent', 'validate_payment', 'cancel_payment')) as functions_count
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

-- =====================================================================
-- 🎊 MIGRATION TERMINÉE AVEC SUCCÈS !
-- =====================================================================

SELECT '🎉 MIGRATION TERMINÉE ! Votre système École Moderne V2 est opérationnel !' as message;