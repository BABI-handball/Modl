import { Logo } from './Logo';
import { cn } from '@/src/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  showLogo?: boolean;
  className?: string;
}

export const PageHeader = ({ title, description, showLogo = false, className }: PageHeaderProps) => {
  return (
    <div className={cn('mb-8', className)}>
      {showLogo && (
        <div className="mb-4 flex justify-center">
          <Logo size="md" showText={false} />
        </div>
      )}
      <h1 className="mb-2 text-4xl font-bold text-neutral-900 tracking-tight">{title}</h1>
      {description && (
        <p className="text-base text-neutral-600 font-medium">{description}</p>
      )}
    </div>
  );
};
