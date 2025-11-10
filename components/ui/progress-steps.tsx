"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Step {
  id: number
  title: string
  description?: string
}

interface ProgressStepsProps {
  steps: Step[]
  currentStep: number
}

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative flex justify-between items-center">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-10">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep

          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              {/* Step Circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                  isCompleted &&
                    "bg-primary border-primary text-primary-foreground scale-110",
                  isCurrent &&
                    "bg-primary border-primary text-primary-foreground scale-110 ring-4 ring-primary/20",
                  !isCompleted &&
                    !isCurrent &&
                    "bg-background border-border text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{stepNumber}</span>
                )}
              </div>

              {/* Step Title */}
              <div className="text-center max-w-[120px]">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    (isCurrent || isCompleted) && "text-foreground",
                    !isCurrent && !isCompleted && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
