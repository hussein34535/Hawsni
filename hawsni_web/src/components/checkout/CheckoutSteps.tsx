'use client';

import { Check } from 'lucide-react';

interface Step {
  id: number;
  label: string;
  labelAr: string;
  icon: any;
}

export default function CheckoutSteps({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: Step[];
}) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {steps.map((step, idx) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;

        return (
          <div key={step.id} className="flex items-center gap-2">
            {/* Step Circle */}
            <div className="flex items-center gap-2">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${isCompleted 
                    ? 'bg-[#0E4435] text-white' 
                    : isActive 
                      ? 'bg-[#0E4435] text-white ring-4 ring-[#0E4435]/10' 
                      : 'bg-gray-100 text-gray-400'}
                `}
              >
                {isCompleted ? <Check size={14} strokeWidth={3} /> : step.id}
              </div>
              <span
                className={`
                  text-sm font-bold transition-colors hidden sm:inline
                  ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-400'}
                `}
              >
                {step.labelAr}
              </span>
            </div>

            {/* Connector */}
            {idx < steps.length - 1 && (
              <div
                className={`w-8 h-[2px] rounded-full transition-colors ${
                  currentStep > step.id ? 'bg-[#0E4435]' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

