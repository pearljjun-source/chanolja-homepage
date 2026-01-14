-- 결제 완료 및 예약 상태 업데이트를 원자적으로 처리하는 함수
-- 트랜잭션으로 묶어 데이터 일관성 보장

CREATE OR REPLACE FUNCTION complete_payment_transaction(
  p_order_id TEXT,
  p_payment_key TEXT,
  p_card_company TEXT DEFAULT NULL,
  p_card_number TEXT DEFAULT NULL,
  p_installment_months INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment RECORD;
  v_result JSON;
BEGIN
  -- 1. 결제 정보 조회 및 잠금
  SELECT * INTO v_payment
  FROM payments
  WHERE pg_order_id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '결제 정보를 찾을 수 없습니다.'
    );
  END IF;

  -- 이미 완료된 결제인지 확인
  IF v_payment.status = 'completed' THEN
    RETURN json_build_object(
      'success', false,
      'error', '이미 완료된 결제입니다.'
    );
  END IF;

  -- 2. 결제 상태 업데이트
  UPDATE payments
  SET
    pg_transaction_id = p_payment_key,
    status = 'completed',
    paid_at = NOW(),
    card_company = p_card_company,
    card_number = p_card_number,
    installment_months = p_installment_months,
    settlement_status = 'processing',
    branch_settlement_status = 'processing',
    hq_settlement_status = 'processing',
    updated_at = NOW()
  WHERE id = v_payment.id;

  -- 3. 예약 상태 업데이트
  IF v_payment.reservation_id IS NOT NULL THEN
    UPDATE reservations
    SET
      status = 'confirmed',
      payment_status = 'paid',
      updated_at = NOW()
    WHERE id = v_payment.reservation_id;
  END IF;

  -- 4. 결과 반환
  SELECT json_build_object(
    'success', true,
    'payment_id', v_payment.id,
    'reservation_id', v_payment.reservation_id,
    'amount', v_payment.amount,
    'branch_settlement_amount', v_payment.branch_settlement_amount,
    'hq_settlement_amount', v_payment.hq_settlement_amount
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- 에러 발생 시 롤백 (자동)
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 환불 처리를 원자적으로 처리하는 함수
CREATE OR REPLACE FUNCTION process_refund_transaction(
  p_payment_id UUID,
  p_refund_amount INTEGER,
  p_refund_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment RECORD;
  v_new_status TEXT;
  v_result JSON;
BEGIN
  -- 1. 결제 정보 조회 및 잠금
  SELECT * INTO v_payment
  FROM payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '결제 정보를 찾을 수 없습니다.'
    );
  END IF;

  -- 완료된 결제만 환불 가능
  IF v_payment.status != 'completed' THEN
    RETURN json_build_object(
      'success', false,
      'error', '완료된 결제만 환불할 수 있습니다.'
    );
  END IF;

  -- 환불 금액 검증
  IF p_refund_amount > (v_payment.amount - COALESCE(v_payment.refund_amount, 0)) THEN
    RETURN json_build_object(
      'success', false,
      'error', '환불 금액이 결제 금액을 초과합니다.'
    );
  END IF;

  -- 전액 환불 vs 부분 환불
  IF p_refund_amount = v_payment.amount THEN
    v_new_status := 'refunded';
  ELSE
    v_new_status := 'partial_refund';
  END IF;

  -- 2. 결제 상태 업데이트
  UPDATE payments
  SET
    status = v_new_status,
    refund_amount = COALESCE(refund_amount, 0) + p_refund_amount,
    refund_reason = p_refund_reason,
    refunded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_payment_id;

  -- 3. 예약 상태 업데이트 (전액 환불 시)
  IF v_new_status = 'refunded' AND v_payment.reservation_id IS NOT NULL THEN
    UPDATE reservations
    SET
      status = 'cancelled',
      payment_status = 'refunded',
      cancelled_at = NOW(),
      cancel_reason = p_refund_reason,
      updated_at = NOW()
    WHERE id = v_payment.reservation_id;
  END IF;

  -- 4. 결과 반환
  SELECT json_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'refund_amount', p_refund_amount,
    'new_status', v_new_status
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 가상계좌 입금 확인 처리 함수
CREATE OR REPLACE FUNCTION confirm_virtual_account_deposit(
  p_order_id TEXT,
  p_payment_key TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment RECORD;
  v_result JSON;
BEGIN
  -- 1. 결제 정보 조회 및 잠금
  SELECT * INTO v_payment
  FROM payments
  WHERE pg_order_id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '결제 정보를 찾을 수 없습니다.'
    );
  END IF;

  -- 입금 대기 상태인지 확인
  IF v_payment.status != 'awaiting_deposit' AND v_payment.status != 'pending' THEN
    RETURN json_build_object(
      'success', false,
      'error', '입금 대기 상태가 아닙니다. 현재 상태: ' || v_payment.status
    );
  END IF;

  -- 2. 결제 상태 업데이트
  UPDATE payments
  SET
    pg_transaction_id = COALESCE(p_payment_key, pg_transaction_id),
    status = 'completed',
    paid_at = NOW(),
    settlement_status = 'processing',
    branch_settlement_status = 'processing',
    hq_settlement_status = 'processing',
    updated_at = NOW()
  WHERE id = v_payment.id;

  -- 3. 예약 상태 업데이트
  IF v_payment.reservation_id IS NOT NULL THEN
    UPDATE reservations
    SET
      status = 'confirmed',
      payment_status = 'paid',
      updated_at = NOW()
    WHERE id = v_payment.reservation_id;
  END IF;

  -- 4. 결과 반환
  SELECT json_build_object(
    'success', true,
    'payment_id', v_payment.id,
    'reservation_id', v_payment.reservation_id,
    'amount', v_payment.amount
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- RPC 함수 권한 설정
GRANT EXECUTE ON FUNCTION complete_payment_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION complete_payment_transaction TO service_role;
GRANT EXECUTE ON FUNCTION process_refund_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION process_refund_transaction TO service_role;
GRANT EXECUTE ON FUNCTION confirm_virtual_account_deposit TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_virtual_account_deposit TO service_role;
