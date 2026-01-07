import { LucideIcon } from 'lucide-react';
import * as icons from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, className = '', strokeWidth = 1.5 }: IconProps) {
  const LucideIconComponent = icons[name as keyof typeof icons] as LucideIcon;

  if (!LucideIconComponent) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null;
  }

  return (
    <LucideIconComponent
      size={size}
      className={className}
      strokeWidth={strokeWidth}
    />
  );
}
