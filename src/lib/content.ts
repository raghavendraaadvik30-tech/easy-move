import { chaptersPart1 } from './content-chapters'
import { languageChapters, socialChapters } from './content-more'

export { subjects, subjectById } from './content-subjects'
export { questionBank } from './content-questions'
export { deepLessons, officialResources } from './content-more'
export const chapters = [...chaptersPart1, ...socialChapters, ...languageChapters]
export const chapterById = (id: string) => chapters.find((chapter) => chapter.id === id)
export const chaptersFor = (subjectId: string) => chapters.filter((chapter) => chapter.subjectId === subjectId)
