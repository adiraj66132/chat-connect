import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Play, Pause } from 'lucide-react';
import { useState, useRef } from 'react';

interface MessageBubbleProps {
  content: string | null;
  messageType: 'text' | 'image' | 'voice';
  mediaUrl: string | null;
  isSent: boolean;
  timestamp: string;
}

export function MessageBubble({ content, messageType, mediaUrl, isSent, timestamp }: MessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className={cn(
      'flex mb-3',
      isSent ? 'justify-end animate-slide-in-right' : 'justify-start animate-slide-in-left'
    )}>
      <div className={cn(
        'max-w-[70%] px-4 py-2',
        isSent ? 'message-bubble-sent' : 'message-bubble-received'
      )}>
        {messageType === 'text' && (
          <p className="text-sm leading-relaxed break-words">{content}</p>
        )}
        
        {messageType === 'image' && mediaUrl && (
          <img 
            src={mediaUrl} 
            alt="Shared image"
            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(mediaUrl, '_blank')}
          />
        )}
        
        {messageType === 'voice' && mediaUrl && (
          <div className="flex items-center gap-3">
            <button
              onClick={toggleAudio}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                isSent ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30' : 'bg-primary/20 hover:bg-primary/30'
              )}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className="h-1 bg-current/20 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', isSent ? 'bg-primary-foreground/50' : 'bg-primary/50')} style={{ width: '60%' }} />
              </div>
            </div>
            <audio ref={audioRef} src={mediaUrl} onEnded={handleAudioEnded} />
          </div>
        )}
        
        <p className={cn(
          'text-[10px] mt-1',
          isSent ? 'text-primary-foreground/60' : 'text-muted-foreground'
        )}>
          {format(new Date(timestamp), 'HH:mm')}
        </p>
      </div>
    </div>
  );
}
