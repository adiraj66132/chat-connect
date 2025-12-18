import { useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
}

export function ImageUpload({ onImageSelect, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
      e.target.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <ImagePlus className="w-5 h-5" />
      </button>
    </>
  );
}
