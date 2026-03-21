const BASE = '/api'

export async function getCoachProfile(userId: string) {
  try {
    const res  = await fetch(`${BASE}/coach/profile?userId=${userId}`)
    const data = await res.json()
    if (!res.ok) { console.error('getCoachProfile error:', data); return null }
    return data
  } catch (err) { console.error('getCoachProfile fetch failed:', err); return null }
}

export async function getDashboardStats(coachId: string) {
  try {
    const res  = await fetch(`${BASE}/dashboard/stats?coachId=${coachId}`)
    const data = await res.json()
    if (!res.ok) { console.error('getDashboardStats error:', data); return null }
    return data
  } catch (err) { console.error('getDashboardStats fetch failed:', err); return null }
}

export async function getDashboardSessions(coachId: string) {
  try {
    const res  = await fetch(`${BASE}/dashboard/sessions?coachId=${coachId}`)
    const data = await res.json()
    if (!res.ok) { console.error('getDashboardSessions error:', data); return [] }
    return Array.isArray(data) ? data : []
  } catch (err) { console.error('getDashboardSessions fetch failed:', err); return [] }
}

export async function getDashboardMessages(coachId: string) {
  try {
    const res  = await fetch(`${BASE}/dashboard/messages?coachId=${coachId}`)
    const data = await res.json()
    if (!res.ok) { console.error('getDashboardMessages error:', data); return [] }
    return Array.isArray(data) ? data : []
  } catch (err) { console.error('getDashboardMessages fetch failed:', err); return [] }
}

export async function getClients(coachId: string, status: 'active' | 'pending') {
  try {
    const res  = await fetch(`${BASE}/clients?coachId=${coachId}&status=${status}`)
    const data = await res.json()
    if (!res.ok) { console.error('getClients error:', data); return [] }
    return Array.isArray(data) ? data : []
  } catch (err) { console.error('getClients fetch failed:', err); return [] }
}

export async function updateClientStatus(clientId: string, action: 'accept' | 'decline') {
  try {
    const res  = await fetch(`${BASE}/clients/${clientId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    if (!res.ok) { console.error('updateClientStatus error:', data); return null }
    return data
  } catch (err) { console.error('updateClientStatus fetch failed:', err); return null }
}

export async function getBookedSessions(coachId: string) {
  try {
    const res  = await fetch(`${BASE}/sessions?coachId=${coachId}`)
    const data = await res.json()
    if (!res.ok) { console.error('getBookedSessions error:', data); return [] }
    return Array.isArray(data) ? data : []
  } catch (err) { console.error('getBookedSessions fetch failed:', err); return [] }
}

export async function updateSession(
  sessionId:       string,
  action:          'approve' | 'reschedule' | 'cancel',
  scheduledAt?:    string,
  previousStatus?: string
) {
  try {
    console.log('updateSession URL:', `${BASE}/sessions/${sessionId}`)
    console.log('updateSession body:', { action, scheduledAt, previousStatus })

    const res  = await fetch(`${BASE}/sessions/${sessionId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action, scheduledAt, previousStatus }),
    })

    console.log('updateSession status:', res.status)

    const text = await res.text()
    console.log('updateSession raw response:', text)

    const data = text ? JSON.parse(text) : {}
    if (!res.ok) { console.error('updateSession error:', data); return null }
    return data
  } catch (err) {
    console.error('updateSession fetch failed:', err)
    return null
  }
}

export async function getConversations(coachId: string) {
  try {
    const res  = await fetch(`${BASE}/messages/conversations?coachId=${coachId}`)
    const data = await res.json()
    if (!res.ok) { console.error('getConversations error:', data); return [] }
    return Array.isArray(data) ? data : []
  } catch (err) { console.error('getConversations fetch failed:', err); return [] }
}

export async function getMessages(conversationId: string, coachId: string) {
  try {
    const res  = await fetch(`${BASE}/messages/${conversationId}?coachId=${coachId}`)
    const data = await res.json()
    if (!res.ok) { console.error('getMessages error:', data); return { messages: [] } }
    return data
  } catch (err) { console.error('getMessages fetch failed:', err); return { messages: [] } }
}

export async function sendMessage(conversationId: string, text: string, senderId: string) {
  try {
    const res  = await fetch(`${BASE}/messages/${conversationId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, senderId }),
    })
    const data = await res.json()
    if (!res.ok) { console.error('sendMessage error:', data); return null }
    return data
  } catch (err) { console.error('sendMessage fetch failed:', err); return null }
}

export async function getCallRecords(coachId: string) {
  try {
    const res  = await fetch(`${BASE}/calls?coachId=${coachId}`)
    const data = await res.json()
    if (!res.ok) { console.error('getCallRecords error:', data); return [] }
    return Array.isArray(data) ? data : []
  } catch (err) { console.error('getCallRecords fetch failed:', err); return [] }
}

// Updated: now passes role: "coach" to the unified join route
export async function joinSession(sessionId: string) {
  try {
    const res = await fetch(`/api/sessions/${sessionId}/join`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ role: 'coach' }),
    })
    const data = await res.json()
    if (!res.ok) { console.error('joinSession error:', data); return null }
    return data
  } catch (err) {
    console.error('joinSession fetch failed:', err)
    return null
  }
}

export async function completeSession(
  sessionId:       string,
  coachId:         string,
  durationSeconds: number,
  requiredSeconds: number
) {
  try {
    const res  = await fetch(`/api/sessions/${sessionId}/complete`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ coachId, durationSeconds, requiredSeconds }),
    })
    const data = await res.json()
    if (!res.ok) { console.error('completeSession error:', data); return null }
    return data
  } catch (err) {
    console.error('completeSession fetch failed:', err)
    return null
  }
}

// ── Athlete functions ────────────────────────────────────────────────────────

export async function getAthleteSessions(athleteId: string) {
  try {
    const res  = await fetch(`${BASE}/sessions?athleteId=${athleteId}`)
    const data = await res.json()
    if (!res.ok) { console.error('getAthleteSessions error:', data); return [] }
    return Array.isArray(data) ? data : []
  } catch (err) { console.error('getAthleteSessions fetch failed:', err); return [] }
}

export async function joinSessionAsAthlete(sessionId: string) {
  try {
    const res = await fetch(`/api/sessions/${sessionId}/join`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ role: 'athlete' }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to join session')
    return data // { roomUrl, session }
  } catch (err) {
    console.error('joinSessionAsAthlete fetch failed:', err)
    throw err
  }
}

export async function joinSessionAsCoach(sessionId: string) {
  try {
    const res = await fetch(`/api/sessions/${sessionId}/join`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ role: 'coach' }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to join session')
    return data // { roomUrl, session }
  } catch (err) {
    console.error('joinSessionAsCoach fetch failed:', err)
    throw err
  }
}
