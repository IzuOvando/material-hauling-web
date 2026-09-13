import { Check, UserPlus, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepId, StepMeta } from "@/types";
import whiteLabelConfig from "../../../white-label.config";

const STEPS: StepMeta[] = [
  { id: 1, label: (whiteLabelConfig as any)?.ui?.users?.stepper?.userDetails || "Datos del usuario", icon: <UserPlus className="h-3.5 w-3.5" /> },
  { id: 2, label: (whiteLabelConfig as any)?.ui?.users?.stepper?.assignFrentes || "Asignar frentes", icon: <GitBranch className="h-3.5 w-3.5" /> },
  { id: 3, label: (whiteLabelConfig as any)?.ui?.users?.stepper?.confirmation || "Confirmación", icon: <Check className="h-3.5 w-3.5" /> },
];

export function Stepper({ currentStep }: { currentStep: StepId }) {
  return (
    <div className="flex items-center justify-center mb-5 select-none">
      {STEPS.map((step, idx) => {
        const isCompleted = currentStep > step.id;
        const isActive    = currentStep === step.id;

        return (
          <div key={step.id} className="flex items-center">

            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full border-2 transition-all duration-300 shrink-0",
                  isCompleted
                    ? "bg-secondary border-secondary text-white"
                    : isActive
                    ? "bg-primary border-primary text-accent"
                    : "bg-white border-primary/20 text-primary/30"
                )}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : step.icon}
              </div>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap transition-colors duration-300",
                  isActive    ? "text-primary"               : "",
                  isCompleted ? "text-secondary"             : "",
                  !isActive && !isCompleted ? "text-muted-foreground/40" : ""
                )}
              >
                {step.label}
              </span>
            </div>

            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-10 sm:w-16 mx-3 rounded-full transition-colors duration-300",
                  currentStep > step.id ? "bg-secondary" : "bg-primary/15"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
