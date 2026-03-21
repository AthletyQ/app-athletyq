import * as React from "react"
import { ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * A simple, clean Breadcrumb component for tracking multi-step processes.
 */
export function Breadcrumb({ 
  steps, 
  currentStep,
  className 
}: { 
  steps: string[], 
  currentStep: number,
  className?: string 
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-2 text-sm", className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStep
        const isPast = index < currentStep

        return (
          <React.Fragment key={step}>
            <div className="flex items-center gap-2">
              {/* Step Number Circle */}
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors",
                isActive ? "bg-blue-600 border-blue-600 text-white" : 
                isPast ? "bg-blue-100 border-blue-100 text-blue-600" : 
                "bg-white border-gray-200 text-gray-400"
              )}>
                {index + 1}
              </div>
              
              {/* Step Label */}
              <span className={cn(
                "font-medium transition-colors",
                isActive ? "text-gray-900" : "text-gray-400"
              )}>
                {step}
              </span>
            </div>

            {/* Separator icon (don't show after last step) */}
            {index < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 text-gray-300" />
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
