-- 성북 지점 추가
INSERT INTO branches (
  name,
  region,
  address,
  phone,
  subdomain,
  is_active,
  branch_type,
  description,
  business_hours
) VALUES (
  '성북',
  '서울',
  '서울특별시 성북구 종암로 167, 110호(하월곡동, 동일하이빌뉴시티)',
  '010-3712-1049',
  '성북',
  true,
  'rentcar',
  '깨끗하고 안전한 차량, 합리적인 가격으로 고객님의 특별한 여정을 함께합니다.',
  '09:00 - 21:00'
);
