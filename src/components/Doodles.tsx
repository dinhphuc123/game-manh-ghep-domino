import React from 'react';

interface DoodleProps {
  className?: string;
  color?: string;
  size?: number;
}

export const PencilIcon: React.FC<DoodleProps> = ({ className = '', color = '#159BAD', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    <path d="m15 5 3 3" />
  </svg>
);

export const RulerIcon: React.FC<DoodleProps> = ({ className = '', color = '#94BF52', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 18H19C20.1 18 21 17.1 21 16V8C21 6.9 20.1 6 19 6H5C3.9 6 3 6.9 3 8V16C3 17.1 3.9 18 5 18Z" />
    <path d="M7 6V10" />
    <path d="M11 6V12" />
    <path d="M15 6V10" />
    <path d="M19 6V12" />
  </svg>
);

export const BookIcon: React.FC<DoodleProps> = ({ className = '', color = '#F54B32', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="M6 6h10" />
    <path d="M6 10h10" />
    <path d="M6 14h10" />
  </svg>
);

export const StarIcon: React.FC<DoodleProps> = ({ className = '', color = '#FFC928', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const GradCapIcon: React.FC<DoodleProps> = ({ className = '', color = '#2F2A40', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
);

export const LightbulbIcon: React.FC<DoodleProps> = ({ className = '', color = '#FFC928', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 14c.2-.2.4-.4.6-.7C16.8 11.7 17 10 15.8 8.3c-1.1-1.6-3.1-2.3-4.9-1.8-1.8.5-3.1 2-3.4 3.8-.3 1.8.4 3.5 1.8 4.6.4.3.7.6.9 1" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

export const CompassIcon: React.FC<DoodleProps> = ({ className = '', color = '#159BAD', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

export const AppleIcon: React.FC<DoodleProps> = ({ className = '', color = '#F54B32', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" />
    <path d="M12 6c.5-1 1.5-2 3-2" />
    <path d="M12 2v4" />
  </svg>
);

export const SparklesIcon: React.FC<DoodleProps> = ({ className = '', color = '#FFC928', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

export const SchoolBackgroundDoodles: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden">
      <PencilIcon className="absolute top-12 left-12 rotate-12" size={48} />
      <RulerIcon className="absolute top-1/4 right-8 -rotate-15" size={40} />
      <BookIcon className="absolute bottom-16 left-6 rotate-45" size={56} />
      <StarIcon className="absolute top-1/2 left-1/3 -rotate-10" size={32} />
      <GradCapIcon className="absolute top-10 right-1/4 rotate-6" size={50} />
      <LightbulbIcon className="absolute bottom-24 right-1/4 -rotate-12" size={44} />
      <CompassIcon className="absolute top-1/3 left-10 rotate-15" size={38} />
      <AppleIcon className="absolute bottom-40 right-10 rotate-45" size={40} />
      <SparklesIcon className="absolute top-[60%] right-[40%] animate-pulse" size={30} />
    </div>
  );
};
