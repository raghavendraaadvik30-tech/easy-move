import type { AttemptRecord, StoreState } from '../types'

const PREFIX='vidyasetu-student-v3'
export const emptyStore=():StoreState=>({done:{},bookmarks:[],revision:[],attempts:[],target:80,custom:[],streakCount:0,streakLast:''})
export const storageKey=(ownerId:string)=>`${PREFIX}:${ownerId.replace(/[^a-zA-Z0-9_-]/g,'_')}`

export function loadStore(ownerId:string):StoreState{
 const defaults=emptyStore()
 try{const parsed=JSON.parse(localStorage.getItem(storageKey(ownerId))??'{}') as Partial<StoreState>;return{...defaults,...parsed,done:{...defaults.done,...parsed.done},bookmarks:parsed.bookmarks??[],revision:parsed.revision??[],attempts:parsed.attempts??[],custom:parsed.custom??[]}}catch{return defaults}
}
export function saveStore(ownerId:string,state:StoreState){localStorage.setItem(storageKey(ownerId),JSON.stringify(state))}
export function recordAttempt(state:StoreState,attempt:AttemptRecord):StoreState{
 const revision=new Set(state.revision);for(const item of attempt.results)item.correct?revision.delete(item.qid):revision.add(item.qid)
 const today=new Date().toISOString().slice(0,10);const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10)
 const streakCount=state.streakLast===today?state.streakCount:state.streakLast===yesterday?state.streakCount+1:1
 return{...state,attempts:[attempt,...state.attempts].slice(0,50),revision:[...revision],streakCount,streakLast:today}
}
