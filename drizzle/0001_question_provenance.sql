ALTER TABLE learning.questions
  ADD COLUMN origin_type text NOT NULL DEFAULT 'original',
  ADD COLUMN source_url text,
  ADD COLUMN source_year integer,
  ADD COLUMN source_question_ref text,
  ADD COLUMN answer_key_url text,
  ADD CONSTRAINT question_origin CHECK (
    (origin_type = 'original' AND NOT verified_pyq AND source_url IS NULL AND source_year IS NULL
      AND source_question_ref IS NULL AND answer_key_url IS NULL)
    OR (origin_type = 'internet' AND NOT verified_pyq AND source_url IS NOT NULL)
    OR (origin_type = 'pyq' AND verified_pyq AND source_url IS NOT NULL AND source_year IS NOT NULL
      AND source_question_ref IS NOT NULL AND answer_key_url IS NOT NULL)
  ),
  ADD CONSTRAINT question_difficulty CHECK (difficulty IN ('Easy', 'Medium', 'Hard'));
--> statement-breakpoint
CREATE INDEX question_bank_filter_idx ON learning.questions (owner_id, subject_code, origin_type, difficulty);
--> statement-breakpoint
CREATE UNIQUE INDEX question_bank_source_ref_idx
  ON learning.questions (owner_id, origin_type, source, source_year, source_question_ref)
  WHERE origin_type = 'pyq';
