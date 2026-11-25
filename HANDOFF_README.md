# Learning Hub — Cursor/Codex Handoff

Created on **24 November 2026** from the current Floot project and the Google Sheets-backed historical snapshot.

## What to do in Cursor

1. Unzip this folder into a new project directory and open it in Cursor.
2. Open `CURSOR_CODEX_START_HERE.md` and give its entire contents to Codex (or tell Codex to read that file).
3. Codex should read `LEARNING_HUB_MASTER_SPEC.md` and the CSV/JSON seed data before writing application code.
4. Have Codex create the Next.js application, configure Supabase database/auth using your credentials, import the seed and test the end-to-end quiz experience.
5. Add Google Sheets synchronization after the database-backed app works. Never put service keys in client code.

## Contents

- `LEARNING_HUB_MASTER_SPEC.md`: complete product, architecture, features, current-state audit, data, API, migration, implementation phases, tests and acceptance requirements.
- `CURSOR_CODEX_START_HERE.md`: one copy-paste prompt that instructs Codex what to build, what to preserve and how to proceed.
- `data/seed-data.json`: actual prior snapshot of **12 subjects, 17 topics, 30 original questions, 18 historical tests, 18 attempts, 26 answer references and 26 mistake references**.
- `data/*.csv`: CSV views of those same collections for easier inspection/import.
- `reference_legacy_prototype/`: older standalone HTML and Apps Script implementation, **not** the current Floot code or a production backend. Use as UX/feature reference, not as secure production implementation.

## Known external sources

- Google Sheet (accessible through your Google account): https://docs.google.com/spreadsheets/d/17yAkNQCXgttKX8p5UeUr6KJEbvQ2M9H669KXvZTlNvE/edit
- Floot project ID: `bd863b42-0a22-4e7e-95f3-dd7299be0249`. The project was unpublished when this handoff was prepared.

## Data caution

Imported historic scores are a mixture of user-reported and previous assistant-evaluated records, some with caveats. The 30 starter questions are not verified official PYQs. A separate Floot database exists, but the seed snapshot matches its counts as of 24 November 2026; any later work there must be reconciled separately. Do not expose historical learning records or Google data publicly. No credentials are included.
