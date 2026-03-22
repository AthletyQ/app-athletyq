import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import AthleteChatPageClient from './AthleteChatPageClient'

export default function ChatsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      }
    >
      <AthleteChatPageClient />
    </Suspense>
  )
}
