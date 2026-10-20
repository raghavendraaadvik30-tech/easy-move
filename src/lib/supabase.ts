import type { Profile, Role } from '../types'

const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const SESSION_KEY = 'vidyasetu-supabase-session'

type AuthUser = { id:string; email?:string; user_metadata?:Record<string,unknown> }
type Session = { access_token:string; refresh_token?:string; expires_at:number; user:AuthUser }
type AuthResponse = { data:{user:AuthUser|null}; error:{message:string}|null }

function storedSession():Session|null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)??'null') as Session|null } catch { return null }
}
function saveSession(session:Session|null){ session?localStorage.setItem(SESSION_KEY,JSON.stringify(session)):localStorage.removeItem(SESSION_KEY) }
async function request(path:string, init:RequestInit={}, token?:string){
  if(!url||!anonKey)throw new Error('Supabase is not configured')
  return fetch(`${url}${path}`,{...init,headers:{apikey:anonKey,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{Authorization:`Bearer ${anonKey}`}),...init.headers}})
}
async function refreshSession(session:Session):Promise<Session|null>{
  if(!session.refresh_token)return null
  const response=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:session.refresh_token})})
  if(!response.ok){saveSession(null);return null}
  const body=await response.json() as {access_token:string;refresh_token:string;expires_in:number;user:AuthUser}
  const next={access_token:body.access_token,refresh_token:body.refresh_token,expires_at:Date.now()+body.expires_in*1000,user:body.user};saveSession(next);return next
}
async function validSession(){const current=storedSession();if(!current)return null;return current.expires_at-Date.now()<60000?refreshSession(current):current}

export const isSupabaseConfigured=Boolean(url&&anonKey&&!url.includes('your-project'))
export const supabase = isSupabaseConfigured ? {
  auth:{
    async signInWithPassword(credentials:{email:string;password:string}){
      try{const response=await request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify(credentials)});const body=await response.json() as {access_token?:string;refresh_token?:string;expires_in?:number;user?:AuthUser;msg?:string;error_description?:string};if(!response.ok||!body.access_token||!body.user)return{data:{user:null},error:{message:body.msg??body.error_description??'Sign-in failed'}} as AuthResponse;saveSession({access_token:body.access_token,refresh_token:body.refresh_token,expires_at:Date.now()+(body.expires_in??3600)*1000,user:body.user});return{data:{user:body.user},error:null} as AuthResponse}catch{return{data:{user:null},error:{message:'Unable to reach the authentication service.'}} as AuthResponse}
    },
    async getUser():Promise<AuthResponse>{
      try{const session=await validSession();if(!session)return{data:{user:null},error:null};const response=await request('/auth/v1/user',{},session.access_token);if(!response.ok){saveSession(null);return{data:{user:null},error:{message:'Session expired'}}}return{data:{user:await response.json() as AuthUser},error:null}}catch{return{data:{user:null},error:{message:'Unable to restore the session.'}}}
    },
    async signOut(){const session=storedSession();saveSession(null);if(session)await request('/auth/v1/logout',{method:'POST'},session.access_token).catch(()=>undefined)}
  }
} : null

export async function getProfileForUser(userId:string):Promise<Profile|null>{
  if(!isSupabaseConfigured)return null
  const session=await validSession();if(!session)throw new Error('Authentication session is unavailable.')
  const select='id,full_name,role,preferred_medium,class_name,institution_memberships(institution_id,role,institutions(name))'
  const response=await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=${encodeURIComponent(select)}`,{headers:{Accept:'application/vnd.pgrst.object+json'}},session.access_token)
  if(response.status===406)return null
  if(!response.ok)throw new Error('The school profile service is temporarily unavailable.')
  const row=await response.json() as {id:string;full_name:string;role:Role;preferred_medium:'kannada'|'english';class_name?:string;institution_memberships?:Array<{role:Role;institutions?:{name?:string}|null}>}
  const membership=row.institution_memberships?.[0]
  return{id:row.id,fullName:row.full_name,role:membership?.role??row.role,institutionName:membership?.institutions?.name??'VidyaSetu Platform',className:row.class_name,medium:row.preferred_medium}
}
