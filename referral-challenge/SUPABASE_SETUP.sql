-- ============================================================
--  추천 챌린지 — Supabase SQL 전체 초기화 및 재설정
--  SQL Editor에 전체 붙여넣고 Run 클릭
-- ============================================================

-- 기존 데이터 전체 삭제
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP VIEW  IF EXISTS ranking_view CASCADE;

-- ============================================================
--  1. 회원 테이블 (password 포함)
-- ============================================================
CREATE TABLE members (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  member_no   TEXT        NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  password    TEXT        NOT NULL,
  is_admin    BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  2. 추천 테이블
-- ============================================================
CREATE TABLE referrals (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id   UUID        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  referred_no    TEXT        NOT NULL UNIQUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  3. Row Level Security
-- ============================================================
ALTER TABLE members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select"   ON members   FOR SELECT USING (true);
CREATE POLICY "members_insert"   ON members   FOR INSERT WITH CHECK (true);
CREATE POLICY "members_delete"   ON members   FOR DELETE USING (true);
CREATE POLICY "referrals_select" ON referrals FOR SELECT USING (true);
CREATE POLICY "referrals_insert" ON referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "referrals_delete" ON referrals FOR DELETE USING (true);

-- ============================================================
--  4. 랭킹 뷰
-- ============================================================
CREATE OR REPLACE VIEW ranking_view AS
SELECT
  m.id,
  m.member_no,
  m.name,
  m.email,
  m.created_at,
  COUNT(r.id)::INT AS referral_count
FROM  members m
LEFT  JOIN referrals r ON r.recruiter_id = m.id
WHERE m.is_admin = FALSE
GROUP BY m.id
ORDER BY referral_count DESC, m.name ASC;

-- ============================================================
--  5. 기본 관리자 계정
--  비밀번호를 원하는 값으로 바꾸세요
-- ============================================================
INSERT INTO members (member_no, name, email, password, is_admin)
VALUES ('0000', '관리자', 'admin@example.com', 'Admin1234!', TRUE);
