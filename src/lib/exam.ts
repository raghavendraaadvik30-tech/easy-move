import { questionBank } from './content-questions.ts'

export const mockExamQuestions=[
 ...questionBank.filter(q=>q.subjectId==='mat').slice(0,7),
 ...questionBank.filter(q=>q.subjectId==='sci').slice(0,5),
 ...questionBank.filter(q=>q.subjectId==='soc').slice(0,5),
 ...questionBank.filter(q=>q.subjectId==='eng').slice(0,2),
 ...questionBank.filter(q=>q.subjectId==='kan').slice(0,1)
]
export const examDraftKey=(ownerId:string)=>`vidyasetu-exam-v4:${ownerId.replace(/[^a-zA-Z0-9_-]/g,'_')}`
export const remainingSeconds=(deadline:number,now=Date.now())=>Math.max(0,Math.ceil((deadline-now)/1000))
