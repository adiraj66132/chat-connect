-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_index INTEGER NOT NULL DEFAULT 0,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_one UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_two UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_conversation UNIQUE (participant_one, participant_two)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice')),
  media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT 
  USING (
    participant_one IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    participant_two IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT 
  WITH CHECK (
    participant_one IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    participant_two IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Messages policies
CREATE POLICY "Users can view messages in own conversations" ON public.messages FOR SELECT 
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE participant_one IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR participant_two IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT 
  WITH CHECK (
    sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE 
  USING (sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, avatar_index)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)), floor(random() * 12)::int);
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update online status
CREATE OR REPLACE FUNCTION public.update_online_status(p_user_id UUID, p_is_online BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET is_online = p_is_online, last_seen = now() 
  WHERE user_id = p_user_id;
END;
$$;