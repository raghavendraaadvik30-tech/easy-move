import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { chaptersPart1 } from '../src/lib/content-chapters.ts'
import { languageChapters, socialChapters } from '../src/lib/content-more.ts'
import { questionBank } from '../src/lib/content-questions.ts'
import { subjects } from '../src/lib/content-subjects.ts'
import { canManageInstitution, canManageLearningContent } from '../src/lib/access.ts'
import { demoProfiles } from '../src/lib/demoData.ts'
import { storageKey } from '../src/lib/store.ts'
import { examDraftKey, mockExamQuestions, remainingSeconds } from '../src/lib/exam.ts'

const chapters=[...chaptersPart1,...socialChapters,...languageChapters]
const unique=(values:string[])=>new Set(values).size===values.length
assert.ok(unique(subjects.map(x=>x.id)),'subject IDs must be unique')
assert.ok(unique(chapters.map(x=>x.id)),'chapter IDs must be unique')
assert.ok(unique(questionBank.map(x=>x.id)),'question IDs must be unique')
assert.equal(chapters.filter(x=>x.subjectId==='mat').length,15,'Mathematics must contain 15 chapters')
assert.equal(chapters.filter(x=>x.subjectId==='sci').length,16,'Science must contain 16 chapters')
assert.equal(chapters.filter(x=>x.subjectId==='soc').length,33,'Social Science must contain 33 chapters')
assert.equal(canManageInstitution(demoProfiles.student),false,'students cannot manage institutions')
assert.equal(canManageLearningContent(demoProfiles.student),false,'students cannot manage content')
assert.equal(canManageLearningContent(demoProfiles.teacher),true,'teachers can manage authorised learning content')
assert.equal(canManageInstitution(demoProfiles.teacher),false,'teachers cannot manage institutions')
assert.equal(canManageInstitution(demoProfiles.school_admin),true,'school administrators can manage their institution')
assert.notEqual(storageKey('student-a'),storageKey('student-b'),'local learning stores must be isolated per student')
assert.ok(!subjects.find(s=>s.id==='lang3')?.name.includes('(Hindi)'),'third language must not default to Hindi')
assert.equal(mockExamQuestions.length,20,'mock exam must contain 20 questions')
for(const subject of ['mat','sci','soc','eng','kan'])assert.ok(mockExamQuestions.some(q=>q.subjectId===subject),`mock exam missing ${subject}`)
assert.notEqual(examDraftKey('student-a'),examDraftKey('student-b'),'exam drafts must be isolated per student')
assert.equal(remainingSeconds(2000,1000),1,'deadline calculation must use wall time')
assert.equal(remainingSeconds(1000,2000),0,'expired deadline must return zero')
const securitySql=readFileSync(new URL('../supabase/migrations/20261020010000_exam_security_hardening.sql',import.meta.url),'utf8')
const appSource=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8')
const authSource=readFileSync(new URL('../src/lib/supabase.ts',import.meta.url),'utf8')
const styleSource=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8')
assert.match(styleSource,/\.sidebar nav\[aria-label\]/,'navigation layout styles must be scoped to the sidebar')
assert.doesNotMatch(styleSource,/^nav\[aria-label\]/m,'mobile navigation must not inherit the sidebar column layout')
assert.match(authSource,/completePasswordRecovery/,'password recovery must include a completion path')
assert.match(securitySql,/revoke select, insert, update, delete on table public\.results from authenticated/,'direct result reads must be revoked')
assert.match(securitySql,/get_released_result[\s\S]*t\.release_results=true[\s\S]*clock_timestamp\(\)>=t\.scheduled_end/,'score release must require explicit release and closed schedule')
assert.match(securitySql,/get_attempt_review[\s\S]*t\.release_results=true[\s\S]*clock_timestamp\(\)>=t\.scheduled_end/,'answer review must require explicit release and closed schedule')
assert.match(appSource,/personal practice mock[\s\S]*not a scheduled or invigilated school examination/,'local mock must be visibly distinguished from a secure school exam')
assert.match(appSource,/onKeyDown=\{handleDialogKey\}/,'submit dialog must install keyboard focus handling')
assert.match(appSource,/setResults\(\[\]\);setStarted\(Date\.now\(\)\)/,'practice timer must reset after a set')
assert.match(authSource,/const session=storedSession\(\);saveSession\(null\);if\(session\)await request/,'logout must clear local credentials before remote revocation')
const contextSql=readFileSync(new URL('../supabase/migrations/20261020020000_user_context_and_preferences.sql',import.meta.url),'utf8')
assert.match(contextSql,/status = 'active'/,'login context must require an active membership')
assert.match(contextSql,/revoke update on table public\.profiles from authenticated/,'profile-wide self updates must be revoked')
assert.match(contextSql,/grant update \(preferred_medium\)/,'students may update only their language preference')
assert.match(contextSql,/one_active_institution_per_user/,'each account must have one unambiguous active school context')
assert.match(authSource,/kuyrvncypnfzerzpiqmq\.supabase\.co/,'the configured Supabase project URL must be present')
for(const chapter of chapters)assert.ok(subjects.some(s=>s.id===chapter.subjectId),`unknown subject in ${chapter.id}`)
for(const question of questionBank){
 assert.ok(chapters.some(c=>c.id===question.chapterId&&c.subjectId===question.subjectId),`broken chapter link in ${question.id}`)
 assert.equal(question.options.length,4,`${question.id} must have four options`)
 assert.equal(question.optionsKn.length,4,`${question.id} must have four Kannada options`)
 assert.ok(question.answer>=0&&question.answer<4,`${question.id} answer index is invalid`)
 assert.equal(question.source,'original_practice',`${question.id} source label is invalid`)
 assert.ok(question.promptKn.length>0&&question.explanationKn.length>0,`${question.id} needs Kannada content`)
}
console.log(`Validated ${subjects.length} subjects, ${chapters.length} chapters and ${questionBank.length} original bilingual questions.`)
