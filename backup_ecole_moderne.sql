--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0
-- Dumped by pg_dump version 17.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: auto_fill_responsible_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auto_fill_responsible_user() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Si responsible_user_id n'est pas fourni, utiliser created_by
    IF NEW.responsible_user_id IS NULL AND NEW.created_by IS NOT NULL THEN
        NEW.responsible_user_id := NEW.created_by;
        
        -- R‚cup‚rer le nom et r“le de l'utilisateur
        SELECT 
            first_name || ' ' || last_name,
            role
        INTO 
            NEW.responsible_user_name,
            NEW.responsible_user_role
        FROM admin_users 
        WHERE id = NEW.created_by;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.auto_fill_responsible_user() OWNER TO postgres;

--
-- Name: calculate_academic_progress(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_academic_progress() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Calculer la moyenne des 4 notes principales
    IF NEW.memorization_grade IS NOT NULL AND NEW.recitation_grade IS NOT NULL 
       AND NEW.tajwid_grade IS NOT NULL AND NEW.behavior_grade IS NOT NULL THEN
        
        NEW.overall_grade := ROUND(
            (NEW.memorization_grade + NEW.recitation_grade + NEW.tajwid_grade + NEW.behavior_grade) / 4.0, 
            2
        );
    END IF;
    
    -- Extraire mois et annÃ©e de la date d'Ã©valuation
    NEW.evaluation_month := EXTRACT(MONTH FROM NEW.evaluation_date);
    NEW.evaluation_year := EXTRACT(YEAR FROM NEW.evaluation_date);
    
    -- Mise Ã  jour du timestamp
    NEW.updated_at := CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.calculate_academic_progress() OWNER TO postgres;

--
-- Name: calculate_age(date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_age(birth_date date) RETURNS integer
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date));
END;
$$;


ALTER FUNCTION public.calculate_age(birth_date date) OWNER TO postgres;

--
-- Name: calculate_student_age(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_student_age() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.age := EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.birth_date));
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.calculate_student_age() OWNER TO postgres;

--
-- Name: cancel_payment(uuid, text, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cancel_payment(p_payment_id uuid, p_reason text, p_cancelled_by character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    payment_amount NUMERIC(10,2);
    schedule_id UUID;
BEGIN
    -- RÃ©cupÃ©rer les infos du paiement
    SELECT amount, payment_schedule_id 
    INTO payment_amount, schedule_id
    FROM student_payments 
    WHERE id = p_payment_id AND is_cancelled = false;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Marquer le paiement comme annulÃ©
    UPDATE student_payments 
    SET is_cancelled = true,
        cancelled_reason = p_reason,
        cancelled_by = p_cancelled_by,
        cancelled_at = CURRENT_TIMESTAMP
    WHERE id = p_payment_id;
    
    -- Remettre Ã  jour le solde de l'Ã©chÃ©ancier
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
$$;


ALTER FUNCTION public.cancel_payment(p_payment_id uuid, p_reason text, p_cancelled_by character varying) OWNER TO postgres;

--
-- Name: check_financial_alerts(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_financial_alerts() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    current_balance NUMERIC;
    monthly_expenses NUMERIC;
    alert_threshold NUMERIC := 500000;
BEGIN
    -- Calculer le solde actuel
    current_balance := calculate_real_time_balance();
    
    -- Calculer les dÃ©penses du mois
    SELECT COALESCE(current_month_expenses, 0) 
    INTO monthly_expenses 
    FROM v_financial_dashboard_live;
    
    -- Alerte solde faible
    IF current_balance < alert_threshold THEN
        INSERT INTO financial_alerts (
            alert_type, severity, title, message, threshold_amount, data_snapshot
        ) VALUES (
            'LOW_BALANCE', 'HIGH',
            'Solde faible dÃ©tectÃ©',
            format('Le solde actuel (%s FG) est infÃ©rieur au seuil d''alerte (%s FG)', 
                   current_balance, alert_threshold),
            alert_threshold,
            json_build_object('current_balance', current_balance, 'threshold', alert_threshold)::jsonb
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Alerte solde nÃ©gatif
    IF current_balance < 0 THEN
        INSERT INTO financial_alerts (
            alert_type, severity, title, message, data_snapshot
        ) VALUES (
            'NEGATIVE_BALANCE', 'CRITICAL',
            'Solde nÃ©gatif critique',
            format('ATTENTION: Le solde est nÃ©gatif (%s FG). Action immÃ©diate requise.', current_balance),
            json_build_object('current_balance', current_balance)::jsonb
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Alerte dÃ©penses Ã©levÃ©es
    IF monthly_expenses > 5000000 THEN
        INSERT INTO financial_alerts (
            alert_type, severity, title, message, data_snapshot
        ) VALUES (
            'HIGH_MONTHLY_EXPENSES', 'MEDIUM',
            'DÃ©penses mensuelles Ã©levÃ©es',
            format('Les dÃ©penses de ce mois (%s FG) sont supÃ©rieures Ã  la normale.', monthly_expenses),
            json_build_object('monthly_expenses', monthly_expenses)::jsonb
        )
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


ALTER FUNCTION public.check_financial_alerts() OWNER TO postgres;

--
-- Name: cleanup_expired_tokens(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_expired_tokens() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM refresh_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP OR is_revoked = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    DELETE FROM password_reset_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    UPDATE user_sessions 
    SET is_active = false, 
        ended_at = CURRENT_TIMESTAMP,
        end_reason = 'expired'
    WHERE expires_at < CURRENT_TIMESTAMP AND is_active = true;
    
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION public.cleanup_expired_tokens() OWNER TO postgres;

--
-- Name: cleanup_old_notifications(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_old_notifications(days_old integer DEFAULT 90) RETURNS integer
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.cleanup_old_notifications(days_old integer) OWNER TO postgres;

--
-- Name: count_unread_notifications(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.count_unread_notifications(user_uuid integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM notifications 
        WHERE (user_id = user_uuid OR user_id IS NULL)
        AND is_read = FALSE 
        AND is_active = TRUE
    );
END;
$$;


ALTER FUNCTION public.count_unread_notifications(user_uuid integer) OWNER TO postgres;

--
-- Name: create_payment_schedule_for_student(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_payment_schedule_for_student(p_student_id uuid, p_school_year_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_school_year_id UUID;
    v_coranic_fee_id UUID;
    v_french_fee_id UUID;
    v_monthly_amount NUMERIC(10,2) := 0;
    v_discount_percent NUMERIC(5,2) := 0;
    v_is_orphan BOOLEAN;
    month_iter INTEGER;
    year_iter INTEGER;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- RÃ©cupÃ©rer l'annÃ©e scolaire (actuelle si non spÃ©cifiÃ©e)
    IF p_school_year_id IS NULL THEN
        SELECT id INTO v_school_year_id 
        FROM school_years 
        WHERE is_current = true 
        LIMIT 1;
    ELSE
        v_school_year_id := p_school_year_id;
    END IF;
    
    -- VÃ©rifier si l'Ã©tudiant existe et rÃ©cupÃ©rer les infos
    SELECT is_orphan INTO v_is_orphan
    FROM students 
    WHERE id = p_student_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ã‰tudiant non trouvÃ©: %', p_student_id;
    END IF;
    
    -- RÃ©cupÃ©rer les dates de l'annÃ©e scolaire
    SELECT start_date, end_date INTO v_start_date, v_end_date
    FROM school_years 
    WHERE id = v_school_year_id;
    
    -- Calculer la remise (50% pour orphelins)
    IF v_is_orphan THEN
        v_discount_percent := 50.0;
    END IF;
    
    -- RÃ©cupÃ©rer les frais des classes de l'Ã©tudiant
    SELECT tf.id, tf.monthly_amount INTO v_coranic_fee_id, v_monthly_amount
    FROM students s
    JOIN tuition_fees_v2 tf ON tf.class_id = s.coranic_class_id
    WHERE s.id = p_student_id AND s.coranic_class_id IS NOT NULL 
    AND tf.school_year_id = v_school_year_id;
    
    -- Ajouter les frais franÃ§ais si applicable
    IF EXISTS(SELECT 1 FROM students WHERE id = p_student_id AND french_class_id IS NOT NULL) THEN
        SELECT tf.monthly_amount INTO STRICT v_monthly_amount
        FROM students s
        JOIN tuition_fees_v2 tf ON tf.class_id = s.french_class_id
        WHERE s.id = p_student_id 
        AND tf.school_year_id = v_school_year_id;
        
        v_monthly_amount := COALESCE(v_monthly_amount, 0) + COALESCE(v_monthly_amount, 0);
    END IF;
    
    -- GÃ©nÃ©rer les Ã©chÃ©anciers mensuels
    month_iter := EXTRACT(MONTH FROM v_start_date);
    year_iter := EXTRACT(YEAR FROM v_start_date);
    
    WHILE (year_iter < EXTRACT(YEAR FROM v_end_date) OR 
           (year_iter = EXTRACT(YEAR FROM v_end_date) AND month_iter <= EXTRACT(MONTH FROM v_end_date))) LOOP
        
        INSERT INTO student_payment_schedules (
            student_id,
            tuition_fee_id,
            due_month,
            due_year,
            due_date,
            base_amount,
            discount_applied,
            final_amount
        ) VALUES (
            p_student_id,
            COALESCE(v_coranic_fee_id, v_french_fee_id),
            month_iter,
            year_iter,
            DATE(year_iter || '-' || LPAD(month_iter::text, 2, '0') || '-15'), -- 15 de chaque mois
            v_monthly_amount,
            ROUND(v_monthly_amount * v_discount_percent / 100, 2),
            ROUND(v_monthly_amount * (1 - v_discount_percent / 100), 2)
        )
        ON CONFLICT (student_id, due_month, due_year) DO NOTHING;
        
        -- Mois suivant
        month_iter := month_iter + 1;
        IF month_iter > 12 THEN
            month_iter := 1;
            year_iter := year_iter + 1;
        END IF;
    END LOOP;
    
END;
$$;


ALTER FUNCTION public.create_payment_schedule_for_student(p_student_id uuid, p_school_year_id uuid) OWNER TO postgres;

--
-- Name: ensure_single_current_year(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.ensure_single_current_year() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.is_current = TRUE THEN
        -- Desactiver toutes les autres annees courantes
        UPDATE school_years 
        SET is_current = FALSE 
        WHERE id != NEW.id AND is_current = TRUE;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.ensure_single_current_year() OWNER TO postgres;

--
-- Name: generate_expense_reference(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_expense_reference() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
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
$_$;


ALTER FUNCTION public.generate_expense_reference() OWNER TO postgres;

--
-- Name: generate_financial_predictions(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_financial_predictions(months_ahead integer DEFAULT 3) RETURNS TABLE(month integer, year integer, predicted_income numeric, predicted_expenses numeric)
    LANGUAGE plpgsql
    AS $$
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
    
    -- GÃ©nÃ©rer les prÃ©dictions
    FOR i IN 1..months_ahead LOOP
        month := EXTRACT(MONTH FROM CURRENT_DATE + (i || ' months')::INTERVAL);
        year := EXTRACT(YEAR FROM CURRENT_DATE + (i || ' months')::INTERVAL);
        predicted_income := avg_income * (trend_factor ^ (i/12.0));
        predicted_expenses := avg_expenses * (1.02 ^ (i/12.0));
        
        RETURN NEXT;
    END LOOP;
END;
$$;


ALTER FUNCTION public.generate_financial_predictions(months_ahead integer) OWNER TO postgres;

--
-- Name: generate_staff_number(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_staff_number() RETURNS text
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.generate_staff_number() OWNER TO postgres;

--
-- Name: generate_student_number(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_student_number() RETURNS text
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.generate_student_number() OWNER TO postgres;

--
-- Name: generate_student_number(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_student_number(school_year integer DEFAULT NULL::integer) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.generate_student_number(school_year integer) OWNER TO postgres;

--
-- Name: get_financial_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_financial_stats() RETURNS TABLE(current_balance numeric, total_income numeric, total_expenses numeric, monthly_income numeric, monthly_expenses numeric, total_transactions bigint)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.get_financial_stats() OWNER TO postgres;

--
-- Name: inject_transaction(character varying, numeric, text, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.inject_transaction(p_type character varying, p_amount numeric, p_description text, p_category character varying DEFAULT NULL::character varying, p_entity_name character varying DEFAULT NULL::character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_id INTEGER;
    ref_number VARCHAR;
BEGIN
    -- GÃ©nÃ©rer une rÃ©fÃ©rence unique
    ref_number := 'INJ-' || p_type || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT;
    
    -- InsÃ©rer la transaction
    INSERT INTO manual_financial_transactions (
        reference, type, amount, description, category, entity_name
    ) VALUES (
        ref_number, p_type, p_amount, p_description, 
        COALESCE(p_category, CASE WHEN p_type = 'INCOME' THEN 'Revenus divers' ELSE 'Sorties diverses' END),
        COALESCE(p_entity_name, 'Manuel')
    ) RETURNING id INTO new_id;
    
    -- Mettre Ã  jour le capital
    PERFORM update_financial_capital_simple();
    
    RETURN new_id;
END;
$$;


ALTER FUNCTION public.inject_transaction(p_type character varying, p_amount numeric, p_description text, p_category character varying, p_entity_name character varying) OWNER TO postgres;

--
-- Name: inject_transaction(character varying, character varying, numeric, text, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.inject_transaction(p_type character varying, p_category character varying, p_amount numeric, p_description text, p_entity_name character varying DEFAULT 'Manuel'::character varying) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_reference VARCHAR(100);
    new_balance NUMERIC;
BEGIN
    -- Generer une reference unique
    new_reference := format('MAN-%s-%s-%s', 
                           p_type, 
                           to_char(CURRENT_DATE, 'YYYYMM'),
                           LPAD((EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT % 10000)::TEXT, 4, '0'));
    
    -- Inserer la transaction
    INSERT INTO manual_financial_transactions (
        reference, type, category, amount, description, 
        entity_name, status, impact_capital
    ) VALUES (
        new_reference, p_type, p_category, p_amount, p_description,
        p_entity_name, 'completed', true
    );
    
    -- Calculer le nouveau solde
    new_balance := calculate_real_time_balance();
    
    RETURN format('Transaction %s creee avec succes. Nouveau solde: %s FG', new_reference, new_balance);
END;
$$;


ALTER FUNCTION public.inject_transaction(p_type character varying, p_category character varying, p_amount numeric, p_description text, p_entity_name character varying) OWNER TO postgres;

--
-- Name: insert_sample_academic_progress(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.insert_sample_academic_progress() RETURNS text
    LANGUAGE plpgsql
    AS $$
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
    -- RÃ©cupÃ©rer un Ã©tudiant existant
    SELECT id INTO sample_student_id 
    FROM students 
    WHERE deleted = false OR deleted IS NULL 
    LIMIT 1;
    
    -- RÃ©cupÃ©rer l'annÃ©e scolaire actuelle
    SELECT id INTO sample_school_year_id 
    FROM school_years 
    WHERE is_current = true 
    LIMIT 1;
    
    -- Si pas d'annÃ©e actuelle, prendre la premiÃ¨re
    IF sample_school_year_id IS NULL THEN
        SELECT id INTO sample_school_year_id FROM school_years LIMIT 1;
    END IF;
    
    -- RÃ©cupÃ©rer une classe
    SELECT id INTO sample_class_id 
    FROM classes 
    WHERE (is_active = true OR is_active IS NULL)
      AND (type = 'coranic' OR type IS NULL)
    LIMIT 1;
    
    IF sample_student_id IS NULL THEN
        RETURN 'Aucun Ã©tudiant trouvÃ© pour les donnÃ©es d''exemple';
    END IF;
    
    -- InsÃ©rer des Ã©valuations pour les 6 derniers mois
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
            10 + (i * 8), -- Pages mÃ©morisÃ©es progressives
            50 + (i * 30), -- Versets mÃ©morisÃ©s progressifs
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
            85 + (i * 2), -- Taux de prÃ©sence
            CASE WHEN i < 3 THEN 1 ELSE 0 END, -- Sourates complÃ©tÃ©es
            3 + i, -- Pages apprises ce mois
            'Ã‰valuation du ' || TO_CHAR(evaluation_date_var, 'DD/MM/YYYY') || ' - ProgrÃ¨s ' || 
            CASE WHEN i < 2 THEN 'excellent' ELSE 'satisfaisant' END,
            CASE i % 4
                WHEN 0 THEN 'excellent'
                WHEN 1 THEN 'tres_bon' 
                WHEN 2 THEN 'bon'
                ELSE 'bon'
            END,
            'Continuer la mÃ©morisation de ' || sourate_names[1 + (i % array_length(sourate_names, 1))],
            CASE WHEN i > 2 THEN 'Parfois des difficultÃ©s de concentration' ELSE NULL END,
            'Bonne mÃ©morisation et rÃ©citation claire',
            CASE WHEN i < 3 THEN true ELSE false END
        ) ON CONFLICT (student_id, evaluation_date) DO NOTHING;
    END LOOP;
    
    RETURN 'DonnÃ©es d''exemple insÃ©rÃ©es avec succÃ¨s pour l''Ã©tudiant ID: ' || sample_student_id;
END;
$$;


ALTER FUNCTION public.insert_sample_academic_progress() OWNER TO postgres;

--
-- Name: mark_notification_as_read(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.mark_notification_as_read(notification_uuid uuid, user_uuid integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, 
        updated_at = CURRENT_TIMESTAMP,
        updated_by = user_uuid
    WHERE id = notification_uuid;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION public.mark_notification_as_read(notification_uuid uuid, user_uuid integer) OWNER TO postgres;

--
-- Name: mark_notification_sent(uuid, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.mark_notification_sent(p_schedule_id uuid, p_notification_type character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF p_notification_type = 'sms' THEN
        UPDATE student_payment_schedules 
        SET sms_sent = true, 
            reminder_sent = true,
            reminder_count = reminder_count + 1,
            last_reminder_date = CURRENT_DATE
        WHERE id = p_schedule_id;
    ELSIF p_notification_type = 'email' THEN
        UPDATE student_payment_schedules 
        SET email_sent = true,
            reminder_sent = true,
            reminder_count = reminder_count + 1,
            last_reminder_date = CURRENT_DATE
        WHERE id = p_schedule_id;
    END IF;
END;
$$;


ALTER FUNCTION public.mark_notification_sent(p_schedule_id uuid, p_notification_type character varying) OWNER TO postgres;

--
-- Name: revoke_user_sessions(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.revoke_user_sessions(target_user_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    revoked_count INTEGER;
BEGIN
    UPDATE refresh_tokens 
    SET is_revoked = true, 
        revoked_at = CURRENT_TIMESTAMP,
        revoked_reason = 'admin_revoked'
    WHERE user_id = target_user_id AND is_revoked = false;
    
    GET DIAGNOSTICS revoked_count = ROW_COUNT;
    
    UPDATE user_sessions 
    SET is_active = false, 
        ended_at = CURRENT_TIMESTAMP,
        end_reason = 'admin_revoked'
    WHERE user_id = target_user_id AND is_active = true;
    
    RETURN revoked_count;
END;
$$;


ALTER FUNCTION public.revoke_user_sessions(target_user_id integer) OWNER TO postgres;

--
-- Name: show_real_data_summary(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.show_real_data_summary() RETURNS TABLE(source_type text, transaction_count bigint, total_amount numeric, date_range text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    
    -- Paiements Ã©tudiants
    SELECT 
        'Paiements Etudiants'::TEXT,
        COUNT(*)::BIGINT,
        COALESCE(SUM(amount), 0)::NUMERIC,
        COALESCE(MIN(payment_date)::TEXT || ' a ' || MAX(payment_date)::TEXT, 'Aucune donnee')::TEXT
    FROM student_payments 
    WHERE is_cancelled = FALSE AND amount > 0
    
    UNION ALL
    
    -- DÃ©penses gÃ©nÃ©rales
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
$$;


ALTER FUNCTION public.show_real_data_summary() OWNER TO postgres;

--
-- Name: sync_existing_transactions(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_existing_transactions() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Synchroniser les paiements Ã©tudiants
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
        'Paiement Ã©tudiant: ' || s.first_name || ' ' || s.last_name,
        sp.payment_date,
        'student_payments',
        sp.id,
        'COMPLETED',
        sp.payment_method,
        12 -- ID par dÃ©faut
    FROM student_payments sp
    JOIN students s ON sp.student_id = s.id
    WHERE sp.is_cancelled = FALSE
    AND NOT EXISTS (
        SELECT 1 FROM financial_transactions ft 
        WHERE ft.source_table = 'student_payments' AND ft.source_id = sp.id
    );
    
    -- Synchroniser les dÃ©penses
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
        12 -- ID par dÃ©faut
    FROM salary_payments_v2 sal
    JOIN staff_salaries_v2 ss ON sal.staff_salary_id = ss.id
    JOIN staff st ON ss.staff_id = st.id
    WHERE sal.status = 'completed'
    AND NOT EXISTS (
        SELECT 1 FROM financial_transactions ft 
        WHERE ft.source_table = 'salary_payments_v2' AND ft.source_id = sal.id
    );
    
END;
$$;


ALTER FUNCTION public.sync_existing_transactions() OWNER TO postgres;

--
-- Name: trigger_update_capital(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trigger_update_capital() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM update_financial_capital_simple();
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.trigger_update_capital() OWNER TO postgres;

--
-- Name: update_financial_capital_simple(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_financial_capital_simple() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    capital_data RECORD;
    result_text TEXT;
BEGIN
    -- RÃ©cupÃ©rer les vraies donnÃ©es depuis la vue
    SELECT * INTO capital_data FROM v_financial_dashboard_live;
    
    -- Supprimer l'ancien capital et insÃ©rer le nouveau
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
$$;


ALTER FUNCTION public.update_financial_capital_simple() OWNER TO postgres;

--
-- Name: update_payment_penalties(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_payment_penalties() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    penalty_rate NUMERIC := 2.0; -- 2% par mois de retard
    grace_period INTEGER := 5; -- 5 jours de grÃ¢ce
BEGIN
    -- Calculer les jours de retard
    UPDATE student_payment_schedules 
    SET overdue_days = GREATEST(0, CURRENT_DATE - due_date)
    WHERE status IN ('pending', 'partial', 'overdue');
    
    -- Marquer comme en retard (aprÃ¨s pÃ©riode de grÃ¢ce)
    UPDATE student_payment_schedules 
    SET status = 'overdue'
    WHERE status IN ('pending', 'partial')
    AND overdue_days > grace_period;
    
    -- Calculer les pÃ©nalitÃ©s
    UPDATE student_payment_schedules 
    SET penalty_amount = ROUND(
        base_amount * (penalty_rate / 100) * FLOOR(overdue_days / 30.0), 
        2
    ),
    final_amount = base_amount - discount_applied + ROUND(
        base_amount * (penalty_rate / 100) * FLOOR(overdue_days / 30.0), 
        2
    )
    WHERE status = 'overdue' AND overdue_days > grace_period;
    
    -- Marquer comme payÃ© si balance = 0
    UPDATE student_payment_schedules 
    SET status = 'paid'
    WHERE balance <= 0 AND status != 'paid';
    
END;
$$;


ALTER FUNCTION public.update_payment_penalties() OWNER TO postgres;

--
-- Name: update_student_age(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_student_age() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.age = calculate_age(NEW.birth_date);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_student_age() OWNER TO postgres;

--
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_timestamp() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--
-- Name: validate_payment(uuid, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_payment(p_payment_id uuid, p_validator character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    payment_exists BOOLEAN;
BEGIN
    -- VÃ©rifier que le paiement existe et n'est pas annulÃ©
    SELECT EXISTS(
        SELECT 1 FROM student_payments 
        WHERE id = p_payment_id 
        AND is_cancelled = false
        AND validated_by IS NULL
    ) INTO payment_exists;
    
    IF NOT payment_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Marquer comme validÃ©
    UPDATE student_payments 
    SET validated_by = p_validator,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_payment_id;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION public.validate_payment(p_payment_id uuid, p_validator character varying) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: school_years; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.school_years (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_current boolean DEFAULT false,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK ((end_date > start_date)),
    CONSTRAINT valid_year_name CHECK (((name)::text ~ '^[0-9]{4}-[0-9]{4}$'::text))
);


ALTER TABLE public.school_years OWNER TO postgres;

--
-- Name: student_academic_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_academic_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    school_year_id uuid NOT NULL,
    class_id uuid,
    evaluation_date date DEFAULT CURRENT_DATE NOT NULL,
    evaluation_month integer DEFAULT EXTRACT(month FROM CURRENT_DATE) NOT NULL,
    evaluation_year integer DEFAULT EXTRACT(year FROM CURRENT_DATE) NOT NULL,
    current_sourate character varying(100) NOT NULL,
    sourate_number integer,
    current_jouzou integer,
    current_hizb integer,
    pages_memorized integer DEFAULT 0,
    verses_memorized integer DEFAULT 0,
    memorization_status character varying(20) DEFAULT 'en_cours'::character varying,
    memorization_grade numeric(4,2),
    recitation_grade numeric(4,2),
    tajwid_grade numeric(4,2),
    behavior_grade numeric(4,2),
    overall_grade numeric(4,2),
    attendance_rate integer DEFAULT 100,
    sourates_completed_this_month integer DEFAULT 0,
    pages_learned_this_month integer DEFAULT 0,
    teacher_comment text,
    student_behavior character varying(20) DEFAULT 'bon'::character varying,
    next_month_objective text,
    difficulties text,
    strengths text,
    evaluated_by uuid,
    is_validated boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT student_academic_progress_attendance_rate_check CHECK (((attendance_rate >= 0) AND (attendance_rate <= 100))),
    CONSTRAINT student_academic_progress_behavior_grade_check CHECK (((behavior_grade >= (0)::numeric) AND (behavior_grade <= (20)::numeric))),
    CONSTRAINT student_academic_progress_current_hizb_check CHECK (((current_hizb >= 1) AND (current_hizb <= 60))),
    CONSTRAINT student_academic_progress_current_jouzou_check CHECK (((current_jouzou >= 1) AND (current_jouzou <= 30))),
    CONSTRAINT student_academic_progress_memorization_grade_check CHECK (((memorization_grade >= (0)::numeric) AND (memorization_grade <= (20)::numeric))),
    CONSTRAINT student_academic_progress_memorization_status_check CHECK (((memorization_status)::text = ANY ((ARRAY['non_commence'::character varying, 'en_cours'::character varying, 'memorise'::character varying, 'perfectionne'::character varying])::text[]))),
    CONSTRAINT student_academic_progress_overall_grade_check CHECK (((overall_grade >= (0)::numeric) AND (overall_grade <= (20)::numeric))),
    CONSTRAINT student_academic_progress_pages_memorized_check CHECK ((pages_memorized >= 0)),
    CONSTRAINT student_academic_progress_recitation_grade_check CHECK (((recitation_grade >= (0)::numeric) AND (recitation_grade <= (20)::numeric))),
    CONSTRAINT student_academic_progress_sourate_number_check CHECK (((sourate_number >= 1) AND (sourate_number <= 114))),
    CONSTRAINT student_academic_progress_student_behavior_check CHECK (((student_behavior)::text = ANY ((ARRAY['excellent'::character varying, 'tres_bon'::character varying, 'bon'::character varying, 'moyen'::character varying, 'difficile'::character varying])::text[]))),
    CONSTRAINT student_academic_progress_tajwid_grade_check CHECK (((tajwid_grade >= (0)::numeric) AND (tajwid_grade <= (20)::numeric))),
    CONSTRAINT student_academic_progress_verses_memorized_check CHECK ((verses_memorized >= 0)),
    CONSTRAINT valid_evaluation_date CHECK ((evaluation_date <= CURRENT_DATE))
);


ALTER TABLE public.student_academic_progress OWNER TO postgres;

--
-- Name: TABLE student_academic_progress; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.student_academic_progress IS 'Suivi de l''Ã©volution acadÃ©mique des Ã©tudiants coraniques - Structure simplifiÃ©e et optimisÃ©e';


--
-- Name: COLUMN student_academic_progress.evaluation_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.student_academic_progress.evaluation_date IS 'Date d''Ã©valuation (unique par Ã©tudiant par date)';


--
-- Name: COLUMN student_academic_progress.current_jouzou; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.student_academic_progress.current_jouzou IS 'Partie du Coran en cours d''Ã©tude (1-30)';


--
-- Name: COLUMN student_academic_progress.current_hizb; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.student_academic_progress.current_hizb IS 'Subdivision du Coran (1-60)';


--
-- Name: COLUMN student_academic_progress.pages_memorized; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.student_academic_progress.pages_memorized IS 'Nombre total de pages mÃ©morisÃ©es par l''Ã©tudiant';


--
-- Name: COLUMN student_academic_progress.memorization_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.student_academic_progress.memorization_status IS 'Statut de mÃ©morisation: non_commence, en_cours, memorise, perfectionne';


--
-- Name: COLUMN student_academic_progress.overall_grade; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.student_academic_progress.overall_grade IS 'Note globale calculÃ©e automatiquement (moyenne des 4 notes principales)';


--
-- Name: COLUMN student_academic_progress.is_validated; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.student_academic_progress.is_validated IS 'Ã‰valuation validÃ©e par un enseignant ou responsable';


--
-- Name: academic_progress_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.academic_progress_summary AS
 SELECT sap.evaluation_year,
    sap.evaluation_month,
    sap.school_year_id,
    sy.name AS school_year_name,
    count(DISTINCT sap.student_id) AS total_students_evaluated,
    round(avg(sap.overall_grade), 2) AS average_overall_grade,
    round(avg(sap.memorization_grade), 2) AS average_memorization,
    round(avg(sap.recitation_grade), 2) AS average_recitation,
    round(avg(sap.tajwid_grade), 2) AS average_tajwid,
    round(avg(sap.behavior_grade), 2) AS average_behavior,
    round(avg(sap.attendance_rate), 1) AS average_attendance_rate,
    round(avg(sap.pages_memorized), 1) AS average_pages_memorized,
    sum(sap.sourates_completed_this_month) AS total_sourates_completed,
    sum(sap.pages_learned_this_month) AS total_pages_learned,
    count(
        CASE
            WHEN ((sap.student_behavior)::text = 'excellent'::text) THEN 1
            ELSE NULL::integer
        END) AS excellent_behavior,
    count(
        CASE
            WHEN ((sap.student_behavior)::text = 'tres_bon'::text) THEN 1
            ELSE NULL::integer
        END) AS very_good_behavior,
    count(
        CASE
            WHEN ((sap.student_behavior)::text = 'bon'::text) THEN 1
            ELSE NULL::integer
        END) AS good_behavior,
    count(
        CASE
            WHEN ((sap.student_behavior)::text = 'moyen'::text) THEN 1
            ELSE NULL::integer
        END) AS average_behavior_count,
    count(
        CASE
            WHEN ((sap.student_behavior)::text = 'difficile'::text) THEN 1
            ELSE NULL::integer
        END) AS difficult_behavior,
    count(
        CASE
            WHEN (sap.overall_grade >= (16)::numeric) THEN 1
            ELSE NULL::integer
        END) AS excellent_grades,
    count(
        CASE
            WHEN ((sap.overall_grade >= (14)::numeric) AND (sap.overall_grade < (16)::numeric)) THEN 1
            ELSE NULL::integer
        END) AS good_grades,
    count(
        CASE
            WHEN ((sap.overall_grade >= (12)::numeric) AND (sap.overall_grade < (14)::numeric)) THEN 1
            ELSE NULL::integer
        END) AS average_grades,
    count(
        CASE
            WHEN (sap.overall_grade < (12)::numeric) THEN 1
            ELSE NULL::integer
        END) AS below_average_grades
   FROM (public.student_academic_progress sap
     LEFT JOIN public.school_years sy ON ((sap.school_year_id = sy.id)))
  GROUP BY sap.evaluation_year, sap.evaluation_month, sap.school_year_id, sy.name
  ORDER BY sap.evaluation_year DESC, sap.evaluation_month DESC;


ALTER VIEW public.academic_progress_summary OWNER TO postgres;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(200) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    role character varying(20) DEFAULT 'admin'::character varying,
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_first_login boolean DEFAULT false,
    avatar_url text,
    phone character varying(20),
    date_of_birth date,
    last_activity timestamp with time zone,
    CONSTRAINT admin_users_role_check CHECK (((role)::text = ANY ((ARRAY['super_admin'::character varying, 'admin'::character varying, 'teacher'::character varying, 'accountant'::character varying])::text[])))
);


ALTER TABLE public.admin_users OWNER TO postgres;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    session_id character varying(64) NOT NULL,
    access_token_jti character varying(64),
    connection_quality character varying(20) DEFAULT 'stable'::character varying,
    remember_me boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_activity_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp with time zone NOT NULL,
    client_ip inet,
    user_agent text,
    device_type character varying(20),
    browser_name character varying(50),
    os_name character varying(50),
    is_active boolean DEFAULT true,
    ended_at timestamp with time zone,
    end_reason character varying(50),
    requests_count integer DEFAULT 0,
    last_endpoint character varying(200),
    CONSTRAINT user_sessions_connection_quality_check CHECK (((connection_quality)::text = ANY ((ARRAY['stable'::character varying, 'unstable'::character varying, 'offline'::character varying])::text[])))
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: active_sessions; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.active_sessions AS
 SELECT us.id,
    us.user_id,
    au.email,
    au.first_name,
    au.last_name,
    us.session_id,
    us.connection_quality,
    us.remember_me,
    us.created_at,
    us.last_activity_at,
    us.expires_at,
    us.client_ip,
    us.device_type
   FROM (public.user_sessions us
     JOIN public.admin_users au ON ((us.user_id = au.id)))
  WHERE ((us.is_active = true) AND (us.expires_at > CURRENT_TIMESTAMP) AND (au.is_active = true))
  ORDER BY us.last_activity_at DESC;


ALTER VIEW public.active_sessions OWNER TO postgres;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    user_id integer,
    session_id character varying(64),
    action character varying(100) NOT NULL,
    resource character varying(100),
    method character varying(10),
    endpoint character varying(200),
    status_code integer,
    success boolean,
    error_code character varying(50),
    request_id character varying(20),
    connection_quality character varying(20),
    response_time_ms integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    client_ip inet,
    user_agent text,
    metadata jsonb
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_id_seq OWNER TO postgres;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_users_id_seq OWNER TO postgres;

--
-- Name: admin_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_users_id_seq OWNED BY public.admin_users.id;


--
-- Name: backup_payment_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.backup_payment_schedules (
    id integer,
    student_id integer,
    tuition_fee_id integer,
    due_month integer,
    due_year integer,
    amount_due numeric(10,2),
    discount_applied numeric(10,2),
    status character varying(20),
    created_at timestamp without time zone
);


ALTER TABLE public.backup_payment_schedules OWNER TO postgres;

--
-- Name: backup_staff; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.backup_staff (
    id integer,
    staff_number character varying(20),
    first_name character varying(100),
    last_name character varying(100),
    "position" character varying(100),
    department character varying(100),
    email character varying(200),
    phone character varying(20),
    address text,
    hire_date date,
    status character varying(20),
    photo_url character varying(500),
    qualifications text,
    notes text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.backup_staff OWNER TO postgres;

--
-- Name: backup_tuition_fees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.backup_tuition_fees (
    id integer,
    class_id integer,
    school_year_id integer,
    registration_fee numeric(10,2),
    monthly_amount numeric(10,2),
    annual_amount numeric(10,2),
    additional_fees numeric(10,2),
    payment_type character varying(20),
    orphan_discount_percent numeric(5,2),
    needy_discount_percent numeric(5,2),
    created_at timestamp without time zone
);


ALTER TABLE public.backup_tuition_fees OWNER TO postgres;

--
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    level character varying(50) NOT NULL,
    type character varying(20) NOT NULL,
    description text,
    capacity integer DEFAULT 30,
    teacher_id uuid,
    teacher_name character varying(200),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    school_year_id uuid,
    monthly_fee numeric(10,2) DEFAULT 0,
    CONSTRAINT classes_capacity_check CHECK ((capacity > 0)),
    CONSTRAINT classes_type_check CHECK (((type)::text = ANY ((ARRAY['coranic'::character varying, 'french'::character varying])::text[])))
);


ALTER TABLE public.classes OWNER TO postgres;

--
-- Name: TABLE classes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.classes IS 'Classes pour double scolarite: coraniques et francaises';


--
-- Name: COLUMN classes.type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.classes.type IS 'Type de classe: coranic (religieux) ou french (seculier)';


--
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_number character varying(50) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    birth_date date NOT NULL,
    age integer,
    gender character(1) NOT NULL,
    is_orphan boolean DEFAULT false,
    status character varying(20) DEFAULT 'externe'::character varying NOT NULL,
    coranic_class_id uuid,
    french_class_id uuid,
    school_year_id uuid,
    photo_url character varying(500),
    enrollment_date date DEFAULT CURRENT_DATE NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted boolean DEFAULT false,
    deleted_at timestamp without time zone,
    CONSTRAINT students_gender_check CHECK ((gender = ANY (ARRAY['M'::bpchar, 'F'::bpchar]))),
    CONSTRAINT students_status_check CHECK (((status)::text = ANY ((ARRAY['interne'::character varying, 'externe'::character varying, 'archived'::character varying])::text[]))),
    CONSTRAINT valid_age_range CHECK (((age >= 3) AND (age <= 25))),
    CONSTRAINT valid_birth_date CHECK ((birth_date <= CURRENT_DATE)),
    CONSTRAINT valid_enrollment_date CHECK ((enrollment_date <= CURRENT_DATE))
);


ALTER TABLE public.students OWNER TO postgres;

--
-- Name: TABLE students; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.students IS 'Table principale des etudiants avec support double scolarite';


--
-- Name: COLUMN students.student_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.students.student_number IS 'Numero unique de l etudiant (format: ELV-YYYY-XXX)';


--
-- Name: COLUMN students.is_orphan; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.students.is_orphan IS 'Indique si l etudiant est orphelin';


--
-- Name: COLUMN students.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.students.status IS 'Statut de l etudiant: interne, externe ou archived';


--
-- Name: COLUMN students.coranic_class_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.students.coranic_class_id IS 'Classe coranique (memorisation du Coran, Tajwid)';


--
-- Name: COLUMN students.french_class_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.students.french_class_id IS 'Classe francaise (programme educatif francais)';


--
-- Name: COLUMN students.notes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.students.notes IS 'Notes et observations sur l etudiant';


--
-- Name: class_statistics; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.class_statistics AS
 SELECT c.id,
    c.name,
    c.level,
    c.type,
    c.capacity,
    count(s.id) AS student_count,
    count(s.id) FILTER (WHERE (s.gender = 'M'::bpchar)) AS male_count,
    count(s.id) FILTER (WHERE (s.gender = 'F'::bpchar)) AS female_count,
    round((((count(s.id))::numeric / (NULLIF(c.capacity, 0))::numeric) * (100)::numeric), 2) AS utilization_rate,
    round(avg(s.age), 1) AS average_age,
    count(s.id) FILTER (WHERE (s.is_orphan = true)) AS orphan_count,
    count(s.id) FILTER (WHERE ((s.status)::text = 'interne'::text)) AS internal_count,
    c.created_at
   FROM (public.classes c
     LEFT JOIN public.students s ON ((((((c.type)::text = 'coranic'::text) AND (s.coranic_class_id = c.id)) OR (((c.type)::text = 'french'::text) AND (s.french_class_id = c.id))) AND ((s.status)::text <> 'archived'::text))))
  GROUP BY c.id, c.name, c.level, c.type, c.capacity, c.created_at;


ALTER VIEW public.class_statistics OWNER TO postgres;

--
-- Name: VIEW class_statistics; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.class_statistics IS 'Statistiques par classe pour tableaux de bord';


--
-- Name: expense_budgets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_budgets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    budget_year integer NOT NULL,
    budget_month integer,
    allocated_amount numeric(15,2) NOT NULL,
    spent_amount numeric(15,2) DEFAULT 0,
    remaining_amount numeric(15,2) GENERATED ALWAYS AS ((allocated_amount - COALESCE(spent_amount, (0)::numeric))) STORED,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT expense_budgets_allocated_amount_check CHECK ((allocated_amount >= (0)::numeric)),
    CONSTRAINT expense_budgets_budget_month_check CHECK (((budget_month >= 1) AND (budget_month <= 12)))
);


ALTER TABLE public.expense_budgets OWNER TO postgres;

--
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    name_ar character varying(255),
    description text,
    color character varying(7) DEFAULT '#3B82F6'::character varying,
    icon character varying(50) DEFAULT 'document'::character varying,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.expense_categories OWNER TO postgres;

--
-- Name: expense_responsibles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_responsibles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    department character varying(100),
    "position" character varying(100),
    email character varying(255),
    phone character varying(20),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.expense_responsibles OWNER TO postgres;

--
-- Name: expense_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    expense_id uuid NOT NULL,
    old_status_id uuid,
    new_status_id uuid NOT NULL,
    changed_by integer,
    change_reason text,
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.expense_status_history OWNER TO postgres;

--
-- Name: expense_statuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_statuses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    name_ar character varying(100),
    color character varying(7) NOT NULL,
    icon character varying(50) DEFAULT 'clipboard'::character varying,
    description text,
    is_final boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.expense_statuses OWNER TO postgres;

--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reference character varying(50) NOT NULL,
    description text NOT NULL,
    amount numeric(15,2) NOT NULL,
    category_id uuid NOT NULL,
    responsible_id uuid,
    status_id uuid NOT NULL,
    expense_date date NOT NULL,
    due_date date,
    paid_date date,
    payment_method character varying(50),
    payment_reference character varying(100),
    supplier_name character varying(255),
    supplier_contact character varying(255),
    invoice_number character varying(100),
    receipt_url text,
    notes text,
    budget_year integer DEFAULT EXTRACT(year FROM CURRENT_DATE) NOT NULL,
    budget_month integer,
    created_by integer,
    updated_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    responsible_user_id integer,
    responsible_user_name character varying(255),
    responsible_user_role character varying(50),
    CONSTRAINT expenses_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT expenses_budget_month_check CHECK (((budget_month >= 1) AND (budget_month <= 12))),
    CONSTRAINT expenses_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['cash'::character varying, 'bank_transfer'::character varying, 'check'::character varying, 'card'::character varying, 'mobile_money'::character varying])::text[])))
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: COLUMN expenses.responsible_user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.expenses.responsible_user_id IS 'ID de l''utilisateur responsable de la d‚pense (qui l''a cr‚‚e)';


--
-- Name: COLUMN expenses.responsible_user_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.expenses.responsible_user_name IS 'Nom complet de l''utilisateur responsable';


--
-- Name: COLUMN expenses.responsible_user_role; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.expenses.responsible_user_role IS 'R“le de l''utilisateur responsable (admin/super_admin)';


--
-- Name: financial_capital; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_capital (
    id integer NOT NULL,
    current_balance numeric(15,2) DEFAULT 0 NOT NULL,
    total_income numeric(15,2) DEFAULT 0,
    total_expenses numeric(15,2) DEFAULT 0,
    monthly_income numeric(15,2) DEFAULT 0,
    monthly_expenses numeric(15,2) DEFAULT 0,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by integer,
    notes text
);


ALTER TABLE public.financial_capital OWNER TO postgres;

--
-- Name: financial_capital_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.financial_capital_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.financial_capital_id_seq OWNER TO postgres;

--
-- Name: financial_capital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.financial_capital_id_seq OWNED BY public.financial_capital.id;


--
-- Name: financial_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(20) NOT NULL,
    color character varying(7) DEFAULT '#3B82F6'::character varying,
    icon character varying(50) DEFAULT 'money'::character varying,
    monthly_budget numeric(15,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT financial_categories_type_check CHECK (((type)::text = ANY ((ARRAY['INCOME'::character varying, 'EXPENSE'::character varying])::text[])))
);


ALTER TABLE public.financial_categories OWNER TO postgres;

--
-- Name: financial_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.financial_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.financial_categories_id_seq OWNER TO postgres;

--
-- Name: financial_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.financial_categories_id_seq OWNED BY public.financial_categories.id;


--
-- Name: student_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    payment_schedule_id uuid,
    amount numeric(10,2) NOT NULL,
    payment_date date DEFAULT CURRENT_DATE NOT NULL,
    payment_method character varying(20) NOT NULL,
    payment_type character varying(30) NOT NULL,
    receipt_number character varying(50),
    reference_number character varying(100),
    transaction_id character varying(100),
    received_by character varying(100) NOT NULL,
    validated_by character varying(100),
    guardian_signature boolean DEFAULT false,
    receipt_printed boolean DEFAULT false,
    receipt_sent_sms boolean DEFAULT false,
    receipt_sent_email boolean DEFAULT false,
    notes text,
    is_cancelled boolean DEFAULT false,
    cancelled_reason text,
    cancelled_by character varying(100),
    cancelled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(100) NOT NULL,
    paid_by character varying(255),
    payment_month integer,
    payment_year integer,
    number_of_months integer DEFAULT 1,
    amount_due numeric(15,2),
    CONSTRAINT student_payments_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT student_payments_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['cash'::character varying, 'bank_transfer'::character varying, 'mobile_money'::character varying, 'check'::character varying, 'card'::character varying])::text[]))),
    CONSTRAINT student_payments_payment_type_check CHECK (((payment_type)::text = ANY ((ARRAY['tuition_monthly'::character varying, 'registration'::character varying, 'exam_fee'::character varying, 'book_fee'::character varying, 'uniform_fee'::character varying, 'transport_fee'::character varying, 'meal_fee'::character varying, 'penalty'::character varying, 'advance_payment'::character varying, 'refund'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE public.student_payments OWNER TO postgres;

--
-- Name: TABLE student_payments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.student_payments IS 'Historique complet des paiements avec traÃ§abilitÃ©';


--
-- Name: financial_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.financial_summary AS
 SELECT date_trunc('month'::text, (payment_date)::timestamp with time zone) AS month,
    count(*) AS payment_count,
    sum(amount) AS total_amount,
    avg(amount) AS average_amount,
    count(DISTINCT student_id) AS students_paid,
    sum(
        CASE
            WHEN ((payment_type)::text = 'tuition_monthly'::text) THEN amount
            ELSE (0)::numeric
        END) AS tuition_revenue,
    sum(
        CASE
            WHEN ((payment_type)::text = 'registration'::text) THEN amount
            ELSE (0)::numeric
        END) AS registration_revenue,
    sum(
        CASE
            WHEN ((payment_type)::text ~~ '%_fee'::text) THEN amount
            ELSE (0)::numeric
        END) AS fees_revenue,
    count(*) FILTER (WHERE ((payment_method)::text = 'cash'::text)) AS cash_payments,
    count(*) FILTER (WHERE ((payment_method)::text = 'bank_transfer'::text)) AS bank_payments,
    count(*) FILTER (WHERE ((payment_method)::text = 'mobile_money'::text)) AS mobile_payments
   FROM public.student_payments sp
  WHERE (is_cancelled = false)
  GROUP BY (date_trunc('month'::text, (payment_date)::timestamp with time zone))
  ORDER BY (date_trunc('month'::text, (payment_date)::timestamp with time zone)) DESC;


ALTER VIEW public.financial_summary OWNER TO postgres;

--
-- Name: VIEW financial_summary; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.financial_summary IS 'RÃ©sumÃ© financier mensuel pour rapports';


--
-- Name: guardians; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guardians (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(255),
    address text,
    relationship character varying(50) NOT NULL,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_email CHECK (((email IS NULL) OR ((email)::text ~ '^[^@]+@[^@]+\.[^@]+$'::text))),
    CONSTRAINT valid_phone CHECK (((phone)::text ~ '^[\+]?[0-9\s\-\(\)]+$'::text))
);


ALTER TABLE public.guardians OWNER TO postgres;

--
-- Name: TABLE guardians; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.guardians IS 'Tuteurs/gardiens des etudiants avec contacts';


--
-- Name: COLUMN guardians.is_primary; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.guardians.is_primary IS 'Tuteur principal pour les communications officielles';


--
-- Name: manual_financial_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.manual_financial_transactions (
    id integer NOT NULL,
    reference character varying(100) NOT NULL,
    type character varying(10) NOT NULL,
    category character varying(100),
    amount numeric(15,2) NOT NULL,
    description text NOT NULL,
    transaction_date date DEFAULT CURRENT_DATE NOT NULL,
    payment_method character varying(50) DEFAULT 'manual_injection'::character varying,
    notes text,
    entity_name character varying(255),
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'completed'::character varying,
    impact_capital boolean DEFAULT true,
    metadata jsonb,
    CONSTRAINT manual_financial_transactions_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT manual_financial_transactions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT manual_financial_transactions_type_check CHECK (((type)::text = ANY ((ARRAY['INCOME'::character varying, 'EXPENSE'::character varying])::text[])))
);


ALTER TABLE public.manual_financial_transactions OWNER TO postgres;

--
-- Name: manual_financial_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.manual_financial_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.manual_financial_transactions_id_seq OWNER TO postgres;

--
-- Name: manual_financial_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.manual_financial_transactions_id_seq OWNED BY public.manual_financial_transactions.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    message text,
    type character varying(50) DEFAULT 'info'::character varying NOT NULL,
    priority character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    due_date timestamp with time zone,
    reminder_date timestamp with time zone,
    is_read boolean DEFAULT false,
    is_active boolean DEFAULT true,
    is_reminder_sent boolean DEFAULT false,
    user_id integer,
    category character varying(100),
    related_entity_type character varying(50),
    related_entity_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_by integer,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by integer,
    CONSTRAINT chk_notification_dates CHECK ((((due_date IS NULL) OR (due_date >= created_at)) AND ((reminder_date IS NULL) OR (reminder_date >= created_at)) AND ((due_date IS NULL) OR (reminder_date IS NULL) OR (reminder_date <= due_date)))),
    CONSTRAINT chk_notification_priority CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))),
    CONSTRAINT chk_notification_type CHECK (((type)::text = ANY ((ARRAY['info'::character varying, 'warning'::character varying, 'error'::character varying, 'success'::character varying, 'reminder'::character varying, 'alert'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: TABLE notifications; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.notifications IS 'Systeme de notifications avec priorites, rappels et gestion des delais';


--
-- Name: COLUMN notifications.title; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notifications.title IS 'Titre de la notification (obligatoire)';


--
-- Name: COLUMN notifications.message; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notifications.message IS 'Message detaille de la notification';


--
-- Name: COLUMN notifications.type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notifications.type IS 'Type: info, warning, error, success, reminder, alert';


--
-- Name: COLUMN notifications.priority; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notifications.priority IS 'Priorite: low, medium, high, urgent';


--
-- Name: COLUMN notifications.due_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notifications.due_date IS 'Date limite pour la notification';


--
-- Name: COLUMN notifications.reminder_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notifications.reminder_date IS 'Date a laquelle envoyer un rappel';


--
-- Name: COLUMN notifications.category; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notifications.category IS 'Categorie: payment, expense, salary, general, system';


--
-- Name: COLUMN notifications.related_entity_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notifications.related_entity_type IS 'Type d entite liee (student, expense, etc.)';


--
-- Name: COLUMN notifications.related_entity_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notifications.related_entity_id IS 'ID de l entite liee';


--
-- Name: COLUMN notifications.metadata; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notifications.metadata IS 'Donnees JSON additionnelles';


--
-- Name: notifications_dashboard; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.notifications_dashboard AS
 SELECT count(*) FILTER (WHERE (((priority)::text = 'urgent'::text) AND (is_read = false) AND (is_active = true))) AS urgent_unread,
    count(*) FILTER (WHERE (((priority)::text = 'high'::text) AND (is_read = false) AND (is_active = true))) AS high_unread,
    count(*) FILTER (WHERE (((priority)::text = 'medium'::text) AND (is_read = false) AND (is_active = true))) AS medium_unread,
    count(*) FILTER (WHERE (((priority)::text = 'low'::text) AND (is_read = false) AND (is_active = true))) AS low_unread,
    count(*) FILTER (WHERE (((type)::text = 'error'::text) AND (is_read = false) AND (is_active = true))) AS error_unread,
    count(*) FILTER (WHERE (((type)::text = 'warning'::text) AND (is_read = false) AND (is_active = true))) AS warning_unread,
    count(*) FILTER (WHERE (((type)::text = 'reminder'::text) AND (is_read = false) AND (is_active = true))) AS reminder_unread,
    count(*) FILTER (WHERE ((is_read = false) AND (is_active = true))) AS total_unread,
    count(*) FILTER (WHERE (created_at >= CURRENT_DATE)) AS today_created,
    count(*) FILTER (WHERE ((due_date <= (CURRENT_TIMESTAMP + '24:00:00'::interval)) AND (due_date > CURRENT_TIMESTAMP) AND (is_active = true))) AS due_soon,
    count(*) FILTER (WHERE ((due_date <= CURRENT_TIMESTAMP) AND (is_active = true))) AS overdue
   FROM public.notifications;


ALTER VIEW public.notifications_dashboard OWNER TO postgres;

--
-- Name: notifications_with_user; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.notifications_with_user AS
 SELECT n.id,
    n.title,
    n.message,
    n.type,
    n.priority,
    n.created_at,
    n.due_date,
    n.reminder_date,
    n.is_read,
    n.is_active,
    n.is_reminder_sent,
    n.user_id,
    n.category,
    n.related_entity_type,
    n.related_entity_id,
    n.metadata,
    n.created_by,
    n.updated_at,
    n.updated_by,
    (((u.first_name)::text || ' '::text) || (u.last_name)::text) AS user_name,
    u.email AS user_email,
    u.role AS user_role,
    (((cb.first_name)::text || ' '::text) || (cb.last_name)::text) AS created_by_name,
        CASE
            WHEN (n.due_date IS NOT NULL) THEN (EXTRACT(epoch FROM (n.due_date - CURRENT_TIMESTAMP)) / (3600)::numeric)
            ELSE NULL::numeric
        END AS hours_remaining,
        CASE n.priority
            WHEN 'urgent'::text THEN '#DC2626'::text
            WHEN 'high'::text THEN '#EA580C'::text
            WHEN 'medium'::text THEN '#D97706'::text
            WHEN 'low'::text THEN '#059669'::text
            ELSE NULL::text
        END AS priority_color,
        CASE n.type
            WHEN 'error'::text THEN 'AlertTriangle'::text
            WHEN 'warning'::text THEN 'AlertCircle'::text
            WHEN 'success'::text THEN 'CheckCircle'::text
            WHEN 'info'::text THEN 'Info'::text
            WHEN 'reminder'::text THEN 'Clock'::text
            WHEN 'alert'::text THEN 'Bell'::text
            ELSE 'Bell'::text
        END AS type_icon
   FROM ((public.notifications n
     LEFT JOIN public.admin_users u ON ((n.user_id = u.id)))
     LEFT JOIN public.admin_users cb ON ((n.created_by = cb.id)));


ALTER VIEW public.notifications_with_user OWNER TO postgres;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    used_at timestamp with time zone,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_reset_tokens_id_seq OWNER TO postgres;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: previous_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.previous_data (
    year numeric,
    month numeric,
    period text,
    period_name text,
    student_payments_total numeric,
    expenses_total numeric,
    salary_payments_total numeric,
    manual_income_total numeric,
    manual_expense_total numeric,
    total_income numeric,
    total_expenses numeric,
    net_flow numeric,
    total_transactions bigint,
    income_transactions bigint,
    expense_transactions bigint,
    avg_income_amount numeric,
    avg_expense_amount numeric
);


ALTER TABLE public.previous_data OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token_hash character varying(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    connection_quality character varying(20) DEFAULT 'stable'::character varying,
    remember_me boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_used_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    client_ip inet,
    user_agent text,
    device_fingerprint character varying(64),
    is_revoked boolean DEFAULT false,
    revoked_at timestamp with time zone,
    revoked_reason character varying(100),
    CONSTRAINT refresh_tokens_connection_quality_check CHECK (((connection_quality)::text = ANY ((ARRAY['stable'::character varying, 'unstable'::character varying, 'offline'::character varying])::text[])))
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refresh_tokens_id_seq OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: salary_payments_v2; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salary_payments_v2 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_salary_id uuid NOT NULL,
    payment_type character varying(20) NOT NULL,
    amount numeric(12,2) NOT NULL,
    start_month integer,
    end_month integer,
    payment_year integer NOT NULL,
    months_covered integer DEFAULT 1,
    payment_date date DEFAULT CURRENT_DATE NOT NULL,
    payment_method character varying(20) DEFAULT 'cash'::character varying NOT NULL,
    reference_number character varying(50),
    paid_by character varying(100),
    status character varying(20) DEFAULT 'completed'::character varying,
    is_advance boolean DEFAULT false,
    advance_deducted_from uuid,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(100),
    payment_status character varying(20) DEFAULT 'pending'::character varying,
    gross_amount numeric(12,2),
    net_amount numeric(12,2),
    tax_amount numeric(12,2) DEFAULT 0,
    bonus_amount numeric(12,2) DEFAULT 0,
    deduction_amount numeric(12,2) DEFAULT 0,
    payment_period character varying(20),
    payment_month integer,
    receipt_number character varying(50),
    CONSTRAINT salary_payments_v2_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT salary_payments_v2_end_month_check CHECK (((end_month >= 1) AND (end_month <= 12))),
    CONSTRAINT salary_payments_v2_months_covered_check CHECK (((months_covered >= 1) AND (months_covered <= 12))),
    CONSTRAINT salary_payments_v2_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['cash'::character varying, 'bank_transfer'::character varying, 'mobile_money'::character varying, 'check'::character varying])::text[]))),
    CONSTRAINT salary_payments_v2_payment_type_check CHECK (((payment_type)::text = ANY ((ARRAY['monthly'::character varying, 'multi_month'::character varying, 'annual'::character varying, 'bonus'::character varying, 'advance'::character varying, 'custom'::character varying])::text[]))),
    CONSTRAINT salary_payments_v2_payment_year_check CHECK (((payment_year >= 2020) AND (payment_year <= 2040))),
    CONSTRAINT salary_payments_v2_start_month_check CHECK (((start_month >= 1) AND (start_month <= 12))),
    CONSTRAINT salary_payments_v2_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'partial'::character varying])::text[])))
);


ALTER TABLE public.salary_payments_v2 OWNER TO postgres;

--
-- Name: TABLE salary_payments_v2; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.salary_payments_v2 IS 'Paiements de salaires avec support multi-mois';


--
-- Name: sample_class_id; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sample_class_id (
    id uuid
);


ALTER TABLE public.sample_class_id OWNER TO postgres;

--
-- Name: sample_school_year_id; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sample_school_year_id (
    id uuid
);


ALTER TABLE public.sample_school_year_id OWNER TO postgres;

--
-- Name: staff; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff (
    staff_number character varying(20) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    "position" character varying(100),
    department character varying(100),
    email character varying(200),
    phone character varying(20),
    address text,
    hire_date date,
    status character varying(20) DEFAULT 'active'::character varying,
    photo_url character varying(500),
    qualifications text,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date_of_birth date,
    gender character varying(10),
    nationality character varying(50),
    emergency_contact character varying(200),
    emergency_phone character varying(20),
    bank_account character varying(100),
    payment_method character varying(50),
    contract_type character varying(50),
    employment_type character varying(50) DEFAULT 'full_time'::character varying,
    salary numeric(12,2) DEFAULT NULL::numeric,
    CONSTRAINT staff_gender_check CHECK (((gender)::text = ANY ((ARRAY['male'::character varying, 'female'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT staff_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'on_leave'::character varying])::text[])))
);


ALTER TABLE public.staff OWNER TO postgres;

--
-- Name: COLUMN staff.date_of_birth; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.staff.date_of_birth IS 'Date de naissance de l''employ‚';


--
-- Name: COLUMN staff.gender; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.staff.gender IS 'Genre de l''employ‚ (male/female/other)';


--
-- Name: COLUMN staff.nationality; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.staff.nationality IS 'Nationalit‚ de l''employ‚';


--
-- Name: COLUMN staff.emergency_contact; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.staff.emergency_contact IS 'Nom du contact d''urgence';


--
-- Name: COLUMN staff.emergency_phone; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.staff.emergency_phone IS 'T‚l‚phone du contact d''urgence';


--
-- Name: COLUMN staff.bank_account; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.staff.bank_account IS 'Num‚ro de compte bancaire';


--
-- Name: COLUMN staff.payment_method; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.staff.payment_method IS 'M‚thode de paiement (virement, espŠces, etc.)';


--
-- Name: COLUMN staff.contract_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.staff.contract_type IS 'Type de contrat (CDI, CDD, stage, etc.)';


--
-- Name: COLUMN staff.employment_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.staff.employment_type IS 'Type d''emploi (temps plein, temps partiel)';


--
-- Name: student_payment_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_payment_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    tuition_fee_id uuid NOT NULL,
    due_month integer NOT NULL,
    due_year integer NOT NULL,
    due_date date NOT NULL,
    base_amount numeric(10,2) NOT NULL,
    discount_applied numeric(10,2) DEFAULT 0,
    penalty_amount numeric(10,2) DEFAULT 0,
    final_amount numeric(10,2) NOT NULL,
    amount_paid numeric(10,2) DEFAULT 0,
    balance numeric(10,2) GENERATED ALWAYS AS ((final_amount - amount_paid)) STORED,
    status character varying(20) DEFAULT 'pending'::character varying,
    overdue_days integer DEFAULT 0,
    reminder_sent boolean DEFAULT false,
    reminder_count integer DEFAULT 0,
    last_reminder_date date,
    sms_sent boolean DEFAULT false,
    email_sent boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT student_payment_schedules_amount_paid_check CHECK ((amount_paid >= (0)::numeric)),
    CONSTRAINT student_payment_schedules_base_amount_check CHECK ((base_amount >= (0)::numeric)),
    CONSTRAINT student_payment_schedules_discount_applied_check CHECK ((discount_applied >= (0)::numeric)),
    CONSTRAINT student_payment_schedules_due_month_check CHECK (((due_month >= 1) AND (due_month <= 12))),
    CONSTRAINT student_payment_schedules_due_year_check CHECK (((due_year >= 2020) AND (due_year <= 2040))),
    CONSTRAINT student_payment_schedules_final_amount_check CHECK ((final_amount >= (0)::numeric)),
    CONSTRAINT student_payment_schedules_overdue_days_check CHECK ((overdue_days >= 0)),
    CONSTRAINT student_payment_schedules_penalty_amount_check CHECK ((penalty_amount >= (0)::numeric)),
    CONSTRAINT student_payment_schedules_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'partial'::character varying, 'overdue'::character varying, 'cancelled'::character varying, 'waived'::character varying])::text[])))
);


ALTER TABLE public.student_payment_schedules OWNER TO postgres;

--
-- Name: TABLE student_payment_schedules; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.student_payment_schedules IS 'Ã‰chÃ©anciers de paiement avec calcul automatique des pÃ©nalitÃ©s';


--
-- Name: school_dashboard; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.school_dashboard AS
 SELECT ( SELECT count(*) AS count
           FROM public.students
          WHERE (((students.status)::text <> 'archived'::text) AND (students.deleted = false))) AS total_students,
    ( SELECT count(*) AS count
           FROM public.students
          WHERE (((students.status)::text = 'interne'::text) AND (students.deleted = false))) AS internal_students,
    ( SELECT count(*) AS count
           FROM public.students
          WHERE ((students.is_orphan = true) AND (students.deleted = false))) AS orphan_students,
    ( SELECT count(*) AS count
           FROM public.students
          WHERE ((students.gender = 'F'::bpchar) AND (students.deleted = false))) AS female_students,
    ( SELECT count(*) AS count
           FROM public.students
          WHERE ((students.gender = 'M'::bpchar) AND (students.deleted = false))) AS male_students,
    ( SELECT count(*) AS count
           FROM public.classes
          WHERE (classes.is_active = true)) AS total_classes,
    ( SELECT count(*) AS count
           FROM public.classes
          WHERE (((classes.type)::text = 'coranic'::text) AND (classes.is_active = true))) AS coranic_classes,
    ( SELECT count(*) AS count
           FROM public.classes
          WHERE (((classes.type)::text = 'french'::text) AND (classes.is_active = true))) AS french_classes,
    ( SELECT count(*) AS count
           FROM public.staff
          WHERE ((staff.status)::text = 'active'::text)) AS total_staff,
    ( SELECT count(*) AS count
           FROM public.student_payment_schedules
          WHERE (((student_payment_schedules.due_month)::numeric = EXTRACT(month FROM CURRENT_DATE)) AND ((student_payment_schedules.due_year)::numeric = EXTRACT(year FROM CURRENT_DATE)) AND ((student_payment_schedules.status)::text = 'paid'::text))) AS payments_this_month,
    ( SELECT count(*) AS count
           FROM public.student_payment_schedules
          WHERE ((student_payment_schedules.status)::text = 'overdue'::text)) AS overdue_payments,
    ( SELECT COALESCE(sum(student_payments.amount), (0)::numeric) AS "coalesce"
           FROM public.student_payments
          WHERE (student_payments.payment_date >= date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))) AS revenue_this_month,
    ( SELECT COALESCE(sum(student_payments.amount), (0)::numeric) AS "coalesce"
           FROM public.student_payments
          WHERE (student_payments.payment_date >= date_trunc('year'::text, (CURRENT_DATE)::timestamp with time zone))) AS revenue_this_year;


ALTER VIEW public.school_dashboard OWNER TO postgres;

--
-- Name: VIEW school_dashboard; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.school_dashboard IS 'Tableau de bord avec statistiques gÃ©nÃ©rales';


--
-- Name: staff_salaries_v2; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_salaries_v2 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_year_id uuid,
    monthly_salary numeric(12,2) NOT NULL,
    effective_date date DEFAULT CURRENT_DATE NOT NULL,
    bonus_percent numeric(5,2) DEFAULT 0,
    deduction_percent numeric(5,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    staff_id uuid NOT NULL,
    salary_type character varying(50) DEFAULT 'monthly'::character varying,
    currency character varying(10) DEFAULT 'GNF'::character varying,
    payment_frequency character varying(20) DEFAULT 'monthly'::character varying,
    CONSTRAINT staff_salaries_v2_bonus_percent_check CHECK (((bonus_percent >= (0)::numeric) AND (bonus_percent <= (100)::numeric))),
    CONSTRAINT staff_salaries_v2_deduction_percent_check CHECK (((deduction_percent >= (0)::numeric) AND (deduction_percent <= (50)::numeric))),
    CONSTRAINT staff_salaries_v2_monthly_salary_check CHECK ((monthly_salary >= (0)::numeric))
);


ALTER TABLE public.staff_salaries_v2 OWNER TO postgres;

--
-- Name: TABLE staff_salaries_v2; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.staff_salaries_v2 IS 'Salaires du personnel avec bonus et dÃ©ductions';


--
-- Name: student_academic_history; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.student_academic_history AS
 SELECT sap.id,
    s.id AS student_id,
    s.student_number,
    (((s.first_name)::text || ' '::text) || (s.last_name)::text) AS student_name,
    s.age,
    s.gender,
    sap.evaluation_date,
    to_char((sap.evaluation_date)::timestamp with time zone, 'DD/MM/YYYY'::text) AS evaluation_date_formatted,
    sap.evaluation_month,
    sap.evaluation_year,
    c.name AS class_name,
    c.level AS class_level,
    sy.name AS school_year_name,
    sap.current_sourate,
    sap.sourate_number,
    sap.current_jouzou,
    sap.current_hizb,
    sap.memorization_status,
    sap.pages_memorized,
    sap.verses_memorized,
    sap.memorization_grade,
    sap.recitation_grade,
    sap.tajwid_grade,
    sap.behavior_grade,
    sap.overall_grade,
    sap.attendance_rate,
    sap.sourates_completed_this_month,
    sap.pages_learned_this_month,
    sap.teacher_comment,
    sap.student_behavior,
    sap.next_month_objective,
    sap.difficulties,
    sap.strengths,
    sap.is_validated,
    (((st.first_name)::text || ' '::text) || (st.last_name)::text) AS evaluated_by_name,
    sap.created_at,
    sap.updated_at
   FROM ((((public.student_academic_progress sap
     JOIN public.students s ON ((sap.student_id = s.id)))
     LEFT JOIN public.classes c ON ((sap.class_id = c.id)))
     LEFT JOIN public.school_years sy ON ((sap.school_year_id = sy.id)))
     LEFT JOIN public.staff st ON ((sap.evaluated_by = st.id)))
  WHERE ((s.deleted = false) OR (s.deleted IS NULL))
  ORDER BY s.student_number, sap.evaluation_date DESC;


ALTER VIEW public.student_academic_history OWNER TO postgres;

--
-- Name: student_yearly_evolution; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.student_yearly_evolution AS
 SELECT s.id AS student_id,
    s.student_number,
    (((s.first_name)::text || ' '::text) || (s.last_name)::text) AS student_name,
    sap.evaluation_year,
    sy.name AS school_year_name,
    count(*) AS evaluations_count,
    round(avg(sap.overall_grade), 2) AS yearly_average,
    min(sap.overall_grade) AS min_grade,
    max(sap.overall_grade) AS max_grade,
    max(sap.pages_memorized) AS total_pages_memorized,
    sum(sap.sourates_completed_this_month) AS total_sourates_completed,
    max(sap.current_jouzou) AS max_jouzou_reached,
    round(avg(sap.memorization_grade), 2) AS avg_memorization,
    round(avg(sap.recitation_grade), 2) AS avg_recitation,
    round(avg(sap.tajwid_grade), 2) AS avg_tajwid,
    round(avg(sap.behavior_grade), 2) AS avg_behavior,
    round(avg(sap.attendance_rate), 1) AS avg_attendance
   FROM ((public.students s
     JOIN public.student_academic_progress sap ON ((s.id = sap.student_id)))
     LEFT JOIN public.school_years sy ON ((sap.school_year_id = sy.id)))
  WHERE ((s.deleted = false) OR (s.deleted IS NULL))
  GROUP BY s.id, s.student_number, s.first_name, s.last_name, sap.evaluation_year, sy.name
  ORDER BY s.student_number, sap.evaluation_year DESC;


ALTER VIEW public.student_yearly_evolution OWNER TO postgres;

--
-- Name: students_complete; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.students_complete AS
 SELECT s.id,
    s.student_number,
    s.first_name,
    s.last_name,
    (((s.first_name)::text || ' '::text) || (s.last_name)::text) AS full_name,
    s.birth_date,
    s.age,
    s.gender,
    s.is_orphan,
    s.status,
    s.photo_url,
    s.enrollment_date,
    s.notes,
    cc.name AS coranic_class_name,
    cc.level AS coranic_class_level,
    fc.name AS french_class_name,
    fc.level AS french_class_level,
    sy.name AS school_year_name,
    sy.start_date AS school_year_start,
    sy.end_date AS school_year_end,
    sy.is_current AS is_current_year,
    g.first_name AS guardian_first_name,
    g.last_name AS guardian_last_name,
    g.phone AS guardian_phone,
    g.email AS guardian_email,
    g.address AS guardian_address,
    g.relationship AS guardian_relationship,
    s.created_at,
    s.updated_at
   FROM ((((public.students s
     LEFT JOIN public.classes cc ON ((s.coranic_class_id = cc.id)))
     LEFT JOIN public.classes fc ON ((s.french_class_id = fc.id)))
     LEFT JOIN public.school_years sy ON ((s.school_year_id = sy.id)))
     LEFT JOIN public.guardians g ON (((s.id = g.student_id) AND (g.is_primary = true))));


ALTER VIEW public.students_complete OWNER TO postgres;

--
-- Name: VIEW students_complete; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.students_complete IS 'Vue complete avec toutes les informations etudiant pour affichage';


--
-- Name: students_with_payments; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.students_with_payments AS
SELECT
    NULL::uuid AS id,
    NULL::character varying(50) AS student_number,
    NULL::character varying(100) AS first_name,
    NULL::character varying(100) AS last_name,
    NULL::date AS birth_date,
    NULL::integer AS age,
    NULL::character(1) AS gender,
    NULL::boolean AS is_orphan,
    NULL::character varying(20) AS status,
    NULL::uuid AS coranic_class_id,
    NULL::uuid AS french_class_id,
    NULL::uuid AS school_year_id,
    NULL::character varying(500) AS photo_url,
    NULL::date AS enrollment_date,
    NULL::text AS notes,
    NULL::timestamp with time zone AS created_at,
    NULL::timestamp with time zone AS updated_at,
    NULL::boolean AS deleted,
    NULL::timestamp without time zone AS deleted_at,
    NULL::json AS coranic_class,
    NULL::json AS french_class,
    NULL::text AS french_school_name,
    NULL::json AS school_year,
    NULL::json AS guardians,
    NULL::json AS primary_guardian,
    NULL::text AS current_payment_status,
    NULL::numeric AS current_balance,
    NULL::numeric AS overdue_amount,
    NULL::bigint AS overdue_count,
    NULL::date AS last_payment_date,
    NULL::numeric AS total_paid_this_year;


ALTER VIEW public.students_with_payments OWNER TO postgres;

--
-- Name: VIEW students_with_payments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.students_with_payments IS 'Vue complÃ¨te des Ã©tudiants avec statut financier en temps rÃ©el';


--
-- Name: tuition_fees_v2; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tuition_fees_v2 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_id uuid NOT NULL,
    school_year_id uuid NOT NULL,
    registration_fee numeric(10,2) DEFAULT 0 NOT NULL,
    monthly_amount numeric(10,2) DEFAULT 0 NOT NULL,
    annual_amount numeric(10,2) DEFAULT 0 NOT NULL,
    exam_fee numeric(10,2) DEFAULT 0,
    book_fee numeric(10,2) DEFAULT 0,
    uniform_fee numeric(10,2) DEFAULT 0,
    transport_fee numeric(10,2) DEFAULT 0,
    meal_fee numeric(10,2) DEFAULT 0,
    additional_fees numeric(10,2) DEFAULT 0,
    payment_type character varying(20) DEFAULT 'both'::character varying,
    orphan_discount_percent numeric(5,2) DEFAULT 50.0,
    needy_discount_percent numeric(5,2) DEFAULT 25.0,
    early_payment_discount numeric(5,2) DEFAULT 5.0,
    is_active boolean DEFAULT true,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tuition_fees_v2_additional_fees_check CHECK ((additional_fees >= (0)::numeric)),
    CONSTRAINT tuition_fees_v2_annual_amount_check CHECK ((annual_amount >= (0)::numeric)),
    CONSTRAINT tuition_fees_v2_book_fee_check CHECK ((book_fee >= (0)::numeric)),
    CONSTRAINT tuition_fees_v2_early_payment_discount_check CHECK (((early_payment_discount >= (0)::numeric) AND (early_payment_discount <= (20)::numeric))),
    CONSTRAINT tuition_fees_v2_exam_fee_check CHECK ((exam_fee >= (0)::numeric)),
    CONSTRAINT tuition_fees_v2_meal_fee_check CHECK ((meal_fee >= (0)::numeric)),
    CONSTRAINT tuition_fees_v2_monthly_amount_check CHECK ((monthly_amount >= (0)::numeric)),
    CONSTRAINT tuition_fees_v2_needy_discount_percent_check CHECK (((needy_discount_percent >= (0)::numeric) AND (needy_discount_percent <= (100)::numeric))),
    CONSTRAINT tuition_fees_v2_orphan_discount_percent_check CHECK (((orphan_discount_percent >= (0)::numeric) AND (orphan_discount_percent <= (100)::numeric))),
    CONSTRAINT tuition_fees_v2_payment_type_check CHECK (((payment_type)::text = ANY ((ARRAY['monthly'::character varying, 'annual'::character varying, 'both'::character varying])::text[]))),
    CONSTRAINT tuition_fees_v2_registration_fee_check CHECK ((registration_fee >= (0)::numeric)),
    CONSTRAINT tuition_fees_v2_transport_fee_check CHECK ((transport_fee >= (0)::numeric)),
    CONSTRAINT tuition_fees_v2_uniform_fee_check CHECK ((uniform_fee >= (0)::numeric))
);


ALTER TABLE public.tuition_fees_v2 OWNER TO postgres;

--
-- Name: TABLE tuition_fees_v2; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.tuition_fees_v2 IS 'Frais de scolaritÃ© par classe et annÃ©e scolaire avec support des remises';


--
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_sessions_id_seq OWNER TO postgres;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- Name: v_expenses_by_category; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_expenses_by_category AS
 SELECT c.id AS category_id,
    c.name AS category_name,
    c.color AS category_color,
    c.icon AS category_icon,
    count(e.id) AS expense_count,
    COALESCE(sum(e.amount), (0)::numeric) AS total_amount,
    (to_char(COALESCE(sum(e.amount), (0)::numeric), 'FM999,999,999.00'::text) || ' FG'::text) AS formatted_total_amount
   FROM (public.expense_categories c
     LEFT JOIN public.expenses e ON ((c.id = e.category_id)))
  WHERE (c.is_active = true)
  GROUP BY c.id, c.name, c.color, c.icon
  ORDER BY COALESCE(sum(e.amount), (0)::numeric) DESC;


ALTER VIEW public.v_expenses_by_category OWNER TO postgres;

--
-- Name: v_expenses_dashboard; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_expenses_dashboard AS
 SELECT count(*) AS total_expenses,
    sum(e.amount) AS total_amount,
    (to_char(sum(e.amount), 'FM999,999,999.00'::text) || ' FG'::text) AS formatted_total_amount,
    count(*) FILTER (WHERE ((s.name)::text = 'En attente'::text)) AS pending_count,
    sum(e.amount) FILTER (WHERE ((s.name)::text = 'En attente'::text)) AS pending_amount,
    count(*) FILTER (WHERE ((s.name)::text = 'Valide'::text)) AS approved_count,
    sum(e.amount) FILTER (WHERE ((s.name)::text = 'Valide'::text)) AS approved_amount,
    count(*) FILTER (WHERE ((s.name)::text = 'Paye'::text)) AS paid_count,
    sum(e.amount) FILTER (WHERE ((s.name)::text = 'Paye'::text)) AS paid_amount,
    EXTRACT(year FROM CURRENT_DATE) AS current_year,
    EXTRACT(month FROM CURRENT_DATE) AS current_month
   FROM (public.expenses e
     JOIN public.expense_statuses s ON ((e.status_id = s.id)));


ALTER VIEW public.v_expenses_dashboard OWNER TO postgres;

--
-- Name: v_expenses_detailed; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_expenses_detailed AS
 SELECT e.id,
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
    c.name AS category_name,
    c.color AS category_color,
    c.icon AS category_icon,
    r.name AS responsible_name,
    r.department AS responsible_department,
    s.name AS status_name,
    s.color AS status_color,
    s.icon AS status_icon,
    e.created_at,
    e.updated_at,
    (to_char(e.amount, 'FM999,999,999.00'::text) || ' FG'::text) AS formatted_amount
   FROM (((public.expenses e
     JOIN public.expense_categories c ON ((e.category_id = c.id)))
     LEFT JOIN public.expense_responsibles r ON ((e.responsible_id = r.id)))
     JOIN public.expense_statuses s ON ((e.status_id = s.id)));


ALTER VIEW public.v_expenses_detailed OWNER TO postgres;

--
-- Name: v_financial_flows; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_financial_flows AS
 SELECT 'INCOME'::text AS flow_type,
    'student_payments'::text AS source,
    sp.payment_date AS transaction_date,
    sp.amount,
    sp.payment_type AS category,
    (((s.first_name)::text || ' '::text) || (s.last_name)::text) AS entity_name,
    sp.payment_method,
    sp.created_by AS processed_by
   FROM (public.student_payments sp
     JOIN public.students s ON ((sp.student_id = s.id)))
  WHERE (sp.is_cancelled = false)
UNION ALL
 SELECT 'EXPENSE'::text AS flow_type,
    'expenses'::text AS source,
    e.expense_date AS transaction_date,
    e.amount,
    ec.name AS category,
    e.supplier_name AS entity_name,
    e.payment_method,
    e.responsible_user_name AS processed_by
   FROM (public.expenses e
     JOIN public.expense_categories ec ON ((e.category_id = ec.id)))
UNION ALL
 SELECT 'EXPENSE'::text AS flow_type,
    'salary_payments'::text AS source,
    sal.payment_date AS transaction_date,
    sal.amount,
    'Salaire Personnel'::character varying AS category,
    (((st.first_name)::text || ' '::text) || (st.last_name)::text) AS entity_name,
    sal.payment_method,
    sal.created_by AS processed_by
   FROM ((public.salary_payments_v2 sal
     JOIN public.staff_salaries_v2 ss ON ((sal.staff_salary_id = ss.id)))
     JOIN public.staff st ON ((ss.staff_id = st.id)))
  WHERE ((sal.status)::text = 'completed'::text);


ALTER VIEW public.v_financial_flows OWNER TO postgres;

--
-- Name: v_financial_dashboard; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_financial_dashboard AS
 SELECT date_trunc('month'::text, (transaction_date)::timestamp with time zone) AS period,
    EXTRACT(year FROM transaction_date) AS year,
    EXTRACT(month FROM transaction_date) AS month,
    sum(
        CASE
            WHEN (flow_type = 'INCOME'::text) THEN amount
            ELSE (0)::numeric
        END) AS total_income,
    sum(
        CASE
            WHEN (flow_type = 'EXPENSE'::text) THEN amount
            ELSE (0)::numeric
        END) AS total_expenses,
    sum(
        CASE
            WHEN (flow_type = 'INCOME'::text) THEN amount
            ELSE (- amount)
        END) AS net_flow,
    count(*) AS transaction_count,
    avg(
        CASE
            WHEN (flow_type = 'INCOME'::text) THEN amount
            ELSE NULL::numeric
        END) AS avg_income_transaction,
    avg(
        CASE
            WHEN (flow_type = 'EXPENSE'::text) THEN amount
            ELSE NULL::numeric
        END) AS avg_expense_transaction
   FROM public.v_financial_flows
  GROUP BY (date_trunc('month'::text, (transaction_date)::timestamp with time zone)), (EXTRACT(year FROM transaction_date)), (EXTRACT(month FROM transaction_date))
  ORDER BY (date_trunc('month'::text, (transaction_date)::timestamp with time zone)) DESC;


ALTER VIEW public.v_financial_dashboard OWNER TO postgres;

--
-- Name: v_unified_financial_flows; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_unified_financial_flows AS
 SELECT 'INCOME'::text AS type,
    (sp.amount)::numeric AS amount,
    sp.payment_date AS transaction_date,
    'student_payment'::text AS source,
    EXTRACT(year FROM sp.payment_date) AS year,
    EXTRACT(month FROM sp.payment_date) AS month,
    (((s.first_name)::text || ' '::text) || (s.last_name)::text) AS entity_name,
    sp.payment_type AS category_detail,
    sp.created_at
   FROM (public.student_payments sp
     JOIN public.students s ON ((sp.student_id = s.id)))
  WHERE ((sp.is_cancelled = false) AND (sp.payment_date IS NOT NULL) AND (sp.amount > (0)::numeric))
UNION ALL
 SELECT 'EXPENSE'::text AS type,
    (e.amount)::numeric AS amount,
    e.expense_date AS transaction_date,
    'general_expense'::text AS source,
    EXTRACT(year FROM e.expense_date) AS year,
    EXTRACT(month FROM e.expense_date) AS month,
    COALESCE(e.supplier_name, 'Fournisseur non specifie'::character varying) AS entity_name,
    COALESCE(ec.name, 'Depense generale'::character varying) AS category_detail,
    e.created_at
   FROM (public.expenses e
     LEFT JOIN public.expense_categories ec ON ((e.category_id = ec.id)))
  WHERE ((e.paid_date IS NOT NULL) AND (e.expense_date IS NOT NULL) AND (e.amount > (0)::numeric))
UNION ALL
 SELECT 'EXPENSE'::text AS type,
    (sal.amount)::numeric AS amount,
    sal.payment_date AS transaction_date,
    'staff_salary'::text AS source,
    EXTRACT(year FROM sal.payment_date) AS year,
    EXTRACT(month FROM sal.payment_date) AS month,
    (((st.first_name)::text || ' '::text) || (st.last_name)::text) AS entity_name,
    'Salaire personnel'::character varying AS category_detail,
    sal.created_at
   FROM ((public.salary_payments_v2 sal
     JOIN public.staff_salaries_v2 ss ON ((sal.staff_salary_id = ss.id)))
     JOIN public.staff st ON ((ss.staff_id = st.id)))
  WHERE (((sal.status)::text = 'completed'::text) AND (sal.payment_date IS NOT NULL) AND (sal.amount > (0)::numeric))
UNION ALL
 SELECT mft.type,
    mft.amount,
    mft.transaction_date,
    'manual_transaction'::text AS source,
    EXTRACT(year FROM mft.transaction_date) AS year,
    EXTRACT(month FROM mft.transaction_date) AS month,
    COALESCE(mft.entity_name, 'Transaction manuelle'::character varying) AS entity_name,
    COALESCE(mft.category, 'Injection manuelle'::character varying) AS category_detail,
    mft.created_at
   FROM public.manual_financial_transactions mft
  WHERE ((mft.impact_capital = true) AND (mft.transaction_date IS NOT NULL) AND (mft.amount > (0)::numeric));


ALTER VIEW public.v_unified_financial_flows OWNER TO postgres;

--
-- Name: v_financial_dashboard_live; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_financial_dashboard_live AS
 SELECT COALESCE(sum(
        CASE
            WHEN (type = 'INCOME'::text) THEN amount
            ELSE (0)::numeric
        END), (0)::numeric) AS total_income,
    COALESCE(sum(
        CASE
            WHEN (type = 'EXPENSE'::text) THEN amount
            ELSE (0)::numeric
        END), (0)::numeric) AS total_expenses,
    COALESCE(sum(
        CASE
            WHEN (type = 'INCOME'::text) THEN amount
            ELSE (- amount)
        END), (0)::numeric) AS current_balance,
    COALESCE(sum(
        CASE
            WHEN ((type = 'INCOME'::text) AND (year = EXTRACT(year FROM CURRENT_DATE)) AND (month = EXTRACT(month FROM CURRENT_DATE))) THEN amount
            ELSE (0)::numeric
        END), (0)::numeric) AS monthly_income,
    COALESCE(sum(
        CASE
            WHEN ((type = 'EXPENSE'::text) AND (year = EXTRACT(year FROM CURRENT_DATE)) AND (month = EXTRACT(month FROM CURRENT_DATE))) THEN amount
            ELSE (0)::numeric
        END), (0)::numeric) AS monthly_expenses,
    COALESCE(sum(
        CASE
            WHEN ((type = 'INCOME'::text) AND (((year = EXTRACT(year FROM CURRENT_DATE)) AND (month = (EXTRACT(month FROM CURRENT_DATE) - (1)::numeric))) OR ((year = (EXTRACT(year FROM CURRENT_DATE) - (1)::numeric)) AND (month = (12)::numeric) AND (EXTRACT(month FROM CURRENT_DATE) = (1)::numeric)))) THEN amount
            ELSE (0)::numeric
        END), (0)::numeric) AS prev_monthly_income,
    COALESCE(sum(
        CASE
            WHEN ((type = 'EXPENSE'::text) AND (((year = EXTRACT(year FROM CURRENT_DATE)) AND (month = (EXTRACT(month FROM CURRENT_DATE) - (1)::numeric))) OR ((year = (EXTRACT(year FROM CURRENT_DATE) - (1)::numeric)) AND (month = (12)::numeric) AND (EXTRACT(month FROM CURRENT_DATE) = (1)::numeric)))) THEN amount
            ELSE (0)::numeric
        END), (0)::numeric) AS prev_monthly_expenses,
    count(*) AS total_transactions,
    count(DISTINCT source) AS unique_sources,
    count(DISTINCT entity_name) AS unique_entities,
    count(
        CASE
            WHEN (type = 'INCOME'::text) THEN 1
            ELSE NULL::integer
        END) AS income_transactions,
    count(
        CASE
            WHEN (type = 'EXPENSE'::text) THEN 1
            ELSE NULL::integer
        END) AS expense_transactions,
    COALESCE(avg(
        CASE
            WHEN (type = 'INCOME'::text) THEN amount
            ELSE NULL::numeric
        END), (0)::numeric) AS avg_income_amount,
    COALESCE(avg(
        CASE
            WHEN (type = 'EXPENSE'::text) THEN amount
            ELSE NULL::numeric
        END), (0)::numeric) AS avg_expense_amount,
    COALESCE(max(
        CASE
            WHEN (type = 'INCOME'::text) THEN amount
            ELSE (0)::numeric
        END), (0)::numeric) AS max_income,
    COALESCE(max(
        CASE
            WHEN (type = 'EXPENSE'::text) THEN amount
            ELSE (0)::numeric
        END), (0)::numeric) AS max_expense,
    COALESCE(min(
        CASE
            WHEN (type = 'INCOME'::text) THEN amount
            ELSE (999999999)::numeric
        END), (0)::numeric) AS min_income,
    COALESCE(min(
        CASE
            WHEN (type = 'EXPENSE'::text) THEN amount
            ELSE (999999999)::numeric
        END), (0)::numeric) AS min_expense
   FROM public.v_unified_financial_flows;


ALTER VIEW public.v_financial_dashboard_live OWNER TO postgres;

--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: admin_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN id SET DEFAULT nextval('public.admin_users_id_seq'::regclass);


--
-- Name: financial_capital id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_capital ALTER COLUMN id SET DEFAULT nextval('public.financial_capital_id_seq'::regclass);


--
-- Name: financial_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_categories ALTER COLUMN id SET DEFAULT nextval('public.financial_categories_id_seq'::regclass);


--
-- Name: manual_financial_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manual_financial_transactions ALTER COLUMN id SET DEFAULT nextval('public.manual_financial_transactions_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, user_id, session_id, action, resource, method, endpoint, status_code, success, error_code, request_id, connection_quality, response_time_ms, created_at, client_ip, user_agent, metadata) FROM stdin;
\.


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_users (id, username, email, password_hash, first_name, last_name, role, is_active, last_login, created_at, updated_at, is_first_login, avatar_url, phone, date_of_birth, last_activity) FROM stdin;
3	superadmin	ibrahdiallo022@gmail.com	$2a$12$K0QkSkNYC3ORXhwnBnJR2OlFG4G236AjjuCDFOz2kMHoCvNhNWtzG	Ibrahima	Diallo	super_admin	t	2025-09-06 23:19:28.176275	2025-06-12 00:22:40.994892	2025-07-10 20:38:35.385247	f	/uploads/avatars/avatar-3-1750264885142.png	\N	\N	\N
33	aliou.diallo	ibrahdiallo0002@gmail.com	$2a$12$fCqjy0PolUrrjailF7IPee3C5H3nkhWqHI5jBqruTgpUOpd591uJa	Aliou	DIALLO	admin	t	2025-07-05 12:39:03.852285	2025-07-05 12:18:04.51837	2025-07-05 12:39:03.852285	f	\N	\N	\N	\N
12	alpha.diallo	ibrahdiallo077@gmail.com	$2a$12$qjaAMcJhEr5HjFSE0/GxAuK.Baw5K5.4f.Rp4.m7PReHPUd2SRda2	Alpha	BAH	admin	t	2025-09-03 12:56:10.809478	2025-06-13 22:12:53.998473	2025-08-02 21:25:34.864891	f	/uploads/avatars/avatar-12-1750204104417.png	\N	\N	\N
34	ahmad.barry	ahmad.barry@gmail.com	$2a$12$n6OcFiw3XJbS2DALIhEpWuepRLtoPqobbtOfTIYN6FBCg3elNZTEK	Ahmad	Barry	admin	t	2025-09-05 16:39:11.184099	2025-09-04 16:21:41.793658	2025-09-04 16:22:55.220475	f	\N	\N	\N	\N
\.


--
-- Data for Name: backup_payment_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.backup_payment_schedules (id, student_id, tuition_fee_id, due_month, due_year, amount_due, discount_applied, status, created_at) FROM stdin;
\.


--
-- Data for Name: backup_staff; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.backup_staff (id, staff_number, first_name, last_name, "position", department, email, phone, address, hire_date, status, photo_url, qualifications, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: backup_tuition_fees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.backup_tuition_fees (id, class_id, school_year_id, registration_fee, monthly_amount, annual_amount, additional_fees, payment_type, orphan_discount_percent, needy_discount_percent, created_at) FROM stdin;
\.


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classes (id, name, level, type, description, capacity, teacher_id, teacher_name, is_active, created_at, updated_at, school_year_id, monthly_fee) FROM stdin;
c46c46c8-87f4-4c04-b15a-bad9b0669c79	Mémorisation-2025	intermediaire	coranic	\N	50	fc8f23d3-773e-4f63-9790-ce324d9f04a4	\N	t	2025-07-06 23:38:26.664031+02	2025-07-28 22:02:42.613566+02	b3ac4d8c-55d1-425e-b2c3-d6227db34d3b	800000.00
66c3aa63-dcc1-49f7-85c3-565c105c264d	Major	intermediaire	coranic	\N	25	fc8f23d3-773e-4f63-9790-ce324d9f04a4	\N	t	2025-09-03 12:45:32.987522+02	2025-09-03 12:45:32.987522+02	88382507-3608-4381-a6b5-dfb4efc619fa	25000.00
\.


--
-- Data for Name: expense_budgets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expense_budgets (id, category_id, budget_year, budget_month, allocated_amount, spent_amount, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expense_categories (id, name, name_ar, description, color, icon, is_active, sort_order, created_at, updated_at) FROM stdin;
e071aaf4-7416-4f07-b907-9c5d9a0f417f	Général	\N	Dépenses générales et diverses	#3B82F6	FileText	t	1	2025-08-09 13:41:17.018394	2025-08-09 13:41:17.018394
9ebff6c2-3caa-453e-a0cb-5ca0e5dbaba1	Matériel pédagogique	\N	Livres, cahiers, fournitures scolaires	#10B981	BookOpen	t	2	2025-08-09 13:41:17.034245	2025-08-09 13:41:17.034245
4f57ad89-d96d-4ba0-84b6-5316deacf4c5	Matériel de bureau	\N	Fournitures administratives et équipements	#8B5CF6	Package	t	3	2025-08-09 13:41:17.037545	2025-08-09 13:41:17.037545
e5404e53-8e16-46ae-9934-e952f4e6c751	Transport	\N	Frais de transport et déplacements	#F59E0B	Truck	t	4	2025-08-09 13:41:17.038914	2025-08-09 13:41:17.038914
aef873cd-0e75-4f01-b595-e7fe7fdc7cce	Alimentation	\N	Frais de restauration et alimentation	#EF4444	Coffee	t	5	2025-08-09 13:41:17.040572	2025-08-09 13:41:17.040572
dd673a46-77ad-48ad-ac8b-d307793c27e7	Maintenance	\N	Réparations et maintenance des équipements	#6B7280	Wrench	t	6	2025-08-09 13:41:17.041804	2025-08-09 13:41:17.041804
bba23c30-c8cc-4c96-9441-820d389fc6b1	Électricité	\N	Factures d'électricité et énergie	#F97316	Zap	t	7	2025-08-09 13:41:17.043222	2025-08-09 13:41:17.043222
6c53bc64-705a-49c6-9c63-d13e08f7047a	Eau	\N	Factures d'eau et assainissement	#06B6D4	Droplets	t	8	2025-08-09 13:41:17.047021	2025-08-09 13:41:17.047021
b065dce1-ef42-40b7-bea1-3d84705b4e64	Communication	\N	Téléphone, internet, frais de communication	#84CC16	Phone	t	9	2025-08-09 13:41:17.050023	2025-08-09 13:41:17.050023
6de77ec3-7e37-4419-b171-2e2000b007d2	Formation	\N	Formation du personnel et développement	#EC4899	GraduationCap	t	10	2025-08-09 13:41:17.055705	2025-08-09 13:41:17.055705
\.


--
-- Data for Name: expense_responsibles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expense_responsibles (id, name, department, "position", email, phone, is_active, created_at, updated_at) FROM stdin;
ea67e21a-e569-45b2-9f76-c0a05dcd870f	Directeur Général	Direction	Directeur Général	directeur@markaz-ubayd.com	+224 XXX XXX XXX	t	2025-08-09 13:41:17.078614	2025-08-09 13:41:17.078614
aa68c4d7-3d6d-4406-a58f-81e6bb3dd206	Responsable Financier	Finance	Chef Comptable	finance@markaz-ubayd.com	+224 XXX XXX XXX	t	2025-08-09 13:41:17.083877	2025-08-09 13:41:17.083877
a946406d-22d0-4541-a64a-87e4fb133f52	Responsable Pédagogique	Pédagogie	Coordinateur Pédagogique	pedagogie@markaz-ubayd.com	+224 XXX XXX XXX	t	2025-08-09 13:41:17.087887	2025-08-09 13:41:17.087887
ac5484c3-c5b7-4091-8f3c-1836934d370f	Responsable Administratif	Administration	Chef Administration	admin@markaz-ubayd.com	+224 XXX XXX XXX	t	2025-08-09 13:41:17.089464	2025-08-09 13:41:17.089464
1ea82809-fb47-410a-808b-58f508f38d25	Responsable Maintenance	Technique	Chef Maintenance	maintenance@markaz-ubayd.com	+224 XXX XXX XXX	t	2025-08-09 13:41:17.092235	2025-08-09 13:41:17.092235
d05c5bfa-bd9a-4681-aaea-769108754683	Secrétaire Général	Secrétariat	Secrétaire Général	secretariat@markaz-ubayd.com	+224 XXX XXX XXX	t	2025-08-09 13:41:17.095082	2025-08-09 13:41:17.095082
\.


--
-- Data for Name: expense_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expense_status_history (id, expense_id, old_status_id, new_status_id, changed_by, change_reason, changed_at) FROM stdin;
\.


--
-- Data for Name: expense_statuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expense_statuses (id, name, name_ar, color, icon, description, is_final, sort_order, created_at) FROM stdin;
507f35e0-8526-4320-b192-630799db5818	En attente	\N	#F59E0B	Clock	En attente de validation	f	1	2025-08-09 13:41:17.060461
576378d5-50d8-4c44-a8ef-45ae32c6aa15	Approuvé	\N	#3B82F6	CheckCircle2	Approuvé, en attente de paiement	f	2	2025-08-09 13:41:17.06479
2c9d5d61-2631-4d4f-a403-60f4c8a69e26	Payé	\N	#10B981	CheckCircle	Payé avec succès	t	3	2025-08-09 13:41:17.069191
d916aa10-fdee-4a53-a047-bc19d05a719e	Rejeté	\N	#EF4444	XCircle	Rejeté ou refusé	t	4	2025-08-09 13:41:17.072533
d4a44b76-d099-49ac-b164-3ac5eb984d16	Annulé	\N	#6B7280	Ban	Annulé par l'utilisateur	t	5	2025-08-09 13:41:17.074215
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, reference, description, amount, category_id, responsible_id, status_id, expense_date, due_date, paid_date, payment_method, payment_reference, supplier_name, supplier_contact, invoice_number, receipt_url, notes, budget_year, budget_month, created_by, updated_by, created_at, updated_at, responsible_user_id, responsible_user_name, responsible_user_role) FROM stdin;
9739b82e-77cd-4a03-a332-6e5c975b8a8b	DEP-2025-008	Location Voiture de service	1100000.00	e5404e53-8e16-46ae-9934-e952f4e6c751	d05c5bfa-bd9a-4681-aaea-769108754683	2c9d5d61-2631-4d4f-a403-60f4c8a69e26	2025-08-11	\N	2025-08-11	cash	\N	\N	\N	\N	\N	\N	2025	8	3	3	2025-08-11 12:56:33.112634	2025-08-11 15:09:50.252932	3	Ibrahima Diallo	super_admin
91d65c6e-9078-4cb6-aa78-54183ce5d96a	DEP-2025-009	Achat des chaussures	100000.00	e071aaf4-7416-4f07-b907-9c5d9a0f417f	\N	2c9d5d61-2631-4d4f-a403-60f4c8a69e26	2025-08-12	\N	2025-08-12	card	\N	Madina	\N	\N	\N	Pour les enfants de moins 17 ans	2025	8	12	3	2025-08-12 14:33:56.950596	2025-08-12 20:30:00.835102	12	Alpha BAH	admin
19048ba2-9ab7-4d2d-add0-d573e244ae7f	DEP-2025-007	Achat Coran	300000.00	6de77ec3-7e37-4419-b171-2e2000b007d2	a946406d-22d0-4541-a64a-87e4fb133f52	2c9d5d61-2631-4d4f-a403-60f4c8a69e26	2025-08-10	\N	2025-08-12	cash	\N	Mosquée des Uliss	\N	\N	\N	\N	2025	8	3	3	2025-08-10 14:29:04.971357	2025-08-12 20:30:36.369387	3	Ibrahima Diallo	super_admin
125fecf0-bbd0-41e5-906b-03418e078f72	DEP-2025-010	Achat Moto	1000000.00	e5404e53-8e16-46ae-9934-e952f4e6c751	\N	2c9d5d61-2631-4d4f-a403-60f4c8a69e26	2025-08-13	\N	2025-08-13	bank_transfer	\N	\N	\N	\N	\N	\N	2025	8	3	3	2025-08-13 13:58:32.73639	2025-08-13 13:59:21.112084	3	Ibrahima Diallo	super_admin
4a831cbe-094c-46e7-85cf-de84d9e62a88	DEP-2025-012	Achat Internet	4000000.00	dd673a46-77ad-48ad-ac8b-d307793c27e7	\N	2c9d5d61-2631-4d4f-a403-60f4c8a69e26	2025-08-18	\N	2025-08-18	mobile_money	\N	NAFA	\N	\N	\N	\N	2025	8	3	3	2025-08-18 21:01:31.324393	2025-08-18 21:02:28.779174	3	Ibrahima Diallo	super_admin
bb0d975d-c16d-4aac-9f14-f4a83f88d716	DEP-2025-013	Frais des Cérémonies	900000.00	b065dce1-ef42-40b7-bea1-3d84705b4e64	\N	2c9d5d61-2631-4d4f-a403-60f4c8a69e26	2025-09-03	\N	2025-09-03	bank_transfer	\N	\N	\N	\N	\N	\N	2025	9	12	3	2025-09-03 12:42:33.269306	2025-09-03 12:56:59.000585	12	Alpha BAH	admin
0ace0b72-0410-4d53-9b8b-226cb1b0aade	DEP-2025-014	Visite des parents	100001.00	e5404e53-8e16-46ae-9934-e952f4e6c751	\N	2c9d5d61-2631-4d4f-a403-60f4c8a69e26	2025-09-04	\N	2025-09-04	cash	\N	\N	\N	\N	\N	\N	2025	9	3	3	2025-09-04 15:58:54.369504	2025-09-04 15:59:19.974411	3	Ibrahima Diallo	super_admin
\.


--
-- Data for Name: financial_capital; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.financial_capital (id, current_balance, total_income, total_expenses, monthly_income, monthly_expenses, last_updated, updated_by, notes) FROM stdin;
18	9999999.00	25400001.00	15400002.00	800000.00	5900001.00	2025-09-04 15:59:19.974411	\N	\N
\.


--
-- Data for Name: financial_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.financial_categories (id, name, type, color, icon, monthly_budget, is_active, created_at) FROM stdin;
1	Frais de Scolarite	INCOME	#10B981	money	5000000.00	t	2025-08-16 00:51:35.626003
2	Frais Inscription	INCOME	#059669	money	1000000.00	t	2025-08-16 00:51:35.626003
3	Frais Examen	INCOME	#0891B2	money	500000.00	t	2025-08-16 00:51:35.626003
4	Services Annexes	INCOME	#0284C7	money	300000.00	t	2025-08-16 00:51:35.626003
5	Subventions	INCOME	#3B82F6	money	2000000.00	t	2025-08-16 00:51:35.626003
6	Salaires Personnel	EXPENSE	#EF4444	money	3000000.00	t	2025-08-16 00:51:35.626003
7	Charges Fixes	EXPENSE	#DC2626	money	800000.00	t	2025-08-16 00:51:35.626003
8	Fournitures Pedagogiques	EXPENSE	#B91C1C	money	500000.00	t	2025-08-16 00:51:35.626003
9	Maintenance	EXPENSE	#991B1B	money	400000.00	t	2025-08-16 00:51:35.626003
10	Transport	EXPENSE	#F97316	money	300000.00	t	2025-08-16 00:51:35.626003
11	Autres Depenses	EXPENSE	#EA580C	money	200000.00	t	2025-08-16 00:51:35.626003
\.


--
-- Data for Name: guardians; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guardians (id, student_id, first_name, last_name, phone, email, address, relationship, is_primary, created_at, updated_at) FROM stdin;
ab99416c-ea90-4514-9dd7-83272604cde3	8a22f989-4817-49e3-85f2-a9d3fab1e0fd	Amadou	DIALLO	628454902	ibrahdiallo022@gmail.com	\N	pere	t	2025-06-26 21:50:11.624348+02	2025-06-26 21:50:11.624348+02
fb56060b-cb0c-40a6-94b5-34816dead7b2	76fb1427-690e-482d-aedd-ced88db27a5e	Alpha	DIALLO	344377333	ibrahdiallo022@gmail.com	\N	pere	t	2025-07-07 16:12:05.695711+02	2025-07-07 16:12:05.695711+02
4ed441d5-713d-4e3b-b27a-8f4583ae3828	6c2ca318-dbf5-4c23-97ec-10946eabac3b	Oumar	DIALLO	27882020	oumar@gmail.com	\N	pere	t	2025-07-11 20:54:36.763356+02	2025-07-11 20:54:36.763356+02
604a204c-b0ea-4662-8f90-77ed69ffc0e3	aa073390-e492-46ed-a101-4050e01433f2	Alimou	DIALLO	27882020	aliou@gmail.com	Dubréka	pere	t	2025-07-12 10:46:16.56175+02	2025-07-12 10:46:16.56175+02
ff68cf34-2954-418f-b06f-3d3534dc1650	601561c4-bf9f-4fbc-baaf-600ec8773778	Oumar	Camara	342342772	oumar@gmail.com	Koza	oncle	t	2025-07-11 23:57:47.253464+02	2025-07-13 17:49:02.343339+02
0aa9d5db-3413-418a-8fa2-833e3fad9c70	fc447163-b36b-45c0-ad10-a8d92ff56e24	Safiatou	BAH	622123456	safia@gmail.com	\N	mere	t	2025-07-13 21:35:03.766167+02	2025-07-13 21:35:03.766167+02
b62dab8d-8d8b-4f11-bc08-90fd1f3debd7	d82b77e2-9ed2-4d89-9580-3aae98989a19	Ahmad	DIALLO	622132345	ibrahdiallo022@gmail.com	\N	oncle	t	2025-07-14 16:51:21.884244+02	2025-07-14 16:51:21.884244+02
ec499158-a06e-4764-beb0-32b5d1cd1138	dc472bb9-1589-4770-8733-c9f02604bc5f	Mouctar	BAH	621456789	mouctar@gmail.com	\N	tuteur_legal	t	2025-08-25 22:58:37.649931+02	2025-09-03 12:19:23.119293+02
2ce96866-92fe-42e1-8583-a8ef3a114696	53fca257-e401-4ef3-b52c-62f0ffc72025	Aliou	DIALLO	27882020	ibrahdiallo022@gmail.com	\N	pere	t	2025-07-10 20:47:32.122235+02	2025-09-03 12:21:33.178458+02
07b544cc-7e60-4707-a00e-7b91d3b3e1ed	f91bb3d8-127b-422e-8131-ab2e20860697	Mariama	DIALLO	623145678	mariama@gmail.com	Sonfonia	soeur	t	2025-07-14 17:14:48.515665+02	2025-09-03 12:22:02.792808+02
35ca7ae5-74e3-4f8e-a903-0b8050047a66	7907c3a0-60cf-4aa3-880f-0df83f526d0b	Ibrahima	DIALLO	624567896	samir@gmail.com	Koloma	pere	t	2025-09-03 12:49:36.536483+02	2025-09-03 12:50:08.073593+02
69d0ef7b-09a2-4d58-85f8-dccb3a2b7364	3d96b25e-7f49-4047-8296-6ccaaf318320	Hawawou	BAH	622123456	aliou@gmail.com	Cobayah	mere	t	2025-07-12 17:36:54.631494+02	2025-09-04 12:54:48.704906+02
316f5f16-6981-41fe-bc08-6a0e9e732245	a6232bb6-485c-49d3-8680-34e8990b5929	Alimou	DIALLO	622134564	alimou@gmail.com	Sonfonia	pere	t	2025-07-17 00:05:11.977098+02	2025-09-04 14:20:30.080622+02
\.


--
-- Data for Name: manual_financial_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.manual_financial_transactions (id, reference, type, category, amount, description, transaction_date, payment_method, notes, entity_name, created_by, created_at, updated_at, status, impact_capital, metadata) FROM stdin;
1	INJ-INCOME-1755348413379	INCOME	Revenus divers	700001.00	Donation	2025-08-16	cash	\N	ALpha	3	2025-08-16 14:46:53.383345	2025-08-16 14:46:53.383345	completed	t	{"injected_by": "superadmin", "injection_date": "2025-08-16T12:46:53.401Z", "manual_transaction": true}
2	INJ-INCOME-1755428672308	INCOME	Capital initial	20000000.00	Capital initial de l'école	2025-08-17	manual_injection	\N	Administration	3	2025-08-17 13:04:32.308723	2025-08-17 13:04:32.308723	completed	t	{"injected_by": "superadmin", "injection_date": "2025-08-17T11:04:32.311Z", "manual_transaction": true}
3	INJ-EXPENSE-1755803446615	EXPENSE	autres_depenses	400001.00	Achat des meubles	2025-08-21	cash		Alpha	3	2025-08-21 21:10:46.63551	2025-08-21 21:10:46.63551	completed	t	\N
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, title, message, type, priority, created_at, due_date, reminder_date, is_read, is_active, is_reminder_sent, user_id, category, related_entity_type, related_entity_id, metadata, created_by, updated_at, updated_by) FROM stdin;
ed57e75b-0d2a-49c3-a3e6-5c0717a7bdbe	Maintenance programmee	Une maintenance du systeme est prevue ce week-end. L acces pourra etre temporairement interrompu.	info	low	2025-08-19 11:51:48.62819+02	\N	\N	t	t	f	\N	system	\N	\N	{}	3	2025-08-19 20:52:26.866113+02	3
310301d7-a1ac-44e5-b474-5810413d41fa	Validation des depenses en attente	Il y a des depenses en attente de validation pour un montant important	warning	high	2025-08-19 11:51:48.540846+02	2025-08-21 11:51:48.540846+02	2025-08-20 11:51:48.540846+02	t	f	f	3	expense	\N	\N	{}	3	2025-08-19 20:52:44.940205+02	3
d78d84ae-cfd8-489f-8b23-581d155f1a34	Rapport mensuel genere	Le rapport financier de Janvier 2025 a ete genere avec succes et est disponible pour telechargement.	success	low	2025-08-19 11:51:48.633523+02	\N	\N	t	f	f	3	general	\N	\N	{}	3	2025-08-19 22:23:02.917387+02	3
1a575082-8224-4969-92c8-3442ba6d9774	Préparation du budget	Budget de l'année 2040	reminder	medium	2025-08-21 00:19:21.887339+02	2025-08-30 00:17:00+02	2025-08-28 22:17:00+02	t	t	f	\N	expense	\N	\N	{}	3	2025-08-21 00:19:50.813354+02	3
e6082b61-f43a-4e95-9664-5daa526776ac	Budget mensuel depasse	Le budget des depenses pour le mois de Janvier a ete depasse de 15%. Action requise immediatement.	error	urgent	2025-08-19 11:51:48.631396+02	2025-08-20 11:51:48.631396+02	2025-08-19 15:51:48.631396+02	t	f	f	3	expense	\N	\N	{}	3	2025-08-21 00:22:01.399029+02	3
abf7c306-874e-461e-8618-b6f61f0707a1	Mettre à jour les depenses	Mise à jour des dépenses du mois de septembre	reminder	high	2025-08-21 21:25:45.229476+02	2025-08-24 21:25:00+02	2025-08-22 19:25:00+02	t	t	f	\N	expense	\N	\N	{}	12	2025-08-21 21:26:19.035676+02	12
375f11a5-b664-45ac-97d2-d2ae9dd3a354	Rappel de paiement - Classe 6eme A	Les frais de scolarite du mois de Janvier sont dus. Plusieurs eleves n ont pas encore paye.	reminder	medium	2025-08-19 11:51:48.622423+02	2025-08-26 11:51:48.622423+02	2025-08-22 11:51:48.622423+02	t	f	f	3	payment	\N	\N	{}	12	2025-08-21 23:13:21.936688+02	3
574b2e7a-546c-48c7-a546-21c4b1b9e3c5	Réunion d'information	Nous avons une réunion pour définir le budget de 2025	reminder	high	2025-08-21 23:15:35.384914+02	2025-08-23 23:14:00+02	2025-08-22 21:14:00+02	t	t	f	\N	general	\N	\N	{}	3	2025-08-21 23:17:32.842162+02	12
42e35c25-0a99-40e2-851f-8c86b7a08442	Rencontre des parents	Information des parents	info	high	2025-08-21 23:36:48.825863+02	2025-08-24 23:36:00+02	2025-08-23 21:36:00+02	t	t	f	12	general	\N	\N	{}	12	2025-08-21 23:37:02.707406+02	12
099b8061-8fdc-46fe-bdfe-529b566ffc3a	Céremonie	Organisation cérémonie d'ouverture	reminder	urgent	2025-09-03 12:44:06.370688+02	2025-09-08 12:43:00+02	2025-09-07 10:43:00+02	t	t	f	12	general	\N	\N	{}	12	2025-09-03 12:56:00.746274+02	12
7b200c35-29fc-463b-a99d-2a80eda41751	Application Abdalla	Déploiement de l'appli en Septembre	reminder	high	2025-08-31 13:53:57.205012+02	2025-09-04 13:53:00+02	2025-09-03 13:53:00+02	t	f	f	3	system	\N	\N	{}	3	2025-09-03 12:57:21.402922+02	3
32a628c3-5e0b-4217-b10c-cf7e725ca9bf	Paiement des salaires	Paiament des salaires à partir de sepetembre	reminder	high	2025-09-06 20:18:31.443295+02	2025-09-10 20:18:00+02	2025-09-09 18:18:00+02	t	t	f	3	payment	\N	\N	{}	3	2025-09-06 20:19:12.338835+02	3
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (id, user_id, token, expires_at, used, used_at, ip_address, user_agent, created_at) FROM stdin;
9	12	a69c1c09dae7093d69c2b76040a81959a3b221637ff9a33488716c39d843c2a7	2025-06-14 22:12:54.316+02	t	2025-06-14 16:53:09.886605+02	\N	\N	2025-06-13 22:12:53.998473+02
10	3	1eeab1542036252dc12e63949713ff6bac00bb8ddf6d205ccc8f00f9012bd477	2025-06-15 16:52:22.901+02	t	2025-06-14 16:55:33.34537+02	\N	\N	2025-06-14 16:52:22.894231+02
11	12	a16df9d32fc5e130690cf21a1a27da04315366f34fc03af7c75c3b65de8310bb	2025-06-15 16:53:09.896+02	t	2025-06-14 16:57:11.068488+02	\N	\N	2025-06-14 16:53:09.886605+02
59	33	25627f256a8e099d27b1b1f572119c6abfed848468852b4685fca9bd090c2c3e	2025-07-06 12:18:07.865+02	t	2025-07-05 12:37:15.379375+02	\N	\N	2025-07-05 12:18:04.51837+02
60	33	679deae96065fa94c5e186d7dbd6f8d52c86e64dcd36ec78d7970d89d89f258e	2025-07-06 12:37:15.396+02	t	2025-07-05 12:38:10.049366+02	\N	\N	2025-07-05 12:37:15.379375+02
61	34	954fac68c386b811a9f55bf08ba50e4a7131e8c45aec01bc2e0ce11970894daa	2025-09-05 16:21:44.54+02	t	2025-09-04 16:22:27.759699+02	\N	\N	2025-09-04 16:21:41.793658+02
62	34	400b35caec58a157218ebbf6b38ff80c08f712ac2f9f78d2376ddc644d6ae187	2025-09-05 16:22:27.767+02	t	2025-09-04 16:22:55.220475+02	\N	\N	2025-09-04 16:22:27.759699+02
\.


--
-- Data for Name: previous_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.previous_data (year, month, period, period_name, student_payments_total, expenses_total, salary_payments_total, manual_income_total, manual_expense_total, total_income, total_expenses, net_flow, total_transactions, income_transactions, expense_transactions, avg_income_amount, avg_expense_amount) FROM stdin;
2025	7	2025-07	July      2025	2400000.00	0	0	0	0	2400000.00	0	2400000.00	3	3	0	800000.000000000000	\N
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, user_id, token_hash, expires_at, connection_quality, remember_me, created_at, last_used_at, client_ip, user_agent, device_fingerprint, is_revoked, revoked_at, revoked_reason) FROM stdin;
67	33	c4037a3bfed075a10a83a1d9e27a87c3aac894d692f765e53e52f10c93b03ac8	2025-07-06 12:39:03.865+02	stable	f	2025-07-05 12:39:03.852285+02	2025-07-05 12:39:03.852285+02	\N	\N	\N	f	\N	\N
139	12	ecd9574e00ac475a8466a074c9a4d78bd13d16f617b804b2d5e6aa856b2bcad5	2025-09-10 11:42:27.104+02	stable	f	2025-09-03 11:42:27.04763+02	2025-09-03 11:42:27.04763+02	\N	\N	\N	f	\N	\N
141	34	4c537538d9e4b58926dadeb010ac8b8c66f2281c65ec49361f32949a804f7d4a	2025-09-11 16:23:53.326+02	stable	f	2025-09-04 16:23:53.291657+02	2025-09-04 16:23:53.291657+02	\N	\N	\N	f	\N	\N
145	3	2c62dcc15ef3a3cfbe548fad63fcc7395065b866dd144e0e6e53d8c8c2cc5151	2025-09-13 15:33:27.368+02	stable	f	2025-09-06 15:33:27.345428+02	2025-09-06 15:33:27.345428+02	\N	\N	\N	f	\N	\N
\.


--
-- Data for Name: salary_payments_v2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.salary_payments_v2 (id, staff_salary_id, payment_type, amount, start_month, end_month, payment_year, months_covered, payment_date, payment_method, reference_number, paid_by, status, is_advance, advance_deducted_from, notes, created_at, created_by, payment_status, gross_amount, net_amount, tax_amount, bonus_amount, deduction_amount, payment_period, payment_month, receipt_number) FROM stdin;
2ed374fe-874b-4bed-9772-816781e78c94	c1f52001-cc04-4b5c-8f4d-f0bf4f1f047d	monthly	900000.00	\N	\N	2024	1	2025-08-02	cash	\N	\N	completed	f	\N	\N	2025-08-02 12:35:35.293327+02	jwt-error	completed	900000.00	900000.00	0.00	0.00	0.00	\N	8	SAL-MON-202508-0001
0a6e2c79-23c6-4e2f-9c1e-5120e42c0dff	952fb719-48c6-4184-940c-4e4b09b2c3b2	monthly	800000.00	\N	\N	2024	1	2025-08-02	cash	\N	\N	completed	f	\N	\N	2025-08-02 12:56:51.669607+02	jwt-error	completed	800000.00	800000.00	0.00	0.00	0.00	\N	8	SAL-MON-202508-0002
91b0e634-c261-4627-901a-bc45f0de6dfc	fd91d539-d9cf-46ac-87f5-150e72187246	monthly	900000.00	\N	\N	2025	1	2025-08-14	cash	\N	\N	completed	f	\N	\N	2025-08-15 00:20:41.507545+02	superadmin	completed	900000.00	900000.00	0.00	0.00	0.00	\N	8	SAL-MON-202508-0003
5d867c15-6a83-4181-8415-831ea21ec3e6	fd91d539-d9cf-46ac-87f5-150e72187246	monthly	900000.00	\N	\N	2025	1	2025-09-03	cash	\N	\N	completed	f	\N	\N	2025-09-03 12:40:05.225682+02	alpha.diallo	completed	900000.00	900000.00	0.00	0.00	0.00	\N	9	SAL-MON-202509-0001
13bc010a-107c-4faf-b13f-2e48fd7cee1a	cd3c665d-3a6c-4446-9d11-d54249a235fe	monthly	4000000.00	\N	\N	2025	1	2025-09-04	cash	\N	\N	completed	f	\N	\N	2025-09-04 15:40:33.327725+02	superadmin	completed	4000000.00	4000000.00	0.00	0.00	0.00	\N	9	SAL-MON-202509-0002
\.


--
-- Data for Name: sample_class_id; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sample_class_id (id) FROM stdin;
55b10c83-6b10-4efe-bbce-8a4a3c4ee318
\.


--
-- Data for Name: sample_school_year_id; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sample_school_year_id (id) FROM stdin;
024b4f22-6eb2-4ef7-beb7-150f69f2ac41
\.


--
-- Data for Name: school_years; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.school_years (id, name, start_date, end_date, is_current, description, created_at, updated_at) FROM stdin;
024b4f22-6eb2-4ef7-beb7-150f69f2ac41	2024-2025	2024-09-01	2025-06-30	t	Annee scolaire courante 2024-2025	2025-06-19 01:14:59.890675+02	2025-06-19 01:14:59.890675+02
b3ac4d8c-55d1-425e-b2c3-d6227db34d3b	2025-2026	2025-09-01	2026-06-30	f	\N	2025-07-14 19:29:48.383075+02	2025-07-14 19:29:48.383075+02
88382507-3608-4381-a6b5-dfb4efc619fa	2026-2027	2026-09-01	2027-06-30	f	Année scolaire 2026-2027 - Planification future	2025-09-03 12:39:00.337243+02	2025-09-03 12:39:00.337243+02
\.


--
-- Data for Name: staff; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff (staff_number, first_name, last_name, "position", department, email, phone, address, hire_date, status, photo_url, qualifications, notes, created_at, updated_at, id, date_of_birth, gender, nationality, emergency_contact, emergency_phone, bank_account, payment_method, contract_type, employment_type, salary) FROM stdin;
TEA-2025-001	Ibrahima	DIALLO	teacher	education	ibrahdiallo@gmail.com	0022442312	Kaloum	2025-07-01	active	\N	\N	\N	2025-07-01 03:30:16.315714	2025-07-01 03:30:16.315714	a06ca7f3-0327-42c1-8e7f-6bc578323d41	1997-07-10	male	\N	\N	\N	\N	\N	\N	full_time	100000.00
TEA-2025-003	Mamadou	BAH	teacher	education	ibrah022@gmail.com	27822782	Sonfonia	2025-07-14	active	\N	\N	\N	2025-07-14 19:27:27.103051	2025-07-14 19:27:27.103051	fc8f23d3-773e-4f63-9790-ce324d9f04a4	2001-07-14	male	\N	\N	\N	\N	\N	\N	full_time	100000.00
SEC-2025-001	Oumar	BAH	secretary	administration	oumar@gmail.com	621546788	Kaloum	2025-07-28	active	\N	\N	\N	2025-07-28 22:00:33.023125	2025-07-28 22:00:33.023125	9849fb51-6dcf-4a9f-adb3-51a6fecfe341	2001-07-28	male	\N	\N	\N	\N	\N	\N	full_time	700000.00
COO-2025-001	Salim	BAH	cook	food_service	salim@gmail.com	622123469	Simbaya	2025-09-03	active	\N	Diplôme Bac	\N	2025-09-04 15:28:11.677415	2025-09-04 15:39:06.555425	fa5b0f98-6bba-4976-b4c4-970b3b7ce59b	2001-09-03	male	\N	\N	\N	\N	\N	\N	full_time	800000.00
\.


--
-- Data for Name: staff_salaries_v2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff_salaries_v2 (id, school_year_id, monthly_salary, effective_date, bonus_percent, deduction_percent, is_active, notes, created_at, updated_at, staff_id, salary_type, currency, payment_frequency) FROM stdin;
c1f52001-cc04-4b5c-8f4d-f0bf4f1f047d	\N	900000.00	2025-08-02	0.00	5.00	t	Configuration temporaire créée automatiquement	2025-08-02 12:35:35.238613+02	2025-08-02 12:35:35.238613+02	a06ca7f3-0327-42c1-8e7f-6bc578323d41	monthly	GNF	monthly
fd91d539-d9cf-46ac-87f5-150e72187246	\N	900000.00	2025-08-02	0.00	5.00	t	Configuration temporaire créée automatiquement	2025-08-02 12:47:48.745928+02	2025-08-02 12:47:48.745928+02	9849fb51-6dcf-4a9f-adb3-51a6fecfe341	monthly	GNF	monthly
952fb719-48c6-4184-940c-4e4b09b2c3b2	\N	800000.00	2025-08-02	0.00	5.00	t	Configuration temporaire créée automatiquement	2025-08-02 12:56:51.631247+02	2025-08-02 12:56:51.631247+02	fc8f23d3-773e-4f63-9790-ce324d9f04a4	monthly	GNF	monthly
cd3c665d-3a6c-4446-9d11-d54249a235fe	\N	4000000.00	2025-09-04	0.00	5.00	t	Configuration temporaire créée automatiquement	2025-09-04 15:40:33.2868+02	2025-09-04 15:40:33.2868+02	fa5b0f98-6bba-4976-b4c4-970b3b7ce59b	monthly	GNF	monthly
\.


--
-- Data for Name: student_academic_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_academic_progress (id, student_id, school_year_id, class_id, evaluation_date, evaluation_month, evaluation_year, current_sourate, sourate_number, current_jouzou, current_hizb, pages_memorized, verses_memorized, memorization_status, memorization_grade, recitation_grade, tajwid_grade, behavior_grade, overall_grade, attendance_rate, sourates_completed_this_month, pages_learned_this_month, teacher_comment, student_behavior, next_month_objective, difficulties, strengths, evaluated_by, is_validated, created_at, updated_at) FROM stdin;
c9e5679e-63e0-4420-8f63-3f5f23830827	d82b77e2-9ed2-4d89-9580-3aae98989a19	024b4f22-6eb2-4ef7-beb7-150f69f2ac41	c46c46c8-87f4-4c04-b15a-bad9b0669c79	2025-09-02	9	2025	Ar-Rad	13	12	1	10	43	en_cours	18.00	14.00	12.00	18.00	15.50	100	0	0	bien	bon	\N	\N	\N	\N	f	2025-09-02 22:21:17.617569+02	2025-09-02 22:21:17.617569+02
dec5420d-a227-40a3-bbbe-fd91158e3475	53fca257-e401-4ef3-b52c-62f0ffc72025	024b4f22-6eb2-4ef7-beb7-150f69f2ac41	\N	2025-09-02	9	2025	An-Nisa	4	1	2	10	176	en_cours	14.00	14.00	12.00	18.00	14.50	90	0	0	bon	moyen	Tajwid	Prononciation	mémorisation	\N	f	2025-09-02 17:08:45.229456+02	2025-09-03 12:18:09.725813+02
67eead75-d980-49af-b9cb-d4eebbbbe616	f91bb3d8-127b-422e-8131-ab2e20860697	024b4f22-6eb2-4ef7-beb7-150f69f2ac41	c46c46c8-87f4-4c04-b15a-bad9b0669c79	2025-09-03	9	2025	Yunus	10	2	12	10	109	en_cours	17.00	18.00	12.00	18.00	16.25	100	0	0	Très bien	bon	Finir la sourate	Tajwid	Hifz	\N	f	2025-09-03 22:42:56.406277+02	2025-09-03 22:42:56.406277+02
98eca6cb-a186-453a-8339-4fe495d6f6ab	6c2ca318-dbf5-4c23-97ec-10946eabac3b	024b4f22-6eb2-4ef7-beb7-150f69f2ac41	c46c46c8-87f4-4c04-b15a-bad9b0669c79	2025-09-01	9	2025	Al-Imran	3	2	1	4	200	en_cours	18.00	\N	\N	\N	18.00	100	0	0	un bon élève	bon	\N	\N	\N	\N	f	2025-09-01 13:42:16.49779+02	2025-09-03 23:06:28.886328+02
\.


--
-- Data for Name: student_payment_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_payment_schedules (id, student_id, tuition_fee_id, due_month, due_year, due_date, base_amount, discount_applied, penalty_amount, final_amount, amount_paid, status, overdue_days, reminder_sent, reminder_count, last_reminder_date, sms_sent, email_sent, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: student_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_payments (id, student_id, payment_schedule_id, amount, payment_date, payment_method, payment_type, receipt_number, reference_number, transaction_id, received_by, validated_by, guardian_signature, receipt_printed, receipt_sent_sms, receipt_sent_email, notes, is_cancelled, cancelled_reason, cancelled_by, cancelled_at, created_at, created_by, paid_by, payment_month, payment_year, number_of_months, amount_due) FROM stdin;
2d307317-b129-4e98-8b8b-59d25e9dfbec	6c2ca318-dbf5-4c23-97ec-10946eabac3b	\N	800000.00	2025-07-26	cash	tuition_monthly	REC-202507-0001	REC-202507-0929	TXN-1753540396893	authenticated-user	\N	f	f	f	f	\N	f	\N	\N	\N	2025-07-26 16:33:17.163656+02	authenticated-user	Oumar DIALLO	7	2025	1	800000.00
8a3da637-d66b-45ca-94b4-ef7a9ef543ff	3d96b25e-7f49-4047-8296-6ccaaf318320	\N	700000.00	2025-07-26	bank_transfer	tuition_monthly	REC-202507-0002	REC-202507-1595	TXN-1753540644459	authenticated-user	\N	f	f	f	f	\N	f	\N	\N	\N	2025-07-26 16:37:24.725398+02	authenticated-user	Hawawou BAH	7	2025	1	800000.00
fc340599-cd9e-4041-af88-9eaa00ffc71a	a6232bb6-485c-49d3-8680-34e8990b5929	\N	900000.00	2025-07-26	card	tuition_monthly	REC-202507-0003	REC-202507-9846	TXN-1753540778562	authenticated-user	\N	f	f	f	f	\N	f	\N	\N	\N	2025-07-26 16:39:38.815777+02	authenticated-user	Alimou DIALLO	7	2025	1	800000.00
da2a23ad-94fa-43d9-a032-5dc53f8b98e6	53fca257-e401-4ef3-b52c-62f0ffc72025	\N	700000.00	2025-08-15	bank_transfer	tuition_monthly	REC-202508-0001	REC-202508-3027	TXN-1755252147661	authenticated-user	\N	f	f	f	f	\N	f	\N	\N	\N	2025-08-15 12:02:28.16286+02	authenticated-user	Aliou DIALLO	8	2025	1	500000.00
7171e481-e742-4d2d-97d5-bbcc6eb951de	dc472bb9-1589-4770-8733-c9f02604bc5f	\N	800000.00	2025-08-25	bank_transfer	tuition_monthly	REC-202508-0002	REC-202508-5662	TXN-1756155703528	authenticated-user	\N	f	f	f	f	\N	f	\N	\N	\N	2025-08-25 23:01:43.804515+02	authenticated-user	Mouctar BAH	8	2025	1	800000.00
c3826c2c-08a9-40d9-bff7-94a18cd63d01	7907c3a0-60cf-4aa3-880f-0df83f526d0b	\N	100000.00	2025-09-03	cash	registration	REC-202509-0001	REC-202509-6495	TXN-1756896707662	authenticated-user	\N	f	f	f	f	\N	f	\N	\N	\N	2025-09-03 12:51:47.938362+02	authenticated-user	Ibrahima DIALLO	9	2025	1	100000.00
bc236e3f-0fd5-4b71-86b0-5e4559e75a60	7907c3a0-60cf-4aa3-880f-0df83f526d0b	\N	700000.00	2025-09-03	cash	tuition_monthly	REC-202509-0002	REC-202509-3049	TXN-1756896783470	authenticated-user	\N	f	f	f	f	\N	f	\N	\N	\N	2025-09-03 12:53:03.698284+02	authenticated-user	Ibrahima DIALLO	9	2025	1	900000.00
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, student_number, first_name, last_name, birth_date, age, gender, is_orphan, status, coranic_class_id, french_class_id, school_year_id, photo_url, enrollment_date, notes, created_at, updated_at, deleted, deleted_at) FROM stdin;
8a22f989-4817-49e3-85f2-a9d3fab1e0fd	ELV-2025-001	Ibrahima	DIALLO	2001-06-26	24	M	t	interne	\N	\N	\N	\N	2025-06-26	\N	2025-06-26 21:50:11.624348+02	2025-07-04 17:15:29.275221+02	t	2025-06-27 05:16:02.971469
76fb1427-690e-482d-aedd-ced88db27a5e	ELV-2025-002	Ousmane	Sow	2001-07-07	24	M	t	interne	\N	\N	024b4f22-6eb2-4ef7-beb7-150f69f2ac41	\N	2025-07-07	\N	2025-07-07 16:12:05.695711+02	2025-07-10 20:49:53.287278+02	t	2025-07-10 20:49:53.287278
6c2ca318-dbf5-4c23-97ec-10946eabac3b	ELV-2025-004	Fatoumata	BAH	2004-07-11	21	F	t	interne	c46c46c8-87f4-4c04-b15a-bad9b0669c79	\N	024b4f22-6eb2-4ef7-beb7-150f69f2ac41	/uploads/avatars/avatar-authenticated-user-1753397124092.png	2025-07-11	École française - Niveau: lycée 1ère\nÉcole: Yacine DIALLO	2025-07-11 20:54:36.763356+02	2025-07-25 00:45:24.191769+02	f	\N
d82b77e2-9ed2-4d89-9580-3aae98989a19	ELV-2025-009	Sadou	Barry	2009-07-14	16	M	f	externe	c46c46c8-87f4-4c04-b15a-bad9b0669c79	\N	024b4f22-6eb2-4ef7-beb7-150f69f2ac41	/uploads/avatars/avatar-authenticated-user-1752504682133.png	2025-07-14	École française - Niveau: 10ème\nÉcole: Yamassafou\nFrais d'inscription: 800 000 GNF - Payé le 14/07/2025	2025-07-14 16:51:21.884244+02	2025-07-14 16:51:22.417876+02	f	\N
7907c3a0-60cf-4aa3-880f-0df83f526d0b	ELV-2025-013	Samir	DIALLO	2007-09-02	18	M	f	interne	66c3aa63-dcc1-49f7-85c3-565c105c264d	\N	024b4f22-6eb2-4ef7-beb7-150f69f2ac41	/uploads/avatars/avatar-authenticated-user-1756896623561.png	2025-09-03	École française - Niveau: Terminales SEÉcole: Lycée KipéFrais d'inscription: 800 000 GNF - Payé le 03/09/2025\nFrais d'inscription: 800 000 GNF - Payé	2025-09-03 12:49:36.536483+02	2025-09-03 12:50:23.642857+02	f	\N
601561c4-bf9f-4fbc-baaf-600ec8773778	ELV-2025-005	Mamadou	TALL	2001-07-08	24	M	f	externe	c46c46c8-87f4-4c04-b15a-bad9b0669c79	\N	024b4f22-6eb2-4ef7-beb7-150f69f2ac41	\N	2025-07-11	École française - Niveau: 11èmeÉcole: ExcellenceFrais d'inscription: 800 000 GNF - PayéFrais d'inscription: 800 000 GNF - Payé\nFrais d'inscription: 800 000 GNF - Payé	2025-07-11 23:57:47.253464+02	2025-07-14 17:18:11.386637+02	t	\N
3d96b25e-7f49-4047-8296-6ccaaf318320	ELV-2025-007	Aicha	DIALLO	2007-07-10	18	F	f	interne	c46c46c8-87f4-4c04-b15a-bad9b0669c79	\N	024b4f22-6eb2-4ef7-beb7-150f69f2ac41	/uploads/avatars/avatar-authenticated-user-1753396998496.png	2025-07-12	École française - Niveau: 11èmeÉcole: SAINT MARIEFrais d'inscription: 800 000 GNF - Payé\nFrais d'inscription: 800 000 GNF - Payé	2025-07-12 17:36:54.631494+02	2025-09-04 12:54:48.704906+02	f	\N
aa073390-e492-46ed-a101-4050e01433f2	ELV-2025-006	Bachir	DIALLO	2001-07-12	24	M	f	externe	\N	\N	024b4f22-6eb2-4ef7-beb7-150f69f2ac41	\N	2025-07-12	École française - Niveau: 12ème\nÉcole: Yamasafou	2025-07-12 10:46:16.56175+02	2025-07-18 16:47:43.32162+02	t	\N
fc447163-b36b-45c0-ad10-a8d92ff56e24	ELV-2025-008	Alpha	Bah	2004-07-13	21	M	f	externe	\N	\N	024b4f22-6eb2-4ef7-beb7-150f69f2ac41	\N	2025-07-13	École française - Niveau: 12ème\nÉcole: Galilée\nFrais d'inscription: 800 000 GNF - Payé le 13/07/2025	2025-07-13 21:35:03.766167+02	2025-07-18 16:48:02.786961+02	t	\N
dc472bb9-1589-4770-8733-c9f02604bc5f	ELV-2025-012	Aboubacar	BAH	2001-08-24	24	M	t	interne	c46c46c8-87f4-4c04-b15a-bad9b0669c79	\N	024b4f22-6eb2-4ef7-beb7-150f69f2ac41	/uploads/avatars/avatar-authenticated-user-1756155561646.png	2025-08-25	École française - Niveau: 11 èmeÉcole: Lycée WouroFrais d'inscription: 800 000 GNF - Payé le 25/08/2025\nFrais d'inscription: 800 000 GNF - Payé	2025-08-25 22:58:37.649931+02	2025-09-03 12:19:23.119293+02	f	\N
53fca257-e401-4ef3-b52c-62f0ffc72025	ELV-2025-003	Maher	BAH	2004-07-08	21	M	f	interne	c46c46c8-87f4-4c04-b15a-bad9b0669c79	\N	024b4f22-6eb2-4ef7-beb7-150f69f2ac41	/uploads/avatars/avatar-authenticated-user-1752504207535.png	2025-07-10	École française - Niveau: 10èmeÉcole: SAIN GEORGEFrais d'inscription: 800 000 GNF - Payé\nFrais d'inscription: 800 000 GNF - Payé	2025-07-10 20:47:32.122235+02	2025-09-03 12:21:33.178458+02	f	\N
f91bb3d8-127b-422e-8131-ab2e20860697	ELV-2025-010	Salimatou	DIALLO	2001-07-13	24	F	t	interne	c46c46c8-87f4-4c04-b15a-bad9b0669c79	\N	024b4f22-6eb2-4ef7-beb7-150f69f2ac41	/uploads/avatars/avatar-authenticated-user-1752506088793.png	2025-07-14	École française - Niveau: 9èmeÉcole: Nour DinFrais d'inscription: 800 000 GNF - Payé le 14/07/2025\nFrais d'inscription: 800 000 GNF - Payé	2025-07-14 17:14:48.515665+02	2025-09-03 12:22:02.792808+02	f	\N
a6232bb6-485c-49d3-8680-34e8990b5929	ELV-2025-011	Boubacar	Barry	2007-07-15	18	M	t	interne	c46c46c8-87f4-4c04-b15a-bad9b0669c79	\N	b3ac4d8c-55d1-425e-b2c3-d6227db34d3b	/uploads/avatars/avatar-authenticated-user-1752703577979.png	2025-07-17	École française - Niveau: TSÉcole: TountourounFrais d'inscription: 800 000 GNF - Payé le 17/07/2025\nFrais d'inscription: 800 000 GNF - Payé	2025-07-17 00:05:11.977098+02	2025-09-04 14:20:30.080622+02	f	\N
\.


--
-- Data for Name: tuition_fees_v2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tuition_fees_v2 (id, class_id, school_year_id, registration_fee, monthly_amount, annual_amount, exam_fee, book_fee, uniform_fee, transport_fee, meal_fee, additional_fees, payment_type, orphan_discount_percent, needy_discount_percent, early_payment_discount, is_active, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (id, user_id, session_id, access_token_jti, connection_quality, remember_me, created_at, last_activity_at, expires_at, client_ip, user_agent, device_type, browser_name, os_name, is_active, ended_at, end_reason, requests_count, last_endpoint) FROM stdin;
\.


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 1, false);


--
-- Name: admin_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_users_id_seq', 34, true);


--
-- Name: financial_capital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.financial_capital_id_seq', 18, true);


--
-- Name: financial_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.financial_categories_id_seq', 11, true);


--
-- Name: manual_financial_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.manual_financial_transactions_id_seq', 3, true);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 62, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 145, true);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_sessions_id_seq', 1, false);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_email_key UNIQUE (email);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_username_key UNIQUE (username);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: expense_budgets expense_budgets_category_id_budget_year_budget_month_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_budgets
    ADD CONSTRAINT expense_budgets_category_id_budget_year_budget_month_key UNIQUE (category_id, budget_year, budget_month);


--
-- Name: expense_budgets expense_budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_budgets
    ADD CONSTRAINT expense_budgets_pkey PRIMARY KEY (id);


--
-- Name: expense_categories expense_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_name_key UNIQUE (name);


--
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- Name: expense_responsibles expense_responsibles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_responsibles
    ADD CONSTRAINT expense_responsibles_pkey PRIMARY KEY (id);


--
-- Name: expense_status_history expense_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_status_history
    ADD CONSTRAINT expense_status_history_pkey PRIMARY KEY (id);


--
-- Name: expense_statuses expense_statuses_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_statuses
    ADD CONSTRAINT expense_statuses_name_key UNIQUE (name);


--
-- Name: expense_statuses expense_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_statuses
    ADD CONSTRAINT expense_statuses_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_reference_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_reference_key UNIQUE (reference);


--
-- Name: financial_capital financial_capital_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_capital
    ADD CONSTRAINT financial_capital_pkey PRIMARY KEY (id);


--
-- Name: financial_categories financial_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_categories
    ADD CONSTRAINT financial_categories_pkey PRIMARY KEY (id);


--
-- Name: guardians guardians_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT guardians_pkey PRIMARY KEY (id);


--
-- Name: manual_financial_transactions manual_financial_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manual_financial_transactions
    ADD CONSTRAINT manual_financial_transactions_pkey PRIMARY KEY (id);


--
-- Name: manual_financial_transactions manual_financial_transactions_reference_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manual_financial_transactions
    ADD CONSTRAINT manual_financial_transactions_reference_key UNIQUE (reference);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: salary_payments_v2 salary_payments_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_payments_v2
    ADD CONSTRAINT salary_payments_v2_pkey PRIMARY KEY (id);


--
-- Name: salary_payments_v2 salary_payments_v2_receipt_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_payments_v2
    ADD CONSTRAINT salary_payments_v2_receipt_number_key UNIQUE (receipt_number);


--
-- Name: school_years school_years_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_years
    ADD CONSTRAINT school_years_name_key UNIQUE (name);


--
-- Name: school_years school_years_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_years
    ADD CONSTRAINT school_years_pkey PRIMARY KEY (id);


--
-- Name: staff staff_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_email_key UNIQUE (email);


--
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- Name: staff_salaries_v2 staff_salaries_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_salaries_v2
    ADD CONSTRAINT staff_salaries_v2_pkey PRIMARY KEY (id);


--
-- Name: staff staff_staff_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_staff_number_key UNIQUE (staff_number);


--
-- Name: student_academic_progress student_academic_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_academic_progress
    ADD CONSTRAINT student_academic_progress_pkey PRIMARY KEY (id);


--
-- Name: student_payment_schedules student_payment_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_payment_schedules
    ADD CONSTRAINT student_payment_schedules_pkey PRIMARY KEY (id);


--
-- Name: student_payment_schedules student_payment_schedules_student_id_due_month_due_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_payment_schedules
    ADD CONSTRAINT student_payment_schedules_student_id_due_month_due_year_key UNIQUE (student_id, due_month, due_year);


--
-- Name: student_payments student_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_payments
    ADD CONSTRAINT student_payments_pkey PRIMARY KEY (id);


--
-- Name: student_payments student_payments_receipt_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_payments
    ADD CONSTRAINT student_payments_receipt_number_key UNIQUE (receipt_number);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: students students_student_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_student_number_key UNIQUE (student_number);


--
-- Name: tuition_fees_v2 tuition_fees_v2_class_id_school_year_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tuition_fees_v2
    ADD CONSTRAINT tuition_fees_v2_class_id_school_year_id_key UNIQUE (class_id, school_year_id);


--
-- Name: tuition_fees_v2 tuition_fees_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tuition_fees_v2
    ADD CONSTRAINT tuition_fees_v2_pkey PRIMARY KEY (id);


--
-- Name: student_academic_progress unique_student_evaluation_date; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_academic_progress
    ADD CONSTRAINT unique_student_evaluation_date UNIQUE (student_id, evaluation_date);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_session_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_session_id_key UNIQUE (session_id);


--
-- Name: idx_academic_progress_class; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_academic_progress_class ON public.student_academic_progress USING btree (class_id);


--
-- Name: idx_academic_progress_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_academic_progress_date ON public.student_academic_progress USING btree (evaluation_date DESC);


--
-- Name: idx_academic_progress_grade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_academic_progress_grade ON public.student_academic_progress USING btree (overall_grade DESC);


--
-- Name: idx_academic_progress_month_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_academic_progress_month_year ON public.student_academic_progress USING btree (evaluation_year DESC, evaluation_month DESC);


--
-- Name: idx_academic_progress_school_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_academic_progress_school_year ON public.student_academic_progress USING btree (school_year_id);


--
-- Name: idx_academic_progress_sourate; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_academic_progress_sourate ON public.student_academic_progress USING btree (sourate_number);


--
-- Name: idx_academic_progress_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_academic_progress_status ON public.student_academic_progress USING btree (memorization_status);


--
-- Name: idx_academic_progress_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_academic_progress_student_id ON public.student_academic_progress USING btree (student_id);


--
-- Name: idx_activity_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_created_at ON public.activity_logs USING btree (created_at);


--
-- Name: idx_activity_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs USING btree (user_id);


--
-- Name: idx_admin_users_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_users_active ON public.admin_users USING btree (is_active);


--
-- Name: idx_admin_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_users_email ON public.admin_users USING btree (email);


--
-- Name: idx_admin_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_users_role ON public.admin_users USING btree (role);


--
-- Name: idx_admin_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_users_username ON public.admin_users USING btree (username);


--
-- Name: idx_classes_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_classes_active ON public.classes USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_classes_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_classes_level ON public.classes USING btree (level);


--
-- Name: idx_classes_school_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_classes_school_year ON public.classes USING btree (school_year_id);


--
-- Name: idx_classes_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_classes_type ON public.classes USING btree (type);


--
-- Name: idx_expenses_amount; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_amount ON public.expenses USING btree (amount) WHERE (paid_date IS NOT NULL);


--
-- Name: idx_expenses_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_category ON public.expenses USING btree (category_id);


--
-- Name: idx_expenses_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_created_by ON public.expenses USING btree (created_by);


--
-- Name: idx_expenses_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_date ON public.expenses USING btree (expense_date);


--
-- Name: idx_expenses_reference; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_reference ON public.expenses USING btree (reference);


--
-- Name: idx_expenses_responsible_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_responsible_user_id ON public.expenses USING btree (responsible_user_id);


--
-- Name: idx_expenses_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_status ON public.expenses USING btree (status_id);


--
-- Name: idx_expenses_year_month; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_year_month ON public.expenses USING btree (budget_year, budget_month);


--
-- Name: idx_financial_categories_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_financial_categories_type ON public.financial_categories USING btree (type);


--
-- Name: idx_financial_flows_amount; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_financial_flows_amount ON public.expenses USING btree (amount);


--
-- Name: idx_financial_flows_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_financial_flows_date ON public.student_payments USING btree (payment_date);


--
-- Name: idx_guardians_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_guardians_email ON public.guardians USING btree (email) WHERE (email IS NOT NULL);


--
-- Name: idx_guardians_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_guardians_phone ON public.guardians USING btree (phone);


--
-- Name: idx_guardians_primary; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_guardians_primary ON public.guardians USING btree (student_id, is_primary);


--
-- Name: idx_guardians_single_primary; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_guardians_single_primary ON public.guardians USING btree (student_id) WHERE (is_primary = true);


--
-- Name: idx_guardians_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_guardians_student ON public.guardians USING btree (student_id);


--
-- Name: idx_manual_transactions_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_manual_transactions_date ON public.manual_financial_transactions USING btree (transaction_date);


--
-- Name: idx_manual_transactions_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_manual_transactions_type ON public.manual_financial_transactions USING btree (type);


--
-- Name: idx_notifications_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_category ON public.notifications USING btree (category);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_due_date ON public.notifications USING btree (due_date);


--
-- Name: idx_notifications_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_is_active ON public.notifications USING btree (is_active);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_pending_reminders; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_pending_reminders ON public.notifications USING btree (reminder_date, is_reminder_sent, is_active) WHERE ((is_reminder_sent = false) AND (is_active = true));


--
-- Name: idx_notifications_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_priority ON public.notifications USING btree (priority);


--
-- Name: idx_notifications_reminder_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_reminder_date ON public.notifications USING btree (reminder_date);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_notifications_user_unread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, is_read, is_active) WHERE ((is_read = false) AND (is_active = true));


--
-- Name: idx_password_reset_tokens_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_tokens_expires ON public.password_reset_tokens USING btree (expires_at);


--
-- Name: idx_password_reset_tokens_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);


--
-- Name: idx_password_reset_tokens_used; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_tokens_used ON public.password_reset_tokens USING btree (used);


--
-- Name: idx_password_reset_tokens_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_refresh_tokens_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_expires_at ON public.refresh_tokens USING btree (expires_at);


--
-- Name: idx_refresh_tokens_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_salary_payments_amount; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_salary_payments_amount ON public.salary_payments_v2 USING btree (amount) WHERE ((status)::text = 'completed'::text);


--
-- Name: idx_salary_payments_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_salary_payments_date ON public.salary_payments_v2 USING btree (payment_date);


--
-- Name: idx_salary_payments_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_salary_payments_period ON public.salary_payments_v2 USING btree (payment_year, payment_month);


--
-- Name: idx_salary_payments_staff_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_salary_payments_staff_year ON public.salary_payments_v2 USING btree (staff_salary_id, payment_year);


--
-- Name: idx_salary_payments_year_month; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_salary_payments_year_month ON public.salary_payments_v2 USING btree (payment_year, payment_month);


--
-- Name: idx_school_years_current; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_school_years_current ON public.school_years USING btree (is_current) WHERE (is_current = true);


--
-- Name: idx_school_years_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_school_years_dates ON public.school_years USING btree (start_date, end_date);


--
-- Name: idx_school_years_single_current; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_school_years_single_current ON public.school_years USING btree (is_current) WHERE (is_current = true);


--
-- Name: idx_staff_salaries_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_salaries_active ON public.staff_salaries_v2 USING btree (staff_id, is_active);


--
-- Name: idx_staff_salaries_effective; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_salaries_effective ON public.staff_salaries_v2 USING btree (effective_date);


--
-- Name: idx_staff_salaries_staff_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_salaries_staff_year ON public.staff_salaries_v2 USING btree (staff_id, school_year_id);


--
-- Name: idx_staff_staff_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_staff_number ON public.staff USING btree (staff_number);


--
-- Name: idx_student_payment_schedules_overdue; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_payment_schedules_overdue ON public.student_payment_schedules USING btree (overdue_days) WHERE (overdue_days > 0);


--
-- Name: idx_student_payment_schedules_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_payment_schedules_status ON public.student_payment_schedules USING btree (status) WHERE ((status)::text = ANY ((ARRAY['overdue'::character varying, 'pending'::character varying])::text[]));


--
-- Name: idx_student_payment_schedules_student_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_payment_schedules_student_date ON public.student_payment_schedules USING btree (student_id, due_year, due_month);


--
-- Name: idx_student_payments_amount; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_payments_amount ON public.student_payments USING btree (amount) WHERE (is_cancelled = false);


--
-- Name: idx_student_payments_method; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_payments_method ON public.student_payments USING btree (payment_method);


--
-- Name: idx_student_payments_student_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_payments_student_date ON public.student_payments USING btree (student_id, payment_date);


--
-- Name: idx_student_payments_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_payments_type ON public.student_payments USING btree (payment_type);


--
-- Name: idx_student_progress_grades; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_progress_grades ON public.student_academic_progress USING btree (overall_grade) WHERE (overall_grade IS NOT NULL);


--
-- Name: idx_student_progress_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_progress_search ON public.student_academic_progress USING btree (student_id, evaluation_date DESC);


--
-- Name: idx_students_active_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_active_year ON public.students USING btree (school_year_id, status) WHERE ((status)::text <> 'archived'::text);


--
-- Name: idx_students_age; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_age ON public.students USING btree (age);


--
-- Name: idx_students_classes; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_classes ON public.students USING btree (coranic_class_id, french_class_id);


--
-- Name: idx_students_deleted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_deleted ON public.students USING btree (deleted);


--
-- Name: idx_students_enrollment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_enrollment ON public.students USING btree (enrollment_date);


--
-- Name: idx_students_gender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_gender ON public.students USING btree (gender);


--
-- Name: idx_students_names; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_names ON public.students USING btree (last_name, first_name);


--
-- Name: idx_students_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_number ON public.students USING btree (student_number);


--
-- Name: idx_students_orphan; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_orphan ON public.students USING btree (is_orphan);


--
-- Name: idx_students_school_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_school_year ON public.students USING btree (school_year_id);


--
-- Name: idx_students_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_status ON public.students USING btree (status);


--
-- Name: idx_tuition_fees_class_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tuition_fees_class_year ON public.tuition_fees_v2 USING btree (class_id, school_year_id);


--
-- Name: idx_user_sessions_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_is_active ON public.user_sessions USING btree (is_active);


--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- Name: students_with_payments _RETURN; Type: RULE; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW public.students_with_payments AS
 SELECT s.id,
    s.student_number,
    s.first_name,
    s.last_name,
    s.birth_date,
    s.age,
    s.gender,
    s.is_orphan,
    s.status,
    s.coranic_class_id,
    s.french_class_id,
    s.school_year_id,
    s.photo_url,
    s.enrollment_date,
    s.notes,
    s.created_at,
    s.updated_at,
    s.deleted,
    s.deleted_at,
        CASE
            WHEN (cc.id IS NOT NULL) THEN json_build_object('id', cc.id, 'name', cc.name, 'level', cc.level, 'type', cc.type, 'teacher_name', cc.teacher_name, 'capacity', cc.capacity)
            ELSE NULL::json
        END AS coranic_class,
        CASE
            WHEN (fc.id IS NOT NULL) THEN json_build_object('id', fc.id, 'name', fc.name, 'level', fc.level, 'type', fc.type, 'teacher_name', fc.teacher_name, 'capacity', fc.capacity)
            ELSE NULL::json
        END AS french_class,
        CASE
            WHEN ((fc.level)::text = 'Debutant'::text) THEN 'Ã‰cole Primaire Al-Nour'::text
            WHEN ((fc.level)::text = 'Intermediaire'::text) THEN 'Ã‰cole Ã‰lÃ©mentaire Ibn Sina'::text
            WHEN ((fc.level)::text = 'Avance'::text) THEN 'CollÃ¨ge Al-Andalus'::text
            ELSE NULL::text
        END AS french_school_name,
        CASE
            WHEN (sy.id IS NOT NULL) THEN json_build_object('id', sy.id, 'name', sy.name, 'start_date', sy.start_date, 'end_date', sy.end_date, 'is_current', sy.is_current)
            ELSE NULL::json
        END AS school_year,
    COALESCE(json_agg(json_build_object('id', g.id, 'first_name', g.first_name, 'last_name', g.last_name, 'phone', g.phone, 'email', g.email, 'address', g.address, 'relationship', g.relationship, 'is_primary', g.is_primary) ORDER BY g.is_primary DESC, g.created_at) FILTER (WHERE (g.id IS NOT NULL)), '[]'::json) AS guardians,
    ( SELECT json_build_object('id', gp.id, 'first_name', gp.first_name, 'last_name', gp.last_name, 'phone', gp.phone, 'email', gp.email, 'address', gp.address, 'relationship', gp.relationship, 'is_primary', gp.is_primary) AS json_build_object
           FROM public.guardians gp
          WHERE ((gp.student_id = s.id) AND (gp.is_primary = true))
         LIMIT 1) AS primary_guardian,
        CASE
            WHEN (count(sps_current.id) = 0) THEN 'no_schedule'::text
            WHEN (count(sps_current.id) FILTER (WHERE ((sps_current.status)::text = 'paid'::text)) = count(sps_current.id)) THEN 'paid'::text
            WHEN (count(sps_current.id) FILTER (WHERE ((sps_current.status)::text = 'overdue'::text)) > 0) THEN 'overdue'::text
            WHEN (count(sps_current.id) FILTER (WHERE ((sps_current.status)::text = 'partial'::text)) > 0) THEN 'partial'::text
            ELSE 'pending'::text
        END AS current_payment_status,
    COALESCE(sum(sps_current.balance), (0)::numeric) AS current_balance,
    COALESCE(sum(sps_overdue.balance), (0)::numeric) AS overdue_amount,
    count(sps_overdue.id) AS overdue_count,
    ( SELECT sp.payment_date
           FROM public.student_payments sp
          WHERE (sp.student_id = s.id)
          ORDER BY sp.payment_date DESC
         LIMIT 1) AS last_payment_date,
    ( SELECT sum(sp.amount) AS sum
           FROM public.student_payments sp
          WHERE ((sp.student_id = s.id) AND (sp.payment_date >= date_trunc('year'::text, (CURRENT_DATE)::timestamp with time zone)))) AS total_paid_this_year
   FROM ((((((public.students s
     LEFT JOIN public.classes cc ON (((s.coranic_class_id = cc.id) AND ((cc.type)::text = 'coranic'::text))))
     LEFT JOIN public.classes fc ON (((s.french_class_id = fc.id) AND ((fc.type)::text = 'french'::text))))
     LEFT JOIN public.school_years sy ON ((s.school_year_id = sy.id)))
     LEFT JOIN public.guardians g ON ((s.id = g.student_id)))
     LEFT JOIN public.student_payment_schedules sps_current ON (((s.id = sps_current.student_id) AND ((sps_current.due_month)::numeric = EXTRACT(month FROM CURRENT_DATE)) AND ((sps_current.due_year)::numeric = EXTRACT(year FROM CURRENT_DATE)))))
     LEFT JOIN public.student_payment_schedules sps_overdue ON (((s.id = sps_overdue.student_id) AND ((sps_overdue.status)::text = 'overdue'::text))))
  WHERE (s.deleted = false)
  GROUP BY s.id, cc.id, fc.id, sy.id;


--
-- Name: expenses auto_fill_responsible_user_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER auto_fill_responsible_user_trigger BEFORE INSERT OR UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.auto_fill_responsible_user();


--
-- Name: expenses generate_expense_reference_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER generate_expense_reference_trigger BEFORE INSERT ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.generate_expense_reference();


--
-- Name: student_academic_progress tr_calculate_academic_progress; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_calculate_academic_progress BEFORE INSERT OR UPDATE ON public.student_academic_progress FOR EACH ROW EXECUTE FUNCTION public.calculate_academic_progress();


--
-- Name: school_years tr_single_current_year; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_single_current_year BEFORE INSERT OR UPDATE ON public.school_years FOR EACH ROW WHEN ((new.is_current = true)) EXECUTE FUNCTION public.ensure_single_current_year();


--
-- Name: students tr_students_calculate_age; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_students_calculate_age BEFORE INSERT OR UPDATE OF birth_date ON public.students FOR EACH ROW EXECUTE FUNCTION public.calculate_student_age();


--
-- Name: student_academic_progress tr_update_academic_progress_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_update_academic_progress_timestamp BEFORE UPDATE ON public.student_academic_progress FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: expenses tr_update_capital_on_expense; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_update_capital_on_expense AFTER INSERT OR DELETE OR UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.trigger_update_capital();


--
-- Name: manual_financial_transactions tr_update_capital_on_manual; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_update_capital_on_manual AFTER INSERT OR DELETE OR UPDATE ON public.manual_financial_transactions FOR EACH ROW EXECUTE FUNCTION public.trigger_update_capital();


--
-- Name: salary_payments_v2 tr_update_capital_on_salary; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_update_capital_on_salary AFTER INSERT OR DELETE OR UPDATE ON public.salary_payments_v2 FOR EACH ROW EXECUTE FUNCTION public.trigger_update_capital();


--
-- Name: student_payments tr_update_capital_on_student_payment; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_update_capital_on_student_payment AFTER INSERT OR DELETE OR UPDATE ON public.student_payments FOR EACH ROW EXECUTE FUNCTION public.trigger_update_capital();


--
-- Name: expense_categories update_categories_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.expense_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: expenses update_expenses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.admin_users(id) ON DELETE SET NULL;


--
-- Name: classes classes_school_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;


--
-- Name: expense_budgets expense_budgets_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_budgets
    ADD CONSTRAINT expense_budgets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id) ON DELETE CASCADE;


--
-- Name: expense_budgets expense_budgets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_budgets
    ADD CONSTRAINT expense_budgets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id);


--
-- Name: expense_status_history expense_status_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_status_history
    ADD CONSTRAINT expense_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.admin_users(id);


--
-- Name: expense_status_history expense_status_history_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_status_history
    ADD CONSTRAINT expense_status_history_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE CASCADE;


--
-- Name: expense_status_history expense_status_history_new_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_status_history
    ADD CONSTRAINT expense_status_history_new_status_id_fkey FOREIGN KEY (new_status_id) REFERENCES public.expense_statuses(id);


--
-- Name: expense_status_history expense_status_history_old_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_status_history
    ADD CONSTRAINT expense_status_history_old_status_id_fkey FOREIGN KEY (old_status_id) REFERENCES public.expense_statuses(id);


--
-- Name: expenses expenses_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id) ON DELETE RESTRICT;


--
-- Name: expenses expenses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id);


--
-- Name: expenses expenses_responsible_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_responsible_id_fkey FOREIGN KEY (responsible_id) REFERENCES public.expense_responsibles(id) ON DELETE SET NULL;


--
-- Name: expenses expenses_responsible_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_responsible_user_id_fkey FOREIGN KEY (responsible_user_id) REFERENCES public.admin_users(id);


--
-- Name: expenses expenses_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.expense_statuses(id) ON DELETE RESTRICT;


--
-- Name: expenses expenses_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admin_users(id);


--
-- Name: guardians guardians_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT guardians_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id);


--
-- Name: notifications notifications_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admin_users(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.admin_users(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.admin_users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.admin_users(id) ON DELETE CASCADE;


--
-- Name: salary_payments_v2 salary_payments_v2_staff_salary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_payments_v2
    ADD CONSTRAINT salary_payments_v2_staff_salary_id_fkey FOREIGN KEY (staff_salary_id) REFERENCES public.staff_salaries_v2(id) ON DELETE CASCADE;


--
-- Name: staff_salaries_v2 staff_salaries_v2_school_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_salaries_v2
    ADD CONSTRAINT staff_salaries_v2_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE CASCADE;


--
-- Name: staff_salaries_v2 staff_salaries_v2_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_salaries_v2
    ADD CONSTRAINT staff_salaries_v2_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;


--
-- Name: student_academic_progress student_academic_progress_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_academic_progress
    ADD CONSTRAINT student_academic_progress_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;


--
-- Name: student_academic_progress student_academic_progress_evaluated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_academic_progress
    ADD CONSTRAINT student_academic_progress_evaluated_by_fkey FOREIGN KEY (evaluated_by) REFERENCES public.staff(id) ON DELETE SET NULL;


--
-- Name: student_academic_progress student_academic_progress_school_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_academic_progress
    ADD CONSTRAINT student_academic_progress_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE CASCADE;


--
-- Name: student_academic_progress student_academic_progress_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_academic_progress
    ADD CONSTRAINT student_academic_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_payment_schedules student_payment_schedules_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_payment_schedules
    ADD CONSTRAINT student_payment_schedules_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_payment_schedules student_payment_schedules_tuition_fee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_payment_schedules
    ADD CONSTRAINT student_payment_schedules_tuition_fee_id_fkey FOREIGN KEY (tuition_fee_id) REFERENCES public.tuition_fees_v2(id) ON DELETE CASCADE;


--
-- Name: student_payments student_payments_payment_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_payments
    ADD CONSTRAINT student_payments_payment_schedule_id_fkey FOREIGN KEY (payment_schedule_id) REFERENCES public.student_payment_schedules(id) ON DELETE SET NULL;


--
-- Name: student_payments student_payments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_payments
    ADD CONSTRAINT student_payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: students students_coranic_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_coranic_class_id_fkey FOREIGN KEY (coranic_class_id) REFERENCES public.classes(id) ON DELETE SET NULL;


--
-- Name: students students_french_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_french_class_id_fkey FOREIGN KEY (french_class_id) REFERENCES public.classes(id) ON DELETE SET NULL;


--
-- Name: students students_school_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;


--
-- Name: tuition_fees_v2 tuition_fees_v2_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tuition_fees_v2
    ADD CONSTRAINT tuition_fees_v2_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: tuition_fees_v2 tuition_fees_v2_school_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tuition_fees_v2
    ADD CONSTRAINT tuition_fees_v2_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.admin_users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

