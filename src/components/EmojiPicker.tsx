import { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';
import EmojiPickerReact, { Theme } from 'emoji-picker-react';
import { useTheme } from '@/hooks/useTheme';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
      >
        <Smile className="w-5 h-5" />
      </button>
      
      {isOpen && (
        <div className="absolute bottom-12 right-0 z-50 animate-fade-in">
          <EmojiPickerReact
            theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
            onEmojiClick={(emojiData) => {
              onEmojiSelect(emojiData.emoji);
              setIsOpen(false);
            }}
            width={320}
            height={400}
          />
        </div>
      )}
    </div>
  );
}
