export type Role = 'student' | 'teacher' | 'school_admin' | 'platform_admin'
export type Medium = 'kannada' | 'english'

export interface Profile {
  id: string
  fullName: string
  role: Role
  institutionName: string
  className?: string
  medium: Medium
}

export interface Subject {
  id: string
  name: string
  kannadaName: string
  color: string
  icon: string
  progress: number
  nextChapter: string
}

export interface Activity {
  id: string
  type: 'mcq' | 'lesson' | 'exam'
  title: string
  subtitle: string
  score?: string
  date: string
}

export interface PracticeQuestion {
  id: string
  subject: string
  chapter: string
  prompt: string
  promptKn: string
  options: string[]
  answer: number
  explanation: string
  explanationKn: string
}
