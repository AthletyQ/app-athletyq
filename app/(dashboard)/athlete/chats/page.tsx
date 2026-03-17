import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import AthleteChatPageClient from './AthleteChatPageClient'

// Next.js requires a Suspense boundary around any component
// that calls useSearchParams(), otherwise the page 404s.
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
