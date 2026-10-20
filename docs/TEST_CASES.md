# VidyaSetu test cases

These cases are the minimum pilot checklist. Run them against a Supabase staging project with two synthetic schools (`School A`, `School B`) and synthetic accounts. Never use real student records in development.

| ID | Scenario | Expected result |
|---|---|---|
| AUTH-01 | Create a user through Supabase Auth and sign in with the publishable client key | Password is handled only by Supabase Auth; a session is created and refreshes securely. |
| AUTH-02 | Sign in with an invalid password repeatedly | Rate limiting/abuse controls apply and the UI shows a generic failure. |
| ROLE-01 | Student requests another student's profile, bookmarks, progress, or results | Request is denied by RLS; no data is returned. |
| ROLE-02 | Teacher views a class outside `teacher_assignments` | Request is denied; only assigned classes are visible. |
| ROLE-03 | School administrator reads and edits School A membership | Allowed for School A only. |
| ROLE-04 | School administrator attempts to assign a School B membership by changing the request body | Denied by `user_is_institution_admin` and membership RLS. |
| ROLE-05 | School administrator attempts to change a profile role to `platform_admin` | Denied by backend validation/RLS; no browser field is trusted. |
| TENANT-01 | Authenticated School A user selects a School B `institution_id` in a query | No School B rows are returned. |
| TENANT-02 | School A creates a question with School B's tenant id | Insert is rejected. |
| TENANT-03 | Platform admin reads both schools | Allowed and audited. |
| EXAM-01 | Student starts a published mock exam | Attempt is created with server timestamps and calculated end time. |
| EXAM-02 | Student edits an answer while `in_progress` | Answer upsert succeeds for that attempt only. |
| EXAM-03 | Student changes an answer after `ends_at` or after submission | RLS rejects the write. |
| EXAM-04 | Student calls `submit_exam` twice | First call stores the result; second call is rejected as no longer editable. |
| EXAM-05 | Browser changes marks in a request | No client marks are accepted; objective marks are calculated in the database RPC. |
| RECOVERY-01 | Disable network briefly after answering, then restore it | Client retry/reconciliation design must restore answers within the documented recovery window without duplicate rows. |
| PRIV-01 | Search the frontend bundle and network payloads | No service-role key, password, Aadhaar number, precise location, or unnecessary PII is present. |
| PRIV-02 | Delete/deactivate a synthetic student | Access is revoked and retention/deletion policy is recorded. |
| UI-01 | Use a 360px viewport and keyboard-only navigation | No horizontal overflow; focus is visible; buttons and form controls have readable labels. |

The `src/lib/access.test.ts` file covers the pure role-gating rules used by the foundation UI. Database/RLS cases require a real staging project because local demo mode is deliberately not a security boundary.

## Supabase connection and account-context checks

| ID | Scenario | Expected result |
|---|---|---|
| AUTH-03 | Auth user has a profile but no active institution membership | `get_current_user_context` denies access and the app signs out without entering a school workspace. |
| AUTH-04 | Membership status is `invited` or `suspended` | Login context is denied; institution data remains inaccessible. |
| AUTH-05 | User follows a valid password-recovery link and enters matching 8+ character passwords | Password updates through Supabase Auth, recovery tokens are removed from the URL, and the user returns to sign-in. |
| AUTH-06 | Student attempts to update their `role`, `full_name`, or another profile column via PostgREST | SQL column privileges reject the request; only `preferred_medium` is self-editable. |
| AUTH-07 | Two active memberships are inserted for one non-platform account | The `one_active_institution_per_user` unique index rejects the second active membership. |
| PREF-01 | Student switches English/Kannada rapidly | Local preference updates immediately and queued server writes preserve the final selection order. |
| CONFIG-01 | Project URL exists but the publishable key or migration is missing | UI says configuration is incomplete; it never claims that the database is online. |
