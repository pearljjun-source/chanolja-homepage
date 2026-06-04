-- 보안: 신용카드 번호 저장 제거 (PCI-DSS 준수)
-- card_number 파라미터는 유지하되 (하위 호환성), 실제로 저장하지 않음

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
SET search_path = ''
AS $$
DECLARE
  v_payment RECORD;
  v_result JSON;
BEGIN
  -- 1. 결제 정보 조회 및 잠금
  SELECT * INTO v_payment
  FROM public.payments
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

  -- 2. 결제 상태 업데이트 (card_number는 저장하지 않음)
  UPDATE public.payments
  SET
    pg_transaction_id = p_payment_key,
    status = 'completed',
    paid_at = NOW(),
    card_company = p_card_company,
    card_number = NULL,
    installment_months = p_installment_months,
    settlement_status = 'processing',
    branch_settlement_status = 'processing',
    hq_settlement_status = 'processing',
    updated_at = NOW()
  WHERE id = v_payment.id;

  -- 3. 예약 상태 업데이트
  IF v_payment.reservation_id IS NOT NULL THEN
    UPDATE public.reservations
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
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 기존에 저장된 카드 번호 데이터 삭제
UPDATE payments SET card_number = NULL WHERE card_number IS NOT NULL;

-- RPC 함수 권한 유지
GRANT EXECUTE ON FUNCTION complete_payment_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION complete_payment_transaction TO service_role;
