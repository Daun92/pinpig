import { useEffect, useState } from 'react';
import { Coins, Utensils, Check, type LucideIcon } from 'lucide-react';

interface AddFlowIllustrationProps {
  className?: string;
}

interface Step {
  label: string;
  icon: LucideIcon;
  sublabel: string;
}

export function AddFlowIllustration({ className = '' }: AddFlowIllustrationProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  const steps: Step[] = [
    { label: '금액', icon: Coins, sublabel: '15,000원' },
    { label: '카테고리', icon: Utensils, sublabel: '식비' },
    { label: '저장', icon: Check, sublabel: '완료!' },
  ];

  return (
    <div className={`relative ${className}`}>
      {/* 3 Step Flow */}
      <div className="flex items-center justify-center gap-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-16 h-16 rounded-full flex items-center justify-center
                  transition-all duration-500 ease-out
                  ${activeStep === index || activeStep > index
                    ? 'bg-ink-black text-paper-white scale-110'
                    : 'bg-paper-light text-ink-mid'
                  }
                  ${activeStep === index ? 'ring-4 ring-ink-black/20' : ''}
                `}
              >
                {activeStep > index ? (
                  <Check className="w-6 h-6" strokeWidth={2} />
                ) : (
                  <step.icon className="w-6 h-6" strokeWidth={1.5} />
                )}
              </div>
              <div className="mt-2 text-center">
                <div
                  className={`text-sub font-medium transition-colors duration-300 ${
                    activeStep >= index ? 'text-ink-black' : 'text-ink-light'
                  }`}
                >
                  {step.label}
                </div>
                <div
                  className={`text-caption transition-all duration-300 ${
                    activeStep === index
                      ? 'text-ink-mid opacity-100'
                      : 'text-ink-light opacity-50'
                  }`}
                >
                  {step.sublabel}
                </div>
              </div>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="relative w-8 h-0.5 mx-2 mt-[-24px]">
                <div className="absolute inset-0 bg-paper-mid rounded-full" />
                <div
                  className="absolute inset-y-0 left-0 bg-ink-black rounded-full transition-all duration-500"
                  style={{
                    width: activeStep > index ? '100%' : '0%',
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Touch indicator */}
      <div className="mt-6 flex justify-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-paper-light rounded-full">
          <div className="w-2 h-2 bg-ink-black rounded-full animate-pulse-subtle" />
          <span className="text-caption text-ink-mid">3번 터치면 끝</span>
        </div>
      </div>
    </div>
  );
}
