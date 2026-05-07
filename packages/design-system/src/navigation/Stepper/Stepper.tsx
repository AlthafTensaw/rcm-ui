/**
 * Stepper — multi-step flow indicator.
 *
 * Used inside wizards (claim filing, appeal authoring, onboarding). Each
 * step shows a number / icon, label, and optional description. When a
 * step's `status` is omitted, the component auto-derives it from
 * `currentStep` (1-indexed):
 *
 *   index < currentStep → completed
 *   index = currentStep → active
 *   index > currentStep → pending
 *
 * Explicit `status: 'error'` overrides the auto rule for the failing step.
 */
import { type ReactNode } from 'react';
import { Check, X } from 'lucide-react';

import { cn } from '../../utils/cn';

export type StepStatus = 'pending' | 'active' | 'completed' | 'error';

export interface StepDefinition {
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  status?: StepStatus;
}

export interface StepperProps {
  /** 1-indexed. */
  currentStep: number;
  steps: StepDefinition[];
  variant?: 'default' | 'compact';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  'aria-label'?: string;
}

function deriveStatus(
  index: number,
  currentStep: number,
  explicit?: StepStatus,
): StepStatus {
  if (explicit) return explicit;
  const oneIndexed = index + 1;
  if (oneIndexed < currentStep) return 'completed';
  if (oneIndexed === currentStep) return 'active';
  return 'pending';
}

const CIRCLE_BASE =
  'inline-flex shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors';

const STATUS_CLASS: Record<StepStatus, string> = {
  pending: 'border-input bg-background text-muted-foreground',
  active: 'border-primary bg-primary text-primary-foreground',
  completed: 'border-primary bg-primary text-primary-foreground',
  error: 'border-destructive bg-destructive text-destructive-foreground',
};

const CONNECTOR_CLASS: Record<StepStatus, string> = {
  pending: 'bg-input',
  active: 'bg-input',
  completed: 'bg-primary',
  error: 'bg-input',
};

export function Stepper({
  currentStep,
  steps,
  variant = 'default',
  orientation = 'horizontal',
  className,
  'aria-label': ariaLabel = 'Progress',
}: StepperProps): JSX.Element {
  const isVertical = orientation === 'vertical';
  const isCompact = variant === 'compact';

  return (
    <ol
      role="list"
      aria-label={ariaLabel}
      className={cn(
        isVertical
          ? 'flex flex-col gap-3'
          : 'flex w-full items-start gap-2',
        className,
      )}
    >
      {steps.map((step, idx) => {
        const status = deriveStatus(idx, currentStep, step.status);
        const isLast = idx === steps.length - 1;
        const circle = (
          <span
            className={cn(CIRCLE_BASE, STATUS_CLASS[status], 'h-7 w-7')}
            aria-hidden="true"
          >
            {status === 'completed' ? (
              <Check className="h-4 w-4" />
            ) : status === 'error' ? (
              <X className="h-4 w-4" />
            ) : step.icon ? (
              step.icon
            ) : (
              idx + 1
            )}
          </span>
        );

        const labelBlock =
          isCompact && !isVertical ? null : (
            <div
              className={cn(
                'flex flex-col leading-tight',
                isVertical ? 'pt-0.5' : 'mt-2 items-center text-center',
              )}
            >
              <span
                className={cn(
                  'text-sm font-medium',
                  status === 'pending' && 'text-muted-foreground',
                  status === 'error' && 'text-destructive',
                )}
              >
                {step.label}
              </span>
              {step.description && (
                <span className="text-xs text-muted-foreground">
                  {step.description}
                </span>
              )}
            </div>
          );

        return (
          <li
            key={idx}
            className={cn(
              isVertical
                ? 'flex items-start gap-3'
                : 'flex flex-1 flex-col items-center min-w-0',
            )}
            aria-current={status === 'active' ? 'step' : undefined}
          >
            {isVertical ? (
              <>
                <div className="flex flex-col items-center gap-1">
                  {circle}
                  {!isLast && (
                    <span
                      className={cn('h-6 w-0.5', CONNECTOR_CLASS[status])}
                      aria-hidden="true"
                    />
                  )}
                </div>
                {labelBlock}
              </>
            ) : (
              <>
                <div className="flex w-full items-center">
                  <span className="flex-1" aria-hidden="true" />
                  {circle}
                  {!isLast && (
                    <span
                      className={cn(
                        'mx-2 h-0.5 flex-1',
                        CONNECTOR_CLASS[status],
                      )}
                      aria-hidden="true"
                    />
                  )}
                </div>
                {labelBlock}
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}
Stepper.displayName = 'Stepper';
