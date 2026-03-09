const BASE = '/api'

export async function getCoachProfile(userId: string) {
  const res = await fetch(`${BASE}/coach/profile?userId=${userId}`)
  if (!res.ok) throw new Error('Failed to fetch coach profile')
  return res.json()
}

export async function getDashboardStats(coachId: string) {
  const res = await fetch(`${BASE}/dashboard/stats?coachId=${coachId}`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function getDashboardSessions(coachId: string) {
  const res = await fetch(`${BASE}/dashboard/sessions?coachId=${coachId}`)
  if (!res.ok) throw new Error('Failed to fetch sessions')
  return res.json()
}

export async function getDashboardMessages(coachId: string) {
  const res = await fetch(`${BASE}/dashboard/messages?coachId=${coachId}`)
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json()
}

export async function getClients(coachId: string, status: 'active' | 'pending') {
  const res = await fetch(`${BASE}/clients?coachId=${coachId}&status=${status}`)
  if (!res.ok) throw new Error('Failed to fetch clients')
  return res.json()
}

export async function updateClientStatus(clientId: string, action: 'accept' | 'decline') {
  const res = await fetch(`${BASE}/clients/${clientId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  })
  if (!res.ok) throw new Error('Failed to update client')
  return res.json()
}

export async function getBookedSessions(coachId: string) {
  const res = await fetch(`${BASE}/sessions?coachId=${coachId}`)
  if (!res.ok) throw new Error('Failed to fetch booked sessions')
  return res.json()
}

export async function getConversations(coachId: string) {
  const res = await fetch(`${BASE}/messages/conversations?coachId=${coachId}`)
  if (!res.ok) throw new Error('Failed to fetch conversations')
  return res.json()
}

export async function getMessages(conversationId: string) {
  const res = await fetch(`${BASE}/messages/${conversationId}`)
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json()
}

export async function sendMessage(conversationId: string, text: string, senderId: string) {
  const res = await fetch(`${BASE}/messages/${conversationId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, senderId }),
  })
  if (!res.ok) throw new Error('Failed to send message')
  return res.json()
}

export async function getCallRecords(coachId: string) {
  const res = await fetch(`${BASE}/calls?coachId=${coachId}`)
  if (!res.ok) throw new Error('Failed to fetch call records')
  return res.json()
}