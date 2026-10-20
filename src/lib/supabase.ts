import type { Profile, Role } from '../types'

const url = (import.meta.env.VITE_SUPABASE_URL || 'https://kuyrvncypnfzerzpiqmq.supabase.co').replace(/\/$/, '')
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

export const isSupabaseConfigured=Boolean(url.startsWith('https://')&&url.endsWith('.supabase.co')&&anonKey&&anonKey!=='your-publishable-anon-key')
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
  const response=await request('/rest/v1/rpc/get_current_user_context',{method:'POST',body:'{}'},session.access_token)
  if(response.status===403)return null
  if(response.status===404)throw new Error('Supabase database migrations are not applied yet.')
  if(!response.ok)throw new Error('The school profile service is temporarily unavailable.')
  const row=await response.json() as {id:string;full_name:string;role:Role;preferred_medium:'kannada'|'english';class_name?:string;institution_name:string}
  if(row.id!==userId)throw new Error('Authenticated profile mismatch.')
  return{id:row.id,fullName:row.full_name,role:row.role,institutionName:row.institution_name,className:row.class_name,medium:row.preferred_medium}
}

export async function updatePreferredMedium(medium:'english'|'kannada'):Promise<boolean>{
 try{
  if(!isSupabaseConfigured)return false
  const session=await validSession();if(!session)return false
  const response=await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({preferred_medium:medium})},session.access_token)
  return response.ok
 }catch{return false}
}

export async function requestPasswordReset(email:string):Promise<{ok:boolean;message:string}>{
 if(!isSupabaseConfigured)return{ok:false,message:'Supabase is not configured yet.'}
 try{
  const redirectTo=window.location.href.split('#')[0]
  const response=await request('/auth/v1/recover',{method:'POST',body:JSON.stringify({email,redirect_to:redirectTo})})
  if(response.ok)return{ok:true,message:'If this email is registered, a recovery link has been sent.'}
  return{ok:false,message:'Password recovery is temporarily unavailable.'}
 }catch{return{ok:false,message:'Unable to reach the authentication service.'}}
}

function recoveryAccessToken(){
 try{const params=new URLSearchParams(window.location.hash.replace(/^#/,''));return params.get('type')==='recovery'?params.get('access_token'):null}catch{return null}
}
export function hasRecoveryToken(){return Boolean(recoveryAccessToken())}
export async function completePasswordRecovery(password:string):Promise<{ok:boolean;message:string}>{
 const token=recoveryAccessToken()
 if(!isSupabaseConfigured||!token)return{ok:false,message:'This recovery link is missing, expired or invalid.'}
 try{
  const response=await request('/auth/v1/user',{method:'PUT',body:JSON.stringify({password})},token)
  if(!response.ok)return{ok:false,message:'The recovery link expired. Request a new one.'}
  window.history.replaceState({},document.title,window.location.pathname+window.location.search)
  saveSession(null)
  return{ok:true,message:'Password updated. You can now sign in.'}
 }catch{return{ok:false,message:'Unable to update the password right now.'}}
}
