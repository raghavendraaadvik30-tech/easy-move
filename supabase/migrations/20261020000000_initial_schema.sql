-- VidyaSetu foundation schema
-- Apply with Supabase CLI or the SQL editor. This migration intentionally contains
-- no real student data and never stores passwords; Supabase Auth owns credentials.
create extension if not exists pgcrypto;

create type public.app_role as enum ('student', 'teacher', 'school_admin', 'platform_admin');
create type public.medium_code as enum ('kannada', 'english');
create type public.question_type as enum ('mcq', 'one_mark', 'very_short', 'short_answer', 'long_answer', 'fill_blank', 'match', 'true_false', 'numerical', 'diagram', 'grammar', 'writing');
create type public.difficulty_level as enum ('easy', 'medium', 'hard');
create type public.content_status as enum ('draft', 'review', 'published', 'archived');
create type public.attempt_status as enum ('in_progress', 'submitted', 'expired', 'cancelled');

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  logo_url text,
  theme jsonb not null default '{}'::jsonb,
  enabled_features jsonb not null default '{"practice": true, "mock_exams": true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  role public.app_role not null default 'student',
  preferred_medium public.medium_code not null default 'english',
  class_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.institution_memberships (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  created_at timestamptz not null default now(),
  unique (institution_id, user_id),
  check (role <> 'platform_admin' or status = 'active')
);

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  starts_on date not null,
  ends_on date not null,
  is_current boolean not null default false,
  check (ends_on > starts_on)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_en text not null,
  name_kn text not null,
  is_language boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.institution_subjects (
  institution_id uuid not null references public.institutions(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  enabled boolean not null default true,
  primary key (institution_id, subject_id)
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id),
  subject_id uuid not null references public.subjects(id),
  institution_id uuid references public.institutions(id) on delete cascade,
  chapter_number integer not null check (chapter_number > 0),
  title_en text not null,
  title_kn text not null,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  unique (academic_year_id, subject_id, institution_id, chapter_number)
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  title_en text not null,
  title_kn text not null,
  sort_order integer not null default 0,
  unique (chapter_id, sort_order)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  institution_id uuid references public.institutions(id) on delete cascade,
  title_en text not null,
  title_kn text not null,
  body_en text not null,
  body_kn text not null,
  examples jsonb not null default '[]'::jsonb,
  key_points jsonb not null default '[]'::jsonb,
  status public.content_status not null default 'draft',
  version integer not null default 1,
  reviewer_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_sources (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  source_year integer,
  source_url text,
  source_kind text not null check (source_kind in ('official_previous_year', 'official_model_paper', 'original_practice', 'school_authored')),
  verification_note text,
  verified_by uuid references public.profiles(id),
  verified_at timestamptz
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id),
  subject_id uuid not null references public.subjects(id),
  chapter_id uuid references public.chapters(id),
  topic_id uuid references public.topics(id),
  institution_id uuid references public.institutions(id) on delete cascade,
  medium public.medium_code not null,
  question_type public.question_type not null,
  difficulty public.difficulty_level not null default 'medium',
  marks numeric(5,2) not null check (marks > 0),
  prompt text not null,
  prompt_translation text,
  answer_key text,
  explanation text,
  explanation_translation text,
  model_answer text,
  marking_points jsonb not null default '[]'::jsonb,
  source_id uuid references public.question_sources(id),
  status public.content_status not null default 'draft',
  content_version integer not null default 1,
  reviewer_id uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_key text not null check (option_key in ('A', 'B', 'C', 'D')),
  option_text text not null,
  option_translation text,
  sort_order integer not null,
  unique (question_id, option_key),
  unique (question_id, sort_order)
);

create table public.tests (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id),
  title text not null,
  description text,
  duration_seconds integer not null check (duration_seconds between 60 and 86400),
  total_marks numeric(7,2) not null check (total_marks > 0),
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  status public.content_status not null default 'draft',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (scheduled_end is null or scheduled_start is null or scheduled_end > scheduled_start)
);

create table public.test_questions (
  test_id uuid not null references public.tests(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  position integer not null check (position > 0),
  marks numeric(5,2) not null check (marks > 0),
  primary key (test_id, question_id),
  unique (test_id, position)
);

create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id),
  student_id uuid not null references public.profiles(id),
  attempt_number integer not null default 1 check (attempt_number > 0),
  status public.attempt_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  submitted_at timestamptz,
  objective_marks numeric(7,2) not null default 0,
  total_marks numeric(7,2),
  unique (test_id, student_id, attempt_number)
);

create table public.saved_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.exam_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  answer_text text,
  selected_option_key text check (selected_option_key is null or selected_option_key in ('A', 'B', 'C', 'D')),
  is_marked_for_review boolean not null default false,
  saved_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.exam_attempts(id) on delete cascade,
  student_id uuid not null references public.profiles(id),
  marks numeric(7,2) not null default 0,
  accuracy numeric(5,2) not null default 0,
  topic_breakdown jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now()
);

create table public.bookmarks (
  student_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, question_id)
);

create table public.revision_items (
  student_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  reason text not null default 'incorrect_answer',
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  primary key (student_id, question_id)
);

create table public.study_progress (
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  last_viewed_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (student_id, lesson_id)
);

create table public.teacher_assignments (
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  class_name text not null,
  subject_id uuid references public.subjects(id),
  primary key (teacher_id, institution_id, class_name, subject_id)
);

create table public.institution_customizations (
  institution_id uuid primary key references public.institutions(id) on delete cascade,
  welcome_message text,
  dashboard_config jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  title text not null,
  body text not null,
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index memberships_user_idx on public.institution_memberships(user_id, status);
create index memberships_institution_idx on public.institution_memberships(institution_id, status);
create index chapters_lookup_idx on public.chapters(academic_year_id, subject_id, institution_id, status);
create index questions_lookup_idx on public.questions(subject_id, chapter_id, topic_id, institution_id, status);
create index attempts_student_idx on public.exam_attempts(student_id, started_at desc);
create index audit_institution_idx on public.audit_events(institution_id, created_at desc);

create or replace function public.user_is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'platform_admin');
$$;

create or replace function public.user_has_institution_access(target_institution uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.user_is_platform_admin() or exists (
    select 1 from public.institution_memberships
    where user_id = auth.uid() and institution_id = target_institution and status = 'active'
  );
$$;

create or replace function public.user_is_institution_admin(target_institution uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.user_is_platform_admin() or exists (
    select 1 from public.institution_memberships
    where user_id = auth.uid() and institution_id = target_institution and role = 'school_admin' and status = 'active'
  );
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

create trigger institutions_updated_at before update on public.institutions for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger lessons_updated_at before update on public.lessons for each row execute function public.set_updated_at();
create trigger questions_updated_at before update on public.questions for each row execute function public.set_updated_at();

alter table public.institutions enable row level security;
alter table public.profiles enable row level security;
alter table public.institution_memberships enable row level security;
alter table public.academic_years enable row level security;
alter table public.subjects enable row level security;
alter table public.institution_subjects enable row level security;
alter table public.chapters enable row level security;
alter table public.topics enable row level security;
alter table public.lessons enable row level security;
alter table public.question_sources enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.saved_answers enable row level security;
alter table public.results enable row level security;
alter table public.bookmarks enable row level security;
alter table public.revision_items enable row level security;
alter table public.study_progress enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.institution_customizations enable row level security;
alter table public.announcements enable row level security;
alter table public.audit_events enable row level security;

create policy institution_members_read on public.institutions for select using (public.user_has_institution_access(id));
create policy platform_institution_manage on public.institutions for all using (public.user_is_platform_admin()) with check (public.user_is_platform_admin());
create policy profile_self_or_same_school_read on public.profiles for select using (id = auth.uid() or exists (select 1 from public.institution_memberships m where m.user_id = profiles.id and public.user_has_institution_access(m.institution_id)));
create policy profile_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy membership_read_own_school on public.institution_memberships for select using (user_id = auth.uid() or public.user_has_institution_access(institution_id));
create policy membership_admin_manage on public.institution_memberships for all using (public.user_is_institution_admin(institution_id)) with check (public.user_is_institution_admin(institution_id));
create policy public_academic_year_read on public.academic_years for select using (auth.uid() is not null);
create policy public_subject_read on public.subjects for select using (auth.uid() is not null);
create policy institution_subject_read on public.institution_subjects for select using (public.user_has_institution_access(institution_id));
create policy institution_subject_admin on public.institution_subjects for all using (public.user_is_institution_admin(institution_id)) with check (public.user_is_institution_admin(institution_id));
create policy chapter_read on public.chapters for select using (status = 'published' and (institution_id is null or public.user_has_institution_access(institution_id)));
create policy chapter_manage on public.chapters for all using (institution_id is not null and public.user_is_institution_admin(institution_id)) with check (institution_id is not null and public.user_is_institution_admin(institution_id));
create policy topic_read on public.topics for select using (exists (select 1 from public.chapters c where c.id = chapter_id));
create policy lesson_read on public.lessons for select using (status = 'published' and (institution_id is null or public.user_has_institution_access(institution_id)));
create policy lesson_manage on public.lessons for all using (institution_id is not null and public.user_is_institution_admin(institution_id)) with check (institution_id is not null and public.user_is_institution_admin(institution_id));
create policy question_source_read on public.question_sources for select using (auth.uid() is not null);
create policy question_read on public.questions for select using (status = 'published' and (institution_id is null or public.user_has_institution_access(institution_id)));
create policy question_manage on public.questions for all using (institution_id is not null and public.user_has_institution_access(institution_id)) with check (institution_id is not null and public.user_has_institution_access(institution_id));
create policy question_options_read on public.question_options for select using (exists (select 1 from public.questions q where q.id = question_id));
create policy question_options_manage on public.question_options for all using (exists (select 1 from public.questions q where q.id = question_id and q.institution_id is not null and public.user_has_institution_access(q.institution_id))) with check (exists (select 1 from public.questions q where q.id = question_id and q.institution_id is not null and public.user_has_institution_access(q.institution_id)));
create policy test_read on public.tests for select using (status = 'published' and (institution_id is null or public.user_has_institution_access(institution_id)));
create policy test_manage on public.tests for all using (institution_id is not null and public.user_is_institution_admin(institution_id)) with check (institution_id is not null and public.user_is_institution_admin(institution_id));
create policy test_question_read on public.test_questions for select using (exists (select 1 from public.tests t where t.id = test_id));
create policy test_question_manage on public.test_questions for all using (exists (select 1 from public.tests t where t.id = test_id and t.institution_id is not null and public.user_is_institution_admin(t.institution_id))) with check (exists (select 1 from public.tests t where t.id = test_id and t.institution_id is not null and public.user_is_institution_admin(t.institution_id)));
create policy attempt_student_read on public.exam_attempts for select using (student_id = auth.uid() or public.user_has_institution_access((select institution_id from public.tests where id = test_id)));
create policy attempt_student_insert on public.exam_attempts for insert with check (student_id = auth.uid() and exists (select 1 from public.tests t where t.id = test_id and t.status = 'published'));
create policy answer_student_read_write on public.saved_answers for all using (exists (select 1 from public.exam_attempts a where a.id = attempt_id and a.student_id = auth.uid() and a.status = 'in_progress' and now() < a.ends_at)) with check (exists (select 1 from public.exam_attempts a where a.id = attempt_id and a.student_id = auth.uid() and a.status = 'in_progress' and now() < a.ends_at));
create policy result_student_read on public.results for select using (student_id = auth.uid() or public.user_has_institution_access((select institution_id from public.tests t join public.exam_attempts a on a.test_id = t.id where a.id = attempt_id)));
create policy bookmark_student_own on public.bookmarks for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy revision_student_own on public.revision_items for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy progress_student_own on public.study_progress for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy assignment_read on public.teacher_assignments for select using (teacher_id = auth.uid() or public.user_is_institution_admin(institution_id));
create policy assignment_admin_manage on public.teacher_assignments for all using (public.user_is_institution_admin(institution_id)) with check (public.user_is_institution_admin(institution_id));
create policy customization_read on public.institution_customizations for select using (public.user_has_institution_access(institution_id));
create policy customization_admin_manage on public.institution_customizations for all using (public.user_is_institution_admin(institution_id)) with check (public.user_is_institution_admin(institution_id));
create policy announcement_read on public.announcements for select using (institution_id is null or public.user_has_institution_access(institution_id));
create policy announcement_admin_manage on public.announcements for all using (institution_id is not null and public.user_is_institution_admin(institution_id)) with check (institution_id is not null and public.user_is_institution_admin(institution_id));
create policy audit_admin_read on public.audit_events for select using (public.user_has_institution_access(institution_id));
create policy audit_insert_authenticated on public.audit_events for insert with check (actor_id = auth.uid() and (institution_id is null or public.user_has_institution_access(institution_id)));

-- Production exam clients should call these RPCs instead of writing attempt status or marks.
create or replace function public.submit_exam(p_attempt_id uuid)
returns public.exam_attempts language plpgsql security definer set search_path = public as $$
declare
  attempt_row public.exam_attempts;
  calculated numeric(7,2) := 0;
  possible numeric(7,2) := 0;
begin
  select * into attempt_row from public.exam_attempts where id = p_attempt_id and student_id = auth.uid() for update;
  if not found then raise exception 'Attempt not found'; end if;
  if attempt_row.status <> 'in_progress' then raise exception 'Attempt is no longer editable'; end if;
  select coalesce(sum(case when q.answer_key = sa.selected_option_key then tq.marks else 0 end), 0), coalesce(sum(tq.marks), 0)
    into calculated, possible
    from public.test_questions tq join public.questions q on q.id = tq.question_id
    left join public.saved_answers sa on sa.question_id = q.id and sa.attempt_id = p_attempt_id
    where tq.test_id = attempt_row.test_id;
  update public.exam_attempts set status = 'submitted', submitted_at = now(), objective_marks = calculated, total_marks = possible where id = p_attempt_id returning * into attempt_row;
  insert into public.results(attempt_id, student_id, marks, accuracy) values (p_attempt_id, auth.uid(), calculated, case when possible = 0 then 0 else round(calculated / possible * 100, 2) end) on conflict (attempt_id) do update set marks = excluded.marks, accuracy = excluded.accuracy, generated_at = now();
  return attempt_row;
end;
$$;
revoke all on function public.submit_exam(uuid) from public;
grant execute on function public.submit_exam(uuid) to authenticated;

-- New Auth users receive the least-privileged role. Institution assignment is a
-- separate, approved operation and never trusts a role from the browser.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), 'Student'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.start_exam(p_test_id uuid)
returns public.exam_attempts language plpgsql security definer set search_path = public as $$
declare
  test_row public.tests;
  next_attempt integer;
  created_attempt public.exam_attempts;
  server_start timestamptz := clock_timestamp();
begin
  select * into test_row from public.tests where id = p_test_id and status = 'published';
  if not found then raise exception 'Test is not available'; end if;
  if test_row.scheduled_start is not null and server_start < test_row.scheduled_start then raise exception 'Test has not started'; end if;
  if test_row.scheduled_end is not null and server_start > test_row.scheduled_end then raise exception 'Test has closed'; end if;
  if exists (select 1 from public.exam_attempts where test_id = p_test_id and student_id = auth.uid() and status = 'in_progress') then raise exception 'An active attempt already exists'; end if;
  select coalesce(max(attempt_number), 0) + 1 into next_attempt from public.exam_attempts where test_id = p_test_id and student_id = auth.uid();
  insert into public.exam_attempts(test_id, student_id, attempt_number, started_at, ends_at, total_marks)
  values (p_test_id, auth.uid(), next_attempt, server_start, server_start + make_interval(secs => test_row.duration_seconds), test_row.total_marks)
  returning * into created_attempt;
  return created_attempt;
end;
$$;
revoke all on function public.start_exam(uuid) from public;
grant execute on function public.start_exam(uuid) to authenticated;
