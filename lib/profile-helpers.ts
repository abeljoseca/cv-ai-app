 export function calculateProfession(profileData: any): string | null {
  const userProfession = profileData?.profession
  if (userProfession) return userProfession
  
  const degree = profileData?.educacion?.[0]?.titulo || null
  const currentJob = profileData?.experiencia?.[0]?.cargo || null
  
  if (!degree && !currentJob) return ''
  if (degree && !currentJob) return degree
  if (!degree && currentJob) return currentJob
  
  const areSimilar = 
    degree.toLowerCase().includes(currentJob.toLowerCase()) ||
    currentJob.toLowerCase().includes(degree.toLowerCase())
  
  return areSimilar ? degree : `${degree} · ${currentJob}`
}
