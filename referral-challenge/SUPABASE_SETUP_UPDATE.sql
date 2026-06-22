-- mastership 컬럼 추가 (기존 DB에 추가할 경우)
ALTER TABLE members ADD COLUMN IF NOT EXISTS mastership TEXT DEFAULT '' CHECK (mastership IN ('', 'SM', 'DM', 'SRM', 'STM', 'RM', 'CM', 'IM'));
