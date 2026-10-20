import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Profile, Role } from '../types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('your-project'))
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null

export async function getProfileForUser(userId: string): Promise<Profile | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, preferred_medium, class_name, institution_memberships(institution_id, role, institutions(name))')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  const row = data as {
    id: string
    full_name: string
    role: Role
    preferred_medium: 'kannada' | 'english'
    class_name?: string
    institution_memberships?: Array<{ role: Role; institutions?: { name?: string } | null }>
  }
  const membership = row.institution_memberships?.[0]
  return {
    id: row.id,
    fullName: row.full_name,
    role: membership?.role ?? row.role,
    institutionName: membership?.institutions?.name ?? 'VidyaSetu Platform',
    className: row.class_name,
    medium: row.preferred_medium
  }
}
