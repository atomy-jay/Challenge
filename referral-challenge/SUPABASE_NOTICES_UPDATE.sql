-- notices 테이블에 language, video_url 컬럼 추가
-- 기존 DB에 실행하세요 (Supabase SQL Editor)

ALTER TABLE notices
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'all'
    CHECK (language IN ('all','en','de','es','ro','ru')),
  ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';
