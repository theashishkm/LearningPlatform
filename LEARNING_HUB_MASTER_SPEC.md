# Learning Hub — Complete Cursor/Codex Build Specification

**Snapshot:** 24 November 2026  
**Scope:** Personal learning platform for GATE Data Science & Artificial Intelligence (DA) 2027, CMI MSc Data Science entrance, General Aptitude, and English learning.  
**Owner:** One private learner in v1. Future classroom/multi-user functionality is optional and must not complicate v1.  
**Purpose:** Rebuild, maintain and extend the project in Cursor with Codex using a conventional source-controlled web application. Preserve previous and new learning records.

## 0. Core problem and non-negotiable design principle

ChatGPT is effective at explaining, creating practice questions, diagnosing weaknesses and planning revisions, but attempting long quizzes inside chat has had unreliable navigation/UI. **The website must own the deterministic workflow**: render questions, save drafts, grade according to explicit rules, show explanations, track mistake types, keep a permanent learning history, and make progress exportable to ChatGPT. ChatGPT is a tutor and analyst—not the test-taking UI or authoritative database.

**Golden rule: never lose an answer, never fabricate a historical question/score, and never move to tomorrow's English lesson if the last assigned quiz is unfinished.**

## 1. What actually exists as of this snapshot

### 1.1 Floot implementation, project `bd863b42-0a22-4e7e-95f3-dd7299be0249`

Built in Floot (React 19/TypeScript + CSS modules, Floot-auth, Floot-managed Postgres/Neon, Kysely, serverless endpoints):

- Private sign-in screen (`pages/login.tsx`) with password reset path. Owner's Floot user account was provisioned but still needs a password set via their own email; **do not import credentials**.
- Auth provider and admin-only route wrapper for the dashboard; server endpoints check the authenticated admin account.
- Responsive single-page dashboard with navy sidebar, cream/paper-white cards, periwinkle/blue accent; sections: **Dashboard, Practice tests, Test history, Mistakes log, Subjects & topics, Vocabulary**. Responsive layout for desktop and Samsung tablet/mobile.
- Practice UI for **MCQ (single answer), MSQ (multiple correct) and NAT (numerical)**. Subject selector, requested question count, question navigator, Previous/Next, flag, elapsed timer, answer review and explanations.
- Browser localStorage draft state for current practice (basic resume support; not yet a dependable server-backed draft system).
- Database snapshot endpoint to load subjects, topics, original questions, historical attempts, mistakes, vocabulary and study-log data.
- Transactional test-submission endpoint that validates questions against the database, computes correct-count scores on the server, creates test and attempt records, saves per-question answers and creates mistake records. Idempotency is attempted by reusing the attempt ID.
- Vocabulary-save endpoint.
- Database and initial records successfully provisioned and counted.
- TypeScript typecheck was reported clean; sign-in page visually/DOM checked.

**Important:** A real authenticated browser-to-backend full test submission has **not** been independently verified. The Floot project was **not published** at the most recent confirmed status. Do not describe it as live or production-tested.

### 1.2 Google Sheets tracker

Existing tracker: `https://docs.google.com/spreadsheets/d/17yAkNQCXgttKX8p5UeUr6KJEbvQ2M9H669KXvZTlNvE/edit`

Tabs: Dashboard, Subjects, Topics, QuestionBank, Tests, Attempts, Answers, Mistakes, StudyLog, Vocabulary, Guide, HistoricalSources.

The Sheets tracker contains the same historical seed copied to Floot. **The two are NOT synchronized**: the current Floot website saves its new data to Floot Postgres, not directly to Google Sheets. Google Drive being connected to ChatGPT enables on-demand reading when authorized, **not continuous automatic synchronization**. After moving to Cursor, choose **one primary database** and make Google Sheets a deliberate export/summary integration. Never assume silent cross-system consistency.

### 1.3 Preserved data counts (verified)

| Collection | Records | Remarks |
|---|---:|---|
| Subjects | 12 | DA, CMI-related and English tracks |
| Topics | 17 | Some are Practicing/Learning; unknown confidence remains null |
| Question bank | 30 | Newly authored **starter practice**, not verified PYQs |
| Historical tests | 18 | Date missing for many tests; preserve unknown |
| Historical attempts | 18 | Keep original fractional credit where present |
| Known individual answer/error records | 26 | Partial history; full question text unavailable for many |
| Historical mistake records | 26 | Unclassified errors should remain unclassified until reviewed |
| Vocabulary records | 0 | Feature UI/schema exist but no previously stored words |
| Study logs | 0 | Table and read API exist, no completed entry workflow |
| Authenticated website attempts verified | 0 | New-submit end-to-end testing still required |

The portable **`data/seed-data.json`** in this handoff is a historical snapshot captured from the earlier Sheets-backed prototype. It contains the above data and should be imported with idempotent upsert logic. Its status is a snapshot, not a live database export of later attempts.

## 2. Scope and subject taxonomy

Preserve these stable subject IDs; put tracks and subjects in separate entities so GATE DA, CMI, and English share relevant topics without creating duplicates.

| ID | Subject | Tracks |
|---|---|---|
| `LA` | Linear Algebra | GATE DA / CMI |
| `PROB` | Probability & Statistics | GATE DA / CMI |
| `CALC` | Calculus & Optimization | GATE DA |
| `APT` | General Aptitude | GATE DA, plus verbal reasoning |
| `PYDSA` | Programming & DSA | GATE DA / CMI |
| `DBMS` | DBMS & Data Warehousing | GATE DA |
| `ML` | Machine Learning | GATE DA |
| `AI` | Artificial Intelligence | GATE DA |
| `ENG-G` | English Grammar | English development |
| `ENG-V` | English Vocabulary | English development |
| `ENG-R` | Reading Comprehension | English development |
| `ENG-W` | English Writing | English development |

The 17 existing topic records include LA matrix rank/determinants/nullity, eigenvalues, systems, special matrices; probability events, Bayes/independence, counting/derangements, discrete RV; aptitude quant and logic; English parts of speech, verbs, subject–verb agreement, clauses, prepositions, comprehension and vocabulary. Do **not** mark the remainder of the syllabus completed. Add a full configurable topic tree after importing the verified baseline.

## 3. Recommended Cursor architecture (replace Floot-specific runtime)

Use one maintainable **Next.js App Router + TypeScript** monorepo for UI and server handlers; **PostgreSQL (Supabase-hosted is recommended)** for structured persistent data; **Supabase Auth** for single-owner sign-in; **Drizzle ORM or Prisma (pick one)** for schema/migrations; **Zod** for input schemas; **Tailwind CSS + shadcn/ui** for composable accessible UI; **KaTeX / react-katex** for proper mathematical typesetting; **Recharts** for progress charts; **Vitest** for grading/unit tests; **Playwright** for end-to-end tests; **Vercel or equivalent** for deployment.

Design notes:
- Use Supabase as the **authoritative store**, not Google Sheets plus Supabase as competing writable databases.
- All data rows are scoped to an authenticated user; enforce Postgres Row-Level Security (RLS) if clients use Supabase directly, and validate authorization in server handlers.
- Never put privileged service role keys or OpenAI API keys in client-side source or public environment variables.
- Do not require any AI model for deterministic basic functionality; tests must still work when AI features are unavailable.
- Use a repository-owned migration and seed strategy (repeatable, idempotent) and normal Git history.
- Avoid dependence on a Floot-only `@floot/*` module in the Cursor implementation.

Suggested architecture:

```text
Browser (Next.js React)
   | (authenticated HTTPS)
   v
Next.js server routes / actions  <--> PostgreSQL / Supabase Auth
   |                                   | subjects / topics / lessons
   |                                   | question bank / test snapshots
   |                                   | drafts / attempts / answers / mistakes
   |                                   | study logs / vocabulary / review schedule
   |
   +--> optional server-side OpenAI API (content generation)
   |
   +--> optional Google Sheets export/sync worker (explicit consent + OAuth)
   |
   +--> read-only progress report endpoint / secure MCP later
```

## 4. Information architecture and essential screens

### Dashboard `/dashboard`
- Today's study blocks and progress: planned, started, completed.
- **Outstanding quizzes** prominently shown; one-click resume. English gating: last incomplete quiz must be finished before new lesson is assigned.
- Subject cards, recent results, upcoming reviews, weak-topic recommendations, total practice and study time.
- Historical data vs live data visibly distinguishable. Historical scoring provenance displayed.
- Explicit last-sync time if Google Sheets export has been enabled, with failure indicators (never silently imply synced).

### Subjects `/subjects` and `/subjects/[id]`
- View GATE/CMI/English tracks and exact subject taxonomy.
- Topic hierarchy: Not started / Learning / Practicing / Reviewing / Confident.
- Last studied, next review, confidence (nullable, not invented), completed lessons, question volume, accuracy and recurring mistakes.
- Assign/topic selection, notes and revision scheduling.

### Lessons `/lessons`, `/lessons/[id]`
- Concept explanation, solved examples, key formulas, prerequisites, lesson version and optional reference links.
- Distinguish user-written/AI-generated/externally sourced content and verify before calling a question a genuine PYQ.
- Math content stored as structured text/Markdown+LaTeX, rendered correctly (A², A³, ℝ³, xᵢ, λ, matrices, fractions, probability notation).
- English definitions, contextual examples, small grammar rules, reading passage questions.
- `assigned -> in_progress -> pending_quiz -> completed` workflow.

### Quiz setup `/practice`
- Subject, topic(s), mode: practice / timed / diagnostic / revision / PYQ / mock; number of questions; difficulty; optional time limit; exam marking profile.
- Warn if bank has fewer questions than requested; never silently fabricate enough questions.
- Option to use only verified-source questions for PYQ mode, with year/exam/source metadata.

### Test runner `/attempts/[id]`
- MCQ radio options; MSQ checkboxes with all-selected validation; NAT numeric input supporting negative/decimal values and defined accepted range/tolerance; optional short-text questions graded manually or by rubrics.
- Forward/back navigation, question number grid, mark-for-review, answered/unanswered/flagged count, clear response, summary before submit.
- Timer may be disabled, elapsed or countdown (deadline enforced by backend if enabled).
- **Draft autosave** locally immediately, then reliably to server, with retry/backoff; status indicator: Saved / Saving / Offline / Retry. Browser reload, crash, refresh, tab switch should not erase answers.
- Persist ordered **question IDs and question versions** when starting a test; snapshot answer options and scoring metadata so later bank edits don't rewrite old tests.
- Server determines score on final submit; repeated submission or network retry must be idempotent.
- Do not send `correct_answer` or solution to the browser before submission in exam mode.

### Results `/attempts/[id]/results`
- Score by correct/incorrect/unattempted, points earned, total possible points, accuracy (define denominator), elapsed time, difficulty and topic breakdown.
- Per-question review: question as it appeared, selected answer, correct answer, explanation, solution steps, source. Mark uncertain/question feedback.
- Mistake classification: **Conceptual, Application, Calculation, Interpretation, Speed, Careless**; allow Unclassified until learner selects one.
- Ability to retry wrong questions, schedule revision, and compare with earlier attempts on same topic.

### Test history `/history`
- Chronological test history with filters for subject/track/topic/test-type/date.
- Preserve multiple attempts for the same test, previous score version, fractional historical points, and unknown actual dates.
- Every displayed historical result can expand to show *known* answers, caveats and provenance, but not fabricated reconstructed questions.

### Mistake log `/mistakes`
- Filters by type, subject, topic, date, severity, status (Open/Reviewing/Resolved).
- Correct reasoning and user's reflection, next review date, recurrence count, linked test/question.
- Trend highlighting recurring Probability arithmetic/simplification slips and grammar clause/adverb distinctions when supported by actual records.
- Keep original notes; editing a mistake must not destroy source history.

### Vocabulary `/vocabulary` and reading practice
- Word, meaning in context, pronunciation (optional), sentence from reading, learner's own sentence, source book/page, date, review date, mastery.
- Active recall / spaced-repetition review, easy import from a book passage, duplicate-detection and review frequency.

### Study planner `/planner`
- Weekly learning blocks, daily tasks, topic queues and deadline-aware recovery.
- User's known work constraints: weekdays **09:00–16:00**, evening meeting **19:30–20:00**; weekends comparatively free. These should be **editable preferences**, not permanent assumptions.
- English grammar routine around **09:40 daily**, with weekend cumulative/minitests; block generation of the next lesson when a prior assigned quiz remains unfinished. If needed, mark “lesson done—come back tomorrow” only after quiz completion.
- Adapt next practice based on recent errors and confidence, not generic syllabus rotations.

## 5. Database: entities and required fields

Use proper UUID primary keys for new app records, plus **`legacy_id` unique nullable** fields for imported tests/questions/attempts/mistakes. Keep provenance and original timestamps. Recommended logical tables:

- `users` / auth identity: owner and optional future collaborators.
- `tracks` (`GATE_DA_2027`, `CMI_MSC_DS`, `ENGLISH`) and `subjects` (stable codes above), `track_subjects`.
- `topics` (`id`, `subject_id`, `parent_id`, `title`, `status`, `confidence nullable`, `last_studied_at nullable`, `next_review_at nullable`, `notes`).
- `lessons` (`topic_id`, `title`, `content_md`, `content_latex`, `version`, `source`, `status`, `assigned_at`, `completed_at`, `quiz_required`).
- `questions` (`legacy_id`, `subject_id`, `topic_id`, `type`, `prompt_md`, `options_json`, `answer_key`, `answer_tolerance_json`, `solution_md`, `difficulty`, `origin_type`, `source_exam`, `source_year`, `source_url`, `verified`, `version`).
- `test_definitions` (`title`, `track`, `question_ids/version snapshots`, `exam_mode`, `time_limit`, `scoring_profile`, `source_type`, `is_historical`).
- `test_attempts` (`test_id`, `user_id`, `started_at`, `submitted_at`, `status`, `questions_assigned`, `answers_snapshot`, `correct_count`, `attempted_count`, `total_count`, `raw_score`, `max_marks`, `duration_sec`, `source`, `legacy_id`, `provenance_notes`).
- `draft_answers` (`attempt_id`, `question_id`, `selected_json`, `flagged`, `saved_at`, `revision`, unique attempt+question).
- `submitted_answers` (`attempt_id`, `question_id`, `answer_snapshot`, `correct_answer_snapshot`, `is_correct`, `marks`, `review_state`, unique attempt+question).
- `mistakes` (`attempt_id nullable`, `question_id or legacy_reference`, `subject_id`, `topic_id nullable`, `type nullable`, `description`, `correct_approach`, `next_review_at`, `status`, `source`, `legacy_id`).
- `study_sessions` (`user_id`, `subject_id`, `topic_id nullable`, `minutes`, `kind`, `questions_attempted`, `correct`, `notes`, `started_at`).
- `vocabulary` (`word`, `meaning`, `source_book`, `context`, `own_sentence`, `next_review_at`, `mastery`, `review_count`).
- `scheduled_assignments` (`user_id`, `lesson_id/test_id`, `assigned_for`, `status`, `completed_at`, `generation_reason`).
- `sync_jobs` and `integration_connections` for Google Sheet exports, with last success and error details.

**Data-quality:** preserve `attempted` vs `total` vs `earned_points`. Do not reinterpret 24.5/25 as 24.5 “questions correct”. Score percentage is earned points / maximum points where known; attempted-answer accuracy is correct count / attempted if such count is known. Store exam marks separately from correct counts. A historical test may have no question text.

## 6. Grading and test integrity requirements

Provide a pure `gradeAttempt(testSnapshot, submittedAnswers, profile)` module with unit tests.

- MCQ: exactly one selected option; default original-practice scoring 1 point correct, 0 otherwise.
- MSQ: selected-set equality for exact-correct mode; preserve deterministic option order; no accidental partial credit unless profile explicitly enables it.
- NAT: parse finite decimal/negative number; use per-question accepted interval or absolute/relative tolerance, not arbitrary substring matches.
- Text answers: keep pending human or explicitly documented rubric evaluation; never claim exact-auto-grading works for free-text simply by string equality.
- GATE-style exam profiles: configurable 1-mark/2-mark questions, optional MCQ negative marking and separate MSQ/NAT rules. Verify the target year's official exam rules before hardcoding values. Keep practice scoring separate from exam scoring.
- Unattempted vs incorrect must be distinct in analytics (both may score zero but are not the same learning signal).
- Backend decides marks; browser cannot supply its own trusted score.
- Use stable question snapshots: editing/deleting a bank item must not change historical results.

## 7. Historical data migration (critical)

**Included files:** `data/seed-data.json`, and CSVs for subjects/topics/questions/tests/attempts/answers/mistakes. These contain a historical snapshot; import only after checking for any *new* live progress since the snapshot. Current verified Floot database still matches these counts, but do not assume future sessions do.

Migration algorithm:

1. Back up the seed file, Google Sheet and any separately exported Floot data before writing.
2. Create auth user via new application's sign-up flow. Do NOT copy or hash-import the old Floot password/JWT/session/secret.
3. Insert 12 subjects using stable codes, then 17 topics and 30 questions with `legacy_id`.
4. Insert 18 historical tests and 18 attempts, maintaining exact original scores/attempted/total and nullable dates.
5. Import 26 known answer records and 26 mistake records; historical `question_id` may be a **textual reference with no matching question bank row**. Do not require fake question objects: model `legacy_question_ref` separately.
6. Keep partial-credit score 24.5/25, all user-reported scores, and the `Original starter practice` question label.
7. Store provenance `Historical conversation`, `User-reported`, `Assistant-evaluated` and any caveat fields; don't label all history as officially verified examinations.
8. Use upsert unique constraints on `legacy_id` so migration can be safely rerun.
9. Validate counts and score sums (see acceptance tests). Do not append the same 18 imported tests twice.
10. Separately reconcile any newer results in Floot or Google Sheet by immutable IDs and latest recorded timestamps; a human reviews ambiguities. Never silently overwrite two differing scores.

**Known inconsistencies requiring review:** General Aptitude Diagnostic 1 is stored as **9/10** while an imported provenance note mentions **13/15**; Diagnostic 2 is stored as **7/10** while notes mention **9/15**. Keep the existing values and provenance, mark for manual reconciliation, and do **not** force one to replace the other. Similarly, Linear Algebra Mixed Set is **3 correct of 9 attempted, 10 questions assigned**. History contains no original full text for many incorrect questions; dates of many English lesson attempts are unknown. The total historical correct-count/points metrics must not be presented as a high-confidence universal measure of mastery.

### Selected recent verified/user-reported English scores

- Lesson 15: **7/10**; wrong Q1 (B → C), Q4 (A → B), Q8 (A → B).
- Lesson 16: **6/8**; wrong Q4 (A → D), Q7 (B → A).
- Lesson 17 cumulative: **12/15**; wrong Q6 (B → C), Q11 (A → B), Q13 (B → A).
- Lesson 18: **7/8**; wrong Q7 (D → C).
- Saturday mini revision: **4/5**; wrong Q2 (B → A).

The arrow means *selected answer → recorded correct option*, not a reconstructed question. The exact question text remains unavailable unless separately provided later.

Other important prior learning signals: 40 reported LA rank/determinant/nullity practice questions; 60 eigenvalue questions completed (neither is a verified test score); recurring Probability arithmetic and fraction simplification errors even when Bayes setup is correct. Preserve as topic/practice notes, not imaginary test results.

## 8. Learning intelligence / adaptive planner

No opaque AI recommendation should be mandatory for an ordinary quiz. First implement an inspectable deterministic recommender:

1. Assign priority to unfinished required lessons/tests.
2. Prioritize due/repeated mistakes and low-confidence topics.
3. Use the last 10–20 questions per topic (exclude invalid/unscored historical questions) for performance estimation; label insufficient sample size.
4. Schedule a mix of repair (wrong question concept), fresh application and spaced review.
5. Recommend limited, manageable next sessions rather than new topics after every small quiz.
6. Respect chosen target exam, user's editable weekday and weekend availability.
7. For English, **block new lesson until previous assigned quiz is completed**. On missed quiz: send reminder/resume link, not a fresh topic.
8. Provide explanation for each suggestion: “3 recent errors in clauses; revisit before Lesson 19”.

Optional later: use a server-side LLM to create candidate questions/explanations and lesson plans, requiring versioning, validation, duplication checks, source attribution, and approval before inserting to a verified exam bank. An AI-generated item must never be labeled as a genuine PYQ without reliable sourcing.

## 9. ChatGPT and Google integrations: realistic implementation

### Phase A — reliable, low-complexity connection

Implement **Google Sheets export of progress summaries** from the database: test ID/date/subject/score, topic progress, mistake type/status and due reviews. Use Google OAuth 2.0 with user consent and limited scopes. Existing tracker URL above; a separate export sheet or dedicated tabs is safer than overwriting historical records. Maintain an export watermark (`last_synced_at`, row count, checksum, errors). ChatGPT with Google Drive connected can read the exported Sheet **on demand** when the user asks for analysis.

### Phase B — tighter ChatGPT connection (optional)

Build a **read-only private MCP server / authenticated application integration** exposing `get_progress_summary`, `get_recent_attempts`, `get_due_reviews`, `get_mistake_patterns`, `get_topic_mastery`. If product/app access supports it, explicitly authorize it in ChatGPT. This is **not** automatic access to ChatGPT's private memory or chats. Avoid public unauthenticated endpoints.

### Phase C — AI in the website (optional, paid separately)

Use the OpenAI API server-side for new lessons, QA and personalized explanations; store generated items with provenance and quality checks. A ChatGPT Plus subscription does not itself cover API usage. AI should not grade scored objective questions client-side.

Never promise always-on ChatGPT monitoring without an independently configured automation/service. Export sync can be scheduled server-side; ChatGPT access is still according to connector permissions.

## 10. Known gaps and technical debt in existing Floot code

The Cursor implementation should **not blindly port these defects**:

- Source `pages/_index.tsx` is one large component. Split into route pages and typed components/hooks/services.
- Dashboard's next-review suggestions are static placeholders, not computed recommendations.
- Current read endpoint returns correct answers and explanations for all questions **before** the user submits. For real exam mode use a sanitized question payload and server-side review after submission.
- Quiz autosave is localStorage-only; drafts are not saved server-side per question. Implement durable drafts and offline retry.
- Current UI shows an **elapsed timer**, not an optionally configurable countdown/deadline-enforced timer.
- Existing app uses correct-answer counts only, not official GATE negative marks or separate mark values.
- Current test selection simply takes the first N questions; no randomization, topic blueprint, difficulty mix or duplicate/recency controls.
- Current UI does not implement full study-log creation, editing topic mastery, assigning lessons, next-review updates, or AI-generated questions.
- The `mistakes` UI shows the imported records but lacks editing/classification workflows.
- Some subject sections lack sample questions: the UI disables starting rather than providing new materials.
- A successful test submission refreshes Floot Postgres only. Google Sheet **does not update automatically**.
- Error classification is optional and not yet integrated into a structured per-question review form.
- Incomplete tests do not have server-owned stable test snapshots; changing question bank mid-test needs to be safe.
- Snapshot endpoints return a large combined payload and use generic errors; implement paginated and scoped APIs with precise codes.
- Single-account admin restriction is deliberate for v1, but prevent self-registering guests from seeing private data. Use RLS.
- No complete authenticated e2e tests, production deployment, backup restore drill, or integration tests were confirmed.

## 11. Proposed API/server routes

| Method / path | Purpose |
|---|---|
| `GET /api/me` | Current authenticated user/preferences |
| `GET /api/dashboard` | Counts, unfinished tasks, due reviews, analytics |
| `GET /api/subjects`, `GET /api/subjects/:id/topics` | Subject and topic index |
| `GET /api/questions?subject=&topic=&type=` | Admin/author question management (never expose answer keys to test runner) |
| `POST /api/attempts` | Create server-owned attempt + immutable question snapshot |
| `GET /api/attempts/:id` | Sanitized pending attempt state |
| `PATCH /api/attempts/:id/draft` | Idempotent per-question answer/flag save with revision number |
| `POST /api/attempts/:id/submit` | Transactional server-side grading, exact-once finalization |
| `GET /api/attempts/:id/results` | Reveal answers only once authorized and submitted |
| `GET /api/history` | Paginated, filtered attempts including historical entries |
| `GET /api/mistakes`, `PATCH /api/mistakes/:id` | Review/categorize/resolve mistake |
| `GET/POST /api/vocabulary` | Add/list words; later review scheduling |
| `GET/POST /api/study-sessions` | Time and question-practice logs |
| `GET /api/recommendations` | Deterministic due-practice recommendations |
| `GET/POST /api/integrations/google/sync` | Authenticated export-status / approved sync |
| `GET /api/reports/chatgpt` | Sanitized structured progress summary for export/MCP |

Use Zod on all inputs, authenticated endpoints, rate limits on write operations, CSRF protection appropriate to auth mechanism, and consistent API error format. Strong DB uniqueness constraints for idempotency.

## 12. Suggested repository layout

```text
learning-hub/
├── README.md
├── .env.example                    # placeholders only, no secrets
├── docs/
│   ├── product-spec.md
│   ├── migration-and-provenance.md
│   ├── testing.md
│   └── architecture-decisions.md
├── data/
│   ├── seed-data.json              # supplied in this handoff
│   └── *.csv                       # supplied in this handoff
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (app)/dashboard/page.tsx
│   │   ├── (app)/subjects/[id]/page.tsx
│   │   ├── (app)/practice/page.tsx
│   │   ├── (app)/attempts/[id]/page.tsx
│   │   ├── (app)/attempts/[id]/results/page.tsx
│   │   ├── (app)/history/page.tsx
│   │   ├── (app)/mistakes/page.tsx
│   │   ├── (app)/vocabulary/page.tsx
│   │   ├── (app)/planner/page.tsx
│   │   └── api/...
│   ├── components/{layout,quiz,results,progress,math}/
│   ├── lib/{auth,db,grading,adaptive,sync,math,validation}/
│   ├── server/{repositories,services}/
│   └── types/
├── supabase/migrations/           # or chosen ORM migrations
├── scripts/import-historical.ts
└── tests/{unit,integration,e2e}/
```

## 13. Phase-by-phase implementation order

### Phase 0 — establish baseline (must happen before new UI)
- Initialize Git repository and Next.js/TypeScript; decide DB ORM; add lint/format/test scripts.
- Inspect seed JSON and this specification. Run seed-data schema checks; generate original `legacy_id` mappings.
- Create secure auth and migrations, implement idempotent import, verify exact record counts.
- Write architecture decision record: Postgres source of truth; Sheets export secondary.

### Phase 1 — reliable assessment MVP (highest priority)
- Layout, subject selector, test setup; proper KaTeX math renderer.
- Backend creates attempt snapshots and sanitizes exam question payloads.
- Question runner with MSQ/MCQ/NAT, flags, navigator, time, immediate + server autosave, recovery after refresh/reconnect.
- Transactional grading and submission; results + explanations + stored answers.
- History page with 18 imported assessments and new attempts. No placeholder metrics presented as real.
- Tests: MCQ/MSQ/NAT scoring, duplicate submit, offline/resume, unauthorized access, history integrity.
- **Stop and verify one real end-to-end attempt before adding AI features.**

### Phase 2 — complete progress tracking
- Topic progress management, mistake editing/classification, study log, vocabulary review and due-review planner.
- Charts and subject-level analytics; sample size warnings; structured suggested next session.
- English 09:40 routine and strict incomplete-quiz gating; weekend tests.

### Phase 3 — integration
- User-authorized Google Sheets export/sync with logging and mismatch alerts.
- ChatGPT read-only report/MCP interface if desired and supported.
- Question bank authoring/import with source authenticity and version control.

### Phase 4 — optional enhancements
- AI candidate question/lesson generation with human verification and cost limits.
- Verified GATE/CMI PYQ library, mock test blueprints and GATE-specific marking profile.
- Offline PWA polish, PDF exports, calendar/reminder automation, tablet stylus-friendly math note-taking.

## 14. Acceptance criteria before declaring production-ready

1. Local and deployed app can sign in only as an authorized account, including password recovery. No guest can read progress or answer keys.
2. Fresh seed import creates exactly 12 subjects / 17 topics / 30 original questions / 18 tests / 18 attempts / 26 known answer records / 26 mistakes; second import changes no counts.
3. English L17 12/15, L18 7/8, Saturday revision 4/5, and historical 24.5/25 display exactly. LA test displays **3/9 attempted of 10 assigned**.
4. All old dates unknown remain null. The two GA diagnostic conflicts remain clearly flagged for reconciliation; no silent replacement.
5. A 5-question quiz can be started, refreshed, resumed, flagged, answered, and submitted without losing any selection.
6. MCQ, MSQ, NAT and unattempted responses are graded deterministically in the backend; correct options aren't leaked before exam submission.
7. One submission creates exactly one attempt, N submitted answers and appropriate mistakes. Double-click/retry creates no duplicates.
8. Submitting while offline shows recoverable retry state, not a false “Saved” message; local draft survives browser restart.
9. Question version changes after an attempt are invisible to historical result snapshots.
10. Mistake categorization can be edited and survives refresh; English next lesson remains locked until current assignment is complete.
11. Dashboard summaries equal database aggregates; confidence not fabricated from unknown data; accuracy and marks are named unambiguously.
12. No Google integration is marked Connected unless OAuth is complete and a sync successfully finished; connector read access is on-demand.
13. Mobile and tablet layouts are tested; keyboard navigation, focus states, semantic forms and accessible question labels work.
14. Vitest unit/integration suite and Playwright critical journey pass. Public production deploy is held until privacy/security checklist passes.
15. A backup/export and restore test can recreate all historical and new attempts.

## 15. Working artifacts and provenance

- Existing Google Sheet: `https://docs.google.com/spreadsheets/d/17yAkNQCXgttKX8p5UeUr6KJEbvQ2M9H669KXvZTlNvE/edit`
- Floot project identifier: `bd863b42-0a22-4e7e-95f3-dd7299be0249` (private, **unpublished** at snapshot time; platform-specific source cannot be assumed checked into Cursor).
- Included `data/seed-data.json` and CSVs: actual known historical snapshot and practice question bank.
- Included `reference_legacy_prototype/`: older Google Apps Script + standalone HTML implementation for feature/UI reference; **not** the latest Floot implementation and **not** a complete Next.js scaffold. Review only; do not publish its open endpoints blindly.

**Do not reuse an old sandbox preview as a production URL.** Use the seed data and requirements in this handoff to create a conventional, fully tested application, then deploy to an account controlled by the user.
