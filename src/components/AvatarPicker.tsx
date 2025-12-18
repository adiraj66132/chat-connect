import { avatars, getAvatarColor } from '@/lib/avatars';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar } from './Avatar';

interface AvatarPickerProps {
  currentIndex: number;
  onSelect: (index: number) => void;
  children: React.ReactNode;
}

export function AvatarPicker({ currentIndex, onSelect, children }: AvatarPickerProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md glass-card">
        <DialogHeader>
          <DialogTitle className="text-center">Choose your avatar</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-4 p-4">
          {avatars.map((emoji, index) => (
            <button
              key={index}
              onClick={() => onSelect(index)}
              className={cn(
                'p-2 rounded-xl transition-all hover:scale-110',
                currentIndex === index && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
              )}
            >
              <div 
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-gradient-to-br',
                  getAvatarColor(index)
                )}
              >
                {emoji}
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
