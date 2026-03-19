import { Suspense } from 'react'
import CoachChatsPage from './CoachChatsClient'

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CoachChatsPage />
    </Suspense>
  )
}
