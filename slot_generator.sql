-- =====================================================
-- DUTYGUARD - FULL AUTOMATIC SLOT GENERATOR v1.4
-- Deletes old auto-slots before regenerating
-- =====================================================

-- 1. Add helper columns (safe to run multiple times)
ALTER TABLE exam_duties 
  ADD COLUMN IF NOT EXISTS is_slot BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS slot_type TEXT,
  ADD COLUMN IF NOT EXISTS period_id BIGINT REFERENCES periods(id),
  ADD COLUMN IF NOT EXISTS required_tech_staff_code VARCHAR,
  ADD COLUMN IF NOT EXISTS slot_group_id BIGINT,
  ADD COLUMN IF NOT EXISTS slot_index INT;

-- 2. Main Generator with Cleanup
DO $$
DECLARE
    v_date DATE;
    v_session RECORD;
    v_paper RECORD;
    v_num_inv_slots INT;
    v_slot_index INT;
    v_slot_group_id BIGINT;
    v_venue_id TEXT;
    v_tech_staff_code VARCHAR;
BEGIN
    RAISE NOTICE '=== SLOT GENERATOR v1.4 STARTING ===';

    -- ============================================
    -- CLEANUP: Delete previous auto-generated slots
    -- ============================================
    DELETE FROM exam_duties 
    WHERE is_slot = true 
      AND (notes LIKE '%AUTO-SLOT%' OR notes IS NULL);

    RAISE NOTICE 'Old auto-slots deleted. Starting fresh generation...';

    -- ============================================
    -- GENERATE NEW SLOTS
    -- ============================================
    FOR v_date IN 
        SELECT DISTINCT exam_date FROM exam_sessions ORDER BY exam_date
    LOOP
        FOR v_session IN 
            SELECT id, grade, session_type 
            FROM exam_sessions 
            WHERE exam_date = v_date
        LOOP
            FOR v_paper IN 
                SELECT p.id AS paper_id, p.subject_code, p.paper_type, p.total_learners
                FROM exam_papers p
                WHERE p.exam_session_id = v_session.id
            LOOP
                v_slot_group_id := nextval('exam_duties_id_seq');
                v_slot_index := 0;

                -- Calculate number of invigilator slots needed
                IF v_session.grade = 12 THEN
                    v_num_inv_slots := GREATEST(1, CEIL(COALESCE(v_paper.total_learners, 0)::numeric / 30));
                ELSE
                    v_num_inv_slots := GREATEST(1, CEIL(COALESCE(v_paper.total_learners, 0)::numeric / 25));
                END IF;

                -- Get a valid venue_id
                SELECT venue_id INTO v_venue_id 
                FROM venues 
                ORDER BY venue_id 
                LIMIT 1;

                IF v_venue_id IS NULL THEN
                    v_venue_id := 'HALL';
                END IF;

                -- === Create Invigilation slots ===
                FOR i IN 1..v_num_inv_slots LOOP
                    v_slot_index := v_slot_index + 1;

                    INSERT INTO exam_duties (
                        duty_date, exam_session_id, exam_paper_id,
                        duty_type, venue_id,
                        is_slot, slot_type, slot_group_id, slot_index,
                        notes
                    ) VALUES (
                        v_date, v_session.id, v_paper.paper_id,
                        'Invigilation', v_venue_id,
                        true, 'invigilator', v_slot_group_id, v_slot_index,
                        'AUTO-SLOT v1.4'
                    );
                END LOOP;

                -- === Create 1 Stand-By slot ===
                INSERT INTO exam_duties (
                    duty_date, exam_session_id, exam_paper_id,
                    duty_type, venue_id,
                    is_slot, slot_type, slot_group_id, slot_index,
                    notes
                ) VALUES (
                    v_date, v_session.id, v_paper.paper_id,
                    'Stand-By', v_venue_id,
                    true, 'standby', v_slot_group_id, v_slot_index + 1,
                    'AUTO-SLOT v1.4 | STANDBY'
                );

                -- === Tech-Duty for Practical papers ===
                IF v_paper.paper_type = 'PRAC' THEN
                    IF v_paper.subject_code ILIKE '%IT%' THEN
                        v_tech_staff_code := 'NORTJE';
                    ELSIF v_paper.subject_code ILIKE '%CAT%' THEN
                        v_tech_staff_code := 'BLOM';
                    ELSE
                        v_tech_staff_code := NULL;
                    END IF;

                    IF v_tech_staff_code IS NOT NULL THEN
                        INSERT INTO exam_duties (
                            duty_date, exam_session_id, exam_paper_id,
                            duty_type, venue_id, staff_code,
                            is_slot, slot_type, required_tech_staff_code,
                            slot_group_id, slot_index, notes
                        ) VALUES (
                            v_date, v_session.id, v_paper.paper_id,
                            'Tech-Duty', v_venue_id, v_tech_staff_code,
                            true, 'tech', v_tech_staff_code,
                            v_slot_group_id, v_slot_index + 2,
                            'AUTO-SLOT v1.4 | TECH PRE-ASSIGNED'
                        );
                    END IF;
                END IF;

            END LOOP;
        END LOOP;
    END LOOP;

    RAISE NOTICE '=== SLOT GENERATOR v1.4 COMPLETED SUCCESSFULLY ===';
END $$;