import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Avatar } from '@/components/Avatar';
import { AvatarPicker } from '@/components/AvatarPicker';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserSearch } from '@/components/UserSearch';
import { ConversationItem } from '@/components/ConversationItem';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageInput } from '@/components/MessageInput';
import { Button } from '@/components/ui/button';
import { LogOut, MessageCircle, Menu, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_index: number;
  is_online: boolean;
  last_seen: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: 'text' | 'image' | 'voice';
  media_url: string | null;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  created_at: string;
  updated_at: string;
  otherUser?: Profile;
  lastMessage?: Message;
}

export default function Chat() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      fetchConversations();
      subscribeToMessages();
    }
  }, [profile]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
    }
  }, [activeConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    if (!profile) return;

    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_one.eq.${profile.id},participant_two.eq.${profile.id}`)
      .order('updated_at', { ascending: false });

    if (convs) {
      const conversationsWithUsers = await Promise.all(
        convs.map(async (conv) => {
          const otherUserId = conv.participant_one === profile.id 
            ? conv.participant_two 
            : conv.participant_one;
          
          const { data: otherUser } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherUserId)
            .single();

          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            otherUser: otherUser as Profile,
            lastMessage: lastMsg as Message | undefined
          };
        })
      );

      setConversations(conversationsWithUsers);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data as Message[]);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new as Message;
          if (activeConversation && newMessage.conversation_id === activeConversation.id) {
            setMessages(prev => [...prev, newMessage]);
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSelectUser = async (selectedProfile: Profile) => {
    if (!profile) return;

    // Check if conversation exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(participant_one.eq.${profile.id},participant_two.eq.${selectedProfile.id}),and(participant_one.eq.${selectedProfile.id},participant_two.eq.${profile.id})`)
      .single();

    if (existing) {
      const conv = {
        ...existing,
        otherUser: selectedProfile
      };
      setActiveConversation(conv);
      return;
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        participant_one: profile.id,
        participant_two: selectedProfile.id
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to start conversation');
      return;
    }

    const conv = {
      ...newConv,
      otherUser: selectedProfile
    };
    setActiveConversation(conv);
    fetchConversations();
  };

  const sendMessage = async (content: string, type: 'text' | 'image' | 'voice' = 'text', mediaUrl?: string) => {
    if (!profile || !activeConversation) return;

    const { error } = await supabase.from('messages').insert({
      conversation_id: activeConversation.id,
      sender_id: profile.id,
      content: type === 'text' ? content : null,
      message_type: type,
      media_url: mediaUrl
    });

    if (error) {
      toast.error('Failed to send message');
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', activeConversation.id);
  };

  const handleSendImage = async (file: File) => {
    // Convert to base64 for simple storage (no external storage needed)
    const reader = new FileReader();
    reader.onload = () => {
      sendMessage('', 'image', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendVoice = async (blob: Blob) => {
    const reader = new FileReader();
    reader.onload = () => {
      sendMessage('', 'voice', reader.result as string);
    };
    reader.readAsDataURL(blob);
  };

  const handleAvatarChange = async (newIndex: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_index: newIndex })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to update avatar');
    } else {
      toast.success('Avatar updated!');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-soft">
          <MessageCircle className="w-12 h-12 text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        'flex flex-col border-r border-border bg-card transition-all duration-300',
        sidebarOpen ? 'w-80' : 'w-0 overflow-hidden',
        'md:w-80'
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold gradient-text">ChatWave</h1>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3 mb-4">
            <AvatarPicker currentIndex={profile.avatar_index} onSelect={handleAvatarChange}>
              <button className="relative group">
                <Avatar index={profile.avatar_index} size="lg" isOnline={true} showStatus />
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">
                  Edit
                </span>
              </button>
            </AvatarPicker>
            <div>
              <p className="font-semibold">{profile.username}</p>
              <p className="text-xs text-online">Online</p>
            </div>
          </div>

          {/* Search */}
          <UserSearch currentUserId={profile.user_id} onSelectUser={handleSelectUser} />
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
          {conversations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs">Search for users to start chatting</p>
            </div>
          ) : (
            conversations.map((conv) => conv.otherUser && (
              <ConversationItem
                key={conv.id}
                username={conv.otherUser.username}
                avatarIndex={conv.otherUser.avatar_index}
                isOnline={conv.otherUser.is_online}
                lastMessage={conv.lastMessage?.content || (conv.lastMessage?.message_type === 'image' ? '📷 Image' : conv.lastMessage?.message_type === 'voice' ? '🎤 Voice' : undefined)}
                lastMessageTime={conv.lastMessage?.created_at}
                isActive={activeConversation?.id === conv.id}
                onClick={() => setActiveConversation(conv)}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center gap-3 p-4 border-b border-border bg-card">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          {activeConversation?.otherUser && (
            <>
              <Avatar index={activeConversation.otherUser.avatar_index} size="sm" isOnline={activeConversation.otherUser.is_online} showStatus />
              <span className="font-medium">{activeConversation.otherUser.username}</span>
            </>
          )}
        </div>

        {activeConversation ? (
          <>
            {/* Desktop Header */}
            <div className="hidden md:flex items-center gap-3 p-4 border-b border-border bg-card">
              <Avatar 
                index={activeConversation.otherUser?.avatar_index || 0} 
                isOnline={activeConversation.otherUser?.is_online} 
                showStatus 
              />
              <div>
                <p className="font-semibold">{activeConversation.otherUser?.username}</p>
                <p className={cn('text-xs', activeConversation.otherUser?.is_online ? 'text-online' : 'text-muted-foreground')}>
                  {activeConversation.otherUser?.is_online ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  content={msg.content}
                  messageType={msg.message_type}
                  mediaUrl={msg.media_url}
                  isSent={msg.sender_id === profile.id}
                  timestamp={msg.created_at}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card">
              <MessageInput
                onSendMessage={(content) => sendMessage(content)}
                onSendImage={handleSendImage}
                onSendVoice={handleSendVoice}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground animate-fade-in">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Or search for users to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
