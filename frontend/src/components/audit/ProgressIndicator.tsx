import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export function ProgressIndicator({ currentStep, totalSteps, labels }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-6">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isComplete = stepNum < currentStep;
        const isPending = stepNum > currentStep;

        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 font-semibold text-sm transition-all duration-300",
                  isActive && "border-accent bg-accent text-accent-foreground shadow-md shadow-accent/30",
                  isComplete && "border-accent bg-accent/15 text-accent",
                  isPending && "border-muted-foreground/25 text-muted-foreground/50 bg-transparent"
                )}
              >
                {isComplete ? <Check className="w-5 h-5" strokeWidth={2.5} /> : stepNum}
              </div>
              <span
                className={cn(
                  "mt-2 text-[10px] sm:text-xs font-medium hidden sm:block transition-colors",
                  isActive && "text-foreground",
                  isComplete && "text-muted-foreground",
                  isPending && "text-muted-foreground/50"
                )}
              >
                {labels[i]}
              </span>
            </div>
            {i < totalSteps - 1 && (
              <div
                className={cn(
                  "w-6 sm:w-12 h-0.5 mx-1 sm:mx-2 rounded-full transition-colors duration-300",
                  stepNum < currentStep ? "bg-accent" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
