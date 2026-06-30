-- mastership 컬럼에 'NONE' 값 허용 (No Mastership 옵션)
-- 기존 CHECK 제약조건을 삭제하고 재생성합니다.

ALTER TABLE members DROP CONSTRAINT IF EXISTS members_mastership_check;

ALTER TABLE members
  ADD CONSTRAINT members_mastership_check
  CHECK (mastership IN ('', 'NONE', 'SM', 'DM', 'SRM', 'STM', 'RM', 'CM', 'IM'));
