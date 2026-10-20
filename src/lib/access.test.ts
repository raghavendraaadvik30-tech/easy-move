import { describe, expect, it } from 'vitest'
import { canManageInstitution, canManageLearningContent, roleLabel } from './access'
import { demoProfiles } from './demoData'

describe('role permissions', () => {
  it('keeps students away from institution management', () => {
    expect(canManageInstitution(demoProfiles.student)).toBe(false)
    expect(canManageLearningContent(demoProfiles.student)).toBe(false)
  })

  it('allows teachers to manage learning content but not tenant settings', () => {
    expect(canManageLearningContent(demoProfiles.teacher)).toBe(true)
    expect(canManageInstitution(demoProfiles.teacher)).toBe(false)
  })

  it('labels administrative roles explicitly', () => {
    expect(roleLabel.school_admin).toBe('School administrator')
    expect(roleLabel.platform_admin).toBe('Platform administrator')
  })
})
