import type { Profile } from '../types'

export const demoProfiles: Record<Profile['role'], Profile> = {
  student: { id:'demo-student', fullName:'Ananya R.', role:'student', institutionName:'Government High School, Bengaluru', className:'10 A', medium:'english' },
  teacher: { id:'demo-teacher', fullName:'Meera Prakash', role:'teacher', institutionName:'Government High School, Bengaluru', medium:'english' },
  school_admin: { id:'demo-admin', fullName:'Ravi Kumar', role:'school_admin', institutionName:'Government High School, Bengaluru', medium:'english' },
  platform_admin: { id:'demo-platform', fullName:'VidyaSetu Admin', role:'platform_admin', institutionName:'VidyaSetu Platform', medium:'english' }
}
