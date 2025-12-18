import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar } from './Avatar';
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_index: number;
  is_online: boolean;
}

interface UserSearchProps {
  currentUserId: string;
  onSelectUser: (profile: Profile) => void;
}

export function UserSearch({ currentUserId, onSelectUser }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('user_id', currentUserId)
      .ilike('username', `%${searchQuery}%`)
      .limit(10);

    setResults((data as Profile[]) || []);
    setIsSearching(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full bg-secondary/50 border-none rounded-xl pl-10 pr-10 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-soft border border-border overflow-hidden z-50 animate-fade-in">
          {results.map((profile) => (
            <button
              key={profile.id}
              onClick={() => {
                onSelectUser(profile);
                handleClear();
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors"
            >
              <Avatar index={profile.avatar_index} size="sm" isOnline={profile.is_online} showStatus />
              <span className="text-sm font-medium">{profile.username}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
