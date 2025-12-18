import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';
import { format } from 'date-fns';

interface ConversationItemProps {
  username: string;
  avatarIndex: number;
  isOnline: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  isActive?: boolean;
  onClick: () => void;
}

export function ConversationItem({
  username,
  avatarIndex,
  isOnline,
  lastMessage,
  lastMessageTime,
  isActive,
  onClick
}: ConversationItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl transition-all',
        isActive 
          ? 'bg-accent' 
          : 'hover:bg-accent/50'
      )}
    >
      <Avatar index={avatarIndex} isOnline={isOnline} showStatus />
      
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{username}</span>
          {lastMessageTime && (
            <span className="text-xs text-muted-foreground shrink-0">
              {format(new Date(lastMessageTime), 'HH:mm')}
            </span>
          )}
        </div>
        {lastMessage && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {lastMessage}
          </p>
        )}
      </div>
    </button>
  );
}
