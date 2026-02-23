-- =====================================================
-- 예약 상태 전환 + 차량 상태 업데이트를 원자적으로 처리
-- 날짜: 2026-02-23
-- 목적: Race condition 방지 (예약 상태와 차량 상태의 불일치 방지)
-- =====================================================

CREATE OR REPLACE FUNCTION transition_reservation_status(
  p_reservation_id UUID,
  p_action TEXT,
  p_cancel_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reservation RECORD;
  v_new_status TEXT;
  v_vehicle_status TEXT;
BEGIN
  -- 예약 조회 및 잠금 (FOR UPDATE로 동시 수정 방지)
  SELECT id, status, vehicle_id
  INTO v_reservation
  FROM public.reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', '예약을 찾을 수 없습니다.');
  END IF;

  -- 액션별 상태 전환 규칙
  CASE p_action
    WHEN 'approve' THEN
      IF v_reservation.status NOT IN ('pending') THEN
        RETURN json_build_object('success', false, 'error', '승인 가능한 상태가 아닙니다.');
      END IF;
      v_new_status := 'approved';
      v_vehicle_status := NULL; -- 차량 상태 변경 없음

    WHEN 'confirm' THEN
      IF v_reservation.status NOT IN ('pending', 'approved') THEN
        RETURN json_build_object('success', false, 'error', '확정 가능한 상태가 아닙니다.');
      END IF;
      v_new_status := 'confirmed';
      v_vehicle_status := NULL;

    WHEN 'start' THEN
      IF v_reservation.status NOT IN ('confirmed', 'approved') THEN
        RETURN json_build_object('success', false, 'error', '이용 시작 가능한 상태가 아닙니다.');
      END IF;
      v_new_status := 'in_use';
      v_vehicle_status := 'rented';

    WHEN 'complete' THEN
      IF v_reservation.status NOT IN ('in_use') THEN
        RETURN json_build_object('success', false, 'error', '완료 가능한 상태가 아닙니다.');
      END IF;
      v_new_status := 'completed';
      v_vehicle_status := 'available';

    WHEN 'cancel' THEN
      IF v_reservation.status IN ('completed', 'cancelled') THEN
        RETURN json_build_object('success', false, 'error', '취소 가능한 상태가 아닙니다.');
      END IF;
      v_new_status := 'cancelled';
      v_vehicle_status := 'available';

    ELSE
      RETURN json_build_object('success', false, 'error', '잘못된 액션입니다.');
  END CASE;

  -- 예약 상태 업데이트
  IF p_action = 'confirm' THEN
    UPDATE public.reservations
    SET status = v_new_status, payment_status = 'paid'
    WHERE id = p_reservation_id;
  ELSIF p_action = 'cancel' THEN
    UPDATE public.reservations
    SET status = v_new_status,
        cancelled_at = NOW(),
        cancel_reason = p_cancel_reason
    WHERE id = p_reservation_id;
  ELSE
    UPDATE public.reservations
    SET status = v_new_status
    WHERE id = p_reservation_id;
  END IF;

  -- 차량 상태 업데이트 (필요한 경우에만)
  IF v_vehicle_status IS NOT NULL AND v_reservation.vehicle_id IS NOT NULL THEN
    UPDATE public.vehicles
    SET status = v_vehicle_status
    WHERE id = v_reservation.vehicle_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'reservation_id', p_reservation_id,
    'new_status', v_new_status
  );
END;
$$;
