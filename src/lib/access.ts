import type { Profile, Role } from '../types'

export const canManageInstitution = (profile: Profile) =>
  profile.role === 'school_admin' || profile.role === 'platform_admin'

export const canManageLearningContent = (profile: Profile) =>
  profile.role === 'teacher' || canManageInstitution(profile)

export const canViewInstitutionReports = (profile: Profile) =>
  profile.role !== 'student'

export const roleLabel: Record<Role, string> = {
  student: 'Student',
  teacher: 'Teacher',
  school_admin: 'School administrator',
  platform_admin: 'Platform administrator'
}
