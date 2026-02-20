-- =====================================================
-- 외래키 ON DELETE CASCADE → RESTRICT 변경
-- 날짜: 2026-02-20
-- 목적: 실수로 hard DELETE 실행 시 연쇄 삭제 방지
-- 앱은 soft delete(is_active=false) 사용하므로 RESTRICT가 안전
-- =====================================================

-- 동적으로 제약조건 이름을 찾아서 교체하는 함수
CREATE OR REPLACE FUNCTION _temp_replace_fk_cascade_to_restrict(
  p_table TEXT,
  p_column TEXT,
  p_ref_table TEXT,
  p_ref_column TEXT DEFAULT 'id'
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_constraint_name TEXT;
BEGIN
  SELECT tc.constraint_name INTO v_constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = p_table
    AND kcu.column_name = p_column;

  IF v_constraint_name IS NULL THEN
    RETURN 'SKIP: no FK found for ' || p_table || '.' || p_column;
  END IF;

  EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', p_table, v_constraint_name);
  EXECUTE format(
    'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(%I) ON DELETE RESTRICT',
    p_table, v_constraint_name, p_column, p_ref_table, p_ref_column
  );

  RETURN 'OK: ' || p_table || '.' || p_column || ' (' || v_constraint_name || ')';
END;
$$;

-- 각 외래키 변경 실행
SELECT _temp_replace_fk_cascade_to_restrict('vehicles', 'branch_id', 'branches');
SELECT _temp_replace_fk_cascade_to_restrict('vehicle_insurances', 'vehicle_id', 'vehicles');
SELECT _temp_replace_fk_cascade_to_restrict('vehicle_insurances', 'branch_id', 'branches');
SELECT _temp_replace_fk_cascade_to_restrict('reservations', 'branch_id', 'branches');
SELECT _temp_replace_fk_cascade_to_restrict('reservations', 'vehicle_id', 'vehicles');
SELECT _temp_replace_fk_cascade_to_restrict('payments', 'reservation_id', 'reservations');
SELECT _temp_replace_fk_cascade_to_restrict('payments', 'branch_id', 'branches');
SELECT _temp_replace_fk_cascade_to_restrict('reviews', 'branch_id', 'branches');

-- 임시 함수 삭제
DROP FUNCTION _temp_replace_fk_cascade_to_restrict;
