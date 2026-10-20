import type { Activity, PracticeQuestion, Profile, Subject } from '../types'

export const demoProfiles: Record<Profile['role'], Profile> = {
  student: { id: 'demo-student', fullName: 'Ananya R.', role: 'student', institutionName: 'Government High School, Bengaluru', className: '10 A', medium: 'english' },
  teacher: { id: 'demo-teacher', fullName: 'Meera Prakash', role: 'teacher', institutionName: 'Government High School, Bengaluru', medium: 'english' },
  school_admin: { id: 'demo-admin', fullName: 'Ravi Kumar', role: 'school_admin', institutionName: 'Government High School, Bengaluru', medium: 'english' },
  platform_admin: { id: 'demo-platform', fullName: 'VidyaSetu Admin', role: 'platform_admin', institutionName: 'VidyaSetu Platform', medium: 'english' }
}

export const subjects: Subject[] = [
  { id: 'maths', name: 'Mathematics', kannadaName: 'ಗಣಿತ', color: '#5b5bd6', icon: '∑', progress: 68, nextChapter: 'Triangles' },
  { id: 'science', name: 'Science', kannadaName: 'ವಿಜ್ಞಾನ', color: '#1c9b77', icon: '✦', progress: 52, nextChapter: 'Light: Reflection & Refraction' },
  { id: 'social', name: 'Social Science', kannadaName: 'ಸಮಾಜ ವಿಜ್ಞಾನ', color: '#e48635', icon: '◎', progress: 41, nextChapter: 'The Rise of Nationalism' },
  { id: 'english', name: 'English', kannadaName: 'ಇಂಗ್ಲಿಷ್', color: '#dd5c7b', icon: 'Aa', progress: 76, nextChapter: 'Glimpses of India' }
]

export const activities: Activity[] = [
  { id: '1', type: 'lesson', title: 'Pair of Linear Equations', subtitle: 'Mathematics · Chapter 3', date: 'Today' },
  { id: '2', type: 'mcq', title: 'Chemical Reactions', subtitle: 'Science · 10 questions', score: '8/10', date: 'Yesterday' },
  { id: '3', type: 'exam', title: 'Weekly mixed mock test', subtitle: '4 subjects · 40 marks', score: '32/40', date: '18 Oct' }
]

export const practiceQuestions: PracticeQuestion[] = [
  {
    id: '00000000-0000-0000-0000-000000000101', subject: 'Mathematics', chapter: 'Real Numbers',
    prompt: 'What is the HCF of 96 and 404?',
    promptKn: '96 ಮತ್ತು 404 ರ ಮ.ಸಾ.ಅ. (HCF) ಎಷ್ಟು?',
    options: ['2', '4', '8', '12'], answer: 1,
    explanation: 'Using Euclid’s algorithm: 404 = 96 × 4 + 20, 96 = 20 × 4 + 16, 20 = 16 + 4. The last non-zero remainder is 4, so the HCF is 4.',
    explanationKn: 'ಯೂಕ್ಲಿಡ್ ವಿಧಾನದಲ್ಲಿ ಕೊನೆಯ ಶೂನ್ಯವಲ್ಲದ ಶೇಷ 4 ಆಗಿದೆ. ಆದ್ದರಿಂದ 96 ಮತ್ತು 404 ರ ಮ.ಸಾ.ಅ. 4.'
  },
  {
    id: '00000000-0000-0000-0000-000000000102', subject: 'Science', chapter: 'Chemical Reactions',
    prompt: 'Which observation most clearly indicates that a chemical reaction has occurred?',
    promptKn: 'ರಾಸಾಯನಿಕ ಕ್ರಿಯೆ ಸಂಭವಿಸಿದೆ ಎಂದು ಸ್ಪಷ್ಟವಾಗಿ ಸೂಚಿಸುವ ವೀಕ್ಷಣೆ ಯಾವುದು?',
    options: ['A substance changes shape', 'A gas is evolved', 'A substance is cut', 'A solid is moved'], answer: 1,
    explanation: 'Evolution of a gas is a common sign of a chemical reaction because a new substance may have formed. In a published question bank, the explanation and source must be reviewed before publication.',
    explanationKn: 'ಅನಿಲ ಹೊರಬರುವುದು ರಾಸಾಯನಿಕ ಕ್ರಿಯೆಯ ಸಾಮಾನ್ಯ ಲಕ್ಷಣವಾಗಿದೆ. ಪ್ರಕಟಿಸುವ ಮೊದಲು ವಿವರಣೆ ಮತ್ತು ಮೂಲವನ್ನು ಪರಿಶೀಲಿಸಬೇಕು.'
  }
]
