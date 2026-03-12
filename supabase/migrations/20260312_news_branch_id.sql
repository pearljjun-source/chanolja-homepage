-- 뉴스 테이블에 branch_id 추가 (지점별 뉴스 지원)
-- branch_id가 NULL이면 본사 글로벌 뉴스, 값이 있으면 해당 지점 뉴스

ALTER TABLE news ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_news_branch_id ON news(branch_id);
CREATE INDEX IF NOT EXISTS idx_news_branch_published ON news(branch_id, is_published, published_at DESC);

-- anon 역할에 branch_id 읽기 권한 부여
GRANT SELECT (branch_id) ON news TO anon;

-- RLS 정책 갱신: 공개된 뉴스 읽기 (기존 정책이 있으면 유지)
DO $$
BEGIN
  -- anon이 published 뉴스를 읽을 수 있는 정책 확인/추가
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'news' AND policyname = 'anon_read_published_news'
  ) THEN
    CREATE POLICY anon_read_published_news ON news
      FOR SELECT TO anon
      USING (is_published = true);
  END IF;
END $$;
