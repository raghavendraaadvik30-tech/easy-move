import { useEffect, useState, type FormEvent } from 'react'
import { canManageInstitution, canManageLearningContent, canViewInstitutionReports, roleLabel } from './lib/access'
import { activities, demoProfiles, practiceQuestions, subjects } from './lib/demoData'
import { getProfileForUser, isSupabaseConfigured, supabase } from './lib/supabase'
import type { Medium, Profile, Role } from './types'

type View = 'overview' | 'learn' | 'practice' | 'exams' | 'exam-runner' | 'performance' | 'settings'

const icons: Record<string, string> = { overview: '⌂', learn: '◈', practice: '✓', exams: '▣', performance: '↗', settings: '⚙' }

function App() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [view, setView] = useState<View>('overview')
  const [medium, setMedium] = useState<Medium>('english')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [practiceOpen, setPracticeOpen] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const authenticatedProfile = await getProfileForUser(data.user.id)
      if (authenticatedProfile) {
        setProfile(authenticatedProfile)
        setMedium(authenticatedProfile.medium)
      }
    })
  }, [])

  if (!profile) return <Login onLogin={setProfile} />

  const isStudent = profile.role === 'student'
  const pageTitle = view === 'overview' ? (isStudent ? 'Good morning, Ananya' : `${roleLabel[profile.role]} workspace`) : navItems.find((item) => item.id === view)?.label ?? 'Dashboard'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">V</div><div><strong>VidyaSetu</strong><span>SSLC learning</span></div></div>
        <div className="school-switcher"><span className="school-dot">G</span><div><b>{profile.institutionName}</b><small>{profile.className ? `Class ${profile.className}` : roleLabel[profile.role]}</small></div><span className="chevron">⌄</span></div>
        <nav aria-label="Primary navigation">
          <p className="nav-label">Workspace</p>
          {navItems.filter((item) => !item.adminOnly || canViewInstitutionReports(profile)).map((item) => <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)}><span>{icons[item.id]}</span>{item.label}{item.id === 'practice' && <em>3</em>}</button>)}
          {canManageLearningContent(profile) && <><p className="nav-label admin-label">Manage</p><button className="nav-item" onClick={() => setView('learn')}><span>▤</span>Content & questions</button></>}
        </nav>
        <div className="sidebar-bottom"><div className="help-card"><span>?</span><div><b>Need help?</b><small>Read the student guide</small></div></div><button className="nav-item quiet" onClick={() => setView('settings')}><span>⚙</span>Settings</button></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="mobile-brand"><div className="brand-mark">V</div><strong>VidyaSetu</strong></div><div className="breadcrumbs"><span>Home</span><b>/</b><strong>{pageTitle}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Notifications">♧<i /></button><button className="avatar-button" onClick={() => setShowProfileMenu(!showProfileMenu)}><span className="avatar">AR</span><span className="avatar-name">{profile.fullName}</span><span>⌄</span></button>{showProfileMenu && <div className="profile-menu"><b>{profile.fullName}</b><small>{roleLabel[profile.role]}</small><button onClick={() => { setProfile(null); setShowProfileMenu(false) }}>Log out</button></div>}</div></header>
        <div className="page-body">
          {view === 'overview' && <Overview profile={profile} medium={medium} onMediumChange={setMedium} onPractice={() => { setView('practice'); setPracticeOpen(true) }} />}
          {view === 'learn' && <LearnView medium={medium} />}
          {view === 'practice' && <PracticeView initialOpen={practiceOpen} onClose={() => setPracticeOpen(false)} />}
          {view === 'exams' && <ExamsView onStart={() => setView('exam-runner')} />}
          {view === 'exam-runner' && <ExamRunner onExit={() => setView('exams')} />}
          {view === 'settings' && <SettingsView medium={medium} setMedium={setMedium} />}
        </div>
      </main>
    </div>
  )
}

const navItems: { id: View; label: string; adminOnly?: boolean }[] = [
  { id: 'overview', label: 'Overview' }, { id: 'learn', label: 'My learning' }, { id: 'practice', label: 'Daily practice' }, { id: 'exams', label: 'Mock examinations' }, { id: 'performance', label: 'My performance', adminOnly: true }
]

function Login({ onLogin }: { onLogin: (profile: Profile) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const signIn = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    if (!supabase) { setError('Supabase is not configured. Choose a demo role below to explore the foundation.'); return }
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError || !data.user) setError(authError?.message ?? 'Unable to sign in.')
    else {
      const authenticatedProfile = await getProfileForUser(data.user.id)
      if (authenticatedProfile) onLogin(authenticatedProfile)
      else setError('Your account is not linked to an approved school profile yet.')
    }
  }
  return <div className="login-page"><div className="login-art"><div className="login-brand"><div className="brand-mark">V</div><strong>VidyaSetu</strong></div><div className="art-copy"><p className="eyebrow">Karnataka SSLC · 2026–27</p><h1>Learn with clarity.<br /><span>Prepare with confidence.</span></h1><p>A calm, bilingual learning space for every chapter, question and exam attempt.</p><div className="quote"><span>“</span><div><b>Every concept understood is a step forward.</b><small>Designed for students, with schools.</small></div></div></div><div className="art-footer">Built for Karnataka’s learners <span>✦</span></div></div><div className="login-panel"><div className="login-form"><div className="mobile-login-brand"><div className="brand-mark">V</div><strong>VidyaSetu</strong></div><h2>Welcome back</h2><p>Sign in to continue your learning journey.</p><form onSubmit={signIn}><label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></label><label>Password<div className="password-input"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required /><span>◉</span></div></label><div className="form-row"><label className="checkbox"><input type="checkbox" /> <span>Remember me</span></label><button type="button" className="link-button">Forgot password?</button></div>{error && <div className="form-error">{error}</div>}<button className="primary-button full" type="submit">Sign in <span>→</span></button></form><div className="divider"><span>Local demo access</span></div>{!isSupabaseConfigured && <div className="demo-roles">{(['student', 'teacher', 'school_admin'] as Role[]).map((role) => <button key={role} onClick={() => onLogin(demoProfiles[role])}><span className="role-dot">{role === 'student' ? 'S' : role === 'teacher' ? 'T' : 'A'}</span><span><b>Continue as {roleLabel[role]}</b><small>{role === 'student' ? 'Explore learning and practice' : 'Preview role workspace'}</small></span><strong>→</strong></button>)}</div>}<small className="privacy-note">By continuing, you agree to use this educational service responsibly. Student data is private by default.</small></div></div></div>
}

function Overview({ profile, medium, onMediumChange, onPractice }: { profile: Profile; medium: Medium; onMediumChange: (medium: Medium) => void; onPractice: () => void }) {
  if (profile.role !== 'student') return <AdminOverview profile={profile} />
  const greeting = 'You’re making steady progress. Keep it up!'
  return <><div className="welcome-row"><div><p className="eyebrow">Tuesday, 20 October 2026</p><h1>{profile.role === 'student' ? 'Good morning, Ananya' : `${roleLabel[profile.role]} workspace`}</h1><p className="muted">{greeting}</p></div><div className="language-switch"><span>Learning in</span><button className={medium === 'english' ? 'selected' : ''} onClick={() => onMediumChange('english')}>English</button><button className={medium === 'kannada' ? 'selected' : ''} onClick={() => onMediumChange('kannada')}>ಕನ್ನಡ</button></div></div><div className="hero-card"><div><span className="pill light">CONTINUE LEARNING</span><h2>Pair of Linear Equations</h2><p>Mathematics <span>·</span> Chapter 3</p><div className="progress-line"><span style={{ width: '64%' }} /></div><small>64% complete <b>·</b> 18 min left</small><button className="white-button">Continue chapter <span>→</span></button></div><div className="hero-illustration"><div className="sun" /><div className="book-shape">∑</div><div className="spark spark-one">✦</div><div className="spark spark-two">✦</div></div></div><section className="section"><div className="section-heading"><div><h2>My subjects</h2><p>Pick up where you left off</p></div><button className="text-button">View all <span>→</span></button></div><div className="subject-grid">{subjects.map((subject) => <article className="subject-card" key={subject.id}><div className="subject-top"><span className="subject-icon" style={{ background: subject.color }}>{subject.icon}</span><button className="more-button">•••</button></div><h3>{subject.name}</h3><p>{subject.nextChapter}</p><div className="subject-progress"><span style={{ width: `${subject.progress}%`, background: subject.color }} /></div><small><b>{subject.progress}%</b> complete</small></article>)}</div></section><div className="dashboard-columns"><section className="panel"><div className="section-heading"><div><h2>Daily practice</h2><p>Small steps make a difference</p></div><button className="text-button" onClick={onPractice}>Start now <span>→</span></button></div><div className="practice-row"><div className="streak"><strong>7</strong><span>day streak</span><div className="streak-dots">{[1, 2, 3, 4, 5, 6, 7].map((day) => <i key={day} className={day < 7 ? 'done' : ''}>✓</i>)}</div></div><div className="practice-copy"><b>10 questions · 10 minutes</b><span>Mixed revision from your weak areas</span><button className="primary-button" onClick={onPractice}>Begin practice <span>→</span></button></div></div></section><section className="panel activity-panel"><div className="section-heading"><div><h2>Recent activity</h2><p>Your learning trail</p></div><button className="more-button">•••</button></div>{activities.map((activity) => <div className="activity-row" key={activity.id}><span className={`activity-icon ${activity.type}`}>{activity.type === 'lesson' ? '◈' : activity.type === 'mcq' ? '✓' : '▣'}</span><div><b>{activity.title}</b><small>{activity.subtitle}</small></div><span className="activity-meta">{activity.score ?? activity.date}</span></div>)}</section></div></>
}

function AdminOverview({ profile }: { profile: Profile }) {
  const canManage = canManageInstitution(profile)
  return <div className="content-view"><div className="view-header"><div><p className="eyebrow">{canManage ? 'SCHOOL OPERATIONS' : 'TEACHER WORKSPACE'}</p><h1>{canManage ? 'Keep your school moving forward' : 'Your teaching workspace'}</h1><p className="muted">{profile.institutionName} · {canManage ? 'Manage people, content and reports securely.' : 'Focus on the classes and content assigned to you.'}</p></div><button className="primary-button">{canManage ? 'Manage institution' : 'Create practice set'} <span>→</span></button></div><div className="metric-grid"><div className="metric-card"><small>Active learners</small><strong>128</strong><em className="positive">↑ 12 this month</em></div><div className="metric-card"><small>Practice attempts</small><strong>846</strong><em className="positive">↑ 18% this month</em></div><div className="metric-card"><small>Content to review</small><strong>14</strong><em className="attention">Needs attention</em></div><div className="metric-card"><small>Average accuracy</small><strong>74<span>%</span></strong><em>Across assigned work</em></div></div><div className="dashboard-columns"><section className="panel"><div className="section-heading"><div><h2>Class activity</h2><p>Authorized student groups only</p></div><button className="text-button">View reports <span>→</span></button></div>{['10 A · Mathematics', '10 B · Science', '10 A · English'].map((row, index) => <div className="activity-row" key={row}><span className={`activity-icon ${index === 1 ? 'mcq' : 'lesson'}`}>{index === 1 ? '✓' : '◈'}</span><div><b>{row}</b><small>{index === 0 ? '32 learners active today' : index === 1 ? '28 learners · 81% accuracy' : '21 learners · 6 revisions due'}</small></div><span className="activity-meta">Today</span></div>)}</section><section className="panel activity-panel"><div className="section-heading"><div><h2>Content workflow</h2><p>Review before publishing</p></div></div><div className="activity-row"><span className="activity-icon exam">!</span><div><b>14 questions awaiting review</b><small>Publication stays blocked until verified</small></div><span className="activity-meta">Review</span></div><div className="activity-row"><span className="activity-icon lesson">+</span><div><b>2 private tests scheduled</b><small>Next: Mathematics · 24 October</small></div><span className="activity-meta">Ready</span></div></section></div></div>
}

function LearnView({ medium }: { medium: Medium }) { return <div className="content-view"><div className="view-header"><div><p className="eyebrow">MY LEARNING</p><h1>Chapters and lessons</h1><p className="muted">Learn at your pace in {medium === 'english' ? 'English' : 'ಕನ್ನಡ'}.</p></div><button className="primary-button">Browse subjects <span>→</span></button></div><div className="learning-list">{subjects.map((subject, i) => <article className="learning-card" key={subject.id}><div className="learning-card-icon" style={{ color: subject.color, background: `${subject.color}15` }}>{subject.icon}</div><div className="learning-info"><div className="subject-line"><h2>{subject.name}</h2><span>{subject.progress}% complete</span></div><p>{subject.kannadaName} · 12 chapters · 48 lessons</p><div className="subject-progress"><span style={{ width: `${subject.progress}%`, background: subject.color }} /></div><div className="chapter-preview"><b>Next: {subject.nextChapter}</b><span>{i % 2 === 0 ? 'Lesson 2 of 4' : 'Lesson 1 of 5'} · 15 min</span></div></div><button className="circle-arrow">→</button></article>)}</div></div> }

function PracticeView({ initialOpen, onClose }: { initialOpen: boolean; onClose: () => void }) { const [questionIndex, setQuestionIndex] = useState(0); const [selected, setSelected] = useState<number | null>(null); const [submitted, setSubmitted] = useState(false); const question = practiceQuestions[questionIndex % practiceQuestions.length]; useEffect(() => { if (initialOpen) { setSelected(null); setSubmitted(false) } }, [initialOpen]); return <div className="content-view"><div className="view-header"><div><p className="eyebrow">DAILY PRACTICE</p><h1>Build your confidence</h1><p className="muted">A short mixed set based on your revision list.</p></div><div className="practice-stat"><b>7</b><span>day streak</span></div></div><div className="practice-layout"><div className="question-card"><div className="question-meta"><span className="pill">QUESTION {questionIndex + 1} OF {practiceQuestions.length}</span><span>{question.subject} · {question.chapter}</span></div><h2>{question.prompt}</h2><p className="kannada-text">{question.promptKn}</p><div className="options">{question.options.map((option, index) => <button key={option} className={`option ${selected === index ? 'selected' : ''} ${submitted && index === question.answer ? 'correct' : ''} ${submitted && selected === index && index !== question.answer ? 'incorrect' : ''}`} onClick={() => !submitted && setSelected(index)}><span>{String.fromCharCode(65 + index)}</span>{option}{submitted && index === question.answer && <b>✓</b>}</button>)}</div>{submitted && <div className={`answer-feedback ${selected === question.answer ? 'success' : 'notice'}`}><b>{selected === question.answer ? 'Well done!' : 'Let’s review this one.'}</b><p>{question.explanation}</p></div>}<div className="question-actions">{submitted ? <button className="primary-button" onClick={() => { setQuestionIndex((value) => value + 1); setSelected(null); setSubmitted(false) }}>Next question <span>→</span></button> : <><button className="secondary-button" onClick={onClose}>Save for later</button><button className="primary-button" disabled={selected === null} onClick={() => setSubmitted(true)}>Check answer <span>→</span></button></>}</div></div><aside className="practice-aside"><div className="mini-card"><span className="aside-icon">◒</span><h3>Your revision list</h3><p>We’ll use your incorrect answers to suggest what to revisit next.</p><button className="text-button">View revision list <span>→</span></button></div><div className="mini-card soft"><span className="aside-icon">✦</span><h3>Practice tip</h3><p>Try explaining the answer in your own words after you submit.</p></div></aside></div></div> }

function ExamRunner({ onExit }: { onExit: () => void }) {
  const questions = practiceQuestions
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('vidyasetu-demo-exam-answers') ?? '{}') as Record<string, number> } catch { return {} }
  })
  const [secondsLeft, setSecondsLeft] = useState(600)
  const [submitted, setSubmitted] = useState(false)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [startError, setStartError] = useState('')
  const question = questions[current]
  const syncAnswers = async (nextAnswers: Record<string, number>) => {
    if (!supabase || !attemptId) return
    await supabase.from('saved_answers').upsert(Object.entries(nextAnswers).map(([questionId, answer]) => ({ attempt_id: attemptId, question_id: questionId, selected_option_key: String.fromCharCode(65 + answer) })), { onConflict: 'attempt_id,question_id' })
  }
  useEffect(() => {
    if (supabase) {
      supabase.rpc('start_exam', { p_test_id: '00000000-0000-0000-0000-000000000201' }).then(({ data, error }) => {
        if (error) setStartError(error.message)
        else setAttemptId(data?.id ?? null)
      })
    }
  }, [])
  useEffect(() => {
    if (submitted) return
    const timer = window.setInterval(() => setSecondsLeft((value) => {
      if (value <= 1) { window.clearInterval(timer); setSubmitted(true); return 0 }
      return value - 1
    }), 1000)
    return () => window.clearInterval(timer)
  }, [submitted])
  useEffect(() => {
    localStorage.setItem('vidyasetu-demo-exam-answers', JSON.stringify(answers))
    void syncAnswers(answers)
    const retry = () => void syncAnswers(answers)
    window.addEventListener('online', retry)
    return () => window.removeEventListener('online', retry)
  }, [answers, attemptId])
  const selectAnswer = (answer: number) => setAnswers((previous) => ({ ...previous, [question.id]: answer }))
  const submit = async () => {
    setSubmitted(true)
    if (supabase && attemptId) await supabase.rpc('submit_exam', { p_attempt_id: attemptId })
  }
  useEffect(() => {
    if (secondsLeft === 0 && supabase && attemptId) void supabase.rpc('submit_exam', { p_attempt_id: attemptId })
  }, [secondsLeft, attemptId])
  const score = questions.reduce((total, item) => total + (answers[item.id] === item.answer ? 1 : 0), 0)
  if (submitted) return <div className="content-view"><div className="result-card"><span className="result-icon">✓</span><p className="eyebrow">EXAM COMPLETE</p><h1>Your practice result</h1><strong>{score} <span>/ {questions.length}</span></strong><p className="muted">Answers were saved locally for demo recovery and, when configured, sent to the server-side exam attempt.</p>{startError && <div className="form-error">The connected exam could not start: {startError}. The local result is still available for review.</div>}<div className="result-actions"><button className="secondary-button" onClick={onExit}>Back to examinations</button><button className="primary-button" onClick={() => { setAnswers({}); setSubmitted(false); setCurrent(0); setSecondsLeft(600); localStorage.removeItem('vidyasetu-demo-exam-answers') }}>Try again <span>→</span></button></div></div></div>
  return <div className="content-view"><div className="exam-runner-top"><div><p className="eyebrow">SSLC MIXED MOCK · 01</p><h1>Timed mock examination</h1><p className="muted">Your answer is saved as you move between questions.</p></div><div className={`exam-timer ${secondsLeft < 60 ? 'urgent' : ''}`}><small>TIME LEFT</small><b>{String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}</b></div></div><div className="exam-runner-layout"><div className="question-card"><div className="question-meta"><span className="pill">QUESTION {current + 1} OF {questions.length}</span><span>{question.subject} · 1 mark</span></div><h2>{question.prompt}</h2><p className="kannada-text">{question.promptKn}</p><div className="options">{question.options.map((option, index) => <button key={option} className={`option ${answers[question.id] === index ? 'selected' : ''}`} onClick={() => selectAnswer(index)}><span>{String.fromCharCode(65 + index)}</span>{option}{answers[question.id] === index && <b>✓</b>}</button>)}</div><div className="question-actions"><button className="secondary-button" onClick={() => setCurrent((value) => Math.max(0, value - 1))} disabled={current === 0}>← Previous</button>{current < questions.length - 1 ? <button className="primary-button" onClick={() => setCurrent((value) => value + 1)}>Next question <span>→</span></button> : <button className="primary-button" onClick={submit}>Submit exam <span>→</span></button>}</div></div><aside className="exam-nav-card"><h3>Questions</h3><div className="exam-question-grid">{questions.map((item, index) => <button key={item.id} className={`${index === current ? 'current' : ''} ${answers[item.id] !== undefined ? 'answered' : ''}`} onClick={() => setCurrent(index)}>{index + 1}</button>)}</div><div className="answer-legend"><span><i className="answered-dot" /> Answered</span><span><i className="current-dot" /> Current</span></div><button className="text-button" onClick={submit}>Submit now <span>→</span></button></aside></div></div>
}

function ExamsView({ onStart }: { onStart: () => void }) { return <div className="content-view"><div className="view-header"><div><p className="eyebrow">MOCK EXAMINATIONS</p><h1>Exam practice</h1><p className="muted">Timed practice with safe answer saving and clear results.</p></div><button className="primary-button">View attempt history <span>→</span></button></div><div className="exam-grid"><article className="exam-feature"><span className="pill light">RECOMMENDED</span><h2>SSLC mixed mock · 01</h2><p>Mathematics, Science, Social Science and English</p><div className="exam-details"><span>◷ 90 minutes</span><span>▣ 40 marks</span><span>◉ 40 questions</span></div><button className="white-button" onClick={onStart}>Start mock examination <span>→</span></button></article><article className="exam-list-card"><h2>Upcoming practice</h2><div className="upcoming"><span className="date-box"><b>24</b><small>OCT</small></span><div><b>Mathematics · Chapter test</b><small>Triangles · 30 minutes</small></div><span className="status upcoming-status">Ready</span></div><div className="upcoming"><span className="date-box"><b>28</b><small>OCT</small></span><div><b>Science · Revision test</b><small>Physics · 30 minutes</small></div><span className="status locked-status">Locked</span></div></article></div><div className="security-note"><span>◉</span><div><b>Exam reliability built in</b><p>Your answers are saved automatically. If your connection briefly drops, the app will retry within the documented recovery window. Marks are calculated on the server.</p></div></div></div> }

function PerformanceView() { return <div className="content-view"><div className="view-header"><div><p className="eyebrow">MY PERFORMANCE</p><h1>See your progress</h1><p className="muted">A private view of your learning patterns—not a prediction of board marks.</p></div><button className="secondary-button">Last 30 days⌄</button></div><div className="metric-grid"><div className="metric-card"><small>Average accuracy</small><strong>78<span>%</span></strong><em className="positive">↑ 8% this month</em></div><div className="metric-card"><small>Questions answered</small><strong>246</strong><em className="positive">↑ 42 this month</em></div><div className="metric-card"><small>Chapters completed</small><strong>12<span>/ 48</span></strong><em>Keep going</em></div><div className="metric-card"><small>Revision topics</small><strong>8</strong><em className="attention">Need a revisit</em></div></div><div className="chart-card"><div className="section-heading"><div><h2>Accuracy over time</h2><p>Across practice and mock examinations</p></div><span className="chart-legend"><i /> Accuracy</span></div><div className="chart"><div className="y-axis"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="chart-area"><div className="grid-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 680 200" preserveAspectRatio="none" aria-label="Accuracy line chart"><polyline points="0,145 90,128 180,142 270,100 360,110 450,76 540,89 680,48" fill="none" stroke="#5b5bd6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><polyline points="0,145 90,128 180,142 270,100 360,110 450,76 540,89 680,48 680,200 0,200" fill="url(#area)" stroke="none" /><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5b5bd6" stopOpacity=".18" /><stop offset="100%" stopColor="#5b5bd6" stopOpacity="0" /></linearGradient></defs></svg><div className="x-axis"><span>Sep 22</span><span>Sep 29</span><span>Oct 06</span><span>Oct 13</span><span>Oct 20</span></div></div></div></div></div> }

function SettingsView({ medium, setMedium }: { medium: Medium; setMedium: (medium: Medium) => void }) { return <div className="content-view"><div className="view-header"><div><p className="eyebrow">SETTINGS</p><h1>Profile and preferences</h1><p className="muted">Choose how VidyaSetu works for you.</p></div></div><div className="settings-card"><div className="settings-section"><div><h2>Learning language</h2><p>Explanations and navigation will use your selected language where available.</p></div><div className="segmented"><button className={medium === 'english' ? 'active' : ''} onClick={() => setMedium('english')}>English</button><button className={medium === 'kannada' ? 'active' : ''} onClick={() => setMedium('kannada')}>ಕನ್ನಡ</button></div></div><div className="settings-section"><div><h2>Study reminders</h2><p>Reminder controls will be connected to your school policy in a later release.</p></div><span className="toggle on"><i /></span></div><div className="settings-section"><div><h2>Privacy</h2><p>Your progress is visible only to you and authorized educators in your institution.</p></div><button className="text-button">Read privacy notice <span>→</span></button></div></div></div> }

export default App
