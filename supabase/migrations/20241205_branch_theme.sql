-- 지점 테마 필드 추가
-- 테마 옵션: 'sky' (기본, 차놀자 시그니처), 'coral' (오렌지), 'violet' (보라)

ALTER TABLE branches
ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'sky';

COMMENT ON COLUMN branches.theme IS '지점 홈페이지 테마 색상: sky(기본), coral, violet';

-- 기존 지점에 기본 테마 설정
UPDATE branches SET theme = 'sky' WHERE theme IS NULL;
