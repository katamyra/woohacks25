'use client';

export default function StepsProgress({ steps, currentPath }) {
  return (
    <ul className="steps steps-info flex-1">
      {steps.map((step, index) => {
        const isActive = currentPath === step.path;
        const currentStepIndex = steps.findIndex(s => s.path === currentPath);
        const isCompleted = currentStepIndex > index;

        return (
          <li
            key={step.name}
            className={`step ${isActive ? 'step-info' : ''} ${isCompleted ? 'step-info' : ''}`}
            data-content={isCompleted ? '✓' : ''}
          >
            {step.name}
          </li>
        );
      })}
    </ul>
  );
} 