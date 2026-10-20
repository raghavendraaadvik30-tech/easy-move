-- Exam and answer security hardening.
-- RLS filters rows; column privileges protect sensitive fields inside allowed rows.

alter table public.tests add column if not exists max_attempts integer not null default 1 check (max_attempts between 1 and 10);
alter table public.tests add column if not exists release_results boolean not null default false;

revoke select on table public.questions from anon, authenticated;
grant select (
  id, academic_year_id, subject_id, chapter_id, topic_id, institution_id,
  medium, question_type, difficulty, marks, prompt, prompt_translation,
  source_id, status, content_version, created_at, updated_at
) on table public.questions to authenticated;

-- Attempts are created and closed only through the server RPCs. Students can see
-- timing/status fields, but score-bearing fields remain hidden until release.
revoke all on table public.exam_attempts from anon;
revoke select, insert, update, delete on table public.exam_attempts from authenticated;
grant select (id,test_id,student_id,attempt_number,status,started_at,ends_at,submitted_at,total_marks)
  on table public.exam_attempts to authenticated;
revoke select, insert, update, delete on table public.results from authenticated;

create unique index if not exists one_active_attempt_per_test_student
  on public.exam_attempts(test_id, student_id) where status='in_progress';

create or replace function public.start_exam(p_test_id uuid)
returns public.exam_attempts
language plpgsql security definer set search_path=public as $$
declare
  test_row public.tests;
  next_attempt integer;
  created_attempt public.exam_attempts;
  server_start timestamptz:=clock_timestamp();
  server_end timestamptz;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into test_row from public.tests
   where id=p_test_id and status='published'
     and (institution_id is null or public.user_has_institution_access(institution_id));
  if not found then raise exception 'Test is not available'; end if;
  if test_row.scheduled_start is not null and server_start<test_row.scheduled_start then raise exception 'Test has not started'; end if;
  if test_row.scheduled_end is not null and server_start>=test_row.scheduled_end then raise exception 'Test has closed'; end if;
  if exists(select 1 from public.exam_attempts where test_id=p_test_id and student_id=auth.uid() and status='in_progress') then raise exception 'An active attempt already exists'; end if;
  select count(*)+1 into next_attempt from public.exam_attempts where test_id=p_test_id and student_id=auth.uid();
  if next_attempt>test_row.max_attempts then raise exception 'Attempt limit reached'; end if;
  server_end:=server_start+make_interval(secs=>test_row.duration_seconds);
  if test_row.scheduled_end is not null then server_end:=least(server_end,test_row.scheduled_end); end if;
  insert into public.exam_attempts(test_id,student_id,attempt_number,started_at,ends_at,total_marks)
  values(p_test_id,auth.uid(),next_attempt,server_start,server_end,test_row.total_marks)
  returning * into created_attempt;
  return created_attempt;
end;
$$;

-- Drop the earlier composite-return version so submission cannot return objective_marks.
drop function if exists public.submit_exam(uuid);
create function public.submit_exam(p_attempt_id uuid)
returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  attempt_row public.exam_attempts;
  calculated numeric(7,2):=0;
  possible_objective numeric(7,2):=0;
  final_status public.attempt_status;
begin
  select * into attempt_row from public.exam_attempts where id=p_attempt_id and student_id=auth.uid() for update;
  if not found then raise exception 'Attempt not found'; end if;
  if attempt_row.status<>'in_progress' then raise exception 'Attempt is no longer editable'; end if;
  final_status:=case when clock_timestamp()>=attempt_row.ends_at then 'expired'::public.attempt_status else 'submitted'::public.attempt_status end;
  select coalesce(sum(case when q.answer_key is not null and q.answer_key=sa.selected_option_key then tq.marks else 0 end),0),
         coalesce(sum(case when q.answer_key is not null then tq.marks else 0 end),0)
    into calculated,possible_objective
  from public.test_questions tq
  join public.questions q on q.id=tq.question_id
  left join public.saved_answers sa on sa.question_id=q.id and sa.attempt_id=p_attempt_id
  where tq.test_id=attempt_row.test_id;
  update public.exam_attempts set status=final_status,submitted_at=clock_timestamp(),objective_marks=calculated
   where id=p_attempt_id returning * into attempt_row;
  insert into public.results(attempt_id,student_id,marks,accuracy)
  values(p_attempt_id,auth.uid(),calculated,case when possible_objective=0 then 0 else round(calculated/possible_objective*100,2) end)
  on conflict(attempt_id) do update set marks=excluded.marks,accuracy=excluded.accuracy,generated_at=now();
  return jsonb_build_object('attempt_id',attempt_row.id,'status',attempt_row.status,'submitted_at',attempt_row.submitted_at);
end;
$$;

-- Scores become visible only after explicit release and the scheduled window closes.
create or replace function public.get_released_result(p_attempt_id uuid)
returns table(attempt_id uuid,marks numeric,accuracy numeric,generated_at timestamptz)
language sql stable security definer set search_path=public as $$
  select r.attempt_id,r.marks,r.accuracy,r.generated_at
  from public.results r
  join public.exam_attempts a on a.id=r.attempt_id
  join public.tests t on t.id=a.test_id
  where r.attempt_id=p_attempt_id and r.student_id=auth.uid()
    and t.release_results=true and t.scheduled_end is not null and clock_timestamp()>=t.scheduled_end;
$$;

create or replace function public.get_attempt_review(p_attempt_id uuid)
returns table(question_id uuid,selected_option_key text,correct_option_key text,is_correct boolean,explanation text,explanation_translation text)
language sql stable security definer set search_path=public as $$
  select q.id,sa.selected_option_key,q.answer_key,sa.selected_option_key=q.answer_key,q.explanation,q.explanation_translation
  from public.exam_attempts a
  join public.tests t on t.id=a.test_id
  join public.test_questions tq on tq.test_id=a.test_id
  join public.questions q on q.id=tq.question_id
  left join public.saved_answers sa on sa.attempt_id=a.id and sa.question_id=q.id
  where a.id=p_attempt_id and a.student_id=auth.uid() and a.status in('submitted','expired')
    and t.release_results=true and t.scheduled_end is not null and clock_timestamp()>=t.scheduled_end;
$$;

revoke all on function public.start_exam(uuid) from public;
revoke all on function public.submit_exam(uuid) from public;
revoke all on function public.get_released_result(uuid) from public;
revoke all on function public.get_attempt_review(uuid) from public;
grant execute on function public.start_exam(uuid) to authenticated;
grant execute on function public.submit_exam(uuid) to authenticated;
grant execute on function public.get_released_result(uuid) to authenticated;
grant execute on function public.get_attempt_review(uuid) to authenticated;
