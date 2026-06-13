-- ============================================================
--  추천 챌린지 — Supabase SQL 스키마 v2
--  Supabase 대시보드 > SQL Editor 에 전체 붙여넣고 실행하세요
--  기존 테이블이 있으면 먼저 DROP 후 실행하세요
-- ============================================================

DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP VIEW  IF EXISTS ranking_view;

-- 1. 회원 테이블 (비밀번호 추가)
CREATE TABLE members (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  member_no   TEXT        NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  password    TEXT        NOT NULL,          -- 비밀번호 (plain, 필요시 해시 적용)
  is_admin    BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 추천 테이블 (referred_no 전체 UNIQUE → 중복 차단)
CREATE TABLE referrals (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id   UUID        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  referred_no    TEXT        NOT NULL UNIQUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  Row Level Security
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
--  랭킹 뷰
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
--  기본 관리자 계정
--  member_no, email, password 를 원하는 값으로 수정하세요
-- ============================================================
INSERT INTO members (member_no, name, email, password, is_admin)
VALUES ('0000', '관리자', 'admin@example.com', 'Admin1234!', TRUE)
ON CONFLICT DO NOTHING;
