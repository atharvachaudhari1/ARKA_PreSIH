export function calculateSkillMatchScore(unfilledSlotSkills: string[], applicantSkills: string[]): number {
  if (unfilledSlotSkills.length === 0 || applicantSkills.length === 0) return 0;
  
  const requiredSkillsLowercase = unfilledSlotSkills.map(s => s.toLowerCase());
  const matchedCount = requiredSkillsLowercase.filter(reqSkill => 
    applicantSkills.some(userSkill => 
      userSkill.toLowerCase() === reqSkill || 
      userSkill.toLowerCase().includes(reqSkill) || 
      reqSkill.includes(userSkill.toLowerCase())
    )
  ).length;
  
  return matchedCount / requiredSkillsLowercase.length;
}

export function isStrongMatch(unfilledSlotSkills: string[], applicantSkills: string[]): boolean {
  return calculateSkillMatchScore(unfilledSlotSkills, applicantSkills) >= 0.5;
}
