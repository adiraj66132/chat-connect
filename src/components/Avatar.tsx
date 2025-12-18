import { getAvatar, getAvatarColor } from '@/lib/avatars';
import { cn } from '@/lib/utils';

interface AvatarProps {
  index: number;
  size?: 'sm' | 'md' | 'lg';
  isOnline?: boolean;
  showStatus?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-2xl',
};

export function Avatar({ index, size = 'md', isOnline, showStatus = false, className }: AvatarProps) {
  const emoji = getAvatar(index);
  const colorClass = getAvatarColor(index);

  return (
    <div className={cn('relative inline-flex', className)}>
      <div 
        className={cn(
          'rounded-full flex items-center justify-center bg-gradient-to-br shadow-soft',
          sizeClasses[size],
          colorClass
        )}
      >
        <span className="drop-shadow-sm">{emoji}</span>
      </div>
      {showStatus && (
        <span 
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-background',
            isOnline ? 'online-indicator' : 'offline-indicator'
          )}
        />
      )}
    </div>
  );
}
