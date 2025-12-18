import { useState } from 'react';
import { Send } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { VoiceRecorder } from './VoiceRecorder';
import { ImageUpload } from './ImageUpload';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onSendImage: (file: File) => void;
  onSendVoice: (blob: Blob) => void;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, onSendImage, onSendVoice, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  return (
    <form onSubmit={handleSubmit} className="chat-input-container">
      <div className="flex items-center gap-2">
        <ImageUpload onImageSelect={onSendImage} disabled={disabled} />
        <VoiceRecorder onRecordingComplete={onSendVoice} disabled={disabled} />
        
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground px-2 py-2"
        />
        
        <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className={cn(
            'p-2 rounded-full transition-all',
            message.trim() && !disabled
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'text-muted-foreground opacity-50 cursor-not-allowed'
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
