import type { SubjectDef } from '../types'

// Subject set per KSEAB SSLC: three languages + Mathematics, Science, Social Science.
// Third language varies per student (Hindi / Sanskrit / Urdu etc.) and is configured per institution.
export const subjects: SubjectDef[] = [
  { id: 'kan', code: 'KAN', name: 'Kannada (First Language)', nameKn: 'ಕನ್ನಡ (ಪ್ರಥಮ ಭಾಷೆ)', color: '#b3543f', icon: 'ಕ', isLanguage: true },
  { id: 'eng', code: 'ENG', name: 'English (Second Language)', nameKn: 'ಇಂಗ್ಲಿಷ್ (ದ್ವಿತೀಯ ಭಾಷೆ)', color: '#dd5c7b', icon: 'Aa', isLanguage: true },
  { id: 'mat', code: 'MAT', name: 'Mathematics', nameKn: 'ಗಣಿತ', color: '#5b5bd6', icon: '∑', isLanguage: false },
  { id: 'sci', code: 'SCI', name: 'Science', nameKn: 'ವಿಜ್ಞಾನ', color: '#1c9b77', icon: '✦', isLanguage: false },
  { id: 'soc', code: 'SOC', name: 'Social Science', nameKn: 'ಸಮಾಜ ವಿಜ್ಞಾನ', color: '#e48635', icon: '◎', isLanguage: false },
  { id: 'lang3', code: 'L3', name: 'Third Language (school-configured)', nameKn: 'ತೃತೀಯ ಭಾಷೆ (ಶಾಲೆ ಸಂರಚಿಸುತ್ತದೆ)', color: '#4d8fb8', icon: 'L3', isLanguage: true }
]

export const subjectById = (id: string) => subjects.find((s) => s.id === id)
