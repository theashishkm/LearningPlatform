# Learning Hub

A private Next.js App Router workspace for GATE DA 2027, CMI MSc Data Science, General Aptitude and English. See the [implementation plan](docs/implementation-plan.md) and [master specification](LEARNING_HUB_MASTER_SPEC.md).

## Set up and verify the baseline

1. Install Node.js 22 or later. Run `npm ci`, `npm test`, and `npm run typecheck`.
2. In a private Supabase project, disable public sign-ups and create the owner via Auth Users. Set or invite the owner to set a new password. Copy the user's UUID.
3. Copy `.env.example` to `.env.local`. Set the project URL and publishable key, the owner UUID, and the server-only PostgreSQL connection URI. Use the Supabase pooler connection if the direct connection is unavailable. Keep the URI and password out of chat, Git and client code.
4. Back up the source trackers and check whether they contain any progress newer than this handoff before importing to a live database. Run `npm run db:migrate` once and `npm run db:seed` twice. Each run verifies the owner-scoped historical counts inside its transaction.
5. Run `npm run dev`. Open the local URL shown in the terminal and sign in as the owner. Signed-out visits to `/dashboard` should redirect to `/login`.
6. For recovery, set `APP_URL` to the application origin and allow its `/recover/confirm` URL in Supabase. In the Reset Password email template, set the link target to `{{ .RedirectTo }}?token_hash={{ .TokenHash }}`. Verify delivery and password reset using the owner account.

The baseline suite runs the same migration and importer against an embedded PostgreSQL engine with test roles. Live Supabase sign-in requires a provisioned project and owner. The database schema is inaccessible to public client roles. Historical records are private and the repository containing the seed should stay private.

Run `npx playwright install chromium` and `npm run test:e2e` for the guest browser checks. To use an installed browser, set `PLAYWRIGHT_BROWSER_CHANNEL` to `chrome` or `msedge` before running the tests.

## Expand the question bank

After `npm run db:migrate` and `npm run db:seed`, run `npm run db:questions`.
The bundled expansion adds 200 original practice items per subject (five families of 40 variations) and six verified, reworded questions from GATE 2026 DA and CMI 2025 MSc Data Science. The original items are generated deterministically and carry editorial Easy, Medium or Hard ratings. The command reports counts by subject, origin and difficulty. Rerunning it preserves existing question IDs and content.

To import another reviewed batch, run `npm run db:questions -- path/to/questions.json`.
Provide a JSON array with `id`, `subject` (a subject code), `kind` (`MCQ`, `MSQ`, or `NAT`), `prompt`, `options`, `answer`, `explanation`, `difficulty`, `origin`, and `source`.
Use a letter for MCQ answers, a letter array for MSQ, and a decimal string with empty options for NAT. Use `original` for self-created questions, `internet` with a `sourceUrl` for other published questions, or `pyq` with `sourceUrl`, `sourceYear`, `sourceQuestionRef`, and `answerKeyUrl` after checking the official paper and key. Give each imported item a stable ID.

Official archives for future curation include [IIT Guwahati’s GATE archive](https://gate2026.iitg.ac.in/download.html), [GATE 2026 papers and keys](https://gate2026.iitg.ac.in/QPs-answer-keys.html), and [CMI’s past entrance papers](https://www.cmi.ac.in/admissions/syllabus.php).

## Deploy when the assessment flow is verified

Use a private Vercel repository connection and configure the same environment variables in the Vercel project. Apply migrations explicitly against the intended Supabase database before shipping changes that require them. Set Supabase Auth's site URL and allowed redirect URLs to the intended deployment. Verify owner sign-in and data isolation before exposing the app.
