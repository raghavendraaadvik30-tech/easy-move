export type Role = 'student' | 'teacher' | 'school_admin' | 'platform_admin'
export type Medium = 'kannada' | 'english'
export type Theme = 'light' | 'dark'

export interface Profile {
  id: string
  fullName: string
  role: Role
  institutionName: string
  className?: string
  medium: Medium
  thirdLanguage?: string
}

export interface SubjectDef {
  id: string
  code: string
  name: string
  nameKn: string
  color: string
  icon: string
  isLanguage: boolean
}

export interface KeyPoints {
  en: string[]
  kn: string[]
}

export interface Chapter {
  id: string
  subjectId: string
  num: number
  section?: string
  sectionKn?: string
  titleEn: string
  titleKn: string
  kp: KeyPoints
}

export interface LessonSection {
  hEn: string
  hKn: string
  bodyEn: string
  bodyKn: string
}

export interface DeepLesson {
  chapterId: string
  introEn: string
  introKn: string
  sections: LessonSection[]
  formulas?: { label: string; formula: string }[]
  examTipEn?: string
  examTipKn?: string
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface BankQuestion {
  id: string
  subjectId: string
  chapterId: string
  prompt: string
  promptKn: string
  options: string[]
  optionsKn: string[]
  answer: number
  explanation: string
  explanationKn: string
  difficulty: Difficulty
  marks: number
  source: 'original_practice'
}

export interface OfficialResource {
  id: string
  title: string
  titleKn: string
  description: string
  url: string
  kind: 'model_papers' | 'previous_papers' | 'textbooks' | 'syllabus' | 'results'
}

export interface AttemptRecord {
  id: string
  at: string
  mode: 'practice' | 'exam'
  title: string
  total: number
  correct: number
  durationSec: number
  results: { qid: string; subjectId: string; chapterId: string; correct: boolean }[]
}

export interface StoreState {
  done: Record<string, number>
  lastChapter?: string
  bookmarks: string[]
  revision: string[]
  attempts: AttemptRecord[]
  target: number
  custom: BankQuestion[]
  streakCount: number
  streakLast: string
}
