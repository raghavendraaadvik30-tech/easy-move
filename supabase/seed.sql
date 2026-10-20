-- Synthetic, non-production seed content. Official KSEAB material must be verified
-- and linked in question_sources before publishing anything as official.
insert into public.academic_years (label, starts_on, ends_on, is_current)
values ('2026–27', '2026-06-01', '2027-05-31', true)
on conflict (label) do nothing;

insert into public.subjects (code, name_en, name_kn, is_language)
values
  ('KAN', 'Kannada', 'ಕನ್ನಡ', true),
  ('ENG', 'English', 'ಇಂಗ್ಲಿಷ್', true),
  ('MAT', 'Mathematics', 'ಗಣಿತ', false),
  ('SCI', 'Science', 'ವಿಜ್ಞಾನ', false),
  ('SOC', 'Social Science', 'ಸಮಾಜ ವಿಜ್ಞಾನ', false),
  ('ADD_LANG', 'Additional language', 'ಹೆಚ್ಚುವರಿ ಭಾಷೆ', true)
on conflict (code) do update set name_en = excluded.name_en, name_kn = excluded.name_kn;

insert into public.chapters (academic_year_id, subject_id, chapter_number, title_en, title_kn, status)
select ay.id, s.id, 1, v.title_en, v.title_kn, 'published'
from public.academic_years ay
join (values
  ('MAT', 'Real Numbers', 'ವಾಸ್ತವ ಸಂಖ್ಯೆಗಳು'),
  ('SCI', 'Chemical Reactions', 'ರಾಸಾಯನಿಕ ಕ್ರಿಯೆಗಳು'),
  ('SOC', 'The Rise of Nationalism', 'ರಾಷ್ಟ್ರೀಯತೆಯ ಉದಯ'),
  ('ENG', 'Glimpses of India', 'ಭಾರತದ ನೋಟಗಳು')
) as v(code, title_en, title_kn) on true
join public.subjects s on s.code = v.code
where ay.label = '2026–27'
on conflict do nothing;

insert into public.question_sources (label, source_kind, verification_note)
values ('Synthetic starter question', 'original_practice', 'For development only. Replace or review before publication.')
on conflict do nothing;

-- Original bilingual practice questions, not official examination material.
insert into public.questions (
  id, academic_year_id, subject_id, chapter_id, medium, question_type, difficulty,
  marks, prompt, prompt_translation, answer_key, explanation, explanation_translation,
  source_id, status
)
select
  '00000000-0000-0000-0000-000000000101', ay.id, s.id, c.id, 'english', 'mcq', 'easy',
  1, 'What is the HCF of 96 and 404?', '96 ಮತ್ತು 404 ರ ಮ.ಸಾ.ಅ. (HCF) ಎಷ್ಟು?', 'B',
  'Using Euclid’s algorithm, the last non-zero remainder is 4, so the HCF is 4.',
  'ಯೂಕ್ಲಿಡ್ ವಿಧಾನದಲ್ಲಿ ಕೊನೆಯ ಶೂನ್ಯವಲ್ಲದ ಶೇಷ 4 ಆಗಿದೆ. ಆದ್ದರಿಂದ ಮ.ಸಾ.ಅ. 4.',
  qs.id, 'published'
from public.academic_years ay
join public.subjects s on s.code = 'MAT'
join public.chapters c on c.subject_id = s.id and c.academic_year_id = ay.id and c.title_en = 'Real Numbers'
join public.question_sources qs on qs.label = 'Synthetic starter question'
where ay.label = '2026–27'
on conflict (id) do nothing;

insert into public.question_options (question_id, option_key, option_text, option_translation, sort_order)
values
  ('00000000-0000-0000-0000-000000000101', 'A', '2', '೨', 1),
  ('00000000-0000-0000-0000-000000000101', 'B', '4', '೪', 2),
  ('00000000-0000-0000-0000-000000000101', 'C', '8', '೮', 3),
  ('00000000-0000-0000-0000-000000000101', 'D', '12', '೧೨', 4)
on conflict (question_id, option_key) do nothing;

insert into public.questions (
  id, academic_year_id, subject_id, chapter_id, medium, question_type, difficulty,
  marks, prompt, prompt_translation, answer_key, explanation, explanation_translation,
  source_id, status
)
select
  '00000000-0000-0000-0000-000000000102', ay.id, s.id, c.id, 'english', 'mcq', 'easy',
  1, 'Which observation can indicate that a chemical reaction has occurred?', 'ರಾಸಾಯನಿಕ ಕ್ರಿಯೆ ಸಂಭವಿಸಿದೆ ಎಂದು ಸೂಚಿಸುವ ವೀಕ್ಷಣೆ ಯಾವುದು?', 'C',
  'Evolution of a gas can be evidence that a new substance has formed.',
  'ಅನಿಲ ಹೊರಬರುವುದು ಹೊಸ ವಸ್ತು ರೂಪುಗೊಂಡಿರುವುದಕ್ಕೆ ಸಾಕ್ಷಿಯಾಗಬಹುದು.',
  qs.id, 'published'
from public.academic_years ay
join public.subjects s on s.code = 'SCI'
join public.chapters c on c.subject_id = s.id and c.academic_year_id = ay.id and c.title_en = 'Chemical Reactions'
join public.question_sources qs on qs.label = 'Synthetic starter question'
where ay.label = '2026–27'
on conflict (id) do nothing;

insert into public.question_options (question_id, option_key, option_text, option_translation, sort_order)
values
  ('00000000-0000-0000-0000-000000000102', 'A', 'A substance changes shape', 'ವಸ್ತುವಿನ ಆಕಾರ ಬದಲಾಗುತ್ತದೆ', 1),
  ('00000000-0000-0000-0000-000000000102', 'B', 'A substance is cut', 'ವಸ್ತುವನ್ನು ಕತ್ತರಿಸಲಾಗುತ್ತದೆ', 2),
  ('00000000-0000-0000-0000-000000000102', 'C', 'A gas is evolved', 'ಅನಿಲ ಹೊರಬರುತ್ತದೆ', 3),
  ('00000000-0000-0000-0000-000000000102', 'D', 'A solid is moved', 'ಘನವನ್ನು ಸ್ಥಳಾಂತರಿಸಲಾಗುತ್ತದೆ', 4)
on conflict (question_id, option_key) do nothing;

insert into public.tests (id, academic_year_id, title, description, duration_seconds, total_marks, status)
select '00000000-0000-0000-0000-000000000201', id, 'SSLC mixed mock · 01', 'Synthetic starter mock for development only.', 600, 2, 'published'
from public.academic_years where label = '2026–27'
on conflict (id) do nothing;

insert into public.test_questions (test_id, question_id, position, marks)
values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 1, 1),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000102', 2, 1)
on conflict (test_id, question_id) do nothing;
