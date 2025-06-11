"use client";
import React from "react";

interface StepperProps {
  steps: string[];
  currentStep: number; // 1-based
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center mb-8">
      {steps.map((label, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isDone   = step < currentStep;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full 
                  ${isDone ? "bg-brand text-white" 
                          : isActive ? "bg-brand text-white" 
                                     : "bg-gray-200 text-gray-600"}`}
              >
                {step}
              </div>
              <span className={`mt-2 text-sm ${isActive ? "text-brand font-medium" : "text-gray-500"}`}>
                {label}
              </span>
            </div>
            {step < steps.length && (
              <div className={`${isDone ? "bg-brand" : "bg-gray-200"} flex-1 h-0.5 mx-2`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
