-- ============================================================
--  추천 챌린지 — Supabase SQL v4
-- ============================================================

DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS notices CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP VIEW  IF EXISTS ranking_view CASCADE;

-- 1. 회원 테이블
CREATE TABLE members (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  member_no   TEXT        NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  password    TEXT        NOT NULL,
  is_admin    BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 추천 테이블 (type: distribution | consumer)
CREATE TABLE referrals (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id   UUID        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  referred_no    TEXT        NOT NULL UNIQUE,
  type           TEXT        NOT NULL DEFAULT 'consumer' CHECK (type IN ('distribution','consumer')),
  seminar        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 공지사항 테이블
CREATE TABLE notices (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title      TEXT        NOT NULL,
  content    TEXT        NOT NULL,
  is_active  BOOLEAN     DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select"   ON members   FOR SELECT USING (true);
CREATE POLICY "members_insert"   ON members   FOR INSERT WITH CHECK (true);
CREATE POLICY "members_delete"   ON members   FOR DELETE USING (true);
CREATE POLICY "members_update"   ON members   FOR UPDATE USING (true);
CREATE POLICY "referrals_select" ON referrals FOR SELECT USING (true);
CREATE POLICY "referrals_insert" ON referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "referrals_delete" ON referrals FOR DELETE USING (true);
CREATE POLICY "notices_select"   ON notices   FOR SELECT USING (true);
CREATE POLICY "notices_insert"   ON notices   FOR INSERT WITH CHECK (true);
CREATE POLICY "notices_update"   ON notices   FOR UPDATE USING (true);
CREATE POLICY "notices_delete"   ON notices   FOR DELETE USING (true);

-- 랭킹 뷰
CREATE OR REPLACE VIEW ranking_view AS
SELECT
  m.id, m.member_no, m.name, m.email, m.created_at,
  COUNT(r.id)::INT                                              AS referral_count,
  COUNT(r.id) FILTER (WHERE r.type = 'distribution')::INT      AS distribution_count,
  COUNT(r.id) FILTER (WHERE r.type = 'consumer')::INT          AS consumer_count,
  COUNT(r.id) FILTER (WHERE r.seminar = TRUE)::INT             AS seminar_count
FROM  members m
LEFT  JOIN referrals r ON r.recruiter_id = m.id
WHERE m.is_admin = FALSE
GROUP BY m.id
ORDER BY referral_count DESC, m.name ASC;

-- 기본 관리자
INSERT INTO members (member_no, name, email, password, is_admin)
VALUES ('0000', '관리자', 'admin@example.com', 'Admin1234!', TRUE);
