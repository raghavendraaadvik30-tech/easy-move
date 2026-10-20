# VidyaSetu — Karnataka SSLC Smart Learning

VidyaSetu is a React + TypeScript foundation for a bilingual Karnataka State Board Class 10 learning platform. It is maintained by CodeOrigin.AI and is designed for multiple schools sharing one application while keeping school-owned records isolated.

> **Pilot safety note:** local preview mode uses synthetic identities and browser-local progress. The learning notes and MCQs are original, source-aware material—not copied official papers. Configure Supabase, apply both migrations, complete teacher content verification and pass the isolation test matrix before connecting real users.

## Architecture

- **Frontend:** React, TypeScript, Vite, responsive CSS, mobile-first accessible layout.
- **Identity:** Supabase Auth through a small typed REST client. Passwords are sent only to the configured Supabase Auth endpoint and are never handled by application database tables.
- **Data:** PostgreSQL through Supabase, with tenant-aware foreign keys, indexes, constraints, and Row Level Security (RLS).
- **Authorization:** role and institution membership checks are performed in database policies; the client only controls presentation.
- **Content:** global published curriculum plus institution-owned drafts/custom content, keyed by academic year, subject, medium, chapter, topic, and question source.
- **Exams:** saved answers belong to an attempt, answer writes are allowed only while the server-side attempt is active, and objective scoring is performed by the `submit_exam` database function.

### Core relationships

`auth.users → profiles → institution_memberships → institutions` defines identity and tenant membership. `academic_years → subjects → chapters → topics → lessons` defines learning content. `questions → question_options` defines the question bank. `tests → test_questions → exam_attempts → saved_answers → results` defines examinations. Student-owned `bookmarks`, `revision_items`, and `study_progress` are keyed by `student_id` and protected by RLS. `audit_events` records sensitive actions.

## Folder structure

```text
.
├── src/
│   ├── App.tsx                  # Integrated role-aware application and learning flows
│   ├── main.tsx                 # React entrypoint
│   ├── styles.css               # Responsive visual system
│   ├── types.ts                 # Domain types
│   └── lib/
│       ├── access.ts            # Role presentation gates
│       ├── content.ts           # Curriculum catalog composition
│       ├── content-chapters.ts  # Mathematics and Science bilingual summaries
│       ├── content-more.ts      # Social Science, language, lessons, official links
│       ├── content-questions.ts # Original bilingual MCQ bank
│       ├── exam.ts              # Mock blueprint and absolute-deadline helpers
│       ├── store.ts             # Per-student local preview persistence
│       └── supabase.ts          # Typed Supabase Auth/PostgREST client
├── scripts/validate-content.ts  # Dependency-free integrity/security checks
├── supabase/
│   ├── migrations/20261020000000_initial_schema.sql
│   ├── migrations/20261020010000_exam_security_hardening.sql
│   ├── migrations/20261020020000_user_context_and_preferences.sql
│   └── seed.sql
├── docs/CONTENT_SOURCES.md
├── docs/TEST_CASES.md
├── .env.example
└── package.json
```

## Run locally from the beginning

Requirements: Node.js 20+ and npm 10+.

```bash
cd easy-move
cp .env.example .env.local
npm install
npm run dev
```

Open the Vite URL printed by the command. With blank/example environment variables, choose a synthetic Student, Teacher, or School administrator role. This mode uses no real accounts and is intended for UI review only.

Build and test the foundation with:

```bash
npm run test
npm run build
```

## Supabase setup

1. Use the configured project URL `https://kuyrvncypnfzerzpiqmq.supabase.co` and copy its browser-safe publishable/anon key from Supabase Dashboard → Project Settings → API. Do not put a service-role key in `.env.local` or frontend code.
2. Install the Supabase CLI and link the project, or open the SQL editor.
3. Apply all SQL migrations in filename order:
   - `supabase/migrations/20261020000000_initial_schema.sql`
   - `supabase/migrations/20261020010000_exam_security_hardening.sql`
   - `supabase/migrations/20261020020000_user_context_and_preferences.sql`
4. Apply `supabase/seed.sql` for synthetic academic years, subjects, chapters, and clearly non-official starter records.
5. Configure Supabase Auth email settings and the approved account recovery flow.
6. Create synthetic users through Auth, then create corresponding `profiles` and `institution_memberships` rows using a secure admin workflow or migration—not from a browser-provided role.
7. Copy `.env.example` to `.env.local`, replace `your-publishable-anon-key`, restart Vite, and test with at least two schools. Configure the same two variables in the GitHub-connected deployment environment.

The migrations enable RLS on all application tables, hide answer keys and unreleased marks, enforce one active attempt, use server deadlines, and release results only after the school enables release and the scheduled window closes. Use `docs/TEST_CASES.md` before any pilot. The current browser mock is deliberately labelled personal practice; scheduled school examinations still require client wiring to the supplied server RPCs.

## Deployment

Build with `npm run build` and deploy `dist/` to a static host such as Cloudflare Pages, Netlify, or Vercel static output. Configure the same two Vite environment variables in the host's build environment. Configure Supabase Auth redirect URLs for the deployed origin, enforce HTTPS, and set an explicit Content Security Policy and other security headers at the host.

Free-tier limits, email delivery limits, database quotas, backups, and future costs depend on the selected Supabase and hosting plans. Review those limits before enrollment. Enable database backups and perform a restoration rehearsal; record the date, owner, and result in the operations runbook.

## Current foundation vs. remaining work

Implemented here: responsive student-first shell; bilingual learning mode and Kannada answer options; six configurable subject areas; 72 chapter/skills summaries; 28 original bilingual MCQs; chapter progress; per-student bookmarks, revision and attempt history; a mixed-subject 20-question personal mock with immutable deadline recovery and submission confirmation; official KSEAB/KTBS resource links; Supabase password authentication; role-aware navigation; database schema, RLS and exam hardening; server start/submit/release functions; source register; dependency-free content/security checks and isolation checklist.

Before pilot: connect all screens to Supabase queries; wire the client to the server-side `start_exam` and `submit_exam` RPCs; add autosave retry/reconciliation; add teacher and school-admin CRUD screens; add model-answer review/versioning; verify each 2026–27 KSEAB syllabus item against official documents; obtain permissions or link instead of republishing copyrighted papers; add consent, retention/deletion, incident response, backup/restore, accessibility and performance evidence; review Indian child privacy/data-protection obligations with qualified counsel; add production security headers and monitoring.

No guarantee of marks or examination questions is made. Recommendations must remain based on observed practice performance, not unsupported predictions.

## Backup and restoration

For a real Supabase project, enable the plan's automated database backups and keep a second, encrypted export in the approved school-operations storage. Before each release, record a schema migration version and export configuration/content metadata without exporting unnecessary student PII. A restoration rehearsal should be performed in a separate staging project: restore the database snapshot, apply migrations in order, verify RLS with School A and School B accounts, verify Auth redirect settings, and only then promote the recovered project. Document the snapshot timestamp, operator, checks performed, and any lost-at-risk window. Do not place database dumps or Auth tokens in this repository.

## Troubleshooting

- **The demo role buttons do not appear:** remove `.env.local`, or leave both Vite Supabase variables blank. A configured project intentionally hides demo access.
- **Sign-in succeeds but the app remains unavailable:** confirm the Auth user has a `profiles` row and an active `institution_memberships` row. The Auth trigger creates the least-privileged profile, but school assignment still requires an approved workflow.
- **A school cannot see content:** confirm the row is `published`, its institution id is correct, the membership status is `active`, and the request uses the publishable key rather than a missing or service-only environment variable.
- **An answer cannot be saved:** check that the attempt is `in_progress`, the server `ends_at` has not passed, and the attempt belongs to the signed-in student. Never work around this with a client-side marks update.
- **The database migration fails:** apply it to a fresh staging project first, check that Supabase Auth is enabled, and apply migrations in filename order. Do not delete production tables to bypass a migration failure.
- **The Vite build cannot download packages in a restricted environment:** use an approved npm registry/cache in the deployment environment, then rerun `npm install`, `npm run test`, and `npm run build`. The source repository intentionally does not vendor dependencies.

### Browser dependency note

The frontend uses Supabase's documented Auth and PostgREST HTTP endpoints through `src/lib/supabase.ts` rather than bundling `@supabase/supabase-js`. This keeps the initial bundle and dependency surface smaller while preserving Supabase Auth, token refresh, RLS and the publishable-key security model. Access tokens are persisted for session restoration; production deployments must use strict CSP/security headers and avoid all untrusted script injection. No service-role credential belongs in the browser.
