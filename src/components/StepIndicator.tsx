import { STEPS, STEP_LABELS, Step } from "@/lib/types";

interface StepIndicatorProps {
  currentStep: string;
  completedSteps: string[];
}

export function StepIndicator({
  currentStep,
  completedSteps,
}: StepIndicatorProps) {
  const currentIdx = STEPS.indexOf(currentStep as Step);

  return (
    <nav className="flex items-center gap-1">
      {STEPS.map((step, idx) => {
        const isCompleted = completedSteps.includes(step);
        const isCurrent = step === currentStep;
        const isPast = idx < currentIdx;

        return (
          <div key={step} className="flex items-center">
            {idx > 0 && (
              <div
                className={`mx-1 h-px w-6 ${
                  isPast || isCompleted ? "bg-accent" : "bg-border"
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  isCurrent
                    ? "bg-accent text-accent-foreground"
                    : isCompleted || isPast
                      ? "bg-accent/20 text-accent"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? "✓" : idx + 1}
              </div>
              <span
                className={`text-[10px] leading-tight ${
                  isCurrent
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
