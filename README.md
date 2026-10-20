# VidyaSetu — Karnataka SSLC Smart Learning

VidyaSetu is a React + TypeScript foundation for a bilingual Karnataka State Board Class 10 learning platform. It is maintained by CodeOrigin.AI and is designed for multiple schools sharing one application while keeping school-owned records isolated.

> **Pilot safety note:** the local demo is a UI preview with synthetic content. It is not an authentication or authorization boundary. Configure Supabase and apply the migration before connecting real users or student data.

## Architecture

- **Frontend:** React, TypeScript, Vite, responsive CSS, mobile-first accessible layout.
- **Identity:** Supabase Auth. Passwords are never handled by this repository's database tables.
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
│   ├── App.tsx                 # Auth entry, role-aware shell, foundation screens
│   ├── main.tsx                # React entrypoint
│   ├── styles.css              # Responsive visual system
│   ├── types.ts                # Domain types
│   └── lib/
│       ├── access.ts           # Pure role gates used by UI
│       ├── demoData.ts         # Synthetic local preview data
│       ├── supabase.ts         # Publishable-key client configuration
│       └── access.test.ts       # Role gate tests
├── supabase/
│   ├── migrations/20261020000000_initial_schema.sql
│   └── seed.sql
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

1. Create a Supabase project and keep the project URL and publishable `anon` key available. Do not put a service-role key in `.env.local` or frontend code.
2. Install the Supabase CLI and link the project, or open the SQL editor.
3. Apply `supabase/migrations/20261020000000_initial_schema.sql`.
4. Apply `supabase/seed.sql` for synthetic academic years, subjects, chapters, and a clearly non-official source record.
5. Configure Supabase Auth email settings and the approved account recovery flow.
6. Create synthetic users through Auth, then create corresponding `profiles` and `institution_memberships` rows using a secure admin workflow or migration—not from a browser-provided role.
7. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`, restart Vite, and test with at least two schools.

The migration enables RLS on all application tables. Use the test matrix in `docs/TEST_CASES.md` before any pilot. A production exam-start RPC, answer reconciliation client, teacher moderation workflow, and verified content import should be completed before real examinations.

## Deployment

Build with `npm run build` and deploy `dist/` to a static host such as Cloudflare Pages, Netlify, or Vercel static output. Configure the same two Vite environment variables in the host's build environment. Configure Supabase Auth redirect URLs for the deployed origin, enforce HTTPS, and set an explicit Content Security Policy and other security headers at the host.

Free-tier limits, email delivery limits, database quotas, backups, and future costs depend on the selected Supabase and hosting plans. Review those limits before enrollment. Enable database backups and perform a restoration rehearsal; record the date, owner, and result in the operations runbook.

## Current foundation vs. remaining work

Implemented here: responsive student-first shell; bilingual UI toggle; local synthetic demo roles; login wiring for Supabase password auth; role-aware navigation; learning, practice, examination, performance, and settings views; database schema; RLS policies; objective scoring function; sample seed content; role tests and isolation checklist.

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
