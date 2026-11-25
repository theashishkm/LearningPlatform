# Learning Hub implementation plan

PostgreSQL owns learning records. The Next.js server verifies the Supabase Auth user against the configured owner UUID before reading private records. Drizzle applies SQL migrations and parameterizes database queries. Google Sheets receives exports after explicit consent.

- [x] Local baseline: validate the portable data, apply the migration, import twice and check row isolation in embedded PostgreSQL.
- [ ] Hosted baseline: reconcile any newer source records, then run the migration and import twice in Supabase and verify owner sign-in, recovery and isolation.
- [ ] Assessment: implement the dashboard, subjects, quiz setup, immutable question snapshots, recoverable drafts, scoring and history.
- [ ] Browser verification: run an authenticated five-question attempt through save, refresh, submit and retry, then inspect persisted rows.
- [ ] Learning tools: implement topics, mistakes, vocabulary, study log, English quiz gating and recommendations.
- [ ] Integration: implement Google OAuth, export status and the private ChatGPT report.
- [ ] Release: verify responsive layouts and backup restoration before deploying to the owner's Vercel account.

## Historical migration

Retain the source files and store each source row alongside normalized columns. Empty dates and unavailable text stay unknown. Answer references use a stable composite legacy ID derived from attempt and question references. The 24.5/25 record carries points and a null correct count. The two aptitude diagnostics retain their original notes and require manual reconciliation. Repeat imports preserve the first imported copy. Reconcile newer source records separately before a live import.
