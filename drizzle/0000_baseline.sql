CREATE SCHEMA learning;
--> statement-breakpoint
REVOKE ALL ON SCHEMA learning FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE TABLE learning.tracks (
  code text PRIMARY KEY,
  name text NOT NULL
);
--> statement-breakpoint
INSERT INTO learning.tracks VALUES
  ('GATE_DA_2027', 'GATE DA 2027'), ('CMI_MSC_DS', 'CMI MSc Data Science'), ('ENGLISH', 'English');
--> statement-breakpoint
CREATE TABLE learning.subjects (
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  legacy_id text NOT NULL,
  name text NOT NULL,
  source_record jsonb NOT NULL,
  PRIMARY KEY (owner_id, legacy_id)
);
--> statement-breakpoint
CREATE TABLE learning.track_subjects (
  owner_id uuid NOT NULL,
  subject_code text NOT NULL,
  track_code text NOT NULL REFERENCES learning.tracks(code),
  PRIMARY KEY (owner_id, subject_code, track_code),
  FOREIGN KEY (owner_id, subject_code) REFERENCES learning.subjects(owner_id, legacy_id)
);
--> statement-breakpoint
CREATE TABLE learning.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  legacy_id text,
  subject_code text NOT NULL,
  unit text,
  name text NOT NULL,
  status text NOT NULL CHECK (status IN ('Not started', 'Learning', 'Practicing', 'Reviewing', 'Confident')),
  confidence numeric,
  notes text,
  last_studied_at timestamptz,
  next_review_at timestamptz,
  source_record jsonb,
  UNIQUE (owner_id, legacy_id),
  UNIQUE (owner_id, subject_code, id),
  FOREIGN KEY (owner_id, subject_code) REFERENCES learning.subjects(owner_id, legacy_id)
);
--> statement-breakpoint
CREATE TABLE learning.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  legacy_id text,
  subject_code text NOT NULL,
  topic_id uuid,
  kind text NOT NULL CHECK (kind IN ('MCQ', 'MSQ', 'NAT')),
  prompt text NOT NULL,
  options jsonb NOT NULL,
  answer_key jsonb NOT NULL,
  explanation text NOT NULL,
  source text NOT NULL,
  difficulty text NOT NULL,
  verified_pyq boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  source_record jsonb,
  UNIQUE (owner_id, legacy_id),
  FOREIGN KEY (owner_id, subject_code) REFERENCES learning.subjects(owner_id, legacy_id),
  FOREIGN KEY (owner_id, subject_code, topic_id) REFERENCES learning.topics(owner_id, subject_code, id)
);
--> statement-breakpoint
CREATE TABLE learning.tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  legacy_id text,
  subject_code text NOT NULL,
  title text NOT NULL,
  question_count integer NOT NULL CHECK (question_count > 0),
  recorded_date date,
  origin text NOT NULL,
  source_record jsonb,
  UNIQUE (owner_id, legacy_id),
  UNIQUE (owner_id, id),
  FOREIGN KEY (owner_id, subject_code) REFERENCES learning.subjects(owner_id, legacy_id)
);
--> statement-breakpoint
CREATE TABLE learning.attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  legacy_id text,
  test_id uuid NOT NULL,
  recorded_date date,
  correct_count integer,
  total_count integer NOT NULL CHECK (total_count > 0),
  attempted_count integer CHECK (attempted_count BETWEEN 0 AND total_count),
  earned_points numeric,
  max_points numeric,
  provenance_notes text,
  reconciliation_required boolean NOT NULL DEFAULT false,
  source_record jsonb,
  UNIQUE (owner_id, legacy_id),
  UNIQUE (owner_id, id),
  CHECK (correct_count IS NULL OR correct_count BETWEEN 0 AND attempted_count),
  FOREIGN KEY (owner_id, test_id) REFERENCES learning.tests(owner_id, id)
);
--> statement-breakpoint
CREATE TABLE learning.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  legacy_id text NOT NULL,
  attempt_id uuid NOT NULL,
  legacy_question_ref text NOT NULL,
  selected text,
  recorded_correct text,
  is_correct boolean,
  reflection text,
  source_record jsonb NOT NULL,
  UNIQUE (owner_id, legacy_id),
  UNIQUE (owner_id, legacy_question_ref, id),
  FOREIGN KEY (owner_id, attempt_id) REFERENCES learning.attempts(owner_id, id)
);
--> statement-breakpoint
CREATE TABLE learning.mistakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  legacy_id text,
  subject_code text NOT NULL,
  topic_id uuid,
  answer_id uuid,
  recorded_date date,
  legacy_question_ref text,
  category text CHECK (category IN ('Conceptual', 'Application', 'Calculation', 'Interpretation', 'Speed', 'Careless')),
  status text NOT NULL CHECK (status IN ('Open', 'Reviewing', 'Resolved')),
  description text,
  correct_approach text,
  source_record jsonb,
  UNIQUE (owner_id, legacy_id),
  FOREIGN KEY (owner_id, subject_code) REFERENCES learning.subjects(owner_id, legacy_id),
  FOREIGN KEY (owner_id, subject_code, topic_id) REFERENCES learning.topics(owner_id, subject_code, id),
  FOREIGN KEY (owner_id, legacy_question_ref, answer_id) REFERENCES learning.answers(owner_id, legacy_question_ref, id)
);
--> statement-breakpoint
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'subjects', 'track_subjects', 'topics', 'questions', 'tests', 'attempts', 'answers', 'mistakes'
  ] LOOP
    EXECUTE format('ALTER TABLE learning.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY owner_rows ON learning.%I TO authenticated USING ((SELECT auth.uid()) = owner_id) WITH CHECK ((SELECT auth.uid()) = owner_id)',
      table_name
    );
  END LOOP;
END $$;
