import { formatDateSeparator } from '@/src/lib/utils';
import { cn } from '@/src/lib/utils';

interface DateSeparatorProps {
  date: Date;
  className?: string;
}

export const DateSeparator = ({ date, className }: DateSeparatorProps) => {
  return (
    <div className={cn('relative my-6 flex items-center justify-center', className)}>
      <div className="absolute inset-x-0 h-px bg-gray-200" />
      <span className="relative z-10 bg-white px-3 text-xs text-gray-500">
        {formatDateSeparator(date)}
      </span>
    </div>
  );
};
