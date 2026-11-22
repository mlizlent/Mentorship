ALTER TABLE mentor_profiles
    DROP COLUMN IF EXISTS approved_for_minors,
    DROP COLUMN IF EXISTS approved_by,
    DROP COLUMN IF EXISTS approved_at;
