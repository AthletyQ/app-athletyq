'use client'

import { useRouter } from 'next/navigation'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function PaymentCancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center">

        {/* Cancel icon */}
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-400" strokeWidth={1.5} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
        <p className="text-gray-500 text-sm mb-8">
          Your payment was not completed. Your session slots have not been confirmed.
          You can try again anytime.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.back()}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <button
            onClick={() => router.push('/athlete/dashboard')}
            className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 font-medium py-2 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}