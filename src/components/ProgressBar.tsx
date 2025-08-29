interface ProgressBarProps {
  current: number;
  max: number;
  className?: string;
}

export function ProgressBar({ current, max, className = '' }: ProgressBarProps) {
  const percentage = Math.min((current / max) * 100, 100);
  
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div 
        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}